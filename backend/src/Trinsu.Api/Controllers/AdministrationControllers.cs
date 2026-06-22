using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;
using Trinsu.Domain.Constants;
using Trinsu.Domain.Entities;

namespace Trinsu.Api.Controllers;

[ApiController, Route("api/users"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
public sealed class UsersController(IRepository<User> users, IRepository<Role> roles, IPasswordHasher hasher, IUnitOfWork uow, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<UserDto>> Get(CancellationToken ct) => await users.Query().Include(x => x.Role).OrderBy(x => x.FullName).Select(x => new UserDto(x.Id, x.FullName, x.Email, x.Phone, x.Role.Name, x.AgencyId, x.IsActive, x.LastLogin)).ToListAsync(ct);
    [HttpPost]
    public async Task<UserDto> Create(CreateUserRequest r, CancellationToken ct)
    {
        if (await users.AnyAsync(x => x.Email == r.Email.ToLower(), ct)) throw new ConflictException("Email already exists");
        var role = await roles.GetByIdAsync(r.RoleId, ct) ?? throw new NotFoundException("Role not found");
        var e = new User { FullName = r.FullName, Email = r.Email.ToLowerInvariant(), PasswordHash = hasher.Hash(r.Password), Phone = r.Phone, RoleId = role.Id, AgencyId = r.AgencyId, IsActive = r.IsActive };
        await users.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("USER_CREATED", nameof(User), e.Id.ToString(), null, ct);
        return new(e.Id, e.FullName, e.Email, e.Phone, role.Name, e.AgencyId, e.IsActive, e.LastLogin);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> Status(Guid id, [FromBody] bool isActive, CancellationToken ct)
    {
        var e = await users.GetByIdAsync(id, ct) ?? throw new NotFoundException("User not found");
        e.IsActive = isActive; await uow.SaveChangesAsync(ct); await audit.WriteAsync(isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED", nameof(User), id.ToString(), null, ct);
        return NoContent();
    }
}

[ApiController, Route("api/agencies"), Authorize]
public sealed class AgenciesController(IRepository<Agency> repo, IUnitOfWork uow, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<AgencyDto>> Get(CancellationToken ct) => await repo.Query().OrderBy(x => x.AgencyName).Select(x => new AgencyDto(x.Id, x.AgencyName, x.AgencyCode, x.Phone, x.Email, x.Address, x.Status, x.CreatedAt)).ToListAsync(ct);
    [HttpPost, Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<AgencyDto> Create(CreateAgencyRequest r, CancellationToken ct)
    {
        if (await repo.AnyAsync(x => x.AgencyCode == r.AgencyCode, ct)) throw new ConflictException("Agency code exists");
        var e = new Agency { AgencyName = r.AgencyName, AgencyCode = r.AgencyCode, Phone = r.Phone, Email = r.Email, Address = r.Address, Status = r.Status };
        await repo.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("AGENCY_CREATED", nameof(Agency), e.Id.ToString(), null, ct);
        return new(e.Id, e.AgencyName, e.AgencyCode, e.Phone, e.Email, e.Address, e.Status, e.CreatedAt);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<AgencyDto> Update(Guid id, CreateAgencyRequest r, CancellationToken ct)
    {
        var e = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Agency not found");
        e.AgencyName = r.AgencyName; e.AgencyCode = r.AgencyCode; e.Phone = r.Phone; e.Email = r.Email; e.Address = r.Address; e.Status = r.Status;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("AGENCY_UPDATED", nameof(Agency), id.ToString(), null, ct);
        return new(e.Id, e.AgencyName, e.AgencyCode, e.Phone, e.Email, e.Address, e.Status, e.CreatedAt);
    }
}

[ApiController, Route("api/lookups"), Authorize]
public sealed class LookupsController(IRepository<LookupValue> repo, IUnitOfWork uow, IAuditService audit) : ControllerBase
{
    [HttpGet] public async Task<IReadOnlyList<LookupValueDto>> Get([FromQuery] string? category, CancellationToken ct)
    {
        var q = repo.Query(); if (!string.IsNullOrWhiteSpace(category)) q = q.Where(x => x.Category == category);
        return await q.OrderBy(x => x.Category).ThenBy(x => x.Name).Select(x => new LookupValueDto(x.Id, x.Category, x.Name, x.IsActive, x.CreatedAt)).ToListAsync(ct);
    }
    [HttpPost, Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<LookupValueDto> Create(CreateLookupRequest r, CancellationToken ct)
    {
        if (await repo.AnyAsync(x => x.Category == r.Category && x.Name == r.Name, ct)) throw new ConflictException("Lookup value exists");
        var e = new LookupValue { Category = r.Category, Name = r.Name, IsActive = r.IsActive };
        await repo.AddAsync(e, ct); await uow.SaveChangesAsync(ct); await audit.WriteAsync("LOOKUP_CREATED", nameof(LookupValue), e.Id.ToString(), null, ct);
        return new(e.Id, e.Category, e.Name, e.IsActive, e.CreatedAt);
    }

    [HttpPut("{id:guid}"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
    public async Task<LookupValueDto> Update(Guid id, CreateLookupRequest r, CancellationToken ct)
    {
        var e = await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException("Lookup not found");
        e.Category = r.Category; e.Name = r.Name; e.IsActive = r.IsActive;
        await uow.SaveChangesAsync(ct); await audit.WriteAsync("LOOKUP_UPDATED", nameof(LookupValue), id.ToString(), null, ct);
        return new(e.Id, e.Category, e.Name, e.IsActive, e.CreatedAt);
    }
}

[ApiController, Route("api/roles"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
public sealed class RolesController(IRepository<Role> roles, IRepository<Permission> permissions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var items = await roles.Query().Include(x => x.RolePermissions).ThenInclude(x => x.Permission)
            .Select(x => new { x.Id, x.Name, x.Description, Permissions = x.RolePermissions.Select(p => p.Permission.Name) }).ToListAsync(ct);
        return Ok(items);
    }

    [HttpGet("permissions")]
    public async Task<IActionResult> Permissions(CancellationToken ct) => Ok(await permissions.Query().OrderBy(x => x.Name).Select(x => new { x.Id, x.Name, x.Description }).ToListAsync(ct));
}

[ApiController, Route("api/audit-logs"), Authorize(Roles = $"{SystemRoles.SuperAdmin},{SystemRoles.Admin}")]
public sealed class AuditLogsController(IRepository<AuditLog> repo) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<AuditLogDto>> Get([FromQuery] PagedRequest r, CancellationToken ct)
    {
        var q = repo.Query();
        if (!string.IsNullOrWhiteSpace(r.Search)) q = q.Where(x => x.UserName.Contains(r.Search) || x.Action.Contains(r.Search) || x.EntityName.Contains(r.Search));
        if (r.UserId.HasValue) q = q.Where(x => x.UserId == r.UserId);
        if (r.From.HasValue) q = q.Where(x => x.Timestamp >= r.From); if (r.To.HasValue) q = q.Where(x => x.Timestamp <= r.To);
        var total = await q.CountAsync(ct);
        var items = await q.OrderByDescending(x => x.Timestamp).Skip((r.SafePage - 1) * r.SafePageSize).Take(r.SafePageSize)
            .Select(x => new AuditLogDto(x.Id, x.UserId, x.UserName, x.Role, x.Action, x.EntityName, x.EntityId, x.IPAddress, x.Timestamp)).ToListAsync(ct);
        return new(items, total, r.SafePage, r.SafePageSize);
    }
}
