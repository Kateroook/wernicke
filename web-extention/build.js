const esbuild = require('esbuild');

esbuild.build({
    entryPoints: ['content/content.js'],
    bundle: true,
    outfile: 'dist/content.bundle.js',
    format: 'iife', // формат, сумісний з content_scripts
    target: ['chrome58'], // або інший мінімальний target
    minify: true
}).catch(() => process.exit(1));
