#!/usr/bin/env node

let customConfigParserPlugin = {
  name: 'customConfigParser',
  setup(build) {
    let path = require('path')

    // Redirect all config/parser to a custom implementation
    build.onResolve({ filter: /\.\.\/parser/ }, (args) => {
      if (/config\/lib$/.test(args.resolveDir)) {
        return { path: path.join(__dirname, 'configYamlParser.js') }
      }

      return { path: path.join(args.resolveDir, args.path) }
    })
  },
}

require('esbuild')
  .build({
    bundle: true,
    entryPoints: ['src/handlers/hello.ts'],
    format: 'cjs',
    keepNames: false,
    logLevel: 'info',
    minify: false,
    outdir: 'build',
    platform: 'node',
    plugins: [customConfigParserPlugin],
    sourcemap: true,
    target: ['node14'],
  })
  .catch((err) => {
    console.error(err)
  })
