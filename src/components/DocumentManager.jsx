"use client";
import React, { useState, useRef } from 'react';
import {
  AttachFile as AttachFileIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Link as LinkIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const DocumentManager = ({ documents = [], onDocumentsChange, darkMode, maxFiles = 10 }) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDocument, setNewDocument] = useState({ name: '', url: '', type: 'link' });
  const fileInputRef = useRef(null);

  // Ensure documents is always an array
  const safeDocuments = Array.isArray(documents) ? documents : [];

  // Get file icon based on file type
  const getFileIcon = (fileName, type) => {
    if (type === 'link') return <LinkIcon className="text-blue-500" />;
    
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon className="text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <ImageIcon className="text-green-500" />;
      case 'doc':
      case 'docx':
        return <DocIcon className="text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <DocIcon className="text-green-600" />;
      case 'ppt':
      case 'pptx':
        return <DocIcon className="text-orange-500" />;
      default:
        return <FileIcon className="text-gray-500" />;
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (safeDocuments.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      type: 'file',
      size: file.size,
      file: file,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString()
    }));

    onDocumentsChange([...safeDocuments, ...newDocuments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle link addition
  const handleAddLink = () => {
    if (!newDocument.name.trim() || !newDocument.url.trim()) {
      alert('Please provide both name and URL');
      return;
    }

    const linkDocument = {
      id: Date.now() + Math.random(),
      name: newDocument.name.trim(),
      url: newDocument.url.trim(),
      type: 'link',
      addedAt: new Date().toISOString()
    };

    onDocumentsChange([...safeDocuments, linkDocument]);
    setNewDocument({ name: '', url: '', type: 'link' });
    setShowAddDialog(false);
  };

  // Remove document
  const handleRemove = (id) => {
    const updatedDocuments = safeDocuments.filter(doc => doc.id !== id);
    onDocumentsChange(updatedDocuments);
  };

  // Download file
  const handleDownload = (docItem) => {
    try {
      if (docItem.type === 'file' && docItem.url) {
        // Create download link for uploaded files
        const linkElement = window.document.createElement('a');
        linkElement.href = docItem.url;
        linkElement.download = docItem.name || 'download';
        linkElement.style.display = 'none';
        window.document.body.appendChild(linkElement);
        linkElement.click();
        window.document.body.removeChild(linkElement);
      } else if (docItem.type === 'link' && docItem.url) {
        // Open external links in new tab
        window.open(docItem.url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download/open document. Please try again.');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AttachFileIcon fontSize="small" className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Documents ({safeDocuments.length}/{maxFiles})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddDialog(true)}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
              darkMode 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            disabled={safeDocuments.length >= maxFiles}
          >
            <LinkIcon fontSize="small" />
            Add Link
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center gap-1 px-3 py-1 rounded text-xs ${
              darkMode 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
            disabled={safeDocuments.length >= maxFiles}
          >
            <AttachFileIcon fontSize="small" />
            Upload File
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.svg"
          />
        </div>
      </div>

      {/* Documents List */}
      {safeDocuments.length === 0 ? (
        <div className={`text-center py-8 border-2 border-dashed rounded-lg ${
          darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-50'
        }`}>
          <AttachFileIcon className={`text-4xl ${darkMode ? 'text-gray-500' : 'text-gray-400'} mb-2`} />
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No documents attached
          </p>
          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
            Add files or links to provide additional context
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeDocuments.map((doc) => (
            <div
              key={doc.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              } transition-colors`}
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(doc.name, doc.type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'} truncate`}>
                  {doc.name}
                </div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} flex items-center gap-2`}>
                  <span className="capitalize">{doc.type}</span>
                  {doc.size && <span>• {formatFileSize(doc.size)}</span>}
                  {doc.type === 'link' && (
                    <span className="truncate max-w-xs">• {doc.url}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDownload(doc)}
                  className={`p-1 rounded transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                  }`}
                  title={doc.type === 'link' ? 'Open Link' : 'Download'}
                >
                  {doc.type === 'link' ? (
                    <LinkIcon fontSize="small" />
                  ) : (
                    <DownloadIcon fontSize="small" />
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRemove(doc.id)}
                  className={`p-1 rounded transition-colors ${
                    darkMode 
                      ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' 
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  }`}
                  title="Remove"
                >
                  <DeleteIcon fontSize="small" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Link Dialog */}
      {showAddDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddDialog(false)}
        >
          <div 
            className={`w-full max-w-md p-6 rounded-lg shadow-lg ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Add Document Link
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDialog(false)}
                className={`p-1 rounded transition-colors ${
                  darkMode 
                    ? 'text-gray-400 hover:text-gray-200' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  Document Name
                </label>
                <input
                  type="text"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                  placeholder="e.g., Project Requirements Doc"
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  URL
                </label>
                <input
                  type="url"
                  value={newDocument.url}
                  onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                  placeholder="https://..."
                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
                >
                  Add Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddDialog(false)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;