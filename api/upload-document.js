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
    console.log('[Upload API] Starting multipart parsing');

    const bb = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 15 * 1024 * 1024, // 15MB limit
      }
    });
    const fields = {};
    let file = null;
    let fileError = null;

    bb.on('field', (name, value) => {
      console.log('[Upload API] Field received:', name);
      fields[name] = value;
    });

    bb.on('file', (name, stream, info) => {
      console.log('[Upload API] File stream started:', name, info.filename);

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

      stream.on('limit', () => {
        console.log('[Upload API] File size limit reached');
        fileError = 'File too large. Max 15MB.';
      });

      stream.on('end', () => {
        console.log('[Upload API] File stream ended, size:', size);
        if (!fileError) {
          file = {
            filename: info.filename || 'upload',
            mimeType: info.mimeType || 'application/octet-stream',
            buffer: Buffer.concat(chunks),
            size,
          };
        }
      });
    });

    bb.on('error', (err) => {
      console.error('[Upload API] Busboy error:', err);
      reject(err);
    });

    bb.on('finish', () => {
      console.log('[Upload API] Multipart parsing finished');
      if (fileError) {
        reject(new Error(fileError));
      } else {
        resolve({ fields, file });
      }
    });

    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  console.log('[Upload API] Request received:', req.method);

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
    console.log('[Upload API] Supabase configured');

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;
    if (!token) {
      console.log('[Upload API] No auth token');
      return json(res, 401, { error: 'Missing Authorization Bearer token' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) {
      console.log('[Upload API] Auth error:', userError?.message);
      return json(res, 401, { error: 'Invalid session token' });
    }
    console.log('[Upload API] User authenticated:', userData.user.id);

    const { fields, file } = await parseMultipart(req);
    if (!file) {
      console.log('[Upload API] No file received');
      return json(res, 400, { error: 'Missing file' });
    }
    console.log('[Upload API] File parsed:', file.filename, 'size:', file.size);

    const displayName = (fields.name || file.filename || '').toString().trim();
    const visibility = (fields.visibility || 'private').toString() === 'public' ? 'public' : 'private';

    if (!displayName) return json(res, 400, { error: 'Missing name' });

    const userId = userData.user.id;
    const filePath = `${userId}/${Date.now()}_${file.filename}`;
    console.log('[Upload API] Uploading to storage:', filePath);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload API] Storage error:', uploadError.message);
      return json(res, 400, { error: uploadError.message });
    }
    console.log('[Upload API] File uploaded to storage');

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

    if (dbError) {
      console.error('[Upload API] DB error:', dbError.message);
      return json(res, 400, { error: dbError.message });
    }

    console.log('[Upload API] Document created:', row.id);
    return json(res, 200, { document: row });
  } catch (e) {
    console.error('[Upload API] Unhandled error:', e?.message || e);
    return json(res, 500, { error: e?.message || 'Server error' });
  }
}
