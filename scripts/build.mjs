import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';

const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
await Promise.all(['styles.css', 'app.js', 'lab.mjs', 'feedback-evidence.mjs'].map(
  file => copyFile(new URL('../' + file, import.meta.url), new URL(file, output)),
));
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const preview = process.env.VERCEL_ENV === 'preview';
await writeFile(new URL('index.html', output), preview
  ? html.replace('</head>', '  <meta name="gemini-demo" content="enabled">\n</head>')
  : html);
