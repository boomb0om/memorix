import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Компонент блока теории
 */
const TheoryBlock = ({ block, isAuthor, onEdit, onDelete }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">📖 Теория</div>
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
      {block.title && <h4 style={{ marginTop: '0', marginBottom: '8px' }}>{block.title}</h4>}
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

export default TheoryBlock;

