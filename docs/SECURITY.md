# ForgeQuote — Security Architecture & Threat Model

**Compliance Target**: Enterprise Manufacturing SaaS Standards  
**Authentication**: Argon2id Hashing + Opaque 32-Byte Server-Side Sessions  
**Transport Security**: TLS 1.3 / HTTPS (Production)  
**Threat Mitigation**: OWASP Top 10 Protections (XSS, CSRF, Injection, Broken Access Control)

---

## 1. Security Architecture Summary

```
ForgeQuote Defense-in-Depth Model
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 1: Network & Edge Security                                            │
│ - Helmet.js (HSTS, CSP, X-Frame-Options, No-Sniff)                          │
│ - Strict CORS Allowlist (Specific Frontend Origin, Credentials Enabled)     │
│ - Dual-Tier Rate Limiting (Global 100 req/15m, Auth 10 req/15m)              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 2: Transport & Session Security                                       │
│ - 32-byte Cryptographic Opaque Session Tokens (`crypto.randomBytes`)        │
│ - Database Session Storage: SHA-256 Hashed Tokens (No plaintext in DB)       │
│ - Cookies: HttpOnly, SameSite=Strict, Secure (in production), Path=/         │
│ - Inactivity Timeout & 24-Hour Absolute Session Expiry                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 3: Identity & Access Management (IAM)                                 │
│ - Password Hashing: Argon2id (64MB memory cost, 3 iterations, 4 parallelism) │
│ - Strict Backend RBAC Middleware (`requireRole('ESTIMATOR' | 'SALES_HEAD')`) │
│ - Data-Level Ownership Filtering (`WHERE owner_id = req.user.id`)            │
│ - Anti-Self-Approval Business Guard (Creator cannot approve own quotation)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 4: Application & Data Protection                                      │
│ - Strict Input Validation & Type Casting via Zod Schemas                    │
│ - Parameterized SQL Queries via Prisma ORM (Zero Raw String SQL)             │
│ - Sanitized JSON Error Envelope (No stack traces in production)             │
│ - Redacted Pino Structured Logging (Passwords, tokens, raw RFQ text masked)  │
│ - Immutable Audit Trail (`audit_logs` table tracking all mutations)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Credential Storage

### 2.1 Password Hashing with Argon2id
Passwords are never stored in plaintext. Passwords are encrypted using **Argon2id**, the modern state-of-the-art memory-hard algorithm designed to resist GPU/ASIC cracking attacks.

* **Algorithm**: `argon2id` (v13)
* **Memory Cost**: `65536` KB (64 MB per hash)
* **Time Cost**: `3` iterations
* **Parallelism**: `4` threads
* **Implementation**:
```javascript
import argon2 from 'argon2';

export async function hashPassword(plaintext) {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4
  });
}

