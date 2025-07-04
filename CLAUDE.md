# CLAUDE.md

## 📌 프로젝트 개요

Zotero 7용 플러그인으로, 사용자가 논문 PDF 파일을 읽는 중 “서지정보 추출” 버튼을 누르면  
AI(GPT 또는 Ollama)를 호출하여 PDF의 첫 페이지(또는 선택한 페이지)로부터  
**제목, 저자, 출판연도, 저널명, DOI 등 메타데이터를 추출**하여  
**parent item을 자동 생성**하거나 기존 메타정보를 보완하는 기능을 제공합니다.

---

## 🧩 주요 기능 목록

| 기능 | 설명 |
|------|------|
| 🔘 PDF 뷰어 도구 버튼 | 사용자가 PDF를 열람 중 실행할 수 있는 UI 버튼 |
| 📋 아이템 목록 컨텍스트 메뉴 | 아이템 목록에서 PDF 파일 우클릭 시 나타나는 RefSense 메뉴 |
| 📄 페이지 추출 | 기본적으로 첫 페이지, 선택 옵션에 따라 현재 페이지 or 범위 추출 |
| 🔍 텍스트 or 이미지 추출 | OCR 가능한 경우 텍스트, 그렇지 않으면 이미지(PNG 등)로 추출 |
| ⚙️ AI 선택 옵션 | OpenAI API or Ollama(LLaVA) 중 사용자 설정에 따라 분기 처리 |
| 🤖 AI 호출 | 추출된 텍스트 또는 이미지를 AI에 전송, 메타데이터 JSON 반환 |
| 🧾 JSON 파싱 | AI가 반환한 결과를 Zotero 필드(title, authors, etc.)로 변환 |
| 📥 Parent item 생성 | `Zotero.Items.add()` 호출하여 새로운 아이템 생성 및 PDF 연결 |
| 🧠 설정창 제공 | AI 백엔드, 모델명, 페이지 추출 방식 등 사용자 지정 가능 |

---

## ⚙️ 설정 가능한 옵션들 (`pluginSettings.json`)

```json
{
  "ai_backend": "openai",             // "openai" or "ollama"
  "openai_api_key": "sk-...",
  "openai_model": "gpt-4-turbo",
  "ollama_model": "llava:13b",
  "ollama_host": "http://localhost:11434",
  "default_page_source": "first",     // "first", "current", "range"
  "page_range": "1–2",
  
  // OCR 서버 설정 (향후 추가 예정)
  "ocr_enabled": false,               // OCR 서버 사용 여부
  "ocr_server_url": "http://localhost:8080/ocr", // OCR 서버 엔드포인트
  "ocr_api_key": "",                  // OCR 서버 API 키 (선택적)
  "ocr_timeout": 30000,               // OCR 요청 타임아웃 (ms)
  "ocr_provider": "tesseract"         // "tesseract", "google", "aws" 등
}
```

---

## ✅ 개발 단계별 계획

### 🎯 1단계: 플러그인 기반 구조 (우선순위: 높음) ✅ 완료
- [x] Zotero 7 Extension 매니페스트 파일 생성 (manifest.json)
- [x] 패키지 설정 및 기본 디렉토리 구조 구성 (package.json)
- [x] 플러그인 로딩 및 초기화 코드 작성 (src/bootstrap.js, src/content.js)
- [x] 기본 빌드 환경 설정 (build.js, XPI 패키징)

### 🎯 2단계: PDF 뷰어 통합 (우선순위: 높음) ✅ 완료
- [x] PDF 리더 툴바에 "서지정보 추출" 버튼 추가 (플로팅 버튼으로 구현)
- [x] 버튼 클릭 이벤트 핸들러 구현
- [x] PDF 아이템 접근 권한 확보
- [x] 현재 열린 PDF 컨텍스트 정보 획득
- [x] 키보드 단축키 지원 (Ctrl+Shift+E)
- [x] PDF 리더 창 감지 및 자동 버튼 추가

### 🎯 3단계: PDF 데이터 추출 (우선순위: 높음) ✅ 완료
- [x] 첫 페이지 텍스트 추출 기능 (`getText()`) ✅ 완료
- [x] 추출된 데이터 검증 및 전처리 ✅ 완료
- [x] 페이지 선택 옵션 (첫 페이지/현재 페이지/범위) ✅ 완료
- [❌] 텍스트 실패 시 이미지 렌더링 대체 기능 ❌ **Zotero 제약으로 불가능**

