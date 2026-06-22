using Trinsu.Application;
using Trinsu.Domain.Common;
using Trinsu.Infrastructure;

namespace Trinsu.ArchitectureTests;

public sealed class ArchitectureTests
{
    [Fact]
    public void Domain_must_not_reference_outer_layers()
    {
        var references = typeof(BaseEntity).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToArray();
        Assert.DoesNotContain("Trinsu.Application", references);
        Assert.DoesNotContain("Trinsu.Infrastructure", references);
        Assert.DoesNotContain("Trinsu.Api", references);
    }

    [Fact]
    public void Application_must_not_reference_infrastructure_or_api()
    {
        var references = typeof(Trinsu.Application.DependencyInjection).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToArray();
        Assert.DoesNotContain("Trinsu.Infrastructure", references);
        Assert.DoesNotContain("Trinsu.Api", references);
    }

    [Fact]
    public void Infrastructure_may_reference_application_and_domain()
    {
        var references = typeof(Trinsu.Infrastructure.DependencyInjection).Assembly.GetReferencedAssemblies().Select(x => x.Name).ToArray();
        Assert.Contains("Trinsu.Application", references);
        Assert.Contains("Trinsu.Domain", references);
    }
}
