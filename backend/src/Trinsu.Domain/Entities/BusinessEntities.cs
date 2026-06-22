using Trinsu.Domain.Common;

namespace Trinsu.Domain.Entities;

public sealed class Agency : BaseEntity
{
    public required string AgencyName { get; set; }
    public required string AgencyCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public ICollection<User> Users { get; set; } = [];
    public ICollection<Policy> Policies { get; set; } = [];
}

public sealed class Customer : AuditableEntity
{
    public required string CustomerCode { get; set; }
    public required string FullNameArabic { get; set; }
    public required string FullNameEnglish { get; set; }
    public required string PassportNumber { get; set; }
    public required string Nationality { get; set; }
    public DateOnly BirthDate { get; set; }
    public required string Gender { get; set; }
    public required string Phone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public ICollection<Policy> Policies { get; set; } = [];
}

public sealed class TravelPlan : BaseEntity
{
    public required string NameArabic { get; set; }
    public required string NameEnglish { get; set; }
    public decimal CoverageAmount { get; set; }
    public decimal Premium { get; set; }
    public string? Description { get; set; }
    public string Status { get; set; } = "ACTIVE";
    public ICollection<Policy> Policies { get; set; } = [];
}

public sealed class Policy : BaseEntity, ISoftDeletable
{
    public required string PolicyNumber { get; set; }
    public Guid CustomerId { get; set; }
    public Customer Customer { get; set; } = null!;
    public Guid TravelPlanId { get; set; }
    public TravelPlan TravelPlan { get; set; } = null!;
    public required string Destination { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public decimal CoverageAmount { get; set; }
    public decimal Premium { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? PdfUrl { get; set; }
    public string? QRCode { get; set; }
    public Guid IssuedByUserId { get; set; }
    public User IssuedByUser { get; set; } = null!;
    public required string IssuedByName { get; set; }
    public required string IssuedByRole { get; set; }
    public Guid? AgencyId { get; set; }
    public Agency? Agency { get; set; }
    public bool SoftDelete { get; set; }
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
    public ICollection<Claim> Claims { get; set; } = [];
    public ICollection<Endorsement> Endorsements { get; set; } = [];
    public ICollection<PolicyCancellation> Cancellations { get; set; } = [];
}

public sealed class Claim : AuditableEntity
{
    public required string ClaimNumber { get; set; }
    public Guid PolicyId { get; set; }
    public Policy Policy { get; set; } = null!;
    public required string ClaimType { get; set; }
    public required string Description { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "NEW";
    public ICollection<ClaimDocument> Documents { get; set; } = [];
}

public sealed class ClaimDocument : BaseEntity
{
    public Guid ClaimId { get; set; }
    public Claim Claim { get; set; } = null!;
    public required string FileName { get; set; }
    public required string FilePath { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public sealed class Endorsement : AuditableEntity
{
    public Guid PolicyId { get; set; }
    public Policy Policy { get; set; } = null!;
    public required string Type { get; set; }
    public string? OldValue { get; set; }
    public required string NewValue { get; set; }
    public string? Remarks { get; set; }
    public string Status { get; set; } = "DRAFT";
}

public sealed class PolicyCancellation : AuditableEntity
{
    public Guid PolicyId { get; set; }
    public Policy Policy { get; set; } = null!;
    public required string Reason { get; set; }
    public decimal RefundAmount { get; set; }
    public string Status { get; set; } = "CREATED";
}

public sealed class LookupValue : BaseEntity
{
    public required string Category { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class AuditLog : BaseEntity
{
    public Guid? UserId { get; set; }
    public required string UserName { get; set; }
    public required string Role { get; set; }
    public required string Action { get; set; }
    public required string EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? IPAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Data { get; set; }
}
