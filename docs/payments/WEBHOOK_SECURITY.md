# WEBHOOK SECURITY & INTEGRITY SPECIFICATION

## 1. Webhook Attack Vectors Defended
1. **Replay Attacks**: Attackers recording a legitimate webhook and resending it later to obtain free downloads or trigger duplicate fulfilment.
2. **Timing Attacks**: Comparing HMAC signatures using standard `===` strings allows byte-by-byte timing inference.
3. **Payload Tampering**: Modifying order amounts or order IDs in transit.
4. **Denial of Service**: Bombarding webhook handlers with oversized payloads.

## 2. Implemented Defense Mechanisms

### A. Freshness Window (Timestamp Validation)
Every webhook with a timestamp header or payload property is checked against the server clock:
```typescript
const MAX_DRIFT_SECONDS = 300; // 5 minutes
const now = Math.floor(Date.now() / 1000);
if (Math.abs(now - webhookTimestamp) > MAX_DRIFT_SECONDS) {
  throw new Error("Webhook expired or clock drift exceeded");
}
```

### B. Constant-Time Cryptographic Verification
Signatures are validated using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side channels:
```typescript
import crypto from 'crypto';

export function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
```

### C. In-Memory / Distributed Idempotency Cache
All processed webhook IDs are stored with a TTL. Any duplicate webhook ID received within the idempotency window is acknowledged with HTTP 200 without re-triggering business logic.

### D. Rate Limiting on Webhook Endpoints
Edge middleware restricts webhook requests from untrusted IP ranges and applies strict rate limiting (e.g., 60 requests/min per IP) to mitigate flood attacks.
