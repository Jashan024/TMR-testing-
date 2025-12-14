import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';

export const config = {
  api: {
    bodyParser: false,
  },
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.end(JSON.stringify(body));
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const bb = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      }
    });
    const fields = {};
    let file = null;

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('file', (name, stream, info) => {
      if (name !== 'file') {
        stream.resume();
        return;
      }
      const chunks = [];
      let size = 0;
      stream.on('data', (d) => {
        chunks.push(d);
        size += d.length;
      });
      stream.on('limit', () => { });
      stream.on('end', () => {
        file = {
          filename: info.filename || 'upload',
          mimeType: info.mimeType || 'application/octet-stream',
          buffer: Buffer.concat(chunks),
          size,
        };
      });
    });

    bb.on('error', reject);
    bb.on('finish', () => resolve({ fields, file }));
    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = requireEnv('SUPABASE_URL');
    const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) return json(res, 401, { error: 'Missing Authorization Bearer token' });

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      return json(res, 401, { error: 'Invalid session token' });
    }

    const { fields, file } = await parseMultipart(req);
    if (!file) return json(res, 400, { error: 'Missing file' });

    const displayName = (fields.name || file.filename || '').toString().trim();
    const visibility = (fields.visibility || 'private').toString() === 'public' ? 'public' : 'private';

    if (!displayName) return json(res, 400, { error: 'Missing name' });

    const userId = userData.user.id;
    const filePath = `${userId}/${Date.now()}_${file.filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (uploadError) return json(res, 400, { error: uploadError.message });

    const sizeKb = file.size / 1024;
    const sizeLabel = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb.toFixed(1)} KB`;

    const { data: row, error: dbError } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        name: displayName,
        size: sizeLabel,
        visibility,
        file_path: filePath,
      })
      .select()
      .single();

    if (dbError) return json(res, 400, { error: dbError.message });

    return json(res, 200, { document: row });
  } catch (e) {
    return json(res, 500, { error: e?.message || 'Server error' });
  }
}



