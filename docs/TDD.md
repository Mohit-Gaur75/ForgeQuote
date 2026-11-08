# ForgeQuote — Technical Design Document (TDD)
**AI-Powered RFQ Costing and Quotation Management System**

---

## 1. Executive Summary & Business Context

### 1.1 Client Profile
* **Company**: Company A
* **Location**: Chakan, Pune, Maharashtra, India (Automotive & Heavy Industrial Corridor)
* **Core Business**: Manufacturing high-precision machined and forged components for two-wheelers, commercial tractors, and Tier-1 automotive OEMs.
* **Workforce**: 320 employees.
* **Annual Turnover**: ₹140 – ₹160 Crore.
* **Estimation Department**: 6 dedicated estimation and commercial engineers.

### 1.2 The Existing Workflow & Pain Points
Company A receives RFQs (Requests for Quotation) via customer emails. RFQs arrive with technical drawing PDFs, Excel bill of materials (BOM), material grades, target weights, annual volume schedules, and strict delivery expectations.

Estimators currently perform a cumbersome 18-step manual process:
1. Parse customer email requests manually.
2. Extract customer contact and project metadata.
3. Decipher complex drawing specifications and part notes.
4. Extract structured part dimensions and attributes from Excel sheets.
5. Manually query legacy ERP systems for current raw material prices.
6. Look up machine-hour rates across various machine centers (CNC, VMC, Forging presses).
7. Calculate gross material consumption based on net weight and scrap allowance.
8. Account for scrap recovery valuation.
9. Manually draft operational routings and sequencing.
10. Calculate standard machining and cycle times per operation.
11. Compute machine setup amortisation.
12. Apply factory overhead percentages.
13. Manually add unit packing and freight logistics costs.
14. Add target commercial gross margins.
15. Search shared network folders and physical binders for historical quotations of similar parts.
16. Draft quotation proposals in Microsoft Excel or Word.
17. Route paper/email quotations to the Sales Head for commercial sign-off.
18. Convert approved quotes to PDF and email back to the OEM customer.

### 1.3 Quantified Business Problem
| Metric | Baseline Value | Source / Calculation |
|---|---|---|
| Monthly RFQ Volume | 60 RFQs/month | Commercial log |
| Parts per RFQ | 5 parts/RFQ | Engineering average |
| Estimation Time per Part | 2.5 hours | Time-motion study |
| Estimator Labour Cost | ₹450 / hour | Fully-loaded wage |
| **Annual Estimation Hours** | **9,000 hours** | 60 × 5 × 2.5 × 12 months |
| **Annual Estimation Labour Cost** | **₹40,50,000** | 9,000 hours × ₹450 |
| RFQ Win Rate Loss due to Latency | 5% lost RFQs | Industry benchmark (9-day turnaround) |
| Lost RFQ Opportunities | 36 RFQs/year | 60 × 12 × 5% |
| Average RFQ Contract Value | ₹20,00,000 | Annual contract value average |
| Average Contribution Margin | 12% | Pre-tax operational contribution |
| Annual Contribution per Lost RFQ | ₹2,40,000 | ₹20,00,000 × 12% |
| **Annual Lost Contribution** | **₹86,40,000** | 36 × ₹2,40,000 |
| **Total Quantified Annual Impact** | **₹1,26,90,000 (~₹1.27 Cr)** | ₹40,50,000 (Labour) + ₹86,40,000 (Lost Margin) |

*Note: ₹86.4 Lakh represents lost operational contribution margin (not gross revenue). The ₹40.5 Lakh represents estimation department capacity cost.*

### 1.4 Business Objectives & Success Criteria
1. **Turnaround Compression**: Reduce end-to-end quotation turnaround from **9 working days to 4 working days**.
2. **Estimator Productivity**: Reduce manual estimation time from **2.5 hours to ~1.0 hour per part**.
3. **Rate Centralization**: Single source of truth for raw material, machine-hour, packing, freight, overhead, and GST rates.
4. **Historical Rate Versioning**: Zero overwrite policy; historical quotations retain immutable rate snapshots for lifelong auditability.
5. **AI Data Intake**: Structured extraction of customer, part, weight, and volume parameters with mandatory human-in-the-loop verification.
6. **Intelligent Routing Reuse**: Suggest operational routings from historical similar parts using deterministic multi-parameter similarity.
7. **Automated Approval Routing**: Enforce commercial governance with automated routing for quotes exceeding ₹25,00,000.
8. **Digital PDF Generation**: Produce professional, tamper-proof quotation documents with Indian currency formatting and GST separation.

