/**
 * Rollup configuration for RefSense plugin
 * Bundles all modules into a single bootstrap.js file
 */

export default {
    input: 'src/main.js', // Entry point that imports all modules
    output: {
        file: 'build/bootstrap.js',
        format: 'iife', // Immediately Invoked Function Expression
        name: 'RefSense',
        banner: `/**
 * RefSense - AI Metadata Extractor for Zotero 7
 * Bundled version with all modules included
 */

if (typeof Zotero === 'undefined') {
    var Zotero;
}`,
        footer: `
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
}`
    },
    plugins: [
        // Add plugins for code transformation if needed
        // resolve(), // For node_modules resolution
        // commonjs(), // For CommonJS modules
        // terser() // For minification
    ]
};