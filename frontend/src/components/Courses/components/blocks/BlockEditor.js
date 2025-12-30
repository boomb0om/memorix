import React from 'react';

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
}) => {
  const handleUpdateData = (field, value) => {
    onUpdateData(field, value);
  };

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

      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick={onSave} className="courses-btn courses-btn-primary">
          Сохранить
        </button>
        <button onClick={onCancel} className="courses-btn courses-btn-secondary">
          Отменить
        </button>
      </div>
    </div>
  );
};

export default BlockEditor;

