using System.Data;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Domain.Common;

namespace Trinsu.Infrastructure.Persistence;

public sealed class Repository<T>(TrinsuDbContext db) : IRepository<T> where T : BaseEntity
{
    public IQueryable<T> Query(bool tracking = false) => tracking ? db.Set<T>() : db.Set<T>().AsNoTracking();
    public Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => db.Set<T>().FindAsync([id], cancellationToken).AsTask();
    public Task AddAsync(T entity, CancellationToken cancellationToken = default) => db.Set<T>().AddAsync(entity, cancellationToken).AsTask();
    public void Update(T entity) => db.Set<T>().Update(entity);
    public void Remove(T entity) => db.Set<T>().Remove(entity);
    public Task<bool> AnyAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default) => db.Set<T>().AnyAsync(predicate, cancellationToken);
}

public sealed class UnitOfWork(TrinsuDbContext db) : IUnitOfWork
{
    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => db.SaveChangesAsync(cancellationToken);

    public async Task<T> ExecuteAsync<T>(Func<CancellationToken, Task<T>> operation, CancellationToken cancellationToken = default)
    {
        await using IDbContextTransaction transaction = await db.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken);
        try
        {
            var result = await operation(cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}
