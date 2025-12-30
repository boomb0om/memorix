import React from 'react';
import ReactMarkdown from 'react-markdown';
import BlockEditor from './blocks/BlockEditor';
import { createNewBlock } from '../utils';

/**
 * Компонент формы создания/редактирования урока
 */
const LessonEditForm = ({
  editedLessonName,
  editedLessonDescription,
  editedLessonBlocks,
  editingBlockIndex,
  onNameChange,
  onDescriptionChange,
  onSave,
  onCancel,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onSetEditingBlockIndex,
}) => {
  return (
    <div className="courses-edit">
      <div className="courses-edit-header">
        <h2>Создание нового урока</h2>
        <div className="courses-edit-actions">
          <button onClick={onCancel} className="courses-btn courses-btn-secondary">
            Отменить
          </button>
          <button onClick={onSave} className="courses-btn courses-btn-primary">
            Сохранить
          </button>
        </div>
      </div>
      <div className="courses-edit-form">
        <div className="courses-form-group">
          <label htmlFor="lesson-name">Название урока</label>
          <input
            id="lesson-name"
            type="text"
            value={editedLessonName}
            onChange={onNameChange}
            placeholder="Введите название урока"
            className="courses-input"
          />
        </div>
        <div className="courses-form-group">
          <label htmlFor="lesson-description">Описание</label>
          <textarea
            id="lesson-description"
            value={editedLessonDescription}
            onChange={onDescriptionChange}
            placeholder="Введите описание урока"
            className="courses-textarea"
            rows="3"
          />
        </div>

        {/* Редактор блоков */}
        <div className="lesson-blocks-editor">
          <div className="lesson-blocks-header">
            <h3>Блоки урока</h3>
            <div className="lesson-blocks-add-menu">
              <button className="courses-btn courses-btn-secondary" onClick={() => onAddBlock('theory')}>
                + Теория
              </button>
              <button className="courses-btn courses-btn-secondary" onClick={() => onAddBlock('code')}>
                + Код
              </button>
              <button className="courses-btn courses-btn-secondary" onClick={() => onAddBlock('note')}>
                + Заметка
              </button>
              <button className="courses-btn courses-btn-secondary" onClick={() => onAddBlock('single_choice')}>
                + Вопрос (один ответ)
              </button>
              <button className="courses-btn courses-btn-secondary" onClick={() => onAddBlock('multiple_choice')}>
                + Вопрос (несколько ответов)
              </button>
            </div>
          </div>

          {editedLessonBlocks.length === 0 ? (
            <div className="lesson-blocks-empty">
              <p>Нет блоков. Добавьте блок, чтобы начать создавать урок.</p>
            </div>
          ) : (
            <div className="lesson-blocks-list">
              {editedLessonBlocks.map((block, index) => (
                <div key={block.block_id || `new-${index}`} className={`lesson-block-editor ${editingBlockIndex === index ? 'editing' : ''}`}>
                  <div className="lesson-block-header">
                    <div className="lesson-block-type-badge">
                      {block.type === 'theory' && '📖 Теория'}
                      {block.type === 'code' && '💻 Код'}
                      {block.type === 'note' && '📌 Заметка'}
                      {block.type === 'single_choice' && '❓ Вопрос (один ответ)'}
                      {block.type === 'multiple_choice' && '❓ Вопрос (несколько ответов)'}
                    </div>
                    <div className="lesson-block-actions">
                      <button onClick={() => onMoveBlock(index, 'up')} disabled={index === 0} title="Вверх">
                        ↑
                      </button>
                      <button onClick={() => onMoveBlock(index, 'down')} disabled={index === editedLessonBlocks.length - 1} title="Вниз">
                        ↓
                      </button>
                      <button onClick={() => onSetEditingBlockIndex(editingBlockIndex === index ? null : index)} title="Редактировать">
                        {editingBlockIndex === index ? '✕' : '✎'}
                      </button>
                      <button onClick={() => onDeleteBlock(index)} title="Удалить" className="delete-btn">
                        🗑
                      </button>
                    </div>
                  </div>

                  {editingBlockIndex === index && (
                    <BlockEditor
                      blockData={block}
                      onUpdateData={(field, value) => onUpdateBlock(index, { ...block, [field]: value })}
                      onUpdateOptions={(optIndex, value) => {
                        const newOptions = [...(block.options || [])];
                        newOptions[optIndex] = value;
                        onUpdateBlock(index, { ...block, options: newOptions });
                      }}
                      onAddOption={() => {
                        const newOptions = [...(block.options || []), ''];
                        onUpdateBlock(index, { ...block, options: newOptions });
                      }}
                      onRemoveOption={(optIndex) => {
                        const newOptions = (block.options || []).filter((_, i) => i !== optIndex);
                        let updatedBlock = { ...block, options: newOptions };
                        
                        if (block.type === 'single_choice') {
                          const newCorrect = block.correct_answer === optIndex ? 0 : (block.correct_answer > optIndex ? block.correct_answer - 1 : block.correct_answer);
                          updatedBlock.correct_answer = newCorrect;
                        } else if (block.type === 'multiple_choice') {
                          updatedBlock.correct_answers = (block.correct_answers || [])
                            .filter(i => i !== optIndex)
                            .map(i => i > optIndex ? i - 1 : i);
                        }
                        
                        onUpdateBlock(index, updatedBlock);
                      }}
                      onSave={() => onSetEditingBlockIndex(null)}
                      onCancel={() => onSetEditingBlockIndex(null)}
                    />
                  )}

                  {editingBlockIndex !== index && (
                    <div className="lesson-block-preview">
                      {block.type === 'theory' && (
                        <div>
                          <strong>{block.title || 'Без заголовка'}</strong>
                          <div style={{ marginTop: '8px' }}>
                            {block.content ? (
                              <ReactMarkdown>{block.content}</ReactMarkdown>
                            ) : (
                              <p>Пусто</p>
                            )}
                          </div>
                        </div>
                      )}
                      {block.type === 'code' && (
                        <div>
                          {block.title && <strong>{block.title}</strong>}
                          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                            <code>{block.code || 'Пусто'}</code>
                          </pre>
                          {block.explanation && (
                            <div style={{ marginTop: '8px' }}>
                              <ReactMarkdown>{block.explanation}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === 'note' && (
                        <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
                          <strong>{block.note_type === 'info' ? 'ℹ️ Информация' : block.note_type === 'warning' ? '⚠️ Предупреждение' : block.note_type === 'tip' ? '💡 Совет' : '❗ Важно'}</strong>
                          <div style={{ marginTop: '8px' }}>
                            {block.content ? (
                              <ReactMarkdown>{block.content}</ReactMarkdown>
                            ) : (
                              <p>Пусто</p>
                            )}
                          </div>
                        </div>
                      )}
                      {block.type === 'single_choice' && (
                        <div>
                          <strong>{block.question || 'Вопрос не указан'}</strong>
                          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            {(block.options || []).map((opt, optIdx) => (
                              <li key={optIdx} style={{ color: optIdx === block.correct_answer ? 'green' : 'inherit' }}>
                                {opt || `Вариант ${optIdx + 1}`} {optIdx === block.correct_answer && '✓'}
                              </li>
                            ))}
                          </ul>
                          {block.explanation && (
                            <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                              <ReactMarkdown>{block.explanation}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                      {block.type === 'multiple_choice' && (
                        <div>
                          <strong>{block.question || 'Вопрос не указан'}</strong>
                          <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            {(block.options || []).map((opt, optIdx) => (
                              <li key={optIdx} style={{ color: (block.correct_answers || []).includes(optIdx) ? 'green' : 'inherit' }}>
                                {opt || `Вариант ${optIdx + 1}`} {(block.correct_answers || []).includes(optIdx) && '✓'}
                              </li>
                            ))}
                          </ul>
                          {block.explanation && (
                            <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                              <ReactMarkdown>{block.explanation}</ReactMarkdown>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonEditForm;

