#!/usr/bin/env node
/**
 * Copy TinyMCE from node_modules to public for self-hosting
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(__dirname, '../node_modules/tinymce');
const dest = path.join(__dirname, '../public/tinymce');

if (!fs.existsSync(src)) {
	console.error('TinyMCE not found in node_modules. Run: npm install');
	process.exit(1);
}

fs.mkdirSync(path.join(__dirname, '../public'), { recursive: true });
if (fs.existsSync(dest)) {
	fs.rmSync(dest, { recursive: true });
}
fs.cpSync(src, dest, { recursive: true });
console.log('TinyMCE copied to public/tinymce');
