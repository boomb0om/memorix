import React from 'react';
import ReactMarkdown from 'react-markdown';
import { formatDate, truncateText, truncateMarkdown } from '../utils';
import { MAX_CARD_TITLE_LENGTH, MAX_CARD_DESCRIPTION_LENGTH } from '../config';

/**
 * Компонент карточки курса
 */
const CourseCard = ({ course, onClick, isMine = false }) => {
  const truncatedName = truncateText(course.name, MAX_CARD_TITLE_LENGTH);
  const truncatedDescription = course.description 
    ? truncateMarkdown(course.description, MAX_CARD_DESCRIPTION_LENGTH)
    : null;

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
      <h3 className="course-card-title" title={course.name}>
        {truncatedName}
      </h3>
      <div className="course-card-description">
        {truncatedDescription ? (
          <ReactMarkdown>{truncatedDescription}</ReactMarkdown>
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

