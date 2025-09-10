#!/usr/bin/env node

/**
 * This script sets up and runs the Next.js bundle analyzer.
 * It helps identify large dependencies that can be optimized.
 *
 * Usage: node scripts/analyze-bundle.js
 *
 * Installation: npm install --save-dev @next/bundle-analyzer
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to next.config.ts
const nextConfigPath = path.join(process.cwd(), 'next.config.ts');

// Check if next.config.ts exists
if (!fs.existsSync(nextConfigPath)) {
    console.error(`Error: ${nextConfigPath} not found.`);
    process.exit(1);
}

// Read the current next.config.ts
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Check if @next/bundle-analyzer is already imported
if (!nextConfig.includes('@next/bundle-analyzer')) {
    // Create a backup of the original config
    fs.writeFileSync(`${nextConfigPath}.bak`, nextConfig);

    // Add the bundle analyzer to the config
    const newConfig = `import { withBundleAnalyzer } from '@next/bundle-analyzer';\n${nextConfig.replace('export default nextConfig;', 'export default withBundleAnalyzer({\n  enabled: process.env.ANALYZE === "true",\n})(nextConfig);')}`;

    // Write the new config
    fs.writeFileSync(nextConfigPath, newConfig);

    console.log('Added bundle analyzer to next.config.ts');
} else {
    console.log('Bundle analyzer is already configured in next.config.ts');
}

// Run the build with bundle analyzer enabled
console.log('Building and analyzing the bundle...');
try {
    execSync('ANALYZE=true npm run build', { stdio: 'inherit' });
    console.log('\nBundle analysis complete!');
    console.log(
        'Check the .next/analyze folder for the bundle analysis report.'
    );

    // Provide some tips for optimization
    console.log('\nOptimization Tips:');
    console.log(
        '1. Look for large dependencies that can be replaced with smaller alternatives'
    );
    console.log('2. Consider using dynamic imports for code splitting');
    console.log('3. Check for duplicate dependencies');
    console.log('4. Consider using tree-shaking friendly libraries');
    console.log('5. Lazy load components that are not needed immediately');

    // Restore the original config if we modified it
    if (!nextConfig.includes('@next/bundle-analyzer')) {
        fs.copyFileSync(`${nextConfigPath}.bak`, nextConfigPath);
        fs.unlinkSync(`${nextConfigPath}.bak`);
        console.log('\nRestored original next.config.ts');
    }
} catch (error) {
    console.error('Error analyzing bundle:', error);

    // Restore the original config if we modified it
    if (
        !nextConfig.includes('@next/bundle-analyzer') &&
        fs.existsSync(`${nextConfigPath}.bak`)
    ) {
        fs.copyFileSync(`${nextConfigPath}.bak`, nextConfigPath);
        fs.unlinkSync(`${nextConfigPath}.bak`);
        console.log('Restored original next.config.ts');
    }

    process.exit(1);
}
