using FluentValidation;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Application.DTOs;

namespace Trinsu.Application.Validation;

public sealed class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator() { RuleFor(x => x.Email).NotEmpty().EmailAddress(); RuleFor(x => x.Password).NotEmpty(); }
}

public sealed class ResetPasswordValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordValidator()
    {
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).MinimumLength(10).Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]");
    }
}

public sealed class UserValidator : AbstractValidator<CreateUserRequest>
{
    public UserValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).MinimumLength(10).Matches("[A-Z]").Matches("[a-z]").Matches("[0-9]");
        RuleFor(x => x.Phone).Matches(@"^\+?[0-9\s\-]{7,20}$").When(x => !string.IsNullOrWhiteSpace(x.Phone));
    }
}

public sealed class CustomerValidator : AbstractValidator<CreateCustomerRequest>
{
    public CustomerValidator()
    {
        RuleFor(x => x.FullNameArabic).NotEmpty().MaximumLength(200);
        RuleFor(x => x.FullNameEnglish).NotEmpty().MaximumLength(200);
        RuleFor(x => x.PassportNumber).NotEmpty().Matches(@"^[A-Za-z0-9\-]{4,30}$");
        RuleFor(x => x.BirthDate).LessThan(DateOnly.FromDateTime(DateTime.UtcNow));
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrWhiteSpace(x.Email));
        RuleFor(x => x.Phone).Matches(@"^\+?[0-9\s\-]{7,20}$");
    }
}

public sealed class TravelPlanValidator : AbstractValidator<CreateTravelPlanRequest>
{
    public TravelPlanValidator()
    {
        RuleFor(x => x.NameArabic).NotEmpty();
        RuleFor(x => x.NameEnglish).NotEmpty();
        RuleFor(x => x.CoverageAmount).GreaterThan(0);
        RuleFor(x => x.Premium).GreaterThanOrEqualTo(0);
    }
}

public sealed class ClaimValidator : AbstractValidator<CreateClaimRequest>
{
    public ClaimValidator()
    {
        RuleFor(x => x.PolicyId).NotEmpty();
        RuleFor(x => x.ClaimType).NotEmpty();
        RuleFor(x => x.Description).NotEmpty().MinimumLength(10).MaximumLength(4000);
        RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
    }
}

public sealed class EndorsementValidator : AbstractValidator<CreateEndorsementRequest>
{
    public EndorsementValidator() { RuleFor(x => x.PolicyId).NotEmpty(); RuleFor(x => x.Type).NotEmpty(); RuleFor(x => x.NewValue).NotEmpty(); }
}

public sealed class CancellationValidator : AbstractValidator<CreateCancellationRequest>
{
    public CancellationValidator() { RuleFor(x => x.PolicyId).NotEmpty(); RuleFor(x => x.Reason).NotEmpty(); RuleFor(x => x.RefundAmount).GreaterThanOrEqualTo(0); }
}
