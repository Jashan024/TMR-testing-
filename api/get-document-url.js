import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to get a signed URL for viewing/downloading a document.

const supabaseUrl = process.env.SUPABASE_URL || 'https://aawgjmddbfdtdewfgjgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseServiceKey) {
    return res.status(500).json({ error: 'Server misconfiguration: missing service key' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.slice(7);

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    const { docId } = req.body;
    if (!docId) {
      return res.status(400).json({ error: 'Missing docId' });
    }

    // Fetch document
    const { data: doc, error: fetchError } = await adminClient
      .from('documents')
      .select('id, user_id, file_path, visibility')
      .eq('id', docId)
      .single();

    if (fetchError || !doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Allow access if: user owns it, OR document is public
    if (doc.user_id !== user.id && doc.visibility !== 'public') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate signed URL (valid for 10 minutes)
    const { data: signedData, error: signError } = await adminClient.storage
      .from('documents')
      .createSignedUrl(doc.file_path, 60 * 10);

    if (signError || !signedData?.signedUrl) {
      return res.status(500).json({ error: signError?.message || 'Failed to create signed URL' });
    }

    return res.status(200).json({ url: signedData.signedUrl });
  } catch (err) {
    console.error('get-document-url error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}


