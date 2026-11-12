/** Community marketplace SQLite row types and status enums (Phase 1 schema). */

export type ContributorStatus = 'pending' | 'active' | 'suspended';

export type EbookSubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'license_pending'
  | 'approved'
  | 'rejected'
  | 'published';

export type LicenseVerificationStatus = 'pending' | 'verified' | 'rejected' | 'needs_review';

export type SourceReachabilityStatus = 'unknown' | 'reachable' | 'unreachable' | 'blocked';

export type EbookRequestStatus = 'open' | 'in_progress' | 'fulfilled' | 'duplicate' | 'closed';

export type LedgerEntryType = 'credit' | 'debit';

export type PayoutRequestStatus = 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';

export type NotificationRecipientType = 'contributor' | 'requester' | 'admin';

export interface ContributorRow {
  id: string;
  email: string;
  display_name: string | null;
  upi_id: string | null;
  upi_verified_at: string | null;
  status: ContributorStatus;
  access_token_hash: string | null;
  access_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EbookSubmissionRow {
  submission_id: string;
  contributor_id: string;
  title: string;
  author: string | null;
  isbn13: string | null;
  isbn10: string | null;
  description: string | null;
  category: string | null;
  retail_price_inr: number | null;
  suggested_price_inr: number | null;
  license_type: string | null;
  source_url: string | null;
  proof_storage_key: string | null;
  status: EbookSubmissionStatus;
  admin_notes: string | null;
  published_catalog_ref: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface PlatformSettingRow {
  setting_key: string;
  value_json: string;
  description: string | null;
  updated_at: string;
}

export const COMMUNITY_SCHEMA_VERSION = 2;
