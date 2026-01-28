import React from 'react';

/**
 * Компонент блока видео
 */
const VideoBlock = ({ block, isAuthor, onEdit, onDelete }) => {
  // Функция для преобразования URL YouTube в embed URL
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    
    // Если URL уже в формате embed, возвращаем как есть
    if (url.includes('/embed/')) {
      return url;
    }
    
    // Различные форматы YouTube URL:
    // https://www.youtube.com/watch?v=VIDEO_ID
    // https://youtu.be/VIDEO_ID
    // https://www.youtube.com/watch?v=VIDEO_ID&t=123s
    // https://youtube.com/watch?v=VIDEO_ID
    
    let videoId = null;
    
    // Формат: youtube.com/watch?v=VIDEO_ID или youtu.be/VIDEO_ID
    const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (watchMatch && watchMatch[1]) {
      videoId = watchMatch[1];
    }
    
    // Формат: youtube.com/embed/VIDEO_ID
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) {
      videoId = embedMatch[1];
    }
    
    if (videoId) {
      // Извлекаем параметр времени (t=) если есть
      const timeMatch = url.match(/[?&]t=(\d+)/);
      const timeParam = timeMatch ? `&start=${timeMatch[1]}` : '';
      return `https://www.youtube.com/embed/${videoId}${timeParam}`;
    }
    
    return null;
  };

  // Функция для преобразования URL VK Video в embed URL
  const getVKEmbedUrl = (url) => {
    if (!url) return null;
    
    // Если URL уже в формате embed, возвращаем как есть
    if (url.includes('/video_ext.php')) {
      return url;
    }
    
    // Форматы VK Video URL:
    // https://vk.com/video123456_789012345
    // https://vk.com/video?z=video123456_789012345
    // https://vk.com/video123456_789012345?list=...
    // https://m.vk.com/video123456_789012345
    // https://vkvideo.ru/video-162234353_456239038
    // https://vk.com/miusskayaduna?z=video-162234353_456239038
    
    // Извлекаем ID видео в формате ownerId_videoId (может быть с минусом или без)
    let videoId = null;
    let ownerId = null;
    let id = null;
    
    // Формат: vkvideo.ru/video-162234353_456239038
    const vkvideoMatch = url.match(/vkvideo\.ru\/video-?(\d+_\d+)/);
    if (vkvideoMatch && vkvideoMatch[1]) {
      const parts = vkvideoMatch[1].split('_');
      if (parts.length === 2) {
        ownerId = parts[0];
        id = parts[1];
      }
    }
    
    // Формат: vk.com/video123456_789012345 или vk.com/video-162234353_456239038 (с отрицательным oid)
    if (!ownerId || !id) {
      const directMatch = url.match(/vk\.com\/video(-?\d+_\d+)/);
      if (directMatch && directMatch[1]) {
        const parts = directMatch[1].split('_');
        if (parts.length === 2) {
          ownerId = parts[0];
          id = parts[1];
        }
      }
    }
    
    // Формат: vk.com/video?z=video123456_789012345 или vk.com/...?z=video-162234353_456239038
    if (!ownerId || !id) {
      const zMatch = url.match(/[?&]z=video-?(\d+_\d+)/);
      if (zMatch && zMatch[1]) {
        const parts = zMatch[1].split('_');
        if (parts.length === 2) {
          ownerId = parts[0];
          id = parts[1];
        }
      }
    }
    
    if (ownerId && id) {
      // VK Video embed URL формат
      return `https://vk.com/video_ext.php?oid=${ownerId}&id=${id}`;
    }
    
    return null;
  };

  const getEmbedUrl = () => {
    if (!block.url) return null;
    
    if (block.video_type === 'youtube') {
      return getYouTubeEmbedUrl(block.url);
    } else if (block.video_type === 'vk') {
      return getVKEmbedUrl(block.url);
    }
    
    return null;
  };

  const embedUrl = getEmbedUrl();
  const videoTypeLabel = block.video_type === 'youtube' ? 'YouTube' : 'VK Video';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div className="lesson-block-type-badge">🎥 Видео ({videoTypeLabel})</div>
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
              title={`${videoTypeLabel} Video`}
            />
          </div>
        ) : block.url ? (
          <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
            <p style={{ margin: 0, marginBottom: '8px', color: '#666' }}>
              Не удалось загрузить видео. Проверьте правильность ссылки.
            </p>
            <a 
              href={block.url} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#0066cc', textDecoration: 'underline' }}
            >
              Открыть видео в новой вкладке
            </a>
          </div>
        ) : (
          <p style={{ color: '#999', fontStyle: 'italic' }}>Ссылка на видео не указана</p>
        )}
      </div>
    </div>
  );
};

export default VideoBlock;