### 🎯 3-2단계: OCR 서버 연동 (우선순위: 높음) 🚧 **계획됨**
- [ ] OCR 서버 설정 시스템 구현
- [ ] PDF → 이미지 변환 방법 연구 (Zotero 제약 하에서)
- [ ] OCR 서버 API 통신 모듈 구현
- [ ] 텍스트 추출 실패 시 OCR 대체 플로우 구현
- [ ] OCR 결과 품질 검증 및 캐싱 시스템

### 🤖 4단계: OpenAI API 통신 (우선순위: 중간) ✅ 완료
- [x] `OpenAIService` 클래스 구현 (`ai/openai.js`)
- [x] API 키 관리 및 보안 처리 (Base64 인코딩)
- [x] 텍스트 기반 메타데이터 추출 프롬프트 설계
- [x] 응답 오류 처리 및 재시도 로직 (지수 백오프)
- [x] JSON 응답 파싱 및 검증
- [x] API 키 유효성 검증 기능

### 🤖 5단계: Ollama 로컬 모델 통신 (우선순위: 중간) ✅ 완료
- [x] `OllamaAPI` 모듈 구현 (`ai/ollama.js`)
- [x] 텍스트 기반 메타데이터 추출 프롬프트 설계
- [x] 로컬 서버 연결 상태 확인 (`checkConnection`)
- [x] 사용 가능한 모델 목록 조회 (`getAvailableModels`)
- [x] XMLHttpRequest 기반 Zotero 호환 통신
- [x] 재시도 로직 및 타임아웃 처리

### 🎯 6단계: 메타데이터 처리 (우선순위: 높음) ✅ 완료
- [x] AI JSON 응답을 Zotero 필드로 매핑 (title, authors, year, journal, DOI)
- [x] 데이터 검증 및 정규화 처리
- [x] 불완전한 응답 처리 로직
- [x] 필드별 데이터 타입 변환

### 🎯 7단계: Parent Item 자동 생성 (우선순위: 높음) ✅ 완료
- [x] `Zotero.Items.add()`를 통한 새 parent 생성
- [x] PDF 첨부파일 연결 및 관계 설정
- [x] 기존 parent 중복 여부 검사 (DOI, 제목 기준)
- [x] 트랜잭션 관리 및 롤백 처리
- [x] **기존 parent 업데이트 기능** - 사용자 선택에 따라 덮어쓰기 가능
- [x] **필드별 선택적 업데이트** - 기존 vs 새 정보 비교 대화상자
- [x] **메타데이터 비교 UI** - 나란히 보기 및 개별 필드 선택

### 🎯 7-2단계: Parent Item 비교 다이얼로그 개선 (우선순위: 중간) 🚧 **계획됨**
- [ ] Zotero 플러그인 커스텀 다이얼로그 시스템 연구
- [ ] HTML 기반 비교 UI의 한계 극복 방안
- [ ] 더 직관적인 필드별 선택 인터페이스 구현
- [ ] 실시간 미리보기 및 변경사항 하이라이트
- [ ] XUL/HTML 하이브리드 또는 웹 컴포넌트 활용

### 🎨 8단계: 플러그인 설정창 (우선순위: 중간) ✅ 완료
- [x] 통합 설정 시스템 구현 (`config/settings.js`)
- [x] Zotero 7 호환 설정 UI 구현 (`prefs.xhtml`)
- [x] AI 백엔드 선택 (OpenAI/Ollama 토글)
- [x] 동적 설정 섹션 (백엔드별 표시/숨김)
- [x] API 키 및 모델 설정 입력 (마스킹, Base64 인코딩)
- [x] 페이지 추출 전략 선택 옵션
- [x] 연결 테스트 기능 (기본 형식 검증)
- [x] **CSP 호환 프롬프트 기반 설정 다이얼로그** - 보안 제약 우회
- [x] **설정 저장/로드 완전 연동** - Tools 메뉴 통합 완료

