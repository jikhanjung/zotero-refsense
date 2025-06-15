/**
 * Build script for RefSense Zotero plugin
 */

const fs = require('fs');
const path = require('path');

// Build configuration
const BUILD_CONFIG = {
    srcDir: './src',
    buildDir: './build',
    manifestFile: './manifest.json',
    outputFile: 'refsense.xpi'
};

// Generate build number
function generateBuildNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    return {
        full: `${year}${month}${day}.${hour}${minute}`,
        webext: parseInt(`${month}${day}${hour}${minute}`) // WebExtension compatible version
    };
}

// Build process
async function build() {
    const buildNumber = generateBuildNumber();
    console.log(`Starting RefSense build process... (Build: ${buildNumber.full})`);
    
    try {
        // Create build directory
        await createBuildDirectory();
        
        // Copy source files
        await copySourceFiles();
        
        // Copy and update manifest with build number
        await copyManifest(buildNumber);
        
        // Copy icons (if they exist)
        await copyIcons();
        
        // Create XPI package with build number
        const outputFile = `refsense-${buildNumber.full}.xpi`;
        await createXPI(outputFile);
        
        console.log('Build completed successfully!');
        console.log(`Output: ${BUILD_CONFIG.buildDir}/${outputFile}`);
        console.log(`Build Number: ${buildNumber.full}`);
        
    } catch (error) {
        console.error('Build failed:', error.message);
        process.exit(1);
    }
}

// Create build directory
async function createBuildDirectory() {
    if (fs.existsSync(BUILD_CONFIG.buildDir)) {
        fs.rmSync(BUILD_CONFIG.buildDir, { recursive: true });
    }
    fs.mkdirSync(BUILD_CONFIG.buildDir, { recursive: true });
    console.log('Created build directory');
}

// Copy source files
async function copySourceFiles() {
    const srcPath = BUILD_CONFIG.srcDir;
    const destPath = path.join(BUILD_CONFIG.buildDir, 'src');
    
    if (fs.existsSync(srcPath)) {
        copyDirectory(srcPath, destPath);
        console.log('Copied source files');
    }
    
    // Copy AI modules
    const aiPath = './ai';
    const aiDest = path.join(BUILD_CONFIG.buildDir, 'ai');
    if (fs.existsSync(aiPath)) {
        copyDirectory(aiPath, aiDest);
        console.log('Copied ai directory');
    }
    
    // Copy config files
    const configPath = './config';
    const configDest = path.join(BUILD_CONFIG.buildDir, 'config');
    if (fs.existsSync(configPath)) {
        copyDirectory(configPath, configDest);
        console.log('Copied config directory');
    }
    
    // Copy UI files
    const uiPath = './ui';
    const uiDest = path.join(BUILD_CONFIG.buildDir, 'ui');
    if (fs.existsSync(uiPath)) {
        copyDirectory(uiPath, uiDest);
        console.log('Copied ui directory');
    }
    
    // Copy preferences files
    const preferencesPath = './preferences';
    const preferencesDest = path.join(BUILD_CONFIG.buildDir, 'preferences');
    if (fs.existsSync(preferencesPath)) {
        copyDirectory(preferencesPath, preferencesDest);
        console.log('Copied preferences directory');
    }
    
    // Copy bootstrap.js to root
    const bootstrapPath = './bootstrap.js';
    const bootstrapDest = path.join(BUILD_CONFIG.buildDir, 'bootstrap.js');
    
    if (fs.existsSync(bootstrapPath)) {
        fs.copyFileSync(bootstrapPath, bootstrapDest);
        console.log('Copied bootstrap.js');
    }

    // Copy prefs.js to root (Zotero 7 default preferences)
    const prefsPath = './prefs.js';
    const prefsDest = path.join(BUILD_CONFIG.buildDir, 'prefs.js');
    
    if (fs.existsSync(prefsPath)) {
        fs.copyFileSync(prefsPath, prefsDest);
        console.log('Copied prefs.js');
    }
    
    // Copy prefs.html to root
    const prefsHtmlPath = './prefs.html';
    const prefsHtmlDest = path.join(BUILD_CONFIG.buildDir, 'prefs.html');
    
    if (fs.existsSync(prefsHtmlPath)) {
        fs.copyFileSync(prefsHtmlPath, prefsHtmlDest);
        console.log('Copied prefs.html');
    }
    
    // Copy prefs-script.js to root
    const prefsScriptPath = './prefs-script.js';
    const prefsScriptDest = path.join(BUILD_CONFIG.buildDir, 'prefs-script.js');
    
    if (fs.existsSync(prefsScriptPath)) {
        fs.copyFileSync(prefsScriptPath, prefsScriptDest);
        console.log('Copied prefs-script.js');
    }
    
    // Copy prefs.xhtml to root (legacy support)
    const prefsXhtmlPath = './prefs.xhtml';
    const prefsXhtmlDest = path.join(BUILD_CONFIG.buildDir, 'prefs.xhtml');
    
    if (fs.existsSync(prefsXhtmlPath)) {
        fs.copyFileSync(prefsXhtmlPath, prefsXhtmlDest);
        console.log('Copied prefs.xhtml');
    }
    
    // Copy prefs-simple.xhtml to root
    const prefsSimplePath = './prefs-simple.xhtml';
    const prefsSimpleDest = path.join(BUILD_CONFIG.buildDir, 'prefs-simple.xhtml');
    
    if (fs.existsSync(prefsSimplePath)) {
        fs.copyFileSync(prefsSimplePath, prefsSimpleDest);
        console.log('Copied prefs-simple.xhtml');
    }
    
    // Copy preferences.js to root
    const preferencesJsPath = './preferences.js';
    const preferencesJsDest = path.join(BUILD_CONFIG.buildDir, 'preferences.js');
    
    if (fs.existsSync(preferencesJsPath)) {
        fs.copyFileSync(preferencesJsPath, preferencesJsDest);
        console.log('Copied preferences.js');
    }
}

