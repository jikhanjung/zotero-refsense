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
        try {
            setTimeout(() => {
                if (typeof Zotero !== 'undefined' && Zotero.alert) {
                    Zotero.alert(
                        null, 
                        'RefSense Plugin Loaded', 
                        'RefSense AI Metadata Extractor has been loaded successfully!\n\nThe plugin will add functionality to PDF readers.'
                    );
                }
            }, 2000);
        } catch (error) {
            this.log('Could not show startup notification:', error.message);
        }
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
            // Method 1: Check available Zotero.Reader methods
            this.log('Available Zotero.Reader methods:', Object.getOwnPropertyNames(Zotero.Reader));
            
            // Method 2: Hook into PDF reader creation (if available)
            if (Zotero.Reader && typeof Zotero.Reader.registerReader === 'function') {
                this.originalRegisterReader = Zotero.Reader.registerReader;
                Zotero.Reader.registerReader = (reader) => {
                    this.log('New reader registered:', reader.itemID);
                    this.originalRegisterReader(reader);
                    setTimeout(() => this.setupReaderToolbar(reader), 1000);
                };
                this.log('Reader registration hook installed');
            } else {
                this.log('Zotero.Reader.registerReader not available');
            }
            
            // Method 3: Monitor for new readers using notifier system
            try {
                if (Zotero.Reader && Zotero.Reader._readers) {
                    // Check existing readers
                    const readers = Array.from(Zotero.Reader._readers.values() || []);
                    this.log('Found readers via _readers:', readers.length);
                    for (let reader of readers) {
                        this.log('Setting up reader from _readers:', reader.itemID);
                        setTimeout(() => this.setupReaderToolbar(reader), 500);
                    }
                    
                    // Set up periodic monitoring for new readers
                    this.readerMonitorInterval = setInterval(() => {
                        const currentReaders = Array.from(Zotero.Reader._readers.values() || []);
                        for (let reader of currentReaders) {
                            if (!reader._refsenseButtonAdded) {
                                this.log('Found new reader:', reader.itemID);
                                this.setupReaderToolbar(reader);
                            }
                        }
                    }, 2000);
                    
                    this.log('Reader monitoring started');
                } else {
                    this.log('No method available to get existing readers');
                }
            } catch (error) {
                this.log('Error accessing existing readers:', error.message);
            }
            
            // Method 3: Listen for reader open events (disabled to prevent interference)
            // if (Zotero.Reader._readers) {
            //     this.log('Monitoring reader changes...');
            //     setInterval(() => {
            //         const currentReaders = Zotero.Reader.getReaders();
            //         for (let reader of currentReaders) {
            //             if (!reader._refsenseButtonAdded && reader._window) {
            //                 this.log('Found new reader to setup:', reader.itemID);
            //                 this.setupReaderToolbar(reader);
            //             }
            //         }
            //     }, 2000);
            // }
            
            this.log('PDF reader button integration setup completed');
        } catch (error) {
            this.handleError(error, 'addPDFReaderButtons');
        }
    },
    
    // Setup toolbar for a specific reader
    setupReaderToolbar(reader) {
        try {
            this.log('Setting up toolbar for reader:', reader.itemID);
            
            // Use Zotero's overlay system instead of direct DOM manipulation
            // This avoids interfering with PDF.js
            this.log('Setting up toolbar using Zotero overlay system...');
            
            // Check if button already exists
            if (reader._refsenseButtonAdded) {
                this.log('Button already exists for this reader');
                return;
            }
            
            // Use Zotero's menu system instead of direct DOM manipulation
            this.addReaderMenuItem(reader);
            
        } catch (error) {
            this.handleError(error, 'setupReaderToolbar');
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
            // Add to main Zotero window
            if (window && window.document) {
                window.document.addEventListener('keydown', handleKeydown, true);
                this.log('Keyboard shortcut added to main window');
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
            // Create a simple notification that the plugin is active
            setTimeout(() => {
                if (typeof Zotero !== 'undefined' && Zotero.alert) {
                    Zotero.alert(
                        null, 
                        'RefSense Active', 
                        `RefSense is active for this PDF.\nUse Ctrl+Shift+E to extract metadata.\n\nPDF: ${reader.itemID}`
                    );
                }
            }, 1000);
            
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
            
            // Show processing message
            const doc = reader._window.document;
            const button = doc.querySelector('#refsense-extract-btn');
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<span class="icon">⏳</span><span class="label">Processing...</span>';
                button.disabled = true;
                
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
                
                // Restore button
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                    button.disabled = false;
                }, 1000);
            }
            
        } catch (error) {
            this.handleError(error, 'handleExtractMetadata');
            
            // Show error to user
            if (reader._window) {
                reader._window.alert(`RefSense Error: ${error.message}`);
            }
            
            // Restore button on error
            const doc = reader._window.document;
            const button = doc.querySelector('#refsense-extract-btn');
            if (button) {
                button.innerHTML = '<span class="icon">📄</span><span class="label">Extract Metadata</span>';
                button.disabled = false;
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
            
            // Restore original reader registration function
            if (this.originalRegisterReader && Zotero.Reader) {
                Zotero.Reader.registerReader = this.originalRegisterReader;
                this.log('Restored original registerReader function');
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
                        if (reader._window && reader._window.document) {
                            const button = reader._window.document.querySelector('#refsense-extract-btn');
                            if (button) {
                                button.remove();
                                this.log('Removed button from reader', reader.itemID);
                            }
                        }
                    } catch (error) {
                        this.log('Error cleaning up reader button:', error.message);
                    }
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