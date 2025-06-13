/**
 * RefSense 통합 설정 관리 모듈
 * Zotero 7 호환 설정 시스템
 */

class SettingsManager {
    constructor() {
        this.prefBranch = 'extensions.refsense.';
        this.defaultSettings = {
            // AI 백엔드 설정
            aiBackend: 'openai', // 'openai' | 'ollama'
            
            // OpenAI 설정
            openaiModel: 'gpt-4-turbo',
            openaiApiKey: '', // Base64 인코딩되어 저장됨
            
            // Ollama 설정
            ollamaModel: 'llama3.2:latest',
            ollamaHost: 'http://localhost:11434',
            
            // PDF 추출 설정
            defaultPageSource: 'first', // 'first' | 'current' | 'range'
            pageRange: '1-2',
            
            // 기타 설정
            enableLogging: true,
            maxRetries: 3,
            requestTimeout: 30000 // 30초
        };
    }

    /**
     * 설정값 가져오기
     * @param {string} key - 설정 키
     * @param {*} defaultValue - 기본값
     * @returns {*} 설정값
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefBranch + key;
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // 키가 존재하는지 확인
            if (!prefs.prefHasUserValue(fullKey)) {
                return defaultValue !== null ? defaultValue : this.defaultSettings[key];
            }

            // 타입에 따라 적절한 메서드 사용
            const prefType = prefs.getPrefType(fullKey);
            switch (prefType) {
                case prefs.PREF_STRING:
                    return prefs.getCharPref(fullKey);
                case prefs.PREF_INT:
                    return prefs.getIntPref(fullKey);
                case prefs.PREF_BOOL:
                    return prefs.getBoolPref(fullKey);
                default:
                    return defaultValue !== null ? defaultValue : this.defaultSettings[key];
            }
        } catch (error) {
            console.error(`설정 읽기 실패 (${key}):`, error);
            return defaultValue !== null ? defaultValue : this.defaultSettings[key];
        }
    }

    /**
     * 설정값 저장하기
     * @param {string} key - 설정 키
     * @param {*} value - 저장할 값
     */
    set(key, value) {
        try {
            const fullKey = this.prefBranch + key;
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // 타입에 따라 적절한 메서드 사용
            if (typeof value === 'string') {
                prefs.setCharPref(fullKey, value);
            } else if (typeof value === 'number') {
                prefs.setIntPref(fullKey, value);
            } else if (typeof value === 'boolean') {
                prefs.setBoolPref(fullKey, value);
            } else {
                // 복잡한 객체는 JSON 문자열로 저장
                prefs.setCharPref(fullKey, JSON.stringify(value));
            }
        } catch (error) {
            console.error(`설정 저장 실패 (${key}):`, error);
            throw error;
        }
    }

    /**
     * 모든 설정 가져오기
     * @returns {Object} 설정 객체
     */
    getAll() {
        const settings = {};
        for (const key in this.defaultSettings) {
            settings[key] = this.get(key);
        }
        return settings;
    }

    /**
     * 여러 설정 한번에 저장
     * @param {Object} settings - 설정 객체
     */
    setAll(settings) {
        for (const [key, value] of Object.entries(settings)) {
            if (this.defaultSettings.hasOwnProperty(key)) {
                this.set(key, value);
            }
        }
    }

    /**
     * OpenAI API 키 안전하게 저장
     * @param {string} apiKey - API 키
     */
    setOpenAIKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('유효하지 않은 API 키');
        }

        // 기본적인 API 키 형식 검증
        if (!apiKey.startsWith('sk-') || apiKey.length < 40) {
            throw new Error('OpenAI API 키 형식이 올바르지 않습니다');
        }

        try {
            // 간단한 인코딩으로 저장 (완전한 보안은 아니지만 기본 보호)
            const encodedKey = btoa(apiKey);
            this.set('openaiApiKey', encodedKey);
        } catch (error) {
            console.error('API 키 저장 실패:', error);
            throw new Error('API 키 저장에 실패했습니다');
        }
    }

    /**
     * OpenAI API 키 가져오기
     * @returns {string|null} 디코딩된 API 키
     */
    getOpenAIKey() {
        try {
            const encodedKey = this.get('openaiApiKey');
            if (!encodedKey) {
                return null;
            }
            return atob(encodedKey);
        } catch (error) {
            console.error('API 키 복호화 실패:', error);
            return null;
        }
    }

    /**
     * API 키 존재 여부 확인
     * @returns {boolean} API 키 존재 여부
     */
    hasOpenAIKey() {
        const key = this.getOpenAIKey();
        return key && key.length > 0;
    }

    /**
     * 설정 초기화
     */
    reset() {
        try {
            const prefs = Components.classes["@mozilla.org/preferences-service;1"]
                .getService(Components.interfaces.nsIPrefBranch);

            // 모든 플러그인 설정 제거
            const keys = prefs.getChildList(this.prefBranch, {});
            for (const key of keys) {
                if (prefs.prefHasUserValue(key)) {
                    prefs.clearUserPref(key);
                }
            }
        } catch (error) {
            console.error('설정 초기화 실패:', error);
        }
    }

    /**
     * 설정 유효성 검증
     * @returns {Object} 검증 결과
     */
    validate() {
        const results = {
            valid: true,
            errors: [],
            warnings: []
        };

        const settings = this.getAll();

        // AI 백엔드 검증
        if (!['openai', 'ollama'].includes(settings.aiBackend)) {
            results.valid = false;
            results.errors.push('유효하지 않은 AI 백엔드');
        }

        // OpenAI 설정 검증
        if (settings.aiBackend === 'openai') {
            if (!this.hasOpenAIKey()) {
                results.valid = false;
                results.errors.push('OpenAI API 키가 설정되지 않았습니다');
            }

            if (!settings.openaiModel) {
                results.warnings.push('OpenAI 모델이 설정되지 않았습니다');
            }
        }

        // Ollama 설정 검증
        if (settings.aiBackend === 'ollama') {
            if (!settings.ollamaHost) {
                results.valid = false;
                results.errors.push('Ollama 호스트가 설정되지 않았습니다');
            }

            if (!settings.ollamaModel) {
                results.warnings.push('Ollama 모델이 설정되지 않았습니다');
            }
        }

        // 페이지 추출 옵션 검증
        if (!['first', 'current', 'range'].includes(settings.defaultPageSource)) {
            results.warnings.push('유효하지 않은 페이지 추출 옵션');
        }

        return results;
    }

    /**
     * 설정 내보내기 (API 키 제외)
     * @returns {Object} 내보낼 설정
     */
    export() {
        const settings = this.getAll();
        // 보안상 API 키는 제외
        delete settings.openaiApiKey;
        return settings;
    }

    /**
     * 설정 가져오기 (API 키 제외)
     * @param {Object} settings - 가져올 설정
     */
    import(settings) {
        // API 키 관련 설정은 무시
        const safeSettings = { ...settings };
        delete safeSettings.openaiApiKey;
        
        this.setAll(safeSettings);
    }
}

// Zotero 환경에서 글로벌 접근 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SettingsManager;
} else if (typeof window !== 'undefined') {
    window.SettingsManager = SettingsManager;
}