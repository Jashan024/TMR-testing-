import React, { useState } from 'react';
import { useDocuments } from '../context/DocumentContext';
import type { DocumentFile } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { Input } from '../components/Input';
import ToggleSwitch from '../components/ToggleSwitch';
import { UploadIcon, DocumentIcon, PencilIcon, TrashIcon, LoaderIcon, EyeIcon, LockClosedIcon, DownloadIcon } from '../components/Icons';

// --- Upload Modal Form ---
const UploadForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { addDocument } = useDocuments();
    const [file, setFile] = useState<File | null>(null);
    const [docName, setDocName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Security: Validate file type and size
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'application/rtf'
            ];

            if (!allowedTypes.includes(selectedFile.type)) {
                setError('Please select a valid file type (PDF, DOCX, DOC, TXT, RTF).');
                return;
            }

            if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
                setError('File size must be less than 10MB.');
                return;
            }

            setFile(selectedFile);
            setDocName(selectedFile.name.replace(/\.[^/.]+$/, "")); // Pre-fill name without extension
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !docName.trim()) {
            setError('Please provide a file and a name.');
            return;
        }
        setError('');
        setIsUploading(true);
        try {
            await addDocument(file, { name: docName.trim() });
            onClose();
        } catch (err: any) {
            console.error('Upload failed:', err);
            let errorMessage = 'An unexpected error occurred during upload. Please try again.';

            // Supabase errors often have a `message` property.
            if (err && typeof err.message === 'string') {
                errorMessage = err.message;
            }
            // Sometimes the error is nested inside an 'error' object.
            else if (err && err.error && typeof err.error.message === 'string') {
                errorMessage = err.error.message;
            }

            // Check for specific common issues to give better feedback.
            if (errorMessage.includes('security policy') || errorMessage.includes('permission denied')) {
                errorMessage = "Upload failed due to security policies. Please ensure permissions are correctly set up in Supabase.";
            }

            setError(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
                    Document File
                </label>
                <div className="mt-1 flex justify-center px-4 sm:px-6 pt-6 pb-8 border-2 border-gray-600 border-dashed rounded-lg hover:border-cyan-500 active:border-cyan-500 active:bg-gray-800/50 transition-colors">
                    <div className="space-y-2 text-center">
                        <UploadIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-500" />
                        <div className="text-sm text-gray-400">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500 px-3 py-2 inline-block touch-manipulation">
                                <span>Select file</span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt,.rtf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    className="sr-only"
                                    onChange={handleFileChange}
                                />
                            </label>
                        </div>
                        {file ? (
                            <p className="text-sm text-gray-300 break-all px-2">{file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
                        ) : (
                            <p className="text-xs text-gray-500">PDF, DOCX, TXT up to 10MB</p>
                        )}
                    </div>
                </div>
            </div>
            <Input label="Document Name" name="docName" value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="e.g. My Resume (October 2023)" required />
            {error && (
                <div className="flex items-start space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                <Button type="submit" variant="primary" loading={isUploading} disabled={!file || isUploading} className="w-full sm:w-auto order-1 sm:order-2">
                    {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
            </div>
        </form>
    );
};

// --- Edit Name Modal Form ---
const EditNameForm: React.FC<{ doc: DocumentFile; onClose: () => void; onSave: (docId: number, newName: string) => Promise<void> }> = ({ doc, onClose, onSave }) => {
    const [newName, setNewName] = useState(doc.name);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) {
            setError('Please enter a document name.');
            return;
        }
        setError('');
        setIsSaving(true);
        try {
            await onSave(doc.id, newName.trim());
            onClose();
        } catch (err: any) {
            console.error('Failed to update name:', err);
            setError(err.message || 'Failed to update document name.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
                label="Document Name"
                name="docName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. My Resume (October 2023)"
                required
            />
            {error && (
                <div className="flex items-start space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
                    <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                <Button type="submit" variant="primary" loading={isSaving} disabled={!newName.trim() || isSaving} className="w-full sm:w-auto order-1 sm:order-2">
                    {isSaving ? 'Saving...' : 'Save'}
                </Button>
            </div>
        </form>
    );
};

// --- Main Documents Page ---
const DocumentsPage: React.FC = () => {
    const { documents, updateDocument, deleteDocument, loading } = useDocuments();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DocumentFile | null>(null);

    const handleVisibilityChange = async (doc: DocumentFile, isPublic: boolean) => {
        try {
            await updateDocument(doc.id, { visibility: isPublic ? 'public' : 'private' });
        } catch (error) {
            console.error('Failed to update visibility:', error);
            alert('Could not update document visibility. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (!selectedDoc) return;
        try {
            await deleteDocument(selectedDoc.id);
            setIsDeleteModalOpen(false);
            setSelectedDoc(null);
        } catch (error) {
            console.error('Failed to delete document:', error);
            alert('Could not delete document. Please try again.');
        }
    };

    const handleEditName = async (docId: number, newName: string) => {
        await updateDocument(docId, { name: newName });
    };

    const openEditModal = (doc: DocumentFile) => {
        setSelectedDoc(doc);
        setIsEditModalOpen(true);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedDoc(null);
    };

    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl animate-fade-in-up">
                <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white">Your Documents</h1>
                        <p className="text-lg sm:text-xl text-gray-300 mt-2">Manage your career-related files here.</p>
                    </div>
                    <Button onClick={() => setIsUploadModalOpen(true)} className="mt-4 sm:mt-0 w-full sm:w-auto">
                        <UploadIcon className="w-5 h-5 mr-2"/>
                        Upload Document
                    </Button>
                </header>

                <Card className="p-4 sm:p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <LoaderIcon className="w-10 h-10 animate-spin" />
                        </div>
                    ) : documents.length > 0 ? (
                        <div className="space-y-4">
                            {documents.map(doc => (
                                <div key={doc.id} className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/80 hover:border-gray-600 transition-colors">
                                    {/* Top row: Icon + Name */}
                                    <div className="flex items-start mb-4">
                                        <DocumentIcon className="w-8 h-8 text-cyan-400 flex-shrink-0 mt-1" />
                                        <div className="ml-3 flex-grow min-w-0">
                                            <p className="font-semibold text-white break-words text-base sm:text-lg">{doc.name}</p>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {doc.size} &middot; {new Date(doc.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bottom row: Actions - optimized for mobile touch */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-gray-700/50">
                                        {/* Visibility toggle */}
                                        <div className="flex items-center space-x-3 w-full sm:w-auto">
                                            {doc.visibility === 'public' ? <EyeIcon className="w-5 h-5 text-green-400 flex-shrink-0" /> : <LockClosedIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                                            <ToggleSwitch
                                                id={`vis-${doc.id}`}
                                                checked={doc.visibility === 'public'}
                                                onChange={(isChecked) => handleVisibilityChange(doc, isChecked)}
                                            />
                                            <span className="text-sm text-gray-300 min-w-fit">
                                                {doc.visibility === 'public' ? 'Public' : 'Private'}
                                            </span>
                                        </div>

                                        {/* Action buttons - larger touch targets for mobile */}
                                        <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
                                            <a
                                                href={doc.public_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-3 text-gray-400 hover:text-cyan-400 active:text-cyan-300 transition rounded-lg hover:bg-gray-800 active:bg-gray-700 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                title="View Document"
                                                aria-label="View document"
                                            >
                                                <EyeIcon className="w-5 h-5"/>
                                            </a>
                                            <a
                                                href={doc.public_url}
                                                download
                                                className="p-3 text-gray-400 hover:text-cyan-400 active:text-cyan-300 transition rounded-lg hover:bg-gray-800 active:bg-gray-700 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                title="Download Document"
                                                aria-label="Download document"
                                            >
                                                <DownloadIcon className="w-5 h-5"/>
                                            </a>
                                            <button
                                                onClick={() => openEditModal(doc)}
                                                className="p-3 text-gray-400 hover:text-white active:text-gray-200 transition rounded-lg hover:bg-gray-800 active:bg-gray-700 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                title="Edit Name"
                                                aria-label="Edit document name"
                                            >
                                                <PencilIcon className="w-5 h-5"/>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedDoc(doc);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                                className="p-3 text-gray-400 hover:text-red-400 active:text-red-300 transition rounded-lg hover:bg-gray-800 active:bg-gray-700 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                                                title="Delete Document"
                                                aria-label="Delete document"
                                            >
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <DocumentIcon className="w-16 h-16 mx-auto text-gray-600" />
                            <h3 className="mt-4 text-xl font-semibold text-white">No Documents Yet</h3>
                            <p className="mt-2 text-gray-400">Tap "Upload Document" to add your first file.</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Modals with proper z-index management */}
            <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload New Document">
                <UploadForm onClose={() => setIsUploadModalOpen(false)} />
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
                {selectedDoc && (
                    <div className="text-gray-300">
                        <div className="mb-6">
                            <p className="font-medium text-white mb-1">Delete Document</p>
                            <p className="text-red-400 text-sm">⚠️ This action cannot be undone.</p>
                            <p>Are you sure you want to permanently delete this document?</p>
                        </div>
                        <div className="p-3 bg-gray-900/60 border border-gray-700 rounded-lg mb-6">
                            <p className="font-semibold text-white">{selectedDoc.name}</p>
                            <p className="text-sm text-gray-400">{selectedDoc.size}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-end gap-3">
                            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">Cancel</Button>
                            <Button variant="primary" onClick={handleDelete} className="w-full sm:w-auto bg-red-600 hover:bg-red-500 focus:ring-red-500 order-1 sm:order-2">Delete</Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={closeEditModal} title="Edit Document Name">
                {selectedDoc && (
                    <EditNameForm doc={selectedDoc} onClose={closeEditModal} onSave={handleEditName} />
                )}
            </Modal>
        </>
    );
};

export default DocumentsPage;