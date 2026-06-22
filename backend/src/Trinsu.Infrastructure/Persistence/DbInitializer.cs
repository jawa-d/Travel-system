using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Domain.Constants;
using Trinsu.Domain.Entities;

namespace Trinsu.Infrastructure.Persistence;

public sealed class DbInitializer(TrinsuDbContext db, IPasswordHasher passwordHasher, IConfiguration configuration)
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await db.Database.MigrateAsync(cancellationToken);

        foreach (var roleName in SystemRoles.All)
            if (!await db.Roles.AnyAsync(x => x.Name == roleName, cancellationToken))
                db.Roles.Add(new Role { Name = roleName });
        foreach (var permissionName in Permissions.All)
            if (!await db.Permissions.AnyAsync(x => x.Name == permissionName, cancellationToken))
                db.Permissions.Add(new Permission { Name = permissionName });
        await db.SaveChangesAsync(cancellationToken);

        var superAdmin = await db.Roles.SingleAsync(x => x.Name == SystemRoles.SuperAdmin, cancellationToken);
        var admin = await db.Roles.SingleAsync(x => x.Name == SystemRoles.Admin, cancellationToken);
        var agent = await db.Roles.SingleAsync(x => x.Name == SystemRoles.Agent, cancellationToken);
        var permissions = await db.Permissions.ToListAsync(cancellationToken);
        await AssignAsync(superAdmin, permissions, cancellationToken);
        await AssignAsync(admin, permissions.Where(x => x.Name != Permissions.UsersManage), cancellationToken);
        await AssignAsync(agent, permissions.Where(x => x.Name is Permissions.CustomersManage or Permissions.PoliciesManage or Permissions.ClaimsManage or Permissions.EndorsementsManage or Permissions.CancellationsManage), cancellationToken);

        var lookups = new Dictionary<string, string[]>
        {
            ["ClaimType"] = ["MEDICAL", "BAGGAGE", "TRIP_DELAY", "CANCELLATION", "OTHER"],
            ["PolicyType"] = ["INDIVIDUAL", "FAMILY", "STUDENT", "BUSINESS", "MULTI_TRIP"],
            ["CoverageType"] = ["STANDARD"],
            ["CancellationReason"] = ["VISA_REJECTION", "TRIP_CANCELLATION", "CUSTOMER_REQUEST", "ISSUANCE_ERROR"],
            ["EndorsementType"] = ["EXTEND_TRAVEL_PERIOD", "CHANGE_DESTINATION", "UPDATE_CUSTOMER_INFORMATION", "INCREASE_COVERAGE_AMOUNT"]
        };
        foreach (var (category, names) in lookups)
            foreach (var name in names)
                if (!await db.LookupValues.AnyAsync(x => x.Category == category && x.Name == name, cancellationToken))
                    db.LookupValues.Add(new LookupValue { Category = category, Name = name });

        var email = configuration["BootstrapAdmin:Email"];
        var password = configuration["BootstrapAdmin:Password"];
        if (!string.IsNullOrWhiteSpace(email) && !string.IsNullOrWhiteSpace(password) && !await db.Users.AnyAsync(x => x.Email == email, cancellationToken))
            db.Users.Add(new User { FullName = configuration["BootstrapAdmin:FullName"] ?? "TRINSU Super Admin", Email = email.ToLowerInvariant(), PasswordHash = passwordHasher.Hash(password), RoleId = superAdmin.Id, IsActive = true });
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task AssignAsync(Role role, IEnumerable<Permission> permissions, CancellationToken ct)
    {
        foreach (var permission in permissions)
            if (!await db.RolePermissions.AnyAsync(x => x.RoleId == role.Id && x.PermissionId == permission.Id, ct))
                db.RolePermissions.Add(new RolePermission { RoleId = role.Id, PermissionId = permission.Id });
        await db.SaveChangesAsync(ct);
    }
}
