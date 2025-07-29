# FlowPay - 무기명 법인카드 혁신적 결제 관리 시스템

## 🚀 프로젝트 개요

FlowPay는 무기명 법인카드의 근본적 한계를 해결하는 혁신적인 결제 관리 시스템입니다. Flow ID 기반의 익명성 보장과 1-Click 결제를 통해 완전 자동화된 회계 처리를 제공합니다.

## ✨ 주요 기능

### 🔐 Flow ID 시스템
- **익명성 보장**: 개인정보 없이 랜덤 토큰으로 사용자 식별
- **1-Click 결제**: FIDO2 패스키를 통한 지문/Face ID 결제
- **자동 분류**: 결제 시 부서와 프로젝트 자동 분류

### 💳 결제 시스템
- **FlowPay 결제**: Flow ID 기반 1-Click 결제
- **일반 PG 결제**: 다양한 결제 방식 지원
- **실시간 워크플로우**: 결제부터 회계 처리까지 자동화

### 📄 AI OCR 영수증 처리
- **실제 OCR 기능**: Tesseract.js 기반 텍스트 추출
- **자동 분류**: 가맹점명과 상품 정보 분석
- **Flow ID 매칭**: 추출된 데이터와 Flow ID 연결

### 📊 실시간 분석
- **부서별 지출 현황**: 실시간 예산 사용률 모니터링
- **카테고리별 분석**: 지출 패턴 분석
- **트렌드 분석**: 월별 지출 트렌드 시각화

### 📋 자동 전표 생성
- **실시간 생성**: Flow ID 기반 자동 전표 생성
- **승인 워크플로우**: 부서별 승인자 자동 배정
- **국세청 연동**: 승인된 전표의 자동 세무 처리

## 🛠 기술 스택

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **OCR**: Tesseract.js
- **Icons**: Heroicons
- **Routing**: React Router DOM

## 🚀 배포

### GitHub
- 저장소: [https://github.com/tlstkdgus/FlowPay.git](https://github.com/tlstkdgus/FlowPay.git)

### Vercel 배포
- 프로덕션 URL: [https://flowpay.vercel.app](https://flowpay.vercel.app)

## 📱 사용법

1. **대시보드**: 전체 시스템 개요 및 최근 결제 내역 확인
2. **결제하기**: FlowPay 또는 일반 결제 방식으로 결제
3. **영수증 업로드**: AI OCR로 영수증 자동 인식 및 분류
4. **실시간 분석**: 부서별 지출 현황과 트렌드 분석
5. **전표 생성**: 자동 생성된 전표 관리 및 승인

## 🔧 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/tlstkdgus/FlowPay.git
cd FlowPay

# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 빌드
npm run build
```

## 📁 프로젝트 구조

```
flowpay/
├── public/
│   └── LOGO.png          # FlowPay 로고
├── src/
│   ├── components/
│   │   ├── Analytics.tsx     # 실시간 분석 페이지
│   │   ├── Dashboard.tsx     # 메인 대시보드
│   │   ├── InvoiceGenerator.tsx  # 전표 생성 페이지
│   │   ├── Logo.tsx         # 로고 컴포넌트
│   │   ├── PGPayment.tsx    # 결제 페이지
│   │   ├── ReceiptUpload.tsx # OCR 영수증 처리
│   │   └── Sidebar.tsx      # 사이드바 네비게이션
│   ├── App.tsx             # 메인 앱 컴포넌트
│   ├── index.css           # 글로벌 스타일
│   └── index.tsx           # 앱 진입점
├── tailwind.config.js      # Tailwind CSS 설정
├── package.json           # 프로젝트 의존성
└── vercel.json           # Vercel 배포 설정
```

## 🎯 핵심 혁신

1. **무기명 카드 문제 해결**: Flow ID로 익명성 유지하면서 사용자 추적
2. **완전 자동화**: 결제부터 회계 처리까지 모든 과정 자동화
3. **실시간 처리**: AI OCR과 실시간 분석으로 즉시 결과 제공
4. **개인정보보호**: 개인정보 없이도 정확한 회계 처리 가능


**FlowPay** - 무기명 법인카드의 혁신적 해결책 🚀
