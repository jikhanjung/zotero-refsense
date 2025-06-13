/**
 * Configuration Module - RefSense Plugin
 * Handles loading and managing plugin configuration from Zotero preferences
 * 
 * Zotero 7 compatible module using global namespace
 */

if (typeof RefSense === 'undefined') {
    var RefSense = {};
}

RefSense.ConfigManager = class ConfigManager {
    constructor() {
        this.config = null;
        this.observers = new Set();
    }

    /**
     * Load configuration from Zotero preferences
     */
    loadConfig() {
        try {
            this.config = {
                // AI 백엔드 설정
                aiBackend: Zotero.Prefs.get('extensions.refsense.aiBackend') || 'openai',
                
                // OpenAI 설정
                openaiModel: Zotero.Prefs.get('extensions.refsense.openaiModel') || 'gpt-4-turbo',
                openaiApiKey: Zotero.Prefs.get('extensions.refsense.openaiApiKey') || '',
                
                // Ollama 설정
                ollamaModel: Zotero.Prefs.get('extensions.refsense.ollamaModel') || 'llama3.2:latest',
                ollamaHost: Zotero.Prefs.get('extensions.refsense.ollamaHost') || 'http://localhost:11434',
                
                // PDF 추출 설정
                defaultPageSource: Zotero.Prefs.get('extensions.refsense.defaultPageSource') || 'first',
                pageRange: Zotero.Prefs.get('extensions.refsense.pageRange') || '1-2',
                
                // 기타 설정
                enableLogging: Zotero.Prefs.get('extensions.refsense.enableLogging') !== false,
                maxRetries: Zotero.Prefs.get('extensions.refsense.maxRetries') || 3,
                requestTimeout: Zotero.Prefs.get('extensions.refsense.requestTimeout') || 30000
            };
            
            // API 키 디코딩 (Base64로 저장됨)
            if (this.config.openaiApiKey) {
                try {
                    this.config.openaiApiKey = atob(this.config.openaiApiKey);
                } catch (error) {
                    RefSense.logger.warn('API key decoding failed, using raw value');
                }
            }
            
            RefSense.logger.log('Configuration loaded:', {
                ...this.config,
                openaiApiKey: this.config.openaiApiKey ? '[HIDDEN]' : '[NOT SET]'
            });
            
            // Notify observers
            this.notifyObservers();
            
        } catch (error) {
            RefSense.logger.error(error, 'loadConfig');
            // 기본값으로 fallback
            this.config = {
                aiBackend: 'openai',
                openaiModel: 'gpt-4-turbo',
                openaiApiKey: '',
                ollamaModel: 'llama3.2:latest',
                ollamaHost: 'http://localhost:11434',
                defaultPageSource: 'first',
                pageRange: '1-2',
                enableLogging: true,
                maxRetries: 3,
                requestTimeout: 30000
            };
        }
    }

    /**
     * Get current configuration
     */
    getConfig() {
        if (!this.config) {
            this.loadConfig();
        }
        return this.config;
    }

    /**
     * Get specific config value
     */
    get(key, defaultValue = null) {
        const config = this.getConfig();
        return config[key] !== undefined ? config[key] : defaultValue;
    }

    /**
     * Set configuration value and save to preferences
     */
    set(key, value) {
        const prefKey = `extensions.refsense.${key}`;
        
        // Encode API key in Base64 for storage
        if (key === 'openaiApiKey' && value) {
            try {
                value = btoa(value);
            } catch (error) {
                RefSense.logger.warn('API key encoding failed, storing raw value');
            }
        }
        
        Zotero.Prefs.set(prefKey, value);
        
        // Update local config
        if (this.config) {
            if (key === 'openaiApiKey' && value) {
                // Store decoded value locally
                try {
                    this.config[key] = atob(value);
                } catch (error) {
                    this.config[key] = value;
                }
            } else {
                this.config[key] = value;
            }
        }
        
        // Notify observers
        this.notifyObservers();
        
        RefSense.logger.log(`Configuration updated: ${key} = ${key.includes('apiKey') ? '[HIDDEN]' : value}`);
    }

    /**
     * Save multiple settings at once
     */
    setMultiple(settings) {
        Object.keys(settings).forEach(key => {
            this.set(key, settings[key]);
        });
    }

    /**
     * Register observer for configuration changes
     */
    addObserver(callback) {
        this.observers.add(callback);
    }

    /**
     * Remove observer
     */
    removeObserver(callback) {
        this.observers.delete(callback);
    }

    /**
     * Notify all observers of configuration changes
     */
    notifyObservers() {
        this.observers.forEach(callback => {
            try {
                callback(this.config);
            } catch (error) {
                RefSense.logger.error(error, 'config observer');
            }
        });
    }

    /**
     * Register Zotero preferences observer
     */
    registerPreferencesObserver() {
        try {
            if (Zotero.Prefs && typeof Zotero.Prefs.registerObserver === 'function') {
                const prefBranch = 'extensions.refsense.';
                Zotero.Prefs.registerObserver(prefBranch, () => {
                    RefSense.logger.log('RefSense 설정이 변경되었습니다');
                    this.loadConfig();
                }, false);
                RefSense.logger.success('Preferences observer registered');
            }
        } catch (error) {
            RefSense.logger.error(error, 'registerPreferencesObserver');
        }
    }

    /**
     * Get settings for preferences dialog
     */
    getSettingsForPreferences() {
        try {
            return {
                ai_backend: Zotero.Prefs.get('extensions.refsense.ai_backend', 'ollama'),
                openai_api_key: Zotero.Prefs.get('extensions.refsense.openai_api_key', ''),
                openai_model: Zotero.Prefs.get('extensions.refsense.openai_model', 'gpt-4-turbo'),
                ollama_host: Zotero.Prefs.get('extensions.refsense.ollama_host', 'http://localhost:11434'),
                ollama_model: Zotero.Prefs.get('extensions.refsense.ollama_model', 'llama3.2:latest'),
                default_page_source: Zotero.Prefs.get('extensions.refsense.default_page_source', 'first'),
                page_range: Zotero.Prefs.get('extensions.refsense.page_range', '1-2')
            };
        } catch (error) {
            RefSense.logger.error(error, 'getSettingsForPreferences');
            return {};
        }
    }

    /**
     * Save settings from preferences dialog
     */
    saveSettingsFromPreferences(settings) {
        try {
            Object.keys(settings).forEach(key => {
                const prefKey = `extensions.refsense.${key}`;
                Zotero.Prefs.set(prefKey, settings[key]);
                RefSense.logger.log(`Saved: ${prefKey} = ${settings[key]}`);
            });
            
            this.loadConfig();
            return true;
        } catch (error) {
            RefSense.logger.error(error, 'saveSettingsFromPreferences');
            return false;
        }
    }
}

// Create default config manager instance
RefSense.configManager = new RefSense.ConfigManager();

// Legacy compatibility functions
RefSense.loadConfig = function() {
    return RefSense.configManager.loadConfig();
};

RefSense.getConfig = function() {
    return RefSense.configManager.getConfig();
};