import React from 'react';

/**
 * Модальное окно для генерации уроков
 */
const GenerateLessonsModal = ({
  show,
  formData,
  isGenerating,
  onClose,
  onGenerate,
  onFormDataChange,
}) => {
  if (!show) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        className="modal-content"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>Генерация плана уроков</h2>
          <p style={{ color: '#666', fontSize: '0.9em', margin: 0 }}>
            Заполните опциональные поля для более точной генерации плана
          </p>
        </div>

        <div className="courses-form-group">
          <label htmlFor="generate-goal">Цель курса (опционально)</label>
          <input
            id="generate-goal"
            type="text"
            value={formData.goal}
            onChange={(e) => onFormDataChange({ ...formData, goal: e.target.value })}
            placeholder="Например: Научиться программировать на Python"
            className="courses-input"
            disabled={isGenerating}
          />
        </div>

        <div className="courses-form-group">
          <label htmlFor="generate-start-knowledge">Начальные знания (опционально)</label>
          <input
            id="generate-start-knowledge"
            type="text"
            value={formData.start_knowledge}
            onChange={(e) => onFormDataChange({ ...formData, start_knowledge: e.target.value })}
            placeholder="Например: Базовые знания о программировании"
            className="courses-input"
            disabled={isGenerating}
          />
        </div>

        <div className="courses-form-group">
          <label htmlFor="generate-target-knowledge">Конечные знания (опционально)</label>
          <input
            id="generate-target-knowledge"
            type="text"
            value={formData.target_knowledge}
            onChange={(e) => onFormDataChange({ ...formData, target_knowledge: e.target.value })}
            placeholder="Например: Профессиональные навыки в Python"
            className="courses-input"
            disabled={isGenerating}
          />
        </div>

        <div className="courses-form-group">
          <label htmlFor="generate-target-audience">Целевая аудитория (опционально)</label>
          <input
            id="generate-target-audience"
            type="text"
            value={formData.target_audience}
            onChange={(e) => onFormDataChange({ ...formData, target_audience: e.target.value })}
            placeholder="Например: Начинающие программисты"
            className="courses-input"
            disabled={isGenerating}
          />
        </div>

        <div className="courses-form-group">
          <label htmlFor="generate-topics">Темы для включения (опционально, через запятую)</label>
          <input
            id="generate-topics"
            type="text"
            value={formData.topics}
            onChange={(e) => onFormDataChange({ ...formData, topics: e.target.value })}
            placeholder="Например: декораторы, генераторы, асинхронное программирование"
            className="courses-input"
            disabled={isGenerating}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={onClose}
            className="courses-btn courses-btn-secondary"
            disabled={isGenerating}
          >
            Отменить
          </button>
          <button
            onClick={onGenerate}
            className="courses-btn courses-btn-primary"
            disabled={isGenerating}
          >
            {isGenerating ? 'Генерация...' : 'Сгенерировать'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateLessonsModal;

