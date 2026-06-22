using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Trinsu.Application.Common;

namespace Trinsu.Api.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task Invoke(HttpContext context)
    {
        try { await next(context); }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled request failure {Method} {Path}", context.Request.Method, context.Request.Path);
            var (status, title, errors) = exception switch
            {
                ValidationException validation => (400, "Validation failed", validation.Errors.GroupBy(x => x.PropertyName).ToDictionary(g => g.Key, g => g.Select(x => x.ErrorMessage).ToArray())),
                NotFoundException => (404, exception.Message, null),
                ForbiddenException => (403, exception.Message, null),
                AuthenticationException => (401, exception.Message, null),
                ConflictException => (409, exception.Message, null),
                _ => (500, "An unexpected error occurred", null)
            };
            context.Response.StatusCode = status;
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = status,
                Title = title,
                Detail = status == 500 ? null : exception.Message,
                Extensions = { ["errors"] = errors, ["traceId"] = context.TraceIdentifier }
            });
        }
    }
}
