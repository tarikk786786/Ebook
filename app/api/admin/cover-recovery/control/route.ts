import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { verifyAdminAccess } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

const CTRL_DIR = path.resolve(process.cwd(), 'data', 'cover_worker');
const PAUSE_FLAG = path.join(CTRL_DIR, 'pause.flag');
const STATUS_PATH = path.join(CTRL_DIR, 'status.json');
const COMMAND_PATH = path.join(CTRL_DIR, 'command.json');

function ensureCtrlDir() {
  fs.mkdirSync(CTRL_DIR, { recursive: true });
}

function readStatus(): Record<string, unknown> {
  ensureCtrlDir();
  let status: Record<string, unknown> = {};
  if (fs.existsSync(STATUS_PATH)) {
    try {
      status = JSON.parse(fs.readFileSync(STATUS_PATH, 'utf8'));
    } catch {
      status = {};
    }
  }
  status.paused = fs.existsSync(PAUSE_FLAG);
  return status;
}

function writeCommand(cmd: Record<string, unknown>) {
  ensureCtrlDir();
  fs.writeFileSync(
    COMMAND_PATH,
    JSON.stringify({ ...cmd, issued_at: Date.now() / 1000 }, null, 2),
    'utf8'
  );
}

function spawnWorker(args: string[]) {
  const script = path.resolve(process.cwd(), 'scripts', 'run_cover_recovery_batch.py');
  const logDir = path.resolve(process.cwd(), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  const outPath = path.join(logDir, 'cover_worker_admin.log');
  const errPath = path.join(logDir, 'cover_worker_admin.err');
  const out = fs.openSync(outPath, 'a');
  const err = fs.openSync(errPath, 'a');
  const child = spawn('python', ['-u', script, ...args], {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', out, err],
    windowsHide: true,
  });
  child.unref();
  return child.pid || null;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ success: true, status: readStatus() });
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: { action?: string; limit?: number; workers?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const action = String(body.action || '').toLowerCase();
  ensureCtrlDir();

  if (action === 'pause') {
    fs.writeFileSync(PAUSE_FLAG, 'admin', 'utf8');
    writeCommand({ action: 'pause' });
    return NextResponse.json({ success: true, status: readStatus() });
  }

  if (action === 'resume') {
    if (fs.existsSync(PAUSE_FLAG)) fs.unlinkSync(PAUSE_FLAG);
    writeCommand({ action: 'resume' });
    return NextResponse.json({ success: true, status: readStatus() });
  }

  if (action === 'start' || action === 'retry_failures' || action === 'missing_only') {
    if (fs.existsSync(PAUSE_FLAG)) fs.unlinkSync(PAUSE_FLAG);
    const limit = Math.max(1, Math.min(Number(body.limit) || 200, 2000));
    const workers = Math.max(1, Math.min(Number(body.workers) || 4, 8));
    const args = ['--pending-from-db', `--limit=${limit}`, `--workers=${workers}`];
    if (action === 'missing_only' || action === 'retry_failures') {
      args.push('--missing-only');
    }
    writeCommand({ action, limit, workers, args });
    const pid = spawnWorker(args);
    return NextResponse.json({
      success: true,
      started: true,
      pid,
      args,
      status: readStatus(),
      message: `Spawned cover recovery worker pid=${pid}`,
    });
  }

  return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
}
