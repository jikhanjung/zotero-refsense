/**
 * RefSense - AI Metadata Extractor for Zotero 7
 * Bootstrap file for plugin initialization (Refactored with proper module loading)
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
    
    // Module instances
    logger: null,
    configManager: null,
    preferencesManager: null,
    uiManager: null,
    zoteroUtils: null,
    
    // Plugin startup
    startup() {
        if (this.initialized) return;
        
        try {
            // Initialize basic logging first
            this.initBasicLogging();
            this.log('RefSense plugin starting up...');
            
            // Ensure Zotero is available
            if (typeof Zotero === 'undefined') {
                this.log('Zotero not yet available, retrying...');
                setTimeout(() => this.startup(), 1000);
                return;
            }
            
            // Load modules
            this.loadModules();
            
            // Show immediate confirmation
            this.showStartupNotification();
            
            // Load configuration
            this.configManager.loadConfig();
            
            // Register preferences pane
            this.preferencesManager.registerPreferencesPane();
            
            // Setup preferences message handling
            this.preferencesManager.setupPreferencesMessaging();
            
            // Setup global access
            this.setupGlobalAccess();
            
            // Initialize UI components with multiple retries
            this.initUIWithRetry();
            
            // Setup context menu handler
            this.setupContextMenuHandler();
            
            this.initialized = true;
            this.log('RefSense plugin started successfully');
            
        } catch (error) {
            this.handleError(error, 'startup');
        }
    },
    
    // Initialize basic logging before modules are loaded
    initBasicLogging() {
        this.log = function(message, ...args) {
            if (args.length > 0) {
                Zotero.debug(`[RefSense] ${message}`, args);
            } else {
                Zotero.debug(`[RefSense] ${message}`);
            }
        };
        
        this.handleError = function(error, context = '') {
            const errorMessage = `[RefSense] Error${context ? ` in ${context}` : ''}: ${error.message}`;
            Zotero.debug(errorMessage);
            Zotero.debug(error.stack || 'No stack trace available');
        };
    },
    
    // Load all modules
    loadModules() {
        try {
            this.log('Loading RefSense modules...');
            
            // Load modules using Services.scriptloader for Zotero 7 compatibility
            this.loadModule('modules/logger.js');
            this.loadModule('modules/config.js');
            this.loadModule('modules/preferences.js');
            this.loadModule('modules/ui.js');
            this.loadModule('modules/zotero-utils.js');
            
            // Set up module references
            this.logger = RefSense.logger;
            this.configManager = RefSense.configManager;
            this.preferencesManager = RefSense.preferencesManager;
            this.uiManager = RefSense.uiManager;
            this.zoteroUtils = RefSense.zoteroUtils;
            
            // Update main logging methods
            this.log = this.logger.log.bind(this.logger);
            this.handleError = this.logger.error.bind(this.logger);
            
            this.log('✅ All modules loaded successfully');
            
        } catch (error) {
            this.handleError(error, 'loadModules');
        }
    },
    
    // Load individual module using Services.scriptloader
    loadModule(modulePath) {
        try {
            if (typeof Services !== 'undefined' && Services.scriptloader) {
                const moduleURI = this.rootURI + modulePath;
                Services.scriptloader.loadSubScript(moduleURI, this, 'UTF-8');
                this.log(`✅ Loaded module: ${modulePath}`);
                return true;
            } else {
                this.log(`❌ Services.scriptloader not available for: ${modulePath}`);
                return false;
            }
        } catch (error) {
            this.log(`❌ Failed to load module ${modulePath}:`, error.message);
            return false;
        }
    },
    
    // Show startup notification
    showStartupNotification() {
        this.log('RefSense plugin loaded successfully');
    },
    
    // Setup global access
    setupGlobalAccess() {
        try {
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
            this.handleError(error, 'setupGlobalAccess');
        }
    },
    
    // Setup context menu handler
    setupContextMenuHandler() {
        try {
            if (this.uiManager && this.zoteroUtils) {
                // Set up the context menu extraction handler
                this.uiManager.setContextMenuExtractionHandler(() => {
                    this.zoteroUtils.extractFromContextMenu();
                });
                this.log('✅ Context menu handler setup completed');
            }
        } catch (error) {
            this.handleError(error, 'setupContextMenuHandler');
        }
    },
    
    // Initialize UI components with retry logic
    initUIWithRetry(attempt = 1, maxAttempts = 10) {
        this.log(`UI initialization attempt ${attempt}/${maxAttempts}`);
        
        try {
            this.uiManager.initUI();
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
    
    // Plugin shutdown
    shutdown() {
        this.log('RefSense plugin shutting down...');
        
        try {
            // Clean up UI components
            if (this.uiManager) {
                this.uiManager.cleanup();
            }
            
            // Clean up preferences manager
            if (this.preferencesManager) {
                this.preferencesManager.cleanup();
            }
            
            // Clean up message listeners
            const mainWindow = Zotero.getMainWindow();
            if (mainWindow && mainWindow._refSenseMainMessageListener) {
                mainWindow.removeEventListener('message', mainWindow._refSenseMainMessageListener);
                delete mainWindow._refSenseMainMessageListener;
            }
            
        } catch (error) {
            this.handleError(error, 'shutdown cleanup');
        }
        
        this.log('RefSense plugin shut down');
    }
};

// Plugin lifecycle functions for Zotero
function startup({ id, version, rootURI }) {
    RefSense.Plugin.id = id;
    RefSense.Plugin.version = version;
    RefSense.Plugin.rootURI = rootURI;
    
    try {
        RefSense.Plugin.startup();
    } catch (error) {
        if (typeof Zotero !== 'undefined') {
            Zotero.debug('[RefSense] Startup error: ' + error.message);
            Zotero.debug(error.stack);
        }
    }
}

function shutdown() {
    try {
        if (RefSense.Plugin) {
            RefSense.Plugin.shutdown();
        }
    } catch (error) {
        if (typeof Zotero !== 'undefined') {
            Zotero.debug('[RefSense] Shutdown error: ' + error.message);
        }
    }
}

function install() {
    // Installation logic if needed
}

function uninstall() {
    // Uninstallation logic if needed
}