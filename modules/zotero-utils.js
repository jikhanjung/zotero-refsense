/**
 * Zotero Utilities Module - RefSense Plugin
 * Handles Zotero-specific operations like item management, metadata processing
 * 
 * Zotero 7 compatible module using global namespace
 */

if (typeof RefSense === 'undefined') {
    var RefSense = {};
}

RefSense.ZoteroUtils = class ZoteroUtils {
    constructor() {
        this.aiServices = new Map();
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
     * Handle context menu extraction
     */
    async extractFromContextMenu() {
        try {
            RefSense.logger.log('RefSense context menu extraction triggered');
            
            // Get selected items from Zotero pane
            const selectedItems = ZoteroPane.getSelectedItems();
            
            if (!selectedItems || selectedItems.length === 0) {
                this.showAlert('RefSense', 'No items selected');
                return;
            }
            
            // Filter items to find those with PDF attachments
            const itemsWithPDFs = [];
            
            for (const item of selectedItems) {
                if (item.isPDFAttachment()) {
                    // Item is a PDF attachment itself
                    itemsWithPDFs.push({
                        item: item,
                        pdfItem: item,
                        parentItem: item.parentItem ? Zotero.Items.get(item.parentItem) : null
                    });
                } else if (item.isRegularItem()) {
                    // Check if regular item has PDF attachments
                    const attachments = item.getAttachments();
                    for (const attachmentID of attachments) {
                        const attachment = Zotero.Items.get(attachmentID);
                        if (attachment && attachment.isPDFAttachment()) {
                            itemsWithPDFs.push({
                                item: item,
                                pdfItem: attachment,
                                parentItem: item
                            });
                            break; // Process first PDF found
                        }
                    }
                }
            }
            
            if (itemsWithPDFs.length === 0) {
                this.showAlert('RefSense', 'No PDF items found in selection.\n\nPlease select items that contain PDF attachments.');
                return;
            }
            
            // Confirm batch processing if multiple items
            if (itemsWithPDFs.length > 1) {
                const confirmed = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                    .getService(Components.interfaces.nsIPromptService)
                    .confirm(
                        null,
                        'RefSense Batch Processing',
                        `Extract metadata for ${itemsWithPDFs.length} PDF item(s)?\n\nThis may take a few moments.`
                    );
                
                if (!confirmed) {
                    return;
                }
            }
            
            // Process each PDF item
            let processedCount = 0;
            let errorCount = 0;
            
            for (const { item, pdfItem, parentItem } of itemsWithPDFs) {
                try {
                    RefSense.logger.log(`Processing PDF: ${pdfItem.getDisplayTitle()}`);
                    
                    // Show progress for multiple items
                    if (itemsWithPDFs.length > 1) {
                        this.showProgressNotification(`Processing ${processedCount + 1}/${itemsWithPDFs.length}: ${pdfItem.getDisplayTitle()}`);
                    }
                    
                    // Extract metadata from PDF
                    await this.extractMetadataFromPDF(pdfItem, parentItem);
                    processedCount++;
                    
                } catch (error) {
                    RefSense.logger.log(`Error processing ${pdfItem.getDisplayTitle()}:`, error.message);
                    errorCount++;
                }
            }
            
            // Show completion message
            let message = `Processed ${processedCount} PDF item(s) successfully`;
            if (errorCount > 0) {
                message += `\n${errorCount} item(s) had errors`;
            }
            
            this.showAlert('RefSense Complete', message);
            
        } catch (error) {
            RefSense.logger.error(error, 'extractFromContextMenu');
        }
    }

    /**
     * Extract metadata from PDF (placeholder - to be implemented)
     */
    async extractMetadataFromPDF(pdfItem, parentItem = null) {
        RefSense.logger.log('Extracting metadata from PDF:', pdfItem.getDisplayTitle());
        
        // This is a placeholder for the actual implementation
        // The full implementation will be moved from bootstrap.js
        
        throw new Error('extractMetadataFromPDF not yet implemented in module');
    }

    /**
     * Process extracted metadata and create parent item (placeholder)
     */
    async processExtractedMetadata(metadata, pdfContext) {
        RefSense.logger.log('Processing extracted metadata:', metadata);
        
        // This is a placeholder for the actual implementation
        // The full implementation will be moved from bootstrap.js
        
        throw new Error('processExtractedMetadata not yet implemented in module');
    }

    /**
     * Show parent update dialog (placeholder)
     */
    showParentUpdateDialog(existingTitle, metadata) {
        const promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
        
        const choice = promptService.confirmEx(
            null,
            "기존 Parent Item 발견",
            `이미 parent item이 존재합니다:\n"${existingTitle}"\n\n어떻게 처리하시겠습니까?`,
            promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_0 +
            promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_1 +
            promptService.BUTTON_TITLE_IS_STRING * promptService.BUTTON_POS_2,
            "기존 정보 업데이트",
            "새 Parent 생성",
            "취소",
            null, {}
        );
        
        return choice; // 0: update, 1: create new, 2: cancel
    }

    /**
     * Show metadata comparison dialog (placeholder)
     */
    async showMetadataComparisonDialog(parentID, newMetadata) {
        RefSense.logger.log('Showing metadata comparison dialog for parent:', parentID);
        
        // This is a placeholder for the actual implementation
        // The full implementation will be moved from bootstrap.js
        
        throw new Error('showMetadataComparisonDialog not yet implemented in module');
    }

    /**
     * Register AI service
     */
    registerAIService(name, service) {
        this.aiServices.set(name, service);
        RefSense.logger.log(`AI service registered: ${name}`);
    }

    /**
     * Get AI service
     */
    getAIService(name) {
        return this.aiServices.get(name);
    }

    /**
     * Get current AI service based on config
     */
    getCurrentAIService() {
        const config = RefSense.configManager.getConfig();
        return this.getAIService(config.aiBackend);
    }
}

// Create default Zotero utils instance
RefSense.zoteroUtils = new RefSense.ZoteroUtils();

// Legacy compatibility functions
RefSense.showAlert = function(title, message) {
    return RefSense.zoteroUtils.showAlert(title, message);
};

RefSense.showProgressNotification = function(message) {
    return RefSense.zoteroUtils.showProgressNotification(message);
};

RefSense.extractFromContextMenu = function() {
    return RefSense.zoteroUtils.extractFromContextMenu();
};