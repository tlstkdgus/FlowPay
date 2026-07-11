import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <img
          src="/LOGO.png"
          alt="FlowPay"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <span className={`font-semibold tracking-tight text-gray-900 ${textSizes[size]}`}>
          Flow<span className="text-flow-600">Pay</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
