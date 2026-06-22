namespace Trinsu.Application.Common;

public sealed record PagedRequest(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Status = null,
    DateTime? From = null,
    DateTime? To = null,
    Guid? AgencyId = null,
    Guid? UserId = null)
{
    public int SafePage => Math.Max(Page, 1);
    public int SafePageSize => Math.Clamp(PageSize, 1, 200);
}

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
}

public sealed class NotFoundException(string message) : Exception(message);
public sealed class ForbiddenException(string message = "Forbidden") : Exception(message);
public sealed class ConflictException(string message) : Exception(message);
public sealed class AuthenticationException(string message) : Exception(message);
