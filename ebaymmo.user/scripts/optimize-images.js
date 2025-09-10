#!/usr/bin/env node

/**
 * This script optimizes images in the public directory.
 * It uses sharp to resize and compress images.
 *
 * Usage: node scripts/optimize-images.js
 *
 * Installation: npm install sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Convert callback-based functions to promises
const readdir = (dir) => fs.promises.readdir(dir);
const stat = (path) => fs.promises.stat(path);

// Directories to process
const imageDir = path.join(process.cwd(), 'public', 'images');

// Image extensions to process
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// Configuration for optimization
const config = {
    jpeg: {
        quality: 80,
        progressive: true
    },
    png: {
        quality: 80,
        progressive: true
    },
    webp: {
        quality: 80
    },
    avif: {
        quality: 80
    }
};

// Function to optimize an image
async function optimizeImage(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();
        const outputPath = filePath; // Overwrite the original file

        // Get image info
        const metadata = await sharp(filePath).metadata();
        const { width, height, size, format } = metadata;

        // Skip if already optimized (check for a marker in metadata)
        if (metadata.optimized) {
            return { path: filePath, skipped: true };
        }

        // Create a sharp instance
        let sharpInstance = sharp(filePath);

        // Resize large images
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
            sharpInstance = sharpInstance.resize({
                width: width > height ? maxDimension : null,
                height: height > width ? maxDimension : null,
                fit: 'inside',
                withoutEnlargement: true
            });
        }

        // Apply format-specific optimizations
        switch (ext) {
            case '.jpg':
            case '.jpeg':
                sharpInstance = sharpInstance.jpeg(config.jpeg);
                break;
            case '.png':
                sharpInstance = sharpInstance.png(config.png);
                break;
            case '.webp':
                sharpInstance = sharpInstance.webp(config.webp);
                break;
            case '.gif':
                // GIFs are handled differently as they may be animated
                // Just copy them for now
                return { path: filePath, skipped: true };
            default:
                // Unknown format, skip
                return { path: filePath, skipped: true };
        }

        // Add metadata to mark as optimized
        sharpInstance = sharpInstance.withMetadata({
            optimized: true
        });

        // Save the optimized image
        await sharpInstance.toFile(outputPath + '.tmp');

        // Get new file size
        const newMetadata = await sharp(outputPath + '.tmp').metadata();
        const newSize = fs.statSync(outputPath + '.tmp').size;

        // Replace the original file with the optimized one
        fs.renameSync(outputPath + '.tmp', outputPath);

        return {
            path: filePath,
            originalSize: size,
            newSize,
            savings: size - newSize,
            savingsPercent: ((size - newSize) / size) * 100
        };
    } catch (error) {
        console.error(`Error optimizing ${filePath}:`, error);
        // Clean up any temporary files
        if (fs.existsSync(filePath + '.tmp')) {
            fs.unlinkSync(filePath + '.tmp');
        }
        return { path: filePath, error: error.message };
    }
}

// Function to walk through directories
async function walkDir(dir) {
    let results = [];

    try {
        const entries = await readdir(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stats = await stat(fullPath);

            if (stats.isDirectory()) {
                // Recursively process subdirectories
                const subResults = await walkDir(fullPath);
                results = results.concat(subResults);
            } else if (
                stats.isFile() &&
                imageExtensions.includes(path.extname(fullPath).toLowerCase())
            ) {
                // Process image file
                console.log(`Optimizing: ${fullPath}`);
                const result = await optimizeImage(fullPath);
                results.push(result);

                if (result.skipped) {
                    console.log('  Skipped: Already optimized');
                } else if (result.error) {
                    console.log(`  Error: ${result.error}`);
                } else {
                    console.log(
                        `  Optimized: ${result.originalSize} -> ${result.newSize} bytes (${result.savingsPercent.toFixed(2)}% savings)`
                    );
                }
            }
        }
    } catch (error) {
        console.error(`Error processing directory ${dir}:`, error);
    }

    return results;
}

// Main function
async function main() {
    console.log('Starting image optimization...');
    const startTime = Date.now();

    // Check if the images directory exists
    if (!fs.existsSync(imageDir)) {
        console.log(
            `Image directory ${imageDir} does not exist. Skipping optimization.`
        );
        return;
    }

    // Process images
    const results = await walkDir(imageDir);

    // Calculate statistics
    const processed = results.filter((r) => !r.skipped && !r.error);
    const skipped = results.filter((r) => r.skipped);
    const errors = results.filter((r) => r.error);

    const totalOriginalSize = processed.reduce(
        (sum, r) => sum + r.originalSize,
        0
    );
    const totalNewSize = processed.reduce((sum, r) => sum + r.newSize, 0);
    const totalSavings = totalOriginalSize - totalNewSize;
    const totalSavingsPercent =
        totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0;

    const endTime = Date.now();
    const timeElapsed = (endTime - startTime) / 1000;

    // Print summary
    console.log('\nOptimization Summary:');
    console.log(`  Processed: ${processed.length} images`);
    console.log(`  Skipped: ${skipped.length} images`);
    console.log(`  Errors: ${errors.length} images`);
    console.log(
        `  Original size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  New size: ${(totalNewSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(
        `  Savings: ${(totalSavings / 1024 / 1024).toFixed(2)} MB (${totalSavingsPercent.toFixed(2)}%)`
    );
    console.log(`  Time: ${timeElapsed.toFixed(2)} seconds`);
}

// Check if sharp is installed
try {
    // Using dynamic import for ES modules
    const sharpModule = await import('sharp');
    main().catch((error) => {
        console.error('An error occurred:', error);
        process.exit(1);
    });
} catch (error) {
    console.error('Error: The "sharp" package is required for this script.');
    console.error('Please install it using: npm install sharp');
    process.exit(1);
}
