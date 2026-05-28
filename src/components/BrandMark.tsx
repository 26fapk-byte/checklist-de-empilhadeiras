import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  if (compact) {
    return (
      <div className="relative h-10 w-10 rounded-xl border border-white/10 bg-[#0f172a] shadow-[0_12px_24px_rgba(15,23,42,0.35)]">
        <span className="absolute left-[8px] top-[7px] text-sm font-bold tracking-tight text-white">TK</span>
        <span className="absolute right-[6px] bottom-[5px] text-[10px] font-semibold text-[#2563eb]">F</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 rounded-2xl border border-white/10 bg-[#0f172a] shadow-[0_14px_30px_rgba(15,23,42,0.35)]">
        <span className="absolute left-[9px] top-[7px] text-lg font-bold tracking-tight text-white">TK</span>
        <span className="absolute right-[7px] bottom-[6px] text-[11px] font-semibold text-[#2563eb]">F</span>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#94a3b8]">TKF</p>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Logi<span className="text-[#2563eb]">Check</span>
        </h1>
      </div>
    </div>
  );
}
