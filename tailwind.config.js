/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 발표자료(Klick_FlowPay) 기준 뉴트럴 — 배경 #F4F4F4, 본문 잉크 #2F2F2F
        // (모든 text-gray-*, bg-gray-*, border-gray-* 가 자동으로 이 톤이 됨)
        gray: {
          50: '#f4f4f4',
          100: '#ededed',
          200: '#e3e3e3',
          300: '#d0d0d0',
          400: '#a8a8a8',
          500: '#8a8a8a',
          600: '#6b6b6b',
          700: '#4f4f4f',
          800: '#3a3a3a',
          900: '#2f2f2f',
        },
        // 브랜드 민트 — 로고 하단 색(#2DE0B5)과 발표자료 CTA(#1DCBA0) 기준
        flow: {
          50: '#effcf8',
          100: '#d5f7ee',
          200: '#abefdc',
          300: '#74e3c5',
          400: '#3fd8b0',
          500: '#1dcba0',
          600: '#14ad88',
          700: '#0f8b6d',
          800: '#0f6e58',
          900: '#0e5a49',
        },
        // 로고 상단 블루 — 발표자료에서 '부서'·'법인카드' 강조에 쓰인 보조색
        sky: {
          50: '#eef8ff',
          100: '#d8efff',
          400: '#45b4f6',
          500: '#1a9be6',
          600: '#0f7fc4',
        },
        success: {
          50: '#effcf8',
          100: '#d5f7ee',
          500: '#1dcba0',
          600: '#14ad88',
          700: '#0f8b6d',
        },
        warning: {
          50: '#fff8e6',
          100: '#ffefc2',
          400: '#ffd66b',
          500: '#f5b300',
          600: '#c98f00',
          700: '#8f6600',
        },
        // 발표자료 Problem 슬라이드의 레드(#D93A3A)
        error: {
          50: '#fdf0f0',
          100: '#fbdcdc',
          400: '#f08a8a',
          500: '#d93a3a',
          600: '#c02a2a',
          700: '#9c2020',
        },
      },
      fontFamily: {
        sans: [
          '"Pretendard Variable"',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
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
        'soft': '0 1px 2px rgba(0, 0, 0, 0.04)',
        'medium': '0 6px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04)',
        'large': '0 16px 48px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.05)',
        'mint': '0 8px 24px rgba(29, 203, 160, 0.28)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
