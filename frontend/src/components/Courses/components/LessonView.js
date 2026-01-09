import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '../utils';
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '../config';
import TheoryBlock from './blocks/TheoryBlock';
import CodeBlock from './blocks/CodeBlock';
import NoteBlock from './blocks/NoteBlock';
import SingleChoiceBlock from './blocks/SingleChoiceBlock';
import MultipleChoiceBlock from './blocks/MultipleChoiceBlock';
import BlockEditor from './blocks/BlockEditor';
import { createNewBlock } from '../utils';

/**
 * Компонент просмотра урока
 */
const LessonView = ({
  lesson,
  isAuthor,
  editingLessonName,
  editingLessonDescription,
  tempLessonName,
  tempLessonDescription,
  onStartEditName,
  onSaveName,
  onCancelEditName,
  onNameChange,
  onStartEditDescription,
  onSaveDescription,
  onCancelEditDescription,
  onDescriptionChange,
  onDeleteLesson,
  editingBlockId,
  editingBlockData,
  draggedBlockId,
  dragOverBlockIndex,
  onEditBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateBlockData,
  onUpdateBlockOptions,
  onAddBlockOption,
  onRemoveBlockOption,
  onSaveBlock,
  onCancelBlockEdit,
  onDragStartBlock,
  onDragEndBlock,
  onDragOverBlock,
  onDragLeaveBlock,
  onDropBlock,
  onGenerateContent,
  isGeneratingContent,
  questionAnswers,
  checkedQuestions,
  onSingleChoiceSelect,
  onMultipleChoiceToggle,
  onCheckAnswer,
  courseId,
  lessonId,
  onGenerateBlock,
  isGeneratingBlock,
}) => {
  const renderBlock = (block, index) => {
    const canDrag = isAuthor && block.block_id && editingBlockId !== block.block_id;
    
    if (editingBlockId === block.block_id) {
      return (
        <div 
          key={block.block_id || index} 
          className="lesson-block-view"
          style={{ marginLeft: isAuthor ? '24px' : '0' }}
        >
          <BlockEditor
            blockData={editingBlockData}
            onUpdateData={onUpdateBlockData}
            onUpdateOptions={onUpdateBlockOptions}
            onAddOption={onAddBlockOption}
            onRemoveOption={onRemoveBlockOption}
            onSave={onSaveBlock}
            onCancel={onCancelBlockEdit}
            courseId={courseId}
            lessonId={lessonId}
            onGenerateBlock={onGenerateBlock ? (data) => onGenerateBlock(editingBlockId, data) : null}
            isGeneratingBlock={isGeneratingBlock}
          />
        </div>
      );
    }

    return (
      <div 
        key={block.block_id || index} 
        className={`lesson-block-view ${dragOverBlockIndex === index ? 'drag-over' : ''}`}
        draggable={canDrag}
        onDragStart={(e) => {
          if (canDrag && block.block_id) {
            onDragStartBlock(e, block.block_id);
          }
        }}
        onDragEnd={onDragEndBlock}
        onDragOver={(e) => {
          if (isAuthor && draggedBlockId) {
            onDragOverBlock(e, index);
          }
        }}
        onDragLeave={onDragLeaveBlock}
        onDrop={(e) => {
          if (isAuthor && draggedBlockId) {
            onDropBlock(e, index);
          }
        }}
        style={{
          cursor: canDrag ? 'grab' : 'default',
          opacity: draggedBlockId === block.block_id ? 0.5 : 1,
          position: 'relative'
        }}
      >
        {isAuthor && block.block_id && editingBlockId !== block.block_id && (
          <div 
            style={{
              position: 'absolute',
              left: '8px',
              top: '8px',
              fontSize: '18px',
              color: '#666',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            ⋮⋮
          </div>
        )}
        <div style={{ marginLeft: isAuthor ? '24px' : '0' }}>
          {block.type === 'theory' && (
            <TheoryBlock
              block={block}
              isAuthor={isAuthor}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
            />
          )}
          {block.type === 'code' && (
            <CodeBlock
              block={block}
              isAuthor={isAuthor}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
            />
          )}
          {block.type === 'note' && (
            <NoteBlock
              block={block}
              isAuthor={isAuthor}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
            />
          )}
          {block.type === 'single_choice' && (
            <SingleChoiceBlock
              block={block}
              isAuthor={isAuthor}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
              selectedAnswer={questionAnswers[block.block_id]}
              checkedResult={checkedQuestions[block.block_id]}
              onSelect={(answerIndex) => onSingleChoiceSelect(block.block_id, answerIndex)}
              onCheckAnswer={() => onCheckAnswer(block.block_id)}
            />
          )}
          {block.type === 'multiple_choice' && (
            <MultipleChoiceBlock
              block={block}
              isAuthor={isAuthor}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
              selectedAnswers={questionAnswers[block.block_id]}
              checkedResult={checkedQuestions[block.block_id]}
              onToggle={(answerIndex) => onMultipleChoiceToggle(block.block_id, answerIndex)}
              onCheckAnswer={() => onCheckAnswer(block.block_id)}
            />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="courses-view">
      <div className="courses-view-header">
        <div>
          {editingLessonName ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  value={tempLessonName}
                  onChange={onNameChange}
                  className="courses-input"
                  style={{ fontSize: '2em', fontWeight: 'bold', padding: '8px', width: '100%' }}
                  maxLength={MAX_NAME_LENGTH}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onSaveName();
                    } else if (e.key === 'Escape') {
                      onCancelEditName();
                    }
                  }}
                  autoFocus
                />
                <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
                  {tempLessonName.length}/{MAX_NAME_LENGTH} символов
                </div>
              </div>
              <button onClick={onSaveName} className="courses-btn courses-btn-primary" style={{ padding: '8px 16px' }}>
                ✓
              </button>
              <button onClick={onCancelEditName} className="courses-btn courses-btn-secondary" style={{ padding: '8px 16px' }}>
                ✕
              </button>
            </div>
          ) : (
            <h1 
              onClick={onStartEditName}
              style={{ 
                cursor: isAuthor ? 'pointer' : 'default',
                userSelect: 'none'
              }}
              title={isAuthor ? 'Нажмите для редактирования' : ''}
            >
              {lesson.name}
            </h1>
          )}
          <p className="courses-view-meta">
            Позиция: {lesson.position + 1} • Создан: {formatDate(lesson.created_at)}
            {lesson.updated_at && (
              <> • Обновлен: {formatDate(lesson.updated_at)}</>
            )}
          </p>
        </div>
        {isAuthor && (
          <div className="courses-view-actions">
            <button onClick={onDeleteLesson} className="courses-btn courses-btn-danger">
              Удалить
            </button>
          </div>
        )}
      </div>
      <div className="courses-view-content">
        <h3>Описание</h3>
        {editingLessonDescription ? (
          <div>
            <textarea
              value={tempLessonDescription}
              onChange={onDescriptionChange}
              className="courses-textarea"
              rows="5"
              maxLength={MAX_DESCRIPTION_LENGTH}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  onCancelEditDescription();
                }
              }}
              autoFocus
            />
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
              {tempLessonDescription.length}/{MAX_DESCRIPTION_LENGTH} символов
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={onSaveDescription} className="courses-btn courses-btn-primary">
                Сохранить
              </button>
              <button onClick={onCancelEditDescription} className="courses-btn courses-btn-secondary">
                Отменить
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => isAuthor && onStartEditDescription()}
            style={{
              cursor: isAuthor ? 'pointer' : 'default',
              padding: '8px',
              borderRadius: '4px',
              border: isAuthor ? '1px dashed transparent' : 'none',
              minHeight: '40px'
            }}
            onMouseEnter={(e) => {
              if (isAuthor) {
                e.currentTarget.style.borderColor = '#ccc';
                e.currentTarget.style.backgroundColor = '#f9f9f9';
              }
            }}
            onMouseLeave={(e) => {
              if (isAuthor) {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
            title={isAuthor ? 'Нажмите для редактирования' : ''}
          >
            {lesson.description ? (
              <ReactMarkdown>{lesson.description}</ReactMarkdown>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>Нажмите для добавления описания</p>
            )}
          </div>
        )}
        {(!lesson.blocks || lesson.blocks.length === 0) && isAuthor && (
          <div style={{ marginTop: '24px', padding: '24px', border: '2px dashed #ccc', borderRadius: '8px', textAlign: 'center', background: '#f9f9f9' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Содержимое урока</h3>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              В этом уроке пока нет блоков. Вы можете сгенерировать контент автоматически или добавить блоки вручную.
            </p>
            <button
              onClick={onGenerateContent}
              disabled={isGeneratingContent}
              className="courses-btn courses-btn-primary"
              style={{ marginRight: '12px' }}
            >
              {isGeneratingContent ? 'Генерация...' : '✨ Сгенерировать контент'}
            </button>
            <div className="lesson-blocks-add-menu" style={{ marginTop: '20px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
        )}
        {lesson.blocks && lesson.blocks.length > 0 && (
          <>
            <h3>Содержимое урока</h3>
            {isAuthor && (
              <div className="lesson-blocks-add-menu" style={{ marginBottom: '16px' }}>
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
            )}
            <div className="lesson-blocks">
              {lesson.blocks.map((block, index) => renderBlock(block, index))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LessonView;

