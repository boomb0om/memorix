import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '../utils';

/**
 * Компонент карточки урока
 */
const LessonCard = ({ lesson, onClick }) => {
  return (
    <div
      className="lesson-card"
      onClick={onClick}
    >
      <div className="lesson-card-header">
        <h3 className="lesson-card-title">{lesson.name}</h3>
        <div className="lesson-card-position">#{lesson.position + 1}</div>
      </div>
      <div className="lesson-card-description">
        {lesson.description ? (
          <ReactMarkdown>{lesson.description}</ReactMarkdown>
        ) : (
          <span>Без описания</span>
        )}
      </div>
      <div className="lesson-card-footer">
        <div className="lesson-card-meta">
          Создан: {formatDate(lesson.created_at)}
        </div>
      </div>
    </div>
  );
};

export default LessonCard;

