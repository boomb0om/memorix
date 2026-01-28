/**
 * Утилиты для компонента Courses
 */

/**
 * Форматирует дату в читаемый формат
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Проверяет, является ли пользователь автором курса
 */
export const isCourseAuthor = (selectedCourse, user) => {
  return selectedCourse && user && selectedCourse.author_id === user.id;
};

/**
 * Подготавливает блоки для отправки на API
 */
export const prepareBlocksForApi = (blocks) => {
  return blocks.map((block) => {
    const { block_id, ...blockData } = block;
    if (block_id) {
      return { ...blockData, block_id };
    }
    return blockData;
  });
};

/**
 * Создает новый блок по типу
 */
export const createNewBlock = (type) => {
  switch (type) {
    case 'theory':
      return { type: 'theory', title: '', content: '' };
    case 'single_choice':
      return { type: 'single_choice', question: '', options: ['', ''], correct_answer: 0, explanation: '' };
    case 'multiple_choice':
      return { type: 'multiple_choice', question: '', options: ['', ''], correct_answers: [0], explanation: '' };
    case 'code':
      return { type: 'code', title: '', code: '', language: 'python', explanation: '' };
    case 'note':
      return { type: 'note', note_type: 'info', content: '' };
    case 'presentation':
      return { type: 'presentation', url: '' };
    case 'video':
      return { type: 'video', video_type: 'youtube', url: '' };
    default:
      return null;
  }
};

/**
 * Обрезает текст до указанной длины и добавляет многоточие
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Обрезает markdown текст, удаляя разметку для подсчета длины
 */
export const truncateMarkdown = (text, maxLength) => {
  if (!text) return '';
  // Простая обрезка markdown - удаляем разметку для подсчета
  const plainText = text.replace(/[#*_`\[\]()]/g, '').replace(/\n/g, ' ');
  if (plainText.length <= maxLength) return text;
  // Находим позицию обрезки в оригинальном тексте
  let charCount = 0;
  let i = 0;
  while (i < text.length && charCount < maxLength) {
    const char = text[i];
    if (!/[#*_`\[\]()\n]/.test(char)) {
      charCount++;
    }
    i++;
  }
  return text.substring(0, i).trim() + '...';
};

