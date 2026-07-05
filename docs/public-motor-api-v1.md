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
Content-Type: application/json
```

File uploads use the Vercel Blob client upload flow. Upload files directly from the browser first, then send only JSON metadata to `POST /motor-requests`.

## 5. All Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/public/motor-request-uploads` | Issue a Vercel Blob client upload token. |
| `DELETE` | `/api/public/motor-request-uploads` | Delete already uploaded public motor blobs during client-side cleanup. |
| `POST` | `/api/public/motor-requests` | Create a motor insurance request. |
| `GET` | `/api/public/motor-requests/track/{trackingNumber}` | Track request status by tracking number. |
| `GET` | `/api/v1/public/motor-requests/track/{trackingNumber}` | Track request status by tracking number. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}` | Retrieve request status and summary. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}/documents` | Retrieve uploaded document metadata and Blob URLs. |
| `GET` | `/api/v1/public/motor-requests/{requestNumber}/policy` | Download issued policy PDF when available. Currently returns `404` until a policy is linked. |

## 6. Create Motor Insurance Request

```http
POST /api/public/motor-requests
```

Content type:

```text
application/json
```

`multipart/form-data` is no longer accepted by this endpoint.

### Direct Upload Flow

1. Browser uploads every file directly to Vercel Blob with `@vercel/blob/client`.
2. Browser collects each Blob URL plus original `name`, `type`, and `size`.
3. Browser sends one JSON-only request to `/api/public/motor-requests`.
4. TRINSU validates metadata and saves Blob URLs in PostgreSQL.

Upload token endpoint:

```http
POST /api/public/motor-request-uploads
```

Use it as the `handleUploadUrl` in the official Blob client `upload()` call.

Cleanup endpoint:

```http
DELETE /api/public/motor-request-uploads
Content-Type: application/json

{ "urls": ["https://...blob.vercel-storage.com/..."] }
```

Call cleanup if a later upload or the final JSON submit fails.

Allowed uploaded file metadata:

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `vehicleImages` | Array | Yes | Minimum 5 Blob metadata objects. JPG, JPEG, PNG, WEBP, HEIC, HEIF. |
| `documents` | Array | Yes | Must contain all required document keys. Image types above or PDF. |

Default maximum file size:

```text
10 MB per file
```

Server variables:

```text
PUBLIC_API_MAX_FILE_SIZE_MB=10
PUBLIC_API_MAX_TOTAL_PAYLOAD_SIZE_MB=25
```

TRINSU saves only Blob file metadata in the database.

### Request Body Example

The request body must be JSON:

```json
{
  "payload": {
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
  },
  "vehicleImages": [
    { "url": "https://example.public.blob.vercel-storage.com/front.jpg", "name": "front.jpg", "type": "image/jpeg", "size": 123456 }
  ],
  "documents": [
    { "key": "nationalIdFront", "url": "https://example.public.blob.vercel-storage.com/national-id-front.pdf", "name": "national-id-front.pdf", "type": "application/pdf", "size": 123456 }
  ]
}
```

### Success Response

HTTP `201`

```json
{
  "success": true,
  "requestId": "cmtr...",
  "requestNumber": "MTR-REQ-2026-000001",
  "trackingNumber": "MTR-REQ-2026-000001",
  "message": "Request submitted successfully"
}
```

### JavaScript fetch() Example

```ts
import { upload } from "@vercel/blob/client";

async function uploadMotorFile(file: File, clientPayload: unknown) {
  const blob = await upload(
    `public-motor-requests/uploads/${crypto.randomUUID()}-${file.name}`,
    file,
    {
      access: "public",
      handleUploadUrl: `${baseUrl}/api/public/motor-request-uploads`,
      headers: { "x-api-key": apiKey },
      clientPayload: JSON.stringify(clientPayload),
      contentType: file.type,
      multipart: true
    }
  );

  return { url: blob.url, name: file.name, type: file.type, size: file.size };
}

const vehicleImages = await Promise.all(
  vehicleImageFiles.map((file) => uploadMotorFile(file, { kind: "vehicleImage", name: file.name, type: file.type, size: file.size }))
);

const documents = await Promise.all(documentFiles.map(async ({ key, file }) => ({
  key,
  ...(await uploadMotorFile(file, { kind: "document", key, name: file.name, type: file.type, size: file.size }))
})));

const response = await fetch(`${baseUrl}/api/public/motor-requests`, {
  method: "POST",
  headers: {
    "x-api-key": apiKey,
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ payload, vehicleImages, documents })
});

const result = await response.json();
if (!response.ok || result.success !== true) {
  throw new Error(result.message ?? "Request failed");
}

showSuccessMessage(result.message);
window.location.assign(`/confirmation?requestId=${encodeURIComponent(result.requestId)}`);
```

### Axios Example

```ts
import axios from "axios";

const { data } = await axios.post(
  `${baseUrl}/api/public/motor-requests`,
  { payload, vehicleImages, documents },
  {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json",
      "Content-Type": "application/json"
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

## 7.1 Track Request By Tracking Number

```http
GET /api/public/motor-requests/track/{trackingNumber}
```

The tracking number is trimmed and must not be empty. This endpoint uses the same
`x-api-key` protection and public motor CORS policy as request creation.

Current database statuses are adapted to the public tracking statuses:

| Database status | Public status |
| --- | --- |
| `DRAFT` | `RECEIVED` |
| `SUBMITTED` | `RECEIVED` |
| `UNDER_REVIEW` | `UNDER_REVIEW` |
| `NEEDS_INFO` | `DOCUMENTS_CHECK` |
| `APPROVED` | `COMPLETED` |
| `REJECTED` | `REJECTED` |

Public status labels:

| Public status | Arabic label |
| --- | --- |
| `RECEIVED` | `تم استلام الطلب` |
| `UNDER_REVIEW` | `قيد المراجعة` |
| `DOCUMENTS_CHECK` | `تدقيق المستندات` |
| `QUOTE_PREPARATION` | `إعداد العرض` |
| `CONTACTING_CUSTOMER` | `التواصل معك` |
| `COMPLETED` | `مكتمل` |
| `REJECTED` | `مرفوض` |

### Response Body Example

HTTP `200`

```json
{
  "trackingNumber": "MTR-REQ-2026-000001",
  "requestNumber": "MTR-REQ-2026-000001",
  "status": "UNDER_REVIEW",
  "statusLabel": "قيد المراجعة",
  "updatedAt": "2026-07-03T12:00:00.000Z",
  "customerName": "Ahmed Ali",
  "vehicle": "Toyota Camry 2024"
}
```

HTTP `400`

```json
{
  "message": "Invalid tracking number"
}
```

HTTP `404`

```json
{
  "message": "Request not found"
}
```

### cURL Example

```bash
curl -X GET "{{baseUrl}}/api/public/motor-requests/track/MTR-REQ-2026-000001" \
  -H "x-api-key: {{apiKey}}" \
  -H "Accept: application/json"
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
| `PUBLIC_API_MAX_FILE_SIZE_MB` | No | Maximum upload size per file. Defaults to `10`. |
| `PUBLIC_API_MAX_TOTAL_PAYLOAD_SIZE_MB` | No | Maximum total size represented by submitted Blob metadata. Defaults to `25`. |
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
