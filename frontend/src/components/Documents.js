import React, { useState, useEffect, useRef } from 'react';
import { documentsApi } from '../services/api';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAll();
      setDocuments(response.data || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить документы');
      console.error('Error loading documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      setSelectedFile(file);
      if (!documentName) {
        // Используем имя файла без расширения как название документа
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setDocumentName(nameWithoutExt);
      }
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) {
      setError('Пожалуйста, выберите файл и укажите название документа');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentName.trim());

      await documentsApi.create(formData);
      
      // Закрываем модальное окно и очищаем состояние
      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setDocumentName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Перезагружаем список документов
      await loadDocuments();
    } catch (err) {
      setError('Не удалось загрузить документ');
      console.error('Error uploading document:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setDocumentName('');
    setIsDragging(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <Sidebar />
      <div className={`documents-container ${!isSidebarOpen ? 'documents-container-expanded' : ''}`}>
        <div className="documents-content">
          <div className="documents-header">
            <h1>Документы</h1>
            <button 
              onClick={() => setIsUploadModalOpen(true)} 
              className="documents-upload-btn"
            >
              + Загрузить документ
            </button>
          </div>

          {error && (
            <div className="documents-error">
              {error}
              <button onClick={() => setError(null)} className="documents-error-close">✕</button>
            </div>
          )}

          {loading && (
            <div className="documents-loading">Загрузка...</div>
          )}

          {!loading && documents.length === 0 && (
            <div className="documents-empty">
              <p>У вас пока нет документов</p>
              <button 
                onClick={() => setIsUploadModalOpen(true)} 
                className="documents-upload-btn-large"
              >
                Загрузить первый документ
              </button>
            </div>
          )}

          {!loading && documents.length > 0 && (
            <div className="documents-list">
              {documents.map((doc) => (
                <div key={doc.id} className="document-card">
                  <div className="document-card-header">
                    <div className="document-card-icon">📄</div>
                    <div className="document-card-info">
                      <h3 className="document-card-title">{doc.name}</h3>
                      <p className="document-card-filename">{doc.filename}</p>
                    </div>
                  </div>
                  <div className="document-card-meta">
                    <div className="document-meta-item">
                      <span className="document-meta-label">Загружен:</span>
                      <span className="document-meta-value">{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.indexed_at && (
                      <div className="document-meta-item">
                        <span className="document-meta-label">Проиндексирован:</span>
                        <span className="document-meta-value">{formatDate(doc.indexed_at)}</span>
                      </div>
                    )}
                    {!doc.indexed_at && (
                      <div className="document-meta-item">
                        <span className="document-meta-label document-meta-label-warning">Статус:</span>
                        <span className="document-meta-value document-meta-value-warning">Ожидает индексации</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Модальное окно загрузки */}
        {isUploadModalOpen && (
          <div className="documents-modal-overlay" onClick={handleCloseModal}>
            <div className="documents-modal" onClick={(e) => e.stopPropagation()}>
              <div className="documents-modal-header">
                <h2>Загрузить документ</h2>
                <button onClick={handleCloseModal} className="documents-modal-close">✕</button>
              </div>

              <div className="documents-modal-content">
                {/* Зона drag-and-drop */}
                <div
                  ref={dropZoneRef}
                  className={`documents-drop-zone ${isDragging ? 'documents-drop-zone-active' : ''} ${selectedFile ? 'documents-drop-zone-has-file' : ''}`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={handleFileInputChange}
                    accept=".pdf,.doc,.docx,.txt,.md"
                  />
                  {selectedFile ? (
                    <div className="documents-file-selected">
                      <div className="documents-file-icon">📄</div>
                      <div className="documents-file-info">
                        <div className="documents-file-name">{selectedFile.name}</div>
                        <div className="documents-file-size">{formatFileSize(selectedFile.size)}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="documents-file-remove"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="documents-drop-zone-content">
                      <div className="documents-drop-zone-icon">📤</div>
                      <div className="documents-drop-zone-text">
                        <p className="documents-drop-zone-title">
                          Перетащите файл сюда или нажмите для выбора
                        </p>
                        <p className="documents-drop-zone-hint">
                          Поддерживаются форматы: PDF, DOC, DOCX, TXT, MD
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Поле для названия документа */}
                <div className="documents-form-group">
                  <label htmlFor="document-name">Название документа</label>
                  <input
                    id="document-name"
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Введите название документа"
                    className="documents-input"
                  />
                </div>
              </div>

              <div className="documents-modal-footer">
                <button
                  onClick={handleCloseModal}
                  className="documents-btn documents-btn-secondary"
                  disabled={uploading}
                >
                  Отмена
                </button>
                <button
                  onClick={handleUpload}
                  className="documents-btn documents-btn-primary"
                  disabled={uploading || !selectedFile || !documentName.trim()}
                >
                  {uploading ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default Documents;

