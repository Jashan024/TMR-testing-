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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:entry',message:'fetchDocuments called',data:{hasSupabase:!!supabase,userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!supabase || !userId) {
        setDocuments(!supabase ? fallbackDocuments : []);
        setLoading(false);
        return;
    };
    setLoading(true);
    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:beforeQuery',message:'About to query documents table',data:{userId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const { data: docRecords, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:afterQuery',message:'Documents query completed',data:{hasError:!!error,errorMsg:error?.message,docCount:docRecords?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        if (error) throw error;
        
        // Enhance documents with their public URLs - add timeout protection
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:beforeEnhance',message:'About to enhance documents with URLs',data:{docCount:docRecords?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const enhancedDocs = await Promise.all(
          (docRecords || []).map(async (doc) => {
            try {
              const { data: urlData } = supabase!.storage.from('documents').getPublicUrl(doc.file_path);
              return { ...doc, public_url: urlData.publicUrl };
            } catch (urlError) {
              // If URL generation fails, use a fallback
              console.warn('Failed to generate public URL for document:', doc.id, urlError);
              return { ...doc, public_url: '#' };
            }
          })
        );

        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:afterEnhance',message:'Documents enhancement completed',data:{enhancedCount:enhancedDocs.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion

        setDocuments(enhancedDocs);
    } catch(error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:catch',message:'Error in fetchDocuments',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Error fetching documents:', error);
        // Set empty array on error to prevent UI from being stuck
        setDocuments([]);
    } finally {
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:fetchDocuments:finally',message:'fetchDocuments finally block',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
    }
  }, []);

  useEffect(() => {
    fetchDocuments(profile?.id);
  }, [profile, fetchDocuments]);
  
  const addDocument = async (file: File, details: { name: string }) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:entry',message:'addDocument called',data:{hasSupabase:!!supabase,hasProfile:!!profile,profileId:profile?.id,fileName:file?.name,fileSize:file?.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!supabase || !profile) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:fallback',message:'Using fallback (no supabase or profile)',data:{hasSupabase:!!supabase,hasProfile:!!profile},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.warn("Supabase not configured. Simulating document add.");
        const newDoc: DocumentFile = {
            id: new Date().getTime(),
            user_id: 'fallback-user',
            name: details.name,
            size: `${(file.size / 1024).toFixed(1)} KB`,
            created_at: new Date().toISOString(),
            visibility: 'private',
            file_path: '',
        };
        setDocuments(prev => [newDoc, ...prev]);
        return;
    }
    
    const filePath = `${profile.id}/${Date.now()}_${file.name}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:beforeUpload',message:'About to upload to storage',data:{filePath,bucket:'documents'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:afterUpload',message:'Storage upload completed',data:{hasUploadError:!!uploadError,uploadErrorMsg:uploadError?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion

    if (uploadError) throw uploadError;

    const newDocPayload = {
        user_id: profile.id,
        name: details.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        visibility: 'private' as const,
        file_path: filePath,
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:beforeInsert',message:'About to insert DB record',data:{newDocPayload},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    const { data, error: insertError } = await supabase
      .from('documents')
      .insert(newDocPayload)
      .select()
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:afterInsert',message:'DB insert completed',data:{hasInsertError:!!insertError,insertErrorMsg:insertError?.message,insertedId:data?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (insertError) throw insertError;

    // Optimistically add the new document to the list immediately (mobile fix)
    // This prevents UI from being stuck if fetchDocuments hangs
    const optimisticDoc: DocumentFile = {
        ...data,
        public_url: supabase.storage.from('documents').getPublicUrl(filePath).data.publicUrl,
    };
    setDocuments(prev => [optimisticDoc, ...prev]);
    
    // Refresh the list in the background (non-blocking) to get accurate data
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:beforeFetch',message:'About to call fetchDocuments (non-blocking)',data:{profileId:profile.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // Don't await - let it run in background to prevent blocking
    fetchDocuments(profile.id).catch((fetchErr) => {
        // Log but don't throw - document is already uploaded and added optimistically
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:fetchError',message:'fetchDocuments failed in background',data:{error:String(fetchErr)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('Failed to refresh document list after upload:', fetchErr);
    });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/66615c1c-0aba-4a25-90c3-c3bf24783512',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DocumentContext.tsx:addDocument:afterFetch',message:'addDocument returning (fetchDocuments running in background)',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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