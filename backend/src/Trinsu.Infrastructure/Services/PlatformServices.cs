using System.Text.Json;
using System.Net;
using System.Net.Mail;
using ClosedXML.Excel;
using QRCoder;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Trinsu.Application.Common.Interfaces;
using Trinsu.Domain.Entities;
using Trinsu.Infrastructure.Persistence;

namespace Trinsu.Infrastructure.Services;

public sealed class AuditService(TrinsuDbContext db, ICurrentUser currentUser) : IAuditService
{
    public async Task WriteAsync(string action, string entityName, string? entityId = null, object? data = null, CancellationToken cancellationToken = default)
    {
        db.AuditLogs.Add(new AuditLog
        {
            UserId = currentUser.UserId,
            UserName = currentUser.Name,
            Role = currentUser.Role,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            IPAddress = currentUser.IpAddress,
            Data = data is null ? null : JsonSerializer.Serialize(data)
        });
        await db.SaveChangesAsync(cancellationToken);
    }
}

public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly HashSet<string> Allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp", ".doc", ".docx"];
    private readonly string _root = Path.Combine(AppContext.BaseDirectory, "uploads");

    public async Task<(string FileName, string Path)> SaveAsync(Stream stream, string fileName, string contentType, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_root);
        var extension = System.IO.Path.GetExtension(fileName).ToLowerInvariant();
        if (!Allowed.Contains(extension)) throw new InvalidOperationException("File type is not allowed");
        var safeName = $"{Guid.NewGuid():N}{extension}";
        var path = System.IO.Path.Combine(_root, safeName);
        await using var target = File.Create(path);
        await stream.CopyToAsync(target, cancellationToken);
        return (System.IO.Path.GetFileName(fileName), path);
    }

    public Task DeleteAsync(string path, CancellationToken cancellationToken)
    {
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }
}

public sealed class QrCodeService : IQrCodeService
{
    public byte[] Generate(string value) => PngByteQRCodeHelper.GetQRCode(value, QRCodeGenerator.ECCLevel.Q, 10);
}

public sealed class SmtpPasswordResetNotifier(Microsoft.Extensions.Configuration.IConfiguration configuration) : IPasswordResetNotifier
{
    public async Task SendAsync(string email, string token, CancellationToken cancellationToken)
    {
        var section = configuration.GetSection("Smtp");
        var host = section["Host"];
        if (string.IsNullOrWhiteSpace(host)) throw new InvalidOperationException("SMTP is not configured");
        using var message = new MailMessage(section["From"] ?? "no-reply@trinsu.local", email)
        {
            Subject = "TRINSU password reset",
            Body = $"Use this one-time password reset token within 30 minutes:\n\n{token}",
            IsBodyHtml = false
        };
        using var client = new SmtpClient(host, int.TryParse(section["Port"], out var port) ? port : 587)
        {
            EnableSsl = !bool.TryParse(section["EnableSsl"], out var enableSsl) || enableSsl,
            Credentials = new NetworkCredential(section["User"], section["Password"])
        };
        await client.SendMailAsync(message, cancellationToken);
    }
}

public sealed class ExcelService : IExcelService
{
    public byte[] Create(string sheetName, IReadOnlyList<IDictionary<string, object?>> rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(sheetName[..Math.Min(sheetName.Length, 31)]);
        if (rows.Count > 0)
        {
            var headers = rows[0].Keys.ToArray();
            for (var i = 0; i < headers.Length; i++) sheet.Cell(1, i + 1).Value = headers[i];
            for (var r = 0; r < rows.Count; r++)
                for (var c = 0; c < headers.Length; c++)
                    sheet.Cell(r + 2, c + 1).Value = rows[r][headers[c]]?.ToString() ?? string.Empty;
            sheet.RangeUsed()?.CreateTable();
            sheet.Columns().AdjustToContents();
        }
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}

public sealed class PdfService : IPdfService
{
    public PdfService() => QuestPDF.Settings.License = LicenseType.Community;

    public byte[] CreatePolicy(Policy policy) => Document.Create(container =>
        container.Page(page =>
        {
            page.Margin(35);
            page.Header().Text($"TRINSU - Travel Insurance Policy").Bold().FontSize(20).FontColor(Colors.Teal.Darken2);
            page.Content().Column(column =>
            {
                column.Spacing(10);
                Row(column, "Policy Number", policy.PolicyNumber);
                Row(column, "Customer", policy.Customer?.FullNameEnglish ?? policy.CustomerId.ToString());
                Row(column, "Passport", policy.Customer?.PassportNumber ?? "-");
                Row(column, "Destination", policy.Destination);
                Row(column, "Travel Dates", $"{policy.StartDate:yyyy-MM-dd} - {policy.EndDate:yyyy-MM-dd}");
                Row(column, "Coverage", policy.CoverageAmount.ToString("N2"));
                Row(column, "Premium", policy.Premium.ToString("N2"));
                Row(column, "Issued By", $"{policy.IssuedByName} ({policy.IssuedByRole})");
                if (!string.IsNullOrWhiteSpace(policy.QRCode))
                    column.Item().PaddingTop(15).Text("QR verification data is stored with the policy record.");
            });
            page.Footer().AlignCenter().Text($"Generated {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC");
        })).GeneratePdf();

    public byte[] CreateTable(string title, IReadOnlyList<IDictionary<string, object?>> rows) => Document.Create(container =>
        container.Page(page =>
        {
            page.Size(PageSizes.A4.Landscape());
            page.Margin(25);
            page.Header().Text(title).Bold().FontSize(18);
            page.Content().Table(table =>
            {
                var headers = rows.FirstOrDefault()?.Keys.ToArray() ?? [];
                table.ColumnsDefinition(columns => { foreach (var _ in headers) columns.RelativeColumn(); });
                table.Header(header => { foreach (var item in headers) header.Cell().Background(Colors.Teal.Darken2).Padding(4).Text(item).FontColor(Colors.White).Bold(); });
                foreach (var row in rows)
                    foreach (var header in headers)
                        table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(4).Text(row[header]?.ToString() ?? string.Empty).FontSize(8);
            });
        })).GeneratePdf();

    private static void Row(ColumnDescriptor column, string label, string value) =>
        column.Item().Row(row => { row.ConstantItem(140).Text(label).Bold(); row.RelativeItem().Text(value); });
}
