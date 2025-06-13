const OllamaAPI = {
  async queryOllama(text, model = 'llama3.2:latest', host = 'http://localhost:11434') {
    return new Promise((resolve, reject) => {
      try {
        // Use XMLHttpRequest for Zotero compatibility
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
              reject(new Error(`Ollama API 오류: ${xhr.status} ${xhr.statusText}`));
            }
          }
        };
        
        xhr.onerror = () => {
          reject(new Error(`네트워크 오류: Ollama 서버에 연결할 수 없습니다. (${host})`));
        };
        
        xhr.ontimeout = () => {
          reject(new Error(`타임아웃: Ollama 서버 응답이 너무 느립니다.`));
        };
        
        xhr.timeout = 30000; // 30 seconds timeout
        
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
  "abstract": "초록 (선택사항)"
}

주의사항:
- 정확한 정보만 추출하세요
- 불확실한 정보는 빈 문자열로 두세요
- JSON 형식을 정확히 지켜주세요
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
      console.error('응답 파싱 오류:', error);
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
        console.log(`재시도 ${i + 1}/${maxRetries} (${delay}ms 후)`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = OllamaAPI;
} else if (typeof window !== 'undefined') {
  window.OllamaAPI = OllamaAPI;
}