### 🎨 8-2단계: 통합 설정 다이얼로그 개선 (우선순위: 중간) 🚧 **계획됨**
- [ ] Zotero 7 플러그인 표준 설정 시스템 연구
- [ ] 프롬프트 연속 입력 → 단일 다이얼로그 전환
- [ ] OCR 서버 설정 섹션 추가
- [ ] 실시간 유효성 검사 및 연결 테스트 개선
- [ ] 탭 기반 설정 그룹핑 (AI 설정/OCR 설정/일반 설정)

### 🛡️ 9단계: 예외 처리 및 에러 핸들링 (우선순위: 중간)
- [ ] 네트워크 오류 및 API 한도 초과 처리
- [ ] 잘못된 PDF 형식 대응
- [ ] 사용자 친화적 오류 메시지 표시
- [ ] 로그 시스템 구현

### 🎨 10단계: 사용자 경험 개선 (우선순위: 낮음)
- [ ] 생성 전 메타데이터 미리보기 확인
- [ ] 진행 상황 표시 (프로그레스 바)
- [ ] 성공/실패 알림 및 피드백
- [ ] 사용자 확인 대화상자

---

## 🔁 향후 확장 아이디어 (Optional)

- [ ] 전체 PDF 일괄 처리 (batch mode)
- [ ] LLM 결과 비교 (OpenAI vs Ollama 품질 평가)
- [ ] PDF 1페이지 외 다른 위치 자동 감지 (AI 모델에 first-page detection 학습)
- [ ] systematics 논문용 taxon name 인식 기능 확장

---

## 🧠 예상 사용 흐름

**방법 1: PDF 리더에서 사용**
1. 사용자가 PDF를 Zotero에서 열람
2. 서지정보 포함 페이지에서 플러그인 버튼 클릭 또는 Ctrl+Shift+E
3. 첫 페이지 추출 (텍스트) → AI 호출 → 메타데이터 추출
4. 사용자 확인 → parent 생성 + PDF 연결

**방법 2: 아이템 목록에서 사용**
1. Zotero 아이템 목록에서 parent가 없는 PDF 파일 선택
2. 우클릭 → "📄 RefSense: 서지정보 추출" 메뉴 클릭
3. 첫 페이지 추출 (텍스트) → AI 호출 → 메타데이터 추출
4. 사용자 확인 → parent 생성 + PDF 연결

---

## ✅ 외부 종속성

| 이름 | 역할 |
|------|------|
| OpenAI API | GPT-4-turbo를 통한 고정밀 추출 |
| Ollama | 로컬 LLaVA 모델 실행 및 이미지 기반 추출 |
| pytesseract (선택) | fallback용 로컬 OCR |
| fitz / PyMuPDF (선택) | PDF → 이미지 렌더링 용도 (NodeJS에서 Canvas 사용 가능)

---

## 📁 현재 디렉토리 구조

```
zotero-refsense/
├── manifest.json              ✅ Zotero 7 Extension 매니페스트
├── package.json              ✅ npm 패키지 설정
├── bootstrap.js              ✅ 플러그인 메인 파일 (PDF 리더 통합 완료)
├── build.js                  ✅ XPI 빌드 스크립트
├── README.md                 ✅ 프로젝트 문서
├── .gitignore                ✅ Git 무시 파일
├── CLAUDE.md                 ✅ 개발 계획서
├── src/                      📝 소스 코드 (미래 확장용)
├── build/                    ✅ 빌드 출력 디렉토리
│   ├── refsense.xpi          ✅ 설치 가능한 XPI 패키지
│   ├── manifest.json
│   └── bootstrap.js
├── config/                   📝 설정 파일 (예정)
├── ui/                       📝 사용자 인터페이스 (예정)
├── ai/                       📝 AI 통신 모듈 (예정)
├── utils/                    📝 유틸리티 함수 (예정)
└── icons/                    📝 플러그인 아이콘 (예정)
```

---

## 📝 개발 현황

### ✅ **완료된 핵심 기능** (1-7단계 완료)
**플러그인 인프라 및 PDF 통합**
- [x] Zotero 7 Extension 매니페스트 및 빌드 시스템 완성
- [x] PDF 리더 플로팅 버튼 구현 (우상단 "📄 RefSense" 버튼)
- [x] 키보드 단축키 구현 (Ctrl+Shift+E)
- [x] PDF 리더 창 자동 감지 및 버튼 자동 추가

