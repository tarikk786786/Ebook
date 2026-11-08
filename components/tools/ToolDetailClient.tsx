'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { EbookTool } from '@/lib/tools';
import { 
  Download, 
  ExternalLink, 
  Star, 
  GitFork, 
  AlertCircle, 
  ShieldCheck, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  ArrowLeft, 
  Calendar, 
  Cpu, 
  CheckCircle2, 
  FileCode, 
  Layers, 
  Globe, 
  HelpCircle,
  FileCheck,
  Hash,
  Info,
  Laptop,
  FileText,
  UploadCloud,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';

interface ToolDetailClientProps {
  tool: EbookTool;
  relatedTools: EbookTool[];
}

export default function ToolDetailClient({ tool, relatedTools }: ToolDetailClientProps) {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  // Client-Side SHA-256 Checksum Verifier State
  const [verifierFile, setVerifierFile] = useState<File | null>(null);
  const [computedHash, setComputedHash] = useState<string>('');
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [manualCompareHash, setManualCompareHash] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const computeFileHash = async (file: File) => {
    setIsHashing(true);
    setVerifierFile(file);
    try {
      const buffer = await file.arrayBuffer();
      const digest = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(digest));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setComputedHash(hashHex);
    } catch (err) {
      console.error('Hashing error:', err);
    } finally {
      setIsHashing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      computeFileHash(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      computeFileHash(e.target.files[0]);
    }
  };

  const releaseChecksums = tool.latestRelease?.checksums ? Object.values(tool.latestRelease.checksums) : [];
  const assetChecksums = tool.downloads.map((d: any) => d.checksum).filter(Boolean) as string[];
  const knownChecksums = [...releaseChecksums, ...assetChecksums].map((c) => c.toLowerCase());

  const isOfficialMatch = computedHash && knownChecksums.includes(computedHash.toLowerCase());
  const isManualMatch =
    computedHash &&
    manualCompareHash &&
    computedHash.toLowerCase() === manualCompareHash.trim().toLowerCase();

  const [activeInstallTab, setActiveInstallTab] = useState<string>(
    Object.keys(tool.packageInstallCommands)[0] || 'git'
  );

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const installTabs = [
    ...Object.entries(tool.packageInstallCommands).map(([key, cmd]) => ({
      key,
      label: key.toUpperCase(),
      cmd,
    })),
    ...(tool.dockerImage
      ? [{ key: 'docker', label: 'DOCKER', cmd: `docker pull ${tool.dockerImage}` }]
      : []),
    { key: 'git', label: 'GIT CLONE', cmd: tool.gitCloneCommand },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-6">
          <Link href="/tools" className="hover:text-emerald-400 flex items-center transition-colors">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Ebook Tools Directory
          </Link>
          <span>/</span>
          <span className="text-slate-500">{tool.category}</span>
          <span>/</span>
          <span className="text-white font-medium">{tool.name}</span>
        </div>

        {/* Hero Header Card */}
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#0F1624]/95 to-slate-900/90 border border-slate-800/80 p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                  {tool.category}
                </span>
                {tool.verifiedAuthentic && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-emerald-400 border border-slate-700/60">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    Verified Authentic Release
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-400 bg-slate-800/60 border border-slate-700/40">
                  {tool.license}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-3">
                {tool.name}
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-light mb-6">
                {tool.shortDescription}
              </p>

              {/* GitHub Metrics Bar */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <a
                  href={tool.githubRepo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-amber-400 hover:text-amber-300 transition-colors"
                >
                  <Star className="w-4 h-4 fill-amber-400 mr-1.5" />
                  <span>{tool.stars.toLocaleString()} Stars</span>
                </a>
                <span className="flex items-center text-slate-400">
                  <GitFork className="w-4 h-4 mr-1.5" />
                  <span>{tool.forks.toLocaleString()} Forks</span>
                </span>
                <span className="flex items-center text-slate-400">
                  <Cpu className="w-4 h-4 mr-1.5 text-teal-400" />
                  <span>{tool.primaryLanguage}</span>
                </span>
                <span className="flex items-center text-slate-400">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
                  <span>Release: {tool.latestRelease?.version}</span>
                </span>
              </div>
            </div>

            {/* Quick Action Links */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 w-full lg:w-auto">
              <a
                href="#download-section"
                className="flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Assets</span>
              </a>

              {tool.officialWebsite && (
                <a
                  href={tool.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition-colors"
                >
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Official Website</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}

              {tool.documentation && (
                <a
                  href={tool.documentation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-xs font-bold transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-teal-400" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Main 2 Columns: Overview & Features & Installation */}
          <div className="lg:col-span-2 space-y-8">
            {/* Detailed Description */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-emerald-400" />
                Tool Overview
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6 font-light">
                {tool.detailedDescription}
              </p>

              {/* Requirements Banner */}
              <div className="rounded-xl bg-slate-950/80 border border-slate-800/90 p-4 text-xs text-slate-300 flex items-start space-x-3">
                <Laptop className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">System Requirements: </span>
                  <span className="text-slate-400">{tool.requirements}</span>
                </div>
              </div>
            </div>

            {/* Core Features */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-400" />
                Key Capabilities & Features
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tool.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/60 text-xs text-slate-300"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Package Manager / Terminal Installation Guide */}
            <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                <Terminal className="w-5 h-5 mr-2 text-emerald-400" />
                Package Manager & CLI Installation
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Install and update {tool.name} using your preferred operating system package manager or container runtime:
              </p>

              {/* Tabs */}
              <div className="flex flex-wrap gap-1.5 mb-3 border-b border-slate-800 pb-2">
                {installTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveInstallTab(tab.key)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                      activeInstallTab === tab.key
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Command Box */}
              {installTabs.map((tab) => {
                if (tab.key !== activeInstallTab) return null;
                return (
                  <div
                    key={tab.key}
                    className="relative rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-300 flex items-center justify-between"
                  >
                    <div className="overflow-x-auto whitespace-pre pr-4">
                      <span className="text-slate-500 select-none">$ </span>
                      {tab.cmd}
                    </div>
                    <button
                      onClick={() => handleCopy(tab.cmd)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center space-x-1 shrink-0 transition-colors"
                      title="Copy command"
                    >
                      {copiedCmd === tab.cmd ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* PROMINENT DOWNLOAD SECTION */}
            <div id="download-section" className="rounded-2xl bg-gradient-to-b from-slate-900 to-[#101726] border-2 border-emerald-500/40 p-6 sm:p-8 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black text-white flex items-center">
                  <Download className="w-6 h-6 mr-2 text-emerald-400" />
                  Verified Official Release Downloads
                </h2>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800/60">
                  {tool.latestRelease?.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                All binaries are sourced directly from the official developer release assets without re-packaging or modifications.
              </p>

              {/* Assets List */}
              <div className="space-y-3 mb-6">
                {tool.downloads.map((asset, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white font-mono">{asset.platform}</span>
                        {asset.verified && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 truncate mt-0.5">
                        {asset.fileName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-3">
                        <span>Size: {asset.fileSize}</span>
                        {asset.downloadCount > 0 && <span>Downloads: {asset.downloadCount.toLocaleString()}</span>}
                      </div>
                    </div>

                    <a
                      href={asset.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {asset.platform.split(' ')[0]}</span>
                    </a>
                  </div>
                ))}
              </div>

              {/* Client-Side Cryptographic SHA-256 Checksum Verifier */}
              <div className="mb-6 rounded-2xl bg-slate-950/80 border border-emerald-500/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Client-Side SHA-256 Binary Integrity Verifier</h4>
                      <p className="text-[11px] text-slate-400">
                        100% Client-Side. Verified locally in your browser using the Web Crypto API. No files are uploaded.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                    dragOver
                      ? 'border-emerald-400 bg-emerald-950/20'
                      : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
                  }`}
                  onClick={() => document.getElementById('checksum-file-input')?.click()}
                >
                  <input
                    id="checksum-file-input"
                    type="file"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                      {isHashing ? (
                        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-xs text-slate-300 font-medium">
                      {verifierFile ? (
                        <span className="text-emerald-400 font-mono font-bold">{verifierFile.name} ({(verifierFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                      ) : (
                        <>Drag & drop downloaded binary here, or <span className="text-emerald-400 underline">browse file</span></>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Computes SHA-256 hash in real-time to guarantee file authenticity against developer releases.
                    </p>
                  </div>
                </div>

                {/* Hash Result Display */}
                {computedHash && (
                  <div className="space-y-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          Computed SHA-256 Hash
                        </span>
                        <button
                          onClick={() => handleCopy(computedHash)}
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCmd === computedHash ? 'Copied' : 'Copy Hash'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-300 break-all select-all">
                        {computedHash}
                      </div>
                    </div>

                    {/* Verification Indicators */}
                    {isOfficialMatch ? (
                      <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-center space-x-2 text-xs text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span><strong>✓ Authenticity Verified!</strong> Matches official release checksum recorded in AnonTrove registry.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">
                          Compare against official developer checksum (paste below):
                        </div>
                        <input
                          type="text"
                          placeholder="Paste expected SHA-256 hash here..."
                          value={manualCompareHash}
                          onChange={(e) => setManualCompareHash(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                        />
                        {manualCompareHash && (
                          <div className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 ${
                            isManualMatch
                              ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300'
                              : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
                          }`}>
                            {isManualMatch ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Checksum Match! The binary has not been tampered with.</span>
                              </>
                            ) : (
                              <>
                                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                                <span>Checksum mismatch. Ensure the correct platform release is being verified.</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Checksum & Security Footnote */}
              <div className="rounded-xl bg-slate-950/60 border border-slate-800/60 p-4 text-xs text-slate-400 flex items-start space-x-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-200">Security Verification Status: {tool.securityStatus}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Downloads link directly to the official GitHub releases hosted by <span className="font-mono text-slate-300">{tool.repoFullName}</span>. Files are checked for authentic digital developer signatures and verified against open-source repository tags.
                  </p>
                </div>
              </div>
            </div>

            {/* Release Notes */}
            {tool.latestRelease?.releaseNotes && (
              <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-teal-400" />
                  Latest Release Changelog ({tool.latestRelease.version})
                </h3>
                <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                  {tool.latestRelease.releaseNotes}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar 1 Column: Metadata, Compatibility, Related Tools */}
          <div className="space-y-6">
            {/* Specifications Card */}
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-emerald-400" />
                Specifications & Compatibility
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-1">Supported Ebook Formats</span>
                  <div className="flex flex-wrap gap-1">
                    {tool.supportedFormats.map((fmt) => (
                      <span
                        key={fmt}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-1">Supported Operating Systems</span>
                  <div className="flex flex-wrap gap-1">
                    {tool.supportedOs.map((os) => (
                      <span
                        key={os}
                        className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium text-[11px]"
                      >
                        {os}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Primary Language</span>
                  <span className="font-semibold text-slate-200">{tool.primaryLanguage}</span>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Software License</span>
                  <span className="font-semibold text-slate-200">{tool.license}</span>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Official Repository</span>
                  <a
                    href={tool.githubRepo}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:underline break-all"
                  >
                    {tool.repoFullName}
                  </a>
                </div>

                <div className="pt-3 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-0.5">Last Checked & Verified</span>
                  <span className="font-mono text-slate-400">{tool.lastCheckedDate}</span>
                </div>
              </div>
            </div>

            {/* Related Tools */}
            {relatedTools.length > 0 && (
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Related Ebook Tools
                </h3>
                <div className="space-y-3">
                  {relatedTools.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/tools/${rel.slug}`}
                      className="block p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                          {rel.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-400">
                          ★ {(rel.stars / 1000).toFixed(1)}k
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{rel.shortDescription}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>AnonTrove Ebook Tools Directory • Official Open-Source Repository Tracking</div>
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-emerald-400 transition-colors">Store</Link>
            <Link href="/tools" className="hover:text-emerald-400 transition-colors">Tools</Link>
            <Link href="/library" className="hover:text-emerald-400 transition-colors">My Library</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