---

## 2. System Architecture & High-Level Design

### 2.1 Architectural Paradigm: Modular Monolith
ForgeQuote is designed as a **Modular Monolith**. This pattern provides clear modular boundaries, high cohesion, low coupling, and unified deployment without the distributed complexity, network latency, and operational overhead of microservices—making it ideal for an enterprise-grade engineering team or solo SDE assignment.

```
ForgeQuote System Architecture
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Desktop Browser Client                           │
│     React 18 + Vite | Tailwind CSS + shadcn/ui | TanStack Query & Table     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTPS / JSON / Cookies
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Express.js Server                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Middleware Pipeline: Helmet, CORS, RateLimit, Pino, Auth, Role, Zod    │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      ▼                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Business Modules Layer                                                │  │
│  │  ├── auth        ├── rfqs       ├── parts       ├── ai                │  │
│  │  ├── costing     ├── rates      ├── quotations  ├── approvals         │  │
│  │  ├── routings    ├── audit      ├── pdf         └── history           │  │
│  └───────────────────┬───────────────────────────────┬───────────────────┘  │
│                      ▼                               ▼                      │
│  ┌──────────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ Data Access Layer                    │  │ External Integrations       │  │
│  │ Prisma ORM (Client JS)               │  │  ├── OpenAI API (GPT-4o)    │  │
│  └───────────────────┬──────────────────┘  │  └── PDFKit (Vector Engine) │  │
└──────────────────────┼─────────────────────┴─────────────────────────────┘  │
                       │ TCP / SQL (Port 5432)                                
                       ▼                                                      
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PostgreSQL 16 Relational Database                     │
│  UUID Keys | Decimal(12,4) Numeric Types | JSONB Snapshots | Full Audit Log │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack Justification
| Layer | Technology | Justification |
|---|---|---|
| **Language** | JavaScript (ES Modules) | Consistent language across client and server; modern `import/export` syntax without transpilation overhead. |
| **Frontend Framework** | React 18 + Vite | Fast HMR (Hot Module Replacement), component-driven UI, zero build lag. |
| **Styling & Components** | Tailwind CSS + shadcn/ui (Radix) | Clean industrial SaaS aesthetic, accessible primitives, zero runtime style cost. |
| **Client State / Cache** | TanStack Query v5 + Table v8 | Powerful server-state caching, automatic invalidation, enterprise-grade data grid. |
| **Backend Framework** | Node.js + Express.js | Mature, lightweight HTTP routing with extensive middleware ecosystem. |
| **Database & ORM** | PostgreSQL 16 + Prisma ORM | ACID transactions, strict relational constraints, native JSONB support, type-safe query generation. |
| **Financial Arithmetic** | `decimal.js` | Arbitrary-precision decimal arithmetic avoiding IEEE 754 floating-point inaccuracies. |
| **Password Hashing** | `argon2` (Argon2id) | Memory-hard password hashing algorithm, winner of the Password Hashing Competition. |
| **Document Generation** | `pdfkit` | Server-side programmatic PDF generation with vector precision and Indian currency formatting. |
| **Containerization** | Docker & Docker Compose | Container parity across development and production environments. |

---

## 3. End-to-End User Journeys

### 3.1 Journey 1: Estimator Workflow
```
[Login as Estimator]
        │
        ▼
[Create RFQ] ── Enter Customer, Due Date, Upload/Paste Email & BOM text
        │
        ▼
[AI Extraction] ── System extracts Customer, Parts, Weights, Volumes with Confidence Scores
        │
        ▼
[Human Verification] ── Estimator reviews each field (Accept / Edit / Reject)
        │
        ▼
[Part Workspace] ── Add/Edit Part details (Net weight, Scrap %, Annual Volume)
        │
        ▼
[Routing Suggestion] ── System compares part with historical records (Material, Weight, Name)
        │                Estimator reviews top 3 suggestions and applies operation sequence
        ▼
[Configure Operations] ── Specify Cycle Times, Machine Rates, Setup Hours
        │
        ▼
[Deterministic Costing] ── System calculates Material, Conversion, Setup, Overhead, Freight
        │                  Generates 50%, 100%, 150% volume tiers side-by-side
        ▼
[Create Quotation] ── Snapshots immutable rate versions and calculation payloads
        │
        ▼
[Submit for Approval] ── If Annual Value > ₹25 Lakh ➔ PENDING_APPROVAL
                         If Annual Value ≤ ₹25 Lakh ➔ READY_TO_SEND
