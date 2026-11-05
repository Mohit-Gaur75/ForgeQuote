# ForgeQuote — REST API Specification

**Base URL**: `/api/v1`  
**Protocol**: HTTPS (Production) / HTTP (Local Development)  
**Authentication**: Session-based cookie (`forgequote_session`) or Bearer header  
**Data Format**: JSON (`application/json`)

---

## 1. Global Standards & Conventions

### 1.1 Request Headers
| Header | Type | Description |
|---|---|---|
| `Content-Type` | `application/json` | Required for all `POST`, `PUT`, `PATCH` bodies |
| `Accept` | `application/json` | Expected response format (or `application/pdf` for PDF downloads) |
| `X-Request-Id` | `string` (UUID) | Optional client-generated request correlation ID. If omitted, server generates one. |

### 1.2 Standard Success Envelope
All successful 2xx responses return a consistent JSON wrapper:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 142,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### 1.3 Standard Error Envelope
All error 4xx and 5xx responses return a consistent JSON wrapper:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "netWeightKg",
        "message": "Net weight must be greater than 0"
      }
    ]
  },
  "requestId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

### 1.4 Common HTTP Status Codes
* `200 OK`: Request succeeded (GET, PATCH, PUT).
* `201 Created`: Resource successfully created (POST).
* `204 No Content`: Resource successfully deleted (DELETE).
* `400 Bad Request`: Input validation failed (Zod schema mismatch).
* `401 Unauthorized`: Authentication required or session expired.
* `403 Forbidden`: Authenticated user lacks required role or ownership.
* `404 Not Found`: Target entity does not exist.
* `409 Conflict`: Business state conflict (e.g. overlapping rate version or invalid quotation transition).
* `422 Unprocessable Entity`: Business rule failure (e.g. gross margin $\ge 100\%$).
* `429 Too Many Requests`: Rate limit reached.
* `500 Internal Server Error`: Unexpected unhandled error (stack traces hidden in production).
* `503 Service Unavailable`: External provider (e.g. OpenAI) unreachable.

---

## 2. Authentication Endpoints (`/auth`)

### 2.1 User Login
* **Method & Route**: `POST /auth/login`
* **Access**: Public
* **Description**: Verifies email and Argon2id password hash, creates session in PostgreSQL, returns user object, and sets `forgequote_session` HTTP-only cookie.
* **Request Body**:
```json
{
  "email": "estimator@forgequote.demo",
  "password": "Estimator@123"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "e8a93946-bdf8-4b71-b0db-529a67e81084",
      "name": "Rajesh Kumar (Estimator)",
      "email": "estimator@forgequote.demo",
      "role": "ESTIMATOR",
      "isActive": true
    }
  },
  "requestId": "1d8bf638-3485-4db2-9426-3d231936c7a7"
}
```

### 2.2 User Logout
* **Method & Route**: `POST /auth/logout`
* **Access**: Authenticated
* **Description**: Deletes the server-side session record and clears the session cookie.
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": { "message": "Successfully logged out" },
  "requestId": "7d9cbf63-8885-4db2-9426-3d231936c111"
}
```

### 2.3 Get Current User Session
* **Method & Route**: `GET /auth/me`
* **Access**: Authenticated
* **Description**: Returns the active authenticated user profile.
* **Response (200 OK)**: User profile object.

---

## 3. RFQ Management Endpoints (`/rfqs`)

### 3.1 List RFQs
* **Method & Route**: `GET /rfqs`
* **Access**: Authenticated (`ESTIMATOR` sees owned; `SALES_HEAD` sees all)
* **Query Parameters**:
  * `page` (default: 1)
  * `limit` (default: 20)
  * `search` (matches `rfqNumber` or `customerName`)
  * `status` (`ESTIMATING`, `SENT`, `WON`, `LOST`)
  * `ownerId` (filter by owner UUID)
  * `isOverdue` (`true` / `false`)
  * `sort` (`dueDate:asc`, `createdAt:desc`)
* **Response (200 OK)**: Array of RFQ summary cards with part counts and calculated annual values.

### 3.2 Create RFQ
* **Method & Route**: `POST /rfqs`
* **Access**: `ESTIMATOR`
* **Request Body**:
```json
{
  "customerName": "Bajaj Auto Ltd",
  "customerType": "Two-Wheeler OEM",
  "receivedAt": "2026-11-01T10:00:00.000Z",
  "dueDate": "2026-11-15T18:00:00.000Z"
}
```
* **Response (201 Created)**: Created RFQ record with auto-assigned `rfqNumber: "RFQ-2026-0001"`.

### 3.3 Get RFQ by ID
* **Method & Route**: `GET /rfqs/:id`
* **Access**: Authenticated
* **Response (200 OK)**: Detailed RFQ including parts array, operations, extractions, and quotation summaries.

### 3.4 Update RFQ Details
* **Method & Route**: `PATCH /rfqs/:id`
* **Access**: `ESTIMATOR` (Owner only)
* **Request Body**: Partial RFQ fields (`customerName`, `dueDate`, `customerType`).

### 3.5 Update RFQ Status (Won / Lost)
* **Method & Route**: `PATCH /rfqs/:id/status`
* **Access**: `SALES_HEAD`
* **Request Body**:
```json
{
  "status": "WON",
  "lostReason": null
}
```

### 3.6 Export RFQ Bill of Materials to Excel (.xlsx)
* **Method & Route**: `GET /rfqs/:id/export-excel`
* **Access**: Authenticated
* **Response**: Binary Excel file (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`) containing multi-sheet BOM and manufacturing routing tables generated via ExcelJS.

