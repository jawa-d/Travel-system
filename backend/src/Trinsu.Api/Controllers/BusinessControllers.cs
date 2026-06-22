using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;
using Trinsu.Domain.Constants;
using Trinsu.Domain.Entities;

namespace Trinsu.Api.Controllers;

[ApiController, Route("api/customers"), Authorize]
public sealed class CustomersController(IRepository<Customer> repo, IUnitOfWork uow, ICurrentUser user, IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<CustomerDto>> Get([FromQuery] PagedRequest r, CancellationToken ct)
    {
        var q = repo.Query();
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.PassportNumber.Contains(r.Search) || x.FullNameArabic.Contains(r.Search) || x.FullNameEnglish.Contains(r.Search));
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.CreatedAt).Skip((r.SafePage - 1) * r.SafePageSize).Take(r.SafePageSize)
            .Select(x => new CustomerDto(x.Id, x.CustomerCode, x.FullNameArabic, x.FullNameEnglish, x.PassportNumber, x.Nationality, x.BirthDate, x.Gender, x.Phone, x.Email, x.Address, x.CreatedByUserId, x.CreatedAt)).ToListAsync(ct);
        return new(items, total, r.SafePage, r.SafePageSize);
    }

    [HttpPost]
    public async Task<CustomerDto> Create(CreateCustomerRequest r, CancellationToken ct)
    {
        if (await repo.AnyAsync(x => x.PassportNumber == r.PassportNumber.ToUpper(), ct)) throw new ConflictException("Passport already exists");
        var entity = new Customer { CustomerCode = $"CUS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}", FullNameArabic = r.FullNameArabic, FullNameEnglish = r.FullNameEnglish, PassportNumber = r.PassportNumber.ToUpper(), Nationality = r.Nationality, BirthDate = r.BirthDate, Gender = r.Gender, Phone = r.Phone, Email = r.Email, Address = r.Address, CreatedByUserId = user.UserId };
        await repo.AddAsync(entity, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("CUSTOMER_CREATED", nameof(Customer), entity.Id.ToString(), null, ct);
        return new(entity.Id, entity.CustomerCode, entity.FullNameArabic, entity.FullNameEnglish, entity.PassportNumber, entity.Nationality, entity.BirthDate, entity.Gender, entity.Phone, entity.Email, entity.Address, entity.CreatedByUserId, entity.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<CustomerDto> Update(Guid id, CreateCustomerRequest r, CancellationToken ct)
    {
        var e = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Customer not found");
        if (await repo.AnyAsync(x => x.Id != id && x.PassportNumber == r.PassportNumber.ToUpper(), ct)) throw new ConflictException("Passport already exists");
        e.FullNameArabic = r.FullNameArabic; e.FullNameEnglish = r.FullNameEnglish; e.PassportNumber = r.PassportNumber.ToUpper();
        e.Nationality = r.Nationality; e.BirthDate = r.BirthDate; e.Gender = r.Gender; e.Phone = r.Phone; e.Email = r.Email; e.Address = r.Address;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("CUSTOMER_UPDATED", nameof(Customer), e.Id.ToString(), null, ct);
        return new(e.Id, e.CustomerCode, e.FullNameArabic, e.FullNameEnglish, e.PassportNumber, e.Nationality, e.BirthDate, e.Gender, e.Phone, e.Email, e.Address, e.CreatedByUserId, e.CreatedAt);
    }
}

[ApiController, Route("api/travel-plans"), Authorize]
public sealed class TravelPlansController(IRepository<TravelPlan> repo, IUnitOfWork uow, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<TravelPlanDto>> Get(CancellationToken ct) => await repo.Query().OrderBy(x => x.NameEnglish).Select(x => new TravelPlanDto(x.Id, x.NameArabic, x.NameEnglish, x.CoverageAmount, x.Premium, x.Description, x.Status)).ToListAsync(ct);
    [HttpPost, Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<TravelPlanDto> Create(CreateTravelPlanRequest r, CancellationToken ct)
    {
        var e = new TravelPlan { NameArabic = r.NameArabic, NameEnglish = r.NameEnglish, CoverageAmount = r.CoverageAmount, Premium = r.Premium, Description = r.Description, Status = r.Status };
        await repo.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("TRAVEL_PLAN_CREATED", nameof(TravelPlan), e.Id.ToString(), null, ct);
        return new(e.Id, e.NameArabic, e.NameEnglish, e.CoverageAmount, e.Premium, e.Description, e.Status);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<TravelPlanDto> Update(Guid id, CreateTravelPlanRequest r, CancellationToken ct)
    {
        var e = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Travel plan not found");
        e.NameArabic = r.NameArabic; e.NameEnglish = r.NameEnglish; e.CoverageAmount = r.CoverageAmount; e.Premium = r.Premium; e.Description = r.Description; e.Status = r.Status;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("TRAVEL_PLAN_UPDATED", nameof(TravelPlan), e.Id.ToString(), null, ct);
        return new(e.Id, e.NameArabic, e.NameEnglish, e.CoverageAmount, e.Premium, e.Description, e.Status);
    }
}

[ApiController, Route("api/claims"), Authorize]
public sealed class ClaimsController(IRepository<Claim> claims, IRepository<Policy> policies, IUnitOfWork uow, ICurrentUser user, IAuditService audit, IFileStorageService files) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<ClaimDto>> Get([FromQuery] PagedRequest r, CancellationToken ct)
    {
        IQueryable<Claim> q = claims.Query().Include(x => x.Policy);
        if (user.IsAgent) q = q.Where(x => x.CreatedByUserId == user.UserId);
        if (!string.IsNullOrWhiteSpace(r.Status)) q = q.Where(x => x.Status == r.Status);
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.ClaimNumber.Contains(r.Search) || x.Policy.PolicyNumber.Contains(r.Search));
        if (r.From.HasValue) q = q.Where(x => x.CreatedAt >= r.From); if (r.To.HasValue) q = q.Where(x => x.CreatedAt <= r.To);
        var total = await q.CountAsync(ct);
        var list = await q.OrderByDescending(x => x.CreatedAt).Skip((r.SafePage - 1) * r.SafePageSize).Take(r.SafePageSize)
            .Select(x => new ClaimDto(x.Id, x.ClaimNumber, x.PolicyId, x.Policy.PolicyNumber, x.ClaimType, x.Description, x.Amount, x.Status, x.CreatedByUserId, x.CreatedAt)).ToListAsync(ct);
        return new(list, total, r.SafePage, r.SafePageSize);
    }

    [HttpPost]
    public async Task<ClaimDto> Create(CreateClaimRequest r, CancellationToken ct)
    {
        var policy = await policies.GetByIdAsync(r.PolicyId, ct) ?? throw new NotFoundException("Policy not found");
        if (user.IsAgent && policy.IssuedByUserId != user.UserId) throw new ForbiddenException();
        var e = new Claim { ClaimNumber = $"CLM-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}", PolicyId = policy.Id, ClaimType = r.ClaimType, Description = r.Description, Amount = r.Amount, Status = r.Status, CreatedByUserId = user.UserId };
        await claims.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("CLAIM_CREATED", nameof(Claim), e.Id.ToString(), new { e.ClaimNumber }, ct);
        return new(e.Id, e.ClaimNumber, e.PolicyId, policy.PolicyNumber, e.ClaimType, e.Description, e.Amount, e.Status, e.CreatedByUserId, e.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<ClaimDto> Update(Guid id, UpdateClaimRequest r, CancellationToken ct)
    {
        var e = await claims.Query(true).Include(x => x.Policy).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Claim not found");
        if (user.IsAgent && e.CreatedByUserId != user.UserId) throw new ForbiddenException();
        e.ClaimType = r.ClaimType; e.Description = r.Description; e.Amount = r.Amount; e.Status = r.Status;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("CLAIM_UPDATED", nameof(Claim), e.Id.ToString(), null, ct);
        return new(e.Id, e.ClaimNumber, e.PolicyId, e.Policy.PolicyNumber, e.ClaimType, e.Description, e.Amount, e.Status, e.CreatedByUserId, e.CreatedAt);
    }

    [HttpPost("{id:guid}/documents")]
    public async Task<IActionResult> Upload(Guid id, IFormFile file, [FromServices] IRepository<ClaimDocument> documents, CancellationToken ct)
    {
        var claim = await claims.Query().Include(x => x.Policy).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Claim not found");
        if (user.IsAgent && claim.CreatedByUserId != user.UserId) throw new ForbiddenException();
        if (file.Length <= 0 || file.Length > 10 * 1024 * 1024) return BadRequest("Invalid file size");
        var stored = await files.SaveAsync(file.OpenReadStream(), file.FileName, file.ContentType, ct);
        var document = new ClaimDocument { ClaimId = id, FileName = stored.FileName, FilePath = stored.Path };
        await documents.AddAsync(document, ct); await uow.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(Get), new { id = document.Id }, new { document.Id, document.FileName });
    }
}

[ApiController, Route("api/endorsements"), Authorize]
public sealed class EndorsementsController(IRepository<Endorsement> repo, IRepository<Policy> policies, IUnitOfWork uow, ICurrentUser user, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<EndorsementDto>> Get(CancellationToken ct)
    {
        IQueryable<Endorsement> q = repo.Query().Include(x => x.Policy); if (user.IsAgent) q = q.Where(x => x.CreatedByUserId == user.UserId);
        return await q.OrderByDescending(x => x.CreatedAt).Select(x => new EndorsementDto(x.Id, x.PolicyId, x.Policy.PolicyNumber, x.Type, x.OldValue, x.NewValue, x.Remarks, x.Status, x.CreatedByUserId, x.CreatedAt)).ToListAsync(ct);
    }
    [HttpPost]
    public async Task<EndorsementDto> Create(CreateEndorsementRequest r, CancellationToken ct)
    {
        var p = await policies.GetByIdAsync(r.PolicyId, ct) ?? throw new NotFoundException("Policy not found"); if (user.IsAgent && p.IssuedByUserId != user.UserId) throw new ForbiddenException();
        var e = new Endorsement { PolicyId = p.Id, Type = r.Type, OldValue = r.OldValue, NewValue = r.NewValue, Remarks = r.Remarks, Status = r.Status, CreatedByUserId = user.UserId };
        await repo.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("ENDORSEMENT_CREATED", nameof(Endorsement), e.Id.ToString(), null, ct);
        return new(e.Id, e.PolicyId, p.PolicyNumber, e.Type, e.OldValue, e.NewValue, e.Remarks, e.Status, e.CreatedByUserId, e.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<EndorsementDto> Update(Guid id, CreateEndorsementRequest r, CancellationToken ct)
    {
        var e = await repo.Query(true).Include(x => x.Policy).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Endorsement not found");
        if (user.IsAgent && e.CreatedByUserId != user.UserId) throw new ForbiddenException();
        e.Type = r.Type; e.OldValue = r.OldValue; e.NewValue = r.NewValue; e.Remarks = r.Remarks; e.Status = r.Status;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("ENDORSEMENT_UPDATED", nameof(Endorsement), e.Id.ToString(), null, ct);
        return new(e.Id, e.PolicyId, e.Policy.PolicyNumber, e.Type, e.OldValue, e.NewValue, e.Remarks, e.Status, e.CreatedByUserId, e.CreatedAt);
    }
}

[ApiController, Route("api/cancellations"), Authorize]
public sealed class CancellationsController(IRepository<PolicyCancellation> repo, IRepository<Policy> policies, IUnitOfWork uow, ICurrentUser user, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<CancellationDto>> Get(CancellationToken ct)
    {
        IQueryable<PolicyCancellation> q = repo.Query().Include(x => x.Policy); if (user.IsAgent) q = q.Where(x => x.CreatedByUserId == user.UserId);
        return await q.OrderByDescending(x => x.CreatedAt).Select(x => new CancellationDto(x.Id, x.PolicyId, x.Policy.PolicyNumber, x.Reason, x.RefundAmount, x.Status, x.CreatedByUserId, x.CreatedAt)).ToListAsync(ct);
    }
    [HttpPost]
    public async Task<CancellationDto> Create(CreateCancellationRequest r, CancellationToken ct)
    {
        var p = await policies.GetByIdAsync(r.PolicyId, ct) ?? throw new NotFoundException("Policy not found"); if (user.IsAgent && p.IssuedByUserId != user.UserId) throw new ForbiddenException();
        var e = new PolicyCancellation { PolicyId = p.Id, Reason = r.Reason, RefundAmount = r.RefundAmount, Status = r.Status, CreatedByUserId = user.UserId };
        await repo.AddAsync(e, ct); p.Status = "CANCELLED"; await uow.SaveChangesAsync(ct); await audit.WriteAsync("CANCELLATION_CREATED", nameof(PolicyCancellation), e.Id.ToString(), null, ct);
        return new(e.Id, e.PolicyId, p.PolicyNumber, e.Reason, e.RefundAmount, e.Status, e.CreatedByUserId, e.CreatedAt);
    }

    [HttpPut("{id:guid}")]
    public async Task<CancellationDto> Update(Guid id, CreateCancellationRequest r, CancellationToken ct)
    {
        var e = await repo.Query(true).Include(x => x.Policy).SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Cancellation not found");
        if (user.IsAgent && e.CreatedByUserId != user.UserId) throw new ForbiddenException();
        e.Reason = r.Reason; e.RefundAmount = r.RefundAmount; e.Status = r.Status;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("CANCELLATION_UPDATED", nameof(PolicyCancellation), e.Id.ToString(), null, ct);
        return new(e.Id, e.PolicyId, e.Policy.PolicyNumber, e.Reason, e.RefundAmount, e.Status, e.CreatedByUserId, e.CreatedAt);
    }
}
