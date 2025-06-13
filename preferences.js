// RefSense 설정 패널 JavaScript

var RefSensePreferences = {
    
    init() {
        console.log('RefSense 설정 패널 초기화');
        this.updateUI();
    },
    
    updateUI() {
        // 페이지 범위 입력 필드 활성화/비활성화
        const pageSource = document.getElementById('refsense-page-source');
        const pageRangeInput = document.getElementById('refsense-page-range');
        
        if (pageSource && pageRangeInput) {
            const updateRangeState = () => {
                pageRangeInput.disabled = (pageSource.value !== 'range');
            };
            
            pageSource.addEventListener('command', updateRangeState);
            updateRangeState();
        }
    },
    
    async testConnection() {
        try {
            const apiKeyInput = document.getElementById('refsense-openai-api-key');
            const apiKey = apiKeyInput.value.trim();
            
            if (!apiKey) {
                this.showMessage('먼저 API 키를 입력해주세요.', 'error');
                return;
            }
            
            if (!apiKey.startsWith('sk-')) {
                this.showMessage('OpenAI API 키는 sk-로 시작해야 합니다.', 'error');
                return;
            }
            
            if (apiKey.length < 40) {
                this.showMessage('API 키 길이가 너무 짧습니다.', 'error');
                return;
            }
            
            // 간단한 형식 검증만 수행 (실제 API 호출은 보안상 생략)
            this.showMessage('API 키 형식이 올바릅니다!', 'success');
            
        } catch (error) {
            console.error('연결 테스트 실패:', error);
            this.showMessage('연결 테스트에 실패했습니다: ' + error.message, 'error');
        }
    },
    
    showMessage(text, type = 'info') {
        // Zotero의 알림 시스템 사용
        if (typeof Zotero !== 'undefined' && Zotero.alert) {
            Zotero.alert(null, 'RefSense', text);
        } else {
            alert(text);
        }
    }
};