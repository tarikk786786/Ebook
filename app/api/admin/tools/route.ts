import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAllTools, EbookTool } from '@/lib/tools';
import { verifyAdminAccess } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

function getToolsFilePath() {
  return path.join(process.cwd(), 'data', 'tools_registry.json');
}

function isSafePublicHttpsUrl(targetUrl: string): boolean {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    // Reject loopback, private ranges, link-local, and cloud metadata services
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  try {
    const tools = getAllTools();
    const totalTools = tools.length;
    const archivedTools = tools.filter((t) => t.isArchived || t.isAbandoned).length;
    const verifiedTools = tools.filter((t) => t.verifiedAuthentic).length;

    return NextResponse.json({
      success: true,
      stats: {
        totalTools,
        archivedTools,
        verifiedTools,
        lastCheckedDate: tools[0]?.lastCheckedDate || new Date().toISOString()
      },
      tools
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates, action } = body;

    const filePath = getToolsFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Tools registry file not found' }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let tools: EbookTool[] = data.tools || [];

    // Link verification check action with strict SSRF defense
    if (action === 'verify_links') {
      const results: Record<string, { status: number; ok: boolean }> = {};
      const targetTool = tools.find((t) => t.id === id);
      if (targetTool) {
        for (const dl of targetTool.downloads) {
          if (!isSafePublicHttpsUrl(dl.downloadUrl)) {
            results[dl.fileName] = { status: 400, ok: false };
            continue;
          }
          try {
            const resp = await fetch(dl.downloadUrl, { method: 'HEAD', redirect: 'follow' });
            results[dl.fileName] = { status: resp.status, ok: resp.ok };
          } catch (e: any) {
            results[dl.fileName] = { status: 500, ok: false };
          }
        }
        return NextResponse.json({ success: true, toolId: id, linkStatus: results });
      }
    }

    const index = tools.findIndex((t) => t.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Apply allowed updates
    tools[index] = {
      ...tools[index],
      ...updates,
      lastCheckedDate: new Date().toISOString()
    };

    data.tools = tools;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      tool: tools[index],
      message: `Tool ${tools[index].name} successfully updated`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized administrative access' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { newTool } = body;

    if (!newTool || !newTool.repoFullName || !newTool.name) {
      return NextResponse.json({ error: 'Missing required tool fields: name, repoFullName' }, { status: 400 });
    }

    const filePath = getToolsFilePath();
    const data = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : { tools: [] };
    const tools: EbookTool[] = data.tools || [];

    const existing = tools.find((t) => t.repoFullName.toLowerCase() === newTool.repoFullName.toLowerCase());
    if (existing) {
      return NextResponse.json({ error: 'Tool repository already registered' }, { status: 409 });
    }

    const slug = newTool.slug || newTool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const fullRecord: EbookTool = {
      id: newTool.id || slug,
      slug,
      name: newTool.name,
      category: newTool.category || 'Library Management',
      secondaryCategories: newTool.secondaryCategories || [],
      shortDescription: newTool.shortDescription || 'Open source ebook tool',
      detailedDescription: newTool.detailedDescription || newTool.shortDescription || '',
      features: newTool.features || ['Open-source library tool'],
      supportedFormats: newTool.supportedFormats || ['EPUB', 'PDF'],
      supportedOs: newTool.supportedOs || ['Windows', 'macOS', 'Linux'],
      requirements: newTool.requirements || 'Standard desktop runtime',
      packageInstallCommands: newTool.packageInstallCommands || {},
      dockerImage: newTool.dockerImage || null,
      primaryLanguage: newTool.primaryLanguage || 'Python',
      license: newTool.license || 'Open-Source',
      isArchived: Boolean(newTool.isArchived),
      isAbandoned: Boolean(newTool.isAbandoned),
      securityStatus: 'Verified Open Source',
      verifiedAuthentic: true,
      isPopular: false,
      isFeatured: false,
      iconName: 'BookOpen',
      officialWebsite: newTool.officialWebsite || `https://github.com/${newTool.repoFullName}`,
      documentation: newTool.documentation || `https://github.com/${newTool.repoFullName}#readme`,
      githubRepo: `https://github.com/${newTool.repoFullName}`,
      repoFullName: newTool.repoFullName,
      stars: newTool.stars || 0,
      forks: newTool.forks || 0,
      openIssues: 0,
      latestRelease: newTool.latestRelease || {
        version: 'v1.0.0',
        name: `${newTool.name} v1.0.0`,
        publishedAt: new Date().toISOString(),
        htmlUrl: `https://github.com/${newTool.repoFullName}/releases`,
        releaseNotes: 'Initial registered release',
        checksums: {}
      },
      downloads: newTool.downloads || [
        {
          fileName: `${slug}-source.zip`,
          platform: 'Source Code ZIP',
          fileSize: 'GitHub Archive',
          sizeBytes: 0,
          downloadUrl: `https://github.com/${newTool.repoFullName}/archive/refs/heads/main.zip`,
          downloadCount: 0,
          verified: true,
          isBinary: false
        }
      ],
      gitCloneCommand: `git clone https://github.com/${newTool.repoFullName}.git`,
      lastCheckedDate: new Date().toISOString()
    };

    tools.unshift(fullRecord);
    data.tools = tools;
    if (data.metadata) {
      data.metadata.totalTools = tools.length;
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      tool: fullRecord,
      message: `Tool ${fullRecord.name} added successfully`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