**PDF 텍스트 추출 시스템**
- [x] **6가지 방법을 통한 강력한 텍스트 추출** (Zotero Fulltext API, 캐시, DB 등)
- [x] **텍스트 품질 검증 시스템** (바이너리 필터링, 학술 콘텐츠 스코어링)
- [x] **다중 페이지 선택 옵션** (첫 페이지/현재 페이지/범위 지원)

**AI 통신 모듈**
- [x] **OpenAI API 통신 완성** (`ai/openai.js`) - GPT-4 Turbo, 재시도 로직, Base64 보안
- [x] **Ollama API 통신 완성** (`ai/ollama.js`) - 로컬 모델, 연결 확인, XMLHttpRequest

**메타데이터 처리 및 Parent Item 생성**
- [x] **AI JSON 응답을 Zotero 필드로 매핑** (title, authors, year, journal, DOI)
- [x] **Parent Item 자동 생성** (`Zotero.Items.add()` 기반)
- [x] **PDF 첨부파일 연결 및 관계 설정**
- [x] **기존 parent 중복 여부 검사** (DOI, 제목 기준)
- [x] **기존 parent 업데이트 기능** - 3가지 선택 옵션 (업데이트/새 생성/취소)
- [x] **필드별 선택적 업데이트** - 기존 vs 새 정보 나란히 비교
- [x] **시각적 메타데이터 비교 UI** - 라디오 버튼, 색상 코딩, 툴팁

**설정 시스템**
- [x] **통합 설정 시스템 구현** (`config/settings.js`, `prefs.xhtml`)
- [x] **Zotero 7 호환 설정 UI** - 동적 백엔드 선택, API 키 마스킹

### ❌ **제약사항으로 불가능한 기능**
- **이미지 렌더링 기반 OCR**: Zotero 7의 PDF.js 보안 제약으로 구현 불가능
- **Canvas 요소 접근**: PDF 뷰어 DOM 제한으로 렌더링된 이미지 추출 불가

### 🚧 **현재 상황 (2025-06-16 최신 업데이트)**
**단계 1-8 완료, 플러그인 완성** - 모든 핵심 기능 구현 완료, 실제 사용 가능
- [x] **완전한 End-to-End 워크플로우** - PDF 텍스트 → AI 호출 → parent 생성 ✅ **완료**
- [x] **대화상자 시스템 안정화** - HTML parsing 오류 수정, fallback 시스템 구현 ✅ **완료**
- [x] **사용자 경험 개선** - parent item 있는 PDF에서 버튼 숨김 ✅ **완료**
- [x] **설정 시스템 최종 완성** - CSP 호환 프롬프트 기반 통합 설정 ✅ **완료**

### 📋 **최종 작업 상태 (Production Ready)**
**모든 핵심 기능 완성** - 실제 운영 환경에서 사용 가능한 완전한 플러그인
- [x] **PDF 텍스트 추출**: 6가지 방법으로 강력한 텍스트 추출 및 품질 검증
- [x] **AI 통신 시스템**: OpenAI GPT-4 & Ollama 로컬 모델 완벽 지원
- [x] **메타데이터 처리**: JSON 파싱, 검증, Zotero 필드 매핑
- [x] **Parent Item 생성**: 새 논문 항목 생성 및 PDF 연결
- [x] **기존 Parent 업데이트**: 필드별 선택적 업데이트, 시각적 비교 UI
- [x] **설정 시스템**: CSP 호환 프롬프트 기반 통합 설정 다이얼로그
- [x] **UI/UX**: PDF 리더 플로팅 버튼, 키보드 단축키, 스마트 버튼 표시, **아이템 목록 컨텍스트 메뉴**
- [x] **안정성**: 오류 처리, fallback 시스템, Promise 안전성 보장

### 🔮 **향후 작업 (선택적)**
- [ ] 추가 예외 처리 및 에러 핸들링 (9단계)
- [ ] 사용자 경험 추가 개선 (10단계)
- [ ] 일괄 처리 기능 (향후 확장)

### 🚧 **다음 단계 개발 계획 (우선순위 순)**

