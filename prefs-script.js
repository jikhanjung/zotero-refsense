// RefSense 설정 UI 컨트롤러
const RefSensePrefs = {
    originalSettings: {},
    hasChanges: false,

    init() {
        this.bindEvents();
        this.requestSettings(); // 설정 요청
    },

    requestSettings() {
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

        document.getElementById('save-button').addEventListener('click', () => this.saveSettings());
        document.getElementById('cancel-button').addEventListener('click', () => this.cancelChanges());
        document.getElementById('reset-button').addEventListener('click', () => this.resetToDefaults());
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

    saveSettings() {
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
    if (event.data.type === 'refsense-settings-response') {
        RefSensePrefs.applySettings(event.data.settings);
    }
    if (event.data.type === 'refsense-save-result') {
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