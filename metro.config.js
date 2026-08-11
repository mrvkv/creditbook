const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');
const path = require('path');

// Automatically sync the generated high-res logo into assets/images/
try {
    const src = "C:\\Users\\vivek\\.gemini\\antigravity-ide\\brain\\efdcd63e-396d-4aab-8f53-a54919605041\\creditbook_logo_icon_1786462792927.png";
    const destDir = path.join(__dirname, 'assets', 'images');
    const filesToUpdate = ['creditbook-logo.png', 'icon.png', 'creditbook-splash.png', 'adaptive-icon.png'];

    if (fs.existsSync(src)) {
        filesToUpdate.forEach((file) => {
            const dest = path.join(destDir, file);
            fs.copyFileSync(src, dest);
        });
        console.log('[Metro] Automatically updated CreditBook logo assets!');
    }
} catch (e) {
    console.error('[Metro] Failed to sync logo assets:', e);
}

const config = getDefaultConfig(__dirname);

module.exports = config;