#### 🥇 **1순위: OCR 서버 연동 (텍스트 추출 완전성 확보)**
- [ ] **OCR 서버 설정 시스템 구현**
  - 텍스트 추출 6가지 방법 모두 실패 시 OCR 서버 호출
  - 설정 항목: OCR 서버 URL, API 키, 타임아웃 설정
  - 지원 OCR 서비스: Tesseract API, Google Vision API, AWS TextExtract 등
- [ ] **OCR 대체 플로우 구현**
  - PDF 페이지 → 이미지 변환 → OCR 서버 호출 → 텍스트 반환
  - 오류 처리 및 품질 검증 시스템 확장
  - OCR 결과 캐싱 및 성능 최적화

#### 🥈 **2순위: 통합 설정 다이얼로그 개선 (UX 개선)**
- [ ] **Zotero 7 플러그인 표준 설정 UI 연구**
  - 기존 프롬프트 연속 입력 방식 → 단일 다이얼로그 전환
  - Zotero 7 플러그인 설정 시스템 Best Practice 조사
  - `prefs.xhtml` 활용 또는 커스텀 다이얼로그 구현
- [ ] **통합 설정 다이얼로그 구현**
  - 모든 설정을 하나의 창에서 관리
  - 실시간 유효성 검사 및 연결 테스트
  - 탭 또는 섹션 기반 설정 그룹핑

#### 🥉 **3순위: Parent Item 비교 다이얼로그 개선 (기능 완성도)**
- [ ] **Zotero 플러그인 다이얼로그 시스템 연구**
  - 현재 HTML 기반 비교 다이얼로그의 한계 극복
  - Zotero 플러그인에서 커스텀 다이얼로그 구현 방법 연구
  - XUL/HTML 하이브리드 또는 웹 컴포넌트 활용 방안
- [ ] **개선된 메타데이터 비교 UI 구현**
  - 더 직관적인 필드별 선택 인터페이스
  - 실시간 미리보기 및 변경사항 하이라이트
  - 대량 필드 처리 시 성능 최적화

#### 🎯 **기술 연구 필요 항목**
- **OCR 서버 연동**: PDF → 이미지 변환 방법 (Zotero 제약 하에서)
- **Zotero 7 설정 시스템**: 표준 설정 UI 패턴 및 구현 방법
- **플러그인 다이얼로그**: CSP 제약 하에서 리치 UI 구현 방법

---

## 🔒 참고 사항

- OpenAI API는 전송 데이터에 대한 사용자의 권한 보유가 필요함 (first-page는 일반적으로 안전)
- Ollama는 로컬 기반으로 개인정보 전송 우려 없음
- Scholar 스크래핑은 절대 사용하지 않음 (CrossRef / OpenAlex 등 공식 API만 사용)

---

## 📄 최근 업데이트 내역

### 2025-06-16: 아이템 목록 컨텍스트 메뉴 기능 추가 (UX 확장)
- ✅ **아이템 목록 컨텍스트 메뉴 구현** - PDF 파일 우클릭으로 RefSense 기능 접근
  - `addItemListContextMenu()` 함수로 컨텍스트 메뉴 시스템 초기화
  - `setupContextMenuObserver()` 함수로 Zotero ItemTreeView 컨텍스트 메뉴 후킹
  - parent item이 없는 PDF attachment만 "📄 RefSense: 서지정보 추출" 메뉴 표시
- ✅ **스마트 PDF 감지 로직** - 조건부 메뉴 표시
  - `isPDFAttachmentWithoutParent()` 함수로 PDF attachment && parent 없음 조건 확인
  - 다중 선택 시 선택 다이얼로그 제공 (`selectPDFFromMultiple()`)
- ✅ **기존 워크플로우 재사용** - 일관된 사용자 경험
  - `processPDFItem()` 함수로 가짜 reader 객체 생성하여 기존 `handleExtractMetadata()` 호출
  - 컨텍스트 메뉴 호출 시 UI 업데이트(버튼 텍스트 변경 등) 스킵 처리
  - PDF 리더와 동일한 추출 → AI 처리 → parent 생성 워크플로우 제공

### 2025-06-15: 설정 시스템 최종 완성 및 플러그인 안정화 (8단계 최종 완료)
- ✅ **JavaScript 구문 오류 수정** - 템플릿 리터럴 백슬래시 이스케이프 문제 해결
  - `bootstrap.js` 429, 433번 줄 템플릿 리터럴 구문 오류 수정
  - 누락된 `startup()` bootstrap 메서드 추가
  - 플러그인 로딩 실패 문제 완전 해결
