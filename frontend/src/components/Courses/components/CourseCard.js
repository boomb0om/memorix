import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate } from '../utils';

/**
 * Компонент карточки курса
 */
const CourseCard = ({ course, onClick, isMine = false }) => {
  return (
    <div
      className="course-card"
      onClick={onClick}
    >
      <div className="course-card-meta">
        <span className={`course-card-badge ${isMine ? 'course-card-badge-mine' : ''}`}>
          {isMine ? 'Мой курс' : 'Курс сообщества'}
        </span>
        <span>{formatDate(course.created_at) || '—'}</span>
      </div>
      <h3 className="course-card-title">{course.name}</h3>
      <div className="course-card-description">
        {course.description ? (
          <ReactMarkdown>{course.description}</ReactMarkdown>
        ) : (
          <p>Без описания</p>
        )}
      </div>
      <div className="course-card-footer">
        <button
          className="courses-btn courses-btn-secondary"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          {isMine ? 'Открыть' : 'Подробнее'}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;

