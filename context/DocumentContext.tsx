import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { DocumentFile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from './ProfileContext';

interface DocumentContextType {
  documents: DocumentFile[];
  addDocument: (file: File, details: { name: string }) => Promise<void>;
  updateDocument: (docId: number, updates: Partial<DocumentFile>) => Promise<void>;
  deleteDocument: (docId: number) => Promise<void>;
  loading: boolean;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const fallbackDocuments: DocumentFile[] = [
  { id: 1, user_id: 'fallback-user', name: 'Resume_Frontend_Engineer.pdf', size: '248 KB', created_at: '2023-10-26', visibility: 'public', file_path: '', public_url: '#' },
  { id: 2, user_id: 'fallback-user', name: 'Cover_Letter_Startup.pdf', size: '112 KB', created_at: '2023-10-22', visibility: 'private', file_path: '', public_url: '#' },
  { id: 3, user_id: 'fallback-user', name: 'Design_Portfolio_2023.pdf', size: '5.8 MB', created_at: '2023-09-15', visibility: 'public', file_path: '', public_url: '#' },
];

export const DocumentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  const fetchDocuments = useCallback(async (userId?: string) => {
    if (!supabase || !userId) {
      setDocuments(!supabase ? fallbackDocuments : []);
      setLoading(false);
      return;
    };
    setLoading(true);
    try {
      const { data: docRecords, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance documents with their public URLs
      const enhancedDocs = await Promise.all(
        (docRecords || []).map(async (doc) => {
          const { data: urlData } = supabase!.storage.from('documents').getPublicUrl(doc.file_path);
          return { ...doc, public_url: urlData.publicUrl };
        })
      );

      setDocuments(enhancedDocs);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments(profile?.id);
  }, [profile, fetchDocuments]);

  const addDocument = async (file: File, details: { name: string; visibility?: 'public' | 'private' }) => {
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

    // Get the current session token for authentication
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('[Upload] Session error:', sessionError);
      throw new Error('Failed to get session. Please log in again.');
    }

    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      throw new Error('No active session. Please log in again.');
    }

    // Use FormData for multipart upload (works better on mobile)
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', details.name);
    formData.append('visibility', details.visibility || 'private');

    // Use Vercel API endpoint for reliable mobile uploads
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout for mobile

    try {
      const response = await fetch('/api/upload-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      // Refresh the document list to get the new document
      await fetchDocuments(profile.id);
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Upload timed out. Please check your connection and try again.');
      }
      throw err;
    }
  }

  const updateDocument = async (docId: number, updates: Partial<DocumentFile>) => {
    if (!supabase) {
      console.warn("Supabase not configured. Simulating document update.");
      setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...updates } : d));
      return;
    }
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw error;

    setDocuments(docs => docs.map(d => d.id === docId ? { ...d, ...data } : d));
  }

  const deleteDocument = async (docId: number) => {
    if (!supabase) {
      console.warn("Supabase not configured. Simulating document delete.");
      setDocuments(docs => docs.filter(d => d.id !== docId));
      return;
    }
    const docToDelete = documents.find(d => d.id === docId);
    if (!docToDelete) return;

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([docToDelete.file_path]);

    if (storageError) {
      // Log the error but proceed to delete from DB, as the file might already be gone.
      console.error("Error deleting from storage:", storageError.message);
    }

    // Delete record from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docId);

    if (dbError) throw dbError;

    setDocuments(docs => docs.filter(d => d.id !== docId));
  }

  return (
    <DocumentContext.Provider value={{ documents, addDocument, updateDocument, deleteDocument, loading }}>
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