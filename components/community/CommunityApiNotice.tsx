'use client';

import React from 'react';
import { Info, PlugZap } from 'lucide-react';

type CommunityApiNoticeProps = {
  feature: string;
  apiPath?: string;
};

export default function CommunityApiNotice({ feature, apiPath }: CommunityApiNoticeProps) {
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D6D0C4] text-xs text-[#6E685F]">
      <PlugZap className="w-4 h-4 text-[#9A704B] shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="font-medium text-[#24231F] flex items-center gap-1">
          <Info className="w-3.5 h-3.5" />
          {feature} preview
        </p>
        <p>
          This page is wired for <code className="font-mono text-[10px] bg-white px-1 rounded">{apiPath || '/api/community/*'}</code>.
          Until the API ships, forms validate locally and show empty states—no data is lost once endpoints go live.
        </p>
      </div>
    </div>
  );
}
