// RefSense Preferences Script - Message-based communication
console.log('RefSense 설정창 스크립트 로드됨 (메시지 방식)');

// DOM이 로드되면 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializePreferences();
});

function initializePreferences() {
    console.log('RefSense 설정창 초기화 시작');
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 메시지 리스너 등록
    setupMessageListener();
    
    // 설정 로드 요청
    requestSettings();
    
    console.log('RefSense 설정창 초기화 완료');
}

function setupEventListeners() {
    // 백엔드 선택 라디오 버튼
    document.getElementById('radio-ollama').addEventListener('change', function() {
        if (this.checked) selectBackend('ollama');
    });
    
    document.getElementById('radio-openai').addEventListener('change', function() {
        if (this.checked) selectBackend('openai');
    });
    
    // 백엔드 선택 영역 클릭
    document.getElementById('backend-ollama').addEventListener('click', function() {
        selectBackend('ollama');
    });
    
    document.getElementById('backend-openai').addEventListener('click', function() {
        selectBackend('openai');
    });
    
    // 페이지 소스 변경
    document.getElementById('pageSource').addEventListener('change', togglePageRange);
    
    // 버튼 이벤트
    document.querySelector('button[data-action="test"]').addEventListener('click', testConnection);
    document.querySelector('button[data-action="cancel"]').addEventListener('click', function() {
        window.close();
    });
    document.querySelector('button[data-action="save"]').addEventListener('click', saveSettings);
}

function setupMessageListener() {
    window.addEventListener('message', function(event) {
        // 보안: 메시지 검증 및 origin 확인
        if (!event.data || !event.data.type || !event.data.type.startsWith('refsense-')) {
            return;
        }
        
        // 보안: 부모 윈도우에서만 메시지 허용
        if (event.source !== window.parent) {
            console.log('❌ 허용되지 않은 source에서 메시지');
            return;
        }
        
        console.log('받은 메시지:', event.data.type);
        
        switch (event.data.type) {
            case 'refsense-settings-response':
                loadSettingsFromMessage(event.data.settings);
                break;
                
            case 'refsense-settings-error':
                showMessage('error', '설정 로드 실패: ' + event.data.error);
                loadDefaultSettings();
                break;
                
            case 'refsense-save-response':
                if (event.data.success) {
                    showMessage('success', '설정이 저장되었습니다!');
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                }
                break;
                
            case 'refsense-save-error':
                showMessage('error', '설정 저장 실패: ' + event.data.error);
                break;
                
            case 'refsense-test-response':
                if (event.data.success) {
                    showMessage('success', event.data.message);
                } else {
                    showMessage('error', event.data.message);
                }
                break;
                
            case 'refsense-test-error':
                showMessage('error', '연결 테스트 실패: ' + event.data.error);
                break;
        }
    });
}

function requestSettings() {
    console.log('설정 요청 시작');
    
    // 1. 전역 핸들러를 통한 직접 호출 시도
    try {
        if (typeof globalThis !== 'undefined' && globalThis.RefSenseMessageHandler) {
            console.log('전역 핸들러를 통한 직접 호출');
            const result = globalThis.RefSenseMessageHandler({
                type: 'refsense-get-settings'
            });
            
            if (result && result.success) {
                loadSettingsFromMessage(result.settings);
                return;
            }
        }
    } catch (error) {
        console.log('전역 핸들러 호출 실패:', error.message);
    }
    
    // 2. 부모 윈도우 접근 시도 (여러 방법)
    try {
        let pluginInstance = null;
        
        // 2-1. window.parent.RefSense.Plugin
        if (window.parent && window.parent.RefSense && window.parent.RefSense.Plugin) {
            pluginInstance = window.parent.RefSense.Plugin;
            console.log('부모 윈도우 RefSense.Plugin 발견');
        }
        // 2-2. window.parent.RefSensePlugin
        else if (window.parent && window.parent.RefSensePlugin) {
            pluginInstance = window.parent.RefSensePlugin;
            console.log('부모 윈도우 RefSensePlugin 발견');
        }
        // 2-3. window.parent.Zotero.RefSense
        else if (window.parent && window.parent.Zotero && window.parent.Zotero.RefSense) {
            pluginInstance = window.parent.Zotero.RefSense;
            console.log('부모 윈도우 Zotero.RefSense 발견');
        }
        
        if (pluginInstance && typeof pluginInstance.getSettingsForPreferences === 'function') {
            console.log('부모 윈도우 직접 접근 시도');
            const result = pluginInstance.getSettingsForPreferences();
            
            if (result && result.success) {
                loadSettingsFromMessage(result.settings);
                return;
            }
        }
    } catch (error) {
        console.log('부모 윈도우 직접 접근 실패:', error.message);
    }
    
    // 3. postMessage 방식 (fallback)
    if (window.parent) {
        console.log('postMessage 방식으로 설정 요청');
        window.parent.postMessage({
            type: 'refsense-get-settings'
        }, '*');
        
        // 3초 후에도 응답이 없으면 기본 설정 로드
        setTimeout(() => {
            if (!document.querySelector('.radio-option.selected')) {
                console.log('응답이 없어 기본 설정 로드');
                loadDefaultSettings();
            }
        }, 3000);
    } else {
        console.error('부모 윈도우에 접근할 수 없습니다');
        loadDefaultSettings();
    }
}

