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
                
                // Create detailed info message
                let infoMessage = `RefSense: PDF Analysis Complete\n\n`;
                infoMessage += `Title: ${pdfContext.title}\n`;
                infoMessage += `File: ${pdfContext.filename}\n`;
                infoMessage += `Pages: ${pdfContext.totalPages}\n`;
                infoMessage += `Current Page: ${pdfContext.currentPage}\n`;
                infoMessage += `Has Parent: ${pdfContext.hasParent ? 'Yes' : 'No'}\n`;
                if (pdfContext.hasParent) {
                    infoMessage += `Parent Title: ${pdfContext.parentTitle}\n`;
                }
                infoMessage += `\nNext: PDF content extraction will be implemented in stage 3.`;
                
                // Show info
                reader._window.alert(infoMessage);
                
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