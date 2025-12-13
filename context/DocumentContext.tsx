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

const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
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
  const { profile } = useProfile();

  const fetchDocuments = useCallback(async (userId?: string) => {
    if (!supabase || !userId) {
        setDocuments(!supabase ? fallbackDocuments : []);
        setError(null);
        setLoading(false);
        return;
    };
    setLoading(true);
    setError(null);
    try {
        const query = supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        const { data: docRecords, error } = await withTimeout(
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
    fetchDocuments(profile?.id);
  }, [profile, fetchDocuments]);

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
    const filePath = `${profile.id}/${Date.now()}_${file.name}`;

    const uploadCall = supabase.storage
      .from('documents')
      .upload(filePath, file, { contentType: file.type || undefined });
    const { error: uploadError } = await withTimeout(
      uploadCall,
      90000,
      'Upload timed out. Mobile networks can be slow—please retry on a stronger connection.'
    );

    if (uploadError) throw uploadError;

    const newDocPayload = {
        user_id: profile.id,
        name: details.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        visibility: (details.visibility || 'private') as const,
        file_path: filePath,
    };

    const insertCall = supabase
      .from('documents')
      .insert(newDocPayload)
      .select()
      .single();
    const { data, error: insertError } = await withTimeout(
      insertCall,
      15000,
      'Saving document record timed out. Please retry.'
    );

    if (insertError) throw insertError;

    // Refresh the list to get the new document with its public URL
    await fetchDocuments(profile.id);
  }

  const updateDocument = async (docId: number, updates: Partial<DocumentFile>) => {
      if (!supabase) {
        console.warn("Supabase not configured. Simulating document update.");
        setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...updates } : d));
        return;
      }
      setError(null);
      const updateCall = supabase
          .from('documents')
          .update(updates)
          .eq('id', docId)
          .select()
          .single();
      const { data, error } = await withTimeout(
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
    const { error: dbError } = await withTimeout(
      deleteCall,
      15000,
      'Deleting document record timed out. Please retry.'
    );

    if (dbError) throw dbError;

    setDocuments(docs => docs.filter(d => d.id !== docId));
  }

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading, error, refetch: () => fetchDocuments(profile?.id) }}>
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