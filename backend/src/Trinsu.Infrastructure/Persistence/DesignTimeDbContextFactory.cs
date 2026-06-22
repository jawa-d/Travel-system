using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Trinsu.Infrastructure.Persistence;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<TrinsuDbContext>
{
    public TrinsuDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TrinsuDbContext>()
            .UseSqlServer("Server=localhost,1433;Database=Trinsu;User Id=sa;Password=DesignTimeOnly_123!;TrustServerCertificate=True")
            .Options;
        return new TrinsuDbContext(options);
    }
}
