# AI 상세페이지 도우미 - 상세페이지 생성기

제품 한 줄만 입력하면 AI가 자동으로 상세페이지를 생성해주는 플랫폼입니다.

## 기능

- 🤖 AI 기반 상세페이지 자동 생성
- 📝 제품명 입력만으로 완전한 상세페이지 생성
- 💾 생성된 상세페이지 HTML 다운로드
- 🎨 모던하고 반응형인 UI 디자인
- ✨ 제품 카테고리별 맞춤형 콘텐츠 생성

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정 (선택사항)

`.env.local` 파일을 생성하고 API 키를 설정하세요:

```env.local
# OpenAI API 키 (텍스트 생성용 - 우선 사용)
OPENAI_API_KEY=your-openai-api-key-here

# Google AI Studio API 키 (텍스트 생성용 - OpenAI 실패 시 사용, 이미지 생성용)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# Pexels API 키 (이미지 검색용 - 선택사항)
PEXELS_API_KEY=your-pexels-api-key-here

# 나노바나나 API 키 (이미지 생성용 - 선택사항)
NANOBANAN_API_KEY=your-nanobanan-api-key-here
# 나노바나나 API 엔드포인트 (기본값: https://api.nanobanan.com/v1/images/generate)
NANOBANAN_API_URL=https://api.nanobanan.com/v1/images/generate
```

**참고**: 
- API 키가 없어도 작동합니다. API 키가 없으면 목 데이터가 사용됩니다.
- **텍스트 생성**: OpenAI API를 우선 사용하고, 실패 시 Google Gemini API를 사용합니다.
- **이미지 생성 우선순위**: 
  1. Google AI Studio Imagen API
  2. Pexels API (이미지 검색)
  3. 나노바나나 API (이미지 생성)
  4. SVG 플레이스홀더 (모든 API 실패 시)

**API 키 발급:**
- OpenAI API 키: [OpenAI Platform](https://platform.openai.com/api-keys)에서 발급받을 수 있습니다.
- Google AI Studio API 키: [Google AI Studio](https://aistudio.google.com)에서 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 사용 방법

1. 메인 페이지에서 제품명을 입력합니다
   - 예: "유기농 아기용 천연 세제 500ml"
2. "생성하기" 버튼을 클릭합니다
3. AI가 생성한 상세페이지를 확인합니다
4. "HTML 다운로드" 버튼으로 완성된 HTML 파일을 다운로드합니다

## 기술 스택

- **Next.js 16** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **OpenAI (GPT-4o-mini)** - AI 텍스트 생성 (우선 사용)
- **Google AI Studio (Gemini)** - AI 텍스트 생성 (대체)
- **Google AI Studio (Imagen)** - AI 이미지 생성 (우선 사용)
- **Pexels API** - 무료 스톡 이미지 검색
- **나노바나나 API** - AI 이미지 생성
- **Lucide React** - 아이콘

## 프로젝트 구조

```
detailpage/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts      # 상세페이지 생성 API
│   ├── page.tsx              # 메인 페이지
│   ├── layout.tsx            # 레이아웃
│   └── globals.css           # 전역 스타일
└── README.md
```

## 배포

Vercel을 사용하여 간단하게 배포할 수 있습니다:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/detailpage)

또는 다른 플랫폼으로 배포할 수 있습니다:

```bash
npm run build
npm start
```

## 라이선스

MIT
