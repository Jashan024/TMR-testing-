import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to list documents for authenticated user.
// This bypasses mobile browser → Supabase connectivity issues.

const supabaseUrl = process.env.SUPABASE_URL || 'https://aawgjmddbfdtdewfgjgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
  api: { bodyParser: true },
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseServiceKey) {
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return res.status(500).json({ error: 'Server misconfiguration: missing service key' });
  }

  // Verify user's JWT from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = authHeader.slice(7);

  try {
    // Use service role client to verify user's token
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    }

    const { data: documents, error: fetchError } = await adminClient
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      return res.status(500).json({ error: fetchError.message });
    }

    // Add public URLs for public documents
    const enhancedDocs = (documents || []).map((doc) => {
      if (doc.visibility === 'public') {
        const { data: urlData } = adminClient.storage.from('documents').getPublicUrl(doc.file_path);
        return { ...doc, public_url: urlData.publicUrl };
      }
      return { ...doc, public_url: undefined };
    });

    return res.status(200).json({ documents: enhancedDocs });
  } catch (err) {
    console.error('list-documents error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