// Copy and update manifest file with build number
async function copyManifest(buildNumber) {
    const manifestPath = BUILD_CONFIG.manifestFile;
    const destPath = path.join(BUILD_CONFIG.buildDir, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
        // Read and parse manifest
        const manifestContent = fs.readFileSync(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestContent);
        
        // Update version with WebExtension compatible format (max 4 integers, 9 digits each)
        const originalVersion = manifest.version;
        const versionParts = originalVersion.split('.');
        
        // Format: major.minor.patch.build (e.g., 1.0.0.111221216)
        if (versionParts.length >= 3) {
            manifest.version = `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}.${buildNumber.webext}`;
        } else {
            manifest.version = `${originalVersion}.${buildNumber.webext}`;
        }
        
        // Add build info to description (since custom properties aren't allowed)
        const originalDesc = manifest.description;
        manifest.description = `${originalDesc} (Build: ${buildNumber.full})`;
        
        // Write updated manifest
        fs.writeFileSync(destPath, JSON.stringify(manifest, null, 2));
        console.log(`Updated manifest.json with build ${buildNumber.full}`);
        console.log(`Version: ${originalVersion} → ${manifest.version}`);
        console.log(`Build info added to description`);
    }
}

// Copy icons directory
async function copyIcons() {
    const iconsPath = './icons';
    const destPath = path.join(BUILD_CONFIG.buildDir, 'icons');
    
    if (fs.existsSync(iconsPath)) {
        copyDirectory(iconsPath, destPath);
        console.log('Copied icons');
    } else {
        // Create placeholder icons directory
        fs.mkdirSync(destPath, { recursive: true });
        console.log('Created placeholder icons directory');
    }
}

// Create XPI package with custom filename
async function createXPI(outputFile) {
    const archiver = require('archiver');
    const output = fs.createWriteStream(path.join(BUILD_CONFIG.buildDir, outputFile));
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    return new Promise((resolve, reject) => {
        output.on('close', () => {
            console.log(`Created XPI package: ${outputFile} (${archive.pointer()} bytes)`);
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.pipe(output);
        
        // Add all files from build directory except XPI files
        archive.glob('**/*', {
            cwd: BUILD_CONFIG.buildDir,
            ignore: ['*.xpi']
        });
        
        archive.finalize();
    });
}

// Utility function to copy directory recursively
function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    
    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Check if archiver is available, if not provide alternative
try {
    require('archiver');
} catch (err) {
    console.log('Note: archiver not installed. Run "npm install archiver" for XPI packaging');
    
    // Simple alternative without archiver
    BUILD_CONFIG.createXPI = async function() {
        console.log('XPI packaging skipped (archiver not available)');
        console.log('Manual XPI creation: zip the contents of the build directory');
    };
}

// Run build if called directly
if (require.main === module) {
    const isDev = process.argv.includes('--dev');
    
    if (isDev) {
        console.log('Development build mode');
        // Add development-specific build steps here
    }
    
    build();
}

module.exports = { build, BUILD_CONFIG };
