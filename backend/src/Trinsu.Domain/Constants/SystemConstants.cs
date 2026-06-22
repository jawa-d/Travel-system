namespace Trinsu.Domain.Constants;

public static class SystemRoles
{
    public const string SuperAdmin = "SuperAdmin";
    public const string Admin = "Admin";
    public const string Agent = "Agent";
    public static readonly string[] All = [SuperAdmin, Admin, Agent];
}

public static class Permissions
{
    public const string UsersManage = "users.manage";
    public const string AgenciesManage = "agencies.manage";
    public const string CustomersManage = "customers.manage";
    public const string PoliciesManage = "policies.manage";
    public const string ClaimsManage = "claims.manage";
    public const string EndorsementsManage = "endorsements.manage";
    public const string CancellationsManage = "cancellations.manage";
    public const string LookupsManage = "lookups.manage";
    public const string ReportsRead = "reports.read";
    public const string AuditRead = "audit.read";
    public static readonly string[] All =
    [
        UsersManage, AgenciesManage, CustomersManage, PoliciesManage, ClaimsManage,
        EndorsementsManage, CancellationsManage, LookupsManage, ReportsRead, AuditRead
    ];
}
