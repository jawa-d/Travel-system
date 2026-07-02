# TRINSU Public Motor Insurance API v1

This document is for frontend developers, mobile app developers, and external portal teams integrating with TRINSU.

External applications must communicate with TRINSU only through REST APIs. They must never connect directly to PostgreSQL, Prisma, internal tables, or dashboard routes.

## 1. Base URL

Production:

```text
https://<your-trinsu-domain>
```

Local development:

```text
http://localhost:3000
```

All endpoint examples below use:

```text
{{baseUrl}} = https://<your-trinsu-domain>
```

## 2. API Version

Current version:

```text
v1
```

Base API path:

```text
/api/public
```

Motor portal create endpoint:

```text
/api/public/motor-requests
```

The legacy versioned path remains available for compatibility:

```text
/api/v1/public/motor-requests
```

## 3. Authentication

All endpoints require an API key.

Header:

```http
x-api-key: <portal-api-key>
```

The API key is configured on the TRINSU server with `MOTOR_API_KEY`.

Never hardcode API keys in public frontend bundles. Browser-based integrations should call their own backend, and that backend should call TRINSU with the API key.

## 4. Required Headers

For JSON-style `GET` requests:

```http
x-api-key: <portal-api-key>
Accept: application/json
```

For `POST /motor-requests`:

```http
x-api-key: <portal-api-key>
Accept: application/json
Content-Type: multipart/form-data
```

When using `fetch`, Axios, or Postman with `FormData`, let the client set the multipart boundary automatically.

## 5. All Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/public/motor-requests` | Create a motor insurance request. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}` | Retrieve request status and summary. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}/documents` | Retrieve uploaded document metadata and Blob URLs. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}/policy` | Download issued policy PDF when available. Currently returns `404` until a policy is linked. |

## 6. Create Motor Insurance Request

```http
POST /api/public/motor-requests
```

Content type:

```text
multipart/form-data
```

### File Upload Format

Form fields:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `payload` | JSON string | Yes | Contains customer, vehicle, notes, and optional agent code. |
| `vehicleImages` | File, repeated | Yes | Minimum 5 files. JPG, JPEG, PNG, WEBP only. |
| `documents.nationalIdFront` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |
| `documents.nationalIdBack` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |
| `documents.drivingLicense` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |
| `documents.vehicleRegistration` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |
| `documents.residenceCardFront` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |
| `documents.residenceCardBack` | File | Yes | JPG, JPEG, PNG, WEBP, or PDF. |

Default maximum file size:

```text
5 MB per file
```

Server variable:

```text
PUBLIC_API_MAX_FILE_SIZE_MB=5
```

TRINSU uploads files to Vercel Blob Storage and saves only Blob file metadata in the database.

### Request Body Example

The `payload` form field must be a JSON string:

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

### Success Response

HTTP `201`

```json
{
  "success": true,
  "requestId": "cmtr...",
  "trackingNumber": "MTR-REQ-2026-000001",
  "message": "Motor request created successfully."
}
```

### cURL Example

```bash
curl -X POST "{{baseUrl}}/api/public/motor-requests" \
  -H "x-api-key: {{apiKey}}" \
  -H "Accept: application/json" \
  -F 'payload={
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
  }' \
  -F "vehicleImages=@./files/front.jpg" \
  -F "vehicleImages=@./files/back.jpg" \
  -F "vehicleImages=@./files/left.jpg" \
  -F "vehicleImages=@./files/right.jpg" \
  -F "vehicleImages=@./files/interior.jpg" \
  -F "documents.nationalIdFront=@./files/national-id-front.pdf" \
  -F "documents.nationalIdBack=@./files/national-id-back.pdf" \
  -F "documents.drivingLicense=@./files/driving-license.pdf" \
  -F "documents.vehicleRegistration=@./files/vehicle-registration.pdf" \
  -F "documents.residenceCardFront=@./files/residence-front.pdf" \
  -F "documents.residenceCardBack=@./files/residence-back.pdf"
```

### JavaScript fetch() Example

