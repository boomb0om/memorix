import React, { useState } from 'react';
import AIButton from '../AIButton';

/**
 * Компонент редактора блока урока
 */
const BlockEditor = ({
  blockData,
  onUpdateData,
  onUpdateOptions,
  onAddOption,
  onRemoveOption,
  onSave,
  onCancel,
  courseId,
  lessonId,
  onGenerateBlock,
  isGeneratingBlock,
}) => {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateMode, setGenerateMode] = useState(null); // 'generate' or 'reformulate'
  const [userRequest, setUserRequest] = useState('');
  const [context, setContext] = useState('');

  const handleUpdateData = (field, value) => {
    onUpdateData(field, value);
  };

  const handleOpenGenerateModal = (mode) => {
    setGenerateMode(mode);
    setUserRequest('');
    setContext('');
    setShowGenerateModal(true);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
    setGenerateMode(null);
    setUserRequest('');
    setContext('');
  };

  const handleGenerate = async () => {
    if (!onGenerateBlock) return;
    
    try {
      await onGenerateBlock({
        user_request: userRequest.trim() || null,
        context: context.trim() || null,
      });
      handleCloseGenerateModal();
    } catch (error) {
      console.error('Error generating block:', error);
      // Ошибка обрабатывается в родительском компоненте
    }
  };

  const canGenerate = blockData.block_id && courseId && lessonId && onGenerateBlock;

  return (
    <div className="lesson-block-edit-form">
      {blockData.type === 'theory' && (
        <>
          <div className="courses-form-group">
            <label>Заголовок</label>
            <input
              type="text"
              value={blockData.title || ''}
              onChange={(e) => handleUpdateData('title', e.target.value)}
              className="courses-input"
              placeholder="Заголовок блока"
            />
          </div>
          <div className="courses-form-group">
            <label>Содержимое (Markdown)</label>
            <textarea
              value={blockData.content || ''}
              onChange={(e) => handleUpdateData('content', e.target.value)}
              className="courses-textarea"
              rows="8"
              placeholder="Теоретический материал в формате Markdown"
            />
          </div>
        </>
      )}

      {blockData.type === 'code' && (
        <>
          <div className="courses-form-group">
            <label>Заголовок (необязательно)</label>
            <input
              type="text"
              value={blockData.title || ''}
              onChange={(e) => handleUpdateData('title', e.target.value)}
              className="courses-input"
              placeholder="Заголовок блока кода"
            />
          </div>
          <div className="courses-form-group">
            <label>Язык программирования</label>
            <select
              value={blockData.language || 'python'}
              onChange={(e) => handleUpdateData('language', e.target.value)}
              className="courses-input"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="sql">SQL</option>
            </select>
          </div>
          <div className="courses-form-group">
            <label>Код</label>
            <textarea
              value={blockData.code || ''}
              onChange={(e) => handleUpdateData('code', e.target.value)}
              className="courses-textarea"
              rows="10"
              placeholder="Введите код"
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <div className="courses-form-group">
            <label>Пояснение (необязательно)</label>
            <textarea
              value={blockData.explanation || ''}
              onChange={(e) => handleUpdateData('explanation', e.target.value)}
              className="courses-textarea"
              rows="3"
              placeholder="Пояснение к коду"
            />
          </div>
        </>
      )}

      {blockData.type === 'note' && (
        <>
          <div className="courses-form-group">
            <label>Тип заметки</label>
            <select
              value={blockData.note_type || 'info'}
              onChange={(e) => handleUpdateData('note_type', e.target.value)}
              className="courses-input"
            >
              <option value="info">Информация</option>
              <option value="warning">Предупреждение</option>
              <option value="tip">Совет</option>
              <option value="important">Важно</option>
            </select>
          </div>
          <div className="courses-form-group">
            <label>Содержимое</label>
            <textarea
              value={blockData.content || ''}
              onChange={(e) => handleUpdateData('content', e.target.value)}
              className="courses-textarea"
              rows="5"
              placeholder="Текст заметки"
            />
          </div>
        </>
      )}

      {blockData.type === 'single_choice' && (
        <>
          <div className="courses-form-group">
            <label>Вопрос</label>
            <input
              type="text"
              value={blockData.question || ''}
              onChange={(e) => handleUpdateData('question', e.target.value)}
              className="courses-input"
              placeholder="Формулировка вопроса"
            />
          </div>
          <div className="courses-form-group">
            <label>Варианты ответов</label>
            {(blockData.options || ['', '']).map((option, optIndex) => (
              <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="radio"
                  name={`correct-${blockData.block_id || 'new'}`}
                  checked={blockData.correct_answer === optIndex}
                  onChange={() => handleUpdateData('correct_answer', optIndex)}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOptions(optIndex, e.target.value)}
                  className="courses-input"
                  placeholder={`Вариант ${optIndex + 1}`}
                  style={{ flex: 1 }}
                />
                {(blockData.options || []).length > 2 && (
                  <button
                    onClick={() => onRemoveOption(optIndex)}
                    className="courses-btn courses-btn-danger"
                    style={{ padding: '4px 8px' }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={onAddOption}
              className="courses-btn courses-btn-secondary"
              style={{ marginTop: '8px' }}
            >
              + Добавить вариант
            </button>
          </div>
          <div className="courses-form-group">
            <label>Пояснение (необязательно)</label>
            <textarea
              value={blockData.explanation || ''}
              onChange={(e) => handleUpdateData('explanation', e.target.value)}
              className="courses-textarea"
              rows="3"
              placeholder="Пояснение к правильному ответу"
            />
          </div>
        </>
      )}

      {blockData.type === 'multiple_choice' && (
        <>
          <div className="courses-form-group">
            <label>Вопрос</label>
            <input
              type="text"
              value={blockData.question || ''}
              onChange={(e) => handleUpdateData('question', e.target.value)}
              className="courses-input"
              placeholder="Формулировка вопроса"
            />
          </div>
          <div className="courses-form-group">
            <label>Варианты ответов</label>
            {(blockData.options || ['', '']).map((option, optIndex) => (
              <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={(blockData.correct_answers || []).includes(optIndex)}
                  onChange={(e) => {
                    const currentAnswers = blockData.correct_answers || [];
                    const newAnswers = e.target.checked
                      ? [...currentAnswers, optIndex]
                      : currentAnswers.filter(i => i !== optIndex);
                    handleUpdateData('correct_answers', newAnswers);
                  }}
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOptions(optIndex, e.target.value)}
                  className="courses-input"
                  placeholder={`Вариант ${optIndex + 1}`}
                  style={{ flex: 1 }}
                />
                {(blockData.options || []).length > 2 && (
                  <button
                    onClick={() => onRemoveOption(optIndex)}
                    className="courses-btn courses-btn-danger"
                    style={{ padding: '4px 8px' }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={onAddOption}
              className="courses-btn courses-btn-secondary"
              style={{ marginTop: '8px' }}
            >
              + Добавить вариант
            </button>
          </div>
          <div className="courses-form-group">
            <label>Пояснение (необязательно)</label>
            <textarea
              value={blockData.explanation || ''}
              onChange={(e) => handleUpdateData('explanation', e.target.value)}
              className="courses-textarea"
              rows="3"
              placeholder="Пояснение к правильным ответам"
            />
          </div>
        </>
      )}

      {canGenerate && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', marginBottom: '8px', padding: '12px', background: '#f9f9f9', borderRadius: '4px', border: '1px solid #e0e0e0' }}>
          <AIButton 
            onClick={() => handleOpenGenerateModal('generate')} 
            className="courses-btn courses-btn-secondary"
            disabled={isGeneratingBlock}
            style={{ flex: 1 }}
          >
            ✨ Сгенерировать контент
          </AIButton>
          <AIButton 
            onClick={() => handleOpenGenerateModal('reformulate')} 
            className="courses-btn courses-btn-secondary"
            disabled={isGeneratingBlock}
            style={{ flex: 1 }}
          >
            🔄 Переформулировать
          </AIButton>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={onSave} className="courses-btn courses-btn-primary">
          Сохранить
        </button>
        <button onClick={onCancel} className="courses-btn courses-btn-secondary">
          Отменить
        </button>
      </div>

      {/* Модальное окно для генерации/переформулирования */}
      {showGenerateModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={handleCloseGenerateModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              {generateMode === 'generate' ? '✨ Сгенерировать контент блока' : '🔄 Переформулировать блок'}
            </h3>
            
            <div className="courses-form-group" style={{ marginBottom: '16px' }}>
              <label>
                {generateMode === 'generate' 
                  ? 'Запрос для генерации (необязательно)' 
                  : 'Как переформулировать блок (необязательно)'}
              </label>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                className="courses-textarea"
                rows="3"
                placeholder={generateMode === 'generate' 
                  ? 'Например: "Создай блок о переменных в Python"' 
                  : 'Например: "Сделай более простым языком" или "Добавь примеры"'}
              />
            </div>

            <div className="courses-form-group" style={{ marginBottom: '16px' }}>
              <label>Дополнительный контекст или материалы (необязательно)</label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="courses-textarea"
                rows="4"
                placeholder="Конспект или материалы, на основе которых нужно создать/переформулировать блок"
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleCloseGenerateModal} 
                className="courses-btn courses-btn-secondary"
                disabled={isGeneratingBlock}
              >
                Отменить
              </button>
              <button 
                onClick={handleGenerate} 
                className="courses-btn courses-btn-primary"
                disabled={isGeneratingBlock}
              >
                {isGeneratingBlock ? 'Генерация...' : (generateMode === 'generate' ? 'Сгенерировать' : 'Переформулировать')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockEditor;

