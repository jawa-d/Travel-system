# TRINSU Backend

Enterprise ASP.NET Core 9 Web API for the existing TRINSU travel-insurance platform.

## Solution structure

```text
backend/
├─ src/
│  ├─ Trinsu.Domain/          Entities, constants and domain abstractions
│  ├─ Trinsu.Application/     CQRS, DTOs, validators, contracts and pipeline behaviors
│  ├─ Trinsu.Infrastructure/  EF Core, SQL Server, repositories, JWT, files, PDF, Excel and QR
│  └─ Trinsu.Api/             Controllers, middleware, authentication, Swagger and policies
├─ tests/
│  └─ Trinsu.ArchitectureTests/
├─ docker-compose.yml
└─ Trinsu.Backend.sln
```

Dependencies point inward: `Api → Infrastructure → Application → Domain`.

## Database ERD summary

- `Role 1─* User`, `Role *─* Permission` through `RolePermission`.
- `Agency 1─* User` and `Agency 1─* Policy`.
- `Customer 1─* Policy`.
- `TravelPlan 1─* Policy`.
- `User 1─* Policy` through `IssuedByUserId`.
- `Policy 1─* Claim`, `Policy 1─* Endorsement`, `Policy 1─* PolicyCancellation`.
- `Claim 1─* ClaimDocument`.
- `User 1─* RefreshToken`.
- `LookupValue` supplies extensible dropdown values.
- `AuditLog` stores immutable operational events.

Policies use a global EF query filter for soft deletion. Agent data is additionally scoped by issuer/creator at the API query boundary.

## Migrations

The initial migration is under:

```text
src/Trinsu.Infrastructure/Persistence/Migrations/
```

It creates Users, Roles, Permissions, Agencies, Customers, TravelPlans, Policies, Claims,
ClaimDocuments, Endorsements, PolicyCancellations, LookupValues, AuditLogs and RefreshTokens,
including indexes, foreign keys, decimal precision and uniqueness constraints.

Runtime initialization applies migrations and inserts only system configuration:

- SuperAdmin, Admin and Agent roles.
- Permission keys and role-permission mappings.
- Standard lookup values.
- An optional bootstrap SuperAdmin only when environment configuration is supplied.

No customer, policy, claim or other fake business data is inserted.

## Main endpoints

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET/POST /api/users`
- `PATCH /api/users/{id}/status`
- `GET /api/roles`
- `GET /api/roles/permissions`
- `GET/POST/PUT /api/agencies`
- `GET/POST/PUT /api/customers`
- `GET/POST/PUT /api/travel-plans`
- `GET/POST/PUT/DELETE /api/policies`
- `GET /api/policies/{id}/pdf`
- `GET/POST/PUT /api/claims`
- `POST /api/claims/{id}/documents`
- `GET/POST/PUT /api/endorsements`
- `GET/POST/PUT /api/cancellations`
- `GET/POST/PUT /api/lookups`
- `GET /api/audit-logs`
- `GET /api/reports/dashboard`
- `GET /api/reports/{policies|customers|claims|endorsements|cancellations}?format=xlsx|pdf`
- `GET /health`
- `/swagger` in Development

List and report endpoints support search, pagination, status, date range, agency and user filters where applicable.

## Local deployment

1. Install .NET 9 SDK and Docker Desktop.
2. Copy `.env.example` to `.env` and set strong secrets.
3. Start SQL Server:

```powershell
docker compose up -d sqlserver
```

4. Configure secrets without committing them:

```powershell
dotnet user-secrets init --project src/Trinsu.Api
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost,1433;Database=Trinsu;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True;Encrypt=True" --project src/Trinsu.Api
dotnet user-secrets set "Jwt:Key" "A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS" --project src/Trinsu.Api
dotnet user-secrets set "BootstrapAdmin:Email" "admin@example.com" --project src/Trinsu.Api
dotnet user-secrets set "BootstrapAdmin:Password" "CHANGE_ME_STRONG_PASSWORD" --project src/Trinsu.Api
```

5. Run:

```powershell
dotnet restore
dotnet run --project src/Trinsu.Api
```

Migrations are applied automatically on startup. For controlled deployments:

```powershell
dotnet tool restore
dotnet ef database update --project src/Trinsu.Infrastructure --startup-project src/Trinsu.Api
```

## Production

- Store SQL, JWT, SMTP and bootstrap secrets in a secret manager.
- Disable or remove bootstrap credentials after the first administrator is created.
- Put the API behind HTTPS and a reverse proxy.
- Replace local claim-document storage with object storage by implementing `IFileStorageService`.
- Configure SMTP before enabling forgot-password flows.
- Use `docker compose up --build` or publish `Trinsu.Api` to your target runtime.
