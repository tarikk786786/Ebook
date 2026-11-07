# AnonTrove Incident Response & Disaster Recovery Playbook

**Version:** 1.0.0  
**Classification:** Internal Confidential / Cyber Defense  
**Standard:** NIST SP 800-61 Rev 2 (Computer Security Incident Handling Guide)  

---

## 1. Incident Response Lifecycle

```
[1. Detection & Identification]
           │
           ▼
[2. Scoping & Assessment]
           │
           ▼
[3. Containment (Immediate & Long-Term)]
           │
           ▼
[4. Eradication & Secret Invalidation]
           │
           ▼
[5. Recovery & Secure Restore]
           │
           ▼
[6. Post-Incident Review & Hardening]
```

---

## 2. Specific Security Event Playbooks

### Playbook A: Leaked API Key or Merchant Secret
1. **Detection:** Gitleaks CI alert or payment provider notification.
2. **Immediate Containment:**
   - Log into the compromised provider's dashboard (Razorpay, Cashfree, or FamGateway).
   - Generate a replacement key and secret.
   - Update `appinfo11.txt` and Vercel Encrypted Environment Variables immediately.
   - Trigger a new production deployment to inject the rotated secret.
3. **Eradication:** Revoke the compromised old secret in the provider console.
4. **Forensics:** Audit webhook logs and transactions created during the exposure window for unauthorized charges or refunds.

### Playbook B: Abnormal Token Download Volume (Scraping Detection)
1. **Detection:** Cloudflare WAF alert or `/api/download/*` 429 spike.
2. **Immediate Containment:**
   - Enable Cloudflare "Under Attack Mode" or block the offending IP address in Cloudflare WAF.
   - Flush active compromised tokens by changing `DOWNLOAD_ENCRYPTION_SECRET` (which cryptographically invalidates all outstanding tokens instantly).
3. **Investigation:** Verify if the download token was generated from a genuine paid order or attempted brute force.

### Playbook C: Unauthorized Admin Modification Attempt
1. **Detection:** Consecutive HTTP 401/429 responses on `/api/admin/*`.
2. **Containment:**
   - The edge middleware automatically throttles the source IP.
   - If compromised secret suspected, rotate `ADMIN_ACCESS_SECRET` in Vercel environment variables immediately.

---

## 3. Disaster Recovery & Backup Plan

### RPO & RTO Targets:
- **Recovery Point Objective (RPO):** < 1 hour (daily catalog & hourly order state sync).
- **Recovery Time Objective (RTO):** < 15 minutes (Serverless instant redeploy from GitHub).

### Backup Procedures:
1. **Catalog & Order Manifests:**
   - `data/books_registry.json` and `data/orders_store.json` are version-controlled and backed up to encrypted object storage.
2. **Ebook Asset Binaries (PDF & EPUB):**
   - Retained in redundant Cloudflare R2 bucket (`anontrove-ebooks-vault`) with automatic multi-region object replication.
3. **Automated Recovery Command:**
   ```bash
   git clone https://github.com/tarikk786786/Ebook.git
   cd Ebook/projects/anon-trove-ebooks
   npm install
   npm run build
   ```
