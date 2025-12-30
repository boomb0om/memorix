import React from 'react';
import LessonCard from './LessonCard';
import { formatDate } from '../utils';

/**
 * Компонент отображения карточек уроков
 */
const LessonsCardsView = ({
  courseName,
  lessons,
  isAuthor,
  onSelectLesson,
  onCreateLesson,
  onGenerateLessons,
  isGeneratingLessons,
}) => {
  return (
    <div className="lessons-cards-view">
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
          <div className="lessons-cards-header">
            <h2>Уроки курса "{courseName}"</h2>
            {isAuthor && (
              <div style={{ display: 'flex', gap: '8px' }}>
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
          </div>
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
  );
};

export default LessonsCardsView;

