import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { DocumentFile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from './ProfileContext';

interface DocumentContextType {
  documents: DocumentFile[];
  addDocument: (file: File, details: { name: string; visibility?: DocumentFile['visibility'] }) => Promise<void>;
  updateDocument: (docId: number, updates: Partial<DocumentFile>) => Promise<void>;
  deleteDocument: (docId: number) => Promise<void>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const fallbackDocuments: DocumentFile[] = [
  { id: 1, user_id: 'fallback-user', name: 'Resume_Frontend_Engineer.pdf', size: '248 KB', created_at: '2023-10-26', visibility: 'public', file_path: '', public_url: '#' },
  { id: 2, user_id: 'fallback-user', name: 'Cover_Letter_Startup.pdf', size: '112 KB', created_at: '2023-10-22', visibility: 'private', file_path: '', public_url: '#' },
  { id: 3, user_id: 'fallback-user', name: 'Design_Portfolio_2023.pdf', size: '5.8 MB', created_at: '2023-09-15', visibility: 'public', file_path: '', public_url: '#' },
];

const withTimeout = async <T = any,>(promise: any, ms: number, message: string): Promise<T> => {
  let timeoutId: number | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
};

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile, session } = useProfile();

  const fetchDocuments = useCallback(async (userId?: string, accessToken?: string) => {
    if (!supabase || !userId) {
      setDocuments(!supabase ? fallbackDocuments : []);
      setError(null);
      setLoading(false);
      return;
    };
    setLoading(true);
    setError(null);

    // Prefer server endpoint to avoid mobile → Supabase connectivity issues
    if (accessToken) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        const resp = await fetch('/api/list-documents', {
          method: 'GET',
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (resp.status !== 404) {
          const contentType = resp.headers.get('content-type');
          if (resp.ok && contentType && contentType.includes('application/json')) {
            const json = await resp.json().catch(() => ({}));
            if (json && Array.isArray(json.documents)) {
              setDocuments(json.documents as DocumentFile[]);
              setLoading(false);
              return;
            }
          }
          // If not 404 but also not valid JSON documents, fall through to direct fetch
          console.warn(`API responded with ${resp.status} (${contentType}), but no documents found. Falling back to Supabase.`);
        }
        // 404 means endpoint not deployed (local dev) - fall through to direct fetch
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          setError('Fetching documents timed out. Please check your connection.');
          setLoading(false);
          return;
        }
        // For other errors from the endpoint, surface them
        if (!String(e?.message || '').includes('404')) {
          console.error('Server fetch error:', e);
          setError(e?.message || 'Failed to fetch documents.');
          setLoading(false);
          return;
        }
      }
    }

    // Fallback: direct Supabase fetch (works on desktop, may fail on mobile)
    try {
      const query = supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      const { data: docRecords, error } = await withTimeout<{ data: any[] | null, error: any }>(
        query,
        15000,
        'Fetching documents timed out. Please check your connection and try again.'
      );

      if (error) throw error;

      // Only compute a public URL for public documents.
      // Private documents should use signed URLs created on-demand.
      const enhancedDocs = (docRecords || []).map((doc) => {
        if (doc.visibility === 'public') {
          const { data: urlData } = supabase!.storage.from('documents').getPublicUrl(doc.file_path);
          return { ...doc, public_url: urlData.publicUrl };
        }
        return { ...doc, public_url: undefined };
      });

      setDocuments(enhancedDocs as DocumentFile[]);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err?.message || 'Failed to fetch documents.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(profile?.id, session?.access_token);
  }, [profile, session, fetchDocuments]);

  // Safety timeout: Clear loading if stuck after 5 seconds
  useEffect(() => {
    if (loading) {
      const timeout = window.setTimeout(() => {
        setLoading(false);
      }, 5000);
      return () => window.clearTimeout(timeout);
    }
  }, [loading]);

  const addDocument = async (file: File, details: { name: string; visibility?: DocumentFile['visibility'] }) => {
    if (!supabase || !profile) {
      console.warn("Supabase not configured. Simulating document add.");
      const newDoc: DocumentFile = {
        id: new Date().getTime(),
        user_id: 'fallback-user',
        name: details.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        created_at: new Date().toISOString(),
        visibility: details.visibility || 'private',
        file_path: '',
      };
      setDocuments(prev => [newDoc, ...prev]);
      return;
    }

    setError(null);
    // Fail fast if auth is missing/mismatched (common on mobile when storage is cleared or session expires).
    if (!session?.user?.id) {
      throw new Error('Session expired. Please sign in again and retry.');
    }
    if (session.user.id !== profile.id) {
      throw new Error('Session mismatch. Please sign out and sign in again.');
    }

    // Prefer Vercel serverless upload to avoid mobile browser -> Supabase Storage upload issues.
    // Falls back to direct upload for local dev or if the endpoint isn't available.
    try {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 60000);
      const form = new FormData();
      form.append('file', file);
      form.append('name', details.name);
      form.append('visibility', details.visibility || 'private');

      const resp = await fetch('/api/upload-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
        signal: controller.signal,
      });
      window.clearTimeout(timeout);

      if (resp.status !== 404) {
        const contentType = resp.headers.get('content-type');
        if (resp.ok && contentType && contentType.includes('application/json')) {
          const json = await resp.json().catch(() => ({}));
          await fetchDocuments(profile.id, session.access_token);
          return;
        }
        // If not successful or not JSON, fall through
        console.warn(`Upload API responded with ${resp.status} (${contentType}). Falling back to direct upload.`);
      }
    } catch (e: any) {
      // If the endpoint exists but fails, surface that error. If it was an abort, show clear message.
      if (e?.name === 'AbortError') {
        throw new Error('Upload timed out. Please retry.');
      }
      // If we got a normal error, fall back only when the endpoint is missing (handled above),
      // otherwise throw to avoid double-uploading.
      if (String(e?.message || '').includes('Upload failed') || String(e?.message || '').includes('Missing')) {
        throw e;
      }
    }

    const filePath = `${profile.id}/${Date.now()}_${file.name}`;

    const uploadCall = supabase.storage
      .from('documents')
      .upload(filePath, file);
    const { error: uploadError } = await withTimeout<any>(
      uploadCall,
      90000,
      'Upload timed out. Mobile networks can be slow—please retry on a stronger connection.'
    );

    if (uploadError) throw uploadError;

    const newDocPayload = {
      user_id: profile.id,
      name: details.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      visibility: (details.visibility || 'private'),
      file_path: filePath,
    };

    const insertCall = supabase
      .from('documents')
      .insert(newDocPayload)
      .select()
      .single();
    const { data, error: insertError } = await withTimeout<{ data: any, error: any }>(
      insertCall,
      15000,
      'Saving document record timed out. Please retry.'
    );

    if (insertError) throw insertError;

    // Refresh the list to get the new document with its public URL
    await fetchDocuments(profile.id, session?.access_token);
  }

  const updateDocument = async (docId: number, updates: Partial<DocumentFile>) => {
    if (!supabase) {
      console.warn("Supabase not configured. Simulating document update.");
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...updates } : d));
      return;
    }
    setError(null);

    // Prefer API endpoint for mobile compatibility
    if (session?.access_token) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        const resp = await fetch('/api/update-document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docId, updates }),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (resp.status !== 404) {
          const contentType = resp.headers.get('content-type');
          if (resp.ok && contentType && contentType.includes('application/json')) {
            const json = await resp.json().catch(() => ({}));
            if (json.document) {
              setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...json.document } : d));
              return;
            }
          }
          console.warn(`Update API responded with ${resp.status} (${contentType}). Falling back to direct update.`);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          throw new Error('Update timed out. Please retry.');
        }
        if (!String(e?.message || '').includes('404')) {
          throw e;
        }
      }
    }

    // Fallback: direct Supabase (for local dev)
    const updateCall = supabase
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();
    const { data, error } = await withTimeout<{ data: any, error: any }>(
      updateCall,
      15000,
      'Updating document timed out. Please retry.'
    );

    if (error) throw error;

    setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...data } : d));
  }

  const deleteDocument = async (docId: number) => {
    if (!supabase) {
      console.warn("Supabase not configured. Simulating document delete.");
      setDocuments(docs => docs.filter(d => d.id !== docId));
      return;
    }
    setError(null);

    // Prefer API endpoint for mobile compatibility
    if (session?.access_token) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);
        const resp = await fetch('/api/delete-document', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docId }),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (resp.status !== 404) {
          const contentType = resp.headers.get('content-type');
          if (resp.ok && contentType && contentType.includes('application/json')) {
            setDocuments(docs => docs.filter(d => d.id !== docId));
            return;
          }
          console.warn(`Delete API responded with ${resp.status} (${contentType}). Falling back to direct delete.`);
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          throw new Error('Delete timed out. Please retry.');
        }
        if (!String(e?.message || '').includes('404')) {
          throw e;
        }
      }
    }

    // Fallback: direct Supabase (for local dev)
    const docToDelete = documents.find(d => d.id === docId);
    if (!docToDelete) return;

    // Delete file from storage
    const storageRemoveCall = supabase.storage
      .from('documents')
      .remove([docToDelete.file_path]);
    const { error: storageError } = await withTimeout(
      storageRemoveCall,
      20000,
      'Deleting file timed out. Please retry.'
    );

    if (storageError) {
      // Log the error but proceed to delete from DB, as the file might already be gone.
      console.error("Error deleting from storage:", storageError.message);
    }

    // Delete record from database
    const deleteCall = supabase
      .from('documents')
      .delete()
      .eq('id', docId);
    const { error: dbError } = await withTimeout<{ error: any }>(
      deleteCall,
      15000,
      'Deleting document record timed out. Please retry.'
    );

    if (dbError) throw dbError;

    setDocuments(docs => docs.filter(d => d.id !== docId));
  }

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading, error, refetch: () => fetchDocuments(profile?.id, session?.access_token) }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = (): DocumentContextType => {
  const context = useContext(DocumentContext);
  if (!context) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};