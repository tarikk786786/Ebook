import crypto from 'crypto';
import type { DatabaseSync } from 'node:sqlite';

export type AuditLogInput = {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  actorType?: string;
  actorId?: string;
};

export function writeCommunityAuditLog(db: DatabaseSync, input: AuditLogInput): string {
  const auditId = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO audit_logs (audit_id, actor_type, actor_id, action, entity_type, entity_id, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  stmt.run(
    auditId,
    input.actorType ?? 'admin',
    input.actorId ?? null,
    input.action,
    input.entityType ?? null,
    input.entityId ?? null,
    input.metadata != null ? JSON.stringify(input.metadata) : null,
  );
  return auditId;
}
