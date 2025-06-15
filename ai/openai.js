/**
 * OpenAI API 통신 모듈
 * PDF 텍스트로부터 메타데이터를 추출하는 AI 호출 기능 제공
 */

class OpenAIService {
    constructor() {
        this.apiEndpoint = 'https://api.openai.com/v1/chat/completions';
        this.defaultModel = 'gpt-4-turbo';
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1초
    }

    /**
     * PDF 텍스트로부터 메타데이터를 추출
     * @param {string} text - 추출된 PDF 텍스트
     * @param {string} apiKey - OpenAI API 키
     * @param {string} model - 사용할 모델 (기본: gpt-4-turbo)
     * @returns {Promise<Object>} 추출된 메타데이터 객체
     */
    async extractMetadata(text, apiKey, model = this.defaultModel) {
        if (!text || !text.trim()) {
            throw new Error('텍스트가 비어있습니다.');
        }

        if (!apiKey) {
            throw new Error('OpenAI API 키가 필요합니다.');
        }

        const prompt = this._buildMetadataPrompt(text);
        
        try {
            const response = await this._callOpenAI(prompt, apiKey, model);
            return this._parseMetadataResponse(response);
        } catch (error) {
            throw new Error(`메타데이터 추출 실패: ${error.message}`);
        }
    }

    /**
     * 메타데이터 추출용 프롬프트 생성
     * @param {string} text - PDF 텍스트
     * @returns {string} 완성된 프롬프트
     */
    _buildMetadataPrompt(text) {
        return `다음은 학술논문 PDF의 첫 페이지에서 추출한 텍스트입니다. 이 텍스트에서 서지정보를 추출하여 정확한 JSON 형식으로 반환해주세요.

텍스트:
"""
${text.substring(0, 4000)} // 토큰 제한 고려하여 4000자로 제한
"""

다음 JSON 스키마를 정확히 따라 응답해주세요:
{
  "title": "논문 제목",
  "authors": ["저자1", "저자2", "저자3"],
  "year": 2024,
  "journal": "저널명",
  "volume": "볼륨번호",
  "issue": "이슈번호",
  "pages": "페이지범위",
  "doi": "DOI 번호",
  "abstract": "초록 (있는 경우)",
  "keywords": ["키워드1", "키워드2"],
  "confidence": 0.95
}

중요 규칙:
1. 반드시 유효한 JSON만 반환하세요
2. 찾을 수 없는 정보는 null로 설정하세요
3. 저자명은 반드시 배열로 반환하세요 - 각 저자를 별개의 배열 요소로 분리
4. 연도는 숫자로 반환하세요
5. confidence는 추출 정확도 (0-1 사이)
6. DOI가 있다면 반드시 포함하세요
7. 초록(abstract)이 있다면 반드시 추출하세요 - 매우 중요한 정보입니다
8. 다른 설명 없이 JSON만 반환하세요
9. 저자가 여러 명인 경우 모두 개별적으로 배열에 추가하세요
10. 초록은 완전한 문장으로 추출하고 요약하지 마세요

JSON:`;
    }

    /**
     * OpenAI API 호출
     * @param {string} prompt - 전송할 프롬프트
     * @param {string} apiKey - API 키
     * @param {string} model - 모델명
     * @returns {Promise<string>} API 응답
     */
    async _callOpenAI(prompt, apiKey, model) {
        const requestBody = {
            model: model,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 1000,
            temperature: 0.1, // 일관된 결과를 위해 낮게 설정
            response_format: { type: "json_object" }
        };

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
                }

                const data = await response.json();
                
                if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                    throw new Error('유효하지 않은 API 응답 형식');
                }

                return data.choices[0].message.content;

            } catch (error) {
                console.error(`OpenAI API 호출 시도 ${attempt}/${this.maxRetries} 실패:`, error);

                if (attempt === this.maxRetries) {
                    throw error;
                }

                // 지수 백오프로 재시도
                await this._sleep(this.retryDelay * Math.pow(2, attempt - 1));
            }
        }
    }

    /**
     * API 응답에서 메타데이터 파싱
     * @param {string} response - OpenAI API 응답
     * @returns {Object} 파싱된 메타데이터
     */
    _parseMetadataResponse(response) {
        try {
            const metadata = JSON.parse(response);
            
            // 필수 필드 검증
            const requiredFields = ['title', 'authors', 'year'];
            for (const field of requiredFields) {
                if (!metadata.hasOwnProperty(field)) {
                    console.warn(`필수 필드 누락: ${field}`);
                }
            }

            // 데이터 타입 정규화
            if (metadata.year && typeof metadata.year === 'string') {
                metadata.year = parseInt(metadata.year) || null;
            }

            if (metadata.authors && typeof metadata.authors === 'string') {
                metadata.authors = [metadata.authors];
            }

            // confidence 기본값 설정
            if (!metadata.confidence) {
                metadata.confidence = 0.8;
            }

            return metadata;

        } catch (error) {
            throw new Error(`JSON 파싱 실패: ${error.message}`);
        }
    }

    /**
     * 비동기 대기 함수
     * @param {number} ms - 대기 시간 (밀리초)
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * API 키 유효성 검증
     * @param {string} apiKey - 검증할 API 키
     * @returns {Promise<boolean>} 유효성 검증 결과
     */
    async validateApiKey(apiKey) {
        if (!apiKey || !apiKey.startsWith('sk-')) {
            return false;
        }

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('API 키 검증 실패:', error);
            return false;
        }
    }
}

// Zotero 환경에서 글로벌 접근 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OpenAIService;
} else if (typeof window !== 'undefined') {
    window.OpenAIService = OpenAIService;
}