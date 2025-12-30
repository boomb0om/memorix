import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Компонент блока кода
 */
const CodeBlock = ({ block, isAuthor, onEdit, onDelete }) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">💻 Код ({block.language || 'python'})</div>
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
      <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px', borderRadius: '8px', overflow: 'auto', marginTop: '12px' }}>
        <code>{block.code || 'Пусто'}</code>
      </pre>
      {block.explanation && (
        <div style={{ marginTop: '12px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
          <strong>Пояснение:</strong>
          <ReactMarkdown>{block.explanation}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default CodeBlock;