```ts
const formData = new FormData();

formData.append("payload", JSON.stringify({
  customer: {
    fullName: "Ahmed Ali",
    mobile: "+9647700000000",
    email: "ahmed@example.com",
    nationalId: "1234567890",
    address: "Karrada",
    city: "Baghdad"
  },
  vehicle: {
    vehicleType: "Sedan",
    manufacturer: "Toyota",
    model: "Camry",
    manufacturingYear: 2024,
    color: "White",
    plateNumber: "BGD-12345",
    chassisNumber: "JTDBR32E720000001",
    engineNumber: "ENG123456",
    estimatedVehicleValue: 25000
  },
  notes: "Customer prefers WhatsApp updates.",
  agentCode: "AGT-001"
}));

vehicleImageFiles.forEach((file) => {
  formData.append("vehicleImages", file);
});

formData.append("documents.nationalIdFront", nationalIdFrontFile);
formData.append("documents.nationalIdBack", nationalIdBackFile);
formData.append("documents.drivingLicense", drivingLicenseFile);
formData.append("documents.vehicleRegistration", vehicleRegistrationFile);
formData.append("documents.residenceCardFront", residenceCardFrontFile);
formData.append("documents.residenceCardBack", residenceCardBackFile);

const response = await fetch(`${baseUrl}/api/public/motor-requests`, {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "Accept": "application/json"
  },
  body: formData
});

const result = await response.json();
if (!response.ok) throw new Error(result.message ?? "Request failed");
```

### Axios Example

```ts
import axios from "axios";

const formData = new FormData();
formData.append("payload", JSON.stringify(payload));
vehicleImageFiles.forEach((file) => formData.append("vehicleImages", file));
formData.append("documents.nationalIdFront", nationalIdFrontFile);
formData.append("documents.nationalIdBack", nationalIdBackFile);
formData.append("documents.drivingLicense", drivingLicenseFile);
formData.append("documents.vehicleRegistration", vehicleRegistrationFile);
formData.append("documents.residenceCardFront", residenceCardFrontFile);
formData.append("documents.residenceCardBack", residenceCardBackFile);

const { data } = await axios.post(
  `${baseUrl}/api/public/motor-requests`,
  formData,
  {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json"
    }
  }
);
```

## 7. Retrieve Request Status

```http
GET /api/v1/public/motor-requests/{requestNumber}
```

### Response Body Example

HTTP `200`

```json
{
  "success": true,
  "requestNumber": "MTR-REQ-2026-000001",
  "status": "Submitted",
  "source": "Public Portal",
  "customer": {
    "fullName": "Ahmed Ali",
    "mobile": "+9647700000000",
    "email": "ahmed@example.com",
    "nationalId": "1234567890",
    "city": "Baghdad"
  },
  "vehicle": {
    "vehicleType": "Sedan",
    "manufacturer": "Toyota",
    "model": "Camry",
    "plateNumber": "BGD-12345"
  },
  "submittedAt": "2026-07-02T01:20:00.000Z",
  "updatedAt": "2026-07-02T01:20:00.000Z"
}
```

### cURL Example

```bash
curl -X GET "{{baseUrl}}/api/v1/public/motor-requests/MTR-REQ-2026-000001" \
  -H "x-api-key: {{apiKey}}" \
  -H "Accept: application/json"
```

### JavaScript fetch() Example

```ts
const response = await fetch(`${baseUrl}/api/v1/public/motor-requests/${requestNumber}`, {
  headers: {
    "x-api-key": apiKey,
    "Accept": "application/json"
  }
});

const data = await response.json();
```

### Axios Example

```ts
const { data } = await axios.get(
  `${baseUrl}/api/v1/public/motor-requests/${requestNumber}`,
  {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json"
    }
  }
);
```

## 8. Retrieve Uploaded Documents

```http
GET /api/v1/public/motor-requests/{requestNumber}/documents
```

This endpoint returns file metadata and Vercel Blob URLs. It does not return raw file bytes.

### Response Body Example

HTTP `200`

