using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Infrastructure.Persistence;
using Trinsu.Infrastructure.Security;
using Trinsu.Infrastructure.Services;

namespace Trinsu.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<TrinsuDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection"), sql =>
                sql.MigrationsAssembly(typeof(TrinsuDbContext).Assembly.FullName).EnableRetryOnFailure()));
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<DbInitializer>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAuditService, AuditService>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddSingleton<IQrCodeService, QrCodeService>();
        services.AddSingleton<IExcelService, ExcelService>();
        services.AddSingleton<IPdfService, PdfService>();
        services.AddScoped<IPasswordResetNotifier, SmtpPasswordResetNotifier>();
        return services;
    }
}
