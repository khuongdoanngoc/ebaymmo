#!/usr/bin/env node

/**
 * This script removes all console.log statements from the codebase.
 * It preserves console.error and console.warn statements.
 *
 * Usage: node scripts/remove-console-logs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert callback-based functions to promises
const readdir = (dir) => fs.promises.readdir(dir);
const stat = (path) => fs.promises.stat(path);
const readFile = (path) => fs.promises.readFile(path, 'utf8');
const writeFile = (path, content) =>
    fs.promises.writeFile(path, content, 'utf8');

// Directories to exclude
const excludeDirs = ['node_modules', '.next', '.git', 'public'];

// File extensions to process
const extensions = ['.js', '.jsx', '.ts', '.tsx'];

// Regular expressions for finding console.log statements
const consoleLogRegexes = [
    // Regular console.log statements
    /console\.log\s*\([^)]*\)\s*;?/g,
    // Commented console.log statements
    /\/\/\s*console\.log\s*\([^)]*\)\s*;?/g
];

async function processFile(filePath) {
    try {
        // Read file content
        const content = await readFile(filePath);

        // Check if file contains console.log
        const hasConsoleLog = consoleLogRegexes.some((regex) =>
            regex.test(content)
        );

        if (!hasConsoleLog) {
            return false; // No changes needed
        }

        // Replace console.log statements
        let newContent = content;
        for (const regex of consoleLogRegexes) {
            newContent = newContent.replace(regex, '');
        }

        // Write the modified content back to the file
        await writeFile(filePath, newContent);
        return true; // File was modified
    } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        return false;
    }
}

async function walkDir(dir) {
    let filesModified = 0;

    try {
        const entries = await readdir(dir);

        for (const entry of entries) {
            // Skip excluded directories
            if (excludeDirs.includes(entry)) {
                continue;
            }

            const fullPath = path.join(dir, entry);
            const stats = await stat(fullPath);

            if (stats.isDirectory()) {
                // Recursively process subdirectories
                filesModified += await walkDir(fullPath);
            } else if (
                stats.isFile() &&
                extensions.includes(path.extname(fullPath))
            ) {
                // Process file if it has the right extension
                const modified = await processFile(fullPath);
                if (modified) {
                    filesModified++;
                }
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dir}:`, error);
    }

    return filesModified;
}

async function main() {
    const startTime = Date.now();

    // Start from the src directory
    const rootDir = path.join(process.cwd(), 'src');
    const filesModified = await walkDir(rootDir);

    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000;

    console.log(
        `Done! Modified ${filesModified} files in ${timeElapsed.toFixed(2)} seconds.`
    );
}

main().catch((error) => {
    console.error('An error occurred:', error);
    process.exit(1);
});