```json
{
  "success": true,
  "requestNumber": "MTR-REQ-2026-000001",
  "vehicleImages": [
    {
      "key": "vehicle-1",
      "label": "vehicle-1",
      "url": "https://example.public.blob.vercel-storage.com/public-motor-requests/MTR-REQ-2026-000001/vehicle-images/front.jpg",
      "name": "front.jpg",
      "size": 245000,
      "type": "image/jpeg",
      "uploadedAt": "2026-07-02T01:20:00.000Z"
    }
  ],
  "customerDocuments": [
    {
      "key": "nationalIdFront",
      "label": "National ID Front",
      "url": "https://example.public.blob.vercel-storage.com/public-motor-requests/MTR-REQ-2026-000001/customer-documents/national-id-front.pdf",
      "name": "national-id-front.pdf",
      "size": 410000,
      "type": "application/pdf",
      "uploadedAt": "2026-07-02T01:20:00.000Z"
    }
  ]
}
```

### cURL Example

```bash
curl -X GET "{{baseUrl}}/api/v1/public/motor-requests/MTR-REQ-2026-000001/documents" \
  -H "x-api-key: {{apiKey}}" \
  -H "Accept: application/json"
```

### JavaScript fetch() Example

```ts
const response = await fetch(`${baseUrl}/api/v1/public/motor-requests/${requestNumber}/documents`, {
  headers: {
    "x-api-key": apiKey,
    "Accept": "application/json"
  }
});

const documents = await response.json();
```

### Axios Example

```ts
const { data } = await axios.get(
  `${baseUrl}/api/v1/public/motor-requests/${requestNumber}/documents`,
  {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json"
    }
  }
);
```

## 9. Download Issued Policy PDF

```http
GET /api/v1/public/motor-requests/{requestNumber}/policy
```

When a policy is available, the expected success response is:

```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="POLICY-NUMBER.pdf"
```

Current behavior:

```json
{
  "success": false,
  "requestNumber": "MTR-REQ-2026-000001",
  "status": "SUBMITTED",
  "message": "Policy PDF is not available for this request yet."
}
```

### cURL Example

```bash
curl -X GET "{{baseUrl}}/api/v1/public/motor-requests/MTR-REQ-2026-000001/policy" \
  -H "x-api-key: {{apiKey}}" \
  -o policy.pdf
```

### JavaScript fetch() Example

```ts
const response = await fetch(`${baseUrl}/api/v1/public/motor-requests/${requestNumber}/policy`, {
  headers: {
    "x-api-key": apiKey
  }
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error ?? "Policy is not available");
}

const policyPdf = await response.blob();
```

### Axios Example

```ts
const { data } = await axios.get(
  `${baseUrl}/api/v1/public/motor-requests/${requestNumber}/policy`,
  {
    responseType: "blob",
    headers: {
      "x-api-key": apiKey
    }
  }
);
```

## 10. Error Codes

| HTTP Status | Meaning | Example |
| --- | --- | --- |
| `400` | Validation error, malformed JSON payload, invalid files, oversized files, or missing required documents. | Missing `documents.drivingLicense`. |
| `401` | Missing or invalid API key. | `x-api-key` not sent. |
| `404` | Request not found, or policy PDF not available. | Unknown request number. |
| `500` | Unexpected server error. | Storage or database failure. |

### Error Response Examples

Unauthorized:

```json
{
  "success": false,
  "message": "Unauthorized"
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "path": "customer.fullName",
      "message": "Full name is required"
    }
  ]
}
```

Not found:

```json
{
  "success": false,
  "message": "Motor insurance request not found."
}
```

## 11. Request Number Format

TRINSU generates request numbers automatically.

Format:

```text
MTR-REQ-YYYY-000001
```

Example:

```text
MTR-REQ-2026-000001
```