---

## 4. AI Intake Endpoints (`/rfqs/:id/extract`)

### 4.1 Execute AI Extraction
* **Method & Route**: `POST /rfqs/:id/extract`
* **Access**: `ESTIMATOR`
* **Description**: Accepts pasted email and part-list text, queries OpenAI API with structured JSON output, stores `AIExtraction` row with input hash, and returns parsed fields with confidence ratings and source excerpts.
* **Request Body**:
```json
{
  "emailText": "Dear Rajesh, Please quote for Rear Wheel Spindle in EN8 material. Quantity: 180,000 units/year. Drawing attached. Due date: 15 Nov 2026. Thanks, Bajaj Auto.",
  "partListText": "Item: Rear Wheel Spindle, Net Wt: 0.61 kg, Annual Vol: 180000"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "extractionId": "5e13d527-2c5e-4c07-b371-34d2be734267",
    "customerName": {
      "value": "Bajaj Auto",
      "confidence": 0.99,
      "sourceType": "EMAIL",
      "sourceText": "Thanks, Bajaj Auto.",
      "verificationStatus": "PENDING"
    },
    "parts": [
      {
        "partName": {
          "value": "Rear Wheel Spindle",
          "confidence": 0.98,
          "sourceType": "EMAIL",
          "sourceText": "Rear Wheel Spindle in EN8 material"
        },
        "material": {
          "value": "EN8",
          "confidence": 0.99,
          "sourceType": "EMAIL",
          "sourceText": "in EN8 material"
        },
        "netWeightKg": {
          "value": 0.61,
          "confidence": 0.98,
          "sourceType": "PART_LIST",
          "sourceText": "Net Wt: 0.61 kg"
        },
        "annualVolume": {
          "value": 180000,
          "confidence": 0.99,
          "sourceType": "EMAIL",
          "sourceText": "Quantity: 180,000 units/year"
        }
      }
    ],
    "dueDate": {
      "value": "2026-11-15T00:00:00.000Z",
      "confidence": 0.95,
      "sourceType": "EMAIL",
      "sourceText": "Due date: 15 Nov 2026"
    },
    "warnings": []
  }
}
```

### 4.2 List RFQ Extractions
* **Method & Route**: `GET /rfqs/:id/extractions`
* **Access**: Authenticated

### 4.3 Confirm / Accept Extracted Data
* **Method & Route**: `POST /rfqs/:id/extractions/:extractionId/confirm`
* **Access**: `ESTIMATOR`
* **Description**: Commits human-verified extracted fields to the database as official `Part` records.

---

## 5. Parts Management Endpoints (`/parts`)

### 5.1 Add Part to RFQ
* **Method & Route**: `POST /rfqs/:id/parts`
* **Access**: `ESTIMATOR`
* **Request Body**:
```json
{
  "partNumber": "SP-001",
  "partName": "Rear wheel spindle",
  "material": "EN8",
  "grossWeightKg": null,
  "netWeightKg": 0.61,
  "scrapPercentage": 5.0,
  "annualVolume": 180000,
  "setupHours": 2.0
}
```

### 5.2 Update Part
* **Method & Route**: `PATCH /parts/:id`
* **Access**: `ESTIMATOR`

### 5.3 Delete Part
* **Method & Route**: `DELETE /parts/:id`
* **Access**: `ESTIMATOR`

---

## 6. Routing Suggestions (`/parts/:id/routing-suggestions`)

### 6.1 Get Similarity Suggestions
* **Method & Route**: `POST /parts/:id/routing-suggestions`
* **Access**: `ESTIMATOR`
* **Description**: Compares target part against historical database parts using the deterministic formula:
  $$\text{Score} = 0.35M + 0.25N + 0.20W + 0.10C + 0.10O$$
* **Response (200 OK)**: Top 3 matching historical parts with similarity scores and operational sequences.

### 6.2 Apply Routing Suggestion
* **Method & Route**: `POST /parts/:id/apply-routing-suggestion`
* **Access**: `ESTIMATOR`
* **Request Body**:
```json
{
  "sourcePartId": "a90892f3-1824-4f9d-83b3-f09b537c3581"
}
```

---

## 7. Rate Master Endpoints (`/rates`)

### 7.1 List Master Rates
* **Method & Route**: `GET /rates`
* **Access**: Authenticated
* **Query Parameters**: `rateType` (`MATERIAL`, `MACHINE_HOUR`, `OVERHEAD`, `PACKING`, `FREIGHT`, `GST`)

