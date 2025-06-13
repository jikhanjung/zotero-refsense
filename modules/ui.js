/**
 * UI Module - RefSense Plugin
 * Handles all user interface components (PDF reader buttons, context menus, dialogs)
 * 
 * Zotero 7 compatible module using global namespace
 */

if (typeof RefSense === 'undefined') {
    var RefSense = {};
}

RefSense.UIManager = class UIManager {
    constructor() {
        this.contextMenuElements = [];
        this.pdfReaderButtons = new Map();
    }

    /**
     * Initialize all UI components
     */
    initUI() {
        // Add menu items to PDF reader
        this.addPDFReaderButtons();
        
        // Add context menu items to Items pane
        this.addContextMenuItems();
    }

    /**
     * Add buttons to PDF reader toolbar
     */
    addPDFReaderButtons() {
        RefSense.logger.log('Adding PDF reader button...');
        
        // Wait for Zotero to be fully loaded
        if (!Zotero.Reader) {
            RefSense.logger.log('Zotero.Reader not available, retrying...');
            setTimeout(() => this.addPDFReaderButtons(), 1000);
            return;
        }
        
        RefSense.logger.log('Zotero.Reader available, setting up hooks...');
        
        try {
            // Method 1: Use Zotero Notifier system for tab events (PDF readers are opened in tabs)
            if (Zotero.Notifier) {
                RefSense.logger.log('Setting up Zotero Notifier for tab events...');
                
                const notifierID = Zotero.Notifier.registerObserver({
                    notify: (event, type, ids, extraData) => {
                        RefSense.logger.log('Notifier event:', event, 'type:', type, 'ids:', ids);
                        
                        // Monitor for tab-related events (PDF readers open in tabs)
                        if (event === 'add' && type === 'tab') {
                            ids.forEach(tabID => {
                                this.checkTabForReader(tabID, extraData);
                            });
                        }
                    }
                }, ['tab'], 'RefSense', 1);
                
                this.notifierID = notifierID;
                RefSense.logger.success('Notifier registered with ID:', notifierID);
            }
            
            // Method 2: Monitor existing readers
            this.monitorExistingReaders();
            
            RefSense.logger.log('Reader monitoring started');
            RefSense.logger.log('PDF reader button integration setup completed');
            
        } catch (error) {
            RefSense.logger.error(error, 'addPDFReaderButtons');
        }
    }

    /**
     * Add context menu items to Items pane
     */
    addContextMenuItems() {
        RefSense.logger.log('Adding context menu items...');
        
        try {
            // Wait for Zotero main window to be available
            const mainWindow = Zotero.getMainWindow();
            if (!mainWindow || !mainWindow.document) {
                RefSense.logger.log('Main window not available, retrying...');
                setTimeout(() => this.addContextMenuItems(), 1000);
                return;
            }
            
            const doc = mainWindow.document;
            
            // Find the item context menu
            const itemMenu = doc.getElementById('zotero-itemmenu');
            if (!itemMenu) {
                RefSense.logger.log('Item context menu not found, retrying...');
                setTimeout(() => this.addContextMenuItems(), 1000);
                return;
            }
            
            // Remove existing RefSense menu items if any
            this.removeContextMenuItems();
            
            // Create separator
            const separator = doc.createXULElement('menuseparator');
            separator.id = 'refsense-separator';
            itemMenu.appendChild(separator);
            
            // Create main menu item
            const menuItem = doc.createXULElement('menuitem');
            menuItem.id = 'refsense-extract-menuitem';
            menuItem.setAttribute('label', 'Extract Metadata with RefSense');
            menuItem.setAttribute('class', 'menuitem-iconic');
            menuItem.setAttribute('tooltiptext', 'Extract bibliographic metadata from PDF using AI');
            
            // Add event listener for context menu item
            menuItem.addEventListener('command', () => {
                this.handleContextMenuExtraction();
            });
            
            itemMenu.appendChild(menuItem);
            
            // Store references for cleanup
            this.contextMenuElements.push(separator, menuItem);
            
            RefSense.logger.success('Context menu items added successfully');
            
        } catch (error) {
            RefSense.logger.error(error, 'addContextMenuItems');
        }
    }

    /**
     * Remove context menu items
     */
    removeContextMenuItems() {
        try {
            if (this.contextMenuElements && this.contextMenuElements.length > 0) {
                this.contextMenuElements.forEach(element => {
                    if (element && element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                });
                this.contextMenuElements = [];
                RefSense.logger.success('Context menu items removed');
            }
        } catch (error) {
            RefSense.logger.error(error, 'removeContextMenuItems');
        }
    }

    /**
     * Handle context menu extraction (placeholder - to be implemented by main plugin)
     */
    handleContextMenuExtraction() {
        RefSense.logger.log('Context menu extraction triggered');
        // This will be overridden by the main plugin with actual implementation
        if (this.onContextMenuExtraction) {
            this.onContextMenuExtraction();
        }
    }

    /**
     * Set callback for context menu extraction
     */
    setContextMenuExtractionHandler(callback) {
        this.onContextMenuExtraction = callback;
    }

    /**
     * Check if a tab contains a reader and set it up
     */
    async checkTabForReader(tabID, extraData) {
        try {
            RefSense.logger.log('Checking tab for reader:', tabID, 'extraData:', extraData);
            
            // Check if this tab is a reader tab
            if (extraData && extraData[tabID]) {
                const tabData = extraData[tabID];
                RefSense.logger.log('Tab data:', tabData);
                
                if (tabData.type === 'reader' && tabData.itemID) {
                    const itemID = tabData.itemID;
                    RefSense.logger.log('Found reader tab for item:', itemID);
                    
                    // Get the reader instance
                    setTimeout(() => {
                        this.setupReaderForItem(itemID);
                    }, 1000);
                } else {
                    RefSense.logger.log('Tab is not a reader or missing itemID:', tabData);
                }
            } else {
                // Fallback: try to get reader directly from current readers
                setTimeout(() => {
                    this.checkCurrentReaders();
                }, 2000);
            }
        } catch (error) {
            RefSense.logger.error(error, 'checkTabForReader');
        }
    }

    /**
     * Monitor existing readers
     */
    monitorExistingReaders() {
        try {
            // Check for existing readers periodically
            const checkExisting = () => {
                this.checkCurrentReaders();
            };
            
            // Initial check
            setTimeout(checkExisting, 1000);
            
            // Periodic checks
            setInterval(checkExisting, 5000);
            
        } catch (error) {
            RefSense.logger.error(error, 'monitorExistingReaders');
        }
    }

    /**
     * Check current readers and add buttons
     */
    checkCurrentReaders() {
        try {
            if (Zotero.Reader && Zotero.Reader.getByTabID) {
                // Get all open readers
                const readers = Object.values(Zotero.Reader._readers || {});
                
                readers.forEach(reader => {
                    if (reader && reader._item) {
                        this.setupReaderForItem(reader._item.id);
                    }
                });
            }
        } catch (error) {
            RefSense.logger.error(error, 'checkCurrentReaders');
        }
    }

    /**
     * Setup reader for specific item
     */
    setupReaderForItem(itemID) {
        try {
            RefSense.logger.log('Setting up reader for item:', itemID);
            
            // Skip if already setup
            if (this.pdfReaderButtons.has(itemID)) {
                RefSense.logger.log('Reader already setup for item:', itemID);
                return;
            }
            
            // Get the reader
            const readers = Object.values(Zotero.Reader._readers || {});
            const reader = readers.find(r => r._item && r._item.id === itemID);
            
            if (reader && reader._iframeWindow) {
                this.addFloatingButton(reader, itemID);
            } else {
                RefSense.logger.log('Reader or iframe not ready for item:', itemID);
            }
            
        } catch (error) {
            RefSense.logger.error(error, 'setupReaderForItem');
        }
    }

    /**
     * Add floating button to PDF reader
     */
    addFloatingButton(reader, itemID) {
        try {
            const iframeDoc = reader._iframeWindow.document;
            
            // Check if button already exists
            if (iframeDoc.getElementById('refsense-floating-button')) {
                RefSense.logger.log('RefSense button already exists for item:', itemID);
                return;
            }
            
            // Create floating button
            const button = iframeDoc.createElement('div');
            button.id = 'refsense-floating-button';
            button.innerHTML = '📄 RefSense';
            button.title = 'Extract metadata with RefSense (Ctrl+Shift+E)';
            
            // Style the button
            button.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: #4285f4;
                color: white;
                padding: 10px 15px;
                border-radius: 6px;
                cursor: pointer;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                transition: all 0.2s ease;
                user-select: none;
                border: none;
            `;
            
            // Add hover effects
            button.addEventListener('mouseenter', () => {
                button.style.background = '#3367d6';
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.background = '#4285f4';
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            });
            
            // Add click handler
            button.addEventListener('click', () => {
                if (this.onButtonClick) {
                    this.onButtonClick(reader, itemID);
                }
            });
            
            // Add keyboard shortcut
            iframeDoc.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.shiftKey && event.key === 'E') {
                    event.preventDefault();
                    if (this.onButtonClick) {
                        this.onButtonClick(reader, itemID);
                    }
                }
            });
            
            // Add button to document
            iframeDoc.body.appendChild(button);
            
            // Store button reference
            this.pdfReaderButtons.set(itemID, button);
            
            RefSense.logger.success('RefSense floating button added for item:', itemID);
            
        } catch (error) {
            RefSense.logger.error(error, 'addFloatingButton');
        }
    }

    /**
     * Set callback for button click
     */
    setButtonClickHandler(callback) {
        this.onButtonClick = callback;
    }

    /**
     * Show alert dialog utility
     */
    showAlert(title, message) {
        try {
            Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService)
                .alert(null, title, message);
        } catch (error) {
            RefSense.logger.error(error, 'showAlert');
            // Fallback to console
            RefSense.logger.log(`[${title}] ${message}`);
        }
    }

    /**
     * Show progress notification utility
     */
    showProgressNotification(message) {
        try {
            // Use Zotero's notification system if available
            if (Zotero.Notifier && Zotero.Notifier.trigger) {
                RefSense.logger.log(`Progress: ${message}`);
            }
            
            // Also show in debug console
            RefSense.logger.log(`[RefSense Progress] ${message}`);
        } catch (error) {
            RefSense.logger.error(error, 'showProgressNotification');
        }
    }

    /**
     * Clean up all UI elements
     */
    cleanup() {
        try {
            // Remove context menu items
            this.removeContextMenuItems();
            
            // Remove PDF reader buttons
            this.pdfReaderButtons.forEach((button, itemID) => {
                if (button && button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            });
            this.pdfReaderButtons.clear();
            
            // Remove notifier
            if (this.notifierID && Zotero.Notifier) {
                Zotero.Notifier.unregisterObserver(this.notifierID);
            }
            
            RefSense.logger.success('UI cleanup completed');
            
        } catch (error) {
            RefSense.logger.error(error, 'UI cleanup');
        }
    }
}

// Create default UI manager instance
RefSense.uiManager = new RefSense.UIManager();

// Legacy compatibility functions
RefSense.initUI = function() {
    return RefSense.uiManager.initUI();
};

RefSense.addPDFReaderButtons = function() {
    return RefSense.uiManager.addPDFReaderButtons();
};

RefSense.addContextMenuItems = function() {
    return RefSense.uiManager.addContextMenuItems();
};

RefSense.removeContextMenuItems = function() {
    return RefSense.uiManager.removeContextMenuItems();
};