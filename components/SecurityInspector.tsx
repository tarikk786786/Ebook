'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, Server, Terminal, CheckCircle2 } from 'lucide-react';

export default function SecurityInspector() {
  const [activeTab, setActiveTab] = useState<'tokens' | 'webhooks' | 'pii' | 'rail'>('tokens');

  return (
    <section className="py-16 border-t border-slate-800/80 bg-[#0B0F17]/80">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-emerald-400 font-semibold">Security Proof & Audit</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Zero-Trace Cryptographic Protocol
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-xl mx-auto">
            Inspect the underlying cryptographic primitives protecting your privacy, payment payloads, and digital delivery.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-center space-x-2 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'tokens'
                ? 'bg-slate-800 text-white border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>AES-256-GCM Tokens</span>
          </button>

          <button
            onClick={() => setActiveTab('webhooks')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'webhooks'
                ? 'bg-slate-800 text-white border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>HMAC-SHA256 Signatures</span>
          </button>

          <button
            onClick={() => setActiveTab('pii')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'pii'
                ? 'bg-slate-800 text-white border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-PII Isolation</span>
          </button>

          <button
            onClick={() => setActiveTab('rail')}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center space-x-2 transition-all ${
              activeTab === 'rail'
                ? 'bg-slate-800 text-white border border-emerald-500/40 shadow-sm'
                : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Non-Custodial Settlement</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-[#121826] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
          {activeTab === 'tokens' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  Authenticated Encryption
                </span>
                <h3 className="text-xl font-bold text-white">Time-Decaying Stream Cipher</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Every eBook download link is sealed with an authenticated Galois/Counter Mode (GCM) cipher using a 96-bit initialization vector. Tokens contain an embedded expiration timestamp (24h TTL) and a maximum download counter.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tamper-evident 128-bit authentication tag</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real storage paths never exposed in URLs</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto">
                <div className="text-slate-500 mb-2">// Token Payload Decryption Structure</div>
                <pre>{`{
  "orderId": "fg_DYCBZH5D",
  "bookId": "book-zero-trace",
  "issuedAt": 1730932800000,
  "ttlMs": 86400000, // 24 Hours
  "maxDownloads": 5,
  "authTag": "8f3b...verified"
}`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  Side-Channel Immunity
                </span>
                <h3 className="text-xl font-bold text-white">Timing-Safe HMAC-SHA256</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Inbound payment notifications are signed by the UPI rail with an HMAC-SHA256 signature. Our serverless edge route executes constant-time string comparison (`crypto.timingSafeEqual`) to eliminate statistical execution-time variations that could allow byte-by-byte signature guessing.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Replay attack rejection using order deduplication</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Payload size capped at 64KB</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto">
                <div className="text-slate-500 mb-2">// Server-Side Signature Verification</div>
                <pre>{`const expected = crypto
  .createHmac('sha256', API_KEY)
  .update(rawRequestBody)
  .digest('hex');

// Constant-time execution prevents timing leaks:
crypto.timingSafeEqual(
  Buffer.from(signature, 'utf8'),
  Buffer.from(expected, 'utf8')
);`}</pre>
              </div>
            </div>
          )}

          {activeTab === 'pii' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  Forensic Defense
                </span>
                <h3 className="text-xl font-bold text-white">Stateless Zero-PII Pipeline</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We collect zero personally identifiable information (PII). No accounts, no password hashes, no mandatory telephone numbers, and no IP address logs. The entire order fulfillment pipeline is ephemeral and self-invalidating.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero third-party analytics (No GA, No Pixel)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DPDP Act 2023 Statutory Compliance</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-2">
                <div className="text-slate-500">// Active Browser Environment Audit</div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span>Tracking Cookies:</span>
                  <span className="text-emerald-400 font-bold">0 (None Set)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span>Third-Party Scripts:</span>
                  <span className="text-emerald-400 font-bold">0 Blocked</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1">
                  <span>Referrer Policy:</span>
                  <span className="text-emerald-400 font-bold">no-referrer</span>
                </div>
                <div className="flex justify-between">
                  <span>Content Security Policy:</span>
                  <span className="text-emerald-400 font-bold">Enforced (Strict)</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rail' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                  Peer-to-Peer
                </span>
                <h3 className="text-xl font-bold text-white">0% Fee Non-Custodial UPI</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Unlike traditional gateways (Razorpay, Stripe, Cashfree) that hold customer funds in escrow accounts for 2-3 days while deducting percentage fees, our payment rail settles peer-to-peer directly to the merchant within 0 seconds.
                </p>
                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>0.0% transaction fee forever</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sec. 22 CGST exemption (&lt;₹20 Lakhs/yr)</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0B0F17] p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-2">
                <div className="text-slate-500">// Settlement Comparison</div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1 text-red-400">
                  <span>Custodial Gateways:</span>
                  <span>2-3% + 18% GST (T+3 Days)</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>AnonTrove Direct UPI:</span>
                  <span>0.0% Fee • Instant (0 Seconds)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
