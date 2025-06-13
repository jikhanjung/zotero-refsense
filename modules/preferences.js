/**
 * Preferences Module - RefSense Plugin
 * Handles preferences UI integration and message passing
 * 
 * Zotero 7 compatible module using global namespace
 */

if (typeof RefSense === 'undefined') {
    var RefSense = {};
}

RefSense.PreferencesManager = class PreferencesManager {
    constructor() {
        this.messageListeners = new Map();
    }

    /**
     * Register preferences pane using options_ui (Zotero 7 compatible)
     */
    registerPreferencesPane() {
        try {
            RefSense.logger.log('Setting up preferences using options_ui method');
            
            // Zotero 7에서는 manifest.json의 options_ui가 자동으로 처리됨
            // 하지만 명시적으로 등록하여 확실히 하기
            if (Zotero.Prefs && typeof Zotero.Prefs.registerObserver === 'function') {
                // 설정 변경 감지를 위한 옵저버 등록
                const prefBranch = 'extensions.refsense.';
                Zotero.Prefs.registerObserver(prefBranch, () => {
                    RefSense.logger.log('RefSense 설정이 변경되었습니다');
                    RefSense.configManager.loadConfig();
                }, false);
                RefSense.logger.success('Preferences observer registered');
            }
            
            // 플러그인 매니저에서 Options 버튼이 표시되도록 하기 위한 추가 등록
            try {
                const addons = Zotero.AddonManager;
                if (addons) {
                    RefSense.logger.log('AddonManager found, ensuring options are available');
                }
            } catch (addonError) {
                RefSense.logger.log('AddonManager access failed:', addonError.message);
            }
            
            RefSense.logger.success('Preferences setup completed using options_ui');
            return true;
            
        } catch (error) {
            RefSense.logger.error(error, 'registerPreferencesPane');
            return false;
        }
    }

    /**
     * Setup preferences messaging for options_ui
     */
    setupPreferencesMessaging() {
        try {
            RefSense.logger.log('Setting up preferences messaging');
            
            // 간단하고 직접적인 메시지 리스너 등록
            this.setupDirectMessageListener();
            
        } catch (error) {
            RefSense.logger.error(error, 'setupPreferencesMessaging');
        }
    }

    /**
     * Setup direct message listener on Zotero main window
     */
    setupDirectMessageListener() {
        try {
            // Zotero 메인 UI 창에 메시지 리스너 등록
            const ZoteroPane = Zotero.getMainWindow();
            
            if (ZoteroPane && ZoteroPane.addEventListener) {
                const messageHandler = (event) => {
                    this.handleMessage(event);
                };

                ZoteroPane.addEventListener("message", messageHandler);
                this.messageListeners.set('mainWindow', { window: ZoteroPane, handler: messageHandler });
                
                RefSense.logger.success('Direct message listener registered on Zotero main window');
            } else {
                RefSense.logger.log('❌ Could not access Zotero main window');
            }
            
        } catch (error) {
            RefSense.logger.error(error, 'setupDirectMessageListener');
        }
    }

    /**
     * Handle messages from preferences window
     */
    handleMessage(event) {
        try {
            if (!event.data || !event.data.type) return;
            
            RefSense.logger.log('[RefSense bootstrap] 받은 메시지:', event.data.type);
            
            const { type, settings } = event.data;
            
            switch (type) {
                case "refsense-get-settings":
                    this.handleGetSettings(event);
                    break;
                    
                case "refsense-save-settings":
                    this.handleSaveSettings(event, settings);
                    break;
                    
                case "refsense-test-connection":
                    this.handleConnectionTest(event);
                    break;
            }
            
        } catch (error) {
            RefSense.logger.error(error, 'handleMessage');
        }
    }

    /**
     * Handle get settings request
     */
    handleGetSettings(event) {
        try {
            RefSense.logger.log('Processing get-settings request from main window');
            
            // 설정 읽기 (통합된 설정 키 사용)
            const result = {
                aiBackend: Zotero.Prefs.get("extensions.refsense.aiBackend", "openai"),
                openaiModel: Zotero.Prefs.get("extensions.refsense.openaiModel", "gpt-4-turbo"),
                openaiApiKey: Zotero.Prefs.get("extensions.refsense.openaiApiKey", ""),
                ollamaHost: Zotero.Prefs.get("extensions.refsense.ollamaHost", "http://localhost:11434"),
                ollamaModel: Zotero.Prefs.get("extensions.refsense.ollamaModel", "llama3.2:latest"),
                defaultPageSource: Zotero.Prefs.get("extensions.refsense.defaultPageSource", "first"),
                pageRange: Zotero.Prefs.get("extensions.refsense.pageRange", "1-2")
            };
            
            RefSense.logger.log('Sending settings:', result);
            
            if (event.source) {
                event.source.postMessage({
                    type: "refsense-settings-response",
                    settings: result
                }, event.origin || "*");
                RefSense.logger.success('Settings response sent to preferences window');
            }
        } catch (error) {
            RefSense.logger.error(error, 'handleGetSettings');
        }
    }

    /**
     * Handle save settings request
     */
    handleSaveSettings(event, settings) {
        try {
            RefSense.logger.log('Processing save-settings request from main window');
            
            if (settings) {
                try {
                    // 설정 저장
                    Object.keys(settings).forEach(key => {
                        const prefKey = `extensions.refsense.${key}`;
                        Zotero.Prefs.set(prefKey, settings[key]);
                        RefSense.logger.log(`Saved: ${prefKey} = ${settings[key]}`);
                    });
                    
                    // 설정 새로고침
                    RefSense.configManager.loadConfig();
                    
                    if (event.source) {
                        event.source.postMessage({
                            type: "refsense-save-response",
                            success: true
                        }, event.origin || "*");
                        RefSense.logger.success('Save success response sent to preferences window');
                    }
                } catch (saveError) {
                    RefSense.logger.error(saveError, 'saving settings');
                    if (event.source) {
                        event.source.postMessage({
                            type: "refsense-save-error",
                            error: saveError.message
                        }, event.origin || "*");
                    }
                }
            }
        } catch (error) {
            RefSense.logger.error(error, 'handleSaveSettings');
        }
    }

    /**
     * Handle connection test request
     */
    handleConnectionTest(event) {
        try {
            const { backend, config } = event.data;
            
            if (backend === 'ollama') {
                this.testOllamaConnection(config.host).then(result => {
                    if (event.source) {
                        event.source.postMessage({
                            type: 'refsense-test-response',
                            success: result.success,
                            message: result.message
                        }, event.origin || "*");
                        RefSense.logger.log('Ollama test response sent');
                    }
                });
            } else if (backend === 'openai') {
                const isValid = config.apiKey && config.apiKey.startsWith('sk-') && config.apiKey.length > 40;
                if (event.source) {
                    event.source.postMessage({
                        type: 'refsense-test-response',
                        success: isValid,
                        message: isValid ? 'OpenAI API 키 형식이 올바릅니다!' : 'OpenAI API 키 형식이 올바르지 않습니다.'
                    }, event.origin || "*");
                    RefSense.logger.log('OpenAI test response sent');
                }
            }
        } catch (error) {
            RefSense.logger.error(error, 'handleConnectionTest');
        }
    }

    /**
     * Test Ollama connection
     */
    async testOllamaConnection(host) {
        try {
            // Basic format validation
            if (!host || !host.startsWith('http')) {
                return {
                    success: false,
                    message: 'Invalid Ollama host format'
                };
            }
            
            return {
                success: true,
                message: 'Ollama host format is valid'
            };
        } catch (error) {
            return {
                success: false,
                message: `Connection test failed: ${error.message}`
            };
        }
    }

    /**
     * Clean up message listeners
     */
    cleanup() {
        try {
            this.messageListeners.forEach((listener, key) => {
                if (listener.window && listener.handler) {
                    listener.window.removeEventListener('message', listener.handler);
                    RefSense.logger.log(`Removed message listener: ${key}`);
                }
            });
            this.messageListeners.clear();
        } catch (error) {
            RefSense.logger.error(error, 'preferences cleanup');
        }
    }

    /**
     * Setup message listener for specific window
     */
    setupMainWindowMessageListener(win) {
        try {
            // 기존 리스너 제거
            if (win._refSenseMainMessageListener) {
                win.removeEventListener('message', win._refSenseMainMessageListener);
            }
            
            // 새 메시지 리스너 등록
            win._refSenseMainMessageListener = (event) => {
                this.handleDirectMessage(event);
            };
            
            win.addEventListener('message', win._refSenseMainMessageListener);
            RefSense.logger.success('Main window message listener setup completed');
        } catch (error) {
            RefSense.logger.error(error, 'setupMainWindowMessageListener');
        }
    }

    /**
     * Handle direct message (legacy compatibility)
     */
    handleDirectMessage(event) {
        try {
            const { type, settings } = event.data || {};
            
            if (type === "refsense-get-settings") {
                const result = RefSense.configManager.getSettingsForPreferences();
                
                if (event.source) {
                    event.source.postMessage({
                        type: "refsense-settings-response",
                        settings: result
                    }, event.origin || "*");
                }
            }
            
            if (type === "refsense-save-settings" && settings) {
                try {
                    const success = RefSense.configManager.saveSettingsFromPreferences(settings);
                    
                    if (event.source) {
                        event.source.postMessage({
                            type: success ? "refsense-save-response" : "refsense-save-error",
                            success: success,
                            error: success ? null : "Save failed"
                        }, event.origin || "*");
                    }
                } catch (error) {
                    if (event.source) {
                        event.source.postMessage({
                            type: "refsense-save-error",
                            error: error.message
                        }, event.origin || "*");
                    }
                }
            }
        } catch (error) {
            RefSense.logger.error(error, 'handleDirectMessage');
            return { error: error.message };
        }
    }
}

// Create default preferences manager instance
RefSense.preferencesManager = new RefSense.PreferencesManager();

// Legacy compatibility functions
RefSense.registerPreferencesPane = function() {
    return RefSense.preferencesManager.registerPreferencesPane();
};

RefSense.setupPreferencesMessaging = function() {
    return RefSense.preferencesManager.setupPreferencesMessaging();
};