# FlowPay

무기명 법인카드의 익명성과 회계 자동화를 동시에 해결하는 결제·정산 관리 시스템입니다.
Flow ID 기반으로 결제 → 자동 분류 → 전표 생성 → 세무 처리까지 끊김 없이 이어집니다.

<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="FlowPay 대시보드" width="820" />
</p>

<p align="center">
  <a href="https://flowpay.vercel.app">데모 바로가기</a>
</p>

---

## 개요

법인카드를 여럿이 함께 쓰는 무기명 방식은 편리하지만, 누가 무엇에 썼는지 추적하기 어렵고
회계 처리를 사람이 일일이 분류해야 하는 한계가 있습니다. FlowPay는 개인정보 대신 익명 토큰인
**Flow ID**로 사용자를 식별해 개인정보 부담 없이 지출을 추적하고, 결제 시점에 부서·카테고리를
자동 분류하여 전표와 세무 처리를 자동화합니다.

## 주요 기능

- **Flow ID 결제** — 개인정보 없이 익명 토큰으로 사용자를 식별하고, FIDO2 패스키(지문·Face ID) 기반 1-Click 결제를 지원합니다.
- **다양한 결제 수단** — FlowPay 간편결제와 카드·가상계좌·계좌이체·간편결제(네이버·카카오·토스)를 함께 제공합니다.
- **영수증 OCR** — 카메라 촬영 또는 파일 업로드한 영수증을 Tesseract.js로 인식하고, 가맹점·금액·부서·카테고리를 자동 추출·분류합니다.
- **실시간 분석** — 부서별 예산 사용률, 카테고리별 지출, 월별 트렌드를 한눈에 확인합니다.
- **자동 전표** — Flow ID 기반으로 전표를 생성하고 승인/거부 워크플로우를 관리하며, 국세청(홈택스) 연동을 지향합니다.
- **PWA** — 홈 화면 설치와 모바일 하단 탭 내비게이션을 지원해 앱처럼 사용할 수 있습니다.

## 화면

| 실시간 분석 | 전표 생성 |
| :---: | :---: |
| <img src="docs/screenshots/analytics.png" width="420" /> | <img src="docs/screenshots/invoice.png" width="420" /> |

| 영수증 OCR | 결제 (모바일) |
| :---: | :---: |
| <img src="docs/screenshots/receipt.png" width="420" /> | <img src="docs/screenshots/payment-mobile.png" width="230" /> |

## 기술 스택

- **프레임워크** — React 19, TypeScript
- **스타일** — Tailwind CSS 3, Framer Motion
- **라우팅** — React Router 7
- **OCR** — Tesseract.js (`kor+eng`)
- **아이콘** — Heroicons
- **배포** — Vercel (PWA)

## 디자인

최종 발표자료(Team klick)의 화면 시안을 기준으로 구성했습니다.

- **색** — 배경 `#F4F4F4` 위 흰 라운드 카드, 브랜드 민트 `#1DCBA0`, 로고의 블루→민트 그라디언트는 카드·토큰 등 브랜드 요소에만 사용
- **폰트** — Pretendard (CDN), 한국어 어절 단위 줄바꿈
- **제목 패턴** — 회색 섹션 라벨 + 굵은 제목 + 민트 강조어 (예: "증빙·전표 처리를 **자동화**합니다")
- **대시보드** — 발표자료의 KPI 카드 4종, 부서별 예산 바, 카테고리별 막대 차트
- **전표 테이블** — 세로 구분선 헤더, 자동 분류 열(계정과목·부서)을 민트 알약으로 강조
- **결제** — 생체 인증 → 가명 토큰(`FL1T-타임스탬프-랜덤`) 발급 → 결제 완료 카드 자동 기록의 3단계
- 데스크톱·모바일 반응형 (모바일 하단 탭 내비게이션)

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 (http://localhost:3000)
npm start

# 프로덕션 빌드
npm run build
```

## 프로젝트 구조

```
FlowPay/
├── public/                  # 정적 파일, PWA 매니페스트, 로고
├── docs/screenshots/        # README용 화면 캡처
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx        # 대시보드 (지출 현황·내 카드·바로가기)
│   │   ├── PGPayment.tsx        # 결제 (수단 선택·워크플로우)
│   │   ├── ReceiptUpload.tsx    # 영수증 OCR
│   │   ├── Analytics.tsx        # 실시간 회계 분석
│   │   ├── InvoiceGenerator.tsx # 자동 전표 생성·승인
│   │   ├── Sidebar.tsx          # 데스크톱 사이드바 + 모바일 탭바
│   │   ├── Logo.tsx
│   │   └── PWAInstallPrompt.tsx
│   ├── App.tsx              # 라우팅·레이아웃
│   ├── index.css           # 디자인 토큰·컴포넌트 클래스
│   └── types/index.ts
├── tailwind.config.js      # 색상·타이포·그림자 토큰
└── vercel.json
```

## 배포

- 저장소: <https://github.com/tlstkdgus/FlowPay>
- 프로덕션: <https://flowpay.vercel.app>