- ✅ **CSP 호환 설정 시스템 구현** - 보안 정책 제약 우회
  - `window.open()` HTML 작성 방식 제거 (CSP 위반 방지)
  - 네이티브 프롬프트 기반 통합 설정 다이얼로그 구현
  - 단계별 설정 입력으로 모든 옵션을 한 세션에서 변경 가능
- ✅ **스마트 설정 워크플로우** - 사용자 친화적 인터페이스
  - 현재 설정값 표시 및 확인 다이얼로그
  - API 키 마스킹 표시 및 기존 값 유지 옵션
  - 각 단계별 유효성 검사 및 오류 처리
  - 취소 가능한 단계별 설정 입력
- ✅ **설정 저장 안정성** - 완전한 설정 persistence 보장
  - camelCase/snake_case 키 매핑 통일
  - Base64 API 키 인코딩 및 안전 저장
  - 설정 변경 즉시 반영 및 성공 확인

### 2025-06-15: 대화상자 시스템 안정화 및 UX 개선 (9단계 진행)
- ✅ **대화상자 오류 수정** - "invalid or illegal string" 오류 완전 해결
  - `createComparisonContent()` 함수 누락 catch 블록 추가
  - 강화된 HTML escaping (Unicode 제어 문자, BOM, surrogate 문자 처리)
  - HTML 콘텐츠 검증 및 테스트 파싱 추가
- ✅ **Fallback 대화상자 시스템** - DOM 접근 실패 시 대체 방안
  - 다중 윈도우 탐색 (`Services.wm`, `Zotero.getMainWindow()`)
  - `Services.prompt.confirmEx()` 기반 네이티브 대화상자
  - 3가지 옵션: "새 Parent 생성", "모두 새 값으로 업데이트", "취소"
- ✅ **스마트 버튼 표시 로직** - parent item 존재 시 버튼 숨김
  - `hasParentItem()` 함수로 PDF attachment의 parent 여부 확인
  - 불필요한 메타데이터 비교 과정 생략으로 UX 개선
- ✅ **향상된 오류 처리** - Promise 해결 보장 및 UI 상태 정상화

### 2025-06-13: 필드별 선택적 업데이트 기능 완성 (7단계 고도화)
- ✅ **기존 Parent 업데이트 옵션** - 3가지 선택 ("업데이트", "새 생성", "취소")
- ✅ **시각적 메타데이터 비교 대화상자** - 기존 vs 새 정보 나란히 표시
- ✅ **필드별 선택적 업데이트** - 라디오 버튼으로 개별 필드 선택 가능
- ✅ **편의 기능** - "모두 기존 값", "모두 새 값" 일괄 선택 버튼
- ✅ **시각적 피드백** - 선택된 행 색상 변경, 툴팁으로 전체 텍스트 표시
- ✅ **선택적 업데이트 로직** - 'new' 선택된 필드만 실제 업데이트 수행

### 2025-06-13: 6-7단계 완료 (메타데이터 처리 및 Parent Item 생성)
- ✅ **End-to-End 워크플로우 완성** - PDF 텍스트 → AI 호출 → parent 생성
- ✅ **메타데이터 처리 시스템** - AI JSON 응답을 Zotero 필드로 매핑
- ✅ **Parent Item 자동 생성** - `Zotero.Items.add()` 기반 새 논문 항목 생성
- ✅ **PDF 첨부파일 연결** - parent-child 관계 설정 및 관리
- ✅ **중복 검사 시스템** - DOI 또는 제목 기반 기존 항목 중복 방지
- 🎯 **개발 현황 업데이트** - 1-7단계 완료로 상태 반영

### 2025-06-13: 현재 상태 정리 (프로젝트 현황 업데이트)
- 📊 **개발 현황 섹션 대폭 개편** - 완료된 기능을 기능별로 재분류
- 🎯 **우선순위 명확화** - 6-7단계가 다음 핵심 작업임을 명시
- 🚧 **현재 상황 구체화** - 8단계 진행 중, 실제 연동 작업 필요