function loadSettingsFromMessage(settings) {
    try {
        console.log('메시지로 받은 설정 로드:', settings);
        
        // AI 백엔드 설정
        selectBackend(settings.ai_backend || 'ollama');
        
        // OpenAI 설정
        if (settings.openai_api_key) {
            try {
                document.getElementById('openaiApiKey').value = atob(settings.openai_api_key);
            } catch (decodeError) {
                console.log('API 키 디코딩 실패, 무시됨');
            }
        }
        
        document.getElementById('openaiModel').value = settings.openai_model || 'gpt-4-turbo';
        
        // Ollama 설정
        document.getElementById('ollamaHost').value = settings.ollama_host || 'http://localhost:11434';
        document.getElementById('ollamaModel').value = settings.ollama_model || 'llama3.2:latest';
        
        // 페이지 설정
        document.getElementById('pageSource').value = settings.default_page_source || 'first';
        document.getElementById('pageRange').value = settings.page_range || '1-2';
        
        // 페이지 범위 표시/숨김
        togglePageRange();
        
        console.log('설정 로드 완료');
        
    } catch (error) {
        console.error('설정 로드 중 오류:', error);
        showMessage('error', '설정 로드 중 오류가 발생했습니다');
        loadDefaultSettings();
    }
}

function loadDefaultSettings() {
    console.log('기본 설정으로 초기화');
    
    selectBackend('ollama');
    document.getElementById('ollamaHost').value = 'http://localhost:11434';
    document.getElementById('ollamaModel').value = 'llama3.2:latest';
    document.getElementById('openaiModel').value = 'gpt-4-turbo';
    document.getElementById('pageSource').value = 'first';
    document.getElementById('pageRange').value = '1-2';
    togglePageRange();
    
    showMessage('info', '기본 설정으로 초기화되었습니다.');
}

