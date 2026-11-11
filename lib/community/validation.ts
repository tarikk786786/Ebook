import { z } from 'zod';

/** Server-side cap: list price ≤ 10% of verified retail. */
export const MAX_SUGGESTED_PRICE_RETAIL_FRACTION = 0.1;

export const communityPricingInputSchema = z
  .object({
    verifiedRetailPriceInr: z.number().positive('verified retail price must be > 0'),
    suggestedPriceInr: z.number().positive('suggested list price must be > 0'),
  })
  .superRefine((data, ctx) => {
    const maxAllowed = data.verifiedRetailPriceInr * MAX_SUGGESTED_PRICE_RETAIL_FRACTION;
    if (data.suggestedPriceInr > maxAllowed + 1e-9) {
      ctx.addIssue({
        code: 'custom',
        path: ['suggestedPriceInr'],
        message: `suggested price must be <= ${MAX_SUGGESTED_PRICE_RETAIL_FRACTION * 100}% of verified retail (max ₹${maxAllowed.toFixed(2)})`,
      });
    }
  });

export type CommunityPricingInput = z.infer<typeof communityPricingInputSchema>;

/** Configurable reward split (defaults match plan example: 500 / 50 / 30 / 20). */
export const rewardSplitSettingsSchema = z
  .object({
    exampleRetailInr: z.number().positive().default(500),
    exampleListPriceInr: z.number().positive().default(50),
    exampleContributorRewardInr: z.number().positive().default(30),
    examplePlatformRewardInr: z.number().positive().default(20),
    contributorShareOfListPrice: z.number().min(0).max(1).default(0.6),
    platformShareOfListPrice: z.number().min(0).max(1).default(0.4),
    maxSuggestedPriceRetailFraction: z
      .number()
      .positive()
      .max(0.5)
      .default(MAX_SUGGESTED_PRICE_RETAIL_FRACTION),
  })
  .superRefine((data, ctx) => {
    const sum = data.contributorShareOfListPrice + data.platformShareOfListPrice;
    if (Math.abs(sum - 1) > 0.0001) {
      ctx.addIssue({
        code: 'custom',
        path: ['platformShareOfListPrice'],
        message: 'contributor and platform shares of list price must sum to 1',
      });
    }
    const exampleSum = data.exampleContributorRewardInr + data.examplePlatformRewardInr;
    if (exampleSum > data.exampleListPriceInr + 0.01) {
      ctx.addIssue({
        code: 'custom',
        path: ['exampleListPriceInr'],
        message: 'example contributor + platform rewards must not exceed example list price',
      });
    }
  });

export type RewardSplitSettings = z.infer<typeof rewardSplitSettingsSchema>;

export const PLATFORM_SETTING_REWARD_SPLIT = 'reward_split';
export const PLATFORM_SETTING_PRICING_RULES = 'pricing_rules';
export const PLATFORM_SETTING_PAYOUT_RULES = 'payout_rules';

export const payoutRulesSettingsSchema = z.object({
  minWithdrawalInr: z.number().positive().default(100),
});

export type PayoutRulesSettings = z.infer<typeof payoutRulesSettingsSchema>;

export const DEFAULT_PAYOUT_RULES: PayoutRulesSettings = payoutRulesSettingsSchema.parse({});

export function parsePayoutRulesSettings(raw: unknown): PayoutRulesSettings {
  return payoutRulesSettingsSchema.parse(raw);
}

export const communityPayoutRequestBodySchema = z.object({
  /** Omit to withdraw full available balance (server-computed). */
  amountInr: z.number().positive().optional(),
});

export const DEFAULT_REWARD_SPLIT_SETTINGS: RewardSplitSettings = rewardSplitSettingsSchema.parse({});

export const DEFAULT_PRICING_RULES = {
  maxSuggestedPriceRetailFraction: MAX_SUGGESTED_PRICE_RETAIL_FRACTION,
} as const;

export function parseRewardSplitSettings(raw: unknown): RewardSplitSettings {
  return rewardSplitSettingsSchema.parse(raw);
}