export async function verifyPassword(hash, plaintext) {
  return argon2.verify(hash, plaintext);
}
```

### 2.2 Opaque Session Tokens vs Stateless JWTs
ForgeQuote deliberately rejects client-side stateless JWTs for primary user sessions. JWTs cannot be revoked instantly if an employee leaves the company or a laptop is compromised without maintaining a distributed token blacklist.

Instead, ForgeQuote utilizes **Opaque Server-Side Sessions**:
1. Upon successful login, the server generates a 32-byte cryptographically secure random token:
   ```javascript
   const rawToken = crypto.randomBytes(32).toString('hex');
   ```
2. The server computes the SHA-256 hash of this token:
   ```javascript
   const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
   ```
3. Only `tokenHash` is saved in the `sessions` table in PostgreSQL along with `userId` and `expiresAt`.
4. The unhashed `rawToken` is transmitted to the client in an `HttpOnly` cookie.
5. If the database is dumped or leaked, the attacker cannot reverse the SHA-256 hashes to impersonate active user sessions.
6. Immediate server-side logout is guaranteed via `DELETE FROM sessions WHERE token_hash = $1`.

---

## 3. Cookie Security & Cross-Site Defenses

### 3.1 Cookie Configuration
Session cookies are sent with strict security flags:
```javascript
res.cookie('forgequote_session', rawToken, {
  httpOnly: true,                               // Inaccessible to client JavaScript (XSS immune)
  secure: env.COOKIE_SECURE === true,           // Enforces HTTPS transmission
  sameSite: 'strict',                           // Blocks CSRF across third-party websites
  maxAge: 24 * 60 * 60 * 1000,                  // 24 hours in milliseconds
  path: '/'                                     // Accessible across all application routes
});
```

### 3.2 Cross-Site Request Forgery (CSRF) Protection
By enforcing `SameSite=Strict` on the session cookie, modern browsers refuse to attach the cookie to any cross-origin HTTP request. Even if a user visits a malicious external link or phishing page, no state-changing request can be dispatched against the ForgeQuote API with authenticated privileges.

---

## 4. Role-Based Access Control (RBAC) & Ownership Protection

### 4.1 Backend Role Enforcement
Frontend UI element hiding (disabling buttons or hiding navigation links) is strictly treated as visual convenience, never security. Every single endpoint executes backend authorization middleware before invoking service business logic.

```javascript
// Middleware: requireRole.js
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError('Insufficient privileges for this action');
    }
    next();
  };
}
```

### 4.2 Anti-Self-Approval Rule
A core compliance rule in manufacturing quotation governance is preventing estimation fraud or unauthorized commercial discounts.

**Rule**: An Estimator who created a quotation can **never** approve it, even if they possess elevated roles or attempt to call the `/approve` endpoint directly.
```javascript
// approvals.service.js
export async function approveQuotation(quotationId, approverUser, comment) {
  const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });

  // Anti-Self-Approval Enforcement
  if (quotation.createdBy === approverUser.id) {
    throw new AuthorizationError('Commercial governance violation: You cannot approve a quotation you created.');
  }

  // State Transition Validation
  if (quotation.status !== 'PENDING_APPROVAL') {
    throw new ConflictError(`Cannot approve quotation in status ${quotation.status}`);
  }

  return prisma.$transaction(async (tx) => {
    // Atomically transition status to APPROVED and log approval
    ...
  });
}
```

### 4.3 Estimator Ownership Isolation
* When an `ESTIMATOR` lists RFQs via `GET /rfqs`, the database query is automatically scoped:
  `WHERE owner_id = req.user.id`
* An estimator attempting to read or edit another estimator's RFQ by guessing its UUID is rejected with HTTP 403 Forbidden.
* The `SALES_HEAD` possesses global visibility across all organizational RFQs.

---

## 5. Input Validation & Query Parameterization

### 5.1 Runtime Schema Validation via Zod
All incoming request payloads (`body`, `params`, `query`) are validated against strict Zod schemas before reaching controller logic:
* Extra unknown properties are stripped (`.strict()`).
* Negative numbers for weights, prices, volumes, or hours are rejected.
* Margin percentages $\ge 100\%$ are blocked at validation.

### 5.2 SQL Injection Prevention
ForgeQuote exclusively queries PostgreSQL using **Prisma ORM**, which utilizes native parameterized prepared statements for all operations. No raw SQL strings or unescaped user string concatenations exist anywhere in the codebase.

---

## 6. HTTP Headers, Rate Limiting & Denial of Service (DoS)

### 6.1 Helmet Security Headers
The Express application mounts Helmet to inject standard defensive HTTP response headers:
* `Content-Security-Policy`: Restricts resource loading to trusted origins.
* `Strict-Transport-Security`: Enforces HTTPS for 1 year (`maxAge: 31536000`).
* `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
* `X-Frame-Options: DENY`: Prevents clickjacking inside iframes.
* `X-XSS-Protection: 0`: Disables buggy legacy browser XSS filters in favor of CSP.

### 6.2 Rate Limiting Protection
To safeguard against brute-force password guessing and denial-of-service attempts:
* **Global API Limiter**: 100 requests per 15-minute window per IP.
* **Authentication Limiter**: 10 login attempts per 15-minute window per IP. Exceeding this triggers HTTP 429 Too Many Requests.

---

## 7. Sensitive Data Redaction & Structured Logging

### 7.1 Pino Logger Redaction
Application logs must never record credentials, tokens, or customer proprietary geometry. The Pino logger is configured with automatic redaction paths:
```javascript
export const logger = pino({
  redact: {
    paths: [
      'req.headers.cookie',
      'req.body.password',
      '*.passwordHash',
      '*.tokenHash',
      'req.body.emailText'   // Protect proprietary RFQ text from server log dumps
    ],
    censor: '[CONFIDENTIAL_REDACTED]'
  }
});
```

### 7.2 Production Error Sanitization
In production (`NODE_ENV=production`), the centralized error handler returns sanitized error objects:
* Stack traces are omitted.
* Internal database connection strings and SQL details are masked.
* Every error response includes a unique correlation `requestId` for log correlation without exposing system internals to end users.
