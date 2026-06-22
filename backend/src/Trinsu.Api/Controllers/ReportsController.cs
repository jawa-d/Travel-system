using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;
using Trinsu.Domain.Common;
using Trinsu.Domain.Entities;

namespace Trinsu.Api.Controllers;

[ApiController, Route("api/reports"), Authorize]
public sealed class ReportsController(
    IRepository<Policy> policies,
    IRepository<Customer> customers,
    IRepository<Claim> claims,
    IRepository<Endorsement> endorsements,
    IRepository<PolicyCancellation> cancellations,
    ICurrentUser user,
    IExcelService excel,
    IPdfService pdf,
    IAuditService audit) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<DashboardStatistics> Dashboard(CancellationToken ct)
    {
        var policyQuery = Scope(policies.Query());
        return new(
            await policyQuery.CountAsync(ct),
            await policyQuery.CountAsync(x => x.Status == "ACTIVE", ct),
            await customers.Query().CountAsync(ct),
            await Scope(claims.Query()).CountAsync(ct),
            await Scope(endorsements.Query()).CountAsync(ct),
            await Scope(cancellations.Query()).CountAsync(ct),
            await policyQuery.SumAsync(x => (decimal?)x.Premium, ct) ?? 0);
    }

    [HttpGet("{resource}")]
    public async Task<IActionResult> Export(string resource, [FromQuery] string format = "xlsx", [FromQuery] PagedRequest? request = null, CancellationToken ct = default)
    {
        request ??= new PagedRequest(PageSize: 200);
        var rows = await Rows(resource, request, ct);
        var isPdf = string.Equals(format, "pdf", StringComparison.OrdinalIgnoreCase);
        var bytes = isPdf ? pdf.CreateTable($"TRINSU {resource} report", rows) : excel.Create(resource, rows);
        await audit.WriteAsync("EXPORT_ACTION", resource, null, new { format, rows = rows.Count }, ct);
        return File(bytes, isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"{resource}-{DateTime.UtcNow:yyyyMMdd}.{(isPdf ? "pdf" : "xlsx")}");
    }

    private Task<IReadOnlyList<IDictionary<string, object?>>> Rows(string resource, PagedRequest request, CancellationToken ct) => resource.ToLowerInvariant() switch
    {
        "policies" => PolicyRows(request, ct),
        "customers" => CustomerRows(request, ct),
        "claims" => ClaimRows(request, ct),
        "endorsements" => EndorsementRows(request, ct),
        "cancellations" => CancellationRows(request, ct),
        _ => throw new NotFoundException("Unknown report resource")
    };

    private async Task<IReadOnlyList<IDictionary<string, object?>>> PolicyRows(PagedRequest r, CancellationToken ct)
    {
        var data = await Scope(Filter(policies.Query().Include(x => x.Customer), r)).OrderByDescending(x => x.CreatedAt).Take(r.SafePageSize)
            .Select(x => new { x.PolicyNumber, Customer = x.Customer.FullNameArabic, x.Customer.PassportNumber, x.Destination, x.StartDate, x.EndDate, x.CoverageAmount, x.Premium, x.Status, x.IssuedByName, x.CreatedAt }).ToListAsync(ct);
        return data.Select(x => Row(("PolicyNumber", x.PolicyNumber), ("Customer", x.Customer), ("Passport", x.PassportNumber), ("Destination", x.Destination), ("StartDate", x.StartDate), ("EndDate", x.EndDate), ("Coverage", x.CoverageAmount), ("Premium", x.Premium), ("Status", x.Status), ("IssuedBy", x.IssuedByName), ("CreatedAt", x.CreatedAt))).ToList();
    }

    private async Task<IReadOnlyList<IDictionary<string, object?>>> CustomerRows(PagedRequest r, CancellationToken ct)
    {
        var q = customers.Query();
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.PassportNumber.Contains(r.Search) || x.FullNameArabic.Contains(r.Search));
        var data = await q.OrderByDescending(x => x.CreatedAt).Take(r.SafePageSize).ToListAsync(ct);
        return data.Select(x => Row(("CustomerCode", x.CustomerCode), ("ArabicName", x.FullNameArabic), ("EnglishName", x.FullNameEnglish), ("Passport", x.PassportNumber), ("Phone", x.Phone), ("Email", x.Email), ("Nationality", x.Nationality), ("CreatedAt", x.CreatedAt))).ToList();
    }

    private async Task<IReadOnlyList<IDictionary<string, object?>>> ClaimRows(PagedRequest r, CancellationToken ct)
    {
        var q = Scope(claims.Query().Include(x => x.Policy));
        if (!string.IsNullOrWhiteSpace(r.Status)) q = q.Where(x => x.Status == r.Status);
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.ClaimNumber.Contains(r.Search) || x.Policy.PolicyNumber.Contains(r.Search));
        var data = await q.OrderByDescending(x => x.CreatedAt).Take(r.SafePageSize).ToListAsync(ct);
        return data.Select(x => Row(("ClaimNumber", x.ClaimNumber), ("PolicyNumber", x.Policy.PolicyNumber), ("Type", x.ClaimType), ("Amount", x.Amount), ("Status", x.Status), ("CreatedAt", x.CreatedAt))).ToList();
    }

    private async Task<IReadOnlyList<IDictionary<string, object?>>> EndorsementRows(PagedRequest r, CancellationToken ct)
    {
        var data = await Scope(endorsements.Query().Include(x => x.Policy)).OrderByDescending(x => x.CreatedAt).Take(r.SafePageSize).ToListAsync(ct);
        return data.Select(x => Row(("PolicyNumber", x.Policy.PolicyNumber), ("Type", x.Type), ("OldValue", x.OldValue), ("NewValue", x.NewValue), ("Status", x.Status), ("CreatedAt", x.CreatedAt))).ToList();
    }

    private async Task<IReadOnlyList<IDictionary<string, object?>>> CancellationRows(PagedRequest r, CancellationToken ct)
    {
        var data = await Scope(cancellations.Query().Include(x => x.Policy)).OrderByDescending(x => x.CreatedAt).Take(r.SafePageSize).ToListAsync(ct);
        return data.Select(x => Row(("PolicyNumber", x.Policy.PolicyNumber), ("Reason", x.Reason), ("RefundAmount", x.RefundAmount), ("Status", x.Status), ("CreatedAt", x.CreatedAt))).ToList();
    }

    private IQueryable<Policy> Scope(IQueryable<Policy> query) => user.IsAgent ? query.Where(x => x.IssuedByUserId == user.UserId) : query;
    private IQueryable<T> Scope<T>(IQueryable<T> query) where T : AuditableEntity => user.IsAgent ? query.Where(x => x.CreatedByUserId == user.UserId) : query;
    private static IQueryable<Policy> Filter(IQueryable<Policy> q, PagedRequest r)
    {
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.PolicyNumber.Contains(r.Search) || x.Customer.PassportNumber.Contains(r.Search));
        if (!string.IsNullOrWhiteSpace(r.Status)) q = q.Where(x => x.Status == r.Status);
        if (r.From.HasValue) q = q.Where(x => x.CreatedAt >= r.From);
        if (r.To.HasValue) q = q.Where(x => x.CreatedAt <= r.To);
        if (r.AgencyId.HasValue) q = q.Where(x => x.AgencyId == r.AgencyId);
        if (r.UserId.HasValue) q = q.Where(x => x.IssuedByUserId == r.UserId);
        return q;
    }

    private static Dictionary<string, object?> Row(params (string Key, object? Value)[] values) => values.ToDictionary(x => x.Key, x => x.Value);
}
