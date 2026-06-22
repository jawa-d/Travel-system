namespace Trinsu.Application.DTOs;

public sealed record UserDto(Guid Id, string FullName, string Email, string? Phone, string Role, Guid? AgencyId, bool IsActive, DateTime? LastLogin);
public sealed record AgencyDto(Guid Id, string AgencyName, string AgencyCode, string? Phone, string? Email, string? Address, string Status, DateTime CreatedAt);
public sealed record CustomerDto(Guid Id, string CustomerCode, string FullNameArabic, string FullNameEnglish, string PassportNumber, string Nationality, DateOnly BirthDate, string Gender, string Phone, string? Email, string? Address, Guid? CreatedByUserId, DateTime CreatedAt);
public sealed record TravelPlanDto(Guid Id, string NameArabic, string NameEnglish, decimal CoverageAmount, decimal Premium, string? Description, string Status);
public sealed record PolicyDto(Guid Id, string PolicyNumber, Guid CustomerId, string Customer, string PassportNumber, Guid TravelPlanId, string TravelPlan, string Destination, DateOnly StartDate, DateOnly EndDate, decimal CoverageAmount, decimal Premium, string Status, string? PdfUrl, string? QRCode, Guid IssuedByUserId, string IssuedByName, string IssuedByRole, Guid? AgencyId, DateTime CreatedAt);
public sealed record ClaimDto(Guid Id, string ClaimNumber, Guid PolicyId, string PolicyNumber, string ClaimType, string Description, decimal Amount, string Status, Guid? CreatedByUserId, DateTime CreatedAt);
public sealed record EndorsementDto(Guid Id, Guid PolicyId, string PolicyNumber, string Type, string? OldValue, string NewValue, string? Remarks, string Status, Guid? CreatedByUserId, DateTime CreatedAt);
public sealed record CancellationDto(Guid Id, Guid PolicyId, string PolicyNumber, string Reason, decimal RefundAmount, string Status, Guid? CreatedByUserId, DateTime CreatedAt);
public sealed record LookupValueDto(Guid Id, string Category, string Name, bool IsActive, DateTime CreatedAt);
public sealed record AuditLogDto(Guid Id, Guid? UserId, string UserName, string Role, string Action, string EntityName, string? EntityId, string? IPAddress, DateTime Timestamp);
public sealed record DashboardStatistics(int Policies, int ActivePolicies, int Customers, int Claims, int Endorsements, int Cancellations, decimal TotalPremium);

public sealed record CreateUserRequest(string FullName, string Email, string Password, string? Phone, Guid RoleId, Guid? AgencyId, bool IsActive = true);
public sealed record CreateAgencyRequest(string AgencyName, string AgencyCode, string? Phone, string? Email, string? Address, string Status = "ACTIVE");
public sealed record CreateCustomerRequest(string FullNameArabic, string FullNameEnglish, string PassportNumber, string Nationality, DateOnly BirthDate, string Gender, string Phone, string? Email, string? Address);
public sealed record CreateTravelPlanRequest(string NameArabic, string NameEnglish, decimal CoverageAmount, decimal Premium, string? Description, string Status = "ACTIVE");
public sealed record CreatePolicyRequest(Guid CustomerId, Guid TravelPlanId, string Destination, DateOnly StartDate, DateOnly EndDate, decimal CoverageAmount, decimal Premium, string Status = "DRAFT");
public sealed record UpdatePolicyRequest(string Destination, DateOnly StartDate, DateOnly EndDate, decimal CoverageAmount, decimal Premium, string Status);
public sealed record CreateClaimRequest(Guid PolicyId, string ClaimType, string Description, decimal Amount, string Status = "NEW");
public sealed record UpdateClaimRequest(string ClaimType, string Description, decimal Amount, string Status);
public sealed record CreateEndorsementRequest(Guid PolicyId, string Type, string? OldValue, string NewValue, string? Remarks, string Status = "DRAFT");
public sealed record CreateCancellationRequest(Guid PolicyId, string Reason, decimal RefundAmount, string Status = "CREATED");
public sealed record CreateLookupRequest(string Category, string Name, bool IsActive = true);
