using Microsoft.EntityFrameworkCore;
using Trinsu.Domain.Common;
using Trinsu.Domain.Entities;

namespace Trinsu.Infrastructure.Persistence;

public sealed class TrinsuDbContext(DbContextOptions<TrinsuDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<TravelPlan> TravelPlans => Set<TravelPlan>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<ClaimDocument> ClaimDocuments => Set<ClaimDocument>();
    public DbSet<Endorsement> Endorsements => Set<Endorsement>();
    public DbSet<PolicyCancellation> PolicyCancellations => Set<PolicyCancellation>();
    public DbSet<LookupValue> LookupValues => Set<LookupValue>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TrinsuDbContext).Assembly);
        modelBuilder.Entity<Policy>().HasQueryFilter(x => !x.SoftDelete);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = DateTime.UtcNow;
        return base.SaveChangesAsync(cancellationToken);
    }
}
