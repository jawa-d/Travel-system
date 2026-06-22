using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Trinsu.Application.Common;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Domain.Entities;
using Trinsu.Infrastructure.Persistence;
using SecurityClaim = System.Security.Claims.Claim;

namespace Trinsu.Infrastructure.Security;

public sealed class PasswordHasher : IPasswordHasher
{
    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, 12);
    public bool Verify(string password, string hash) => BCrypt.Net.BCrypt.Verify(password, hash);
}

public sealed class TokenService(IConfiguration configuration) : ITokenService
{
    public (string AccessToken, DateTime ExpiresAt) CreateAccessToken(User user)
    {
        var section = configuration.GetSection("Jwt");
        var expires = DateTime.UtcNow.AddMinutes(int.TryParse(section["AccessTokenMinutes"], out var minutes) ? minutes : 15);
        var claims = new[]
        {
            new SecurityClaim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new SecurityClaim(JwtRegisteredClaimNames.Email, user.Email),
            new SecurityClaim(ClaimTypes.Name, user.FullName),
            new SecurityClaim(ClaimTypes.Role, user.Role.Name),
            new SecurityClaim("agencyId", user.AgencyId?.ToString() ?? string.Empty),
            new SecurityClaim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(section["Key"] ?? throw new InvalidOperationException("JWT key missing")));
        var token = new JwtSecurityToken(section["Issuer"], section["Audience"], claims, expires: expires, signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public string CreateRefreshToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    public string HashToken(string token) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public sealed class AuthService(
    TrinsuDbContext db,
    IPasswordHasher passwordHasher,
    ITokenService tokens,
    IAuditService audit,
    IPasswordResetNotifier resetNotifier) : IAuthService
{
    public async Task<AuthResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(x => x.Role).SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null || !user.IsActive || !passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new AuthenticationException("Invalid credentials");
        user.LastLogin = DateTime.UtcNow;
        var response = await IssueAsync(user, ipAddress, cancellationToken);
        await audit.WriteAsync("LOGIN", nameof(User), user.Id.ToString(), null, cancellationToken);
        return response;
    }

    public async Task<AuthResponse> RefreshAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var hash = tokens.HashToken(request.RefreshToken);
        var stored = await db.RefreshTokens.Include(x => x.User).ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (stored is null || !stored.IsActive || !stored.User.IsActive) throw new AuthenticationException("Invalid refresh token");
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedByIp = ipAddress;
        var response = await IssueAsync(stored.User, ipAddress, cancellationToken);
        stored.ReplacedByTokenHash = tokens.HashToken(response.RefreshToken);
        await db.SaveChangesAsync(cancellationToken);
        return response;
    }

    public async Task LogoutAsync(RefreshRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var hash = tokens.HashToken(request.RefreshToken);
        var stored = await db.RefreshTokens.Include(x => x.User).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.TokenHash == hash, cancellationToken);
        if (stored is null) return;
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedByIp = ipAddress;
        await db.SaveChangesAsync(cancellationToken);
        await audit.WriteAsync("LOGOUT", nameof(User), stored.UserId.ToString(), null, cancellationToken);
    }

    public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == request.Email.Trim().ToLowerInvariant(), cancellationToken);
        if (user is null) return;
        var token = tokens.CreateRefreshToken();
        user.PasswordResetTokenHash = tokens.HashToken(token);
        user.PasswordResetExpiresAt = DateTime.UtcNow.AddMinutes(30);
        await db.SaveChangesAsync(cancellationToken);
        await resetNotifier.SendAsync(user.Email, token, cancellationToken);
    }

    public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var hash = tokens.HashToken(request.Token);
        var user = await db.Users.SingleOrDefaultAsync(x => x.PasswordResetTokenHash == hash && x.PasswordResetExpiresAt > DateTime.UtcNow, cancellationToken)
            ?? throw new AuthenticationException("Invalid or expired reset token");
        user.PasswordHash = passwordHasher.Hash(request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetExpiresAt = null;
        foreach (var refresh in await db.RefreshTokens.Where(x => x.UserId == user.Id && x.RevokedAt == null).ToListAsync(cancellationToken))
            refresh.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<AuthResponse> IssueAsync(User user, string? ipAddress, CancellationToken cancellationToken)
    {
        var (access, expires) = tokens.CreateAccessToken(user);
        var refresh = tokens.CreateRefreshToken();
        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = tokens.HashToken(refresh),
            ExpiresAt = DateTime.UtcNow.AddDays(30),
            CreatedByIp = ipAddress
        });
        await db.SaveChangesAsync(cancellationToken);
        return new AuthResponse(access, expires, refresh, new UserSummary(user.Id, user.FullName, user.Email, user.Role.Name, user.AgencyId));
    }
}
