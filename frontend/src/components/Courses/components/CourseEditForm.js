import React from 'react';
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '../config';

/**
 * Компонент формы редактирования курса
 */
const CourseEditForm = ({
  isCreating,
  editedCourseName,
  editedCourseDescription,
  onNameChange,
  onDescriptionChange,
  onSave,
  onCancel,
  onGenerateLessons,
  isGeneratingLessons,
}) => {
  return (
    <div className="courses-edit">
      <div className="courses-edit-header">
        <h2>{isCreating ? 'Создание нового курса' : 'Редактирование курса'}</h2>
        <div className="courses-edit-actions">
          <button onClick={onCancel} className="courses-btn courses-btn-secondary">
            Отменить
          </button>
          <button onClick={onSave} className="courses-btn courses-btn-primary">
            Сохранить
          </button>
        </div>
      </div>
      <div className="courses-edit-form">
        <div className="courses-form-group">
          <label htmlFor="course-name">Название курса</label>
          <input
            id="course-name"
            type="text"
            value={editedCourseName}
            onChange={onNameChange}
            placeholder="Введите название курса"
            className="courses-input"
            maxLength={MAX_NAME_LENGTH}
          />
          <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
            {editedCourseName.length}/{MAX_NAME_LENGTH} символов
          </div>
        </div>
        <div className="courses-form-group">
          <label htmlFor="course-description">Описание</label>
          <textarea
            id="course-description"
            value={editedCourseDescription}
            onChange={onDescriptionChange}
            placeholder="Введите описание курса"
            className="courses-textarea"
            rows="10"
            maxLength={MAX_DESCRIPTION_LENGTH}
          />
          <div style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>
            {editedCourseDescription.length}/{MAX_DESCRIPTION_LENGTH} символов
          </div>
        </div>
        {!isCreating && onGenerateLessons && (
          <div className="courses-form-group">
            <button 
              onClick={onGenerateLessons} 
              className="courses-btn courses-btn-secondary"
              disabled={isGeneratingLessons}
              style={{ width: '100%', marginTop: '16px' }}
            >
              {isGeneratingLessons ? 'Генерация...' : '✨ Сгенерировать уроки'}
            </button>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
              Создаст план уроков на основе названия и описания курса
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseEditForm;