function saveSettings() {
    try {
        // 선택된 백엔드 확인
        const selectedBackend = document.querySelector('input[name="backend"]:checked').value;
        
        // 백엔드별 검증
        if (selectedBackend === 'openai') {
            const apiKey = document.getElementById('openaiApiKey').value.trim();
            
            if (!apiKey) {
                showMessage('error', 'OpenAI API 키를 입력해주세요.');
                return;
            }
            
            if (!apiKey.startsWith('sk-')) {
                showMessage('error', 'OpenAI API 키는 sk-로 시작해야 합니다.');
                return;
            }
        } else if (selectedBackend === 'ollama') {
            const ollamaHost = document.getElementById('ollamaHost').value.trim();
            
            if (!ollamaHost) {
                showMessage('error', 'Ollama 서버 주소를 입력해주세요.');
                return;
            }
            
            if (!ollamaHost.startsWith('http')) {
                showMessage('error', 'Ollama 서버 주소는 http://로 시작해야 합니다.');
                return;
            }
        }
        
        // 설정 객체 구성
        const settings = {
            ai_backend: selectedBackend,
            default_page_source: document.getElementById('pageSource').value,
            page_range: document.getElementById('pageRange').value,
            openai_model: document.getElementById('openaiModel').value,
            ollama_host: document.getElementById('ollamaHost').value,
            ollama_model: document.getElementById('ollamaModel').value
        };
        
        // API 키는 있을 때만 추가
        const apiKey = document.getElementById('openaiApiKey').value.trim();
        if (apiKey) {
            settings.openai_api_key = btoa(apiKey);
        }
        
        console.log('설정 저장 요청:', settings);
        
        // 1. 전역 핸들러를 통한 직접 호출 시도
        try {
            if (typeof globalThis !== 'undefined' && globalThis.RefSenseMessageHandler) {
                console.log('전역 핸들러를 통한 직접 저장');
                const result = globalThis.RefSenseMessageHandler({
                    type: 'refsense-save-settings',
                    settings: settings
                });
                
                if (result && result.success) {
                    showMessage('success', '설정이 저장되었습니다!');
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                    return;
                } else if (result && result.error) {
                    showMessage('error', '설정 저장 실패: ' + result.error);
                    return;
                }
            }
        } catch (error) {
            console.log('전역 핸들러 저장 실패:', error.message);
        }
        
        // 2. 부모 윈도우 직접 접근 시도 (여러 방법)
        try {
            let pluginInstance = null;
            
            // 2-1. window.parent.RefSense.Plugin
            if (window.parent && window.parent.RefSense && window.parent.RefSense.Plugin) {
                pluginInstance = window.parent.RefSense.Plugin;
                console.log('부모 윈도우 RefSense.Plugin으로 저장');
            }
            // 2-2. window.parent.RefSensePlugin
            else if (window.parent && window.parent.RefSensePlugin) {
                pluginInstance = window.parent.RefSensePlugin;
                console.log('부모 윈도우 RefSensePlugin으로 저장');
            }
            // 2-3. window.parent.Zotero.RefSense
            else if (window.parent && window.parent.Zotero && window.parent.Zotero.RefSense) {
                pluginInstance = window.parent.Zotero.RefSense;
                console.log('부모 윈도우 Zotero.RefSense로 저장');
            }
            
            if (pluginInstance && typeof pluginInstance.saveSettingsFromPreferences === 'function') {
                console.log('부모 윈도우 직접 저장 시도');
                const result = pluginInstance.saveSettingsFromPreferences(settings);
                
                if (result && result.success) {
                    showMessage('success', '설정이 저장되었습니다!');
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                    return;
                } else if (result && result.error) {
                    showMessage('error', '설정 저장 실패: ' + result.error);
                    return;
                }
            }
        } catch (error) {
            console.log('부모 윈도우 직접 저장 실패:', error.message);
        }
        
        // 3. postMessage 방식 (fallback)
        if (window.parent) {
            console.log('postMessage 방식으로 저장 요청');
            window.parent.postMessage({
                type: 'refsense-save-settings',
                settings: settings
            }, '*');
        } else {
            showMessage('error', '부모 윈도우에 접근할 수 없습니다.');
        }
        
    } catch (error) {
        console.error('설정 저장 실패:', error);
        showMessage('error', '설정 저장에 실패했습니다: ' + error.message);
    }
}

// 백엔드 선택 함수
function selectBackend(backend) {
    // 라디오 버튼 업데이트
    document.getElementById('radio-' + backend).checked = true;
    
    // 버튼 스타일 업데이트
    document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    document.getElementById('backend-' + backend).classList.add('selected');
    
    // 섹션 표시/숨김
    document.getElementById('ollama-section').classList.toggle('active', backend === 'ollama');
    document.getElementById('openai-section').classList.toggle('active', backend === 'openai');
    
    console.log('Backend selected:', backend);
}

// 페이지 범위 표시/숨김
function togglePageRange() {
    const pageSource = document.getElementById('pageSource').value;
    const rangeGroup = document.getElementById('page-range-group');
    rangeGroup.style.display = pageSource === 'range' ? 'block' : 'none';
}

function testConnection() {
    try {
        const selectedBackend = document.querySelector('input[name="backend"]:checked').value;
        
        let config = {};
        
        if (selectedBackend === 'openai') {
            const apiKey = document.getElementById('openaiApiKey').value.trim();
            
            if (!apiKey) {
                showMessage('error', '먼저 OpenAI API 키를 입력해주세요.');
                return;
            }
            
            config.apiKey = apiKey;
        } else if (selectedBackend === 'ollama') {
            const ollamaHost = document.getElementById('ollamaHost').value.trim();
            
            if (!ollamaHost) {
                showMessage('error', '먼저 Ollama 서버 주소를 입력해주세요.');
                return;
            }
            
            config.host = ollamaHost;
        }
        
        showMessage('info', `${selectedBackend} 연결을 테스트하는 중...`);
        
        // 부모 윈도우에 테스트 요청
        if (window.parent) {
            window.parent.postMessage({
                type: 'refsense-test-connection',
                backend: selectedBackend,
                config: config
            }, '*');
        } else {
            showMessage('error', '부모 윈도우에 접근할 수 없습니다.');
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