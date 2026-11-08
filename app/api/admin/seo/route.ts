import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { verifyAdminAccess } from '@/lib/auth/admin';
import { getBookCatalog } from '@/lib/catalog';
import { AUTHORITATIVE_CATEGORIES } from '@/lib/categories';

export async function GET(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  try {
    const cwd = process.cwd();
    const books = getBookCatalog();

    // Read registries
    const toolsPath = path.join(cwd, 'seo-intelligence/registry/tools.json');
    const skillsPath = path.join(cwd, 'seo-intelligence/registry/skills.json');
    const mcpPath = path.join(cwd, 'seo-intelligence/registry/mcp.json');

    const toolsData = fs.existsSync(toolsPath) ? JSON.parse(fs.readFileSync(toolsPath, 'utf8')) : { tools: [] };
    const skillsData = fs.existsSync(skillsPath) ? JSON.parse(fs.readFileSync(skillsPath, 'utf8')) : { skills: [] };
    const mcpData = fs.existsSync(mcpPath) ? JSON.parse(fs.readFileSync(mcpPath, 'utf8')) : { mcpServers: [] };

    // Sitemaps & robots status
    const sitemapFile = path.join(cwd, 'app/sitemap.ts');
    const robotsFile = path.join(cwd, 'app/robots.ts');
    const llmsFile = path.join(cwd, 'public/llms.txt');

    const sitemapStats = {
      isDynamic: fs.existsSync(sitemapFile),
      robotsConfigured: fs.existsSync(robotsFile),
      totalCatalogTitles: books.length,
      categoryHubs: AUTHORITATIVE_CATEGORIES.length,
      llmsManifestConfigured: fs.existsSync(llmsFile),
      indexedInSitemapLimit: 1000
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      sitemapStats,
      tools: toolsData.tools || [],
      skills: skillsData.skills || [],
      mcpServers: mcpData.mcpServers || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve SEO registry stats' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminAccess(req)) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication token required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const action = body.action;
    const cwd = process.cwd();

    let scriptPath = '';
    let scriptArgs: string[] = [];

    switch (action) {
      case 'run_seo_audit':
        scriptPath = path.join(cwd, 'scripts/seo_audit.mjs');
        break;
      case 'validate_sitemap':
        scriptPath = path.join(cwd, 'scripts/validate_sitemap.mjs');
        break;
      case 'validate_schema':
        scriptPath = path.join(cwd, 'scripts/validate_schema.mjs');
        break;
      case 'check_canonicals':
        scriptPath = path.join(cwd, 'scripts/check_canonicals.mjs');
        break;
      case 'test_all_skills':
        scriptPath = path.join(cwd, 'scripts/test_all_skills.mjs');
        break;
      default:
        return NextResponse.json(
          { success: false, error: `Invalid action: ${action}` },
          { status: 400 }
        );
    }

    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json(
        { success: false, error: `Script not found: ${scriptPath}` },
        { status: 404 }
      );
    }

    const proc = spawnSync('node', [scriptPath, ...scriptArgs], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' },
      timeout: 30000
    });

    const output = (proc.stdout || '') + (proc.stderr || '');
    const exitCode = proc.status ?? 1;

    return NextResponse.json({
      success: exitCode === 0,
      action,
      exitCode,
      output: output.replace(/(?:[0-9a-fA-F]{32,}|sk-[a-zA-Z0-9]{20,})/g, '[REDACTED_SECRET]')
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error executing SEO audit command' },
      { status: 500 }
    );
  }
}
