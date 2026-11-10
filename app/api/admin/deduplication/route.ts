import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAccess } from '@/lib/auth/admin';
import {
  bulkApproveAutoEligible,
  getDedupeSummary,
  listDuplicateGroups,
  listReports,
  readReportFile,
  runDedupeScript,
  setGroupStatus,
} from '@/lib/dedupe';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function unauthorized() {
  return NextResponse.json(
    { success: false, error: 'Unauthorized: Admin authentication token required' },
    { status: 401 }
  );
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  const { searchParams } = new URL(req.url);
  const view = searchParams.get('view') || 'summary';

  try {
    if (view === 'summary') {
      return NextResponse.json({ success: true, summary: getDedupeSummary(), reports: listReports() });
    }

    if (view === 'groups') {
      const confidence = searchParams.get('confidence') || undefined;
      const status = searchParams.get('status') || undefined;
      const q = searchParams.get('q') || undefined;
      const autoEligibleRaw = searchParams.get('autoEligible');
      const autoEligible =
        autoEligibleRaw === '1' || autoEligibleRaw === 'true'
          ? true
          : autoEligibleRaw === '0' || autoEligibleRaw === 'false'
            ? false
            : undefined;
      const limit = Number(searchParams.get('limit') || 40);
      const offset = Number(searchParams.get('offset') || 0);
      const payload = listDuplicateGroups({
        confidence,
        status,
        autoEligible,
        q,
        limit,
        offset,
      });
      return NextResponse.json({ success: true, ...payload });
    }

    if (view === 'export') {
      const name = searchParams.get('file') || '';
      const file = readReportFile(name);
      if (!file) {
        return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
      }
      return new NextResponse(file.content, {
        status: 200,
        headers: {
          'Content-Type': `${file.contentType}; charset=utf-8`,
          'Content-Disposition': `attachment; filename="${pathBasename(name)}"`,
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown view' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Failed to load deduplication data' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) return unauthorized();

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = String(body.action || '');

  try {
    if (action === 'scan') {
      const skipHash = Boolean(body.skipHash);
      const skipCovers = Boolean(body.skipCovers ?? true);
      const skipContent = Boolean(body.skipContent ?? false);
      const args = [] as string[];
      if (skipHash) args.push('--skip-hash');
      if (skipCovers) args.push('--skip-covers');
      if (skipContent) args.push('--skip-content');
      const result = await runDedupeScript(args);
      return NextResponse.json({
        success: result.code === 0,
        action,
        code: result.code,
        stdoutTail: result.stdout.slice(-8000),
        stderrTail: result.stderr.slice(-4000),
        summary: getDedupeSummary(),
      });
    }

    if (action === 'approve' || action === 'reject' || action === 'reopen') {
      const groupId = String(body.groupId || '');
      if (!groupId) {
        return NextResponse.json({ success: false, error: 'groupId required' }, { status: 400 });
      }
      const status =
        action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'open';
      const result = setGroupStatus(groupId, status);
      return NextResponse.json({ success: true, action, ...result });
    }

    if (action === 'bulk-approve-high') {
      const result = bulkApproveAutoEligible();
      return NextResponse.json({ success: true, action, ...result });
    }

    if (action === 'apply-auto') {
      // Soft-remove AUTO-ELIGIBLE exact duplicates only (Python --apply --skip-hash)
      const result = await runDedupeScript(['--apply', '--skip-hash', '--skip-covers', '--skip-content']);
      return NextResponse.json({
        success: result.code === 0,
        action,
        code: result.code,
        stdoutTail: result.stdout.slice(-8000),
        stderrTail: result.stderr.slice(-4000),
        summary: getDedupeSummary(),
      });
    }

    if (action === 'rollback') {
      const result = await runDedupeScript(['--rollback-latest']);
      return NextResponse.json({
        success: result.code === 0,
        action,
        code: result.code,
        stdoutTail: result.stdout.slice(-8000),
        stderrTail: result.stderr.slice(-4000),
        summary: getDedupeSummary(),
      });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e?.message || 'Deduplication action failed' },
      { status: 500 }
    );
  }
}

function pathBasename(name: string) {
  return name.replace(/^.*[\\/]/, '');
}
