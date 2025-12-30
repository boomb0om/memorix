import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '../utils';

/**
 * Компонент списка уроков (левая панель)
 */
const LessonList = ({
  courseName,
  lessons,
  selectedLesson,
  isCourseAuthor,
  onBack,
  onCreateLesson,
  onSelectLesson,
  draggedLessonId,
  dragOverIndex,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  return (
    <div className="lessons-panel">
      <div className="courses-list-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={onBack} 
            className="courses-back-btn"
            title="Назад к курсам"
          >
            ←
          </button>
          <h2>{courseName}</h2>
        </div>
        {isCourseAuthor && lessons.length > 0 && (
          <button onClick={onCreateLesson} className="courses-create-btn">
            + Создать урок
          </button>
        )}
      </div>
      
      {lessons.length === 0 && (
        <div className="courses-empty">
          <p>В этом курсе пока нет уроков</p>
        </div>
      )}
      
      {lessons.map((lesson, index) => (
        <div
          key={lesson.id}
          className={`courses-item ${selectedLesson?.id === lesson.id ? 'courses-item-active' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
          onClick={() => {
            if (!isDragging) {
              onSelectLesson(lesson.id);
            }
          }}
          draggable={isCourseAuthor}
          onDragStart={(e) => onDragStart(e, lesson.id)}
          onDragEnd={onDragEnd}
          onDragOver={(e) => onDragOver(e, index)}
          onDragLeave={onDragLeave}
          onDrop={(e) => onDrop(e, index)}
          style={{
            cursor: isCourseAuthor ? 'grab' : 'pointer',
            opacity: draggedLessonId === lesson.id ? 0.5 : 1
          }}
        >
          {isCourseAuthor && (
            <div 
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '18px',
                color: '#666',
                userSelect: 'none',
                pointerEvents: 'none'
              }}
            >
              ⋮⋮
            </div>
          )}
          <div className="courses-item-title" style={{ marginLeft: isCourseAuthor ? '24px' : '0' }}>
            {lesson.name}
          </div>
          <div className="courses-item-description">
            {lesson.description ? (
              <ReactMarkdown>{lesson.description}</ReactMarkdown>
            ) : (
              <span>Без описания</span>
            )}
          </div>
          <div className="courses-item-meta">
            Позиция: {lesson.position + 1} • Создан: {formatDate(lesson.created_at)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LessonList;

