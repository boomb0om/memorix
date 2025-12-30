import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * Компонент блока вопроса с одним ответом
 */
const SingleChoiceBlock = ({
  block,
  isAuthor,
  onEdit,
  onDelete,
  selectedAnswer,
  checkedResult,
  onSelect,
  onCheckAnswer,
}) => {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">❓ Вопрос (один ответ)</div>
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
      <h4 style={{ marginTop: '0', marginBottom: '12px' }}>{block.question || 'Вопрос не указан'}</h4>
      {isAuthor ? (
        // Для автора показываем правильные ответы
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {(block.options || []).map((opt, optIdx) => (
              <li key={optIdx} style={{ 
                padding: '8px 12px', 
                marginBottom: '8px', 
                background: optIdx === block.correct_answer ? '#d1fae5' : '#f3f4f6',
                border: optIdx === block.correct_answer ? '2px solid #10b981' : '1px solid #e5e7eb',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{optIdx === block.correct_answer ? '✓' : '○'}</span>
                <span>{opt || `Вариант ${optIdx + 1}`}</span>
              </li>
            ))}
          </ul>
          {block.explanation && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
              <strong>Пояснение:</strong>
              <ReactMarkdown>{block.explanation}</ReactMarkdown>
            </div>
          )}
        </>
      ) : (
        // Для не-автора показываем интерактивный вопрос
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {(block.options || []).map((opt, optIdx) => {
              const isSelected = selectedAnswer === optIdx;
              const showCorrect = checkedResult?.is_correct && checkedResult?.correct_answer === optIdx;
              
              return (
                <li 
                  key={optIdx} 
                  onClick={() => !checkedResult?.is_correct && onSelect(optIdx)}
                  style={{ 
                    padding: '8px 12px', 
                    marginBottom: '8px', 
                    background: showCorrect ? '#d1fae5' : isSelected ? '#e0e7ff' : '#f3f4f6',
                    border: showCorrect ? '2px solid #10b981' : isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: checkedResult?.is_correct ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>
                    {showCorrect ? '✓' : isSelected ? '●' : '○'}
                  </span>
                  <span>{opt || `Вариант ${optIdx + 1}`}</span>
                </li>
              );
            })}
          </ul>
          {!checkedResult?.is_correct && (
            <button
              onClick={onCheckAnswer}
              disabled={selectedAnswer === undefined}
              style={{
                marginTop: '12px',
                padding: '8px 16px',
                background: selectedAnswer !== undefined ? '#6366f1' : '#9ca3af',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: selectedAnswer !== undefined ? 'pointer' : 'not-allowed',
                fontWeight: '500'
              }}
            >
              Проверить ответ
            </button>
          )}
          {checkedResult?.is_correct && checkedResult?.explanation && (
            <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
              <strong>Пояснение:</strong>
              <ReactMarkdown>{checkedResult.explanation}</ReactMarkdown>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SingleChoiceBlock;

