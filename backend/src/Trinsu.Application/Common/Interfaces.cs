using System.Linq.Expressions;
using Trinsu.Application.Common;
using Trinsu.Domain.Common;
using Trinsu.Domain.Entities;

namespace Trinsu.Application.Common.Interfaces;

public interface IRepository<T> where T : BaseEntity
{
    IQueryable<T> Query(bool tracking = false);
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task AddAsync(T entity, CancellationToken cancellationToken = default);
    void Update(T entity);
    void Remove(T entity);
    Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default);
}

public interface ICurrentUser
{
    Guid? UserId { get; }
    string Name { get; }
    string Role { get; }
    Guid? AgencyId { get; }
    string? IpAddress { get; }
    bool IsAuthenticated { get; }
    bool IsAgent { get; }
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface ITokenService
{
    (string AccessToken, DateTime ExpiresAt) CreateAccessToken(User user);
    string CreateRefreshToken();
    string HashToken(string token);
}

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task LogoutAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken);
}

public interface IAuditService
{
    Task WriteAsync(string action, string entityName, string? entityId = null, object? data = null, CancellationToken cancellationToken = default);
}

public interface IFileStorageService
{
    Task<(string FileName, string Path)> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken);
    Task DeleteAsync(string path, CancellationToken cancellationToken);
}

public interface IQrCodeService { byte[] Generate(string value); }
public interface IPdfService { byte[] CreatePolicy(Policy policy); byte[] CreateTable(string title, IReadOnlyList<IDictionary<string, object?>> rows); }
public interface IExcelService { byte[] Create(string sheetName, IReadOnlyList<IDictionary<string, object?>> rows); }
public interface IPasswordResetNotifier { Task SendAsync(string email, string token, CancellationToken cancellationToken); }

public sealed record LoginRequest(string Email, string Password);
public sealed record RefreshRequest(string RefreshToken);
public sealed record ForgotPasswordRequest(string Email);
public sealed record ResetPasswordRequest(string Token, string NewPassword);
public sealed record AuthResponse(string AccessToken, DateTime ExpiresAt, string RefreshToken, UserSummary User);
public sealed record UserSummary(Guid Id, string FullName, string Email, string Role, Guid? AgencyId);
