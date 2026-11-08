import { NextRequest, NextResponse } from 'next/server';
import { getAllTools, getToolBySlug, getToolsMetadata } from '@/lib/tools';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const category = searchParams.get('category');
    const format = searchParams.get('format');
    const os = searchParams.get('os');

    if (slug) {
      const tool = getToolBySlug(slug);
      if (!tool) {
        return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        tool: {
          id: tool.id,
          slug: tool.slug,
          name: tool.name,
          category: tool.category,
          latestRelease: tool.latestRelease,
          downloads: tool.downloads,
          stars: tool.stars,
          license: tool.license,
          verifiedAuthentic: tool.verifiedAuthentic,
          lastCheckedDate: tool.lastCheckedDate
        }
      });
    }

    let tools = getAllTools();

    if (category && category !== 'ALL') {
      tools = tools.filter((t) => t.category === category || t.secondaryCategories.includes(category));
    }

    if (format && format !== 'ALL') {
      tools = tools.filter((t) => t.supportedFormats.some((f) => f.toLowerCase() === format.toLowerCase()));
    }

    if (os && os !== 'ALL') {
      tools = tools.filter((t) => t.supportedOs.some((o) => o.toLowerCase() === os.toLowerCase()));
    }

    const metadata = getToolsMetadata();

    return NextResponse.json({
      success: true,
      metadata,
      count: tools.length,
      tools: tools.map((t) => ({
        id: t.id,
        slug: t.slug,
        name: t.name,
        category: t.category,
        secondaryCategories: t.secondaryCategories,
        shortDescription: t.shortDescription,
        stars: t.stars,
        forks: t.forks,
        license: t.license,
        primaryLanguage: t.primaryLanguage,
        supportedOs: t.supportedOs,
        supportedFormats: t.supportedFormats,
        latestRelease: t.latestRelease,
        downloadsCount: t.downloads.length,
        verifiedAuthentic: t.verifiedAuthentic,
        securityStatus: t.securityStatus,
        lastCheckedDate: t.lastCheckedDate
      }))
    });
  } catch (error: any) {
    console.error('Error fetching tools release data:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
