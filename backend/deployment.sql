IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Agencies] (
        [Id] uniqueidentifier NOT NULL,
        [AgencyName] nvarchar(150) NOT NULL,
        [AgencyCode] nvarchar(50) NOT NULL,
        [Phone] nvarchar(max) NULL,
        [Email] nvarchar(max) NULL,
        [Address] nvarchar(max) NULL,
        [Status] nvarchar(30) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Agencies] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NULL,
        [UserName] nvarchar(max) NOT NULL,
        [Role] nvarchar(max) NOT NULL,
        [Action] nvarchar(max) NOT NULL,
        [EntityName] nvarchar(max) NOT NULL,
        [EntityId] nvarchar(max) NULL,
        [IPAddress] nvarchar(max) NULL,
        [Timestamp] datetime2 NOT NULL,
        [Data] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Customers] (
        [Id] uniqueidentifier NOT NULL,
        [CustomerCode] nvarchar(450) NOT NULL,
        [FullNameArabic] nvarchar(200) NOT NULL,
        [FullNameEnglish] nvarchar(200) NOT NULL,
        [PassportNumber] nvarchar(50) NOT NULL,
        [Nationality] nvarchar(max) NOT NULL,
        [BirthDate] date NOT NULL,
        [Gender] nvarchar(max) NOT NULL,
        [Phone] nvarchar(30) NOT NULL,
        [Email] nvarchar(256) NULL,
        [Address] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Customers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [LookupValues] (
        [Id] uniqueidentifier NOT NULL,
        [Category] nvarchar(100) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_LookupValues] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Permissions] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(120) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Permissions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] uniqueidentifier NOT NULL,
        [Name] nvarchar(80) NOT NULL,
        [Description] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [TravelPlans] (
        [Id] uniqueidentifier NOT NULL,
        [NameArabic] nvarchar(450) NOT NULL,
        [NameEnglish] nvarchar(450) NOT NULL,
        [CoverageAmount] decimal(18,2) NOT NULL,
        [Premium] decimal(18,2) NOT NULL,
        [Description] nvarchar(max) NULL,
        [Status] nvarchar(max) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_TravelPlans] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [RolePermissions] (
        [RoleId] uniqueidentifier NOT NULL,
        [PermissionId] uniqueidentifier NOT NULL,
        CONSTRAINT [PK_RolePermissions] PRIMARY KEY ([RoleId], [PermissionId]),
        CONSTRAINT [FK_RolePermissions_Permissions_PermissionId] FOREIGN KEY ([PermissionId]) REFERENCES [Permissions] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_RolePermissions_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] uniqueidentifier NOT NULL,
        [FullName] nvarchar(150) NOT NULL,
        [Email] nvarchar(256) NOT NULL,
        [PasswordHash] nvarchar(500) NOT NULL,
        [Phone] nvarchar(30) NULL,
        [RoleId] uniqueidentifier NOT NULL,
        [AgencyId] uniqueidentifier NULL,
        [IsActive] bit NOT NULL,
        [LastLogin] datetime2 NULL,
        [PasswordResetTokenHash] nvarchar(max) NULL,
        [PasswordResetExpiresAt] datetime2 NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Users_Agencies_AgencyId] FOREIGN KEY ([AgencyId]) REFERENCES [Agencies] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Users_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Policies] (
        [Id] uniqueidentifier NOT NULL,
        [PolicyNumber] nvarchar(80) NOT NULL,
        [CustomerId] uniqueidentifier NOT NULL,
        [TravelPlanId] uniqueidentifier NOT NULL,
        [Destination] nvarchar(200) NOT NULL,
        [StartDate] date NOT NULL,
        [EndDate] date NOT NULL,
        [CoverageAmount] decimal(18,2) NOT NULL,
        [Premium] decimal(18,2) NOT NULL,
        [Status] nvarchar(450) NOT NULL,
        [PdfUrl] nvarchar(max) NULL,
        [QRCode] nvarchar(max) NULL,
        [IssuedByUserId] uniqueidentifier NOT NULL,
        [IssuedByName] nvarchar(max) NOT NULL,
        [IssuedByRole] nvarchar(max) NOT NULL,
        [AgencyId] uniqueidentifier NULL,
        [SoftDelete] bit NOT NULL,
        [DeletedAt] datetime2 NULL,
        [DeletedBy] uniqueidentifier NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_Policies] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Policies_Agencies_AgencyId] FOREIGN KEY ([AgencyId]) REFERENCES [Agencies] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_Policies_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Policies_TravelPlans_TravelPlanId] FOREIGN KEY ([TravelPlanId]) REFERENCES [TravelPlans] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Policies_Users_IssuedByUserId] FOREIGN KEY ([IssuedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [UserId] uniqueidentifier NOT NULL,
        [TokenHash] nvarchar(128) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ReplacedByTokenHash] nvarchar(max) NULL,
        [CreatedByIp] nvarchar(max) NULL,
        [RevokedByIp] nvarchar(max) NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Claims] (
        [Id] uniqueidentifier NOT NULL,
        [ClaimNumber] nvarchar(450) NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [ClaimType] nvarchar(max) NOT NULL,
        [Description] nvarchar(4000) NOT NULL,
        [Amount] decimal(18,2) NOT NULL,
        [Status] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Claims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Claims_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [Endorsements] (
        [Id] uniqueidentifier NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [Type] nvarchar(max) NOT NULL,
        [OldValue] nvarchar(max) NULL,
        [NewValue] nvarchar(max) NOT NULL,
        [Remarks] nvarchar(max) NULL,
        [Status] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_Endorsements] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Endorsements_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [PolicyCancellations] (
        [Id] uniqueidentifier NOT NULL,
        [PolicyId] uniqueidentifier NOT NULL,
        [Reason] nvarchar(max) NOT NULL,
        [RefundAmount] decimal(18,2) NOT NULL,
        [Status] nvarchar(450) NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [CreatedByUserId] uniqueidentifier NULL,
        CONSTRAINT [PK_PolicyCancellations] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PolicyCancellations_Policies_PolicyId] FOREIGN KEY ([PolicyId]) REFERENCES [Policies] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE TABLE [ClaimDocuments] (
        [Id] uniqueidentifier NOT NULL,
        [ClaimId] uniqueidentifier NOT NULL,
        [FileName] nvarchar(max) NOT NULL,
        [FilePath] nvarchar(max) NOT NULL,
        [UploadedAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [UpdatedAt] datetime2 NULL,
        CONSTRAINT [PK_ClaimDocuments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ClaimDocuments_Claims_ClaimId] FOREIGN KEY ([ClaimId]) REFERENCES [Claims] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Agencies_AgencyCode] ON [Agencies] ([AgencyCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_ClaimDocuments_ClaimId] ON [ClaimDocuments] ([ClaimId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Claims_ClaimNumber] ON [Claims] ([ClaimNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Claims_CreatedByUserId_Status] ON [Claims] ([CreatedByUserId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Claims_PolicyId] ON [Claims] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Customers_CustomerCode] ON [Customers] ([CustomerCode]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Customers_PassportNumber] ON [Customers] ([PassportNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Endorsements_CreatedByUserId_Status] ON [Endorsements] ([CreatedByUserId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Endorsements_PolicyId] ON [Endorsements] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_LookupValues_Category_Name] ON [LookupValues] ([Category], [Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Permissions_Name] ON [Permissions] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Policies_AgencyId_CreatedAt] ON [Policies] ([AgencyId], [CreatedAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Policies_CustomerId] ON [Policies] ([CustomerId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Policies_IssuedByUserId_Status] ON [Policies] ([IssuedByUserId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Policies_PolicyNumber] ON [Policies] ([PolicyNumber]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Policies_TravelPlanId] ON [Policies] ([TravelPlanId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_PolicyCancellations_CreatedByUserId_Status] ON [PolicyCancellations] ([CreatedByUserId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_PolicyCancellations_PolicyId] ON [PolicyCancellations] ([PolicyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RefreshTokens_TokenHash] ON [RefreshTokens] ([TokenHash]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_RefreshTokens_UserId_ExpiresAt] ON [RefreshTokens] ([UserId], [ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_RolePermissions_PermissionId] ON [RolePermissions] ([PermissionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Roles_Name] ON [Roles] ([Name]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_TravelPlans_NameArabic_NameEnglish] ON [TravelPlans] ([NameArabic], [NameEnglish]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Users_AgencyId] ON [Users] ([AgencyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    CREATE INDEX [IX_Users_RoleId] ON [Users] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260622090256_InitialEnterpriseSchema'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260622090256_InitialEnterpriseSchema', N'9.0.10');
END;

COMMIT;
GO

