/**
 * Logger Module - RefSense Plugin
 * Handles all logging and error reporting functionality
 * 
 * Zotero 7 compatible module using global namespace
 */

if (typeof RefSense === 'undefined') {
    var RefSense = {};
}

RefSense.Logger = class Logger {
    constructor(name = 'RefSense') {
        this.name = name;
    }

    log(message, ...args) {
        if (args.length > 0) {
            Zotero.debug(`[${this.name}] ${message}`, args);
        } else {
            Zotero.debug(`[${this.name}] ${message}`);
        }
    }

    error(error, context = '') {
        const errorMessage = `[${this.name}] Error${context ? ` in ${context}` : ''}: ${error.message}`;
        Zotero.debug(errorMessage);
        Zotero.debug(error.stack || 'No stack trace available');
    }

    warn(message, ...args) {
        this.log(`⚠️ ${message}`, ...args);
    }

    info(message, ...args) {
        this.log(`ℹ️ ${message}`, ...args);
    }

    success(message, ...args) {
        this.log(`✅ ${message}`, ...args);
    }

    debug(message, ...args) {
        if (typeof Zotero !== 'undefined' && Zotero.Debug) {
            this.log(`🐛 ${message}`, ...args);
        }
    }
}

// Create default logger instance
RefSense.logger = new RefSense.Logger('RefSense');

// Legacy compatibility functions
RefSense.log = function(message, ...args) {
    RefSense.logger.log(message, ...args);
};

RefSense.handleError = function(error, context = '') {
    RefSense.logger.error(error, context);
};