### 7.2 Create New Rate Version
* **Method & Route**: `POST /rates`
* **Access**: `SALES_HEAD`
* **Description**: Creates a new immutable rate version. Verifies that the new effective period does not overlap with existing versions for the same key.
* **Request Body**:
```json
{
  "rateType": "MATERIAL",
  "rateName": "EN8 Bar Stock",
  "materialGrade": "EN8",
  "rateValue": 88.50,
  "unit": "INR/kg",
  "effectiveFrom": "2026-12-01T00:00:00.000Z",
  "effectiveTo": null
}
```

### 7.3 Get Rate Version History
* **Method & Route**: `GET /rates/:id/history`
* **Access**: Authenticated

### 7.4 Get Effective Rates at Date
* **Method & Route**: `GET /rates/effective`
* **Query Parameters**: `at` (ISO 8601 date string, default: current timestamp)
* **Description**: Returns the active rate for all keys effective at time $T$.

---

## 8. Deterministic Costing Endpoints (`/parts/:id/costing`)

### 8.1 Live Costing Preview (Transient)
* **Method & Route**: `POST /parts/:id/calculate`
* **Access**: `ESTIMATOR`
* **Description**: Calculates exact cost breakdowns and 3 volume tiers using `decimal.js`. Does not persist.
* **Request Body**:
```json
{
  "materialRate": 85.00,
  "scrapPercentage": 5.0,
  "operations": [
    {
      "operationName": "CNC Turning",
      "machineType": "CNC Lathe",
      "cycleTimeMinutes": 3.2,
      "machineHourRate": 850.00,
      "setupHours": 2.0
    }
  ],
  "overheadPercentage": 4.0,
  "packingPerUnit": 4.00,
  "freightPerUnit": 2.00,
  "grossMarginPercentage": 15.0,
  "gstPercentage": 18.0
}
```
* **Response (200 OK)**: Complete mathematical breakdown matching reference values:
  - Material Cost: ₹54.58
  - Conversion Cost: ₹45.33
  - Setup Cost: ₹0.01
  - Overhead: ₹1.81
  - Packing: ₹4.00
  - Freight: ₹2.00
  - Total Unit Cost: ₹107.74
  - Selling Price Before GST: ₹126.75
  - GST: ₹22.82
  - Final Unit Price: ₹149.56
  - Volume Tiers: 50% (90,000), 100% (180,000), 150% (270,000)

### 8.2 Save Configured Costing
* **Method & Route**: `POST /parts/:id/save-costing`
* **Access**: `ESTIMATOR`
* **Description**: Persists the operations and parameters for the part.

---

## 9. Quotations & Approvals Endpoints (`/quotations`, `/approvals`)

### 9.1 Create Quotation
* **Method & Route**: `POST /rfqs/:id/quotations`
* **Access**: `ESTIMATOR`
* **Description**: Freezes rates into `QuotationRateSnapshot` and captures calculation state into `calculationSnapshot` JSONB.

### 9.2 Submit Quotation for Commercial Approval
* **Method & Route**: `POST /quotations/:id/submit`
* **Access**: `ESTIMATOR`
* **Description**: Evaluates the ₹25,00,000 rule:
  - If Annual Contract Value $\ge$ ₹25,00,000 $\rightarrow$ `PENDING_APPROVAL`
  - If Annual Contract Value $<$ ₹25,00,000 $\rightarrow$ `READY_TO_SEND`

### 9.3 Get Pending Approvals
* **Method & Route**: `GET /approvals/pending`
* **Access**: `SALES_HEAD`

### 9.4 Approve Quotation
* **Method & Route**: `POST /quotations/:id/approve`
* **Access**: `SALES_HEAD`
* **Request Body**:
```json
{
  "comment": "Commercial margin of 15% accepted based on volume commitment."
}
```

### 9.5 Reject Quotation
* **Method & Route**: `POST /quotations/:id/reject`
* **Access**: `SALES_HEAD`
* **Request Body**:
```json
{
  "comment": "Increase margin to 18% due to high tool wear on 40Cr4 forging."
}
```

### 9.6 Download Quotation PDF
* **Method & Route**: `GET /quotations/:id/pdf`
* **Access**: Authenticated
* **Response**: Binary stream with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="QT-2026-0001.pdf"`.

### 9.7 Simulated Send to Customer
* **Method & Route**: `POST /quotations/:id/send`
* **Access**: `SALES_HEAD`
* **Description**: Marks quotation as `SENT`. Clearly logged and documented as a simulation.

---

## 10. Historical Search & Audit Endpoints

### 10.1 Search Historical Quotations
* **Method & Route**: `GET /history/search`
* **Access**: Authenticated
* **Query Parameters**: `partName`, `material`, `customerName`, `minWeight`, `maxWeight`, `dateFrom`, `dateTo`

### 10.2 Get Entity Audit Trail
* **Method & Route**: `GET /audit/:entityType/:entityId`
* **Access**: `SALES_HEAD`
* **Response (200 OK)**: Full change history with user IDs, timestamps, old values, and new values.
