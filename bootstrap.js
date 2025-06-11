/**
 * RefSense - AI Metadata Extractor for Zotero 7
 * Bootstrap file for plugin initialization
 */

if (typeof Zotero === 'undefined') {
    var Zotero;
}

var RefSense = RefSense || {};

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
            
            // Initialize UI components with delay
            setTimeout(() => {
                this.initUI();
            }, 3000);
            
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
    
    // Plugin shutdown
    shutdown() {
        this.log('RefSense plugin shutting down...');
        
        // Clean up resources
        this.cleanup();
        
        this.log('RefSense plugin shut down');
    },
    
    // Load plugin configuration
    loadConfig() {
        this.config = {
            ai_backend: Zotero.Prefs.get('extensions.refsense.ai_backend') || 'openai',
            openai_api_key: Zotero.Prefs.get('extensions.refsense.openai_api_key') || '',
            openai_model: Zotero.Prefs.get('extensions.refsense.openai_model') || 'gpt-4-turbo',
            ollama_model: Zotero.Prefs.get('extensions.refsense.ollama_model') || 'llava:13b',
            ollama_host: Zotero.Prefs.get('extensions.refsense.ollama_host') || 'http://localhost:11434',
            default_page_source: Zotero.Prefs.get('extensions.refsense.default_page_source') || 'first',
            page_range: Zotero.Prefs.get('extensions.refsense.page_range') || '1-2'
        };
        
        this.log('Configuration loaded:', this.config);
    },
    
    // Initialize UI components
    initUI() {
        // Add menu items to PDF reader
        this.addPDFReaderButtons();
        
        // Add preferences pane
        this.addPreferencesPane();
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
                
                // Extract PDF content (Stage 3 implementation)
                const extractionResult = await this.extractPDFContent(reader, pdfContext);
                
                // Validate and preprocess extracted content
                const processedResult = this.validateAndProcessContent(extractionResult);
                
                // Create detailed result message
                let resultMessage = `RefSense: PDF Content Extraction Complete\n\n`;
                resultMessage += `Title: ${pdfContext.title}\n`;
                resultMessage += `File: ${pdfContext.filename}\n`;
                resultMessage += `Pages: ${pdfContext.totalPages}\n`;
                resultMessage += `Current Page: ${pdfContext.currentPage}\n`;
                resultMessage += `Has Parent: ${pdfContext.hasParent ? 'Yes' : 'No'}\n`;
                if (pdfContext.hasParent) {
                    resultMessage += `Parent Title: ${pdfContext.parentTitle}\n`;
                }
                resultMessage += `\n--- Content Extraction Results ---\n`;
                resultMessage += `Method: ${extractionResult.method}\n`;
                resultMessage += `Page Extracted: ${extractionResult.pageNumber}\n`;
                resultMessage += `Content Type: ${extractionResult.contentType}\n`;
                resultMessage += `Content Length: ${extractionResult.contentLength}\n`;
                
                if (extractionResult.success) {
                    resultMessage += `Status: ✅ Success\n`;
                    resultMessage += `Validation: ${processedResult.isValid ? '✅ Passed' : '❌ Failed'}\n`;
                    if (!processedResult.isValid) {
                        resultMessage += `Validation Issues: ${processedResult.validationIssues.join(', ')}\n`;
                    }
                    resultMessage += `Quality Score: ${processedResult.qualityScore}/100\n\n`;
                    
                    if (extractionResult.contentType === 'text') {
                        const preview = processedResult.processedContent.substring(0, 200);
                        resultMessage += `Processed Text Preview:\n"${preview}${processedResult.processedContent.length > 200 ? '...' : ''}"\n`;
                        if (processedResult.detectedMetadata.length > 0) {
                            resultMessage += `Detected Elements: ${processedResult.detectedMetadata.join(', ')}\n`;
                        }
                    } else if (extractionResult.contentType === 'image') {
                        resultMessage += `Image Data: ${extractionResult.imageDataUrl ? 'Generated' : 'Failed'}\n`;
                        resultMessage += `Image Quality: ${processedResult.imageQuality || 'Unknown'}\n`;
                    }
                    resultMessage += `\nNext: AI metadata extraction will be implemented in stage 4-5.`;
                } else {
                    resultMessage += `Status: ❌ Failed\n`;
                    resultMessage += `Error: ${extractionResult.error}\n\n`;
                    resultMessage += `Please check PDF accessibility and try again.`;
                }
                
                // Show results
                reader._window.alert(resultMessage);
                
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
                // Text extraction successful
                result.success = true;
                result.method = 'text';
                result.contentType = 'text';
                result.content = textResult.text;
                result.contentLength = textResult.text.length;
                this.log('Text extraction successful, length:', result.contentLength);
                
            } else {
                // Text extraction failed or insufficient, try image rendering
                this.log('Text extraction failed or insufficient, trying image rendering...');
                const imageResult = await this.extractImageFromPage(reader, pageToExtract);
                
                if (imageResult.success && imageResult.imageDataUrl) {
                    result.success = true;
                    result.method = 'image';
                    result.contentType = 'image';
                    result.imageDataUrl = imageResult.imageDataUrl;
                    result.content = `Image data (${imageResult.width}x${imageResult.height})`;
                    result.contentLength = imageResult.imageDataUrl.length;
                    this.log('Image extraction successful, size:', `${imageResult.width}x${imageResult.height}`);
                    
                } else {
                    // Both methods failed
                    result.success = false;
                    result.error = `Both text and image extraction failed. Text: ${textResult.error || 'insufficient content'}, Image: ${imageResult.error || 'failed'}`;
                    this.log('PDF content extraction failed:', result.error);
                }
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
        const pageSource = this.config.default_page_source || 'first';
        
        switch (pageSource) {
            case 'current':
                return pdfContext.currentPage;
            case 'range':
                // For now, just use first page of range
                const range = this.config.page_range || '1';
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
                () => this.extractViaZoteroAPI(reader, pageNumber),  // 1. Zotero Fulltext (highest priority)
                () => this.extractViaZoteroReader(reader, pageNumber),  // 2. Direct Reader API
                () => this.extractViaPDFJS(reader, pageNumber),  // 3. PDF.js wrappedJSObject
                () => this.extractViaTextLayer(reader, pageNumber),  // 4. DOM textLayer
                () => this.extractViaDocumentSelection(reader, pageNumber),  // 5. Document selection
                () => this.extractViaFileSystemAccess(reader, pageNumber)  // 6. File system (lowest priority)
            ];
            
            for (const method of extractionMethods) {
                try {
                    const methodResult = await method();
                    if (methodResult.success && methodResult.text && methodResult.text.length > 20) {
                        this.log('Text extraction successful via method, length:', methodResult.text.length);
                        return methodResult;
                    } else if (methodResult.text) {
                        this.log('Method returned text but too short:', methodResult.text.length);
                    }
                } catch (error) {
                    this.log('Extraction method failed:', error.message);
                }
            }
            
            result.error = 'All text extraction methods failed';
            this.log('Text extraction failed: all methods exhausted');
            
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
            // Try to access the PDF via Zotero's internal systems
            if (typeof Zotero !== 'undefined' && Zotero.Fulltext) {
                const item = await Zotero.Items.getAsync(reader.itemID);
                if (item && item.isAttachment()) {
                    this.log('Attempting Zotero Fulltext extraction for item:', item.id);
                    
                    // Try multiple fulltext methods
                    const methods = [
                        () => Zotero.Fulltext.getItemContent(item.libraryID, item.id),
                        () => Zotero.Fulltext.getPages(item.libraryID, item.id),
                        () => Zotero.Fulltext.getIndexStats(item.id),
                        () => Zotero.Fulltext.findTextInItems([item.id], '')
                    ];
                    
                    for (const method of methods) {
                        try {
                            const fulltext = await method();
                            this.log('Fulltext result:', fulltext ? 'Found' : 'Empty', typeof fulltext);
                            
                            if (fulltext && fulltext.content && fulltext.content.trim().length > 50) {
                                const content = fulltext.content.trim();
                                result.success = true;
                                result.text = content.substring(0, 5000); // Reasonable limit
                                this.log('Zotero Fulltext extraction successful, length:', content.length);
                                return result;
                            } else if (fulltext && typeof fulltext === 'string' && fulltext.trim().length > 50) {
                                result.success = true;
                                result.text = fulltext.trim().substring(0, 5000);
                                this.log('Zotero Fulltext string extraction successful');
                                return result;
                            }
                        } catch (methodError) {
                            this.log('Fulltext method failed:', methodError.message);
                        }
                    }
                    
                    // Try to trigger fulltext indexing if not available
                    try {
                        this.log('Attempting to trigger fulltext indexing...');
                        await Zotero.Fulltext.indexItems([item.id]);
                        
                        // Wait a bit and try again
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        const fulltextRetry = await Zotero.Fulltext.getItemContent(item.libraryID, item.id);
                        if (fulltextRetry && fulltextRetry.content && fulltextRetry.content.trim().length > 50) {
                            result.success = true;
                            result.text = fulltextRetry.content.trim().substring(0, 5000);
                            this.log('Zotero Fulltext extraction successful after indexing');
                            return result;
                        }
                    } catch (indexError) {
                        this.log('Fulltext indexing failed:', indexError.message);
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
    
    // Add preferences pane
    addPreferencesPane() {
        // This will be implemented in stage 8
        this.log('Preferences pane - to be implemented');
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
    }
};

// Plugin lifecycle functions for Zotero
function startup({ id, version, rootURI }) {
    try {
        RefSense.Plugin.id = id;
        RefSense.Plugin.version = version;
        RefSense.Plugin.rootURI = rootURI;
        
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

function uninstall() {
    if (typeof Zotero !== 'undefined' && Zotero.debug) {
        Zotero.debug('[RefSense] Plugin uninstalled');
    }
}