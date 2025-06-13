// RefSense 기본 설정값 (Zotero 7 호환)

// AI 백엔드 설정
pref("extensions.refsense.aiBackend", "openai");

// OpenAI 설정
pref("extensions.refsense.openaiModel", "gpt-4-turbo");
pref("extensions.refsense.openaiApiKey", "");

// Ollama 설정
pref("extensions.refsense.ollamaModel", "llama3.2:latest");
pref("extensions.refsense.ollamaHost", "http://localhost:11434");

// PDF 추출 설정
pref("extensions.refsense.defaultPageSource", "first");
pref("extensions.refsense.pageRange", "1-2");

// 기타 설정
pref("extensions.refsense.enableLogging", true);
pref("extensions.refsense.maxRetries", 3);
pref("extensions.refsense.requestTimeout", 30000);