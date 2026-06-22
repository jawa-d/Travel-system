using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;
using Trinsu.Application.Features.Policies;
using Trinsu.Domain.Constants;
using Trinsu.Domain.Entities;

namespace Trinsu.Api.Controllers;

[ApiController, Route("api/policies"), Authorize]
public sealed class PoliciesController(
    IMediator mediator,
    IRepository<Policy> policies,
    ICurrentUser user,
    IPdfService pdf,
    IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<PolicyDto>> Get([FromQuery] PagedRequest request, CancellationToken ct)
    {
        IQueryable<Policy> query = policies.Query().Include(x => x.Customer).Include(x => x.TravelPlan);
        if (user.IsAgent) query = query.Where(x => x.IssuedByUserId == user.UserId);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(x => x.PolicyNumber.Contains(request.Search) || x.Customer.PassportNumber.Contains(request.Search) || x.Customer.FullNameArabic.Contains(request.Search));
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(x => x.Status == request.Status);
        if (request.From.HasValue) query = query.Where(x => x.CreatedAt >= request.From);
        if (request.To.HasValue) query = query.Where(x => x.CreatedAt <= request.To);
        if (request.AgencyId.HasValue) query = query.Where(x => x.AgencyId == request.AgencyId);
        if (request.UserId.HasValue) query = query.Where(x => x.IssuedByUserId == request.UserId);
        var total = await query.CountAsync(ct);
        var items = await query.OrderByDescending(x => x.CreatedAt).Skip((request.SafePage - 1) * request.SafePageSize).Take(request.SafePageSize)
            .Select(x => new PolicyDto(x.Id, x.PolicyNumber, x.CustomerId, x.Customer.FullNameArabic, x.Customer.PassportNumber,
                x.TravelPlanId, x.TravelPlan.NameArabic, x.Destination, x.StartDate, x.EndDate, x.CoverageAmount, x.Premium,
                x.Status, x.PdfUrl, x.QRCode, x.IssuedByUserId, x.IssuedByName, x.IssuedByRole, x.AgencyId, x.CreatedAt)).ToListAsync(ct);
        return new(items, total, request.SafePage, request.SafePageSize);
    }

    [HttpGet("{id:guid}")]
    public async Task<PolicyDto> GetById(Guid id, CancellationToken ct)
    {
        var entity = await policies.Query().Include(x => x.Customer).Include(x => x.TravelPlan).SingleOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("Policy not found");
        if (user.IsAgent && entity.IssuedByUserId != user.UserId) throw new ForbiddenException();
        return PolicyCommandHandler.Map(entity, entity.Customer, entity.TravelPlan);
    }

    [HttpPost]
    public Task<PolicyDto> Create(CreatePolicyRequest request, CancellationToken ct) => mediator.Send(new CreatePolicyCommand(request), ct);

    [HttpPut("{id:guid}")]
    public Task<PolicyDto> Update(Guid id, UpdatePolicyRequest request, CancellationToken ct) => mediator.Send(new UpdatePolicyCommand(id, request), ct);

    [HttpDelete("{id:guid}"), Authorize(Roles = SystemRoles.SuperAdmin)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await mediator.Send(new DeletePolicyCommand(id), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/pdf")]
    public async Task<IActionResult> Pdf(Guid id, CancellationToken ct)
    {
        var entity = await policies.Query().Include(x => x.Customer).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Policy not found");
        if (user.IsAgent && entity.IssuedByUserId != user.UserId) throw new ForbiddenException();
        var bytes = pdf.CreatePolicy(entity);
        await audit.WriteAsync("EXPORT_ACTION", nameof(Policy), id.ToString(), new { Format = "PDF" }, ct);
        return File(bytes, "application/pdf", $"{entity.PolicyNumber}.pdf");
    }
}
