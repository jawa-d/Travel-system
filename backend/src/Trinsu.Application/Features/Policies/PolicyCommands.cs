using FluentValidation;
using MediatR;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;
using Trinsu.Domain.Entities;

namespace Trinsu.Application.Features.Policies;

public sealed record CreatePolicyCommand(CreatePolicyRequest Request) : IRequest<PolicyDto>;
public sealed record UpdatePolicyCommand(Guid Id, UpdatePolicyRequest Request) : IRequest<PolicyDto>;
public sealed record DeletePolicyCommand(Guid Id) : IRequest;

public sealed class CreatePolicyValidator : AbstractValidator<CreatePolicyCommand>
{
    public CreatePolicyValidator()
    {
        RuleFor(x => x.Request.CustomerId).NotEmpty();
        RuleFor(x => x.Request.TravelPlanId).NotEmpty();
        RuleFor(x => x.Request.Destination).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Request.EndDate).GreaterThan(x => x.Request.StartDate);
        RuleFor(x => x.Request.CoverageAmount).GreaterThan(0);
        RuleFor(x => x.Request.Premium).GreaterThanOrEqualTo(0);
    }
}

public sealed class PolicyCommandHandler(
    IRepository<Policy> policies,
    IRepository<Customer> customers,
    IRepository<TravelPlan> plans,
    ICurrentUser currentUser,
    IAuditService audit,
    IQrCodeService qr,
    IUnitOfWork unitOfWork)
    : IRequestHandler<CreatePolicyCommand, PolicyDto>,
      IRequestHandler<UpdatePolicyCommand, PolicyDto>,
      IRequestHandler<DeletePolicyCommand>
{
    public async Task<PolicyDto> Handle(CreatePolicyCommand command, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new ForbiddenException();
        var customer = await customers.GetByIdAsync(command.Request.CustomerId, cancellationToken) ?? throw new NotFoundException("Customer not found");
        var plan = await plans.GetByIdAsync(command.Request.TravelPlanId, cancellationToken) ?? throw new NotFoundException("Travel plan not found");
        var policyNumber = $"TRI-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}";
        var entity = new Policy
        {
            PolicyNumber = policyNumber,
            CustomerId = customer.Id,
            TravelPlanId = plan.Id,
            Destination = command.Request.Destination.Trim(),
            StartDate = command.Request.StartDate,
            EndDate = command.Request.EndDate,
            CoverageAmount = command.Request.CoverageAmount,
            Premium = command.Request.Premium,
            Status = command.Request.Status,
            IssuedByUserId = userId,
            IssuedByName = currentUser.Name,
            IssuedByRole = currentUser.Role,
            AgencyId = currentUser.AgencyId,
            QRCode = Convert.ToBase64String(qr.Generate(policyNumber))
        };
        await policies.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await audit.WriteAsync("POLICY_CREATED", nameof(Policy), entity.Id.ToString(), new { entity.PolicyNumber }, cancellationToken);
        return Map(entity, customer, plan);
    }

    public async Task<PolicyDto> Handle(UpdatePolicyCommand command, CancellationToken cancellationToken)
    {
        var entity = await policies.GetByIdAsync(command.Id, cancellationToken) ?? throw new NotFoundException("Policy not found");
        EnsureOwnership(entity);
        entity.Destination = command.Request.Destination.Trim();
        entity.StartDate = command.Request.StartDate;
        entity.EndDate = command.Request.EndDate;
        entity.CoverageAmount = command.Request.CoverageAmount;
        entity.Premium = command.Request.Premium;
        entity.Status = command.Request.Status;
        entity.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await audit.WriteAsync("POLICY_UPDATED", nameof(Policy), entity.Id.ToString(), command.Request, cancellationToken);
        var customer = await customers.GetByIdAsync(entity.CustomerId, cancellationToken) ?? throw new NotFoundException("Customer not found");
        var plan = await plans.GetByIdAsync(entity.TravelPlanId, cancellationToken) ?? throw new NotFoundException("Travel plan not found");
        return Map(entity, customer, plan);
    }

    public async Task Handle(DeletePolicyCommand command, CancellationToken cancellationToken)
    {
        var entity = await policies.GetByIdAsync(command.Id, cancellationToken) ?? throw new NotFoundException("Policy not found");
        if (!string.Equals(currentUser.Role, "SuperAdmin", StringComparison.OrdinalIgnoreCase)) throw new ForbiddenException();
        entity.SoftDelete = true;
        entity.DeletedAt = DateTime.UtcNow;
        entity.DeletedBy = currentUser.UserId;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        await audit.WriteAsync("POLICY_DELETED", nameof(Policy), entity.Id.ToString(), new { entity.PolicyNumber }, cancellationToken);
    }

    private void EnsureOwnership(Policy policy)
    {
        if (currentUser.IsAgent && policy.IssuedByUserId != currentUser.UserId) throw new ForbiddenException();
    }

    public static PolicyDto Map(Policy p, Customer c, TravelPlan t) =>
        new(p.Id, p.PolicyNumber, p.CustomerId, c.FullNameArabic, c.PassportNumber, p.TravelPlanId,
            t.NameArabic, p.Destination, p.StartDate, p.EndDate, p.CoverageAmount, p.Premium, p.Status,
            p.PdfUrl, p.QRCode, p.IssuedByUserId, p.IssuedByName, p.IssuedByRole, p.AgencyId, p.CreatedAt);
}
