# TRINSU Public Motor Insurance API v1

External portals must communicate with TRINSU only through these REST endpoints. The portal must not connect to PostgreSQL, Prisma, or internal dashboard routes.

## Authentication

All endpoints require an API key in the `x-api-key` header. Configure allowed keys in the `PUBLIC_API_KEYS` environment variable as a comma-separated list.

Invalid or missing keys return:

```json
{
  "success": false,
  "error": "Unauthorized"
}
```

## Create Motor Insurance Request

`POST /api/v1/public/motor-requests`

Content type: `multipart/form-data`

Headers:

```http
x-api-key: <portal-api-key>
```

Form fields:

- `payload`: JSON string containing customer, vehicle, notes, and optional agent code.
- `vehicleImages`: repeat this file field at least 5 times. Allowed: JPG, PNG, WEBP.
- `documents.nationalIdFront`: required file. Allowed: JPG, PNG, WEBP, PDF.
- `documents.nationalIdBack`: required file.
- `documents.drivingLicense`: required file.
- `documents.vehicleRegistration`: required file.
- `documents.residenceCardFront`: required file.
- `documents.residenceCardBack`: required file.

Maximum file size defaults to 5 MB and can be changed with `PUBLIC_API_MAX_FILE_SIZE_MB`.

Example `payload`:

```json
{
  "customer": {
    "fullName": "Ahmed Ali",
    "mobile": "+9647700000000",
    "email": "ahmed@example.com",
    "nationalId": "1234567890",
    "address": "Karrada",
    "city": "Baghdad"
  },
  "vehicle": {
    "vehicleType": "Sedan",
    "manufacturer": "Toyota",
    "model": "Camry",
    "manufacturingYear": 2024,
    "color": "White",
    "plateNumber": "BGD-12345",
    "chassisNumber": "JTDBR32E720000001",
    "engineNumber": "ENG123456",
    "estimatedVehicleValue": 25000
  },
  "notes": "Customer prefers WhatsApp updates.",
  "agentCode": "AGT-001"
}
```

Success response:

```json
{
  "success": true,
  "requestNumber": "MTR-REQ-2026-000001",
  "status": "Submitted",
  "message": "Motor insurance request submitted successfully."
}
```

## Retrieve Request Status

`GET /api/v1/public/motor-requests/{requestNumber}`

Returns request status and safe summary fields.

## Retrieve Uploaded Documents

`GET /api/v1/public/motor-requests/{requestNumber}/documents`

Returns stored file metadata for vehicle images and customer documents. Database records store only relative file paths, not binary content.

## Download Issued Policy PDF

`GET /api/v1/public/motor-requests/{requestNumber}/policy`

Returns `404` until a policy has been issued and linked to the motor request.

## Error Codes

- `400`: validation error, malformed JSON payload, invalid files, missing required documents.
- `401`: missing or invalid API key.
- `404`: request or policy not found.
- `500`: unexpected server error.

## Audit Logging

Request creation writes an audit log with action `PUBLIC_MOTOR_REQUEST_CREATED`, request number, API-key fingerprint, IP address, user agent, and timestamp.
