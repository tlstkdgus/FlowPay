import React, { useId } from 'react';

interface LogoMarkProps {
  className?: string;
}

// 발표자료 로고 심볼을 SVG로 재현 — LOGO.png는 워드마크까지 포함돼 작은 크기에서 글자가 뭉개진다
export const LogoMark: React.FC<LogoMarkProps> = ({ className = 'w-8 h-8' }) => {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`fp-a-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#45B4F6" />
          <stop offset="100%" stopColor="#2DE0B5" />
        </linearGradient>
        <linearGradient id={`fp-b-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2DE0B5" />
          <stop offset="50%" stopColor="#9AF0C9" />
          <stop offset="100%" stopColor="#2DE0B5" />
        </linearGradient>
      </defs>
      <g fill="none" strokeLinecap="round" strokeWidth="13">
        <path d="M14 78 Q50 58 86 78" stroke={`url(#fp-b-${id})`} opacity="0.9" />
        <path d="M50 12 C50 48 44 64 14 78" stroke={`url(#fp-a-${id})`} opacity="0.85" />
        <path d="M50 12 C50 48 56 64 86 78" stroke={`url(#fp-a-${id})`} opacity="0.6" />
      </g>
    </svg>
  );
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const markSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark className={markSizes[size]} />
      {showText && (
        <span className={`font-bold tracking-tight text-gray-900 ${textSizes[size]}`}>FlowPay</span>
      )}
    </div>
  );
};

// 발표자료의 'FlowID FL1T-…' 칩 — 로고 심볼 + 굵은 라벨 + 식별자
export const FlowIdChip: React.FC<{ flowId: string; className?: string }> = ({ flowId, className = '' }) => (
  <div
    className={`inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 ${className}`}
  >
    <LogoMark className="w-5 h-5 flex-shrink-0" />
    <span className="text-sm font-bold text-gray-900">FlowID</span>
    <span className="text-sm text-gray-600 tracking-wide truncate">{flowId}</span>
  </div>
);

export default Logo;
