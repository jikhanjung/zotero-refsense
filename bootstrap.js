/**
 * RefSense - AI Metadata Extractor for Zotero 7
 * Bootstrap file for plugin initialization
 */

if (typeof Zotero === 'undefined') {
    var Zotero;
}

var RefSense = RefSense || {};

// Make RefSense globally accessible for menu commands
if (typeof window !== 'undefined') {
    window.RefSense = RefSense;
}
if (typeof globalThis !== 'undefined') {
    globalThis.RefSense = RefSense;
}

// Plugin initialization
RefSense.Plugin = {
    id: 'refsense@zotero-plugin',
    version: '1.0.0',
    rootURI: '',
    initialized: false,
    
    // Plugin startup
    startup() {
        if (this.initialized) return;
        
        try {
            this.log('RefSense plugin starting up...');
            
            // Ensure Zotero is available
            if (typeof Zotero === 'undefined') {
                this.log('Zotero not yet available, retrying...');
                setTimeout(() => this.startup(), 1000);
                return;
            }
            
            // Show immediate confirmation
            this.showStartupNotification();
            
            // Load configuration
            this.loadConfig();
            
            // Register custom preferences menu (Zotero 7 way)
            this.registerCustomPreferences();
            
            // 전역 접근을 위한 추가 등록
            this.setupGlobalAccess();
            
            // Initialize UI components with multiple retries
            this.initUIWithRetry();
            
            this.initialized = true;
            this.log('RefSense plugin started successfully');
            
        } catch (error) {
            this.handleError(error, 'startup');
        }
    },
    
    // Show startup notification
    showStartupNotification() {
        // Notification disabled for better user experience
        // Plugin functionality is indicated by the button in PDF reader
        this.log('RefSense plugin loaded successfully');
    },
    
    // Register custom preferences menu (직접 접근 방식)
    registerCustomPreferences() {
        try {
            this.log('Setting up custom preferences menu');
            
            // 설정 변경 감지를 위한 옵저버 등록
            if (Zotero.Prefs && typeof Zotero.Prefs.registerObserver === 'function') {
                const prefBranch = 'extensions.refsense.';
                Zotero.Prefs.registerObserver(prefBranch, () => {
                    this.log('RefSense 설정이 변경되었습니다');
                    this.loadConfig();
                }, false);
                this.log('✅ Preferences observer registered');
            }
            
            // Tools 메뉴에 설정 메뉴 추가
            this.addToolsMenuItem();
            
            this.log('✅ Custom preferences setup completed');
            return true;
            
        } catch (error) {
            this.log('❌ Failed to setup custom preferences:', error.message);
            this.log('Error stack:', error.stack);
            return false;
        }
    },
    
    // Tools 메뉴에 RefSense 설정 메뉴 추가
    addToolsMenuItem() {
        try {
            this.log('🔍 Attempting to add Tools menu item...');
            
            const window = Zotero.getMainWindow();
            if (!window || !window.document) {
                this.log('❌ Main window not available for menu setup');
                return;
            }
            this.log('✅ Main window found');
            
            const menubar = window.document.getElementById('main-menubar');
            if (!menubar) {
                this.log('❌ Main menubar not found');
                return;
            }
            this.log('✅ Main menubar found');
            
            const toolsMenu = window.document.getElementById('menu_ToolsPopup');
            if (!toolsMenu) {
                this.log('❌ Tools menu not found, trying alternative selectors...');
                
                // 대체 셀렉터들 시도
                const alternatives = [
                    'toolsPopup',
                    'menu_Tools', 
                    'tools-menu',
                    'toolsmenu'
                ];
                
                for (const alt of alternatives) {
                    const altMenu = window.document.getElementById(alt);
                    if (altMenu) {
                        this.log(`✅ Found alternative tools menu: ${alt}`);
                        return this.addMenuToElement(altMenu);
                    }
                }
                
                this.log('❌ No tools menu found with any selector');
                return;
            }
            this.log('✅ Tools menu found');
            
            return this.addMenuToElement(toolsMenu);
            
        } catch (error) {
            this.log('❌ Failed to add Tools menu item:', error.message);
            this.log('Error stack:', error.stack);
        }
    },
    
    // 메뉴 요소에 메뉴 아이템 추가
    addMenuToElement(menuElement) {
        try {
            // 기존 메뉴 아이템이 있는지 확인
            const existingItem = menuElement.querySelector('#refsense-settings-menuitem');
            if (existingItem) {
                this.log('⚠️ RefSense menu item already exists, removing old one');
                existingItem.remove();
            }
            
            // RefSense 설정 메뉴 아이템 생성
            const menuItem = menuElement.ownerDocument.createXULElement('menuitem');
            menuItem.id = 'refsense-settings-menuitem';
            menuItem.setAttribute('label', 'RefSense 설정...');
            menuItem.addEventListener('command', () => {
                this.openSettingsDialog();
            });
            
            // 구분자 추가 (옵션)
            const separator = menuElement.ownerDocument.createXULElement('menuseparator');
            separator.id = 'refsense-separator';
            
            // Tools 메뉴에 추가
            menuElement.appendChild(separator);
            menuElement.appendChild(menuItem);
            
            this.log('✅ RefSense menu item successfully added to Tools menu');
            return true;
            
        } catch (error) {
            this.log('❌ Failed to add menu to element:', error.message);
            return false;
        }
    },
    
    // 설정 다이얼로그 열기
    openSettingsDialog() {
        try {
            this.log('Opening RefSense settings dialog');
            
            const window = Zotero.getMainWindow();
            if (!window) {
                this.log('Main window not available');
                return;
            }
            
            // HTML 기반 설정창 다이얼로그 열기
            this.openCustomSettingsDialog();
            
        } catch (error) {
            this.log('❌ Failed to open settings dialog:', error.message);
        }
    },
    
    // 간단한 통합 설정 다이얼로그
    openCustomSettingsDialog() {
        try {
            const window = Zotero.getMainWindow();
            
            // 현재 설정 로드
            this.loadConfig();
            
            // 모든 설정을 하나의 폼으로 받기
            this.showUnifiedSettingsPrompt();
            
        } catch (error) {
            this.log('❌ Failed to open settings dialog:', error.message);
            const window = Zotero.getMainWindow();
            if (window) {
                window.alert('설정을 열 수 없습니다: ' + error.message);
            }
        }
    },
    
    // 통합 설정 프롬프트
    showUnifiedSettingsPrompt() {
        const window = Zotero.getMainWindow();
        if (!window) return;
        
        // 현재 설정값 표시
        const currentApiKey = this.config.openaiApiKey ? 
            (this.config.openaiApiKey.length > 10 ? '****' + this.config.openaiApiKey.slice(-4) : '[설정됨]') : '[없음]';
        
        const currentSettings = `현재 RefSense 설정:

• AI 백엔드: ${this.config.aiBackend}
• OpenAI API 키: ${currentApiKey}
• OpenAI 모델: ${this.config.openaiModel}
• Ollama 호스트: ${this.config.ollama_host}
• Ollama 모델: ${this.config.ollama_model}
• 페이지 소스: ${this.config.defaultPageSource}
• 페이지 범위: ${this.config.pageRange}

설정을 변경하시겠습니까?`;

        if (!window.confirm(currentSettings)) return;
        
        // 1. AI 백엔드 선택
        const backends = ['openai', 'ollama'];
        let backendChoice = window.prompt(
            `AI 백엔드를 선택하세요:\n1. OpenAI (GPT)\n2. Ollama (로컬)\n\n현재: ${this.config.aiBackend}\n숫자를 입력하세요 (1-2):`,
            this.config.aiBackend === 'openai' ? '1' : '2'
        );
        
        if (backendChoice === null) return; // 취소
        backendChoice = backendChoice.trim();
        if (!['1', '2'].includes(backendChoice)) {
            window.alert('잘못된 선택입니다.');
            return;
        }
        
        const selectedBackend = backends[parseInt(backendChoice) - 1];
        
        // 2. 백엔드별 설정
        let newSettings = { aiBackend: selectedBackend };
        
        if (selectedBackend === 'openai') {
            // OpenAI 설정
            const apiKey = window.prompt(
                `OpenAI API 키를 입력하세요 (sk-로 시작):\n현재: ${currentApiKey}\n\n(빈 값으로 두면 기존 키 유지)`,
                ''
            );
            
            if (apiKey === null) return; // 취소
            
            if (apiKey.trim()) {
                if (!apiKey.startsWith('sk-')) {
                    window.alert('API 키는 sk-로 시작해야 합니다.');
                    return;
                }
                newSettings.openaiApiKey = btoa(apiKey.trim());
            } else {
                newSettings.openaiApiKey = this.config.openaiApiKey; // 기존 값 유지
            }
            
            const models = ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
            const modelChoice = window.prompt(
                `OpenAI 모델을 선택하세요:\n1. GPT-4 Turbo (권장)\n2. GPT-4\n3. GPT-3.5 Turbo\n\n현재: ${this.config.openaiModel}\n숫자를 입력하세요 (1-3):`,
                models.indexOf(this.config.openaiModel) + 1 || '1'
            );
            
            if (modelChoice === null) return;
            const modelIndex = parseInt(modelChoice.trim()) - 1;
            if (modelIndex < 0 || modelIndex >= models.length) {
                window.alert('잘못된 모델 선택입니다.');
                return;
            }
            newSettings.openaiModel = models[modelIndex];
            
        } else {
            // Ollama 설정
            const ollamaHost = window.prompt(
                `Ollama 호스트 URL을 입력하세요:\n현재: ${this.config.ollama_host}`,
                this.config.ollama_host
            );
            
            if (ollamaHost === null) return;
            newSettings.ollamaHost = ollamaHost.trim() || 'http://localhost:11434';
            
            const ollamaModel = window.prompt(
                `Ollama 모델명을 입력하세요:\n현재: ${this.config.ollama_model}`,
                this.config.ollama_model
            );
            
            if (ollamaModel === null) return;
            newSettings.ollamaModel = ollamaModel.trim() || 'llama3.2:latest';
        }
        
        // 3. 페이지 추출 설정
        const pageSources = ['first', 'current', 'range'];
        const pageChoice = window.prompt(
            `PDF 페이지 추출 방식을 선택하세요:\n1. 첫 페이지 (권장)\n2. 현재 페이지\n3. 페이지 범위\n\n현재: ${this.config.defaultPageSource}\n숫자를 입력하세요 (1-3):`,
            pageSources.indexOf(this.config.defaultPageSource) + 1 || '1'
        );
        
        if (pageChoice === null) return;
        const pageIndex = parseInt(pageChoice.trim()) - 1;
        if (pageIndex < 0 || pageIndex >= pageSources.length) {
            window.alert('잘못된 페이지 옵션 선택입니다.');
            return;
        }
        newSettings.defaultPageSource = pageSources[pageIndex];
        
        if (newSettings.defaultPageSource === 'range') {
            const pageRange = window.prompt(
                `페이지 범위를 입력하세요 (예: 1-2):\n현재: ${this.config.pageRange}`,
                this.config.pageRange
            );
            
            if (pageRange === null) return;
            newSettings.pageRange = pageRange.trim() || '1-2';
        } else {
            newSettings.pageRange = this.config.pageRange; // 기존 값 유지
        }
        
        // 4. 설정 저장
        this.saveSettingsFromDialog(newSettings);
        window.alert('✅ 설정이 저장되었습니다!');
    },
    
    // 다이얼로그에서 설정 저장
    saveSettingsFromDialog(settings) {
        try {
            this.log('💾 다이얼로그에서 설정 저장 중...');
            
            // 모든 설정 저장
            Object.keys(settings).forEach(key => {
                let prefKey;
                let value = settings[key];
                
                // 키 매핑
                if (key === 'ollamaHost') {
                    prefKey = 'extensions.refsense.ollamaHost';
                } else if (key === 'ollamaModel') {
                    prefKey = 'extensions.refsense.ollamaModel';
                } else if (key === 'defaultPageSource') {
                    prefKey = 'extensions.refsense.defaultPageSource';
                } else {
                    prefKey = `extensions.refsense.${key}`;
                }
                
                Zotero.Prefs.set(prefKey, value);
                this.log(`✅ 저장: ${prefKey} = ${value}`);
            });
            
            // 설정 다시 로드
            this.loadConfig();
            
            this.log('✅ 다이얼로그 설정 저장 완료');
            
            // 성공 알림
            const window = Zotero.getMainWindow();
            if (window) {
                window.alert('RefSense 설정이 저장되었습니다.');
            }
            
        } catch (error) {
            this.log('❌ 다이얼로그 설정 저장 실패:', error.message);
        }
    },
    
    // 간단한 설정 다이얼로그 (Zotero 7 호환)
    showSimpleSettingsDialog() {
        try {
            const window = Zotero.getMainWindow();
            
            // 현재 설정값 가져오기 (this.config 사용)
            this.log('🔍 설정값 로드 시작...');
            
            // 먼저 최신 설정을 로드
            this.loadConfig();
            
            const currentSettings = {
                aiBackend: this.config.aiBackend,
                openaiApiKey: this.config.openaiApiKey,
                openaiModel: this.config.openaiModel,
                ollamaHost: this.config.ollama_host,
                ollamaModel: this.config.ollama_model,
                pageSource: this.config.defaultPageSource
            };
            
            // 각 설정값 개별 로그
            this.log('📋 로드된 설정값들:');
            this.log(`  - aiBackend: "${currentSettings.aiBackend}"`);
            this.log(`  - openaiApiKey: "${currentSettings.openaiApiKey ? '[설정됨]' : '[없음]'}"`);
            this.log(`  - openaiModel: "${currentSettings.openaiModel}"`);
            this.log(`  - ollamaHost: "${currentSettings.ollamaHost}"`);
            this.log(`  - ollamaModel: "${currentSettings.ollamaModel}"`);
            this.log(`  - pageSource: "${currentSettings.pageSource}"`);
            
            // API 키 디코딩 (있는 경우)
            let apiKeyDisplay = '[없음]';
            if (currentSettings.openaiApiKey) {
                try {
                    const decodedKey = atob(currentSettings.openaiApiKey);
                    apiKeyDisplay = `${decodedKey.substring(0, 8)}...`;
                } catch (e) {
                    apiKeyDisplay = '[인코딩 오류]';
                }
            }
            
            // 현재 설정 표시 메시지
            let settingsText = `현재 RefSense 설정:

• AI 백엔드: ${currentSettings.aiBackend}
• OpenAI API 키: ${apiKeyDisplay}
• OpenAI 모델: ${currentSettings.openaiModel}
• Ollama 호스트: ${currentSettings.ollamaHost}
• Ollama 모델: ${currentSettings.ollamaModel}
• 페이지 소스: ${currentSettings.pageSource}

설정을 변경하시겠습니까?`;
            
            // Zotero 7 호환 confirm 다이얼로그
            const result = window.confirm(settingsText);
            
            if (result) {
                // 상세 설정창 열기
                this.showDetailedSettingsDialog(currentSettings);
            }
            
        } catch (error) {
            this.log('❌ Failed to show simple settings dialog:', error.message);
        }
    },
    
    // 상세 설정 다이얼로그 (Zotero 7 호환)
    showDetailedSettingsDialog(currentSettings) {
        try {
            const window = Zotero.getMainWindow();
            
            // AI 백엔드 선택
            const backendChoice = window.confirm('AI 백엔드를 선택하세요:\n\n확인 = OpenAI\n취소 = Ollama');
            const selectedBackend = backendChoice ? 'openai' : 'ollama';
            
            this.log(`🔧 선택된 백엔드: ${selectedBackend}`);
            
            if (selectedBackend === 'openai') {
                // OpenAI 설정
                const apiKey = window.prompt('OpenAI API 키를 입력하세요:', '');
                
                if (apiKey && apiKey.trim()) {
                    // API 키 인코딩하여 저장
                    const encodedKey = btoa(apiKey.trim());
                    
                    this.log('💾 OpenAI 설정 저장 중...');
                    Zotero.Prefs.set('extensions.refsense.aiBackend', 'openai');
                    Zotero.Prefs.set('extensions.refsense.openaiApiKey', encodedKey);
                    
                    // 저장 확인
                    const savedBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
                    const savedKey = Zotero.Prefs.get('extensions.refsense.openaiApiKey');
                    this.log(`✅ 저장 확인 - aiBackend: "${savedBackend}", apiKey 길이: ${savedKey.length}`);
                    
                    this.log('OpenAI 설정이 저장되었습니다');
                    window.alert('OpenAI 설정이 저장되었습니다.');
                }
            } else {
                // Ollama 설정
                const host = window.prompt('Ollama 호스트 URL을 입력하세요:', currentSettings.ollamaHost);
                
                if (host && host.trim()) {
                    this.log('💾 Ollama 설정 저장 중...');
                    Zotero.Prefs.set('extensions.refsense.aiBackend', 'ollama');
                    Zotero.Prefs.set('extensions.refsense.ollamaHost', host.trim());
                    
                    // 저장 확인
                    const savedBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
                    const savedHost = Zotero.Prefs.get('extensions.refsense.ollamaHost');
                    this.log(`✅ 저장 확인 - aiBackend: "${savedBackend}", ollamaHost: "${savedHost}"`);
                    
                    this.log('Ollama 설정이 저장되었습니다');
                    window.alert('Ollama 설정이 저장되었습니다.');
                }
            }
            
            // 설정 다시 로드 (3초 지연으로 저장 완료 보장)
            setTimeout(() => {
                this.log('🔄 지연된 설정 재로드 시작...');
                this.loadConfig();
                this.log('🔄 지연된 설정 재로드 완료');
            }, 3000);
            
        } catch (error) {
            this.log('❌ Failed to show detailed settings dialog:', error.message);
        }
    },
    
    
    // 직접적인 메시지 리스너 설정 (Zotero Main Window에 등록)
    setupDirectMessageListener() {
        try {
            // Zotero 메인 UI 창에 메시지 리스너 등록
            const ZoteroPane = Zotero.getMainWindow();
            
            if (ZoteroPane && ZoteroPane.addEventListener) {
                ZoteroPane.addEventListener("message", (event) => {
                    if (!event.data || !event.data.type) return;
                    
                    this.log('[RefSense bootstrap] 받은 메시지:', event.data.type);
                    
                    const { type, settings } = event.data;
                    
                    if (type === "refsense-get-settings") {
                        this.log('Processing get-settings request from main window');
                        
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
                        
                        this.log('Sending settings:', result);
                        
                        if (event.source) {
                            event.source.postMessage({
                                type: "refsense-settings-response",
                                settings: result
                            }, event.origin || "*");
                            this.log('✅ Settings response sent to preferences window');
                        }
                    }
                    
                    if (type === "refsense-save-settings") {
                        this.log('Processing save-settings request from main window');
                        
                        if (settings) {
                            try {
                                // 설정 저장
                                Object.keys(settings).forEach(key => {
                                    const prefKey = `extensions.refsense.${key}`;
                                    Zotero.Prefs.set(prefKey, settings[key]);
                                    this.log(`Saved: ${prefKey} = ${settings[key]}`);
                                });
                                
                                // 설정 새로고침
                                this.loadConfig();
                                
                                if (event.source) {
                                    event.source.postMessage({
                                        type: "refsense-save-response",
                                        success: true
                                    }, event.origin || "*");
                                    this.log('✅ Save success response sent to preferences window');
                                }
                            } catch (saveError) {
                                this.log('❌ Error saving settings:', saveError.message);
                                if (event.source) {
                                    event.source.postMessage({
                                        type: "refsense-save-error",
                                        error: saveError.message
                                    }, event.origin || "*");
                                }
                            }
                        }
                    }
                    
                    if (type === "refsense-test-connection") {
                        this.log('Processing test-connection request from main window');
                        this.handleConnectionTest(event);
                    }
                });
                
                this.log('✅ Direct message listener registered on Zotero main window');
            } else {
                this.log('❌ Could not access Zotero main window');
            }
            
        } catch (error) {
            this.log('❌ Error setting up direct message listener:', error.message);
        }
    },
    
    // 연결 테스트 처리
    handleConnectionTest(event) {
        const { backend, config } = event.data;
        
        if (backend === 'ollama') {
            this.testOllamaConnection(config.host).then(result => {
                if (event.source) {
                    event.source.postMessage({
                        type: 'refsense-test-response',
                        success: result.success,
                        message: result.message
                    }, event.origin || "*");
                    this.log('Ollama test response sent');
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
                this.log('OpenAI test response sent');
            }
        }
    },
    
    // 직접 메시지 처리 (메인 윈도우용)
    handleDirectMessage(event) {
        // setupDirectMessageListener와 동일한 로직
        const { type, settings } = event.data || {};
        
        if (type === "refsense-get-settings") {
            const result = {
                ai_backend: Zotero.Prefs.get("extensions.refsense.ai_backend", "ollama"),
                openai_model: Zotero.Prefs.get("extensions.refsense.openai_model", "gpt-4-turbo"),
                openai_api_key: Zotero.Prefs.get("extensions.refsense.openai_api_key", ""),
                ollama_host: Zotero.Prefs.get("extensions.refsense.ollama_host", "http://localhost:11434"),
                ollama_model: Zotero.Prefs.get("extensions.refsense.ollama_model", "llama3.2:latest"),
                default_page_source: Zotero.Prefs.get("extensions.refsense.default_page_source", "first"),
                page_range: Zotero.Prefs.get("extensions.refsense.page_range", "1-2")
            };
            
            if (event.source) {
                event.source.postMessage({
                    type: "refsense-settings-response",
                    settings: result
                }, event.origin || "*");
            }
        }
        
        if (type === "refsense-save-settings" && settings) {
            try {
                Object.keys(settings).forEach(key => {
                    const prefKey = `extensions.refsense.${key}`;
                    Zotero.Prefs.set(prefKey, settings[key]);
                });
                this.loadConfig();
                
                if (event.source) {
                    event.source.postMessage({
                        type: "refsense-save-response",
                        success: true
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
    },
    
    // 메인 윈도우에 메시지 리스너 설정
    setupMainWindowMessageListener(win) {
        try {
            // 기존 리스너 제거
            if (win._refSenseMainMessageListener) {
                win.removeEventListener('message', win._refSenseMainMessageListener);
            }
            
            // 새 메시지 리스너 등록
            win._refSenseMainMessageListener = (event) => {
                this.log('Main window received message:', event.data?.type);
                this.handlePostMessage(event);
            };
            
            win.addEventListener('message', win._refSenseMainMessageListener);
            this.log('Main window message listener added');
            
        } catch (error) {
            this.log('Error setting up main window listener:', error.message);
        }
    },
    
    // 일반 윈도우에 메시지 리스너 설정
    setupWindowMessageListener(win) {
        try {
            // 기존 리스너 제거
            if (win._refSenseWindowMessageListener) {
                win.removeEventListener('message', win._refSenseWindowMessageListener);
            }
            
            // 새 메시지 리스너 등록
            win._refSenseWindowMessageListener = (event) => {
                this.log('Window received message:', event.data?.type);
                this.handlePostMessage(event);
            };
            
            win.addEventListener('message', win._refSenseWindowMessageListener);
            this.log('Window message listener added');
            
        } catch (error) {
            this.log('Error setting up window listener:', error.message);
        }
    },
    
    // postMessage 이벤트 처리
    handlePostMessage(event) {
        try {
            // 보안: 메시지 검증
            if (!event.data || !event.data.type || !event.data.type.startsWith('refsense-')) {
                return;
            }
            
            this.log('Processing postMessage:', event.data.type);
            
            switch (event.data.type) {
                case 'refsense-get-settings':
                    this.log('Handling get-settings request');
                    const settings = this.getSettingsForPreferences();
                    if (settings.success && event.source) {
                        event.source.postMessage({
                            type: 'refsense-settings-response',
                            settings: settings.settings
                        }, event.origin || '*');
                        this.log('Settings response sent');
                    }
                    break;
                    
                case 'refsense-save-settings':
                    this.log('Handling save-settings request');
                    const saveResult = this.saveSettingsFromPreferences(event.data.settings);
                    if (event.source) {
                        if (saveResult.success) {
                            event.source.postMessage({
                                type: 'refsense-save-response',
                                success: true
                            }, event.origin || '*');
                            this.log('Save success response sent');
                        } else {
                            event.source.postMessage({
                                type: 'refsense-save-error',
                                error: saveResult.error
                            }, event.origin || '*');
                            this.log('Save error response sent');
                        }
                    }
                    break;
                    
                case 'refsense-test-connection':
                    this.log('Handling test-connection request');
                    this.testConnectionFromPreferences(event.data.backend, event.data.config, event.source, event.origin);
                    break;
            }
            
        } catch (error) {
            this.log('❌ Error handling postMessage:', error.message);
        }
    },
    
    // 전역 접근 설정
    setupGlobalAccess() {
        try {
            this.log('Setting up global access for preferences');
            
            // Zotero 객체에 직접 등록
            if (typeof Zotero !== 'undefined') {
                Zotero.RefSense = this;
                this.log('✅ Zotero.RefSense registered');
            }
            
            // 전역 객체에 등록 (다중 접근)
            if (typeof globalThis !== 'undefined') {
                globalThis.RefSense = RefSense;
                globalThis.RefSensePlugin = this;
                this.log('✅ globalThis.RefSense registered');
            }
            
            if (typeof window !== 'undefined') {
                window.RefSense = RefSense;
                window.RefSensePlugin = this;
                this.log('✅ window.RefSense registered');
            }
            
            // 메인 윈도우에도 등록
            try {
                const mainWindow = Zotero.getMainWindow();
                if (mainWindow) {
                    mainWindow.RefSense = RefSense;
                    mainWindow.RefSensePlugin = this;
                    this.log('✅ mainWindow.RefSense registered');
                }
            } catch (error) {
                this.log('Main window access failed:', error.message);
            }
            
        } catch (error) {
            this.log('❌ Failed to setup global access:', error.message);
        }
    },
    
    // 모든 윈도우에 메시지 리스너 추가
    addMessageListenerToAllWindows() {
        try {
            const windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                           .getService(Components.interfaces.nsIWindowMediator);
            const windows = windowMediator.getEnumerator(null);
            
            while (windows.hasMoreElements()) {
                const win = windows.getNext();
                if (win && win.addEventListener) {
                    this.addMessageListenerToWindow(win);
                }
            }
        } catch (error) {
            this.log('Error adding listeners to existing windows:', error.message);
        }
    },
    
    // 특정 윈도우에 메시지 리스너 추가
    addMessageListenerToWindow(win) {
        try {
            // 이미 리스너가 있으면 제거
            if (win._refSenseMessageListener) {
                win.removeEventListener('message', win._refSenseMessageListener);
            }
            
            // 새 리스너 추가
            win._refSenseMessageListener = (event) => {
                this.handlePreferencesMessage(event);
            };
            
            win.addEventListener('message', win._refSenseMessageListener);
            this.log('Message listener added to window:', win.location?.href || 'unknown');
            
        } catch (error) {
            this.log('Error adding listener to window:', error.message);
        }
    },
    
    // nsIWindowWatcher 인터페이스 구현
    observe(subject, topic, data) {
        if (topic === 'domwindowopened') {
            try {
                // 새 윈도우가 열릴 때 리스너 추가
                const win = subject;
                if (win && win.addEventListener) {
                    win.addEventListener('load', () => {
                        this.addMessageListenerToWindow(win);
                    });
                }
            } catch (error) {
                this.log('Error in observe:', error.message);
            }
        }
    },
    
    // Handle direct message calls
    handleDirectMessage(data) {
        try {
            this.log('Direct message received:', data.type);
            
            switch (data.type) {
                case 'refsense-get-settings':
                    return this.getSettingsForPreferences();
                    
                case 'refsense-save-settings':
                    return this.saveSettingsFromPreferences(data.settings);
                    
                case 'refsense-test-connection':
                    return this.testConnectionFromPreferences(data.backend, data.config);
            }
            
        } catch (error) {
            this.log('❌ Error handling direct message:', error.message);
            return { error: error.message };
        }
    },
    
    // Handle messages from preferences window
    handlePreferencesMessage(event) {
        try {
            // 보안: 메시지 검증
            if (!event.data || !event.data.type || !event.data.type.startsWith('refsense-')) {
                return;
            }
            
            // 보안: origin 확인 (chrome://zotero 또는 moz-extension://)
            if (!event.origin.startsWith('chrome://') && !event.origin.startsWith('moz-extension://')) {
                this.log('❌ 허용되지 않은 origin에서 메시지:', event.origin);
                return;
            }
            
            this.log('Received preferences message:', event.data.type);
            
            switch (event.data.type) {
                case 'refsense-get-settings':
                    this.sendSettingsToPreferences(event.source);
                    break;
                    
                case 'refsense-save-settings':
                    this.saveSettingsFromPreferences(event.data.settings, event.source);
                    break;
                    
                case 'refsense-test-connection':
                    this.testConnectionFromPreferences(event.data.backend, event.data.config, event.source);
                    break;
            }
            
        } catch (error) {
            this.log('❌ Error handling preferences message:', error.message);
        }
    },
    
    // Get settings for preferences (direct call)
    getSettingsForPreferences() {
        try {
            const settings = {
                ai_backend: Zotero.Prefs.get('extensions.refsense.ai_backend', 'ollama'),
                openai_api_key: Zotero.Prefs.get('extensions.refsense.openai_api_key', ''),
                openai_model: Zotero.Prefs.get('extensions.refsense.openai_model', 'gpt-4-turbo'),
                ollama_host: Zotero.Prefs.get('extensions.refsense.ollama_host', 'http://localhost:11434'),
                ollama_model: Zotero.Prefs.get('extensions.refsense.ollama_model', 'llama3.2:latest'),
                default_page_source: Zotero.Prefs.get('extensions.refsense.default_page_source', 'first'),
                page_range: Zotero.Prefs.get('extensions.refsense.page_range', '1-2')
            };
            
            this.log('Settings retrieved for preferences');
            return { success: true, settings: settings };
            
        } catch (error) {
            this.log('❌ Error getting settings:', error.message);
            return { success: false, error: error.message };
        }
    },
    
    // Send current settings to preferences window (postMessage)
    sendSettingsToPreferences(source) {
        try {
            const result = this.getSettingsForPreferences();
            
            if (result.success) {
                source.postMessage({
                    type: 'refsense-settings-response',
                    settings: result.settings
                }, '*');
                this.log('Settings sent to preferences window');
            } else {
                source.postMessage({
                    type: 'refsense-settings-error',
                    error: result.error
                }, '*');
            }
            
        } catch (error) {
            this.log('❌ Error sending settings:', error.message);
            source.postMessage({
                type: 'refsense-settings-error',
                error: error.message
            }, '*');
        }
    },
    
    // Save settings (direct call)
    saveSettingsFromPreferences(settings, source = null) {
        try {
            // Save all settings
            Object.keys(settings).forEach(key => {
                const prefKey = `extensions.refsense.${key}`;
                Zotero.Prefs.set(prefKey, settings[key]);
            });
            
            // Reload config
            this.loadConfig();
            
            this.log('Settings saved from preferences window');
            
            if (source) {
                source.postMessage({
                    type: 'refsense-save-response',
                    success: true
                }, '*');
            }
            
            return { success: true };
            
        } catch (error) {
            this.log('❌ Error saving settings:', error.message);
            
            if (source) {
                source.postMessage({
                    type: 'refsense-save-error',
                    error: error.message
                }, '*');
            }
            
            return { success: false, error: error.message };
        }
    },
    
    // Test connection from preferences window
    testConnectionFromPreferences(backend, config, source, origin = '*') {
        try {
            this.log(`Testing ${backend} connection`);
            
            if (backend === 'ollama') {
                // Test Ollama connection
                this.testOllamaConnection(config.host).then(result => {
                    if (source) {
                        source.postMessage({
                            type: 'refsense-test-response',
                            success: result.success,
                            message: result.message
                        }, origin);
                        this.log('Test response sent for Ollama');
                    }
                });
            } else {
                // OpenAI test (simple validation)
                const isValid = config.apiKey && config.apiKey.startsWith('sk-') && config.apiKey.length > 40;
                if (source) {
                    source.postMessage({
                        type: 'refsense-test-response',
                        success: isValid,
                        message: isValid ? 'OpenAI API 키 형식이 올바릅니다!' : 'OpenAI API 키 형식이 올바르지 않습니다.'
                    }, origin);
                    this.log('Test response sent for OpenAI');
                }
            }
            
        } catch (error) {
            this.log('❌ Error testing connection:', error.message);
            if (source) {
                source.postMessage({
                    type: 'refsense-test-error',
                    error: error.message
                }, origin);
            }
        }
    },
    
    // Test Ollama connection
    async testOllamaConnection(host) {
        return new Promise((resolve) => {
            try {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', `${host}/api/tags`, true);
                xhr.timeout = 5000;
                
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                const data = JSON.parse(xhr.responseText);
                                const modelCount = data.models ? data.models.length : 0;
                                resolve({
                                    success: true,
                                    message: `Ollama 연결 성공! (설치된 모델: ${modelCount}개)`
                                });
                            } catch (parseError) {
                                resolve({
                                    success: true,
                                    message: 'Ollama 연결 성공!'
                                });
                            }
                        } else {
                            resolve({
                                success: false,
                                message: `Ollama 서버 응답 오류: ${xhr.status}`
                            });
                        }
                    }
                };
                
                xhr.onerror = () => resolve({
                    success: false,
                    message: 'Ollama 연결 실패: 네트워크 오류'
                });
                
                xhr.ontimeout = () => resolve({
                    success: false,
                    message: 'Ollama 연결 실패: 타임아웃'
                });
                
                xhr.send();
                
            } catch (error) {
                resolve({
                    success: false,
                    message: `Ollama 연결 실패: ${error.message}`
                });
            }
        });
    },
    
    
    // Plugin shutdown
    shutdown() {
        this.log('RefSense plugin shutting down...');
        
        // Clean up message listeners
        try {
            // 메인 윈도우 리스너 정리
            const mainWindow = Zotero.getMainWindow();
            if (mainWindow && mainWindow._refSenseMainMessageListener) {
                mainWindow.removeEventListener('message', mainWindow._refSenseMainMessageListener);
                delete mainWindow._refSenseMainMessageListener;
            }
            
            // 현재 윈도우 리스너 정리
            if (typeof window !== 'undefined' && window._refSenseWindowMessageListener) {
                window.removeEventListener('message', window._refSenseWindowMessageListener);
                delete window._refSenseWindowMessageListener;
            }
            
            // 기존 방식 정리
            const windowWatcher = Components.classes["@mozilla.org/embedcomp/window-watcher;1"]
                                           .getService(Components.interfaces.nsIWindowWatcher);
            windowWatcher.unregisterNotification(this);
            
            // Remove listeners from all windows
            const windowMediator = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                           .getService(Components.interfaces.nsIWindowMediator);
            const windows = windowMediator.getEnumerator(null);
            
            while (windows.hasMoreElements()) {
                const win = windows.getNext();
                if (win && win._refSenseMessageListener) {
                    win.removeEventListener('message', win._refSenseMessageListener);
                    delete win._refSenseMessageListener;
                }
            }
        } catch (error) {
            this.log('Error during message listener cleanup:', error.message);
        }
        
        // Clean up resources
        this.cleanup();
        
        this.log('RefSense plugin shut down');
    },
    
    // Load plugin configuration
    // Load configuration from Zotero preferences (updated for integrated settings)
    loadConfig() {
        try {
            this.log('📥 loadConfig() 호출됨');
            
            // 실제 저장된 값들을 먼저 확인
            const rawBackend = Zotero.Prefs.get('extensions.refsense.aiBackend');
            const rawOllamaHost = Zotero.Prefs.get('extensions.refsense.ollamaHost');
            
            this.log(`📥 Raw values: aiBackend="${rawBackend}", ollamaHost="${rawOllamaHost}"`);
            
            this.config = {
                // AI 백엔드 설정
                aiBackend: rawBackend || 'openai',
                
                // OpenAI 설정
                openaiModel: Zotero.Prefs.get('extensions.refsense.openaiModel') || 'gpt-4-turbo',
                openaiApiKey: Zotero.Prefs.get('extensions.refsense.openaiApiKey') || '',
                
                // Ollama 설정
                ollama_model: Zotero.Prefs.get('extensions.refsense.ollamaModel') || 'llama3.2:latest',
                ollama_host: Zotero.Prefs.get('extensions.refsense.ollamaHost') || 'http://localhost:11434',
                
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
                    this.log('API key decoding failed, using raw value');
                }
            }
            
            this.log('Configuration loaded:', {
                ...this.config,
                openaiApiKey: this.config.openaiApiKey ? '[HIDDEN]' : '[NOT SET]'
            });
            
        } catch (error) {
            this.log('Error loading configuration:', error.message);
            // 기본값으로 fallback
            this.config = {
                aiBackend: 'openai',
                openaiModel: 'gpt-4-turbo',
                openaiApiKey: '',
                ollama_model: 'llama3.2:latest',
                ollama_host: 'http://localhost:11434',
                defaultPageSource: 'first',
                pageRange: '1-2',
                enableLogging: true,
                maxRetries: 3,
                requestTimeout: 30000
            };
        }
    },
    
    // Initialize UI components with retry logic
    initUIWithRetry(attempt = 1, maxAttempts = 10) {
        this.log(`UI initialization attempt ${attempt}/${maxAttempts}`);
        
        try {
            this.initUI();
            this.log('UI initialization completed');
        } catch (error) {
            this.handleError(error, `initUI attempt ${attempt}`);
            
            if (attempt < maxAttempts) {
                const delay = Math.min(1000 * attempt, 10000); // Max 10 seconds
                this.log(`Retrying UI initialization in ${delay}ms...`);
                setTimeout(() => {
                    this.initUIWithRetry(attempt + 1, maxAttempts);
                }, delay);
            } else {
                this.log('UI initialization failed after maximum attempts');
            }
        }
    },

    // Initialize UI components
    initUI() {
        // Add menu items to PDF reader
        this.addPDFReaderButtons();
    },
    
    // Add buttons to PDF reader toolbar
    addPDFReaderButtons() {
        this.log('Adding PDF reader button...');
        
        // Wait for Zotero to be fully loaded
        if (!Zotero.Reader) {
            this.log('Zotero.Reader not available, retrying...');
            setTimeout(() => this.addPDFReaderButtons(), 1000);
            return;
        }
        
        this.log('Zotero.Reader available, setting up hooks...');
        
        try {
            // Method 1: Use Zotero Notifier system for tab events (PDF readers are opened in tabs)
            if (Zotero.Notifier) {
                this.log('Setting up Zotero Notifier for tab events...');
                
                const notifierID = Zotero.Notifier.registerObserver({
                    notify: (event, type, ids, extraData) => {
                        this.log('Notifier event:', event, 'type:', type, 'ids:', ids);
                        
                        // Monitor for tab-related events (PDF readers open in tabs)
                        if (event === 'add' && type === 'tab') {
                            this.log('Tab added event detected for IDs:', ids);
                            for (let id of ids) {
                                // Check if this tab contains a reader
                                setTimeout(() => {
                                    this.checkTabForReader(id, extraData);
                                }, 1000);
                            }
                        }
                        
                        // Also monitor select events to catch when a reader tab is selected
                        if (event === 'select' && type === 'tab') {
                            this.log('Tab selected event detected for IDs:', ids);
                            for (let id of ids) {
                                setTimeout(() => {
                                    this.checkTabForReader(id, extraData);
                                }, 500);
                            }
                        }
                    }
                }, ['tab']);
                
                this.notifierID = notifierID;
                this.log('Notifier registered with ID:', notifierID);
            }
            
            // Method 2: Check available Zotero.Reader methods and properties
            this.log('Available Zotero.Reader properties:', Object.getOwnPropertyNames(Zotero.Reader));
            if (Zotero.Reader._readers) {
                this.log('Zotero.Reader._readers exists, type:', typeof Zotero.Reader._readers);
            }
            
            // Method 3: Monitor for new readers using periodic check
            this.readerMonitorInterval = setInterval(() => {
                try {
                    let readers = [];
                    
                    if (Zotero.Reader && Zotero.Reader._readers) {
                        if (typeof Zotero.Reader._readers.values === 'function') {
                            readers = Array.from(Zotero.Reader._readers.values());
                        } else if (Array.isArray(Zotero.Reader._readers)) {
                            readers = Zotero.Reader._readers;
                        } else {
                            // Try to access as object
                            readers = Object.values(Zotero.Reader._readers);
                        }
                    }
                    
                    for (let reader of readers) {
                        if (reader && reader.itemID && !reader._refsenseButtonAdded) {
                            this.log('Found new reader via monitoring:', reader.itemID);
                            this.setupReaderToolbar(reader);
                        }
                    }
                } catch (error) {
                    // Silently continue monitoring
                }
            }, 3000);
            
            this.log('Reader monitoring started');
            this.log('PDF reader button integration setup completed');
            
        } catch (error) {
            this.handleError(error, 'addPDFReaderButtons');
        }
    },
    
    // Check if a tab contains a reader and set it up
    async checkTabForReader(tabID, extraData) {
        try {
            this.log('Checking tab for reader:', tabID, 'extraData:', extraData);
            
            // Check if this tab is a reader tab
            if (extraData && extraData[tabID]) {
                const tabData = extraData[tabID];
                this.log('Tab data:', tabData);
                
                if (tabData.type === 'reader' && tabData.itemID) {
                    const itemID = tabData.itemID;
                    this.log('Found reader tab for item:', itemID);
                    
                    // Get the reader instance
                    setTimeout(() => {
                        this.setupReaderForItem(itemID);
                    }, 1000);
                } else {
                    this.log('Tab is not a reader or missing itemID:', tabData);
                }
            } else {
                // Fallback: try to get reader directly from current readers
                this.log('No extraData available, checking current readers...');
                setTimeout(() => {
                    this.setupCurrentReaders();
                }, 1000);
            }
        } catch (error) {
            this.handleError(error, 'checkTabForReader');
        }
    },
    
    // Setup all current readers
    setupCurrentReaders() {
        try {
            this.log('Setting up all current readers...');
            
            if (Zotero.Reader && Zotero.Reader._readers) {
                let readers = [];
                
                if (typeof Zotero.Reader._readers.values === 'function') {
                    readers = Array.from(Zotero.Reader._readers.values());
                } else if (Array.isArray(Zotero.Reader._readers)) {
                    readers = Zotero.Reader._readers;
                } else {
                    readers = Object.values(Zotero.Reader._readers);
                }
                
                this.log('Found readers:', readers.length);
                
                for (let reader of readers) {
                    if (reader && reader.itemID && !reader._refsenseButtonAdded) {
                        this.log('Setting up reader:', reader.itemID);
                        this.setupReaderToolbar(reader);
                    }
                }
            }
        } catch (error) {
            this.handleError(error, 'setupCurrentReaders');
        }
    },
    
    // Setup reader for a specific item ID
    async setupReaderForItem(itemID) {
        try {
            this.log('Setting up reader for item ID:', itemID);
            
            // Get the reader instance
            if (Zotero.Reader && Zotero.Reader._readers) {
                let readers = [];
                
                if (typeof Zotero.Reader._readers.values === 'function') {
                    readers = Array.from(Zotero.Reader._readers.values());
                } else {
                    readers = Object.values(Zotero.Reader._readers);
                }
                
                const reader = readers.find(r => r && r.itemID == itemID);
                if (reader) {
                    this.log('Found reader instance for item:', itemID);
                    this.setupReaderToolbar(reader);
                } else {
                    this.log('No reader instance found for item:', itemID);
                }
            }
        } catch (error) {
            this.handleError(error, 'setupReaderForItem');
        }
    },
    
    // Setup toolbar for a specific reader
    setupReaderToolbar(reader) {
        try {
            this.log('Setting up toolbar for reader:', reader.itemID);
            
            // Check if button already exists
            if (reader._refsenseButtonAdded) {
                this.log('Button already exists for this reader');
                return;
            }
            
            // Try multiple approaches for adding toolbar button
            this.addReaderToolbarButton(reader);
            this.addReaderMenuItem(reader);
            
        } catch (error) {
            this.handleError(error, 'setupReaderToolbar');
        }
    },
    
    // Add toolbar button to PDF reader
    addReaderToolbarButton(reader) {
        try {
            this.log('Adding toolbar button to reader:', reader.itemID);
            
            // Wait for reader window to be fully loaded
            setTimeout(() => {
                this.insertToolbarButton(reader);
            }, 2000);
            
        } catch (error) {
            this.handleError(error, 'addReaderToolbarButton');
        }
    },
    
    // Insert the actual toolbar button
    insertToolbarButton(reader) {
        try {
            this.log('Starting button insertion for reader:', reader.itemID);
            
            // Wait for reader to be fully initialized and use a simpler approach
            const tryInsertButton = () => {
                try {
                    // Use a much simpler approach - just add to any available window/iframe
                    let targetDoc = null;
                    let targetWindow = null;
                    
                    // Try to find the PDF viewer iframe or window
                    if (reader._iframeWindow && reader._iframeWindow.document) {
                        targetWindow = reader._iframeWindow;
                        targetDoc = reader._iframeWindow.document;
                        this.log('Using iframe window/document');
                    } else if (reader._window && reader._window.document && reader._window !== globalThis) {
                        targetWindow = reader._window;
                        targetDoc = reader._window.document;
                        this.log('Using reader window/document');
                    } else {
                        this.log('Cannot find suitable document, skipping button insertion');
                        return;
                    }
                    
                    // Simple DOM ready check
                    if (!targetDoc || !targetDoc.body || targetDoc.readyState === 'loading') {
                        this.log('Document not ready, retrying...');
                        setTimeout(tryInsertButton, 1000);
                        return;
                    }
                    
                    this.log('Document ready, inserting floating button');
                    this.insertSimpleFloatingButton(targetDoc, targetWindow, reader);
                    
                } catch (error) {
                    this.log('Error in tryInsertButton:', error.message);
                }
            };
            
            // Start trying to insert button with delays
            setTimeout(tryInsertButton, 1000);
            
        } catch (error) {
            this.handleError(error, 'insertToolbarButton');
        }
    },
    
    // Insert a simple floating button that always works
    insertSimpleFloatingButton(doc, win, reader) {
        try {
            this.log('Inserting simple floating button');
            
            // Check if button already exists
            if (doc.querySelector('#refsense-simple-btn')) {
                this.log('Simple RefSense button already exists');
                return;
            }
            
            // Check if PDF already has a parent item
            if (this.hasParentItem(reader)) {
                this.log('PDF already has parent item - not showing RefSense button');
                return;
            }
            
            // Create floating button with minimal dependencies
            const btn = doc.createElement('div');
            btn.id = 'refsense-simple-btn';
            btn.textContent = '📄 RefSense';
            btn.title = 'Extract Metadata (Ctrl+Shift+E)';
            
            // Simple but effective styling
            btn.style.cssText = `
                position: fixed !important;
                top: 15px !important;
                right: 15px !important;
                background: #4CAF50 !important;
                color: white !important;
                padding: 8px 12px !important;
                border-radius: 20px !important;
                cursor: pointer !important;
                font-family: Arial, sans-serif !important;
                font-size: 12px !important;
                font-weight: bold !important;
                z-index: 999999 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
                border: none !important;
                user-select: none !important;
                transition: all 0.2s ease !important;
            `;
            
            // Add hover effect
            btn.onmouseenter = () => {
                btn.style.background = '#45a049 !important';
                btn.style.transform = 'scale(1.05)';
            };
            btn.onmouseleave = () => {
                btn.style.background = '#4CAF50 !important';
                btn.style.transform = 'scale(1)';
            };
            
            // Add click handler
            btn.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.log('Simple RefSense button clicked!');
                this.handleExtractMetadata(reader);
            };
            
            // Insert into document
            doc.body.appendChild(btn);
            this.log('Simple floating button inserted successfully');
            reader._refsenseButtonAdded = true;
            
        } catch (error) {
            this.handleError(error, 'insertSimpleFloatingButton');
        }
    },

    // Check if PDF attachment already has a parent item
    hasParentItem(reader) {
        try {
            if (!reader || !reader.itemID) {
                this.log('No reader or itemID available for parent check');
                return false;
            }

            // Get the PDF attachment item
            const pdfItem = Zotero.Items.get(reader.itemID);
            if (!pdfItem) {
                this.log('Could not find PDF item with ID:', reader.itemID);
                return false;
            }

            // Check if it has a parent item
            const hasParent = pdfItem.parentItemID && pdfItem.parentItemID > 0;
            
            this.log(`PDF item ${reader.itemID} parent check:`, {
                itemID: reader.itemID,
                parentItemID: pdfItem.parentItemID,
                hasParent: hasParent
            });

            return hasParent;
            
        } catch (error) {
            this.log('Error checking parent item:', error.message);
            // If error occurs, show button to be safe
            return false;
        }
    },
    
    // Simplified toolbar search (keeping for future use)
    searchForToolbar(doc) {
        try {
            this.log('Searching for PDF toolbar in document');
            
            // This function is kept for future improvements
            return null;
        } catch (error) {
            this.handleError(error, 'searchForToolbar');
            return null;
        }
    },
    
    // Add menu item to reader (safer approach)
    addReaderMenuItem(reader) {
        try {
            this.log('Adding menu item to reader:', reader.itemID);
            
            // Mark as added
            reader._refsenseButtonAdded = true;
            
            // Try multiple approaches for keyboard shortcut
            this.addKeyboardShortcuts(reader);
            
            // Also try to add to Zotero's main menu
            this.addToZoteroMenu(reader);
            
        } catch (error) {
            this.handleError(error, 'addReaderMenuItem');
        }
    },
    
    // Add keyboard shortcuts with multiple targets
    addKeyboardShortcuts(reader) {
        const handleKeydown = (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'E') {
                event.preventDefault();
                event.stopPropagation();
                this.log('Keyboard shortcut triggered!');
                this.handleExtractMetadata(reader);
                return false;
            }
        };
        
        try {
            // Add to main Zotero window (use Zotero's window reference)
            try {
                if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                    const mainWindow = Zotero.getMainWindow();
                    if (mainWindow && mainWindow.document) {
                        mainWindow.document.addEventListener('keydown', handleKeydown, true);
                        this.log('Keyboard shortcut added to main window via Zotero.getMainWindow()');
                    }
                } else if (typeof Components !== 'undefined') {
                    // Fallback using Components
                    const wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                                        .getService(Components.interfaces.nsIWindowMediator);
                    const mainWindow = wm.getMostRecentWindow("navigator:browser") || 
                                     wm.getMostRecentWindow("zotero:main");
                    if (mainWindow && mainWindow.document) {
                        mainWindow.document.addEventListener('keydown', handleKeydown, true);
                        this.log('Keyboard shortcut added to main window via Components');
                    }
                } else {
                    this.log('No method available to access main window');
                }
            } catch (winError) {
                this.log('Could not access main window:', winError.message);
            }
            
            // Add to reader window
            if (reader._window && reader._window.document) {
                reader._window.document.addEventListener('keydown', handleKeydown, true);
                this.log('Keyboard shortcut added to reader window');
            }
            
            // Add to reader iframe if exists
            if (reader._iframeWindow && reader._iframeWindow.document) {
                reader._iframeWindow.document.addEventListener('keydown', handleKeydown, true);
                this.log('Keyboard shortcut added to reader iframe');
            }
            
        } catch (error) {
            this.handleError(error, 'addKeyboardShortcuts');
        }
    },
    
    // Add to Zotero's menu system
    addToZoteroMenu(reader) {
        try {
            this.log('RefSense activated for reader:', reader.itemID);
            
            // No popup notification - the floating button provides visual indication
            // that RefSense is active for this PDF
            
        } catch (error) {
            this.handleError(error, 'addToZoteroMenu');
        }
    },
    
    // Handle metadata extraction
    async handleExtractMetadata(reader) {
        this.log('Extract metadata button clicked for reader:', reader.itemID);
        
        try {
            // Get PDF item
            const item = await Zotero.Items.getAsync(reader.itemID);
            if (!item) {
                throw new Error('Could not find PDF item');
            }
            
            this.log('PDF item found:', item.getField('title') || 'Untitled');
            
            // Show processing message on buttons
            let targetDoc = null;
            if (reader._iframeWindow && reader._iframeWindow.document) {
                targetDoc = reader._iframeWindow.document;
            } else if (reader._window && reader._window.document) {
                targetDoc = reader._window.document;
            }
            
            let simpleBtn = null;
            let originalSimpleText = '';
            
            if (targetDoc) {
                simpleBtn = targetDoc.querySelector('#refsense-simple-btn');
                if (simpleBtn) {
                    originalSimpleText = simpleBtn.textContent;
                    simpleBtn.textContent = '⏳ Processing...';
                    simpleBtn.style.opacity = '0.7';
                    simpleBtn.style.pointerEvents = 'none';
                }
            }
            
            try {
                // Get PDF context information
                const pdfContext = await this.getPDFContext(reader, item);
                
                // Extract PDF content and process with AI
                const extractionResult = await this.extractPDFContent(reader, pdfContext);
                
                if (extractionResult.success) {
                    this.log('✅ PDF content extraction and AI processing completed successfully');
                } else {
                    this.log('❌ PDF content extraction or AI processing failed:', extractionResult.error);
                    
                    // Show error message
                    this.showMessage(
                        'PDF 처리 실패',
                        extractionResult.error || '알 수 없는 오류가 발생했습니다.',
                        'error'
                    );
                }
                
            } finally {
                // Restore buttons
                setTimeout(() => {
                    if (simpleBtn) {
                        simpleBtn.textContent = originalSimpleText;
                        simpleBtn.style.opacity = '1';
                        simpleBtn.style.pointerEvents = 'auto';
                    }
                }, 1000);
            }
            
        } catch (error) {
            this.handleError(error, 'handleExtractMetadata');
            
            // Show error to user
            if (reader._window) {
                reader._window.alert(`RefSense Error: ${error.message}`);
            }
            
            // Restore buttons on error
            let targetDoc = null;
            if (reader._iframeWindow && reader._iframeWindow.document) {
                targetDoc = reader._iframeWindow.document;
            } else if (reader._window && reader._window.document) {
                targetDoc = reader._window.document;
            }
            
            if (targetDoc) {
                const simpleBtn = targetDoc.querySelector('#refsense-simple-btn');
                if (simpleBtn) {
                    simpleBtn.textContent = '📄 RefSense';
                    simpleBtn.style.opacity = '1';
                    simpleBtn.style.pointerEvents = 'auto';
                }
            }
        }
    },
    
    // Extract PDF content (Stage 3 implementation)
    async extractPDFContent(reader, pdfContext) {
        this.log('Starting PDF content extraction for:', pdfContext.filename);
        
        const result = {
            success: false,
            method: '',
            pageNumber: 1,
            contentType: '',
            content: '',
            contentLength: 0,
            imageDataUrl: null,
            error: null
        };
        
        try {
            // Determine which page to extract based on settings
            const pageToExtract = this.getPageToExtract(pdfContext);
            result.pageNumber = pageToExtract;
            
            this.log('Extracting content from page:', pageToExtract);
            
            // Try text extraction first (preferred method)
            const textResult = await this.extractTextFromPage(reader, pageToExtract);
            
            if (textResult.success && textResult.text && textResult.text.trim().length > 50) {
                // Text extraction successful, now call AI
                result.success = true;
                result.method = 'text';
                result.contentType = 'text';
                result.content = textResult.text;
                result.contentLength = textResult.text.length;
                this.log('Text extraction successful, length:', result.contentLength);
                
                // Process with AI to extract metadata
                const aiResult = await this.processWithAI(textResult.text, pdfContext);
                
                if (aiResult && aiResult.success) {
                    // AI processing successful - handle based on parent existence
                    if (pdfContext.hasParent) {
                        this.log('Parent item exists, showing comparison dialog for user decision');
                        // Parent exists, show comparison dialog for user decision
                        const userDecision = await this.handleExistingParent(aiResult.metadata, reader, pdfContext);
                        
                        if (userDecision.success) {
                            result.success = true;
                        } else {
                            result.success = false;
                            result.error = userDecision.error || '사용자가 취소했습니다';
                            this.log('User cancelled or operation failed');
                        }
                    } else {
                        this.log('No parent item, showing metadata preview');
                        // No parent exists, show preview first
                        const userConfirmed = await this.showMetadataPreview(aiResult.metadata, pdfContext);
                        
                        if (userConfirmed) {
                            // User confirmed - create parent item
                            await this.createParentFromMetadata(userConfirmed.metadata, reader, pdfContext);
                            result.success = true; // Mark overall process as successful
                        } else {
                            // User cancelled
                            result.success = false;
                            result.error = '사용자가 취소했습니다';
                            this.log('User cancelled metadata creation');
                        }
                    }
                } else {
                    // AI processing failed
                    result.success = false;
                    result.error = aiResult ? aiResult.error : 'AI 결과가 없습니다';
                    this.showMessage('AI 처리 실패', result.error, 'warning');
                }
                
            } else {
                // Text extraction failed or insufficient
                result.success = false;
                result.error = `Text extraction failed or insufficient content. Available text length: ${textResult.text ? textResult.text.length : 0}`;
                this.log('PDF content extraction failed:', result.error);
                
                // Show user-friendly message
                this.showMessage('텍스트 추출 실패', '이 PDF에서 텍스트를 추출할 수 없습니다. 이미지 기반 PDF이거나 보호된 파일일 수 있습니다.', 'warning');
            }
            
        } catch (error) {
            result.success = false;
            result.error = error.message;
            this.handleError(error, 'extractPDFContent');
        }
        
        return result;
    },
    
    // Determine which page to extract based on settings
    getPageToExtract(pdfContext) {
        const pageSource = this.config.defaultPageSource || 'first';
        
        switch (pageSource) {
            case 'current':
                return pdfContext.currentPage;
            case 'range':
                // For now, just use first page of range
                const range = this.config.pageRange || '1';
                const firstPage = parseInt(range.split(/[-–—]/)[0]) || 1;
                return Math.min(firstPage, pdfContext.totalPages || 1);
            case 'first':
            default:
                return 1;
        }
    },
    
    // Extract text from specific page using multiple approaches
    async extractTextFromPage(reader, pageNumber) {
        const result = {
            success: false,
            text: '',
            error: null
        };
        
        try {
            this.log('Attempting text extraction from page:', pageNumber);
            
            // Try multiple text extraction methods in priority order
            const extractionMethods = [
                { name: '1. Zotero Fulltext API', func: () => this.extractViaZoteroAPI(reader, pageNumber) },
                { name: '2. Direct Reader API', func: () => this.extractViaZoteroReader(reader, pageNumber) },
                { name: '3. PDF.js wrappedJSObject', func: () => this.extractViaPDFJS(reader, pageNumber) },
                { name: '4. DOM textLayer', func: () => this.extractViaTextLayer(reader, pageNumber) },
                { name: '5. Document selection', func: () => this.extractViaDocumentSelection(reader, pageNumber) },
                { name: '6. File system access', func: () => this.extractViaFileSystemAccess(reader, pageNumber) }
            ];
            
            this.log('=== 텍스트 추출 시도 시작 ===');
            
            for (let i = 0; i < extractionMethods.length; i++) {
                const { name, func } = extractionMethods[i];
                try {
                    this.log(`🔄 시도 중: ${name}`);
                    const methodResult = await func();
                    
                    if (methodResult.success && methodResult.text && methodResult.text.length > 20) {
                        this.log(`✅ 성공: ${name} - 텍스트 길이: ${methodResult.text.length}자`);
                        this.log(`📄 텍스트 미리보기: "${methodResult.text.substring(0, 100)}..."`);
                        this.log('=== 텍스트 추출 완료 ===');
                        return methodResult;
                    } else if (methodResult.text) {
                        this.log(`⚠️ 부분 성공: ${name} - 텍스트가 너무 짧음 (${methodResult.text.length}자)`);
                        this.log(`📄 짧은 텍스트: "${methodResult.text}"`);
                    } else {
                        this.log(`❌ 실패: ${name} - 텍스트 없음`);
                    }
                } catch (error) {
                    this.log(`❌ 오류: ${name} - ${error.message}`);
                }
            }
            
            result.error = 'All text extraction methods failed';
            this.log('❌ 모든 텍스트 추출 방법 실패');
            this.log('=== 텍스트 추출 실패 ===');
            
        } catch (error) {
            result.error = error.message;
            this.log('Text extraction error:', error.message);
        }
        
        return result;
    },
    
    // Method 1: Use Zotero Reader API directly (핵심 방법)
    async extractViaZoteroReader(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('=== Direct Zotero Reader API Access ===');
            this.log('Reader object keys:', Object.keys(reader));
            this.log('Reader prototype:', Object.getPrototypeOf(reader));
            this.log('Reader constructor:', reader.constructor.name);
            
            // 더 깊이 들어가서 메서드 찾기
            const allMethods = [];
            let obj = reader;
            while (obj && obj !== Object.prototype) {
                const methods = Object.getOwnPropertyNames(obj).filter(prop => {
                    try {
                        return typeof obj[prop] === 'function';
                    } catch (e) {
                        return false;
                    }
                });
                allMethods.push(...methods);
                obj = Object.getPrototypeOf(obj);
            }
            this.log('All available methods:', [...new Set(allMethods)]);
            
            // _internalReader 확인
            if (reader._internalReader) {
                this.log('Found _internalReader:', Object.keys(reader._internalReader));
                this.log('_internalReader methods:', Object.getOwnPropertyNames(reader._internalReader).filter(prop => 
                    typeof reader._internalReader[prop] === 'function'
                ));
            }
            
            // wrappedJSObject를 통한 직접 PDF.js 접근
            if (reader._iframeWindow && reader._iframeWindow.wrappedJSObject) {
                try {
                    this.log('=== Accessing PDF.js via wrappedJSObject ===');
                    const wrappedWindow = reader._iframeWindow.wrappedJSObject;
                    
                    // PDF.js PDFViewerApplication 접근
                    if (wrappedWindow.PDFViewerApplication) {
                        const pdfApp = wrappedWindow.PDFViewerApplication;
                        this.log('PDFViewerApplication found');
                        this.log('PDFViewerApplication properties:', Object.keys(pdfApp));
                        
                        // 🔍 Strategy 1: Deep exploration of reader._pdfViewer structure
                        if (pdfApp.pdfViewer) {
                            this.log('=== Deep exploration of pdfViewer ===');
                            this.log('pdfViewer keys:', Object.keys(pdfApp.pdfViewer));
                            this.log('pdfViewer constructor:', pdfApp.pdfViewer.constructor.name);
                            
                            // Check for _pages array
                            if (pdfApp.pdfViewer._pages || pdfApp.pdfViewer.pages) {
                                const pages = pdfApp.pdfViewer._pages || pdfApp.pdfViewer.pages;
                                this.log('Found pages array, length:', pages.length);
                                
                                if (pages.length >= pageNumber) {
                                    const targetPage = pages[pageNumber - 1];
                                    this.log(`Page ${pageNumber - 1} structure:`, Object.keys(targetPage));
                                    
                                    // Check for textLayer
                                    if (targetPage._textLayer || targetPage.textLayer) {
                                        const textLayer = targetPage._textLayer || targetPage.textLayer;
                                        this.log('Found textLayer:', Object.keys(textLayer));
                                        
                                        if (textLayer.textLayerDiv) {
                                            const layerText = textLayer.textLayerDiv.textContent || textLayer.textLayerDiv.innerText;
                                            if (layerText && layerText.trim().length > 20) {
                                                result.success = true;
                                                result.text = layerText.trim();
                                                this.log('✅ SUCCESS via pdfViewer textLayer, length:', layerText.length);
                                                this.log('Text preview:', layerText.substring(0, 200));
                                                return result;
                                            }
                                        }
                                    }
                                    
                                    // Check for pdfPage object
                                    if (targetPage.pdfPage || targetPage._pdfPage) {
                                        const pdfPage = targetPage.pdfPage || targetPage._pdfPage;
                                        this.log('Found pdfPage object:', Object.getOwnPropertyNames(pdfPage).filter(prop => typeof pdfPage[prop] === 'function'));
                                        
                                        try {
                                            if (typeof pdfPage.getTextContent === 'function') {
                                                const textContent = await pdfPage.getTextContent();
                                                if (textContent && textContent.items) {
                                                    const pageText = textContent.items
                                                        .map(item => item.str)
                                                        .join(' ')
                                                        .replace(/\s+/g, ' ')
                                                        .trim();
                                                    
                                                    if (pageText.length > 20) {
                                                        result.success = true;
                                                        result.text = pageText;
                                                        this.log('✅ SUCCESS via pdfPage.getTextContent, length:', pageText.length);
                                                        this.log('Text preview:', pageText.substring(0, 200));
                                                        return result;
                                                    }
                                                }
                                            }
                                        } catch (pdfPageError) {
                                            this.log('pdfPage.getTextContent failed:', pdfPageError.message);
                                        }
                                    }
                                }
                            }
                        }
                        
                        // 🔍 Strategy 2: Check reader._pdfDocument.getPage(n) structure
                        if (pdfApp.pdfDocument) {
                            this.log('=== Deep exploration of pdfDocument.getPage() ===');
                            this.log('pdfDocument pages:', pdfApp.pdfDocument.numPages);
                            
                            try {
                                const page = await pdfApp.pdfDocument.getPage(pageNumber);
                                this.log('Page object type:', page.constructor.name);
                                this.log('Page object keys:', Object.keys(page));
                                this.log('Page methods:', Object.getOwnPropertyNames(page).filter(prop => typeof page[prop] === 'function'));
                                
                                // Try various text extraction methods
                                const textMethods = [
                                    'getTextContent',
                                    'getTextContentStream', 
                                    'getText',
                                    'extractText',
                                    'getOperatorList',
                                    'render'
                                ];
                                
                                for (const methodName of textMethods) {
                                    if (typeof page[methodName] === 'function') {
                                        this.log(`Found method: ${methodName}`);
                                        try {
                                            const textData = await page[methodName]();
                                            this.log(`${methodName} result type:`, typeof textData, textData.constructor?.name);
                                            
                                            // Handle different result types
                                            if (textData && textData.items && Array.isArray(textData.items)) {
                                                const pageText = textData.items
                                                    .map(item => item.str || item.text || String(item))
                                                    .filter(str => str && str.trim().length > 0)
                                                    .join(' ')
                                                    .replace(/\s+/g, ' ')
                                                    .trim();
                                                
                                                if (pageText && pageText.length > 20) {
                                                    result.success = true;
                                                    result.text = pageText;
                                                    this.log(`✅ SUCCESS via ${methodName}, length:`, pageText.length);
                                                    this.log('Text preview:', pageText.substring(0, 200));
                                                    return result;
                                                }
                                            } else if (typeof textData === 'string' && textData.trim().length > 20) {
                                                result.success = true;
                                                result.text = textData.trim();
                                                this.log(`✅ SUCCESS via ${methodName} (string), length:`, textData.length);
                                                this.log('Text preview:', textData.substring(0, 200));
                                                return result;
                                            }
                                        } catch (methodError) {
                                            this.log(`${methodName} failed:`, methodError.message);
                                        }
                                    }
                                }
                            } catch (getPageError) {
                                this.log('getPage() failed:', getPageError.message);
                            }
                        }
                        
                        // 🔍 Strategy 3: DOM-based textLayer extraction (강제 추출)
                        this.log('=== DOM-based textLayer extraction ===');
                        const targetDoc = wrappedWindow.document;
                        if (targetDoc) {
                            // Try various textLayer selectors
                            const textLayerSelectors = [
                                '.textLayer',
                                `[data-page-number="${pageNumber}"] .textLayer`,
                                `.page[data-page-number="${pageNumber}"] .textLayer`,
                                `#pageContainer${pageNumber} .textLayer`,
                                '.textContent',
                                '.page .textLayer'
                            ];
                            
                            for (const selector of textLayerSelectors) {
                                const textLayers = targetDoc.querySelectorAll(selector);
                                this.log(`Selector "${selector}" found ${textLayers.length} elements`);
                                
                                for (const layer of textLayers) {
                                    const layerText = layer.textContent || layer.innerText;
                                    if (layerText && layerText.trim().length > 20) {
                                        result.success = true;
                                        result.text = layerText.trim();
                                        this.log(`✅ SUCCESS via DOM selector "${selector}", length:`, layerText.length);
                                        this.log('Text preview:', layerText.substring(0, 200));
                                        return result;
                                    }
                                }
                            }
                        }
                    }
                } catch (wrappedError) {
                    this.log('wrappedJSObject access failed:', wrappedError.message);
                }
            }
            
            // 직접적인 방법 1: _internalReader 를 통한 접근
            if (reader._internalReader) {
                try {
                    const internalReader = reader._internalReader;
                    this.log('Trying _internalReader methods...');
                    
                    // _internalReader의 메서드들 시도
                    const internalMethods = ['getPageText', 'getText', 'getTextContent', 'extractText'];
                    for (const methodName of internalMethods) {
                        if (typeof internalReader[methodName] === 'function') {
                            try {
                                this.log(`Calling _internalReader.${methodName}(${pageNumber - 1})`);
                                const pageText = await internalReader[methodName](pageNumber - 1);
                                this.log(`${methodName} result:`, pageText ? `${pageText.length} chars` : 'null/empty');
                                
                                if (pageText && pageText.trim().length > 10) {
                                    result.success = true;
                                    result.text = pageText.trim();
                                    this.log(`✅ SUCCESS via _internalReader.${methodName}()`);
                                    return result;
                                }
                            } catch (error) {
                                this.log(`_internalReader.${methodName}() failed:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    this.log('_internalReader access failed:', error.message);
                }
            }
            
            // 직접적인 방법 1b: reader.getPageText() 호출
            if (typeof reader.getPageText === 'function') {
                try {
                    this.log(`Calling reader.getPageText(${pageNumber - 1}) [0-based indexing]`);
                    const pageText = await reader.getPageText(pageNumber - 1);
                    this.log('getPageText result:', pageText ? `${pageText.length} chars` : 'null/empty');
                    
                    if (pageText && pageText.trim().length > 10) {
                        result.success = true;
                        result.text = pageText.trim();
                        this.log('✅ SUCCESS via reader.getPageText()');
                        return result;
                    }
                } catch (error) {
                    this.log('❌ reader.getPageText() failed:', error.message);
                }
            }
            
            // 직접적인 방법 2: getCurrentPageNumber(), getPageCount() 확인 후 재시도
            if (typeof reader.getCurrentPageNumber === 'function') {
                try {
                    const currentPage = await reader.getCurrentPageNumber();
                    const pageCount = typeof reader.getPageCount === 'function' ? await reader.getPageCount() : 'unknown';
                    this.log(`Current page: ${currentPage}, Total pages: ${pageCount}`);
                    
                    // 현재 페이지로 다시 시도
                    if (typeof reader.getPageText === 'function') {
                        const currentPageText = await reader.getPageText(currentPage);
                        if (currentPageText && currentPageText.trim().length > 10) {
                            result.success = true;
                            result.text = currentPageText.trim();
                            this.log('✅ SUCCESS via current page getPageText()');
                            return result;
                        }
                    }
                } catch (error) {
                    this.log('Current page method failed:', error.message);
                }
            }
            
            // 직접적인 방법 3: reader의 실제 텍스트 추출 메서드들 (정확한 API)
            const directMethods = [
                'getPageText',  // 가장 가능성 높은 메서드
                'getText',
                'getTextContent', 
                'extractPageText',
                'getPageContent',
                '_getPageText',
                'getDocumentText',
                'getCurrentPageText',
                'extractText'
            ];
            
            for (const methodName of directMethods) {
                if (typeof reader[methodName] === 'function') {
                    try {
                        this.log(`Trying direct method: ${methodName}`);
                        let text = await reader[methodName](pageNumber - 1);
                        if (text && text.trim().length > 10) {
                            result.success = true;
                            result.text = text.trim();
                            this.log(`✅ SUCCESS via reader.${methodName}()`);
                            return result;
                        }
                    } catch (error) {
                        this.log(`Method ${methodName} failed:`, error.message);
                    }
                }
            }
            
            // 직접적인 방법 4: reader.item 을 통한 정확한 Zotero Fulltext 접근
            if (reader.item || reader._item) {
                const item = reader.item || reader._item;
                this.log('Trying via reader.item:', item.id);
                
                try {
                    // Zotero.Fulltext의 정확한 사용법 확인
                    if (typeof Zotero !== 'undefined' && Zotero.Fulltext) {
                        this.log('Zotero.Fulltext available, trying different methods...');
                        
                        // Method 1: 올바른 Zotero 7 Fulltext API 사용
                        try {
                            this.log('=== Zotero 7 Fulltext API 접근 ===');
                            
                            // Step 0: Zotero.Fulltext._fulltextCache.get() - 가장 확실한 방법!
                            try {
                                if (typeof Zotero.Fulltext._fulltextCache !== 'undefined' && 
                                    typeof Zotero.Fulltext._fulltextCache.get === 'function') {
                                    
                                    this.log('Trying Zotero.Fulltext._fulltextCache.get()...');
                                    const textObj = await Zotero.Fulltext._fulltextCache.get(item.id);
                                    this.log('Fulltext cache result:', textObj ? 'Found' : 'Not found');
                                    
                                    if (textObj && textObj.content) {
                                        this.log('Cache content length:', textObj.content.length);
                                        const cacheContent = textObj.content.trim();
                                        
                                        if (cacheContent.length > 100 && this.isValidText(cacheContent)) {
                                            result.success = true;
                                            result.text = cacheContent.substring(0, 5000);
                                            this.log('✅ SUCCESS via Zotero.Fulltext._fulltextCache.get()');
                                            this.log('Cache text preview:', cacheContent.substring(0, 200));
                                            return result;
                                        } else {
                                            this.log('❌ Cache text failed validation');
                                        }
                                    }
                                } else {
                                    this.log('_fulltextCache.get not available');
                                }
                            } catch (cacheMethodError) {
                                this.log('_fulltextCache.get failed:', cacheMethodError.message);
                            }
                            
                            // Step 1: 캐시된 fulltext 직접 접근 (파일 시스템)
                            try {
                                const filePath = await item.getFilePathAsync();
                                if (filePath) {
                                    // .zotero-ft-cache 파일 경로 생성
                                    const cacheFilePath = filePath.replace(/\.[^.]+$/, '') + '.zotero-ft-cache';
                                    this.log('Checking cache file:', cacheFilePath);
                                    
                                    if (typeof IOUtils !== 'undefined') {
                                        try {
                                            const exists = await IOUtils.exists(cacheFilePath);
                                            if (exists) {
                                                const cacheData = await IOUtils.readUTF8(cacheFilePath);
                                                this.log('Cache file content length:', cacheData.length);
                                                
                                                if (cacheData && cacheData.trim().length > 100 && this.isValidText(cacheData)) {
                                                    result.success = true;
                                                    result.text = cacheData.trim().substring(0, 5000);
                                                    this.log('✅ SUCCESS via Zotero cache file');
                                                    this.log('Cache text preview:', cacheData.substring(0, 200));
                                                    return result;
                                                }
                                            }
                                        } catch (cacheError) {
                                            this.log('Cache file access failed:', cacheError.message);
                                        }
                                    }
                                }
                            } catch (cacheAccessError) {
                                this.log('Cache access method failed:', cacheAccessError.message);
                            }
                            
                            // Step 2: Zotero 내부 fulltext 데이터베이스 접근
                            try {
                                if (typeof Zotero.DB !== 'undefined') {
                                    const sql = "SELECT content FROM fulltextContent WHERE itemID = ?";
                                    const content = await Zotero.DB.valueQueryAsync(sql, [item.id]);
                                    this.log('DB fulltext content length:', content ? content.length : 0);
                                    
                                    if (content && content.trim().length > 100 && this.isValidText(content)) {
                                        result.success = true;
                                        result.text = content.trim().substring(0, 5000);
                                        this.log('✅ SUCCESS via Zotero DB fulltext');
                                        this.log('DB text preview:', content.substring(0, 200));
                                        return result;
                                    }
                                }
                            } catch (dbError) {
                                this.log('DB fulltext access failed:', dbError.message);
                            }
                            
                            // Step 3: Zotero.Fulltext API 올바른 사용법 탐색
                            if (typeof Zotero.Fulltext !== 'undefined') {
                                this.log('Exploring Zotero.Fulltext methods:', Object.getOwnPropertyNames(Zotero.Fulltext).filter(prop => typeof Zotero.Fulltext[prop] === 'function'));
                                
                                // 실제 존재하는 메서드들 시도
                                const realMethods = [
                                    () => Zotero.Fulltext.getTextFromCache(item.libraryID, item.id),
                                    () => Zotero.Fulltext.getItemContent(item.libraryID, item.id),
                                    () => Zotero.Fulltext.getContent(item.id),
                                    () => Zotero.Fulltext.retrieveContent(item),
                                    () => Zotero.Fulltext.getPageText(item.id, 0),
                                    () => Zotero.Fulltext.findTextInItems([item.id], '').then(results => results[0])
                                ];
                                
                                for (let i = 0; i < realMethods.length; i++) {
                                    try {
                                        this.log(`Trying fulltext method ${i + 1}...`);
                                        const fulltext = await realMethods[i]();
                                        this.log(`Method ${i + 1} result:`, typeof fulltext, fulltext ? fulltext.length || 'object' : 'null');
                                        
                                        let textContent = null;
                                        if (fulltext && typeof fulltext === 'object' && fulltext.content) {
                                            textContent = fulltext.content;
                                        } else if (fulltext && typeof fulltext === 'string') {
                                            textContent = fulltext;
                                        } else if (fulltext && fulltext.text) {
                                            textContent = fulltext.text;
                                        }
                                        
                                        if (textContent && textContent.trim().length > 100 && this.isValidText(textContent)) {
                                            result.success = true;
                                            result.text = textContent.trim().substring(0, 5000);
                                            this.log(`✅ SUCCESS via Zotero.Fulltext method ${i + 1}`);
                                            this.log('Fulltext preview:', textContent.substring(0, 200));
                                            return result;
                                        }
                                    } catch (methodError) {
                                        this.log(`Fulltext method ${i + 1} failed:`, methodError.message);
                                    }
                                }
                            }
                            
                        } catch (error) {
                            this.log('Fulltext API exploration failed:', error.message);
                        }
                        
                        // Method 2: getPages (alternative API)
                        try {
                            const pages = await Zotero.Fulltext.getPages(item.libraryID, item.id);
                            this.log('getPages result:', pages);
                            if (pages && pages.length > 0) {
                                const firstPageContent = pages[0];
                                if (firstPageContent && firstPageContent.trim().length > 50) {
                                    result.success = true;
                                    result.text = firstPageContent.trim().substring(0, 5000);
                                    this.log('✅ SUCCESS via Zotero.Fulltext.getPages');
                                    return result;
                                }
                            }
                        } catch (error) {
                            this.log('getPages failed:', error.message);
                        }
                        
                        // Method 3: Direct item getField if fulltext is stored
                        try {
                            const itemFulltext = item.getField('fulltext');
                            if (itemFulltext && itemFulltext.trim().length > 50) {
                                result.success = true;
                                result.text = itemFulltext.trim().substring(0, 5000);
                                this.log('✅ SUCCESS via item.getField("fulltext")');
                                return result;
                            }
                        } catch (error) {
                            this.log('item.getField("fulltext") failed:', error.message);
                        }
                    }
                } catch (error) {
                    this.log('Reader.item fulltext failed:', error.message);
                }
            }
            
            result.error = `All direct reader methods failed. Available methods: ${Object.getOwnPropertyNames(reader).filter(prop => typeof reader[prop] === 'function').join(', ')}`;
            
        } catch (error) {
            result.error = `Zotero Reader method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 2: Direct PDF.js access
    async extractViaPDFJS(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            // Try multiple window/iframe approaches
            const windows = [
                reader._iframeWindow,
                reader._window,
                reader.iframe?.contentWindow,
                reader.window
            ].filter(w => w);
            
            this.log('Checking', windows.length, 'windows for PDF.js access');
            
            for (const targetWindow of windows) {
                try {
                    // Check for PDF.js in various locations
                    const pdfApps = [
                        targetWindow.PDFViewerApplication,
                        targetWindow.window?.PDFViewerApplication,
                        targetWindow.parent?.PDFViewerApplication
                    ].filter(app => app);
                    
                    for (const pdfApp of pdfApps) {
                        if (pdfApp && pdfApp.pdfDocument) {
                            const pdfDoc = pdfApp.pdfDocument;
                            this.log('Found PDF.js document with', pdfDoc.numPages, 'pages');
                            
                            if (pageNumber <= pdfDoc.numPages) {
                                const page = await pdfDoc.getPage(pageNumber);
                                const textContent = await page.getTextContent();
                                
                                // Better text combination with layout consideration
                                let pageText = '';
                                let currentY = null;
                                const lines = [];
                                let currentLine = [];
                                
                                for (const item of textContent.items) {
                                    const itemY = item.transform[5]; // Y coordinate
                                    
                                    // New line detection
                                    if (currentY !== null && Math.abs(currentY - itemY) > 5) {
                                        if (currentLine.length > 0) {
                                            lines.push(currentLine.join(' '));
                                            currentLine = [];
                                        }
                                    }
                                    
                                    currentLine.push(item.str.trim());
                                    currentY = itemY;
                                }
                                
                                if (currentLine.length > 0) {
                                    lines.push(currentLine.join(' '));
                                }
                                
                                pageText = lines
                                    .filter(line => line.trim().length > 0)
                                    .join('\n')
                                    .replace(/\s+/g, ' ')
                                    .trim();
                                
                                if (pageText && pageText.length > 20) {
                                    result.success = true;
                                    result.text = pageText;
                                    this.log('PDF.js extraction successful, text length:', pageText.length);
                                    return result;
                                } else {
                                    this.log('PDF.js returned insufficient text:', pageText.length);
                                }
                            } else {
                                this.log(`Page ${pageNumber} exceeds document pages (${pdfDoc.numPages})`);
                            }
                        }
                    }
                } catch (winError) {
                    this.log('Window PDF.js access failed:', winError.message);
                }
            }
            
            result.error = 'PDF.js not accessible in any window';
            
        } catch (error) {
            result.error = `PDF.js method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 3: Text layer DOM extraction
    async extractViaTextLayer(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            const targetDoc = reader._iframeWindow?.document || reader._window?.document;
            
            if (targetDoc) {
                // Wait a bit for text layer to render
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Try various selectors for text layers
                const selectors = [
                    `.textLayer`,
                    `.page[data-page-number="${pageNumber}"] .textLayer`,
                    `[data-page-number="${pageNumber}"] .textLayer`,
                    `.page:nth-child(${pageNumber}) .textLayer`,
                    `.textContent`,
                    `#pageContainer${pageNumber} .textLayer`
                ];
                
                for (const selector of selectors) {
                    const textLayers = targetDoc.querySelectorAll(selector);
                    this.log(`Checking selector ${selector}, found ${textLayers.length} elements`);
                    
                    for (const layer of textLayers) {
                        const layerText = (layer.textContent || layer.innerText || '').trim();
                        if (layerText && layerText.length > 20) {
                            result.success = true;
                            result.text = layerText;
                            this.log('Text layer extraction successful via:', selector);
                            return result;
                        }
                    }
                }
                
                result.error = 'No text found in text layers';
            } else {
                result.error = 'Document not accessible';
            }
        } catch (error) {
            result.error = `Text layer method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 4: Document selection approach
    async extractViaDocumentSelection(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            const targetWindow = reader._iframeWindow || reader._window;
            const targetDoc = targetWindow?.document;
            
            if (targetWindow && targetDoc) {
                // Try to select all text and copy it
                if (targetWindow.getSelection && targetDoc.body) {
                    const selection = targetWindow.getSelection();
                    const range = targetDoc.createRange();
                    
                    // Select all body content
                    range.selectNodeContents(targetDoc.body);
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    const selectedText = selection.toString().trim();
                    selection.removeAllRanges();
                    
                    if (selectedText && selectedText.length > 20) {
                        result.success = true;
                        result.text = selectedText;
                        this.log('Document selection extraction successful');
                    } else {
                        result.error = 'No text found via selection';
                    }
                } else {
                    result.error = 'Selection API not available';
                }
            } else {
                result.error = 'Window/document not accessible';
            }
        } catch (error) {
            result.error = `Document selection method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 5: Zotero internal API approach
    async extractViaZoteroAPI(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('[Zotero API] 시작: Zotero Fulltext API 사용');
            
            // Try to access the PDF via Zotero's internal systems
            if (typeof Zotero !== 'undefined' && Zotero.Fulltext) {
                this.log('[Zotero API] Zotero.Fulltext 사용 가능');
                const item = await Zotero.Items.getAsync(reader.itemID);
                if (item && item.isAttachment()) {
                    this.log(`[Zotero API] PDF 아이템 확인됨: ID ${item.id}`);
                    
                    // Try multiple fulltext methods
                    const methods = [
                        { name: 'getItemContent', func: () => Zotero.Fulltext.getItemContent(item.libraryID, item.id) },
                        { name: 'getPages', func: () => Zotero.Fulltext.getPages(item.libraryID, item.id) },
                        { name: 'getIndexStats', func: () => Zotero.Fulltext.getIndexStats(item.id) },
                        { name: 'findTextInItems', func: () => Zotero.Fulltext.findTextInItems([item.id], '') }
                    ];
                    
                    for (const { name, func } of methods) {
                        try {
                            this.log(`[Zotero API] 시도: ${name}`);
                            const fulltext = await func();
                            this.log(`[Zotero API] ${name} 결과:`, fulltext ? 'Found' : 'Empty', typeof fulltext);
                            
                            if (fulltext && fulltext.content && fulltext.content.trim().length > 50) {
                                const content = fulltext.content.trim();
                                result.success = true;
                                result.text = content.substring(0, 5000); // Reasonable limit
                                this.log(`[Zotero API] ✅ ${name} 성공: ${content.length}자`);
                                return result;
                            } else if (fulltext && typeof fulltext === 'string' && fulltext.trim().length > 50) {
                                result.success = true;
                                result.text = fulltext.trim().substring(0, 5000);
                                this.log(`[Zotero API] ✅ ${name} 문자열 성공: ${fulltext.length}자`);
                                return result;
                            } else {
                                this.log(`[Zotero API] ❌ ${name} 실패: 텍스트 부족`);
                            }
                        } catch (methodError) {
                            this.log(`[Zotero API] ❌ ${name} 오류: ${methodError.message}`);
                        }
                    }
                    
                    // Try to trigger fulltext indexing if not available
                    try {
                        this.log('[Zotero API] 인덱싱 시도 중...');
                        await Zotero.Fulltext.indexItems([item.id]);
                        
                        // Wait a bit and try again
                        this.log('[Zotero API] 인덱싱 후 2초 대기...');
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        this.log('[Zotero API] 인덱싱 후 재시도...');
                        
                        // Try different methods since getItemContent doesn't exist
                        const retryMethods = [
                            { name: 'DB-query', func: async () => {
                                const sql = "SELECT content FROM fulltextContent WHERE itemID = ?";
                                const content = await Zotero.DB.valueQueryAsync(sql, [item.id]);
                                return content ? { content: content } : null;
                            }},
                            { name: 'getPages-retry', func: () => Zotero.Fulltext.getPages(item.libraryID, item.id) },
                            { name: 'findTextInItems-retry', func: () => Zotero.Fulltext.findTextInItems([item.id], '') }
                        ];
                        
                        for (const { name, func } of retryMethods) {
                            try {
                                this.log(`[Zotero API] 재시도: ${name}`);
                                const retryResult = await func();
                                this.log(`[Zotero API] ${name} 결과:`, retryResult ? 'Found' : 'Empty', typeof retryResult);
                                
                                if (retryResult && retryResult.content && retryResult.content.trim().length > 50) {
                                    result.success = true;
                                    result.text = retryResult.content.trim().substring(0, 5000);
                                    this.log(`[Zotero API] ✅ ${name} 인덱싱 후 성공: ${retryResult.content.length}자`);
                                    return result;
                                } else if (retryResult && typeof retryResult === 'string' && retryResult.trim().length > 50) {
                                    result.success = true;
                                    result.text = retryResult.trim().substring(0, 5000);
                                    this.log(`[Zotero API] ✅ ${name} 인덱싱 후 문자열 성공: ${retryResult.length}자`);
                                    return result;
                                }
                            } catch (retryError) {
                                this.log(`[Zotero API] ❌ ${name} 재시도 오류: ${retryError.message}`);
                            }
                        }
                        
                    } catch (indexError) {
                        this.log('[Zotero API] ❌ 인덱싱 실패:', indexError.message);
                    }
                }
            }
            
            if (!result.success) {
                result.error = 'Zotero API method not available or returned no content';
            }
        } catch (error) {
            result.error = `Zotero API method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 6: File system access approach with basic PDF parsing
    async extractViaFileSystemAccess(reader, pageNumber) {
        const result = { success: false, text: '', error: null };
        
        try {
            this.log('=== File System Access Method ===');
            
            const item = await Zotero.Items.getAsync(reader.itemID);
            if (item && item.isAttachment()) {
                const filePath = await item.getFilePathAsync();
                this.log('PDF file path:', filePath);
                
                if (filePath) {
                    // Check different file access APIs
                    const fileApis = [];
                    
                    if (typeof OS !== 'undefined' && OS.File) {
                        fileApis.push({ name: 'OS.File', api: OS.File });
                    }
                    
                    if (typeof IOUtils !== 'undefined') {
                        fileApis.push({ name: 'IOUtils', api: IOUtils });
                    }
                    
                    if (typeof Components !== 'undefined' && Components.classes) {
                        fileApis.push({ name: 'nsIFile', api: 'nsIFile' });
                    }
                    
                    this.log('Available file APIs:', fileApis.map(api => api.name));
                    
                    for (const fileApi of fileApis) {
                        try {
                            if (fileApi.name === 'OS.File') {
                                const exists = await OS.File.exists(filePath);
                                if (exists) {
                                    this.log('PDF file exists via OS.File');
                                    
                                    // Try to read the file as binary
                                    const fileData = await OS.File.read(filePath);
                                    this.log('File data read, size:', fileData.byteLength);
                                    
                                    // Try basic PDF text extraction (매우 간단한 방법)
                                    const textContent = this.extractTextFromPDFBuffer(fileData);
                                    if (textContent && textContent.length > 50 && this.isValidText(textContent)) {
                                        result.success = true;
                                        result.text = textContent.substring(0, 5000);
                                        this.log('✅ SUCCESS via OS.File + basic PDF parsing');
                                        return result;
                                    } else if (textContent && textContent.length > 50) {
                                        this.log('❌ OS.File text failed validation');
                                    }
                                }
                            } else if (fileApi.name === 'IOUtils') {
                                const fileData = await IOUtils.read(filePath);
                                this.log('File data read via IOUtils, size:', fileData.byteLength);
                                
                                const textContent = this.extractTextFromPDFBuffer(fileData);
                                if (textContent && textContent.length > 50 && this.isValidText(textContent)) {
                                    result.success = true;
                                    result.text = textContent.substring(0, 5000);
                                    this.log('✅ SUCCESS via IOUtils + basic PDF parsing');
                                    return result;
                                } else if (textContent && textContent.length > 50) {
                                    this.log('❌ IOUtils text failed validation');
                                }
                            }
                        } catch (apiError) {
                            this.log(`${fileApi.name} failed:`, apiError.message);
                        }
                    }
                    
                    result.error = 'File accessible but PDF text extraction failed';
                } else {
                    result.error = 'File path not available';
                }
            }
            
        } catch (error) {
            result.error = `File system method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // 텍스트 유효성 검증 (바이너리 쓰레기 필터링)
    isValidText(text) {
        if (!text || typeof text !== 'string' || text.trim().length < 20) {
            return false;
        }
        
        const cleanText = text.trim();
        
        // 1. ASCII 제어 문자 비율 확인 (5% 이상이면 바이너리일 가능성)
        const controlCharCount = (cleanText.match(/[\x00-\x1F\x7F-\x9F]/g) || []).length;
        const controlCharRatio = controlCharCount / cleanText.length;
        if (controlCharRatio > 0.05) {
            this.log('Text rejected: too many control characters', controlCharRatio);
            return false;
        }
        
        // 2. 읽을 수 있는 단어 비율 확인
        const words = cleanText.split(/\s+/);
        const readableWords = words.filter(word => {
            // 알파벳이나 숫자가 포함된 2자 이상의 단어
            return word.length >= 2 && /[a-zA-Z0-9]/.test(word);
        });
        const readableRatio = readableWords.length / words.length;
        if (readableRatio < 0.3) {
            this.log('Text rejected: too few readable words', readableRatio);
            return false;
        }
        
        // 3. 연속된 의미 없는 문자 패턴 확인
        const gibberishPatterns = [
            /[^\w\s]{10,}/g,  // 10개 이상 연속된 특수문자
            /\b[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{8,}\b/g,  // 8개 이상 연속된 자음
            /\b\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}\s+\w{1,2}/g  // 너무 많은 1-2자 단어
        ];
        
        let gibberishCount = 0;
        for (const pattern of gibberishPatterns) {
            const matches = cleanText.match(pattern);
            if (matches) {
                gibberishCount += matches.join('').length;
            }
        }
        
        const gibberishRatio = gibberishCount / cleanText.length;
        if (gibberishRatio > 0.2) {
            this.log('Text rejected: too much gibberish', gibberishRatio);
            return false;
        }
        
        // 4. 학술 논문 특성 확인 (보너스 점수)
        const academicIndicators = [
            /\babstract\b/i,
            /\bintroduction\b/i,
            /\bconclusion\b/i,
            /\breferences?\b/i,
            /\buniversity\b/i,
            /\bjournal\b/i,
            /\bdoi\b/i,
            /\b(19|20)\d{2}\b/,  // 연도
            /\b[A-Z][a-z]+,?\s+[A-Z]\.?\s*[A-Z]?[a-z]*\b/  // 저자명 패턴
        ];
        
        let academicScore = 0;
        for (const indicator of academicIndicators) {
            if (cleanText.match(indicator)) {
                academicScore++;
            }
        }
        
        // 5. 최종 판정
        const isValid = readableRatio >= 0.5 || academicScore >= 2;
        this.log(`Text validation: readable=${readableRatio.toFixed(2)}, control=${controlCharRatio.toFixed(2)}, gibberish=${gibberishRatio.toFixed(2)}, academic=${academicScore}, valid=${isValid}`);
        
        return isValid;
    },
    
    // 매우 기본적인 PDF 텍스트 추출 (PDF 구조의 텍스트 스트림 검색)
    extractTextFromPDFBuffer(buffer) {
        try {
            // ArrayBuffer를 String으로 변환
            const uint8Array = new Uint8Array(buffer);
            let pdfString = '';
            
            // UTF-8 디코딩 시도
            try {
                const decoder = new TextDecoder('utf-8', { fatal: false });
                pdfString = decoder.decode(uint8Array);
            } catch (decodeError) {
                // 바이너리를 직접 문자열로 변환 (fallback)
                for (let i = 0; i < Math.min(uint8Array.length, 100000); i++) { // 처음 100KB만
                    if (uint8Array[i] > 31 && uint8Array[i] < 127) { // ASCII 범위
                        pdfString += String.fromCharCode(uint8Array[i]);
                    } else {
                        pdfString += ' ';
                    }
                }
            }
            
            this.log('PDF string sample:', pdfString.substring(0, 200));
            
            // PDF 텍스트 스트림 찾기 (매우 기본적인 방법)
            const streamRegex = /stream\s*\n([\s\S]*?)\s*endstream/g;
            const textRegex = /\((.*?)\)/g;
            const tjRegex = /\[(.*?)\]/g;
            
            let extractedText = '';
            let match;
            
            // stream...endstream 블록에서 텍스트 찾기
            while ((match = streamRegex.exec(pdfString)) !== null) {
                const streamContent = match[1];
                
                // 괄호 안의 텍스트 찾기 (Tj 연산자)
                let textMatch;
                while ((textMatch = textRegex.exec(streamContent)) !== null) {
                    const text = textMatch[1];
                    if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
                        extractedText += text + ' ';
                    }
                }
                
                // 배열 형태 텍스트 찾기 (TJ 연산자)
                while ((textMatch = tjRegex.exec(streamContent)) !== null) {
                    const arrayContent = textMatch[1];
                    const stringParts = arrayContent.match(/\((.*?)\)/g);
                    if (stringParts) {
                        for (const part of stringParts) {
                            const text = part.replace(/[()]/g, '');
                            if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
                                extractedText += text + ' ';
                            }
                        }
                    }
                }
            }
            
            // 직접 텍스트 패턴 찾기 (stream 밖에서도)
            const directTextMatches = pdfString.match(/\b[A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*\b/g);
            if (directTextMatches) {
                for (const text of directTextMatches.slice(0, 100)) { // 처음 100개만
                    if (text.length > 3 && /^[A-Za-z\s]+$/.test(text)) {
                        extractedText += text + ' ';
                    }
                }
            }
            
            // 텍스트 정리
            extractedText = extractedText
                .replace(/\s+/g, ' ')
                .trim()
                .substring(0, 3000); // 처음 3000자만
            
            this.log('Extracted text sample:', extractedText.substring(0, 200));
            return extractedText;
            
        } catch (error) {
            this.log('PDF buffer text extraction failed:', error.message);
            return '';
        }
    },
    
    // Extract image from specific page using multiple approaches
    async extractImageFromPage(reader, pageNumber) {
        const result = {
            success: false,
            imageDataUrl: null,
            width: 0,
            height: 0,
            error: null
        };
        
        try {
            this.log('Attempting image extraction from page:', pageNumber);
            
            // 🎯 이미지 추출 방법들 (우선순위 순 - 강제 렌더링 최우선)
            const imageMethods = [
                () => this.extractImageViaPDFJS(reader, pageNumber), // 🥇 PDF.js 강제 렌더링 (HIGHEST)
                () => this.extractImageViaExistingCanvas(reader, pageNumber), // 기존 렌더링된 캔버스 찾기
                () => this.extractImageViaZoteroReader(reader, pageNumber), // Zotero API 직접 접근
                () => this.extractImageViaScreenshot(reader, pageNumber) // DOM 스크린샷 (최후 대안)
            ];
            
            this.log('🔄 Starting image extraction with', imageMethods.length, 'methods...');
            
            for (let i = 0; i < imageMethods.length; i++) {
                const method = imageMethods[i];
                const methodName = ['PDF.js forced rendering', 'Existing canvas', 'Zotero Reader API', 'DOM screenshot'][i];
                
                this.log(`🔍 Trying method ${i + 1}/4: ${methodName}`);
                
                try {
                    const methodResult = await method();
                    if (methodResult.success && methodResult.imageDataUrl) {
                        this.log(`✅ Image extraction SUCCESS via ${methodName}, size: ${methodResult.width}x${methodResult.height}`);
                        return methodResult;
                    } else {
                        this.log(`⚠️ Method ${i + 1} (${methodName}) failed: ${methodResult.error || 'Unknown reason'}`);
                    }
                } catch (error) {
                    this.log(`❌ Method ${i + 1} (${methodName}) threw error:`, error.message);
                }
            }
            
            result.error = 'All image extraction methods failed';
            this.log('Image extraction failed: all methods exhausted');
            
        } catch (error) {
            result.error = error.message;
            this.log('Image extraction error:', error.message);
        }
        
        return result;
    },
    
    // Method 0: Direct Zotero Reader image extraction (개선된 핵심 방법)
    async extractImageViaZoteroReader(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('=== Direct Zotero Reader Image Access ===');
            
            // Step 1: _internalReader를 통한 이미지 접근
            if (reader._internalReader) {
                try {
                    const internalReader = reader._internalReader;
                    this.log('Checking _internalReader for image methods...');
                    
                    const imageMethods = ['getPageImage', 'getSnapshot', 'captureSnapshot', 'renderPage'];
                    for (const methodName of imageMethods) {
                        if (typeof internalReader[methodName] === 'function') {
                            try {
                                this.log(`Trying _internalReader.${methodName}(${pageNumber - 1})`);
                                const imageData = await internalReader[methodName](pageNumber - 1);
                                
                                if (imageData && this.processImageData(imageData, result, `_internalReader.${methodName}`)) {
                                    return result;
                                }
                            } catch (error) {
                                this.log(`_internalReader.${methodName} failed:`, error.message);
                            }
                        }
                    }
                } catch (error) {
                    this.log('_internalReader image access failed:', error.message);
                }
            }
            
            // Step 2: Direct reader methods
            this.log('Available reader methods:', Object.getOwnPropertyNames(reader).filter(prop => 
                typeof reader[prop] === 'function' && 
                (prop.toLowerCase().includes('image') || prop.toLowerCase().includes('snapshot') || 
                 prop.toLowerCase().includes('canvas') || prop.toLowerCase().includes('capture') ||
                 prop.toLowerCase().includes('render'))
            ));
            
            const directMethods = [
                'getPageImage',
                'getSnapshot', 
                'captureSnapshot',
                'getPageSnapshot',
                'renderPage',
                'capturePage',
                'getPageCanvas',
                'getCanvas',
                'screenshot',
                'capture'
            ];
            
            for (const methodName of directMethods) {
                if (typeof reader[methodName] === 'function') {
                    try {
                        this.log(`Trying reader.${methodName}(${pageNumber - 1})`);
                        const imageData = await reader[methodName](pageNumber - 1);
                        
                        if (imageData && this.processImageData(imageData, result, `reader.${methodName}`)) {
                            return result;
                        }
                    } catch (error) {
                        this.log(`reader.${methodName} failed:`, error.message);
                    }
                }
            }
            
            result.error = 'No working image methods found in reader';
            
        } catch (error) {
            result.error = `Zotero Reader image method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // 이미지 데이터 처리 헬퍼 함수
    processImageData(imageData, result, methodName) {
        try {
            if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
                // Data URL
                result.imageDataUrl = imageData;
                result.success = true;
                this.log(`✅ SUCCESS via ${methodName} - data URL`);
                return true;
                
            } else if (imageData instanceof Blob) {
                // Blob을 data URL로 변환
                this.blobToDataURL(imageData).then(dataUrl => {
                    result.imageDataUrl = dataUrl;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - Blob`);
                });
                return true;
                
            } else if (imageData instanceof HTMLCanvasElement) {
                // Canvas
                result.imageDataUrl = imageData.toDataURL('image/png', 0.9);
                result.width = imageData.width;
                result.height = imageData.height;
                result.success = true;
                this.log(`✅ SUCCESS via ${methodName} - Canvas ${imageData.width}x${imageData.height}`);
                return true;
                
            } else if (imageData && typeof imageData === 'object') {
                // 다른 객체 타입들 확인
                this.log(`${methodName} returned object:`, Object.keys(imageData));
                
                if (imageData.canvas) {
                    result.imageDataUrl = imageData.canvas.toDataURL('image/png', 0.9);
                    result.width = imageData.canvas.width;
                    result.height = imageData.canvas.height;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - object.canvas`);
                    return true;
                }
                
                if (imageData.dataURL) {
                    result.imageDataUrl = imageData.dataURL;
                    result.success = true;
                    this.log(`✅ SUCCESS via ${methodName} - object.dataURL`);
                    return true;
                }
            }
            
            this.log(`${methodName} returned unusable data:`, typeof imageData);
            return false;
            
        } catch (error) {
            this.log(`Error processing image data from ${methodName}:`, error.message);
            return false;
        }
    },
    
    // Blob을 Data URL로 변환하는 헬퍼 함수
    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    },
    
    // 🔍 Canvas 내용 검증 함수 - 실제 렌더링된 내용이 있는지 확인
    validateCanvasContent(canvas) {
        try {
            if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
                this.log('❌ Canvas validation failed: Invalid dimensions');
                return false;
            }
            
            // Canvas에서 픽셀 데이터 샘플링
            const context = canvas.getContext('2d');
            const sampleSize = Math.min(canvas.width, canvas.height, 100); // 최대 100픽셀 샘플
            const imageData = context.getImageData(0, 0, sampleSize, sampleSize);
            const pixels = imageData.data;
            
            let colorVariation = 0;
            let nonWhitePixels = 0;
            let transparentPixels = 0;
            
            // 픽셀 분석 (RGBA 형식)
            for (let i = 0; i < pixels.length; i += 4) {
                const r = pixels[i];
                const g = pixels[i + 1];
                const b = pixels[i + 2];
                const a = pixels[i + 3];
                
                // 투명 픽셀 카운트
                if (a < 255) {
                    transparentPixels++;
                }
                
                // 순백색이 아닌 픽셀 카운트 (약간의 여유값 포함)
                if (r < 250 || g < 250 || b < 250) {
                    nonWhitePixels++;
                }
                
                // 색상 변화량 측정
                const brightness = (r + g + b) / 3;
                colorVariation += Math.abs(brightness - 255);
            }
            
            const totalPixels = pixels.length / 4;
            const nonWhiteRatio = nonWhitePixels / totalPixels;
            const transparentRatio = transparentPixels / totalPixels;
            const avgColorVariation = colorVariation / totalPixels;
            
            this.log('📊 Canvas analysis:', {
                dimensions: `${canvas.width}x${canvas.height}`,
                sampleSize: `${sampleSize}x${sampleSize}`,
                nonWhiteRatio: nonWhiteRatio.toFixed(3),
                transparentRatio: transparentRatio.toFixed(3),
                avgColorVariation: avgColorVariation.toFixed(2)
            });
            
            // 검증 조건들
            const hasContent = nonWhiteRatio > 0.01; // 1% 이상이 흰색이 아님
            const hasVariation = avgColorVariation > 5; // 평균 색상 변화량이 5 이상
            const notMostlyTransparent = transparentRatio < 0.9; // 90% 미만이 투명
            
            const isValid = hasContent && hasVariation && notMostlyTransparent;
            
            this.log(`🔍 Canvas validation result: ${isValid ? '✅ PASS' : '❌ FAIL'}`);
            this.log(`   - Has content (${nonWhiteRatio.toFixed(3)} > 0.01): ${hasContent}`);
            this.log(`   - Has variation (${avgColorVariation.toFixed(2)} > 5): ${hasVariation}`);
            this.log(`   - Not transparent (${transparentRatio.toFixed(3)} < 0.9): ${notMostlyTransparent}`);
            
            return isValid;
            
        } catch (error) {
            this.log('❌ Canvas validation error:', error.message);
            return false;
        }
    },
    
    // Method 1: Enhanced PDF.js canvas rendering with comprehensive access
    async extractImageViaPDFJS(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('🚀 Starting enhanced PDF.js rendering approach...');
            
            // 🕐 PDF 렌더링 완료 대기 (대폭 증가)
            this.log('⏳ Waiting for PDF rendering to complete...');
            await new Promise(resolve => setTimeout(resolve, 5000)); // 5초 대기
            
            // 🔍 더 광범위한 윈도우 접근 시도
            const windows = [
                reader._iframeWindow,
                reader._window,
                reader.iframe?.contentWindow,
                reader.window,
                // 추가 접근 방법들
                reader._iframe?.contentWindow,
                reader.tabContainer?.querySelector('iframe')?.contentWindow,
                // document.querySelector 제거 - 권한 문제
                null
            ].filter(w => w && w !== null);
            
            this.log('🔍 Checking', windows.length, 'windows for PDF.js access');
            
            for (let winIdx = 0; winIdx < windows.length; winIdx++) {
                const targetWindow = windows[winIdx];
                this.log(`🪟 Trying window ${winIdx + 1}/${windows.length}`);
                
                try {
                    // 🔐 wrappedJSObject 접근 강화
                    const wrappedWindow = targetWindow.wrappedJSObject || targetWindow;
                    
                    const pdfApps = [
                        targetWindow.PDFViewerApplication,
                        targetWindow.window?.PDFViewerApplication,
                        targetWindow.parent?.PDFViewerApplication,
                        wrappedWindow.PDFViewerApplication,
                        wrappedWindow.window?.PDFViewerApplication,
                        // 추가 접근 경로들
                        targetWindow.contentWindow?.PDFViewerApplication,
                        targetWindow.document?.defaultView?.PDFViewerApplication
                    ].filter(app => app);
                    
                    this.log(`📱 Found ${pdfApps.length} PDF applications in window ${winIdx + 1}`);
                    
                    for (let appIdx = 0; appIdx < pdfApps.length; appIdx++) {
                        const pdfApp = pdfApps[appIdx];
                        this.log(`📄 Trying PDF app ${appIdx + 1}/${pdfApps.length}`);
                        
                        if (pdfApp && pdfApp.pdfDocument) {
                            const pdfDoc = pdfApp.pdfDocument;
                            this.log(`✅ Found PDF.js document! Pages: ${pdfDoc.numPages}, Target page: ${pageNumber}`);
                            
                            // 🔍 PDF 문서 상태 확인
                            this.log('📊 PDF Document state:', {
                                numPages: pdfDoc.numPages,
                                fingerprint: pdfDoc.fingerprint || 'unknown',
                                loadingTask: !!pdfDoc.loadingTask,
                                destroyed: pdfDoc.destroyed || false
                            });
                            
                            if (pageNumber <= pdfDoc.numPages) {
                                this.log(`📋 Attempting to get page ${pageNumber}...`);
                                const page = await pdfDoc.getPage(pageNumber);
                                
                                // 🔍 페이지 객체 상태 및 API 탐색
                                const pageProps = Object.getOwnPropertyNames(page);
                                const pageMethods = pageProps.filter(prop => {
                                    try {
                                        return typeof page[prop] === 'function';
                                    } catch (e) {
                                        return false;
                                    }
                                });
                                
                                this.log('📋 Page object analysis:', {
                                    pageIndex: page._pageIndex,
                                    destroyed: page.destroyed || false,
                                    hasTransport: !!page._transport,
                                    allProperties: pageProps.slice(0, 20),
                                    allMethods: pageMethods.slice(0, 15),
                                    constructor: page.constructor?.name,
                                    prototype: Object.getPrototypeOf(page)?.constructor?.name
                                });
                                
                                // 🔍 viewport 관련 메서드 탐색
                                const viewportMethods = ['getViewport', 'getViewBox', 'view', 'mediaBox', 'rotate'];
                                const availableViewportMethods = [];
                                
                                for (const method of viewportMethods) {
                                    if (typeof page[method] === 'function') {
                                        availableViewportMethods.push(method);
                                        this.log(`✅ Found viewport method: ${method}`);
                                    }
                                }
                                
                                this.log('📊 Available viewport methods:', availableViewportMethods);
                                
                                // 🎯 강제 렌더링 접근법: PDF.js의 render() API 직접 사용
                                this.log('✅ Implementing enhanced forced PDF.js rendering approach');
                                
                                // Try multiple approaches for image rendering
                                const renderApproaches = [
                                    // Approach 1: Ultra high quality rendering with forced timeout
                                    async () => {
                                        this.log('🔄 Starting ultra high quality rendering...');
                                        // 🔍 다양한 viewport 접근 방법 시도
                                        let viewport;
                                        
                                        if (typeof page.getViewport === 'function') {
                                            viewport = page.getViewport({ scale: 3.0 });
                                            this.log('✅ Using page.getViewport()');
                                        } else if (typeof page.view === 'object' && page.view) {
                                            // 대체 viewport 생성
                                            const view = page.view;
                                            viewport = {
                                                width: (view[2] - view[0]) * 3.0,
                                                height: (view[3] - view[1]) * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('✅ Using page.view fallback:', view);
                                        } else if (typeof page.getViewBox === 'function') {
                                            const viewBox = page.getViewBox();
                                            viewport = {
                                                width: (viewBox[2] - viewBox[0]) * 3.0,
                                                height: (viewBox[3] - viewBox[1]) * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('✅ Using page.getViewBox():', viewBox);
                                        } else {
                                            // 기본 viewport 설정
                                            viewport = {
                                                width: 595 * 3.0, // A4 기본 크기
                                                height: 842 * 3.0,
                                                scale: 3.0,
                                                offsetX: 0,
                                                offsetY: 0
                                            };
                                            this.log('⚠️ Using default viewport (A4)');
                                        }
                                        
                                        this.log('📊 Viewport details:', {
                                            width: viewport.width,
                                            height: viewport.height,
                                            scale: viewport.scale || 3.0
                                        });
                                        // 🎨 다중 canvas 생성 시도
                                        let canvas, context;
                                        const canvasCreationMethods = [
                                            () => targetWindow.document.createElement('canvas'),
                                            () => { 
                                                // 안전한 canvas 생성 - targetWindow 사용 필수
                                                if (targetWindow && targetWindow.document) {
                                                    return targetWindow.document.createElement('canvas');
                                                } else {
                                                    throw new Error('No target window available');
                                                }
                                            },
                                            () => new targetWindow.HTMLCanvasElement(),
                                            () => {
                                                const c = targetWindow.document.createElementNS('http://www.w3.org/1999/xhtml', 'canvas');
                                                return c;
                                            }
                                        ];
                                        
                                        for (const createMethod of canvasCreationMethods) {
                                            try {
                                                canvas = createMethod();
                                                context = canvas.getContext('2d');
                                                if (canvas && context) {
                                                    this.log('✅ Canvas created successfully');
                                                    break;
                                                }
                                            } catch (canvasError) {
                                                this.log('⚠️ Canvas creation method failed:', canvasError.message);
                                            }
                                        }
                                        
                                        if (!canvas || !context) {
                                            throw new Error('Failed to create canvas with any method');
                                        }
                                        
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background for better contrast
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display',
                                            enableWebGL: false, // Force software rendering for compatibility
                                            canvasFactory: targetWindow.document // Ensure proper canvas factory
                                        };
                                        
                                        this.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);
                                        this.log('🎨 Render context:', Object.keys(renderContext));
                                        
                                        // 🎯 다양한 render 메서드 시도
                                        let renderPromise;
                                        
                                        if (typeof page.render === 'function') {
                                            this.log('✅ Using page.render()');
                                            const renderTask = page.render(renderContext);
                                            renderPromise = renderTask.promise || renderTask;
                                        } else if (typeof page.draw === 'function') {
                                            this.log('✅ Using page.draw() fallback');
                                            renderPromise = page.draw(context, viewport);
                                        } else if (typeof page.renderIntoCanvas === 'function') {
                                            this.log('✅ Using page.renderIntoCanvas() fallback');
                                            renderPromise = page.renderIntoCanvas(canvas, viewport);
                                        } else {
                                            throw new Error('No available render method found on page object');
                                        }
                                        
                                        // 타임아웃과 함께 렌더링 대기 (증가된 시간)
                                        await Promise.race([
                                            renderPromise,
                                            new Promise((_, reject) => 
                                                setTimeout(() => reject(new Error('Render timeout after 60 seconds')), 60000)
                                            )
                                        ]);
                                        
                                        // 렌더링 후 추가 대기
                                        await new Promise(resolve => setTimeout(resolve, 1000));
                                        
                                        this.log('✅ Ultra high quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 2: High quality rendering with white background
                                    async () => {
                                        this.log('🔄 Starting high quality rendering...');
                                        const viewport = page.getViewport({ scale: 2.0 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display'
                                        };
                                        
                                        // 🎯 다양한 render 메서드 시도
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ High quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 3: Medium quality rendering with rendering intent
                                    async () => {
                                        this.log('🔄 Starting medium quality rendering...');
                                        const viewport = page.getViewport({ scale: 1.5 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // Light gray background for better readability
                                        context.fillStyle = '#f8f8f8';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'display'
                                        };
                                        
                                        // 🎯 다양한 render 메서드 시도
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Medium quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 4: Print quality rendering (for academic papers)
                                    async () => {
                                        this.log('🔄 Starting print quality rendering...');
                                        const viewport = page.getViewport({ scale: 1.2 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        // White background for print quality
                                        context.fillStyle = '#ffffff';
                                        context.fillRect(0, 0, canvas.width, canvas.height);
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport,
                                            intent: 'print'
                                        };
                                        
                                        // 🎯 다양한 render 메서드 시도
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Print quality rendering completed');
                                        return canvas;
                                    },
                                    
                                    // Approach 5: Minimal rendering for compatibility
                                    async () => {
                                        this.log('🔄 Starting minimal rendering...');
                                        const viewport = page.getViewport({ scale: 1.0 });
                                        const canvas = targetWindow.document.createElement('canvas');
                                        const context = canvas.getContext('2d');
                                        canvas.height = viewport.height;
                                        canvas.width = viewport.width;
                                        
                                        const renderContext = {
                                            canvasContext: context,
                                            viewport: viewport
                                        };
                                        
                                        // 🎯 다양한 render 메서드 시도
                                        if (typeof page.render === 'function') {
                                            const renderTask = page.render(renderContext);
                                            await (renderTask.promise || renderTask);
                                        } else if (typeof page.draw === 'function') {
                                            await page.draw(context, viewport);
                                        } else {
                                            throw new Error('No render method available');
                                        }
                                        this.log('✅ Minimal rendering completed');
                                        return canvas;
                                    }
                                ];
                                
                                for (let i = 0; i < renderApproaches.length; i++) {
                                    try {
                                        this.log(`🚀 Trying PDF.js render approach ${i + 1}/${renderApproaches.length}...`);
                                        const canvas = await renderApproaches[i]();
                                        
                                        if (canvas && canvas.width > 0 && canvas.height > 0) {
                                            this.log(`📋 Canvas created: ${canvas.width}x${canvas.height}`);
                                            
                                            // 📋 Canvas 내용 검증
                                            const isCanvasValid = this.validateCanvasContent(canvas);
                                            
                                            if (isCanvasValid) {
                                                result.imageDataUrl = canvas.toDataURL('image/png', 0.95);
                                                result.width = canvas.width;
                                                result.height = canvas.height;
                                                result.success = true;
                                                
                                                this.log(`🎉 PDF.js 강제 렌더링 성공! Method: ${i + 1}, Size: ${canvas.width}x${canvas.height}`);
                                                this.log(`📊 Canvas content validation: PASSED`);
                                                return result;
                                            } else {
                                                this.log(`⚠️ Canvas rendered but content validation failed (approach ${i + 1})`);
                                                // 검증 실패해도 다음 접근법 시도
                                            }
                                        } else {
                                            this.log(`❌ Canvas creation failed or invalid dimensions (approach ${i + 1})`);
                                        }
                                        
                                    } catch (approachError) {
                                        this.log(`❌ PDF.js approach ${i + 1} error:`, approachError.message);
                                        
                                        // 에러 상세 정보 로깅
                                        if (approachError.stack) {
                                            this.log('📝 Error stack:', approachError.stack.slice(0, 300));
                                        }
                                    }
                                }
                            } else {
                                this.log(`Page ${pageNumber} exceeds document pages (${pdfDoc.numPages})`);
                            }
                        }
                    }
                } catch (winError) {
                    this.log('Window PDF.js image access failed:', winError.message);
                }
            }
            
            result.error = 'PDF.js not accessible for image extraction in any window';
            
        } catch (error) {
            result.error = `PDF.js image method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Method 2: Enhanced existing canvas capture with deep DOM exploration
    async extractImageViaExistingCanvas(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            this.log('🔍 Starting enhanced existing canvas search...');
            
            // 🔍 더 광범위한 문서 접근 (안전한 방식)
            const targetDocs = [
                reader._iframeWindow?.document,
                reader._window?.document,
                reader.iframe?.contentDocument,
                reader._iframe?.contentDocument
                // document 직접 접근 제거 (권한 문제)
            ].filter(doc => doc);
            
            this.log(`📄 Found ${targetDocs.length} documents to search`);
            
            for (let docIdx = 0; docIdx < targetDocs.length; docIdx++) {
                const targetDoc = targetDocs[docIdx];
                this.log(`🔍 Searching document ${docIdx + 1}/${targetDocs.length}`);
                
                // 🕐 렌더링 대기 시간 대폭 증가
                this.log('⏳ Waiting for rendering completion...');
                await new Promise(resolve => setTimeout(resolve, 8000)); // 8초 대기
                
                // 🔍 확장된 canvas selector 목록
                const canvasSelectors = [
                    // 페이지 별 selectors
                    `[data-page-number="${pageNumber}"] canvas`,
                    `.page[data-page-number="${pageNumber}"] canvas`,
                    `#pageContainer${pageNumber} canvas`,
                    `.page:nth-child(${pageNumber}) canvas`,
                    `canvas[data-page="${pageNumber}"]`,
                    `canvas[data-page-number="${pageNumber}"]`,
                    
                    // 일반적인 PDF 뷰어 selectors
                    '.pdfViewer .page canvas',
                    '.pdfViewer canvas',
                    '.viewer canvas',
                    '.pdf-viewer canvas',
                    '.page canvas',
                    
                    // Zotero 7 특수 selectors
                    '.readerContainer canvas',
                    '.reader-container canvas',
                    '[class*="reader"] canvas',
                    '[class*="pdf"] canvas',
                    
                    // 모든 canvas 요소들
                    'canvas:not([data-page-number])',
                    'canvas'
                ];
                
                this.log(`🔍 Using ${canvasSelectors.length} canvas selectors`);
                
                for (let selIdx = 0; selIdx < canvasSelectors.length; selIdx++) {
                    const selector = canvasSelectors[selIdx];
                    
                    try {
                        const canvases = targetDoc.querySelectorAll(selector);
                        this.log(`🔍 Selector ${selIdx + 1}/${canvasSelectors.length}: "${selector}" → ${canvases.length} elements`);
                        
                        if (canvases.length > 0) {
                            // canvas 요소들을 상세하게 분석
                            for (let i = 0; i < canvases.length; i++) {
                                const canvas = canvases[i];
                                
                                this.log(`📋 Canvas ${i + 1}/${canvases.length} analysis:`, {
                                    width: canvas.width,
                                    height: canvas.height,
                                    hasToDataURL: typeof canvas.toDataURL === 'function',
                                    className: canvas.className,
                                    id: canvas.id,
                                    dataAttrs: Object.keys(canvas.dataset || {})
                                });
                                
                                if (canvas && canvas.toDataURL && canvas.width > 10 && canvas.height > 10) { // 임계값 낮춤
                                    try {
                                        // 🔍 전용 검증 함수 사용
                                        const isValidCanvas = this.validateCanvasContent(canvas);
                                        
                                        if (isValidCanvas) {
                                            result.imageDataUrl = canvas.toDataURL('image/png', 0.9);
                                            result.width = canvas.width;
                                            result.height = canvas.height;
                                            result.success = true;
                                            this.log(`🎉 Existing canvas capture SUCCESS! Selector: "${selector}", Canvas: ${i + 1}, Size: ${canvas.width}x${canvas.height}`);
                                            return result;
                                        } else {
                                            this.log(`⚠️ Canvas ${i + 1} validation failed (empty content)`);
                                        }
                                    } catch (canvasError) {
                                        this.log(`❌ Canvas ${i + 1} processing error:`, canvasError.message);
                                    }
                                } else {
                                    this.log(`❌ Canvas ${i + 1} invalid: dimensions or missing toDataURL`);
                                }
                            }
                        }
                    } catch (selectorError) {
                        this.log(`❌ Selector "${selector}" failed:`, selectorError.message);
                    }
                }
                
                // 이 문서에서 아무것도 찾지 못한 경우
                this.log(`⚠️ No valid canvas found in document ${docIdx + 1}`);
            }
                
            result.error = 'No suitable canvas found in any document';
            this.log('❌ No valid canvas found in any accessible document');
        } catch (error) {
            result.error = `Enhanced canvas search failed: ${error.message}`;
            this.log('❌ Enhanced canvas search error:', error.message);
        }
        
        return result;
    },
    
    // Method 3: Screenshot/DOM capture approach
    async extractImageViaScreenshot(reader, pageNumber) {
        const result = { success: false, imageDataUrl: null, width: 0, height: 0, error: null };
        
        try {
            const targetDoc = reader._iframeWindow?.document || reader._window?.document;
            
            if (targetDoc) {
                // Try to find and capture page elements more comprehensively
                const pageSelectors = [
                    `[data-page-number="${pageNumber}"]`,
                    `.page[data-page-number="${pageNumber}"]`,
                    `#pageContainer${pageNumber}`,
                    `.page:nth-child(${pageNumber})`,
                    '.pdfViewer .page',  // Any page in PDF viewer
                    '.page',  // Any page element
                    '.pdf-page',  // Alternative page class
                    '[class*="page"]'  // Any element with "page" in class name
                ];
                
                for (const selector of pageSelectors) {
                    const pageElements = targetDoc.querySelectorAll(selector);
                    this.log(`Checking page selector "${selector}", found ${pageElements.length} elements`);
                    
                    for (let i = 0; i < pageElements.length; i++) {
                        const pageElement = pageElements[i];
                        if (pageElement && pageElement.getBoundingClientRect) {
                            const rect = pageElement.getBoundingClientRect();
                            this.log(`Page element ${i} rect: ${rect.width}x${rect.height}`);
                            
                            if (rect.width > 100 && rect.height > 100) {
                                try {
                                    // Method 1: Try to capture existing background images or content
                                    const computedStyle = targetWindow.getComputedStyle(pageElement);
                                    const backgroundImage = computedStyle.backgroundImage;
                                    
                                    if (backgroundImage && backgroundImage !== 'none') {
                                        this.log('Found background image:', backgroundImage);
                                        // Extract URL from background-image if it's a data URL
                                        const match = backgroundImage.match(/url\(["']?(data:image\/[^"']+)["']?\)/);
                                        if (match) {
                                            result.imageDataUrl = match[1];
                                            result.width = rect.width;
                                            result.height = rect.height;
                                            result.success = true;
                                            this.log(`✅ Background image capture successful: ${rect.width}x${rect.height}`);
                                            return result;
                                        }
                                    }
                                    
                                    // Method 2: Simple DOM-to-canvas rendering with better content
                                    const canvas = targetDoc.createElement('canvas');
                                    const context = canvas.getContext('2d');
                                    canvas.width = Math.min(rect.width, 800);  // Limit size
                                    canvas.height = Math.min(rect.height, 1000);
                                    
                                    // White background
                                    context.fillStyle = '#ffffff';
                                    context.fillRect(0, 0, canvas.width, canvas.height);
                                    
                                    // Try to render text content from the element
                                    const textContent = pageElement.textContent || pageElement.innerText || '';
                                    if (textContent.trim().length > 0) {
                                        context.fillStyle = '#000000';
                                        context.font = '14px Arial';
                                        
                                        // Break text into lines
                                        const words = textContent.trim().split(/\s+/);
                                        const lineHeight = 20;
                                        const maxWidth = canvas.width - 20;
                                        let currentLine = '';
                                        let y = 30;
                                        
                                        for (const word of words.slice(0, 200)) {  // Limit words
                                            const testLine = currentLine + word + ' ';
                                            const metrics = context.measureText(testLine);
                                            
                                            if (metrics.width > maxWidth && currentLine !== '') {
                                                context.fillText(currentLine.trim(), 10, y);
                                                currentLine = word + ' ';
                                                y += lineHeight;
                                                
                                                if (y > canvas.height - 20) break;
                                            } else {
                                                currentLine = testLine;
                                            }
                                        }
                                        
                                        if (currentLine.trim() && y <= canvas.height - 20) {
                                            context.fillText(currentLine.trim(), 10, y);
                                        }
                                    } else {
                                        // No text content, just show placeholder
                                        context.fillStyle = '#666666';
                                        context.font = '16px Arial';
                                        context.fillText('PDF Page (No Text Available)', 10, 30);
                                        context.fillText(`Page ${pageNumber}`, 10, 60);
                                        context.fillText('Image-based content detected', 10, 90);
                                    }
                                    
                                    result.imageDataUrl = canvas.toDataURL('image/png');
                                    result.width = canvas.width;
                                    result.height = canvas.height;
                                    result.success = true;
                                    
                                    this.log(`✅ DOM content capture successful: ${canvas.width}x${canvas.height}`);
                                    return result;
                                    
                                } catch (renderError) {
                                    this.log(`DOM render failed for element ${i}:`, renderError.message);
                                }
                            }
                        }
                    }
                }
                
                result.error = 'No suitable page element found for screenshot';
            } else {
                result.error = 'Document not accessible for screenshot';
            }
        } catch (error) {
            result.error = `Screenshot method failed: ${error.message}`;
        }
        
        return result;
    },
    
    // Validate and preprocess extracted content
    validateAndProcessContent(extractionResult) {
        const result = {
            isValid: false,
            qualityScore: 0,
            processedContent: '',
            validationIssues: [],
            detectedMetadata: [],
            imageQuality: null
        };
        
        try {
            if (!extractionResult.success) {
                result.validationIssues.push('Extraction failed');
                return result;
            }
            
            if (extractionResult.contentType === 'text') {
                result = this.validateAndProcessText(extractionResult, result);
            } else if (extractionResult.contentType === 'image') {
                result = this.validateAndProcessImage(extractionResult, result);
            }
            
            this.log('Content validation complete, quality score:', result.qualityScore);
            
        } catch (error) {
            this.handleError(error, 'validateAndProcessContent');
            result.validationIssues.push(`Validation error: ${error.message}`);
        }
        
        return result;
    },
    
    // Validate and process text content
    validateAndProcessText(extractionResult, result) {
        const text = extractionResult.content || '';
        let qualityScore = 0;
        const issues = [];
        const detectedElements = [];
        
        // Basic validation
        if (text.length < 50) {
            issues.push('Text too short');
        } else {
            qualityScore += 20;
        }
        
        if (text.length > 100) {
            qualityScore += 10;
        }
        
        // Check for meaningful content (not just whitespace/symbols)
        const wordCount = text.split(/\s+/).filter(word => word.match(/[a-zA-Z]{2,}/)).length;
        if (wordCount < 10) {
            issues.push('Insufficient readable words');
        } else {
            qualityScore += 20;
        }
        
        // Text preprocessing
        let processedText = text
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            // Remove excessive special characters
            .replace(/[^\w\s\.\,\:\;\!\?\-\(\)\[\]\"\'\/\&\%\$\#\@]/g, ' ')
            // Clean up multiple spaces again
            .replace(/\s+/g, ' ')
            .trim();
        
        // Check for potential metadata elements
        const metadataPatterns = {
            'title': /^[A-Z][^.!?]*[.!?]?\s*$/m,
            'authors': /\b[A-Z][a-z]+,?\s+[A-Z]\.?\s*[A-Z]?[a-z]*\b/g,
            'journal': /\b(Journal|Proceedings|Conference|Review|Science|Nature|Cell)\b/gi,
            'year': /\b(19|20)\d{2}\b/g,
            'doi': /\b10\.\d{4,}/g,
            'volume': /\bvol\.?\s*\d+/gi,
            'pages': /\bpp?\.?\s*\d+[\-–—]\d+/gi,
            'abstract': /\babstract\b/gi,
            'keywords': /\bkeywords?\b/gi
        };
        
        for (const [type, pattern] of Object.entries(metadataPatterns)) {
            const matches = processedText.match(pattern);
            if (matches && matches.length > 0) {
                detectedElements.push(type);
                qualityScore += 5;
            }
        }
        
        // Check for academic paper indicators
        const academicIndicators = [
            /\babstract\b/i,
            /\bintroduction\b/i,
            /\bmethods?\b/i,
            /\bresults?\b/i,
            /\bconclusions?\b/i,
            /\breferences?\b/i,
            /\bbibliography\b/i,
            /\bcitation\b/i,
            /\buniversity\b/i,
            /\bdepartment\b/i
        ];
        
        let academicScore = 0;
        for (const indicator of academicIndicators) {
            if (processedText.match(indicator)) {
                academicScore += 3;
            }
        }
        qualityScore += Math.min(academicScore, 15);
        
        // Final validation
        result.isValid = issues.length === 0 && qualityScore >= 30;
        result.qualityScore = Math.min(qualityScore, 100);
        result.processedContent = processedText;
        result.validationIssues = issues;
        result.detectedMetadata = detectedElements;
        
        return result;
    },
    
    // Validate and process image content
    validateAndProcessImage(extractionResult, result) {
        let qualityScore = 0;
        const issues = [];
        
        // Basic validation
        if (!extractionResult.imageDataUrl) {
            issues.push('No image data available');
            result.isValid = false;
            result.qualityScore = 0;
            result.validationIssues = issues;
            return result;
        }
        
        // Check image dimensions
        const width = extractionResult.width || 0;
        const height = extractionResult.height || 0;
        
        if (width < 200 || height < 200) {
            issues.push('Image resolution too low');
        } else {
            qualityScore += 30;
        }
        
        if (width >= 600 && height >= 800) {
            qualityScore += 20;
        }
        
        // Check image data size (basic quality indicator)
        const dataSize = extractionResult.imageDataUrl.length;
        if (dataSize < 10000) {
            issues.push('Image data too small');
        } else if (dataSize > 50000) {
            qualityScore += 20;
        } else {
            qualityScore += 10;
        }
        
        // Determine image quality category
        let imageQuality = 'Poor';
        if (qualityScore >= 60) {
            imageQuality = 'Good';
        } else if (qualityScore >= 30) {
            imageQuality = 'Fair';
        }
        
        // For images, we consider it valid if we have basic image data
        result.isValid = issues.length === 0 || qualityScore >= 20;
        result.qualityScore = Math.min(qualityScore, 100);
        result.processedContent = `Image (${width}x${height})`;
        result.validationIssues = issues;
        result.imageQuality = imageQuality;
        
        return result;
    },
    
    // Get comprehensive PDF context information
    async getPDFContext(reader, item) {
        try {
            const context = {
                itemID: reader.itemID,
                title: item.getField('title') || 'Untitled',
                filename: '',
                totalPages: 0,
                currentPage: 1,
                hasParent: false,
                parentTitle: '',
                parentID: null,
                attachmentPath: ''
            };
            
            // Get filename
            if (item.isAttachment()) {
                context.filename = item.getFilename() || 'unknown.pdf';
                context.attachmentPath = await item.getFilePathAsync();
                
                // Check for parent item
                const parentID = item.parentID;
                if (parentID) {
                    context.hasParent = true;
                    context.parentID = parentID;
                    const parentItem = await Zotero.Items.getAsync(parentID);
                    if (parentItem) {
                        context.parentTitle = parentItem.getField('title') || 'Untitled Parent';
                    }
                }
            }
            
            // Get page information from Zotero Reader API only (avoid PDF.js interference)
            try {
                // Use Zotero's safer API instead of direct PDF.js access
                if (reader.getPageIndex && reader.getNumPages) {
                    context.currentPage = (reader.getPageIndex() || 0) + 1; // 0-based to 1-based
                    context.totalPages = reader.getNumPages() || 0;
                } else {
                    // Fallback: no direct PDF.js access to avoid interference
                    context.totalPages = 0;
                    context.currentPage = 1;
                }
                this.log('PDF page info (Zotero API) - Current:', context.currentPage, 'Total:', context.totalPages);
            } catch (error) {
                this.log('Could not access PDF page info via Zotero API:', error.message);
                // Use fallback values
                context.totalPages = 0;
                context.currentPage = 1;
            }
            
            this.log('PDF Context:', context);
            return context;
            
        } catch (error) {
            this.handleError(error, 'getPDFContext');
            throw error;
        }
    },
    
    // Process text with AI to extract metadata
    async processWithAI(text, pdfContext) {
        const result = {
            success: false,
            metadata: null,
            error: null
        };
        
        try {
            this.log('Starting AI processing with Ollama...');
            this.log('AI Backend:', this.config.ai_backend);
            this.log('Ollama Model:', this.config.ollama_model);
            this.log('Ollama Host:', this.config.ollama_host);
            
            // Import Ollama module - inline implementation for better compatibility
            if (!this.ollamaAPI) {
                this.ollamaAPI = this.createOllamaAPI();
                this.log('Ollama API module created successfully');
            }
            
            // Check Ollama connection and available models
            this.log('Checking Ollama connection...');
            const isConnected = await this.ollamaAPI.checkConnection(this.config.ollama_host);
            if (!isConnected) {
                throw new Error(`Ollama 서버에 연결할 수 없습니다.\n\n확인사항:\n1. 'ollama serve' 명령으로 서버를 실행했는지 확인\n2. 호스트 주소가 정확한지 확인: ${this.config.ollama_host}`);
            }
            
            this.log('Ollama connection confirmed, checking available models...');
            
            // Check if the model exists
            const availableModels = await this.ollamaAPI.getAvailableModels(this.config.ollama_host);
            this.log('Available models:', availableModels.map(m => m.name || m));
            
            const modelExists = availableModels.some(m => 
                (m.name || m) === this.config.ollama_model || 
                (m.name || m).startsWith(this.config.ollama_model.split(':')[0])
            );
            
            if (!modelExists) {
                const modelList = availableModels.map(m => m.name || m).join(', ');
                throw new Error(`모델 '${this.config.ollama_model}'을 찾을 수 없습니다.\n\n사용 가능한 모델: ${modelList}\n\n모델 설치: ollama pull ${this.config.ollama_model}`);
            }
            
            this.log('Model confirmed:', this.config.ollama_model);
            
            // Call Ollama API with retry
            const metadata = await this.ollamaAPI.retryWithBackoff(async () => {
                return await this.ollamaAPI.queryOllama(
                    text, 
                    this.config.ollama_model,
                    this.config.ollama_host
                );
            });
            
            this.log('Ollama metadata extraction successful:', metadata);
            
            result.success = true;
            result.metadata = metadata;
            
        } catch (error) {
            this.log('AI processing failed:', error.message);
            this.log('AI processing error stack:', error.stack);
            result.error = error.message;
        }
        
        return result;
    },
    
    // Create inline Ollama API implementation
    createOllamaAPI() {
        return {
            async queryOllama(text, model = 'llama3.2:latest', host = 'http://localhost:11434') {
                return new Promise((resolve, reject) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('POST', `${host}/api/generate`, true);
                        xhr.setRequestHeader('Content-Type', 'application/json');
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        const result = this.parseResponse(data.response);
                                        resolve(result);
                                    } catch (parseError) {
                                        reject(new Error(`응답 파싱 오류: ${parseError.message}`));
                                    }
                                } else {
                                    // Include response text for better debugging
                                    const errorDetail = xhr.responseText ? ` - ${xhr.responseText}` : '';
                                    reject(new Error(`Ollama API 오류: ${xhr.status} ${xhr.statusText}${errorDetail}`));
                                }
                            }
                        };
                        
                        xhr.onerror = () => {
                            reject(new Error(`네트워크 오류: Ollama 서버에 연결할 수 없습니다. (${host})`));
                        };
                        
                        xhr.ontimeout = () => {
                            reject(new Error(`타임아웃: Ollama 서버 응답이 너무 느립니다.`));
                        };
                        
                        xhr.timeout = 30000;
                        
                        const requestData = JSON.stringify({
                            model: model,
                            prompt: this.buildPrompt(text),
                            stream: false,
                            options: {
                                temperature: 0.1,
                                top_p: 0.9,
                                num_predict: 1000
                            }
                        });
                        
                        xhr.send(requestData);
                        
                    } catch (error) {
                        reject(new Error(`요청 생성 오류: ${error.message}`));
                    }
                });
            },
            
            async checkConnection(host = 'http://localhost:11434') {
                return new Promise((resolve) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `${host}/api/tags`, true);
                        xhr.timeout = 5000;
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                resolve(xhr.status === 200);
                            }
                        };
                        
                        xhr.onerror = () => resolve(false);
                        xhr.ontimeout = () => resolve(false);
                        
                        xhr.send();
                    } catch (error) {
                        resolve(false);
                    }
                });
            },
            
            async getAvailableModels(host = 'http://localhost:11434') {
                return new Promise((resolve) => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', `${host}/api/tags`, true);
                        xhr.timeout = 5000;
                        
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                if (xhr.status === 200) {
                                    try {
                                        const data = JSON.parse(xhr.responseText);
                                        resolve(data.models || []);
                                    } catch (error) {
                                        resolve([]);
                                    }
                                } else {
                                    resolve([]);
                                }
                            }
                        };
                        
                        xhr.onerror = () => resolve([]);
                        xhr.ontimeout = () => resolve([]);
                        
                        xhr.send();
                    } catch (error) {
                        resolve([]);
                    }
                });
            },
            
            buildPrompt(text) {
                return `다음 학술 논문의 텍스트에서 정확한 서지정보를 추출하여 JSON 형식으로 반환해주세요.

텍스트:
${text.substring(0, 3000)}

다음 형식의 JSON만 반환하세요:
{
  "title": "논문 제목",
  "authors": ["저자1", "저자2"],
  "year": "출판년도",
  "journal": "저널명",
  "volume": "볼륨",
  "issue": "호수",
  "pages": "페이지",
  "doi": "DOI",
  "abstract": "초록 전문 - 있다면 반드시 포함"
}

주의사항:
- 정확한 정보만 추출하세요
- 불확실한 정보는 빈 문자열로 두세요
- JSON 형식을 정확히 지켜주세요
- 저자명은 반드시 배열로 반환하세요 - 각 저자를 개별 요소로 분리
- 저자가 여러 명인 경우 모두 별개의 배열 항목으로 추가하세요
- 초록(abstract)이 있다면 반드시 완전하게 추출하세요 - 매우 중요합니다
- 초록은 요약하지 말고 원문 그대로 추출하세요
- 추가 설명 없이 JSON만 반환하세요`;
            },
            
            parseResponse(response) {
                try {
                    const jsonMatch = response.match(/\{[\s\S]*\}/);
                    if (!jsonMatch) {
                        throw new Error('JSON 형식을 찾을 수 없습니다');
                    }

                    const jsonStr = jsonMatch[0];
                    const metadata = JSON.parse(jsonStr);

                    return {
                        title: metadata.title || '',
                        authors: Array.isArray(metadata.authors) ? metadata.authors : [],
                        year: metadata.year || '',
                        journal: metadata.journal || '',
                        volume: metadata.volume || '',
                        issue: metadata.issue || '',
                        pages: metadata.pages || '',
                        doi: metadata.doi || '',
                        abstract: metadata.abstract || ''
                    };
                } catch (error) {
                    throw new Error('AI 응답을 파싱할 수 없습니다: ' + error.message);
                }
            },
            
            async retryWithBackoff(fn, maxRetries = 3) {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        return await fn();
                    } catch (error) {
                        if (i === maxRetries - 1) throw error;
                        
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
        };
    },

    // Handle existing parent item workflow
    async handleExistingParent(metadata, reader, pdfContext) {
        try {
            this.log('🔵 [DEBUG] Handling existing parent item workflow');
            this.log('🔵 [DEBUG] Parent ID:', pdfContext.parentID);
            this.log('🔵 [DEBUG] New metadata:', metadata);
            
            // Store new metadata for comparison
            this.currentNewMetadata = metadata;
            
            this.log('🔵 [DEBUG] About to show comparison dialog...');
            // Show comparison dialog directly
            const updateSelection = await this.showMetadataComparisonDialog(pdfContext.parentID, metadata);
            this.log('🔵 [DEBUG] Update selection result:', updateSelection);
            
            if (updateSelection && updateSelection !== 'create_new') {
                // User chose to update existing parent
                this.log('🔵 [DEBUG] User chose to update, calling updateExistingParentSelective...');
                await this.updateExistingParentSelective(pdfContext.parentID, updateSelection);
                this.log('🔵 [DEBUG] Update completed successfully');
                return { success: true };
            } else if (updateSelection === 'create_new') {
                // User chose to create new parent
                this.log('🔵 [DEBUG] User chose to create new parent instead of updating');
                await this.createNewParent(metadata, reader, pdfContext);
                return { success: true };
            } else {
                // User cancelled
                this.log('🔵 [DEBUG] User cancelled metadata comparison');
                return { success: false, error: '사용자가 취소했습니다' };
            }
            
        } catch (error) {
            this.handleError(error, 'handleExistingParent');
            return { success: false, error: error.message };
        }
    },

    // Create new parent item (extracted from createParentFromMetadata)
    async createNewParent(metadata, reader, pdfContext) {
        try {
            this.log('Creating new parent item...');
            
            // Validate metadata
            if (!metadata.title || metadata.title.trim().length === 0) {
                throw new Error('제목이 추출되지 않았습니다. 메타데이터가 불완전합니다.');
            }
            
            // Create new parent item
            const parentItem = new Zotero.Item('journalArticle');
            
            // Set basic fields
            parentItem.setField('title', metadata.title.trim());
            
            if (metadata.year && /^\d{4}$/.test(metadata.year)) {
                parentItem.setField('date', metadata.year);
            }
            
            if (metadata.journal && metadata.journal.trim()) {
                parentItem.setField('publicationTitle', metadata.journal.trim());
            }
            
            if (metadata.volume && metadata.volume.trim()) {
                parentItem.setField('volume', metadata.volume.trim());
            }
            
            if (metadata.issue && metadata.issue.trim()) {
                parentItem.setField('issue', metadata.issue.trim());
            }
            
            if (metadata.pages && metadata.pages.trim()) {
                parentItem.setField('pages', metadata.pages.trim());
            }
            
            if (metadata.doi && metadata.doi.trim()) {
                parentItem.setField('DOI', metadata.doi.trim());
            }
            
            if (metadata.abstract && metadata.abstract.trim()) {
                parentItem.setField('abstractNote', metadata.abstract.trim());
            }
            
            // Add authors
            if (metadata.authors && Array.isArray(metadata.authors)) {
                for (const authorName of metadata.authors) {
                    if (authorName && authorName.trim()) {
                        const creator = this.parseAuthorName(authorName.trim());
                        parentItem.setCreator(parentItem.numCreators(), creator);
                    }
                }
            } else if (metadata.authors && typeof metadata.authors === 'string') {
                // Fallback: if authors is a string, try to split it
                const authorsList = this.parseAuthorsString(metadata.authors);
                for (const authorName of authorsList) {
                    if (authorName && authorName.trim()) {
                        const creator = this.parseAuthorName(authorName.trim());
                        parentItem.setCreator(parentItem.numCreators(), creator);
                    }
                }
            }
            
            // Save parent item
            const parentID = await parentItem.saveTx();
            this.log('New parent item created with ID:', parentID);
            
            // Attach PDF to new parent
            const pdfItem = await Zotero.Items.getAsync(reader.itemID);
            if (pdfItem) {
                pdfItem.parentID = parentID;
                await pdfItem.saveTx();
                this.log('PDF attached to new parent');
            }
            
            // Show success message
            const abstractInfo = metadata.abstract && metadata.abstract.trim() ? `초록: ${metadata.abstract.substring(0, 100)}${metadata.abstract.length > 100 ? '...' : ''}` : '';
            let successMessage = `새로운 parent item이 생성되었습니다:\n\n` +
                `제목: ${metadata.title}\n` +
                `저자: ${metadata.authors.join(', ')}\n` +
                `저널: ${metadata.journal}\n` +
                `연도: ${metadata.year}`;
            
            if (abstractInfo) {
                successMessage += `\n${abstractInfo}`;
            }
            
            this.showMessage(
                'Parent 생성 완료',
                successMessage,
                'success'
            );
            
        } catch (error) {
            this.handleError(error, 'createNewParent');
            this.showMessage('Parent 생성 실패', error.message, 'error');
            throw error;
        }
    },
    
    // Create parent item from extracted metadata (for new parent only)
    async createParentFromMetadata(metadata, reader, pdfContext) {
        try {
            this.log('Creating parent item from metadata (new parent only)...');
            
            // This function is now only used when there's no existing parent
            // Existing parent handling is done in handleExistingParent()
            
            await this.createNewParent(metadata, reader, pdfContext);
            
        } catch (error) {
            this.handleError(error, 'createParentFromMetadata');
            throw error;
        }
    },
    
    // Show message to user
    showMessage(title, message, type = 'info') {
        try {
            const icon = {
                'success': '✅',
                'warning': '⚠️', 
                'error': '❌',
                'info': 'ℹ️'
            }[type] || 'ℹ️';
            
            alert(`${icon} ${title}\n\n${message}`);
            
        } catch (error) {
            this.log('Error showing message:', error.message);
        }
    },

    // Parse a single author name into firstName and lastName
    parseAuthorName(fullName) {
        if (!fullName || !fullName.trim()) {
            return {
                creatorType: 'author',
                name: ''
            };
        }

        const name = fullName.trim();
        
        // Check for comma-separated format: "Last, First"
        if (name.includes(',')) {
            const parts = name.split(',').map(part => part.trim());
            if (parts.length >= 2 && parts[0] && parts[1]) {
                return {
                    creatorType: 'author',
                    lastName: parts[0],
                    firstName: parts[1]
                };
            }
        }
        
        // Check for typical Western format: "First Last" or "First Middle Last"
        const parts = name.split(/\s+/);
        if (parts.length >= 2) {
            const lastName = parts[parts.length - 1];
            const firstName = parts.slice(0, -1).join(' ');
            
            if (firstName && lastName) {
                return {
                    creatorType: 'author',
                    lastName: lastName,
                    firstName: firstName
                };
            }
        }
        
        // Fallback: use as single name field (for names that don't follow typical patterns)
        return {
            creatorType: 'author',
            name: name
        };
    },

    // Parse authors from a string (fallback for non-array responses)
    parseAuthorsString(authorsString) {
        if (!authorsString || typeof authorsString !== 'string') {
            return [];
        }

        const authors = [];
        
        // Try different separators
        const separators = [';', ',', ' and ', ' & ', '\n'];
        let authorsList = [authorsString.trim()];
        
        for (const separator of separators) {
            if (authorsString.includes(separator)) {
                authorsList = authorsString.split(separator).map(author => author.trim());
                break;
            }
        }
        
        // Clean up and filter
        for (const author of authorsList) {
            const cleanAuthor = author.trim();
            if (cleanAuthor && 
                cleanAuthor.length > 1 && 
                !cleanAuthor.toLowerCase().includes('et al') &&
                !/^\d+$/.test(cleanAuthor)) {
                authors.push(cleanAuthor);
            }
        }
        
        return authors;
    },

    // Show preferences dialog (Zotero 7 compatible)
    showPreferencesDialog() {
        try {
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow) {
                this.log('No main window found');
                this.showInteractivePreferences();
                return;
            }
            
            // 먼저 테스트용 간단한 HTML 시도
            const testURL = this.rootURI + 'preferences/test.html';
            this.log('Testing with simple HTML at:', testURL);
            
            try {
                const testDialog = mainWindow.openDialog(
                    testURL,
                    'refsense-test',
                    'chrome,dialog,centerscreen,resizable,width=400,height=300',
                    null
                );
                this.log('Test dialog result:', testDialog ? 'success' : 'failed');
            } catch (testError) {
                this.log('Test dialog error:', testError.message);
            }
            
            // 실제 설정창 열기
            const preferencesURL = this.rootURI + 'prefs.html';
            this.log('Opening preferences with openDialog at:', preferencesURL);
            
            const dialog = mainWindow.openDialog(
                preferencesURL,
                'refsense-preferences',
                'chrome,dialog,centerscreen,resizable,width=600,height=500',
                null
            );
            
            if (dialog) {
                this.log('Preferences dialog opened successfully with openDialog');
            } else {
                this.log('openDialog failed, falling back to interactive preferences');
                this.showInteractivePreferences();
            }

        } catch (error) {
            this.handleError(error, 'showPreferencesDialog');
            this.log('openDialog error, falling back to interactive preferences');
            this.showInteractivePreferences();
        }
    },

    // Interactive preferences using native dialogs
    showInteractivePreferences() {
        try {
            // 현재 설정 상태 확인
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : null;
            const hasKey = currentKey && currentKey.length > 0;
            
            // 설정 상태 표시
            let message = '🤖 RefSense 설정\n\n';
            if (hasKey) {
                message += `✅ 현재 API 키: ${currentKey.substring(0, 15)}...\n\n`;
                message += '1. API 키 변경\n';
                message += '2. 연결 테스트\n';
                message += '3. 설정 확인\n';
                message += '4. 취소\n\n';
                message += '선택하세요 (1-4):';
            } else {
                message += '❌ API 키가 설정되지 않았습니다.\n\n';
                message += 'OpenAI API 키를 설정하시겠습니까?\n';
                message += '(확인: 설정, 취소: 나중에)';
            }
            
            if (hasKey) {
                // 기존 키가 있는 경우 - 옵션 선택
                const choice = prompt(message);
                
                switch (choice) {
                    case '1':
                        this.changeApiKey();
                        break;
                    case '2':
                        this.testApiConnection(currentKey);
                        break;
                    case '3':
                        this.showCurrentSettings();
                        break;
                    case '4':
                    default:
                        // 취소
                        break;
                }
            } else {
                // 키가 없는 경우 - 직접 설정
                if (confirm(message)) {
                    this.changeApiKey();
                }
            }
            
        } catch (error) {
            this.handleError(error, 'showInteractivePreferences');
            this.showSimplePreferencesDialog();
        }
    },

    // API 키 변경
    changeApiKey() {
        try {
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : '';
            
            let message = 'OpenAI API 키를 입력하세요:\n\n';
            message += '• sk-로 시작해야 합니다\n';
            message += '• OpenAI 계정에서 발급받은 키를 사용하세요\n';
            message += '• 취소하려면 빈 값을 입력하세요';
            
            const newKey = prompt(message, currentKey ? '' : 'sk-');
            
            if (newKey && newKey.trim()) {
                if (!newKey.startsWith('sk-')) {
                    alert('❌ 오류: OpenAI API 키는 sk-로 시작해야 합니다.');
                    return;
                }
                
                // 설정 저장
                Zotero.Prefs.set('extensions.refsense.openai_api_key', btoa(newKey.trim()));
                Zotero.Prefs.set('extensions.refsense.ai_backend', 'openai');
                Zotero.Prefs.set('extensions.refsense.openai_model', 'gpt-4-turbo');
                Zotero.Prefs.set('extensions.refsense.default_page_source', 'first');
                
                alert('✅ API 키가 저장되었습니다!\n\n이제 PDF에서 RefSense 버튼을 사용할 수 있습니다.');
                this.log('API key saved successfully');
                
            } else if (newKey === '') {
                // 취소
                return;
            }
            
        } catch (error) {
            this.handleError(error, 'changeApiKey');
            alert('❌ API 키 저장 중 오류가 발생했습니다.');
        }
    },

    // API 연결 테스트
    async testApiConnection(apiKey) {
        try {
            if (!apiKey) {
                alert('❌ API 키가 설정되지 않았습니다.');
                return;
            }
            
            // 간단한 연결 테스트 (실제 API 호출 없이)
            if (apiKey.startsWith('sk-') && apiKey.length > 40) {
                alert('✅ API 키 형식이 올바릅니다.\n\n실제 연결 테스트는 PDF에서 RefSense 버튼을 눌러 확인하세요.');
            } else {
                alert('❌ API 키 형식이 올바르지 않습니다.');
            }
            
        } catch (error) {
            this.handleError(error, 'testApiConnection');
            alert('❌ 연결 테스트 중 오류가 발생했습니다.');
        }
    },

    // 현재 설정 표시
    showCurrentSettings() {
        try {
            const settings = {
                apiKey: Zotero.Prefs.get('extensions.refsense.openai_api_key'),
                backend: Zotero.Prefs.get('extensions.refsense.ai_backend') || 'openai',
                model: Zotero.Prefs.get('extensions.refsense.openai_model') || 'gpt-4-turbo',
                pageSource: Zotero.Prefs.get('extensions.refsense.default_page_source') || 'first'
            };
            
            let message = '📋 현재 RefSense 설정:\n\n';
            message += `• AI 백엔드: ${settings.backend}\n`;
            message += `• 모델: ${settings.model}\n`;
            message += `• 페이지 추출: ${settings.pageSource}\n`;
            
            if (settings.apiKey) {
                const decodedKey = atob(settings.apiKey);
                message += `• API 키: ${decodedKey.substring(0, 15)}... (${decodedKey.length}자)`;
            } else {
                message += '• API 키: 설정되지 않음';
            }
            
            alert(message);
            
        } catch (error) {
            this.handleError(error, 'showCurrentSettings');
            alert('❌ 설정 조회 중 오류가 발생했습니다.');
        }
    },

    // HTML 내용을 문자열로 반환
    getPreferencesHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>RefSense 설정</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 20px;
            background: #f5f5f5;
        }
        
        .container {
            background: white;
            border-radius: 8px;
            padding: 24px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        
        h1 {
            margin: 0 0 24px 0;
            color: #333;
            font-size: 20px;
            font-weight: 600;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        label {
            display: block;
            margin-bottom: 6px;
            font-weight: 500;
            color: #555;
        }
        
        input[type="text"], input[type="password"], select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            box-sizing: border-box;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #007acc;
            box-shadow: 0 0 0 2px rgba(0,122,204,0.2);
        }
        
        .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 4px;
        }
        
        .button-group {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 32px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        
        button {
            padding: 8px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            background: white;
        }
        
        button.primary {
            background: #007acc;
            color: white;
            border-color: #007acc;
        }
        
        button:hover {
            background: #f0f0f0;
        }
        
        button.primary:hover {
            background: #005a9e;
        }
        
        .status-message {
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
            display: none;
        }
        
        .status-message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status-message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 RefSense 설정</h1>
        
        <div id="statusMessage" class="status-message"></div>
        
        <div class="form-group">
            <label for="openaiApiKey">OpenAI API 키</label>
            <input type="password" id="openaiApiKey" placeholder="sk-...">
            <div class="help-text">
                OpenAI 계정에서 발급받은 API 키를 입력하세요.
            </div>
        </div>
        
        <div class="form-group">
            <label for="openaiModel">모델</label>
            <select id="openaiModel">
                <option value="gpt-4-turbo">GPT-4 Turbo (권장)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
        </div>
        
        <div class="button-group">
            <button type="button" onclick="testConnection()">연결 테스트</button>
            <button type="button" class="primary" onclick="saveSettings()">저장</button>
        </div>
    </div>
    
    <script>
        console.log('RefSense 설정창 로드됨');
        
        // 설정 로드
        document.addEventListener('DOMContentLoaded', function() {
            loadSettings();
        });
        
        function loadSettings() {
            try {
                if (window.RefSensePlugin) {
                    // Plugin에서 설정 로드 (향후 구현)
                    console.log('Plugin 연결됨');
                }
                
                // Zotero.Prefs에서 설정 로드
                if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
                    const encodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
                    if (encodedKey) {
                        document.getElementById('openaiApiKey').value = atob(encodedKey);
                    }
                    
                    const model = Zotero.Prefs.get('extensions.refsense.openai_model');
                    if (model) {
                        document.getElementById('openaiModel').value = model;
                    }
                }
                
                console.log('설정 로드 완료');
            } catch (error) {
                console.error('설정 로드 실패:', error);
            }
        }
        
        function saveSettings() {
            try {
                const apiKey = document.getElementById('openaiApiKey').value.trim();
                
                if (!apiKey) {
                    showMessage('error', 'API 키를 입력해주세요.');
                    return;
                }
                
                if (!apiKey.startsWith('sk-')) {
                    showMessage('error', 'OpenAI API 키는 sk-로 시작해야 합니다.');
                    return;
                }
                
                const model = document.getElementById('openaiModel').value;
                
                // Zotero.Prefs에 저장
                if (typeof Zotero !== 'undefined' && Zotero.Prefs) {
                    Zotero.Prefs.set('extensions.refsense.openai_api_key', btoa(apiKey));
                    Zotero.Prefs.set('extensions.refsense.ai_backend', 'openai');
                    Zotero.Prefs.set('extensions.refsense.openai_model', model);
                    Zotero.Prefs.set('extensions.refsense.default_page_source', 'first');
                    
                    showMessage('success', 'API 키와 설정이 저장되었습니다!');
                    console.log('설정 저장 완료');
                } else {
                    showMessage('error', 'Zotero.Prefs에 접근할 수 없습니다.');
                }
                
            } catch (error) {
                console.error('설정 저장 실패:', error);
                showMessage('error', '설정 저장에 실패했습니다: ' + error.message);
            }
        }
        
        async function testConnection() {
            try {
                const apiKey = document.getElementById('openaiApiKey').value.trim();
                
                if (!apiKey) {
                    showMessage('error', '먼저 API 키를 입력해주세요.');
                    return;
                }
                
                showMessage('info', 'OpenAI 연결을 테스트하는 중...');
                
                const response = await fetch('https://api.openai.com/v1/models', {
                    headers: {
                        'Authorization': 'Bearer ' + apiKey
                    }
                });
                
                if (response.ok) {
                    showMessage('success', 'OpenAI 연결 성공!');
                } else {
                    showMessage('error', 'API 키가 유효하지 않습니다.');
                }
                
            } catch (error) {
                console.error('연결 테스트 실패:', error);
                showMessage('error', '연결 테스트에 실패했습니다: ' + error.message);
            }
        }
        
        function showMessage(type, text) {
            const messageDiv = document.getElementById('statusMessage');
            messageDiv.className = 'status-message ' + type;
            messageDiv.textContent = text;
            messageDiv.style.display = 'block';
            
            if (type === 'success' || type === 'info') {
                setTimeout(() => {
                    messageDiv.style.display = 'none';
                }, 3000);
            }
        }
    </script>
