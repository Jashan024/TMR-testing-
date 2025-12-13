import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to update a document (rename/visibility).

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

    const { docId, name, visibility } = req.body;
    if (!docId) {
      return res.status(400).json({ error: 'Missing docId' });
    }

    // Verify ownership
    const { data: existingDoc, error: fetchError } = await adminClient
      .from('documents')
      .select('id, user_id')
      .eq('id', docId)
      .single();

    if (fetchError || !existingDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (existingDoc.user_id !== user.id) {
      return res.status(403).json({ error: 'You do not own this document' });
    }

    // Build update payload
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (visibility !== undefined) updates.visibility = visibility;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    const { data, error: updateError } = await adminClient
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ document: data });
  } catch (err) {
    console.error('update-document error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