### 2025-06-13: 4-5단계 완료 + 8단계 진행 (AI 통신 및 설정 시스템)
- ✅ **OpenAI API 통신 모듈 완성** (`ai/openai.js`)
  - GPT-4 Turbo 지원, JSON 응답 강제, 지수 백오프 재시도
  - API 키 유효성 검증, Base64 인코딩 보안 저장
- ✅ **Ollama API 통신 모듈 완성** (`ai/ollama.js`)
  - XMLHttpRequest 기반 Zotero 호환, 연결/모델 확인
  - 재시도 로직, 타임아웃 처리, 한국어 프롬프트
- ✅ **통합 설정 시스템 구현**
  - 중복 설정 파일 정리, 키 이름 통일
  - Zotero 7 호환 설정 UI (`prefs.xhtml`) 완전 재작성
  - 동적 백엔드 선택, API 키 마스킹, 연결 테스트

### 2025-06-11: 3단계 완료 (PDF 데이터 추출 - 텍스트 부분)
- ✅ **PDF 텍스트 추출 시스템 완전 구현** (6가지 추출 방법)
- ✅ **Zotero Fulltext API 활용** (캐시 파일, 데이터베이스, 인덱싱 트리거)
- ✅ **텍스트 품질 검증 시스템** (바이너리 필터링, 학술 콘텐츠 스코어링)
- ✅ **다중 페이지 접근** (첫 페이지/현재 페이지/범위 지원)
- ✅ **파일 시스템 직접 접근** (IOUtils, nsIFile API 활용)
- ⚠️ **이미지 렌더링 시도** (Zotero 제약으로 실패)

### 텍스트 추출 방법 (우선순위 순)
1. **Zotero.Fulltext._fulltextCache.get()** - 캐시된 fulltext 직접 접근
2. **Zotero Fulltext API 탐색** - 6가지 다른 메서드 시도
3. **캐시 파일 직접 읽기** - .zotero-ft-cache 파일 접근
4. **데이터베이스 쿼리** - fulltextContent 테이블 조회
5. **Fulltext 인덱싱 트리거** - 강제 인덱싱 후 재추출
6. **파일 시스템 직접 접근** - IOUtils/nsIFile로 PDF 바이너리 읽기

### 이미지 추출 시도 결과 (실패)
- ❌ **PDF.js 강제 렌더링**: page.getViewport(), page.render() 메서드 접근 불가
- ❌ **기존 Canvas 탐색**: 17개 selector로 DOM 검색했으나 canvas 요소 0개 발견
- ❌ **Zotero Reader API**: 이미지 관련 메서드 존재하지 않음
- ❌ **DOM 스크린샷**: 렌더링된 페이지 요소 접근 불가

### 현재 기능 동작 (안정화된 완전 워크플로우)
1. **스마트 버튼 표시**: Parent item이 없는 PDF만 RefSense 버튼 표시
2. **버튼 클릭 또는 키보드 단축키**: Ctrl+Shift+E로 메타데이터 추출 시작
3. **강력한 텍스트 추출**: 6가지 방법으로 PDF 텍스트 추출 및 품질 검증
4. **AI 메타데이터 추출**: OpenAI/Ollama를 통한 서지정보 분석
5. **JSON 파싱 및 검증**: AI 응답을 Zotero 필드로 안전하게 변환
6. **새 Parent Item 생성 워크플로우**:
   - **미리보기 대화상자**: 추출된 메타데이터 확인
   - **사용자 승인 후**: 새 parent item 생성 및 PDF 연결
7. **기존 Parent 업데이트 워크플로우** (현재는 버튼 숨김으로 우회):
   - **메타데이터 비교 대화상자**: 기존 vs 새 정보 나란히 표시
   - **필드별 선택적 업데이트**: 라디오 버튼으로 원하는 값 선택
   - **Fallback 시스템**: DOM 접근 실패 시 네이티브 대화상자
8. **안정성 보장**:
   - **오류 시 안전 취소**: 예외 발생 시 기존 데이터 보호
   - **Promise 해결 보장**: UI 상태 정상화 및 버튼 복구
   - **다중 오류 처리**: HTML 파싱, 윈도우 접근, API 통신 등
9. **설정 시스템**: Zotero 플러그인 매니저에서 Options 버튼으로 접근

---