</body>
</html>`;
    },

    // Simple preferences dialog using multiple fallback methods
    showSimplePreferencesDialog() {
        try {
            // 현재 저장된 API 키 확인
            const currentEncodedKey = Zotero.Prefs.get('extensions.refsense.openai_api_key');
            const currentKey = currentEncodedKey ? atob(currentEncodedKey) : null;
            const hasKey = currentKey && currentKey.length > 0;
            
            let message = 'RefSense API 키 설정 안내:\n\n';
            if (hasKey) {
                message += `현재 설정된 API 키: ${currentKey.substring(0, 15)}...\n\n`;
                message += '새 API 키로 변경하려면 개발자 콘솔에서 다음 코드를 실행하세요:\n\n';
            } else {
                message += '현재 API 키가 설정되지 않았습니다.\n\n';
                message += 'API 키를 설정하려면 개발자 콘솔(F12)에서 다음 코드를 실행하세요:\n\n';
            }
            
            message += 'Zotero.Prefs.set("extensions.refsense.openai_api_key", btoa("sk-your-api-key-here"));\n';
            message += 'Zotero.Prefs.set("extensions.refsense.ai_backend", "openai");\n';
            message += 'Zotero.Prefs.set("extensions.refsense.openai_model", "gpt-4-turbo");\n\n';
            message += '위 코드에서 "sk-your-api-key-here"를 실제 OpenAI API 키로 교체하세요.';
            
            // 알림창으로 안내 표시
            this.showMessage('API 키 설정 안내', message, 'info');
            
        } catch (error) {
            this.handleError(error, 'showSimplePreferencesDialog');
            
            // 최후의 수단: 콘솔 로그로 안내
            this.log('=== RefSense API 키 설정 방법 ===');
            this.log('개발자 콘솔에서 다음 코드를 실행하세요:');
            this.log('Zotero.Prefs.set("extensions.refsense.openai_api_key", btoa("sk-your-api-key-here"));');
            this.log('Zotero.Prefs.set("extensions.refsense.ai_backend", "openai");');
            this.log('Zotero.Prefs.set("extensions.refsense.openai_model", "gpt-4-turbo");');
            this.log('=================================');
            
            this.showMessage('설정 안내', '개발자 콘솔을 확인하여 API 키 설정 방법을 참고하세요.', 'info');
        }
    },
    
    // Clean up resources
    cleanup() {
        try {
            // Stop reader monitoring
            if (this.readerMonitorInterval) {
                clearInterval(this.readerMonitorInterval);
                this.log('Stopped reader monitoring');
            }
            
            // Unregister notifier
            if (this.notifierID && Zotero.Notifier) {
                Zotero.Notifier.unregisterObserver(this.notifierID);
                this.log('Unregistered notifier:', this.notifierID);
            }
            
            // Try to clean up readers safely
            try {
                let readers = [];
                
                if (Zotero.Reader && typeof Zotero.Reader.getReaders === 'function') {
                    readers = Zotero.Reader.getReaders();
                } else if (Zotero.Reader && Zotero.Reader._readers) {
                    readers = Array.from(Zotero.Reader._readers.values() || []);
                }
                
                this.log('Cleaning up', readers.length, 'readers');
                
                for (let reader of readers) {
                    try {
                        // Try both iframe and window documents
                        const docs = [];
                        if (reader._iframeWindow && reader._iframeWindow.document) {
                            docs.push(reader._iframeWindow.document);
                        }
                        if (reader._window && reader._window.document) {
                            docs.push(reader._window.document);
                        }
                        
                        for (let doc of docs) {
                            // Remove simple button
                            const simpleBtn = doc.querySelector('#refsense-simple-btn');
                            if (simpleBtn) {
                                simpleBtn.remove();
                                this.log('Removed simple button from reader', reader.itemID);
                            }
                            
                            // Remove old style buttons too
                            const oldBtn = doc.querySelector('#refsense-extract-btn');
                            if (oldBtn) {
                                oldBtn.remove();
                                this.log('Removed old toolbar button from reader', reader.itemID);
                            }
                            
                            const floatingBtn = doc.querySelector('#refsense-floating-btn');
                            if (floatingBtn) {
                                floatingBtn.remove();
                                this.log('Removed floating button from reader', reader.itemID);
                            }
                        }
                    } catch (error) {
                        this.log('Error cleaning up reader buttons:', error.message);
                    }
                }
                
                // Also clean up any buttons that might have been added to the main window by mistake
                try {
                    if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                        const mainWindow = Zotero.getMainWindow();
                        if (mainWindow && mainWindow.document) {
                            const wrongButton = mainWindow.document.querySelector('#refsense-extract-btn');
                            if (wrongButton) {
                                wrongButton.remove();
                                this.log('Removed misplaced button from main window');
                            }
                        }
                    }
                } catch (error) {
                    this.log('Error cleaning up main window:', error.message);
                }
            } catch (error) {
                this.log('Error accessing readers during cleanup:', error.message);
            }
            
            this.log('Cleanup completed');
        } catch (error) {
            this.log('Error during cleanup:', error.message);
        }
    },
    
    // Logging utility
    log(message, ...args) {
        if (args.length > 0) {
            Zotero.debug(`[RefSense] ${message}`, args);
        } else {
            Zotero.debug(`[RefSense] ${message}`);
        }
    },
    
    // Error handling utility
    handleError(error, context = '') {
        const errorMessage = `[RefSense] Error${context ? ` in ${context}` : ''}: ${error.message}`;
        Zotero.debug(errorMessage);
        Zotero.debug(error.stack || 'No stack trace available');
    },


    // Process extracted metadata and create parent item
    async processExtractedMetadata(metadata, pdfContext) {
        this.log('Processing extracted metadata:', metadata);
        
        try {
            // Validate metadata quality
            if (!metadata || !metadata.title) {
                this.showMessage('메타데이터 부족', '추출된 정보가 부족합니다. 수동으로 메타데이터를 입력해주세요.', 'warning');
                return;
            }
            
            // Check confidence level
            if (metadata.confidence < 0.5) {
                this.showMessage('신뢰도 낮음', '추출된 정보의 신뢰도가 낮습니다. 결과를 확인해주세요.', 'warning');
            }
            
            // Create parent item
            await this.createParentItem(metadata, pdfContext);
            
        } catch (error) {
            this.handleError(error, 'processExtractedMetadata');
            this.showMessage('메타데이터 처리 실패', `처리 중 오류가 발생했습니다: ${error.message}`, 'error');
        }
    },

    // Create parent item from metadata (Stage 7 implementation)
    async createParentItem(metadata, pdfContext) {
        this.log('Creating parent item from metadata:', metadata);
        
        try {
            // Get the current PDF attachment item
            const pdfItem = await Zotero.Items.getAsync(pdfContext.itemID);
            if (!pdfItem) {
                throw new Error('PDF 항목을 찾을 수 없습니다');
            }
            
            // Check if parent already exists
            if (pdfItem.parentID) {
                const existingParent = await Zotero.Items.getAsync(pdfItem.parentID);
                if (existingParent) {
                    this.showMessage('부모 항목 존재', '이미 상위 항목이 존재합니다. 기존 항목을 수정하시겠습니까?', 'info');
                    return;
                }
            }
            
            // Determine item type
            const itemType = this.determineItemType(metadata);
            
            // Create new item
            const newItem = new Zotero.Item(itemType);
            
            // Set basic fields
            if (metadata.title) newItem.setField('title', metadata.title);
            if (metadata.year) newItem.setField('date', metadata.year.toString());
            if (metadata.journal) newItem.setField('publicationTitle', metadata.journal);
            if (metadata.volume) newItem.setField('volume', metadata.volume);
            if (metadata.issue) newItem.setField('issue', metadata.issue);
            if (metadata.pages) newItem.setField('pages', metadata.pages);
            if (metadata.doi) newItem.setField('DOI', metadata.doi);
            if (metadata.abstract) newItem.setField('abstractNote', metadata.abstract);
            
            // Add authors
            if (metadata.authors && Array.isArray(metadata.authors)) {
                for (const authorName of metadata.authors) {
                    if (authorName && authorName.trim()) {
                        const creator = {
                            firstName: '',
                            lastName: authorName.trim(),
                            creatorType: 'author'
                        };
                        
                        // Try to split name into first and last
                        const nameParts = authorName.trim().split(/\s+/);
                        if (nameParts.length > 1) {
                            creator.lastName = nameParts.pop();
                            creator.firstName = nameParts.join(' ');
                        }
                        
                        newItem.setCreator(newItem.numCreators(), creator);
                    }
                }
            }
            
            // Add tags/keywords
            if (metadata.keywords && Array.isArray(metadata.keywords)) {
                for (const keyword of metadata.keywords) {
                    if (keyword && keyword.trim()) {
                        newItem.addTag(keyword.trim());
                    }
                }
            }
            
            // Save the new item
            const newItemID = await newItem.saveTx();
            this.log('New parent item created with ID:', newItemID);
            
            // Set PDF as child of new item
            pdfItem.parentID = newItemID;
            await pdfItem.saveTx();
            
            this.log('PDF attached to new parent item');
            
            // Show success message
            this.showMessage('성공', `새로운 문헌 항목이 생성되었습니다: "${metadata.title}"`, 'success');
            
        } catch (error) {
            this.handleError(error, 'createParentItem');
            throw error;
        }
    },

    // Determine appropriate Zotero item type
    determineItemType(metadata) {
        // Default to journal article
        if (metadata.journal) {
            return 'journalArticle';
        }
        
        // Could add more logic here to detect other types
        // (book, conference paper, etc.)
        
        return 'journalArticle';
    },

    // Utility Methods
    
    // Logging function
    log(...args) {
        try {
            const timestamp = new Date().toISOString();
            const message = `[RefSense ${timestamp}]`;
            
            if (typeof Zotero !== 'undefined' && Zotero.debug) {
                Zotero.debug(`${message} ${args.join(' ')}`);
            } else {
                console.log(message, ...args);
            }
        } catch (error) {
            console.log('[RefSense Log Error]', ...args);
        }
    },

    // Error handling function
    handleError(error, context) {
        try {
            const errorMessage = `Error in ${context}: ${error.message}`;
            this.log('ERROR:', errorMessage);
            this.log('Stack:', error.stack);
            
            if (typeof Zotero !== 'undefined' && Zotero.debug) {
                Zotero.debug(`[RefSense Error] ${errorMessage}`, 1);
            }
        } catch (handlingError) {
            console.error('[RefSense] Error handling failed:', handlingError);
            console.error('[RefSense] Original error:', error);
        }
    },

    // Show message to user
    showMessage(title, message, type = 'info') {
        try {
            // Use Zotero's built-in notification system
            if (typeof Zotero !== 'undefined' && Zotero.alert) {
                // For critical messages, use alert
                if (type === 'error') {
                    Zotero.alert(null, title, message);
                } else {
                    // For info/warning/success, use the progress window system
                    this.showProgressMessage(title, message, type);
                }
            } else {
                // Fallback to browser alert
                alert(`${title}: ${message}`);
            }
            
            // Always log the message
            this.log(`Message [${type}] ${title}: ${message}`);
            
        } catch (error) {
            this.log('Failed to show message:', error.message);
            // Ultimate fallback
            console.log(`[RefSense ${type.toUpperCase()}] ${title}: ${message}`);
        }
    },

    // Show progress/status message using Zotero's progress system
    showProgressMessage(title, message, type = 'info') {
        try {
            if (typeof Zotero !== 'undefined' && Zotero.ProgressWindow) {
                const progressWindow = new Zotero.ProgressWindow({ closeOnClick: true });
                progressWindow.changeHeadline(title);
                
                let icon;
                switch (type) {
                    case 'success':
                        icon = 'chrome://zotero/skin/tick.png';
                        break;
                    case 'warning':
                        icon = 'chrome://zotero/skin/warning.png';
                        break;
                    case 'error':
                        icon = 'chrome://zotero/skin/cross.png';
                        break;
                    default:
                        icon = 'chrome://zotero/skin/toolbar-advanced-search.png';
                }
                
                progressWindow.addDescription(message, icon);
                progressWindow.show();
                progressWindow.startCloseTimer(4000); // Auto-close after 4 seconds
            }
        } catch (error) {
            this.log('Progress message failed:', error.message);
        }
    },

    // Show dialog for parent item update options
    showParentUpdateDialog(existingTitle, metadata) {
        const dialog = Services.prompt;
        const title = "기존 Parent Item 발견";
        const message = 
            `이 PDF는 이미 parent item이 있습니다:\n` +
            `"${existingTitle}"\n\n` +
            `새로 추출된 정보:\n` +
            `제목: ${metadata.title}\n` +
            `저자: ${metadata.authors.join(', ')}\n` +
            `연도: ${metadata.year}\n` +
            `저널: ${metadata.journal}\n\n` +
            `어떻게 처리하시겠습니까?`;

        const buttons = ["기존 정보 업데이트", "새 Parent 생성", "취소"];
        
        try {
            const result = dialog.confirmEx(
                null, // parent window
                title,
                message,
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_0) +
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_1) +
                (dialog.BUTTON_TITLE_IS_STRING * dialog.BUTTON_POS_2),
                buttons[0], // button 0 text
                buttons[1], // button 1 text  
                buttons[2], // button 2 text
                null, // checkbox text
                {} // checkbox state
            );
            
            switch (result) {
                case 0: return 'update';   // 기존 정보 업데이트
                case 1: return 'new';      // 새 Parent 생성
                case 2: return 'cancel';   // 취소
                default: return 'cancel';
            }
        } catch (error) {
            this.log('Dialog error, falling back to simple confirm:', error.message);
            // Fallback to simple confirm dialog
            const simpleChoice = confirm(
                `${message}\n\n기존 정보를 업데이트하시겠습니까?\n` +
                `(취소하면 새 Parent를 생성합니다)`
            );
            return simpleChoice ? 'update' : 'new';
        }
    },

    // Update existing parent item with new metadata
    async updateExistingParent(parentID, metadata) {
        try {
            this.log(`Updating existing parent item: ${parentID}`);
            
            const parentItem = await Zotero.Items.getAsync(parentID);
            if (!parentItem) {
                throw new Error('기존 parent item을 찾을 수 없습니다.');
            }

            // Start transaction
            await Zotero.DB.executeTransaction(async () => {
                // Update basic fields
                if (metadata.title && metadata.title.trim()) {
                    parentItem.setField('title', metadata.title.trim());
                }
                
                if (metadata.year && metadata.year.toString().trim()) {
                    parentItem.setField('date', metadata.year.toString().trim());
                }
                
                if (metadata.journal && metadata.journal.trim()) {
                    parentItem.setField('publicationTitle', metadata.journal.trim());
                }
                
                if (metadata.doi && metadata.doi.trim()) {
                    parentItem.setField('DOI', metadata.doi.trim());
                }
                
                if (metadata.abstract && metadata.abstract.trim()) {
                    parentItem.setField('abstractNote', metadata.abstract.trim());
                }
                
                if (metadata.pages && metadata.pages.trim()) {
                    parentItem.setField('pages', metadata.pages.trim());
                }
                
                if (metadata.volume && metadata.volume.trim()) {
                    parentItem.setField('volume', metadata.volume.trim());
                }
                
                if (metadata.issue && metadata.issue.trim()) {
                    parentItem.setField('issue', metadata.issue.trim());
                }

                // Clear existing creators and add new ones
                if (metadata.authors && metadata.authors.length > 0) {
                    parentItem.setCreators([]);
                    
                    for (const authorName of metadata.authors) {
                        if (authorName && authorName.trim()) {
                            const creator = {
                                creatorType: 'author',
                                name: authorName.trim()
                            };
                            
                            // Try to split name into first/last if it contains comma or multiple words
                            const nameParts = authorName.trim().split(/,\s*|\s+/);
                            if (nameParts.length >= 2) {
                                creator.lastName = nameParts[0];
                                creator.firstName = nameParts.slice(1).join(' ');
                                delete creator.name;
                            }
                            
                            parentItem.setCreator(parentItem.numCreators(), creator);
                        }
                    }
                }

                // Save the item
                await parentItem.save();
                
                this.log('Parent item updated successfully');
                this.showMessage(
                    '정보 업데이트 완료',
                    `기존 parent item이 새로운 정보로 업데이트되었습니다.\n\n제목: ${metadata.title}`,
                    'success'
                );
                
                return parentItem;
            });

        } catch (error) {
            this.error('Failed to update existing parent:', error);
            this.showMessage(
                '업데이트 실패',
                `기존 parent item 업데이트 중 오류가 발생했습니다: ${error.message}`,
                'error'
            );
            throw error;
        }
    },

    // Get metadata from existing parent item
    async getExistingParentMetadata(parentID) {
        try {
            const parentItem = await Zotero.Items.getAsync(parentID);
            if (!parentItem) {
                throw new Error('Parent item not found');
            }

            const metadata = {
                title: parentItem.getField('title') || '',
                year: parentItem.getField('date') || '',
                journal: parentItem.getField('publicationTitle') || '',
                doi: parentItem.getField('DOI') || '',
                abstract: parentItem.getField('abstractNote') || '',
                pages: parentItem.getField('pages') || '',
                volume: parentItem.getField('volume') || '',
                issue: parentItem.getField('issue') || '',
                authors: []
            };

            // Get authors
            const creators = parentItem.getCreators();
            for (const creator of creators) {
                if (creator.creatorType === 'author') {
                    if (creator.name) {
                        metadata.authors.push(creator.name);
                    } else if (creator.firstName && creator.lastName) {
                        metadata.authors.push(`${creator.firstName} ${creator.lastName}`);
                    } else if (creator.lastName) {
                        metadata.authors.push(creator.lastName);
                    }
                }
            }

            return metadata;
        } catch (error) {
            this.error('Failed to get existing parent metadata:', error);
            throw error;
        }
    },

    // Show metadata comparison dialog with field-by-field selection
    async showMetadataComparisonDialog(parentID, newMetadata) {
        try {
            this.log('🟡 [DEBUG] Starting metadata comparison dialog for parent ID:', parentID);
            const existingMetadata = await this.getExistingParentMetadata(parentID);
            this.log('🟡 [DEBUG] Existing metadata:', existingMetadata);
            this.log('🟡 [DEBUG] New metadata:', newMetadata);
            
            // Create HTML-based comparison dialog for Zotero 7
            const comparisonContent = this.createComparisonContent(existingMetadata, newMetadata);
            this.log('🟡 [DEBUG] Comparison content created, about to show dialog...');
            
            // Use custom dialog system with delay to ensure document is ready
            const result = await new Promise((resolve) => {
                const dialogData = {
                    title: '기존 Parent Item 업데이트',
                    content: comparisonContent,
                    buttons: [
                        { label: '새 Parent 생성', action: 'cancel' },
                        { label: '모두 기존 값', action: 'all_existing' },
                        { label: '모두 새 값', action: 'all_new' },
                        { label: '선택한 항목 적용', action: 'apply', default: true }
                    ],
                    wide: true,
                    callback: (action, contentElement) => {
                        if (action === 'apply') {
                            // Collect user selections
                            const selections = this.collectFieldSelections(contentElement);
                            resolve(selections);
                            return true; // Close dialog
                        } else if (action === 'all_existing') {
                            // Select all existing values
                            this.selectAllFields('existing', contentElement);
                            return false; // Don't close dialog
                        } else if (action === 'all_new') {
                            // Select all new values
                            this.selectAllFields('new', contentElement);
                            return false; // Don't close dialog
                        } else {
                            resolve('create_new'); // Create new parent instead
                            return true; // Close dialog
                        }
                    }
                };
                
                // Add small delay to ensure DOM is ready
                setTimeout(() => {
                    this.showCustomDialog(dialogData);
                }, 100);
            });
            
            this.log('🟡 [DEBUG] Dialog closed, result:', result);
            return result;
            
        } catch (error) {
            this.handleError(error, 'showMetadataComparisonDialog');
            
            // Show error to user and don't update anything
            this.showMessage(
                '비교 대화상자 오류',
                '메타데이터 비교 대화상자를 표시하는 중 오류가 발생했습니다. 기존 정보는 변경되지 않습니다.',
                'error'
            );
            
            // Return null to cancel operation
            return null;
        }
    },

    // Create HTML-based comparison content for Zotero 7
    createComparisonContent(existing, newData) {
        try {
            const fields = [
                { key: 'title', label: '제목' },
                { key: 'authors', label: '저자' },
                { key: 'year', label: '연도' },
                { key: 'journal', label: '저널' },
                { key: 'doi', label: 'DOI' },
                { key: 'abstract', label: '초록' },
                { key: 'pages', label: '페이지' },
                { key: 'volume', label: '볼륨' },
                { key: 'issue', label: '이슈' }
            ];

        const truncateText = (text, maxLength = 80) => {
            return text && text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const formatValue = (value, fieldKey) => {
            if (fieldKey === 'authors' && Array.isArray(value)) {
                return value.join(', ');
            }
            return value || '';
        };

        const escapeHtml = (text) => {
            if (!text) return '';
            try {
                return text.toString()
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/\n/g, ' ')           // Replace newlines with spaces
                    .replace(/\r/g, ' ')           // Replace carriage returns
                    .replace(/\t/g, ' ')           // Replace tabs
                    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove ASCII + Latin-1 control chars
                    .replace(/[\u2000-\u200F\u2028-\u202F]/g, ' ') // Replace Unicode whitespace
                    .replace(/[\uFEFF\uFFFE\uFFFF]/g, '') // Remove BOM and other problematic chars
                    .replace(/[\uD800-\uDFFF]/g, ''); // Remove unpaired surrogate characters
            } catch (error) {
                this.log('🟡 [ERROR] HTML escaping failed:', error.message);
                return String(text).replace(/[<>&"']/g, ''); // Fallback: basic cleanup
            }
        };

        const rowsHTML = fields.map(field => {
            const existingValue = formatValue(existing[field.key], field.key);
            const newValue = formatValue(newData[field.key], field.key);
            const existingDisplay = escapeHtml(truncateText(existingValue) || '(비어있음)');
            const newDisplay = escapeHtml(truncateText(newValue) || '(비어있음)');
            const existingTitle = escapeHtml(existingValue);
            const newTitle = escapeHtml(newValue);

            return `
                <tr class="comparison-row" data-field="${field.key}">
                    <td style="font-weight: bold; padding: 8px; border-right: 1px solid #ddd; background: #f5f5f5;">
                        ${field.label}
                    </td>
                    <td style="padding: 8px; border-right: 1px solid #ddd;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="field_${field.key}" value="existing" style="margin-right: 8px;">
                            <span title="${existingTitle}" style="color: ${existingValue ? '#333' : '#999'}; ${existingValue ? '' : 'font-style: italic;'}">
                                ${existingDisplay}
                            </span>
                        </label>
                    </td>
                    <td style="padding: 8px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="field_${field.key}" value="new" style="margin-right: 8px;" checked>
                            <span title="${newTitle}" style="color: ${newValue ? '#333' : '#999'}; ${newValue ? '' : 'font-style: italic;'}">
                                ${newDisplay}
                            </span>
                        </label>
                    </td>
                </tr>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f4f8; border-radius: 5px;">
                <div style="font-weight: bold; margin-bottom: 5px;">기존 정보와 AI 추출 정보 비교</div>
                <div style="font-size: 0.9em; color: #666;">이 PDF에는 이미 Parent Item이 있습니다. 각 필드에서 사용할 값을 선택하세요.</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">기본적으로 새로 추출된 값이 선택되어 있습니다.</div>
            </div>
            
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f0f0f0; font-weight: bold;">
                            <th style="padding: 10px; text-align: left; width: 20%; border-right: 1px solid #ddd;">필드</th>
                            <th style="padding: 10px; text-align: left; width: 40%; border-right: 1px solid #ddd;">기존 값</th>
                            <th style="padding: 10px; text-align: left; width: 40%;">새로 추출된 값</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 15px; text-align: center; font-size: 0.9em; color: #666;">
                <strong>팁:</strong> 각 행을 클릭하여 선택하거나, 상단 버튼으로 일괄 선택할 수 있습니다.
            </div>
        `;
    } catch (error) {
        this.log('🟡 [ERROR] createComparisonContent failed:', error.message);
        this.log('🟡 [ERROR] Stack trace:', error.stack);
        return `
            <div style="padding: 20px; text-align: center; color: #666;">
                <div style="margin-bottom: 10px;">⚠️ 비교 대화상자 생성 중 오류가 발생했습니다</div>
                <div style="font-size: 0.9em;">오류: ${this.escapeHtml(error.message)}</div>
                <div style="margin-top: 15px; font-size: 0.9em;">
                    기존 Parent Item을 유지하려면 '취소'를 클릭하세요.
                </div>
            </div>
        `;
    }
    },

    // Collect user field selections from comparison dialog
    collectFieldSelections(contentElement) {
        const selections = {};
        const fields = ['title', 'authors', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue'];
        
        for (const field of fields) {
            const radios = contentElement.querySelectorAll(`input[name="field_${field}"]`);
            for (const radio of radios) {
                if (radio.checked) {
                    selections[field] = radio.value;
                    break;
                }
            }
        }
        
        return selections;
    },

    // Select all fields to either 'existing' or 'new'
    selectAllFields(choice, contentElement) {
        const fields = ['title', 'authors', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue'];
        
        for (const field of fields) {
            const radio = contentElement.querySelector(`input[name="field_${field}"][value="${choice}"]`);
            if (radio) {
                radio.checked = true;
            }
        }
    },

    // Update existing parent with selective fields
    async updateExistingParentSelective(parentID, selection) {
        try {
            this.log(`🟢 [DEBUG] Updating existing parent item selectively: ${parentID}`);
            this.log('🟢 [DEBUG] User selection:', selection);
            
            const parentItem = await Zotero.Items.getAsync(parentID);
            const existingMetadata = await this.getExistingParentMetadata(parentID);
            
            if (!parentItem) {
                throw new Error('기존 parent item을 찾을 수 없습니다.');
            }

            // Determine final values based on selection
            const finalValues = {};
            const fields = ['title', 'year', 'journal', 'doi', 'abstract', 'pages', 'volume', 'issue', 'authors'];
            
            for (const field of fields) {
                if (selection[field] === 'existing') {
                    finalValues[field] = existingMetadata[field];
                } else {
                    finalValues[field] = this.currentNewMetadata[field]; // Store new metadata for reference
                }
            }

            // Start transaction
            await Zotero.DB.executeTransaction(async () => {
                // Update basic fields only if they were selected as 'new'
                if (selection.title === 'new' && finalValues.title && finalValues.title.trim()) {
                    parentItem.setField('title', finalValues.title.trim());
                }
                
                if (selection.year === 'new' && finalValues.year && finalValues.year.toString().trim()) {
                    parentItem.setField('date', finalValues.year.toString().trim());
                }
                
                if (selection.journal === 'new' && finalValues.journal && finalValues.journal.trim()) {
                    parentItem.setField('publicationTitle', finalValues.journal.trim());
                }
                
                if (selection.doi === 'new' && finalValues.doi && finalValues.doi.trim()) {
                    parentItem.setField('DOI', finalValues.doi.trim());
                }
                
                if (selection.abstract === 'new' && finalValues.abstract && finalValues.abstract.trim()) {
                    parentItem.setField('abstractNote', finalValues.abstract.trim());
                }
                
                if (selection.pages === 'new' && finalValues.pages && finalValues.pages.trim()) {
                    parentItem.setField('pages', finalValues.pages.trim());
                }
                
                if (selection.volume === 'new' && finalValues.volume && finalValues.volume.trim()) {
                    parentItem.setField('volume', finalValues.volume.trim());
                }
                
                if (selection.issue === 'new' && finalValues.issue && finalValues.issue.trim()) {
                    parentItem.setField('issue', finalValues.issue.trim());
                }

                // Update authors only if selected as 'new'
                if (selection.authors === 'new' && finalValues.authors && finalValues.authors.length > 0) {
                    parentItem.setCreators([]);
                    
                    for (const authorName of finalValues.authors) {
                        if (authorName && authorName.trim()) {
                            const creator = {
                                creatorType: 'author',
                                name: authorName.trim()
                            };
                            
                            // Try to split name into first/last if it contains comma or multiple words
                            const nameParts = authorName.trim().split(/,\s*|\s+/);
                            if (nameParts.length >= 2) {
                                creator.lastName = nameParts[0];
                                creator.firstName = nameParts.slice(1).join(' ');
                                delete creator.name;
                            }
                            
                            parentItem.setCreator(parentItem.numCreators(), creator);
                        }
                    }
                }

                // Save the item
                await parentItem.save();
                
                this.log('Parent item updated selectively');
                
                // Count updated fields
                const updatedFields = Object.values(selection).filter(val => val === 'new').length;
                
                this.showMessage(
                    '선택적 업데이트 완료',
                    `${updatedFields}개 필드가 새로운 정보로 업데이트되었습니다.`,
                    'success'
                );
                
                return parentItem;
            });

        } catch (error) {
            this.error('Failed to update existing parent selectively:', error);
            this.showMessage(
                '선택적 업데이트 실패',
                `선택적 업데이트 중 오류가 발생했습니다: ${error.message}`,
                'error'
            );
            throw error;
        }
    },

    // Show metadata preview dialog for user confirmation (Zotero 7 compatible)
    async showMetadataPreview(metadata, pdfContext) {
        try {
            this.log('Showing metadata preview dialog');
            
            // Create simple HTML-based dialog content
            const previewContent = this.createPreviewContent(metadata, pdfContext);
            
            // Use Zotero's built-in dialog system
            const result = await new Promise((resolve) => {
                const dialogData = {
                    title: 'AI 추출 메타데이터 미리보기',
                    content: previewContent,
                    buttons: [
                        { label: '취소', action: 'cancel' },
                        { label: '편집 후 생성', action: 'edit' },
                        { label: '확인 및 생성', action: 'accept', default: true }
                    ],
                    callback: (action, data) => {
                        resolve({ action, data });
                    }
                };
                
                this.showCustomDialog(dialogData);
            });
            
            if (result.action === 'accept' || result.action === 'edit') {
                this.log('User confirmed metadata preview');
                return { metadata: result.data || metadata };
            } else {
                this.log('User cancelled metadata preview');
                return null;
            }
            
        } catch (error) {
            this.handleError(error, 'showMetadataPreview');
            
            // Fallback to simple confirmation dialog
            const window = Services.wm.getMostRecentWindow('navigator:browser');
            const confirmed = window.confirm(
                `AI가 추출한 메타데이터:\n\n` +
                `제목: ${metadata.title || '(없음)'}\n` +
                `저자: ${metadata.authors || '(없음)'}\n` +
                `저널: ${metadata.journal || '(없음)'}\n` +
                `연도: ${metadata.year || '(없음)'}\n` +
                `DOI: ${metadata.doi || '(없음)'}\n\n` +
                `이 정보로 Parent Item을 생성하시겠습니까?`
            );
            
            return confirmed ? { metadata } : null;
        }
    },

    // Create custom dialog for Zotero 7
    showCustomDialog(dialogData) {
        // Try to find a window with ready document
        let window = Services.wm.getMostRecentWindow('navigator:browser');
        
        // If main window doesn't have body, try other approaches
        if (!window || !window.document || !window.document.body) {
            // Try Zotero main window
            if (typeof Zotero !== 'undefined' && Zotero.getMainWindow) {
                window = Zotero.getMainWindow();
                this.log('🟡 [DEBUG] Trying Zotero.getMainWindow()');
            }
            
            // Try all open windows
            if (!window || !window.document || !window.document.body) {
                const windowEnum = Services.wm.getEnumerator('navigator:browser');
                while (windowEnum.hasMoreElements()) {
                    const testWindow = windowEnum.getNext();
                    if (testWindow.document && testWindow.document.body) {
                        window = testWindow;
                        this.log('🟡 [DEBUG] Found window with ready document');
                        break;
                    }
                }
            }
        }
        
        // Final check - if still no good window, use fallback
        if (!window || !window.document || !window.document.body) {
            this.log('🟡 [ERROR] Document or body not ready, using alternative approach');
            // Use Zotero's built-in prompt system as fallback
            this.showFallbackSelectionDialog(dialogData);
            return;
        }
        
        // Create modal overlay
        const overlay = window.document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create dialog box
        const dialog = window.document.createElement('div');
        const maxWidth = dialogData.wide ? '900px' : '600px';
        dialog.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: ${maxWidth};
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        // Add title
        const title = window.document.createElement('h2');
        title.textContent = dialogData.title;
        title.style.cssText = 'margin-top: 0; margin-bottom: 15px; color: #333;';
        dialog.appendChild(title);
        
        // Add content with enhanced error handling
        const content = window.document.createElement('div');
        try {
            // Validate content before setting innerHTML
            if (!dialogData.content || typeof dialogData.content !== 'string') {
                throw new Error('Invalid content type');
            }
            
            // Test if content can be parsed as HTML
            const testDiv = window.document.createElement('div');
            testDiv.innerHTML = dialogData.content;
            
            // If successful, set the actual content
            content.innerHTML = dialogData.content;
            this.log('🟢 [DEBUG] HTML content set successfully');
            
        } catch (htmlError) {
            this.log('🟡 [ERROR] HTML content error:', htmlError.message);
            // If HTML parsing fails, show simple text
            content.textContent = `HTML 콘텐츠를 표시할 수 없습니다: ${htmlError.message}\n\n대화상자를 닫고 다시 시도해주세요.`;
            content.style.cssText = 'padding: 20px; text-align: center; color: #666; white-space: pre-line;';
        }
        dialog.appendChild(content);
        
        // Add buttons
        const buttonContainer = window.document.createElement('div');
        buttonContainer.style.cssText = 'margin-top: 20px; text-align: right;';
        
        dialogData.buttons.forEach((button, index) => {
            const btn = window.document.createElement('button');
            btn.textContent = button.label;
            btn.style.cssText = `
                margin-left: 10px;
                padding: 8px 16px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: ${button.default ? '#007cba' : 'white'};
                color: ${button.default ? 'white' : '#333'};
                cursor: pointer;
            `;
            
            btn.addEventListener('click', () => {
                // Call callback first to get result
                const shouldClose = dialogData.callback(button.action, content);
                
                // Close dialog unless callback returns false
                if (shouldClose !== false) {
                    window.document.body.removeChild(overlay);
                }
            });
            
            buttonContainer.appendChild(btn);
        });
        
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        window.document.body.appendChild(overlay);
        
        // Focus on default button
        const defaultBtn = buttonContainer.querySelector('button:last-child');
        if (defaultBtn) defaultBtn.focus();
    },

    // Fallback selection dialog using Zotero services
    showFallbackSelectionDialog(dialogData) {
        try {
            this.log('🟡 [DEBUG] Showing fallback selection dialog');
            
            // Use setTimeout to ensure proper execution context
            setTimeout(() => {
                try {
                    // Use Services.prompt for cross-platform compatibility
                    const prompts = Services.prompt;
                    const title = "메타데이터 비교";
                    const text = `기존 Parent Item이 발견되었습니다.\n\n어떻게 처리하시겠습니까?`;
                    
                    const button0 = "새 Parent 생성";
                    const button1 = "모두 새 값으로 업데이트";  
                    const button2 = "취소 (기존 값 유지)";
                    
                    const flags = prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_0 +
                                 prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_1 +
                                 prompts.BUTTON_TITLE_IS_STRING * prompts.BUTTON_POS_2;
                    
                    const result = prompts.confirmEx(
                        null, // parent window
                        title,
                        text,
                        flags,
                        button0,
                        button1, 
                        button2,
                        null, // checkbox text
                        {} // checkbox state
                    );
                    
                    this.log('🟡 [DEBUG] Fallback dialog result:', result);
                    
                    // Process result
                    if (dialogData.callback) {
                        switch (result) {
                            case 0: // 새 Parent 생성
                                dialogData.callback('create_new', null);
                                break;
                            case 1: // 모두 새 값으로 업데이트
                                dialogData.callback('all_new', null);
                                break;
                            case 2: // 취소
                            default:
                                dialogData.callback('cancel', null);
                                break;
                        }
                    }
                    
                } catch (promptError) {
                    this.log('🟡 [ERROR] Fallback prompt failed:', promptError.message);
                    // Final fallback - just callback with cancel
                    if (dialogData.callback) {
                        dialogData.callback('cancel', null);
                    }
                }
            }, 100);
            
        } catch (error) {
            this.log('🟡 [ERROR] showFallbackSelectionDialog failed:', error.message);
            // Final fallback
            if (dialogData.callback) {
                dialogData.callback('cancel', null);
            }
        }
    },

    // Create preview content HTML
    createPreviewContent(metadata, pdfContext) {
        try {
            const fields = [
                { key: 'title', label: '제목' },
                { key: 'authors', label: '저자' },
                { key: 'year', label: '연도' },
                { key: 'journal', label: '저널' },
                { key: 'doi', label: 'DOI' },
                { key: 'abstract', label: '초록' },
                { key: 'pages', label: '페이지' },
                { key: 'volume', label: '권' },
                { key: 'issue', label: '호' }
            ];
        
        const fieldsHTML = fields.map(field => {
            const value = metadata[field] || '';
            const displayValue = value || '(비어있음)';
            const isEmpty = !value;
            
            return `
                <div style="margin-bottom: 12px; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <div style="font-weight: bold; margin-bottom: 4px; color: #333;">
                        ${field.label}
                    </div>
                    <div style="background: #f9f9f9; padding: 6px; border-radius: 3px; ${isEmpty ? 'color: #999; font-style: italic;' : ''} ${field.key === 'abstract' ? 'max-height: 120px;' : 'max-height: 60px;'} overflow-y: auto; line-height: 1.4;">
                        ${this.escapeHtml(displayValue)}
                    </div>
                </div>
            `;
        }).join('');
        
        return `
            <div style="margin-bottom: 15px; padding: 10px; background: #e8f4f8; border-radius: 5px;">
                <div style="font-weight: bold;">PDF 파일: ${pdfContext.filename || 'Unknown'}</div>
                <div style="font-size: 0.9em; color: #666;">추출 방법: AI 메타데이터 추출</div>
            </div>
            <div style="max-height: 400px; overflow-y: auto;">
                ${fieldsHTML}
            </div>
            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; text-align: center;">
                확인: 그대로 생성 | 편집: 수정 후 생성 | 취소: 작업 중단
            </div>
        `;
        } catch (error) {
            this.log('🟡 [ERROR] createPreviewContent failed:', error.message);
            return `
                <div style="padding: 20px; text-align: center; color: #666;">
                    <div style="margin-bottom: 10px;">⚠️ 미리보기 생성 중 오류가 발생했습니다</div>
                    <div style="font-size: 0.9em;">오류: ${this.escapeHtml(error.message)}</div>
                    <div style="margin-top: 15px;">
                        <div style="font-weight: bold;">추출된 기본 정보:</div>
                        <div>제목: ${this.escapeHtml(metadata.title || '추출 실패')}</div>
                        <div>저자: ${this.escapeHtml(metadata.authors ? String(metadata.authors) : '추출 실패')}</div>
                    </div>
                </div>
            `;
        }
    },

    // Collect edited metadata (placeholder for future edit functionality)
    collectEditedMetadata(contentElement) {
        // For now, return original metadata
        // In the future, this could collect edited values from input fields
        return null;
    }
};

// Plugin lifecycle functions for Zotero
function startup({ id, version, rootURI }) {
    try {
        RefSense.Plugin.id = id;
        RefSense.Plugin.version = version;
        RefSense.Plugin.rootURI = rootURI;
        
        // Make sure RefSense is globally accessible after plugin loads
        const mainWindow = Services.wm.getMostRecentWindow('navigator:browser');
        if (mainWindow) {
            mainWindow.RefSense = RefSense;
        }
        
        RefSense.Plugin.startup();
    } catch (error) {
        if (typeof Zotero !== 'undefined' && Zotero.debug) {
            Zotero.debug(`[RefSense] Startup error: ${error.message}`);
        }
    }
}

function shutdown() {
    try {
        if (RefSense && RefSense.Plugin) {
            RefSense.Plugin.shutdown();
        }
    } catch (error) {
        if (typeof Zotero !== 'undefined' && Zotero.debug) {
            Zotero.debug(`[RefSense] Shutdown error: ${error.message}`);
        }
    }
}

function install() {
    if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug('[RefSense] Plugin installed');
    }
}

function startup() {
    if (typeof Zotero !== 'undefined' && RefSense && RefSense.Plugin) {
        RefSense.Plugin.startup();
    }
}

function uninstall() {
    if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug('[RefSense] Plugin uninstalled');
    }
}