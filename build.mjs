import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const html = readFileSync(new URL('./index.html',import.meta.url),'utf8');
const worker = readFileSync(new URL('./worker.mjs',import.meta.url),'utf8');
mkdirSync(new URL('./dist/server/',import.meta.url),{recursive:true});
writeFileSync(new URL('./dist/server/index.js',import.meta.url),`const PAGE_HTML = ${JSON.stringify(html)};\n${worker}`);
