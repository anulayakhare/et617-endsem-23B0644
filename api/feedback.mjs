import { createHash, timingSafeEqual } from 'node:crypto';
import { validateEvidence } from '../feedback-evidence.mjs';
import { generateFeedback, model } from '../server/gemini.mjs';
import { teacherAuthorization, validTeacherSecret } from '../teacher-access.mjs';

const maxBytes = 2048;
const minute = 60_000;
let windowStart = 0;
let requests = 0;
const clients = new Map();
const digest = value => createHash('sha256').update(value).digest();

function allowed(client) {
  const now = Date.now();
  if (now - windowStart >= minute) {
    windowStart = now;
    requests = 0;
    clients.clear();
  }
  const count = clients.get(client) ?? 0;
  if (requests >= 12 || count >= 4) return false;
  requests += 1;
  clients.set(client, count + 1);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  const reply = (status, body) => {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return reply(405, { error: 'method' });
  }
  if (req.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
    return reply(415, { error: 'format' });
  }
  if (Number(req.headers['content-length']) > maxBytes) return reply(413, { error: 'size' });
  const key = process.env.GEMINI_API_KEY;
  const secret = process.env.TEACHER_ACCESS_CODE;
  if (process.env.VERCEL_ENV !== 'preview' || !key || !validTeacherSecret(secret)) {
    return reply(503, { error: 'unavailable' });
  }
  const client = req.headers['x-vercel-forwarded-for'] ?? req.socket.remoteAddress ?? 'local';
  if (!allowed(client)) {
    res.setHeader('Retry-After', '60');
    return reply(429, { error: 'limit' });
  }
  const code = req.headers.authorization ?? '';
  const expected = teacherAuthorization(secret);
  // A 256-code-unit secret encodes to at most 1024 base64url characters.
  if (code.length > 1031 || !timingSafeEqual(digest(code), digest(expected))) {
    return reply(401, { error: 'access' });
  }
  let evidence;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      size += chunk.length;
      if (size > maxBytes) return reply(413, { error: 'size' });
      chunks.push(chunk);
    }
    evidence = validateEvidence(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch {
    return reply(400, { error: 'evidence' });
  }
  try {
    const draft = await generateFeedback(evidence, key);
    return reply(200, { source: 'gemini', model, draft });
  } catch {
    return reply(502, { error: 'generation' });
  }
}
