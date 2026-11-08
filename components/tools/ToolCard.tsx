'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { EbookTool } from '@/lib/tools';
import { 
  Download, 
  ExternalLink, 
  Star, 
  GitFork, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  Cpu, 
  FileText, 
  Search, 
  Sparkles, 
  Smartphone,
  ChevronDown
} from 'lucide-react';

interface ToolCardProps {
  tool: EbookTool;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);

  // Pick the most common install command
  const primaryCommand = 
    tool.packageInstallCommands?.winget || 
    tool.packageInstallCommands?.pip || 
    tool.packageInstallCommands?.brew || 
    tool.packageInstallCommands?.docker || 
    tool.packageInstallCommands?.cargo || 
    tool.gitCloneCommand;

  const handleCopy = (cmd: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Find primary binary download asset (e.g., Windows x64 or Mac or first binary)
  const primaryDownload = tool.downloads.find(
    (d) => d.platform.includes('Windows x64') || d.platform.includes('macOS') || d.isBinary
  ) || tool.downloads[0];

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0F141E]/95 border border-slate-800/80 p-5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/20 transition-all duration-300">
      <div>
        {/* Top Badges & Meta */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            {tool.category}
          </span>

          <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center text-amber-400" title="GitHub Stars">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
              {tool.stars > 1000 ? `${(tool.stars / 1000).toFixed(1)}k` : tool.stars}
            </span>
            {tool.verifiedAuthentic && (
              <span className="flex items-center text-emerald-400" title="Verified Authentic Release">
                <ShieldCheck className="w-3.5 h-3.5 mr-0.5" />
              </span>
            )}
          </div>
        </div>

        {/* Title & Slug */}
        <div className="mb-2">
          <Link href={`/tools/${tool.slug}`} className="group-hover:text-emerald-300 transition-colors">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-between">
              <span>{tool.name}</span>
              <span className="text-[11px] font-mono font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-800/60 group-hover:bg-emerald-950 group-hover:text-emerald-400 transition-colors">
                {tool.latestRelease?.version || 'Latest'}
              </span>
            </h3>
          </Link>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {tool.repoFullName} • {tool.license}
          </p>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
          {tool.shortDescription}
        </p>

        {/* Supported Formats Pills */}
        <div className="mb-4">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1.5">
            Supported Formats
          </div>
          <div className="flex flex-wrap gap-1">
            {tool.supportedFormats.slice(0, 5).map((fmt) => (
              <span
                key={fmt}
                className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800/70 text-slate-300 border border-slate-700/50"
              >
                {fmt}
              </span>
            ))}
            {tool.supportedFormats.length > 5 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-800/40 text-slate-500">
                +{tool.supportedFormats.length - 5}
              </span>
            )}
          </div>
        </div>

        {/* Supported OS Badges */}
        <div className="mb-4 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">OS:</span>
          {tool.supportedOs.map((os) => (
            <span
              key={os}
              className="px-2 py-0.5 rounded-md bg-slate-800/40 border border-slate-700/40 text-[10px] text-slate-300"
            >
              {os}
            </span>
          ))}
        </div>

        {/* Quick CLI Command Box (if available) */}
        {primaryCommand && (
          <div className="mb-4 relative rounded-xl bg-slate-950/80 border border-slate-800/80 p-2 font-mono text-[11px] text-slate-300 flex items-center justify-between group/code">
            <div className="flex items-center space-x-1.5 truncate pr-2">
              <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate text-slate-300 select-all">{primaryCommand}</span>
            </div>
            <button
              onClick={(e) => handleCopy(primaryCommand, e)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Copy installation command"
            >
              {copiedCmd === primaryCommand ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Action Footer: Details & Downloads */}
      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
        <Link
          href={`/tools/${tool.slug}`}
          className="text-xs font-semibold text-slate-300 hover:text-emerald-400 transition-colors flex items-center"
        >
          Inspect Specs
          <ExternalLink className="w-3 h-3 ml-1 text-slate-500" />
        </Link>

        <div className="relative">
          {tool.downloads.length > 1 ? (
            <div className="flex items-center">
              <a
                href={primaryDownload?.downloadUrl || tool.githubRepo}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-l-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
                title={`Download ${primaryDownload?.fileName} (${primaryDownload?.fileSize})`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
              <button
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                className="px-1.5 py-1.5 rounded-r-xl bg-emerald-700 hover:bg-emerald-600 text-slate-950 border-l border-emerald-800 transition-colors"
                title="View all download options"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown for multi-platform downloads */}
              {downloadDropdownOpen && (
                <div
                  className="absolute right-0 bottom-full mb-2 w-64 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2"
                  onMouseLeave={() => setDownloadDropdownOpen(false)}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-800 mb-1">
                    Verified Release Assets
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {tool.downloads.map((dl, idx) => (
                      <a
                        key={idx}
                        href={dl.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col px-2 py-1.5 rounded hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-400 truncate">{dl.platform}</span>
                          <span className="text-[10px] font-mono text-slate-400">{dl.fileSize}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate">{dl.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <a
              href={primaryDownload?.downloadUrl || tool.githubRepo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
