/**
 * Main entry point for bundled RefSense plugin
 * Imports and initializes all modules
 */

// Import all modules (these would be converted to ES6 modules for bundling)
import { Logger } from '../modules/logger.js';
import { ConfigManager } from '../modules/config.js';
import { PreferencesManager } from '../modules/preferences.js';
import { UIManager } from '../modules/ui.js';
import { ZoteroUtils } from '../modules/zotero-utils.js';

// Create global RefSense namespace
const RefSense = window.RefSense || {};

// Initialize module instances
RefSense.logger = new Logger('RefSense');
RefSense.configManager = new ConfigManager();
RefSense.preferencesManager = new PreferencesManager();
RefSense.uiManager = new UIManager();
RefSense.zoteroUtils = new ZoteroUtils();

// Plugin main class
RefSense.Plugin = {
    id: 'refsense@zotero-plugin',
    version: '1.0.0',
    rootURI: '',
    initialized: false,
    
    // Direct module references
    logger: RefSense.logger,
    configManager: RefSense.configManager,
    preferencesManager: RefSense.preferencesManager,
    uiManager: RefSense.uiManager,
    zoteroUtils: RefSense.zoteroUtils,
    
    startup() {
        if (this.initialized) return;
        
        try {
            this.logger.log('RefSense plugin starting up...');
            
            // Ensure Zotero is available
            if (typeof Zotero === 'undefined') {
                this.logger.log('Zotero not yet available, retrying...');
                setTimeout(() => this.startup(), 1000);
                return;
            }
            
            // All modules are already loaded in bundled version
            this.logger.log('✅ All modules loaded (bundled)');
            
            // Initialize components
            this.configManager.loadConfig();
            this.preferencesManager.registerPreferencesPane();
            this.preferencesManager.setupPreferencesMessaging();
            this.setupGlobalAccess();
            this.initUIWithRetry();
            this.setupContextMenuHandler();
            
            this.initialized = true;
            this.logger.log('RefSense plugin started successfully');
            
        } catch (error) {
            this.logger.error(error, 'startup');
        }
    },
    
    // ... rest of the plugin methods
};

// Make RefSense globally accessible
if (typeof window !== 'undefined') {
    window.RefSense = RefSense;
}
if (typeof globalThis !== 'undefined') {
    globalThis.RefSense = RefSense;
}

export default RefSense;