export function validateSubmissionPricing(retailPriceInr: number, suggestedPriceInr: number) {
  return communityPricingInputSchema.safeParse({
    verifiedRetailPriceInr: retailPriceInr,
    suggestedPriceInr: suggestedPriceInr,
  });
}

const emailSchema = z.string().email('Invalid email').max(256).transform((e) => e.trim().toLowerCase());

export const communityMagicLinkRequestSchema = z.object({
  email: emailSchema,
  intent: z.enum(['contributor', 'requester']).default('contributor'),
  returnTo: z.string().max(512).optional(),
});

export type CommunityMagicLinkRequest = z.infer<typeof communityMagicLinkRequestSchema>;

export const submissionMetadataFields = {
  title: z.string().min(2, 'title is required').max(500),
  author: z.string().max(300).optional().nullable(),
  isbn13: z
    .string()
    .regex(/^\d{13}$/, 'isbn13 must be 13 digits')
    .optional()
    .nullable(),
  isbn10: z
    .string()
    .regex(/^\d{9}[\dXx]$/, 'isbn10 must be 10 digits (last may be X)')
    .optional()
    .nullable(),
  description: z.string().max(10_000).optional().nullable(),
  category: z.string().max(120).optional().nullable(),
  licenseType: z.string().min(2).max(120).optional().nullable(),
  sourceUrl: z.string().url('source URL must be valid').max(2048).optional().nullable(),
};

export const submissionDraftBodySchema = z.object({
  ...submissionMetadataFields,
  retailPriceInr: z.number().positive().optional().nullable(),
  suggestedPriceInr: z.number().positive().optional().nullable(),
});

export const submissionCreateSchema = submissionDraftBodySchema;

export const submissionPatchSchema = z
  .object({
    action: z.enum(['save_draft', 'submit']),
    ...submissionMetadataFields,
    title: submissionMetadataFields.title.optional(),
    retailPriceInr: z.number().positive().optional().nullable(),
    suggestedPriceInr: z.number().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'submit') {
      if (!data.title) {
        ctx.addIssue({ code: 'custom', path: ['title'], message: 'title is required to submit' });
      }
      if (data.retailPriceInr == null || data.suggestedPriceInr == null) {
        ctx.addIssue({
          code: 'custom',
          path: ['retailPriceInr'],
          message: 'retail and suggested prices are required to submit',
        });
      } else {
        const pricing = validateSubmissionPricing(data.retailPriceInr, data.suggestedPriceInr);
        if (!pricing.success) {
          for (const issue of pricing.error.issues) {
            ctx.addIssue({ ...issue, path: ['suggestedPriceInr'] });
          }
        }
      }
      if (!data.licenseType) {
        ctx.addIssue({ code: 'custom', path: ['licenseType'], message: 'license type is required to submit' });
      }
    }
    if (
      data.retailPriceInr != null &&
      data.suggestedPriceInr != null &&
      data.action === 'save_draft'
    ) {
      const pricing = validateSubmissionPricing(data.retailPriceInr, data.suggestedPriceInr);
      if (!pricing.success) {
        for (const issue of pricing.error.issues) {
          ctx.addIssue({ ...issue, path: ['suggestedPriceInr'] });
        }
      }
    }
  });

export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
export type SubmissionPatchInput = z.infer<typeof submissionPatchSchema>;

export const ebookRequestCreateSchema = z.object({
  email: emailSchema,
  title: z.string().min(2).max(500),
  author: z.string().max(300).optional().nullable(),
  isbn13: submissionMetadataFields.isbn13,
  isbn10: submissionMetadataFields.isbn10,
  notes: z.string().max(5000).optional().nullable(),
});

export type EbookRequestCreateInput = z.infer<typeof ebookRequestCreateSchema>;

export const CONTRIBUTOR_EDITABLE_STATUSES = ['draft'] as const;

/** Admin-driven transitions after submit (not client-writable). */
export const SUBMISSION_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  draft: ['submitted'],
  submitted: ['under_review', 'rejected'],
  under_review: ['license_pending', 'approved', 'rejected'],
  license_pending: ['approved', 'rejected'],
  approved: ['published', 'rejected'],
  rejected: [],
  published: [],
};
