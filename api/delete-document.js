import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to delete a document for authenticated user.

const supabaseUrl = process.env.SUPABASE_URL || 'https://aawgjmddbfdtdewfgjgn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const config = {
    api: { bodyParser: true },
};

function json(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return json(res, 405, { error: 'Method not allowed' });
    }

    if (!supabaseServiceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
        return json(res, 500, { error: 'Server misconfiguration: missing service key' });
    }

    // Verify user's JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return json(res, 401, { error: 'Missing or invalid Authorization header' });
    }

    const accessToken = authHeader.slice(7);

    try {
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the user's token
        const { data: { user }, error: userError } = await adminClient.auth.getUser(accessToken);
        if (userError || !user) {
            return json(res, 401, { error: 'Invalid or expired session. Please sign in again.' });
        }

        const { docId } = req.body || {};
        if (!docId) {
            return json(res, 400, { error: 'Missing docId in request body' });
        }

        // Fetch the document to verify ownership and get file path
        const { data: doc, error: fetchError } = await adminClient
            .from('documents')
            .select('*')
            .eq('id', docId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !doc) {
            return json(res, 404, { error: 'Document not found or access denied' });
        }

        // Delete from storage
        if (doc.file_path) {
            const { error: storageError } = await adminClient.storage
                .from('documents')
                .remove([doc.file_path]);

            if (storageError) {
                console.error('Storage delete error (proceeding anyway):', storageError.message);
            }
        }

        // Delete from database
        const { error: deleteError } = await adminClient
            .from('documents')
            .delete()
            .eq('id', docId);

        if (deleteError) {
            return json(res, 500, { error: deleteError.message });
        }

        return json(res, 200, { success: true });
    } catch (err) {
        console.error('delete-document error:', err);
        return json(res, 500, { error: err.message || 'Server error' });
    }
}
