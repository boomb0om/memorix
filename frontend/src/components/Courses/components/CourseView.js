import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '../utils';
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '../config';
import LessonCard from './LessonCard';

/**
 * Компонент просмотра курса
 */
const CourseView = ({
  course,
  lessons,
  isAuthor,
  editingCourseName,
  editingCourseDescription,
  tempCourseName,
  tempCourseDescription,
  onStartEditName,
  onSaveName,
  onCancelEditName,
  onNameChange,
  onStartEditDescription,
  onSaveDescription,
  onCancelEditDescription,
  onDescriptionChange,
  onSelectLesson,
  onCreateLesson,
  onGenerateLessons,
  isGeneratingLessons,
}) => {
  return (
    <div className="courses-view">
      <div className="courses-view-header">
        <div>
          {editingCourseName ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <input
                  type="text"
                  value={tempCourseName}
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
                  {tempCourseName.length}/{MAX_NAME_LENGTH} символов
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
              {course.name}
            </h1>
          )}
          <p className="courses-view-meta">
            Создан: {formatDate(course.created_at)}
            {course.updated_at && (
              <> • Обновлен: {formatDate(course.updated_at)}</>
            )}
          </p>
        </div>
      </div>
      <div className="courses-view-content">
        <h3>Описание</h3>
        {editingCourseDescription ? (
          <div>
            <textarea
              value={tempCourseDescription}
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
              {tempCourseDescription.length}/{MAX_DESCRIPTION_LENGTH} символов
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
            {course.description ? (
              <ReactMarkdown>{course.description}</ReactMarkdown>
            ) : (
              <p style={{ color: '#999', fontStyle: 'italic' }}>Нажмите для добавления описания</p>
            )}
          </div>
        )}
        
        <h3 style={{ marginTop: '32px' }}>Программа курса</h3>
        {lessons.length === 0 ? (
          <div className="lessons-cards-empty">
            {isAuthor ? (
              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
                <button 
                  onClick={onGenerateLessons} 
                  className="courses-create-btn-large"
                  disabled={isGeneratingLessons}
                >
                  {isGeneratingLessons ? 'Генерация...' : '✨ Сгенерировать план уроков'}
                </button>
                <span style={{ color: '#666', fontSize: '0.9em' }}>или</span>
                <button onClick={onCreateLesson} className="courses-create-btn-large">
                  Создать первый урок вручную
                </button>
                <div className="lessons-info-message">
                  <span className="lessons-info-icon">ℹ️</span>
                  <span>Если вы создадите урок вручную, а потом решите сгенерировать уроки — созданный вручную урок будет удален и заменен автоматически. Чтобы не потерять результат, рекомендуем сразу выбрать удобный способ создания уроков!</span>
                </div>
              </div>
            ) : (
              <p>В этом курсе пока нет уроков</p>
            )}
          </div>
        ) : (
          <>
            {isAuthor && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button 
                  onClick={onGenerateLessons} 
                  className="courses-btn courses-btn-secondary"
                  disabled={isGeneratingLessons}
                >
                  {isGeneratingLessons ? 'Генерация...' : '✨ Сгенерировать уроки'}
                </button>
                <button onClick={onCreateLesson} className="courses-btn courses-btn-primary">
                  + Создать урок
                </button>
              </div>
            )}
            <div className="lessons-cards-grid">
              {lessons.map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onClick={() => onSelectLesson(lesson.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CourseView;

