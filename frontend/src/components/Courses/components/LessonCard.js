import React from 'react';
import ReactMarkdown from 'react-markdown';
import { truncateText, truncateMarkdown } from '../utils';
import { MAX_CARD_TITLE_LENGTH, MAX_CARD_DESCRIPTION_LENGTH } from '../config';

/**
 * Компонент карточки урока
 */
const LessonCard = ({ lesson, onClick }) => {
  const truncatedName = truncateText(lesson.name, MAX_CARD_TITLE_LENGTH);
  const truncatedDescription = lesson.description 
    ? truncateMarkdown(lesson.description, MAX_CARD_DESCRIPTION_LENGTH)
    : null;

  return (
    <div
      className="lesson-card"
      onClick={onClick}
    >
      <div className="lesson-card-header">
        <h3 className="lesson-card-title" title={lesson.name}>
          {truncatedName}
        </h3>
        <div className="lesson-card-position">#{lesson.position + 1}</div>
      </div>
      {truncatedDescription && (
        <div className="lesson-card-description">
          <ReactMarkdown>{truncatedDescription}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default LessonCard;