```

### 3.2 Journey 2: Plant Head Routing Feasibility Workflow ("Checks Routings")
```
[Login as Plant Head]
        │
        ▼
[Routing Checks Screen (/routing-checks)] ── Lists parts across active RFQs
        │
        ▼
[Inspect Operations] ── Review CNC/VMC bays, cycle times, fixture setup hours, machines
        │
   ┌────┴───────────────────────────┐
   ▼                                ▼
[Verify Feasibility]            [Request Revision]
Verifies machine bay capacity   Flags bottleneck cycle time or tooling gap
Status ➔ VERIFIED               Status ➔ REVISION_REQUIRED
        │                               │
        ▼                               ▼
[Cleared for Production]        [Estimator revises routing parameters]
```

### 3.3 Journey 3: Sales Head Commercial Approval Workflow ("Approves and Sends")
```
[Login as Sales Head]
        │
        ▼
[Approval Inbox] ── Filtered list of Quotations in PENDING_APPROVAL state (> ₹25L ACV)
        │
        ▼
[Review Quotation] ── Inspect Part Cost Breakdown, Margin (%), Volume Tiers, Rate Snapshots
        │
   ┌────┴───────────────────────────┐
   ▼                                ▼
[Approve]                       [Reject]
Enter approval comment          Enter mandatory rejection comment
Status ➔ APPROVED               Status ➔ REJECTED
        │                               │
        ▼                               ▼
[Simulate Send to Customer]     [Estimator Notified to Revise]
Status ➔ SENT
Download Official PDF
```

### 3.4 Journey 4: Managing Director Executive Deal Closure ("Signs the Deal")
```
[Login as Managing Director]
        │
        ▼
[Executive Deal Room (/deal-room)] ── Qualified quotation pipeline with Annual Contract Values
        │
        ▼
[Review Commercial Offer] ── High-value OEM terms, volume pricing, manufacturing margins
        │
        ▼
[Sign Deal as MD] ── Applies SHA-256 digital contract seal (mdSignatureHash)
        │
        ▼
