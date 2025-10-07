import React, { useState, useEffect } from 'react';
import { notesApi } from '../services/api';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedPath, setEditedPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await notesApi.getAll();
      setNotes(response.data.notes || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить конспекты');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = async (noteId) => {
    try {
      const response = await notesApi.getById(noteId);
      setSelectedNote(response.data);
      setIsEditing(false);
      setIsCreating(false);
    } catch (err) {
      setError('Не удалось загрузить конспект');
      console.error('Error loading note:', err);
    }
  };

  const handleEdit = () => {
    if (selectedNote) {
      setEditedTitle(selectedNote.title);
      setEditedContent(selectedNote.content);
      setEditedPath(selectedNote.path);
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      if (isCreating) {
        const response = await notesApi.create({
          title: editedTitle,
          content: editedContent,
          path: editedPath,
        });
        setSelectedNote(response.data);
        await loadNotes();
        setIsCreating(false);
      } else if (selectedNote) {
        const response = await notesApi.update(selectedNote.id, {
          id: selectedNote.id,
          title: editedTitle,
          content: editedContent,
          path: editedPath,
        });
        setSelectedNote(response.data);
        await loadNotes();
      }
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить конспект');
      console.error('Error saving note:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditedTitle('');
    setEditedContent('');
    setEditedPath('');
  };

  const handleDelete = async () => {
    if (selectedNote && window.confirm('Вы уверены, что хотите удалить этот конспект?')) {
      try {
        await notesApi.delete(selectedNote.id);
        setSelectedNote(null);
        await loadNotes();
        setError(null);
      } catch (err) {
        setError('Не удалось удалить конспект');
        console.error('Error deleting note:', err);
      }
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedNote(null);
    setEditedTitle('');
    setEditedContent('');
    setEditedPath('');
  };

  const renderMarkdown = (text) => {
    // Простой рендеринг markdown
    if (!text) return '';
    
    let html = text
      // Заголовки
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Жирный и курсив
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Ссылки
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // Код
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Списки
      .replace(/^\- (.+)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      // Параграфы
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    
    return '<p>' + html + '</p>';
  };

  const groupNotesByPath = (notes) => {
    const grouped = {};
    notes.forEach(note => {
      const pathParts = note.path.split('/');
      const folder = pathParts.length > 1 ? pathParts[0] : 'Без категории';
      if (!grouped[folder]) {
        grouped[folder] = [];
      }
      grouped[folder].push(note);
    });
    return grouped;
  };

  const groupedNotes = groupNotesByPath(notes);

  return (
    <>
      <Sidebar />
      <div className={`notes-container ${!isSidebarOpen ? 'notes-container-expanded' : ''}`}>
        {/* Левая панель со списком конспектов */}
        <div className="notes-list">
          <div className="notes-list-header">
            <h2>Конспекты</h2>
            <button onClick={handleCreateNew} className="notes-create-btn">
              + Создать
            </button>
          </div>
          
          {loading && <div className="notes-loading">Загрузка...</div>}
          
          {!loading && notes.length === 0 && (
            <div className="notes-empty">
              <p>У вас пока нет конспектов</p>
              <button onClick={handleCreateNew} className="notes-create-btn-large">
                Создать первый конспект
              </button>
            </div>
          )}
          
          {!loading && Object.entries(groupedNotes).map(([folder, folderNotes]) => (
            <div key={folder} className="notes-folder">
              <div className="notes-folder-title">{folder}</div>
              <div className="notes-folder-items">
                {folderNotes.map(note => (
                  <div
                    key={note.id}
                    className={`notes-item ${selectedNote?.id === note.id ? 'notes-item-active' : ''}`}
                    onClick={() => handleSelectNote(note.id)}
                  >
                    <div className="notes-item-title">{note.title}</div>
                    <div className="notes-item-path">{note.path}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Правая панель с содержимым конспекта */}
        <div className="notes-content">
          {error && (
            <div className="notes-error">
              {error}
              <button onClick={() => setError(null)} className="notes-error-close">✕</button>
            </div>
          )}

          {!selectedNote && !isCreating && (
            <div className="notes-placeholder">
              <h2>Выберите конспект</h2>
              <p>Выберите конспект из списка слева или создайте новый</p>
            </div>
          )}

          {(selectedNote || isCreating) && !isEditing && (
            <div className="notes-view">
              <div className="notes-view-header">
                <div>
                  <h1>{selectedNote?.title}</h1>
                  <p className="notes-view-path">{selectedNote?.path}</p>
                </div>
                <div className="notes-view-actions">
                  <button onClick={handleEdit} className="notes-btn notes-btn-primary">
                    Редактировать
                  </button>
                  <button onClick={handleDelete} className="notes-btn notes-btn-danger">
                    Удалить
                  </button>
                </div>
              </div>
              <div 
                className="notes-view-content"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedNote?.content) }}
              />
            </div>
          )}

          {isEditing && (
            <div className="notes-edit-obsidian">
              {/* Минимальная верхняя панель */}
              <div className="notes-edit-topbar">
                <div className="notes-edit-meta">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Без названия"
                    className="notes-title-input"
                  />
                  <input
                    type="text"
                    value={editedPath}
                    onChange={(e) => setEditedPath(e.target.value)}
                    placeholder="путь/к/конспекту"
                    className="notes-path-input"
                  />
                </div>
                <div className="notes-edit-actions-top">
                  <button onClick={handleCancel} className="notes-btn-icon" title="Отменить">
                    ✕
                  </button>
                  <button onClick={handleSave} className="notes-btn-save">
                    Сохранить
                  </button>
                </div>
              </div>

              {/* Большое поле редактирования */}
              <div className="notes-editor-main">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="Начните писать свой конспект..."
                  className="notes-editor-textarea"
                  autoFocus
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Notes;