## 12. Required Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. |
| `MOTOR_API_KEY` | Yes | Motor portal API key accepted by `x-api-key`. |
| `MOTOR_PORTAL_ORIGIN` | Yes for browser CORS | Allowed external portal origin, for example `https://portal.example.com`. |
| `PUBLIC_API_MAX_FILE_SIZE_MB` | No | Maximum upload size per file. Defaults to `5`. |
| `BLOB_READ_WRITE_TOKEN` | Yes | Vercel Blob read/write token used by `@vercel/blob` uploads. |
| `AUTH_SECRET` | Yes for app auth | Required by the main TRINSU app authentication. |
| `AUTH_URL` | Production recommended | Public application URL. |
| `POLICY_VERIFICATION_SECRET` | Recommended | Used by policy verification utilities. |

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
MOTOR_API_KEY=generate_secure_random_key
MOTOR_PORTAL_ORIGIN=https://motor-insurance-portal-delta.vercel.app
PUBLIC_API_MAX_FILE_SIZE_MB=5
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

## 13. Postman Collection

Import this JSON into Postman. Set collection variables `baseUrl`, `apiKey`, and `requestNumber`.

```json
{
  "info": {
    "name": "TRINSU Public Motor Insurance API v1",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "https://<your-trinsu-domain>"
    },
    {
      "key": "apiKey",
      "value": "<portal-api-key>"
    },
    {
      "key": "requestNumber",
      "value": "MTR-REQ-2026-000001"
    }
  ],
  "item": [
    {
      "name": "Create Motor Insurance Request",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "x-api-key",
            "value": "{{apiKey}}"
          },
          {
            "key": "Accept",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": [
            {
              "key": "payload",
              "type": "text",
              "value": "{\"customer\":{\"fullName\":\"Ahmed Ali\",\"mobile\":\"+9647700000000\",\"email\":\"ahmed@example.com\",\"nationalId\":\"1234567890\",\"address\":\"Karrada\",\"city\":\"Baghdad\"},\"vehicle\":{\"vehicleType\":\"Sedan\",\"manufacturer\":\"Toyota\",\"model\":\"Camry\",\"manufacturingYear\":2024,\"color\":\"White\",\"plateNumber\":\"BGD-12345\",\"chassisNumber\":\"JTDBR32E720000001\",\"engineNumber\":\"ENG123456\",\"estimatedVehicleValue\":25000},\"notes\":\"Customer prefers WhatsApp updates.\",\"agentCode\":\"AGT-001\"}"
            },
            {
              "key": "vehicleImages",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.nationalIdFront",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.nationalIdBack",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.drivingLicense",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.vehicleRegistration",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.residenceCardFront",
              "type": "file",
              "src": []
            },
            {
              "key": "documents.residenceCardBack",
              "type": "file",
              "src": []
            }
          ]
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/motor-requests",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "public",
            "motor-requests"
          ]
        }
      }
    },
    {
      "name": "Get Request Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-api-key",
            "value": "{{apiKey}}"
          },
          {
            "key": "Accept",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/motor-requests/{{requestNumber}}",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "public",
            "motor-requests",
            "{{requestNumber}}"
          ]
        }
      }
    },
    {
      "name": "Get Uploaded Documents",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-api-key",
            "value": "{{apiKey}}"
          },
          {
            "key": "Accept",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/motor-requests/{{requestNumber}}/documents",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "public",
            "motor-requests",
            "{{requestNumber}}",
            "documents"
          ]
        }
      }
    },
    {
      "name": "Download Policy PDF",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "x-api-key",
            "value": "{{apiKey}}"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/v1/public/motor-requests/{{requestNumber}}/policy",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "v1",
            "public",
            "motor-requests",
            "{{requestNumber}}",
            "policy"
          ]
        }
      }
    }
  ]
}
```

## 14. Security Notes

- API keys must stay in server-side environment variables.
- Do not expose API keys in browser JavaScript, mobile app binaries, or public repositories.
- Validate all user input before sending it, but remember TRINSU also validates everything server-side.
- Use HTTPS only in production.
- Store files in private server storage, not a public static directory.
- Rotate API keys immediately if a portal key is exposed.

## 15. Audit Logging

Successful request creation writes an audit log:

```text
Action: PUBLIC_MOTOR_REQUEST_CREATED
Entity: MotorInsuranceRequest
Metadata: requestNumber, status, API-key fingerprint, user agent, source
IP Address: captured from forwarded headers
Timestamp: database-created audit timestamp
```
