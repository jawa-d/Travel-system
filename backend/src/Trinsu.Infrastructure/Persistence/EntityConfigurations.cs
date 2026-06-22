using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Trinsu.Domain.Entities;

namespace Trinsu.Infrastructure.Persistence;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(500).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(30);
        b.HasOne(x => x.Role).WithMany(x => x.Users).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Agency).WithMany(x => x.Users).HasForeignKey(x => x.AgencyId).OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> b)
    {
        b.HasIndex(x => x.Name).IsUnique();
        b.Property(x => x.Name).HasMaxLength(80).IsRequired();
        b.HasMany(x => x.RolePermissions).WithOne(x => x.Role).HasForeignKey(x => x.RoleId);
    }
}

public sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> b)
    {
        b.HasIndex(x => x.Name).IsUnique();
        b.Property(x => x.Name).HasMaxLength(120).IsRequired();
        b.HasMany(x => x.RolePermissions).WithOne(x => x.Permission).HasForeignKey(x => x.PermissionId);
    }
}

public sealed class RolePermissionConfiguration : IEntityTypeConfiguration<RolePermission>
{
    public void Configure(EntityTypeBuilder<RolePermission> b) => b.HasKey(x => new { x.RoleId, x.PermissionId });
}

public sealed class AgencyConfiguration : IEntityTypeConfiguration<Agency>
{
    public void Configure(EntityTypeBuilder<Agency> b)
    {
        b.HasIndex(x => x.AgencyCode).IsUnique();
        b.Property(x => x.AgencyName).HasMaxLength(150).IsRequired();
        b.Property(x => x.AgencyCode).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasMaxLength(30).IsRequired();
    }
}

public sealed class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    public void Configure(EntityTypeBuilder<Customer> b)
    {
        b.HasIndex(x => x.CustomerCode).IsUnique();
        b.HasIndex(x => x.PassportNumber).IsUnique();
        b.Property(x => x.FullNameArabic).HasMaxLength(200).IsRequired();
        b.Property(x => x.FullNameEnglish).HasMaxLength(200).IsRequired();
        b.Property(x => x.PassportNumber).HasMaxLength(50).IsRequired();
        b.Property(x => x.Email).HasMaxLength(256);
        b.Property(x => x.Phone).HasMaxLength(30).IsRequired();
    }
}

public sealed class TravelPlanConfiguration : IEntityTypeConfiguration<TravelPlan>
{
    public void Configure(EntityTypeBuilder<TravelPlan> b)
    {
        b.Property(x => x.CoverageAmount).HasPrecision(18, 2);
        b.Property(x => x.Premium).HasPrecision(18, 2);
        b.HasIndex(x => new { x.NameArabic, x.NameEnglish });
    }
}

public sealed class PolicyConfiguration : IEntityTypeConfiguration<Policy>
{
    public void Configure(EntityTypeBuilder<Policy> b)
    {
        b.HasIndex(x => x.PolicyNumber).IsUnique();
        b.HasIndex(x => new { x.IssuedByUserId, x.Status });
        b.HasIndex(x => new { x.AgencyId, x.CreatedAt });
        b.Property(x => x.CoverageAmount).HasPrecision(18, 2);
        b.Property(x => x.Premium).HasPrecision(18, 2);
        b.Property(x => x.PolicyNumber).HasMaxLength(80).IsRequired();
        b.Property(x => x.Destination).HasMaxLength(200).IsRequired();
        b.HasOne(x => x.IssuedByUser).WithMany().HasForeignKey(x => x.IssuedByUserId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Agency).WithMany(x => x.Policies).HasForeignKey(x => x.AgencyId).OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class ClaimConfiguration : IEntityTypeConfiguration<Claim>
{
    public void Configure(EntityTypeBuilder<Claim> b)
    {
        b.HasIndex(x => x.ClaimNumber).IsUnique();
        b.HasIndex(x => new { x.CreatedByUserId, x.Status });
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.Property(x => x.Description).HasMaxLength(4000);
    }
}

public sealed class EndorsementConfiguration : IEntityTypeConfiguration<Endorsement>
{
    public void Configure(EntityTypeBuilder<Endorsement> b) => b.HasIndex(x => new { x.CreatedByUserId, x.Status });
}

public sealed class CancellationConfiguration : IEntityTypeConfiguration<PolicyCancellation>
{
    public void Configure(EntityTypeBuilder<PolicyCancellation> b)
    {
        b.HasIndex(x => new { x.CreatedByUserId, x.Status });
        b.Property(x => x.RefundAmount).HasPrecision(18, 2);
    }
}

public sealed class LookupConfiguration : IEntityTypeConfiguration<LookupValue>
{
    public void Configure(EntityTypeBuilder<LookupValue> b)
    {
        b.HasIndex(x => new { x.Category, x.Name }).IsUnique();
        b.Property(x => x.Category).HasMaxLength(100);
        b.Property(x => x.Name).HasMaxLength(200);
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.HasIndex(x => new { x.UserId, x.ExpiresAt });
        b.Property(x => x.TokenHash).HasMaxLength(128);
    }
}
