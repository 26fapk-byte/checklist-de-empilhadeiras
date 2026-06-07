import React from 'react';

interface BrandMarkProps {
  compact?: boolean;
}

const LOGO_SRC = '/icon-512.svg';
const LOGO_COMPACT_SRC = '/icon-192.svg';

export default function BrandMark({ compact = false }: BrandMarkProps) {
  if (compact) {
    return (
      <img
<<<<<<< HEAD
        src={LOGO_COMPACT_SRC}
        alt="TKF LogiCheck"
        className="h-10 w-10 rounded-xl shadow-[0_12px_24px_rgba(15,23,42,0.35)]"
        width={40}
        height={40}
=======
        src="/logo-tkf.png"
        className="h-8 w-auto object-contain"
        alt="Logo TKF"
>>>>>>> 71e48a44c06d50148231a4e67a1b99e65bbfe284
      />
    );
  }

  return (
<<<<<<< HEAD
    <div className="flex items-center gap-3">
      <img
        src={LOGO_SRC}
        alt="TKF LogiCheck"
        className="h-12 w-12 rounded-2xl shadow-[0_14px_30px_rgba(15,23,42,0.35)]"
        width={48}
        height={48}
      />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#94a3b8]">TKF</p>
        <h1 className="text-xl font-semibold tracking-tight text-white">
          Logi<span className="text-[#2563eb]">Check</span>
        </h1>
      </div>
    </div>
=======
    <img
      src="/logo-tkf.png"
      className="h-24 md:h-28 w-auto mx-auto object-contain"
      alt="Logo TKF"
    />
>>>>>>> 71e48a44c06d50148231a4e67a1b99e65bbfe284
  );
}
