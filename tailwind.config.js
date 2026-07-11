/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple 무채색 팔레트로 기본 gray 오버라이드
        // (모든 text-gray-*, bg-gray-*, border-gray-* 가 자동으로 Apple 톤이 됨)
        gray: {
          50: '#fbfbfd',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#a1a1a6',
          500: '#86868b',
          600: '#6e6e73',
          700: '#515154',
          800: '#3a3a3c',
          900: '#1d1d1f',
        },
        // 브랜드 accent (teal) — 강조·링크·활성 상태에만 절제하여 사용
        flow: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // 상태 색 — 채도를 낮춰 무채색 배경과 조화
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#30b350',
          600: '#248a3d',
          700: '#1c6e31',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#c2760c',
          700: '#92580a',
          800: '#78460b',
          900: '#5c360c',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e0301e',
          600: '#c31c14',
          700: '#a01410',
          800: '#821512',
          900: '#6b1512',
        },
      },
      fontFamily: {
        // SF Pro 우선 — Apple 시스템 폰트 스택
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          'Inter',
          '"Apple SD Gothic Neo"',
          '"Pretendard"',
          'system-ui',
          'sans-serif',
        ],
      },
      letterSpacing: {
        tightest: '-0.03em',
        tighter: '-0.022em',
      },
      borderRadius: {
        '4xl': '1.5rem',
        '5xl': '2rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        // 은은한 그림자 — Apple 특유의 절제된 elevation
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04)',
        'large': '0 12px 40px rgba(0, 0, 0, 0.10), 0 2px 8px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
