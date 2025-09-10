# Optimization Scripts

This directory contains scripts to help optimize the SHOP3.user application.

## Available Scripts

### Remove Console Logs

```bash
npm run remove-logs
```

This script removes all `console.log` statements from the codebase. It preserves `console.error` and `console.warn` statements. This is useful before deploying to production to reduce bundle size and prevent sensitive information from being logged.

### Optimize Images

```bash
npm run optimize-images
```

This script optimizes images in the `public/images` directory. It uses the `sharp` library to resize and compress images. This helps reduce the size of the images and improve page load times.

**Requirements:**

- `sharp` package must be installed: `npm install sharp`

### Analyze Bundle

```bash
npm run analyze
```

This script analyzes the bundle size of the application. It uses the `@next/bundle-analyzer` package to generate a report of the bundle size. This helps identify large dependencies that can be optimized.

**Requirements:**

- `@next/bundle-analyzer` package must be installed: `npm install --save-dev @next/bundle-analyzer`

## Automatic Optimization

The `prebuild` script in `package.json` automatically runs the `remove-logs` and `optimize-images` scripts before building the application. This ensures that the production build is optimized.

```bash
npm run build
```

## Manual Optimization

You can also run the optimization scripts manually before deploying to production:

```bash
# Remove console.log statements
npm run remove-logs

# Optimize images
npm run optimize-images

# Analyze bundle size
npm run analyze
```

## Best Practices

1. **Remove console.log statements**: Console.log statements can leak sensitive information and increase bundle size.
2. **Optimize images**: Large images can slow down page load times.
3. **Analyze bundle size**: Large dependencies can increase bundle size and slow down page load times.
4. **Use code splitting**: Code splitting can reduce the initial bundle size and improve page load times.
5. **Use lazy loading**: Lazy loading can defer loading of non-critical resources until they are needed.
6. **Use memoization**: Memoization can prevent unnecessary re-renders and improve performance.
7. **Use proper caching strategies**: Proper caching can reduce server load and improve page load times.
8. **Use proper error handling**: Proper error handling can prevent crashes and improve user experience.
