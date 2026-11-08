import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllTools, getToolBySlug } from '@/lib/tools';
import ToolDetailClient from '@/components/tools/ToolDetailClient';

interface Props {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getToolBySlug(params.slug);
  if (!tool) {
    return {
      title: 'Tool Not Found | AnonTrove Ebook Tools',
    };
  }

  return {
    title: `${tool.name} - Official Download, Features & Guide | Ebook Tools`,
    description: `${tool.shortDescription} Download official ${tool.latestRelease?.version} binaries for Windows, macOS, Linux, and package managers.`,
    openGraph: {
      title: `${tool.name} - Official Ebook Tool Download`,
      description: tool.shortDescription,
      type: 'article',
      url: `https://ebook-sandy-chi.vercel.app/tools/${tool.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} - Ebook Tools Download`,
      description: tool.shortDescription,
    },
  };
}

export default function ToolDetailPage({ params }: Props) {
  const tool = getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  const allTools = getAllTools();
  const relatedTools = allTools
    .filter((t) => t.id !== tool.id && (t.category === tool.category || t.secondaryCategories.includes(tool.category)))
    .slice(0, 4);

  return <ToolDetailClient tool={tool} relatedTools={relatedTools} />;
}
