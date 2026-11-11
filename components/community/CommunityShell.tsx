'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

type CommunityShellProps = {
  children: React.ReactNode;
  className?: string;
};

export default function CommunityShell({ children, className = '' }: CommunityShellProps) {
  return (
    <div className={`min-h-screen bg-[#F7F5F0] text-[#24231F] flex flex-col font-sans ${className}`}>
      <Navbar />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
