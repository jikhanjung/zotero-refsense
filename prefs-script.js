// RefSense 설정 UI 컨트롤러
const RefSensePrefs = {
    originalSettings: {},
    hasChanges: false,

    init() {
        console.log('🚀 RefSensePrefs 초기화 시작');
        this.bindEvents();
        this.requestSettings(); // 설정 요청
    },

    async requestSettings() {
        console.log('📤 설정 요청 전송');
        
        // WebExtension runtime message 사용 (sandbox 환경용)
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
            console.log('🎯 browser.runtime.sendMessage 사용');
            try {
                const response = await browser.runtime.sendMessage({ type: 'refsense-get-settings' });
                console.log('✅ Runtime 응답 수신:', response);
                
                if (response.success && response.settings) {
                    this.applySettings(response.settings);
                    return;
                }
            } catch (error) {
                console.error('❌ browser.runtime.sendMessage 실패:', error);
            }
        }
        
        // 직접 Zotero.Prefs API 사용 시도 (fallback)
        console.log('🔍 Zotero 객체 확인:', typeof Zotero);
        if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
            console.log('🎯 직접 Zotero.Prefs로 로드');
            try {
                const settings = {
                    aiBackend: Zotero.Prefs.get('extensions.refsense.aiBackend', 'openai'),
                    openaiModel: Zotero.Prefs.get('extensions.refsense.openaiModel', 'gpt-4-turbo'),
                    openaiApiKey: Zotero.Prefs.get('extensions.refsense.openaiApiKey', ''),
                    ollamaModel: Zotero.Prefs.get('extensions.refsense.ollamaModel', 'llama3.2:latest'),
                    ollamaHost: Zotero.Prefs.get('extensions.refsense.ollamaHost', 'http://localhost:11434'),
                    pageSource: Zotero.Prefs.get('extensions.refsense.pageSource', 'first'),
                    pageRange: Zotero.Prefs.get('extensions.refsense.pageRange', '1-2')
                };
                console.log('✅ 설정 로드 완료:', settings);
                this.applySettings(settings);
                return;
            } catch (error) {
                console.error('❌ Zotero.Prefs 로드 실패:', error);
            }
        }
        
        // window.postMessage fallback
        console.log('⚠️ Fallback to window.postMessage');
        window.postMessage({ type: 'refsense-get-settings' }, '*');
    },

    applySettings(settings) {
        document.getElementById('ai-backend').value = settings.aiBackend || 'openai';
        document.getElementById('openai-model').value = settings.openaiModel || 'gpt-4-turbo';
        document.getElementById('ollama-model').value = settings.ollamaModel || 'llama3.2:latest';
        document.getElementById('ollama-host').value = settings.ollamaHost || 'http://localhost:11434';
        document.getElementById('page-source').value = settings.pageSource || 'first';
        document.getElementById('page-range').value = settings.pageRange || '1-2';

        const encodedKey = settings.openaiApiKey || '';
        if (encodedKey) {
            try {
                document.getElementById('openai-api-key').value = atob(encodedKey);
            } catch (e) {
                console.error('API 키 디코딩 실패:', e);
            }
        }

        this.storeOriginalSettings();
        this.updateUIVisibility();
        this.updateButtonStates();
    },

    storeOriginalSettings() {
        this.originalSettings = {
            aiBackend: document.getElementById('ai-backend').value,
            openaiModel: document.getElementById('openai-model').value,
            openaiApiKey: document.getElementById('openai-api-key').value,
            ollamaModel: document.getElementById('ollama-model').value,
            ollamaHost: document.getElementById('ollama-host').value,
            pageSource: document.getElementById('page-source').value,
            pageRange: document.getElementById('page-range').value
        };
    },

    bindEvents() {
        console.log('🔗 이벤트 바인딩 시작');
        
        // 저장 버튼 확인
        const saveButton = document.getElementById('save-button');
        console.log('💾 저장 버튼 찾기:', saveButton ? '성공' : '실패');
        
        document.getElementById('ai-backend').addEventListener('change', () => {
            this.updateUIVisibility();
            this.markChanged();
        });

        document.getElementById('page-source').addEventListener('change', () => {
            this.updateUIVisibility();
            this.markChanged();
        });

        const inputs = ['openai-model', 'openai-api-key', 'ollama-model', 'ollama-host', 'page-range'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            el?.addEventListener('input', () => this.markChanged());
            el?.addEventListener('change', () => this.markChanged());
        });

        document.getElementById('test-openai').addEventListener('click', () => this.testOpenAI());
        document.getElementById('test-ollama').addEventListener('click', () => this.testOllama());

        if (saveButton) {
            saveButton.addEventListener('click', () => {
                console.log('🖱️ 저장 버튼 클릭 이벤트 발생');
                this.saveSettings();
            });
        }
        
        document.getElementById('cancel-button').addEventListener('click', () => this.cancelChanges());
        document.getElementById('reset-button').addEventListener('click', () => this.resetToDefaults());
        
        console.log('✅ 이벤트 바인딩 완료');
    },

    updateUIVisibility() {
        const backend = document.getElementById('ai-backend').value;
        const pageSource = document.getElementById('page-source').value;

        document.getElementById('openai-section').classList.toggle('hidden', backend !== 'openai');
        document.getElementById('ollama-section').classList.toggle('hidden', backend !== 'ollama');

        document.getElementById('page-range').disabled = pageSource !== 'range';
    },

    markChanged() {
        this.hasChanges = true;
        this.updateButtonStates();
    },

    updateButtonStates() {
        document.getElementById('save-button').disabled = !this.hasChanges;
        document.getElementById('cancel-button').disabled = !this.hasChanges;
    },

    async saveSettings() {
        console.log('💾 저장 버튼 클릭됨');
        
        const apiKey = document.getElementById('openai-api-key').value.trim();
        const encodedKey = apiKey ? btoa(apiKey) : '';

        const settings = {
            aiBackend: document.getElementById('ai-backend').value,
            openaiModel: document.getElementById('openai-model').value,
            openaiApiKey: encodedKey,
            ollamaModel: document.getElementById('ollama-model').value,
            ollamaHost: document.getElementById('ollama-host').value,
            pageSource: document.getElementById('page-source').value,
            pageRange: document.getElementById('page-range').value
        };

        console.log('📤 설정 전송:', settings);
        
        // WebExtension runtime message 사용 (sandbox 환경용)
        if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.sendMessage) {
            console.log('🎯 browser.runtime.sendMessage로 저장');
            try {
                const response = await browser.runtime.sendMessage({ 
                    type: 'refsense-save-settings', 
                    settings 
                });
                console.log('✅ Runtime 저장 응답:', response);
                
                if (response.success) {
                    this.hasChanges = false;
                    this.updateButtonStates();
                    this.showMessage('설정이 저장되었습니다.', 'success');
                    return;
                } else {
                    this.showMessage('설정 저장 실패: ' + response.error, 'error');
                    return;
                }
            } catch (error) {
                console.error('❌ browser.runtime.sendMessage 저장 실패:', error);
                this.showMessage('설정 저장 실패: ' + error.message, 'error');
            }
        }
        
        // 직접 Zotero.Prefs API 사용 시도 (fallback)
        if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
            console.log('🎯 직접 Zotero.Prefs로 저장');
            try {
                Object.keys(settings).forEach(key => {
                    const prefKey = `extensions.refsense.${key}`;
                    Zotero.Prefs.set(prefKey, settings[key]);
                    console.log(`✅ 저장: ${prefKey} = ${settings[key]}`);
                });
                
                this.hasChanges = false;
                this.updateButtonStates();
                this.showMessage('설정이 저장되었습니다.', 'success');
                return;
            } catch (error) {
                console.error('❌ Zotero.Prefs 저장 실패:', error);
            }
        }
        
        // window.postMessage fallback
        console.log('⚠️ Fallback to window.postMessage');
        window.postMessage({ type: 'refsense-save-settings', settings }, '*');
    },

    cancelChanges() {
        for (const [key, value] of Object.entries(this.originalSettings)) {
            const el = document.getElementById(key.replace(/([A-Z])/g, '-$1').toLowerCase());
            if (el) el.value = value;
        }
        this.updateUIVisibility();
        this.hasChanges = false;
        this.updateButtonStates();
        this.showMessage('변경사항이 취소되었습니다.', 'info');
    },

    resetToDefaults() {
        if (!confirm('모든 설정을 기본값으로 복원하시겠습니까?')) return;

        document.getElementById('ai-backend').value = 'openai';
        document.getElementById('openai-model').value = 'gpt-4-turbo';
        document.getElementById('openai-api-key').value = '';
        document.getElementById('ollama-model').value = 'llama3.2:latest';
        document.getElementById('ollama-host').value = 'http://localhost:11434';
        document.getElementById('page-source').value = 'first';
        document.getElementById('page-range').value = '1-2';

        this.updateUIVisibility();
        this.markChanged();
        this.showMessage('기본값으로 복원되었습니다.', 'info');
    },

    testOpenAI() {
        const apiKey = document.getElementById('openai-api-key').value.trim();
        if (!apiKey) return this.showMessage('OpenAI API 키를 입력해주세요.', 'error');
        if (!apiKey.startsWith('sk-')) return this.showMessage('API 키는 sk-로 시작해야 합니다.', 'error');
        this.showMessage('API 키 형식이 올바릅니다.', 'success');
    },

    testOllama() {
        const host = document.getElementById('ollama-host').value.trim();
        if (!host) return this.showMessage('Ollama 호스트를 입력해주세요.', 'error');
        if (!host.startsWith('http://') && !host.startsWith('https://')) return this.showMessage('http:// 또는 https://로 시작해야 합니다.', 'error');
        this.showMessage('Ollama 호스트 형식이 올바릅니다.', 'success');
    },

    showMessage(msg, type = 'info') {
        alert(`[${type.toUpperCase()}] ${msg}`);
    }
};

// 메시지 리스너
window.addEventListener('message', (event) => {
    console.log('📩 메시지 수신:', event.data);
    
    if (event.data.type === 'refsense-settings-response') {
        console.log('⚙️ 설정 응답 수신');
        RefSensePrefs.applySettings(event.data.settings);
    }
    if (event.data.type === 'refsense-save-response') {
        console.log('💾 저장 응답 수신:', event.data.success);
        if (event.data.success) {
            RefSensePrefs.hasChanges = false;
            RefSensePrefs.updateButtonStates();
            RefSensePrefs.showMessage('설정이 저장되었습니다.', 'success');
        } else {
            RefSensePrefs.showMessage('설정 저장 실패', 'error');
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    RefSensePrefs.init();
});