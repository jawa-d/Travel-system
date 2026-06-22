using System.Security.Claims;
using Trinsu.Application.Common.Interfaces;

namespace Trinsu.Api.Services;

public sealed class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => accessor.HttpContext?.User;
    public Guid? UserId => Guid.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier) ?? Principal?.FindFirstValue("sub"), out var id) ? id : null;
    public string Name => Principal?.FindFirstValue(ClaimTypes.Name) ?? "System";
    public string Role => Principal?.FindFirstValue(ClaimTypes.Role) ?? "System";
    public Guid? AgencyId => Guid.TryParse(Principal?.FindFirstValue("agencyId"), out var id) ? id : null;
    public string? IpAddress => accessor.HttpContext?.Connection.RemoteIpAddress?.ToString();
    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;
    public bool IsAgent => string.Equals(Role, "Agent", StringComparison.OrdinalIgnoreCase);
}