[Deal Won & Countersigned] ── Transitions RFQ to WON, prints executive 3-box signature block on PDF
```

---

## 4. Detailed Component Design

### 4.1 Module Decomposition
1. **Auth Module (`src/modules/auth`)**:
   - Session-based authentication using opaque 32-byte tokens.
   - Tokens hashed with SHA-256 before database storage.
   - Session cookies configured as `HttpOnly`, `SameSite=Strict`, and `Secure` (in production).
2. **RFQ Module (`src/modules/rfqs`)**:
   - Sequential RFQ number generator (`RFQ-YYYY-NNNN`).
   - Automated overdue detection: `dueDate < NOW() AND status NOT IN ('SENT', 'WON', 'LOST')`.
   - Estimators restricted to assigned/owned RFQs; Sales Head has cross-organizational visibility.
3. **AI Intake Module (`src/modules/ai`)**:
   - Encapsulated behind `AIProvider` interface.
   - Calls OpenAI API with strict JSON schema instructions.
   - Generates confidence rating (`High`, `Medium`, `Low`, `Missing`) and verbatim source excerpts.
   - SHA-256 input hashing prevents redundant token consumption.
4. **Costing Module (`src/modules/costing`)**:
   - Isolated functional architecture using `decimal.js`.
   - Independent modules for material, conversion, setup, overhead, pricing, and GST.
   - Support for 3 dynamic volume tiers (50%, 100%, 150%).
5. **Rate Master Module (`src/modules/rates`)**:
   - Append-only versioning. Overlapping date windows for identical rate keys are blocked.
   - Time-travel queries: `effectiveFrom <= T AND (effectiveTo IS NULL OR T < effectiveTo)`.
6. **Quotations Module (`src/modules/quotations`)**:
   - Single-transaction atomic creation of Quotation, QuotationPart, QuotationTier, and QuotationRateSnapshot.
   - Immutable JSONB calculation snapshot preserves the exact math at the moment of quote creation.
7. **Approval Module (`src/modules/approvals`)**:
   - Enforces the ₹25,00,000 threshold based on 100% volume tier pre-GST contract value.
   - Self-approval strictly forbidden at the database and service layer.
8. **Routing Similarity Engine (`src/modules/routings`)**:
   - Multi-factor deterministic scoring:
     $$\text{Score} = 0.35 M + 0.25 N + 0.20 W + 0.10 C + 0.10 O$$
   - Returns top 3 historical matches without hallucination.
9. **PDF Generation Module (`src/modules/pdf`)**:
   - PDFKit pipeline rendering vector tables, terms, company headers, and two-column tax invoices.

---

## 5. Security & Governance Architecture

### 5.1 Authentication & Session Life Cycle
* Password hashing: `argon2id` with `timeCost: 3`, `memoryCost: 65536` (64 MB), `parallelism: 4`.
* Session Tokens: `crypto.randomBytes(32).toString('hex')`.
* Database Storage: SHA-256 hash of token to prevent session hijacking if DB is compromised.
* Expiry: 24-hour absolute expiry; updated `lastActivityAt` on valid requests.

### 5.2 Role-Based Access Control (RBAC)
| Action | ESTIMATOR | PLANT_HEAD | SALES_HEAD | MANAGING_DIRECTOR | Enforcement Point |
|---|:---:|:---:|:---:|:---:|---|
| View Owned RFQs | Yes | Yes | Yes | Yes | DB query filter (`ownerId`) |
| View All RFQs | No | Yes | Yes | Yes | Service Layer Guard |
| Create / Update RFQ | Yes | No | Yes | Yes | Route Middleware (`requireRole`) |
| Execute AI Extraction | Yes | No | Yes | No | Route Middleware (`requireRole`) |
| Edit Part & Costing | Yes | No | No | No | Route Middleware (`requireRole`) |
| Inspect Routing Checks | Yes | Yes | Yes | Yes | Route Middleware (`requireRole`) |
| Sign-off Routing Feasibility | No | Yes | No | No | Route Middleware (`requireRole`) |
| Create Quotation | Yes | No | No | No | Route Middleware (`requireRole`) |
| Manage Rate Masters | Read Only | Read Only | Create / Update | Create / Update | Route Middleware (`requireRole`) |
| Access Approval Inbox | No | No | Yes | No | Route Middleware (`requireRole`) |
| Approve / Reject Quote (> ₹25L) | No | No | Yes | No | Service Layer + Anti-Self-Approval |
| Access Executive Deal Room | No | No | Yes | Yes | Route Middleware (`requireRole`) |
| Sign Deal as MD (Digital Seal) | No | No | No | Yes | Route Middleware (`requireRole`) |
| Mark RFQ Won / Lost | No | No | Yes | Yes | Route Middleware (`requireRole`) |

### 5.3 Audit Trail Design
Every state-changing mutation triggers an atomic write to `AuditLog`:
* `userId`: Actor UUID.
* `action`: `CREATE_RFQ`, `UPDATE_COSTING`, `APPROVE_QUOTATION`, `REJECT_QUOTATION`, etc.
* `entityType`: `RFQ`, `PART`, `QUOTATION`, `RATE_MASTER`.
* `entityId`: Target resource UUID.
* `oldValues`: JSONB snapshot before mutation.
* `newValues`: JSONB snapshot after mutation.
* `createdAt`: UTC timestamp.

---

## 6. Testing Strategy

### 6.1 Unit Testing (Vitest)
* **Costing Engine Verification**: Direct regression tests against reference parts:
  - Part A (Rear Wheel Spindle): Target final price ₹149.56.
  - Part B (Hydraulic Lift Arm): Target final price ₹1,205.56.
  - Part C (Gear Blank): Target final price ₹399.01.
* **Edge Cases**: Zero scrap, 0 setup hours, margin $\ge 100\%$ validation, missing rate versions.
* **Rate Overlap**: Verifying constraint logic rejects overlapping validity dates.

### 6.2 Integration Testing (Supertest)
* Complete HTTP lifecycle testing:
  - Session cookie setting and clearing.
  - Role barrier enforcement (401 vs 403).
  - Quotation state transitions (preventing send before approval).

### 6.3 End-to-End Testing (Playwright)
* Automated browser simulation of the complete 16-step flow:
  1. Login as `estimator@forgequote.demo`.
  2. Create RFQ & paste sample email.
  3. Run AI extraction & verify field badges.
  4. Save part & apply suggested routing.
  5. Compute 3 tiers and submit quote.
  6. Login as `sales@forgequote.demo`.
  7. Review pending quote & approve with comment.
  8. Download PDF and confirm simulated send status.

---

## 7. Known Limitations & Future Roadmap
* **CAD/Drawing OCR**: Computer Vision parsing of 2D/3D CAD geometry is deferred to v2.0; estimators manually verify geometry.
* **ERP Ingestion**: Live bidirectional sync with SAP/Tally deferred; rates managed via RateMaster module.
* **Multi-tenant Isolation**: System currently scoped for single-company operations (Company A). Multi-tenant schema planned for SaaS commercialization.
