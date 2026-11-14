import { build } from 'esbuild';
import { mkdir, cp, writeFile } from 'node:fs/promises';
await mkdir('docs/assets',{recursive:true});
await build({entryPoints:['src/main.tsx'],bundle:true,minify:true,format:'esm',jsx:'automatic',outfile:'docs/assets/app.js',define:{'process.env.NODE_ENV':'"production"'},legalComments:'linked'});
await cp('public','docs',{recursive:true});
await cp('index.html','docs/index.html');
await writeFile('docs/.nojekyll','');
