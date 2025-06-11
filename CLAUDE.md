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
  "page_range": "1–2"
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

### 🎯 3단계: PDF 데이터 추출 (우선순위: 높음)
- [ ] 첫 페이지 텍스트 추출 기능 (`getText()`)
- [ ] 텍스트 실패 시 이미지 렌더링 대체 기능
- [ ] 페이지 선택 옵션 (첫 페이지/현재 페이지/범위)
- [ ] 추출된 데이터 검증 및 전처리

### 🤖 4단계: OpenAI API 통신 (우선순위: 중간)
- [ ] `queryOpenAI(text, model, key)` 함수 작성
- [ ] API 키 관리 및 보안 처리
- [ ] 텍스트 기반 메타데이터 추출 프롬프트 설계
- [ ] 응답 오류 처리 및 재시도 로직

### 🤖 5단계: Ollama 로컬 모델 통신 (우선순위: 중간)
- [ ] `queryOllama(imagePath, model, host)` 함수 작성
- [ ] 이미지 기반 메타데이터 추출 프롬프트 설계
- [ ] 로컬 서버 연결 상태 확인
- [ ] LLaVA 모델 호환성 검증

### 🎯 6단계: 메타데이터 처리 (우선순위: 높음)
- [ ] AI JSON 응답을 Zotero 필드로 매핑 (title, authors, year, journal, DOI)
- [ ] 데이터 검증 및 정규화 처리
- [ ] 불완전한 응답 처리 로직
- [ ] 필드별 데이터 타입 변환

### 🎯 7단계: Parent Item 자동 생성 (우선순위: 높음)
- [ ] `Zotero.Items.add()`를 통한 새 parent 생성
- [ ] PDF 첨부파일 연결 및 관계 설정
- [ ] 기존 parent 중복 여부 검사 (DOI, 제목 기준)
- [ ] 트랜잭션 관리 및 롤백 처리

### 🎨 8단계: 플러그인 설정창 (우선순위: 중간)
- [ ] 설정창 UI 구현 (HTML/XUL 패널)
- [ ] AI 백엔드 선택 (OpenAI/Ollama)
- [ ] API 키 및 모델 설정 입력
- [ ] 페이지 추출 전략 선택 옵션

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

1. 사용자가 PDF를 Zotero에서 열람
2. 서지정보 포함 페이지에서 플러그인 버튼 클릭
3. 첫 페이지 추출 (텍스트 or 이미지)
4. AI 호출 → 메타데이터 추출
5. 사용자 확인 → parent 생성 + PDF 연결

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

### ✅ 완료된 작업 (1-2단계)
- [x] 프로젝트 스캐폴딩 및 기본 구조 완성
- [x] Zotero 7 호환 매니페스트 작성
- [x] 플러그인 생명주기 관리 (startup/shutdown)
- [x] 설정 시스템 기본 구조
- [x] 빌드 시스템 및 XPI 패키징
- [x] 기본 로깅 및 에러 핸들링
- [x] PDF 리더 플로팅 버튼 구현 (우상단 "📄 RefSense" 버튼)
- [x] PDF 리더 창 자동 감지 및 버튼 자동 추가
- [x] 키보드 단축키 구현 (Ctrl+Shift+E)
- [x] PDF 컨텍스트 정보 추출 (파일명, 페이지 수, 현재 페이지, 부모 항목 등)
- [x] 견고한 에러 핸들링 및 UI 피드백

### 🚧 진행 중인 작업
- 없음

### 📋 다음 단계 (3단계 - PDF 데이터 추출)
- [ ] PDF 첫 페이지 텍스트 추출 기능
- [ ] 텍스트 추출 실패 시 이미지 렌더링 대체 기능
- [ ] 페이지 선택 옵션 (첫 페이지/현재 페이지/범위)
- [ ] 추출된 데이터 검증 및 전처리

### 🔮 향후 작업
- [ ] AI 호출 및 설정 연동 (4-5단계)
- [ ] parent 생성 자동화 및 UI 미리보기 (6-7단계)

---

## 🔒 참고 사항

- OpenAI API는 전송 데이터에 대한 사용자의 권한 보유가 필요함 (first-page는 일반적으로 안전)
- Ollama는 로컬 기반으로 개인정보 전송 우려 없음
- Scholar 스크래핑은 절대 사용하지 않음 (CrossRef / OpenAlex 등 공식 API만 사용)

---

## 📄 최근 업데이트 내역

### 2025-06-11: 2단계 완료 (PDF 뷰어 통합)
- ✅ PDF 리더에 플로팅 버튼 추가 완료
- ✅ Zotero.Reader API를 활용한 PDF 컨텍스트 접근 구현
- ✅ 키보드 단축키 (Ctrl+Shift+E) 지원 추가
- ✅ PDF 리더 창 자동 감지 및 버튼 자동 추가 로직 완성
- ✅ 견고한 에러 핸들링 및 사용자 피드백 구현
- ✅ 팝업 알림 제거로 사용자 경험 개선

### 플로팅 버튼 특징
- 위치: PDF 리더 창 우상단
- 디자인: 녹색 배경에 "📄 RefSense" 텍스트
- 기능: 클릭 시 PDF 메타데이터 분석 정보 표시
- 호버 효과: 마우스 오버 시 색상 변화 및 확대
- 접근성: 키보드 단축키로도 동일한 기능 실행 가능

### 현재 기능 동작
1. PDF 파일 열기 시 자동으로 RefSense 버튼 추가
2. 버튼 클릭 또는 Ctrl+Shift+E 입력
3. PDF 컨텍스트 정보 분석 (파일명, 페이지 수, 부모 항목 등)
4. 분석 결과를 알림창으로 표시
5. 다음 단계(PDF 내용 추출)를 위한 준비 완료

---
