import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center space-x-3 ${className}`}
    >
      {/* 실제 로고 이미지 */}
      <div className={`${sizeClasses[size]} relative`}>
        <img
          src="/LOGO.png"
          alt="FlowPay Logo"
          className="w-full h-full object-contain"
        />
      </div>
      
      {/* 텍스트 */}
      {showText && (
        <div className={`font-bold text-gray-800 ${textSizes[size]}`}>
          <div>FLOW</div>
          <div className="flex items-center">
            <span>PAY</span>
            <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full ml-1"></div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Logo; 