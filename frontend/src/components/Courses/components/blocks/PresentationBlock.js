import React from 'react';

/**
 * Компонент блока презентации
 */
const PresentationBlock = ({ block, isAuthor, onEdit, onDelete }) => {
  // Функция для преобразования URL Google Slides в embed URL
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // Если URL уже в формате embed, возвращаем как есть
    if (url.includes('/embed')) {
      return url;
    }
    
    // Пытаемся извлечь ID презентации из различных форматов Google Slides
    // Формат 1: https://docs.google.com/presentation/d/PRESENTATION_ID/edit
    // Формат 2: https://docs.google.com/presentation/d/PRESENTATION_ID
    // Формат 3: https://docs.google.com/presentation/d/PRESENTATION_ID/edit#slide=id.p
    
    const match = url.match(/\/presentation\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      const presentationId = match[1];
      return `https://docs.google.com/presentation/d/${presentationId}/embed`;
    }
    
    // Если не удалось распарсить, возвращаем null
    return null;
  };

  const embedUrl = getEmbedUrl(block.url);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">📊 Презентация</div>
        {isAuthor && block.block_id && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onEdit(block)} 
              className="courses-btn courses-btn-secondary"
              style={{ padding: '4px 12px', fontSize: '0.9em' }}
            >
              ✎ Редактировать
            </button>
            <button 
              onClick={() => onDelete(block.block_id)} 
              className="courses-btn courses-btn-danger"
              style={{ padding: '4px 12px', fontSize: '0.9em' }}
            >
              🗑 Удалить
            </button>
          </div>
        )}
      </div>
      <div className="lesson-block-content">
        {embedUrl ? (
          <div style={{ 
            position: 'relative', 
            paddingBottom: '56.25%', // 16:9 aspect ratio
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <iframe
              src={embedUrl}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              allowFullScreen
              title="Google Slides Presentation"
            />
          </div>
        ) : block.url ? (
          <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <p style={{ margin: 0, marginBottom: '8px', color: '#666' }}>
              Не удалось загрузить презентацию. Проверьте правильность ссылки.
            </p>
            <a 
              href={block.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0066cc', textDecoration: 'underline' }}
            >
              Открыть презентацию в новой вкладке
            </a>
          </div>
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Ссылка на презентацию не указана</p>
        )}
      </div>
    </div>
  );
};

export default PresentationBlock;
