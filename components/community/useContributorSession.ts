'use client';

import { useCallback, useEffect, useState } from 'react';

export type ContributorMePayload = {
  contributor?: {
    id: string;
    email: string;
    displayName?: string | null;
    display_name?: string | null;
    upiId?: string | null;
    upi_id?: string | null;
    status?: string;
  };
  earnings?: {
    balanceInr?: number;
    lifetimeNetInr?: number;
    availableInr?: number;
    pendingPayoutInr?: number;
    creditsTotalInr?: number;
    debitsTotalInr?: number;
  };
  payoutRules?: { minWithdrawalInr?: number };
  recentEarnings?: unknown[];
  payouts?: unknown[];
  submissions?: { total?: number; byStatus?: Record<string, number>; recent?: unknown[] };
};

type SessionState = {
  loading: boolean;
  authenticated: boolean;
  apiReady: boolean;
  data: ContributorMePayload | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useContributorSession(): SessionState {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [apiReady, setApiReady] = useState(true);
  const [data, setData] = useState<ContributorMePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/community/contributor/me', { credentials: 'include' });
      if (res.status === 404 || res.status === 501) {
        setApiReady(false);
        setAuthenticated(false);
        setData(null);
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setAuthenticated(false);
        setData(null);
        return;
      }
      if (!res.ok) {
        setError(typeof body.error === 'string' ? body.error : 'Could not load contributor profile.');
        setAuthenticated(false);
        return;
      }
      setApiReady(true);
      setAuthenticated(true);
      setData(body as ContributorMePayload);
    } catch {
      setError('Connection error while loading your dashboard.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, authenticated, apiReady, data, error, refresh };
}
