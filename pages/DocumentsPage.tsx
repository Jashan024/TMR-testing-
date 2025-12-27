import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ToggleSwitch from '../components/ToggleSwitch';
import { Input } from '../components/Input';
import { DocumentIcon, DownloadIcon, EyeIcon, LoaderIcon, PencilIcon, TrashIcon, UploadIcon } from '../components/Icons';
import { useDocuments } from '../context/DocumentContext';
import { useProfile } from '../context/ProfileContext';
import { supabase } from '../lib/supabaseClient';
import type { DocumentFile } from '../types';

// Provided by Vite `define` in `vite.config.ts`
declare const __BUILD_ID__: string;

const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile, session, loading: profileLoading } = useProfile();
  const { documents, addDocument, updateDocument, deleteDocument, loading: documentsLoading, error: documentsError, refetch } = useDocuments();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadVisibility, setUploadVisibility] = useState<DocumentFile['visibility']>('private');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const uploadTokenRef = useRef(0);

  const [search, setSearch] = useState('');
  const [editingDocId, setEditingDocId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [rowBusyId, setRowBusyId] = useState<number | null>(null);
  const [docToDelete, setDocToDelete] = useState<DocumentFile | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isRecruiter = profile?.role === 'recruiter';

  // Guard: require candidate login
  useEffect(() => {
    if (profileLoading) return;

    if (!profile) {
      try {
        sessionStorage.setItem('redirectUrl', `${window.location.origin}/#/documents`);
      } catch (_) { }
      navigate('/auth');
      return;
    }

    if (profile.role === 'recruiter') {
      navigate('/candidates');
    }
  }, [profileLoading, profile, navigate]);

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-80px)]">
        <LoaderIcon className="w-8 h-8" />
      </div>
    );
  }

  if (!profile || isRecruiter) return null;

  const filteredDocuments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => (d.name || '').toLowerCase().includes(q));
  }, [documents, search]);

  const resetUpload = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadVisibility('private');
    setUploadError(null);
  };

  const openUpload = () => {
    resetUpload();
    setIsUploadOpen(true);
  };

  const closeUpload = () => {
    // Invalidate any in-flight upload UI so mobile users aren't stuck if a request hangs.
    uploadTokenRef.current += 1;
    setIsUploadOpen(false);
    resetUpload();
    setUploadBusy(false);
  };

  const onPickFile = (file: File | null) => {
    setUploadError(null);
    setUploadFile(file);
    if (file && !uploadName.trim()) {
      setUploadName(file.name);
    }
  };

  const resolveDocUrl = async (doc: DocumentFile): Promise<string | null> => {
    // For public documents with a cached public_url, use it directly
    if (doc.visibility === 'public' && doc.public_url) return doc.public_url;

    // Prefer API endpoint for mobile compatibility
    if (session?.access_token) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        const resp = await fetch('/api/get-document-url', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ docId: doc.id }),
          signal: controller.signal,
        });
        window.clearTimeout(timeout);

        if (resp.status !== 404) {
          const json = await resp.json().catch(() => ({}));
          if (resp.ok && json.url) {
            return json.url;
          }
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          console.error('Failed to get document URL via API:', e);
        }
      }
    }

    // Fallback: direct Supabase (for local dev)
    if (!supabase) return doc.public_url || null;

    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(doc.file_path, 60 * 10);
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (e) {
      console.error('Failed to create signed URL:', e);
      return null;
    }
  };

  const handleView = async (doc: DocumentFile) => {
    setRowBusyId(doc.id);
    const url = await resolveDocUrl(doc);
    setRowBusyId(null);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (doc: DocumentFile) => {
    setRowBusyId(doc.id);
    const url = await resolveDocUrl(doc);
    setRowBusyId(null);
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name || 'document';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDelete = (doc: DocumentFile) => {
    setDocToDelete(doc);
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!docToDelete) return;

    setRowBusyId(docToDelete.id);
    try {
      await deleteDocument(docToDelete.id);
      setIsDeleteModalOpen(false);
      setDocToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err?.message || 'Failed to delete document. Please try again.');
    } finally {
      setRowBusyId(null);
    }
  };

  const startRename = (doc: DocumentFile) => {
    setEditingDocId(doc.id);
    setEditingName(doc.name || '');
  };

  const cancelRename = () => {
    setEditingDocId(null);
    setEditingName('');
  };

  const saveRename = async (doc: DocumentFile, forcedName?: string) => {
    const next = (forcedName !== undefined ? forcedName : editingName).trim();
    if (!next || next === doc.name) {
      cancelRename();
      return;
    }
    setRowBusyId(doc.id);
    try {
      await updateDocument(doc.id, { name: next });
      cancelRename();
    } catch (err: any) {
      console.error('Rename failed:', err);
      // Stay in editing mode so they can fix it
    } finally {
      setRowBusyId(null);
    }
  };

  const handleToggleVisibility = async (doc: DocumentFile, isPublic: boolean) => {
    const nextVisibility: DocumentFile['visibility'] = isPublic ? 'public' : 'private';
    setRowBusyId(doc.id);
    try {
      await updateDocument(doc.id, { visibility: nextVisibility });
    } finally {
      setRowBusyId(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!uploadFile) {
      setUploadError('Pick a file to upload.');
      return;
    }
    const name = uploadName.trim() || uploadFile.name;
    if (!name) {
      setUploadError('Enter a document name.');
      return;
    }

    // Basic client-side limit (prevents accidental huge uploads on mobile data).
    const MAX_BYTES = 15 * 1024 * 1024; // 15MB
    if (uploadFile.size > MAX_BYTES) {
      setUploadError('File too large. Max 15MB.');
      return;
    }

    const myToken = uploadTokenRef.current + 1;
    uploadTokenRef.current = myToken;
    setUploadBusy(true);
    try {
      await addDocument(uploadFile, { name, visibility: uploadVisibility });
      if (uploadTokenRef.current === myToken) {
        closeUpload();
      }
    } catch (err: any) {
      if (uploadTokenRef.current === myToken) {
        setUploadError(err?.message || 'Upload failed.');
      }
    } finally {
      if (uploadTokenRef.current === myToken) {
        setUploadBusy(false);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl animate-fade-in-up">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            Management
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">Documents</h1>
          <p className="text-lg text-zinc-600 max-w-2xl font-light">
            Securely manage your resumes, certifications, and portfolios.
            Toggle visibility to share specific files on your <span className="text-emerald-600 font-medium">public portfolio</span>.
          </p>
          <div className="flex items-center space-x-4 pt-2">
            <div className="text-[10px] text-zinc-400 font-mono tracking-tighter bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">
              BUILD: {__BUILD_ID__.substring(0, 8)}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button onClick={openUpload} variant="primary" className="shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
            <UploadIcon className="w-5 h-5 mr-3" />
            Upload Document
          </Button>
        </div>
      </header>

      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <Input
            label="Search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name"
          />
          <div className="text-sm text-zinc-500 sm:text-right">
            {documentsLoading ? 'Loading…' : `${filteredDocuments.length} document${filteredDocuments.length === 1 ? '' : 's'}`}
          </div>
        </div>
      </Card>

      {documentsError && !documentsLoading && (
        <Card className="mb-6 border border-red-900/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-red-300">
              {documentsError}
            </div>
            <Button onClick={() => refetch()} variant="secondary" className="w-full sm:w-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {documentsLoading ? (
        <div className="flex justify-center items-center py-16">
          <LoaderIcon className="w-10 h-10" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-10 text-center border-zinc-200">
          <div className="flex justify-center mb-4">
            <DocumentIcon className="w-14 h-14 text-emerald-500" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">No documents yet</h2>
          <p className="mt-2 text-zinc-600">Upload your resume or certifications to share quickly.</p>
          <div className="mt-6">
            <Button onClick={openUpload} variant="primary">
              <UploadIcon className="w-5 h-5 mr-2" />
              Upload your first document
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((doc) => {
            const isRowBusy = rowBusyId === doc.id;
            const isEditing = editingDocId === doc.id;
            const isPublic = doc.visibility === 'public';

            return (
              <Card key={doc.id} className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {!isEditing ? (
                      <div className="flex items-start gap-3">
                        <DocumentIcon className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-zinc-900 font-semibold truncate">{doc.name}</p>
                          <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                            <span>{doc.size}</span>
                            <span>{new Date(doc.created_at).toLocaleString()}</span>
                            <span className={isPublic ? 'text-emerald-600 font-bold' : 'text-zinc-400'}>
                              {isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative">
                          <Input
                            label="Document name"
                            name={`rename_${doc.id}`}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => saveRename(doc)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRename(doc);
                              if (e.key === 'Escape') cancelRename();
                            }}
                            disabled={isRowBusy}
                            autoFocus
                          />
                          {isRowBusy && (
                            <div className="absolute right-4 bottom-3">
                              <LoaderIcon className="w-4 h-4 animate-spin text-emerald-500" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider px-1">
                          Press Enter to save • ESC to cancel
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  {!isEditing && (
                    <div className="flex flex-col sm:items-end gap-6 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-zinc-100 pt-4 sm:pt-0">
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest text-[10px]">Visibility</span>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] uppercase font-bold tracking-tighter ${isPublic ? 'text-emerald-600' : 'text-zinc-400'}`}>
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                          <ToggleSwitch
                            id={`doc_visibility_${doc.id}`}
                            checked={isPublic}
                            onChange={(checked) => handleToggleVisibility(doc, checked)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-4 sm:flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleView(doc)}
                          disabled={isRowBusy}
                          className="flex items-center justify-center aspect-square sm:aspect-auto sm:px-4 sm:py-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 border border-zinc-200 transition-all active:scale-90"
                          title="View"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          disabled={isRowBusy}
                          className="flex items-center justify-center aspect-square sm:aspect-auto sm:px-4 sm:py-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 border border-zinc-200 transition-all active:scale-90"
                          title="Download"
                        >
                          <DownloadIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => startRename(doc)}
                          disabled={isRowBusy}
                          className="flex items-center justify-center aspect-square sm:aspect-auto sm:px-4 sm:py-2.5 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 border border-zinc-200 transition-all active:scale-90"
                          title="Rename"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          disabled={isRowBusy}
                          className="flex items-center justify-center aspect-square sm:aspect-auto sm:px-4 sm:py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 transition-all active:scale-90"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal isOpen={isUploadOpen} onClose={closeUpload} title="Upload Document">
        <form onSubmit={handleUploadSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">File</label>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <input
                type="file"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                disabled={false}
                className="block w-full text-sm text-zinc-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white file:text-zinc-900 file:border file:border-zinc-200 hover:file:bg-zinc-50"
              />
              {uploadFile && (
                <p className="mt-3 text-xs text-zinc-600 break-all">
                  Selected: <span className="text-zinc-900 font-medium">{uploadFile.name}</span>
                </p>
              )}
              <p className="mt-2 text-xs text-zinc-500">
                Works on mobile and desktop. Max 15MB.
              </p>
            </div>
          </div>

          <Input
            label="Display name"
            name="upload_name"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g. Resume - John Doe.pdf"
            disabled={uploadBusy}
          />

          <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-medium text-zinc-900">Public</p>
              <p className="text-xs text-zinc-600 mt-0.5">Public docs appear on your public profile.</p>
            </div>
            <ToggleSwitch
              id="upload_visibility"
              checked={uploadVisibility === 'public'}
              onChange={(checked) => setUploadVisibility(checked ? 'public' : 'private')}
            />
          </div>

          {uploadError && <p className="text-sm text-red-400">{uploadError}</p>}

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={closeUpload} disabled={false}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={uploadBusy} disabled={!uploadFile}>
              Upload
            </Button>
          </div>
        </form>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !rowBusyId && setIsDeleteModalOpen(false)}
        title="Delete Document"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100">
              <TrashIcon className="w-10 h-10 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Are you absolutely sure?</h3>
            <p className="mt-2 text-zinc-500 font-light">
              You are about to permanently delete <span className="font-bold text-zinc-900">"{docToDelete?.name}"</span>.
              This action cannot be undone.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={() => setIsDeleteModalOpen(false)}
              variant="secondary"
              className="flex-1"
              disabled={!!rowBusyId}
            >
              Cancel
            </Button>
            <Button
              onClick={executeDelete}
              variant="primary"
              className="flex-1 bg-red-600 from-red-500 to-red-700 hover:shadow-red-500/20"
              loading={!!rowBusyId}
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentsPage;
