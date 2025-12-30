import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Компонент блока заметки
 */
const NoteBlock = ({ block, isAuthor, onEdit, onDelete }) => {
  const getNoteTypeLabel = () => {
    switch (block.note_type) {
      case 'info': return 'ℹ️ Информация';
      case 'warning': return '⚠️ Предупреждение';
      case 'tip': return '💡 Совет';
      case 'important': return '❗ Важно';
      default: return 'ℹ️ Информация';
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">
          {getNoteTypeLabel()}
        </div>
        {isAuthor && block.block_id && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onEdit(block)} 
              className="courses-btn courses-btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.9em' }}
            >
              ✎ Редактировать
            </button>
            <button 
              onClick={() => onDelete(block.block_id)} 
              className="courses-btn courses-btn-danger"
              style={{ padding: '4px 12px', fontSize: '0.9em' }}
            >
              🗑 Удалить
            </button>
          </div>
        )}
      </div>
      <div className="lesson-block-content">
        {block.content ? (
          <ReactMarkdown>{block.content}</ReactMarkdown>
        ) : (
          <p>Пусто</p>
        )}
      </div>
    </div>
  );
};

export default NoteBlock;

