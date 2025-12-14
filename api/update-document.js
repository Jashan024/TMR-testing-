import { createClient } from '@supabase/supabase-js';

// Vercel serverless function to update a document (name/visibility) for authenticated user.

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

        const { docId, updates } = req.body || {};
        if (!docId) {
            return json(res, 400, { error: 'Missing docId in request body' });
        }

        if (!updates || typeof updates !== 'object') {
            return json(res, 400, { error: 'Missing updates in request body' });
        }

        // Only allow updating name and visibility
        const allowedFields = ['name', 'visibility'];
        const sanitizedUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                sanitizedUpdates[key] = updates[key];
            }
        }

        if (Object.keys(sanitizedUpdates).length === 0) {
            return json(res, 400, { error: 'No valid fields to update' });
        }

        // Verify the document belongs to the user
        const { data: existingDoc, error: fetchError } = await adminClient
            .from('documents')
            .select('id')
            .eq('id', docId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !existingDoc) {
            return json(res, 404, { error: 'Document not found or access denied' });
        }

        // Update the document
        const { data: updatedDoc, error: updateError } = await adminClient
            .from('documents')
            .update(sanitizedUpdates)
            .eq('id', docId)
            .select()
            .single();

        if (updateError) {
            return json(res, 500, { error: updateError.message });
        }

        return json(res, 200, { document: updatedDoc });
    } catch (err) {
        console.error('update-document error:', err);
        return json(res, 500, { error: err.message || 'Server error' });
    }
}
