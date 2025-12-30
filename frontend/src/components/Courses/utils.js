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
    default:
      return null;
  }
};

