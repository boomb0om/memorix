import React, { useState, useEffect } from 'react';
import { coursesApi, lessonsApi } from '../services/api';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [editedCourseName, setEditedCourseName] = useState('');
  const [editedCourseDescription, setEditedCourseDescription] = useState('');
  const [editedLessonName, setEditedLessonName] = useState('');
  const [editedLessonDescription, setEditedLessonDescription] = useState('');
  const [editedLessonBlocks, setEditedLessonBlocks] = useState([]);
  const [editingBlockIndex, setEditingBlockIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const { isSidebarOpen } = useSidebar();

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadLessons(selectedCourse.id);
    } else {
      setLessons([]);
      setSelectedLesson(null);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await coursesApi.getAll();
      setCourses(response.data || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить курсы');
      console.error('Error loading courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (courseId) => {
    try {
      const response = await lessonsApi.getByCourse(courseId);
      setLessons(response.data || []);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить уроки');
      console.error('Error loading lessons:', err);
    }
  };

  const handleSelectCourse = async (courseId) => {
    try {
      const response = await coursesApi.getById(courseId);
      setSelectedCourse(response.data);
      setIsEditingCourse(false);
      setIsCreatingCourse(false);
      setSelectedLesson(null);
    } catch (err) {
      setError('Не удалось загрузить курс');
      console.error('Error loading course:', err);
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setLessons([]);
    setSelectedLesson(null);
    setIsEditingCourse(false);
    setIsEditingLesson(false);
    setIsCreatingCourse(false);
    setIsCreatingLesson(false);
  };

  const handleSelectLesson = async (lessonId) => {
    try {
      const response = await lessonsApi.getById(lessonId);
      setSelectedLesson(response.data);
      setIsEditingLesson(false);
      setIsCreatingLesson(false);
    } catch (err) {
      setError('Не удалось загрузить урок');
      console.error('Error loading lesson:', err);
    }
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      setEditedCourseName(selectedCourse.name);
      setEditedCourseDescription(selectedCourse.description || '');
      setIsEditingCourse(true);
    }
  };

  const handleEditLesson = () => {
    if (selectedLesson) {
      setEditedLessonName(selectedLesson.name);
      setEditedLessonDescription(selectedLesson.description || '');
      setEditedLessonBlocks(selectedLesson.blocks || []);
      setEditingBlockIndex(null);
      setIsEditingLesson(true);
    }
  };

  const handleSaveCourse = async () => {
    try {
      if (isCreatingCourse) {
        const response = await coursesApi.create({
          name: editedCourseName,
          description: editedCourseDescription,
        });
        setSelectedCourse(response.data);
        await loadCourses();
        setIsCreatingCourse(false);
      } else if (selectedCourse) {
        const response = await coursesApi.update(selectedCourse.id, {
          name: editedCourseName,
          description: editedCourseDescription,
        });
        setSelectedCourse(response.data);
        await loadCourses();
      }
      setIsEditingCourse(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить курс');
      console.error('Error saving course:', err);
    }
  };

  const handleSaveLesson = async () => {
    try {
      if (isCreatingLesson) {
        const response = await lessonsApi.create({
          course_id: selectedCourse.id,
          position: lessons.length,
          name: editedLessonName,
          description: editedLessonDescription || null,
          blocks: editedLessonBlocks,
        });
        setSelectedLesson(response.data);
        await loadLessons(selectedCourse.id);
        setIsCreatingLesson(false);
      } else if (selectedLesson) {
        const response = await lessonsApi.update(selectedLesson.id, {
          name: editedLessonName,
          description: editedLessonDescription || null,
          blocks: editedLessonBlocks,
        });
        setSelectedLesson(response.data);
        await loadLessons(selectedCourse.id);
      }
      setIsEditingLesson(false);
      setEditingBlockIndex(null);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить урок');
      console.error('Error saving lesson:', err);
    }
  };

  const handleCancelCourse = () => {
    setIsEditingCourse(false);
    setIsCreatingCourse(false);
    setEditedCourseName('');
    setEditedCourseDescription('');
  };

  const handleCancelLesson = () => {
    setIsEditingLesson(false);
    setIsCreatingLesson(false);
    setEditedLessonName('');
    setEditedLessonDescription('');
    setEditedLessonBlocks([]);
    setEditingBlockIndex(null);
  };

  const handleDeleteCourse = async () => {
    if (selectedCourse && window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      try {
        await coursesApi.delete(selectedCourse.id);
        handleBackToCourses();
        await loadCourses();
        setError(null);
      } catch (err) {
        setError('Не удалось удалить курс');
        console.error('Error deleting course:', err);
      }
    }
  };

  const handleDeleteLesson = async () => {
    if (selectedLesson && window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      try {
        await lessonsApi.delete(selectedLesson.id);
        setSelectedLesson(null);
        await loadLessons(selectedCourse.id);
        setError(null);
      } catch (err) {
        setError('Не удалось удалить урок');
        console.error('Error deleting lesson:', err);
      }
    }
  };

  const handleCreateNewCourse = () => {
    setIsCreatingCourse(true);
    setIsEditingCourse(true);
    setSelectedCourse(null);
    setEditedCourseName('');
    setEditedCourseDescription('');
  };

  const handleCreateNewLesson = () => {
    setIsCreatingLesson(true);
    setIsEditingLesson(true);
    setSelectedLesson(null);
    setEditedLessonName('');
    setEditedLessonDescription('');
    setEditedLessonBlocks([]);
    setEditingBlockIndex(null);
  };

  // Функции для работы с блоками
  const addBlock = (type) => {
    let newBlock;
    switch (type) {
      case 'theory':
        newBlock = { type: 'theory', title: '', content: '' };
        break;
      case 'single_choice':
        newBlock = { type: 'single_choice', question: '', options: ['', ''], correct_answer: 0, explanation: '' };
        break;
      case 'multiple_choice':
        newBlock = { type: 'multiple_choice', question: '', options: ['', ''], correct_answers: [0], explanation: '' };
        break;
      case 'code':
        newBlock = { type: 'code', title: '', code: '', language: 'python', explanation: '' };
        break;
      case 'note':
        newBlock = { type: 'note', note_type: 'info', content: '' };
        break;
      default:
        return;
    }
    setEditedLessonBlocks([...editedLessonBlocks, newBlock]);
    setEditingBlockIndex(editedLessonBlocks.length);
  };

  const updateBlock = (index, updatedBlock) => {
    const newBlocks = [...editedLessonBlocks];
    newBlocks[index] = updatedBlock;
    setEditedLessonBlocks(newBlocks);
  };

  const deleteBlock = (index) => {
    const newBlocks = editedLessonBlocks.filter((_, i) => i !== index);
    setEditedLessonBlocks(newBlocks);
    if (editingBlockIndex === index) {
      setEditingBlockIndex(null);
    } else if (editingBlockIndex > index) {
      setEditingBlockIndex(editingBlockIndex - 1);
    }
  };

  const moveBlock = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === editedLessonBlocks.length - 1)) {
      return;
    }
    const newBlocks = [...editedLessonBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setEditedLessonBlocks(newBlocks);
    if (editingBlockIndex === index) {
      setEditingBlockIndex(targetIndex);
    } else if (editingBlockIndex === targetIndex) {
      setEditingBlockIndex(index);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <>
      <Sidebar />
      <div className={`courses-container ${!isSidebarOpen ? 'courses-container-expanded' : ''}`}>
        {/* Левая панель со списком курсов или уроков */}
        <div className="courses-list" style={{ display: selectedCourse ? 'none' : 'flex' }}>
          <div className="courses-list-header">
            <h2>Курсы</h2>
            <button onClick={handleCreateNewCourse} className="courses-create-btn">
              + Создать
            </button>
          </div>
          
          {loading && <div className="courses-loading">Загрузка...</div>}
          
          {!loading && courses.length === 0 && (
            <div className="courses-empty">
              <p>У вас пока нет курсов</p>
              <button onClick={handleCreateNewCourse} className="courses-create-btn-large">
                Создать первый курс
              </button>
            </div>
          )}
          
          {!loading && courses.map(course => (
            <div
              key={course.id}
              className={`courses-item ${selectedCourse?.id === course.id ? 'courses-item-active' : ''}`}
              onClick={() => handleSelectCourse(course.id)}
            >
              <div className="courses-item-title">{course.name}</div>
              <div className="courses-item-description">
                {course.description || 'Без описания'}
              </div>
              <div className="courses-item-meta">
                Создан: {formatDate(course.created_at)}
              </div>
            </div>
          ))}
        </div>

        {/* Левая панель со списком уроков */}
        <div className="courses-list" style={{ display: selectedCourse ? 'flex' : 'none' }}>
          <div className="courses-list-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={handleBackToCourses} 
                className="courses-back-btn"
                title="Назад к курсам"
              >
                ←
              </button>
              <h2>{selectedCourse?.name}</h2>
            </div>
            <button onClick={handleCreateNewLesson} className="courses-create-btn">
              + Создать урок
            </button>
          </div>
          
          {lessons.length === 0 && (
            <div className="courses-empty">
              <p>В этом курсе пока нет уроков</p>
              <button onClick={handleCreateNewLesson} className="courses-create-btn-large">
                Создать первый урок
              </button>
            </div>
          )}
          
          {lessons.map(lesson => (
            <div
              key={lesson.id}
              className={`courses-item ${selectedLesson?.id === lesson.id ? 'courses-item-active' : ''}`}
              onClick={() => handleSelectLesson(lesson.id)}
            >
              <div className="courses-item-title">{lesson.name}</div>
              <div className="courses-item-description">
                {lesson.description || 'Без описания'}
              </div>
              <div className="courses-item-meta">
                Позиция: {lesson.position + 1} • Создан: {formatDate(lesson.created_at)}
              </div>
            </div>
          ))}
        </div>

        {/* Правая панель с содержимым курса или урока */}
        <div className="courses-content">
          {error && (
            <div className="courses-error">
              {error}
              <button onClick={() => setError(null)} className="courses-error-close">✕</button>
            </div>
          )}

          {/* Плейсхолдер, когда ничего не выбрано */}
          {!selectedCourse && !isCreatingCourse && (
            <div className="courses-placeholder">
              <h2>Выберите курс</h2>
              <p>Выберите курс из списка слева или создайте новый</p>
            </div>
          )}


          {/* Редактирование курса */}
          {isEditingCourse && (
            <div className="courses-edit">
              <div className="courses-edit-header">
                <h2>{isCreatingCourse ? 'Создание нового курса' : 'Редактирование курса'}</h2>
                <div className="courses-edit-actions">
                  <button onClick={handleCancelCourse} className="courses-btn courses-btn-secondary">
                    Отменить
                  </button>
                  <button onClick={handleSaveCourse} className="courses-btn courses-btn-primary">
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
                    onChange={(e) => setEditedCourseName(e.target.value)}
                    placeholder="Введите название курса"
                    className="courses-input"
                  />
                </div>
                <div className="courses-form-group">
                  <label htmlFor="course-description">Описание</label>
                  <textarea
                    id="course-description"
                    value={editedCourseDescription}
                    onChange={(e) => setEditedCourseDescription(e.target.value)}
                    placeholder="Введите описание курса"
                    className="courses-textarea"
                    rows="10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Просмотр урока */}
          {selectedLesson && !isEditingLesson && (
            <div className="courses-view">
              <div className="courses-view-header">
                <div>
                  <h1>{selectedLesson.name}</h1>
                  <p className="courses-view-meta">
                    Позиция: {selectedLesson.position + 1} • Создан: {formatDate(selectedLesson.created_at)}
                    {selectedLesson.updated_at && (
                      <> • Обновлен: {formatDate(selectedLesson.updated_at)}</>
                    )}
                  </p>
                </div>
                <div className="courses-view-actions">
                  <button onClick={handleEditLesson} className="courses-btn courses-btn-primary">
                    Редактировать
                  </button>
                  <button onClick={handleDeleteLesson} className="courses-btn courses-btn-danger">
                    Удалить
                  </button>
                </div>
              </div>
              <div className="courses-view-content">
                <h3>Описание</h3>
                <p>{selectedLesson.description || 'Описание отсутствует'}</p>
                {selectedLesson.blocks && selectedLesson.blocks.length > 0 && (
                  <>
                    <h3>Содержимое урока</h3>
                    <div className="lesson-blocks">
                      {selectedLesson.blocks.map((block, index) => (
                        <div key={index} className="lesson-block-view">
                          {block.type === 'theory' && (
                            <div>
                              <div className="lesson-block-type-badge">📖 Теория</div>
                              {block.title && <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>{block.title}</h4>}
                              <div className="lesson-block-content" style={{ whiteSpace: 'pre-wrap' }}>{block.content || 'Пусто'}</div>
                            </div>
                          )}
                          {block.type === 'code' && (
                            <div>
                              <div className="lesson-block-type-badge">💻 Код ({block.language || 'python'})</div>
                              {block.title && <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>{block.title}</h4>}
                              <pre style={{ background: '#1e1e1e', color: '#d4d4d4', padding: '16px', borderRadius: '8px', overflow: 'auto', marginTop: '12px' }}>
                                <code>{block.code || 'Пусто'}</code>
                              </pre>
                              {block.explanation && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
                                  <strong>Пояснение:</strong> {block.explanation}
                                </div>
                              )}
                            </div>
                          )}
                          {block.type === 'note' && (
                            <div>
                              <div className="lesson-block-type-badge">
                                {block.note_type === 'info' && 'ℹ️ Информация'}
                                {block.note_type === 'warning' && '⚠️ Предупреждение'}
                                {block.note_type === 'tip' && '💡 Совет'}
                                {block.note_type === 'important' && '❗ Важно'}
                              </div>
                              <div className="lesson-block-content" style={{ marginTop: '12px' }}>{block.content || 'Пусто'}</div>
                            </div>
                          )}
                          {block.type === 'single_choice' && (
                            <div>
                              <div className="lesson-block-type-badge">❓ Вопрос (один ответ)</div>
                              <h4 style={{ marginTop: '12px', marginBottom: '12px' }}>{block.question || 'Вопрос не указан'}</h4>
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {(block.options || []).map((opt, optIdx) => (
                                  <li key={optIdx} style={{ 
                                    padding: '8px 12px', 
                                    marginBottom: '8px', 
                                    background: optIdx === block.correct_answer ? '#d1fae5' : '#f3f4f6',
                                    border: optIdx === block.correct_answer ? '2px solid #10b981' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span>{optIdx === block.correct_answer ? '✓' : '○'}</span>
                                    <span>{opt || `Вариант ${optIdx + 1}`}</span>
                                  </li>
                                ))}
                              </ul>
                              {block.explanation && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
                                  <strong>Пояснение:</strong> {block.explanation}
                                </div>
                              )}
                            </div>
                          )}
                          {block.type === 'multiple_choice' && (
                            <div>
                              <div className="lesson-block-type-badge">❓ Вопрос (несколько ответов)</div>
                              <h4 style={{ marginTop: '12px', marginBottom: '12px' }}>{block.question || 'Вопрос не указан'}</h4>
                              <ul style={{ listStyle: 'none', padding: 0 }}>
                                {(block.options || []).map((opt, optIdx) => (
                                  <li key={optIdx} style={{ 
                                    padding: '8px 12px', 
                                    marginBottom: '8px', 
                                    background: (block.correct_answers || []).includes(optIdx) ? '#d1fae5' : '#f3f4f6',
                                    border: (block.correct_answers || []).includes(optIdx) ? '2px solid #10b981' : '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    <span>{(block.correct_answers || []).includes(optIdx) ? '✓' : '☐'}</span>
                                    <span>{opt || `Вариант ${optIdx + 1}`}</span>
                                  </li>
                                ))}
                              </ul>
                              {block.explanation && (
                                <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
                                  <strong>Пояснение:</strong> {block.explanation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Редактирование урока */}
          {isEditingLesson && (
            <div className="courses-edit">
              <div className="courses-edit-header">
                <h2>{isCreatingLesson ? 'Создание нового урока' : 'Редактирование урока'}</h2>
                <div className="courses-edit-actions">
                  <button onClick={handleCancelLesson} className="courses-btn courses-btn-secondary">
                    Отменить
                  </button>
                  <button onClick={handleSaveLesson} className="courses-btn courses-btn-primary">
                    Сохранить
                  </button>
                </div>
              </div>
              <div className="courses-edit-form">
                <div className="courses-form-group">
                  <label htmlFor="lesson-name">Название урока</label>
                  <input
                    id="lesson-name"
                    type="text"
                    value={editedLessonName}
                    onChange={(e) => setEditedLessonName(e.target.value)}
                    placeholder="Введите название урока"
                    className="courses-input"
                  />
                </div>
                <div className="courses-form-group">
                  <label htmlFor="lesson-description">Описание</label>
                  <textarea
                    id="lesson-description"
                    value={editedLessonDescription}
                    onChange={(e) => setEditedLessonDescription(e.target.value)}
                    placeholder="Введите описание урока"
                    className="courses-textarea"
                    rows="3"
                  />
                </div>

                {/* Редактор блоков */}
                <div className="lesson-blocks-editor">
                  <div className="lesson-blocks-header">
                    <h3>Блоки урока</h3>
                    <div className="lesson-blocks-add-menu">
                      <button className="courses-btn courses-btn-secondary" onClick={() => addBlock('theory')}>
                        + Теория
                      </button>
                      <button className="courses-btn courses-btn-secondary" onClick={() => addBlock('code')}>
                        + Код
                      </button>
                      <button className="courses-btn courses-btn-secondary" onClick={() => addBlock('note')}>
                        + Заметка
                      </button>
                      <button className="courses-btn courses-btn-secondary" onClick={() => addBlock('single_choice')}>
                        + Вопрос (один ответ)
                      </button>
                      <button className="courses-btn courses-btn-secondary" onClick={() => addBlock('multiple_choice')}>
                        + Вопрос (несколько ответов)
                      </button>
                    </div>
                  </div>

                  {editedLessonBlocks.length === 0 ? (
                    <div className="lesson-blocks-empty">
                      <p>Нет блоков. Добавьте блок, чтобы начать создавать урок.</p>
                    </div>
                  ) : (
                    <div className="lesson-blocks-list">
                      {editedLessonBlocks.map((block, index) => (
                        <div key={index} className={`lesson-block-editor ${editingBlockIndex === index ? 'editing' : ''}`}>
                          <div className="lesson-block-header">
                            <div className="lesson-block-type-badge">
                              {block.type === 'theory' && '📖 Теория'}
                              {block.type === 'code' && '💻 Код'}
                              {block.type === 'note' && '📌 Заметка'}
                              {block.type === 'single_choice' && '❓ Вопрос (один ответ)'}
                              {block.type === 'multiple_choice' && '❓ Вопрос (несколько ответов)'}
                            </div>
                            <div className="lesson-block-actions">
                              <button onClick={() => moveBlock(index, 'up')} disabled={index === 0} title="Вверх">
                                ↑
                              </button>
                              <button onClick={() => moveBlock(index, 'down')} disabled={index === editedLessonBlocks.length - 1} title="Вниз">
                                ↓
                              </button>
                              <button onClick={() => setEditingBlockIndex(editingBlockIndex === index ? null : index)} title="Редактировать">
                                {editingBlockIndex === index ? '✕' : '✎'}
                              </button>
                              <button onClick={() => deleteBlock(index)} title="Удалить" className="delete-btn">
                                🗑
                              </button>
                            </div>
                          </div>

                          {editingBlockIndex === index && (
                            <div className="lesson-block-edit-form">
                              {block.type === 'theory' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Заголовок</label>
                                    <input
                                      type="text"
                                      value={block.title || ''}
                                      onChange={(e) => updateBlock(index, { ...block, title: e.target.value })}
                                      className="courses-input"
                                      placeholder="Заголовок блока"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Содержимое (Markdown)</label>
                                    <textarea
                                      value={block.content || ''}
                                      onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
                                      className="courses-textarea"
                                      rows="8"
                                      placeholder="Теоретический материал в формате Markdown"
                                    />
                                  </div>
                                </>
                              )}

                              {block.type === 'code' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Заголовок (необязательно)</label>
                                    <input
                                      type="text"
                                      value={block.title || ''}
                                      onChange={(e) => updateBlock(index, { ...block, title: e.target.value })}
                                      className="courses-input"
                                      placeholder="Заголовок блока кода"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Язык программирования</label>
                                    <select
                                      value={block.language || 'python'}
                                      onChange={(e) => updateBlock(index, { ...block, language: e.target.value })}
                                      className="courses-input"
                                    >
                                      <option value="python">Python</option>
                                      <option value="javascript">JavaScript</option>
                                      <option value="java">Java</option>
                                      <option value="cpp">C++</option>
                                      <option value="c">C</option>
                                      <option value="go">Go</option>
                                      <option value="rust">Rust</option>
                                      <option value="sql">SQL</option>
                                    </select>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Код</label>
                                    <textarea
                                      value={block.code || ''}
                                      onChange={(e) => updateBlock(index, { ...block, code: e.target.value })}
                                      className="courses-textarea"
                                      rows="10"
                                      placeholder="Введите код"
                                      style={{ fontFamily: 'monospace' }}
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={block.explanation || ''}
                                      onChange={(e) => updateBlock(index, { ...block, explanation: e.target.value })}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к коду"
                                    />
                                  </div>
                                </>
                              )}

                              {block.type === 'note' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Тип заметки</label>
                                    <select
                                      value={block.note_type || 'info'}
                                      onChange={(e) => updateBlock(index, { ...block, note_type: e.target.value })}
                                      className="courses-input"
                                    >
                                      <option value="info">Информация</option>
                                      <option value="warning">Предупреждение</option>
                                      <option value="tip">Совет</option>
                                      <option value="important">Важно</option>
                                    </select>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Содержимое</label>
                                    <textarea
                                      value={block.content || ''}
                                      onChange={(e) => updateBlock(index, { ...block, content: e.target.value })}
                                      className="courses-textarea"
                                      rows="5"
                                      placeholder="Текст заметки"
                                    />
                                  </div>
                                </>
                              )}

                              {block.type === 'single_choice' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Вопрос</label>
                                    <input
                                      type="text"
                                      value={block.question || ''}
                                      onChange={(e) => updateBlock(index, { ...block, question: e.target.value })}
                                      className="courses-input"
                                      placeholder="Формулировка вопроса"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Варианты ответов</label>
                                    {(block.options || ['', '']).map((option, optIndex) => (
                                      <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                          type="radio"
                                          name={`correct-${index}`}
                                          checked={block.correct_answer === optIndex}
                                          onChange={() => updateBlock(index, { ...block, correct_answer: optIndex })}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...(block.options || [])];
                                            newOptions[optIndex] = e.target.value;
                                            updateBlock(index, { ...block, options: newOptions });
                                          }}
                                          className="courses-input"
                                          placeholder={`Вариант ${optIndex + 1}`}
                                          style={{ flex: 1 }}
                                        />
                                        {(block.options || []).length > 2 && (
                                          <button
                                            onClick={() => {
                                              const newOptions = (block.options || []).filter((_, i) => i !== optIndex);
                                              const newCorrect = block.correct_answer === optIndex ? 0 : (block.correct_answer > optIndex ? block.correct_answer - 1 : block.correct_answer);
                                              updateBlock(index, { ...block, options: newOptions, correct_answer: newCorrect });
                                            }}
                                            className="courses-btn courses-btn-danger"
                                            style={{ padding: '4px 8px' }}
                                          >
                                            Удалить
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newOptions = [...(block.options || []), ''];
                                        updateBlock(index, { ...block, options: newOptions });
                                      }}
                                      className="courses-btn courses-btn-secondary"
                                      style={{ marginTop: '8px' }}
                                    >
                                      + Добавить вариант
                                    </button>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={block.explanation || ''}
                                      onChange={(e) => updateBlock(index, { ...block, explanation: e.target.value })}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к правильному ответу"
                                    />
                                  </div>
                                </>
                              )}

                              {block.type === 'multiple_choice' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Вопрос</label>
                                    <input
                                      type="text"
                                      value={block.question || ''}
                                      onChange={(e) => updateBlock(index, { ...block, question: e.target.value })}
                                      className="courses-input"
                                      placeholder="Формулировка вопроса"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Варианты ответов</label>
                                    {(block.options || ['', '']).map((option, optIndex) => (
                                      <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                          type="checkbox"
                                          checked={(block.correct_answers || []).includes(optIndex)}
                                          onChange={(e) => {
                                            const currentAnswers = block.correct_answers || [];
                                            const newAnswers = e.target.checked
                                              ? [...currentAnswers, optIndex]
                                              : currentAnswers.filter(i => i !== optIndex);
                                            updateBlock(index, { ...block, correct_answers: newAnswers });
                                          }}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const newOptions = [...(block.options || [])];
                                            newOptions[optIndex] = e.target.value;
                                            updateBlock(index, { ...block, options: newOptions });
                                          }}
                                          className="courses-input"
                                          placeholder={`Вариант ${optIndex + 1}`}
                                          style={{ flex: 1 }}
                                        />
                                        {(block.options || []).length > 2 && (
                                          <button
                                            onClick={() => {
                                              const newOptions = (block.options || []).filter((_, i) => i !== optIndex);
                                              const newAnswers = (block.correct_answers || []).filter(i => i !== optIndex).map(i => i > optIndex ? i - 1 : i);
                                              updateBlock(index, { ...block, options: newOptions, correct_answers: newAnswers });
                                            }}
                                            className="courses-btn courses-btn-danger"
                                            style={{ padding: '4px 8px' }}
                                          >
                                            Удалить
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={() => {
                                        const newOptions = [...(block.options || []), ''];
                                        updateBlock(index, { ...block, options: newOptions });
                                      }}
                                      className="courses-btn courses-btn-secondary"
                                      style={{ marginTop: '8px' }}
                                    >
                                      + Добавить вариант
                                    </button>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={block.explanation || ''}
                                      onChange={(e) => updateBlock(index, { ...block, explanation: e.target.value })}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к правильным ответам"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                          {editingBlockIndex !== index && (
                            <div className="lesson-block-preview">
                              {block.type === 'theory' && (
                                <div>
                                  <strong>{block.title || 'Без заголовка'}</strong>
                                  <p style={{ marginTop: '8px', whiteSpace: 'pre-wrap' }}>{block.content || 'Пусто'}</p>
                                </div>
                              )}
                              {block.type === 'code' && (
                                <div>
                                  {block.title && <strong>{block.title}</strong>}
                                  <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                                    <code>{block.code || 'Пусто'}</code>
                                  </pre>
                                  {block.explanation && <p style={{ marginTop: '8px' }}>{block.explanation}</p>}
                                </div>
                              )}
                              {block.type === 'note' && (
                                <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
                                  <strong>{block.note_type === 'info' ? 'ℹ️ Информация' : block.note_type === 'warning' ? '⚠️ Предупреждение' : block.note_type === 'tip' ? '💡 Совет' : '❗ Важно'}</strong>
                                  <p style={{ marginTop: '8px' }}>{block.content || 'Пусто'}</p>
                                </div>
                              )}
                              {block.type === 'single_choice' && (
                                <div>
                                  <strong>{block.question || 'Вопрос не указан'}</strong>
                                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                    {(block.options || []).map((opt, optIdx) => (
                                      <li key={optIdx} style={{ color: optIdx === block.correct_answer ? 'green' : 'inherit' }}>
                                        {opt || `Вариант ${optIdx + 1}`} {optIdx === block.correct_answer && '✓'}
                                      </li>
                                    ))}
                                  </ul>
                                  {block.explanation && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>{block.explanation}</p>}
                                </div>
                              )}
                              {block.type === 'multiple_choice' && (
                                <div>
                                  <strong>{block.question || 'Вопрос не указан'}</strong>
                                  <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                    {(block.options || []).map((opt, optIdx) => (
                                      <li key={optIdx} style={{ color: (block.correct_answers || []).includes(optIdx) ? 'green' : 'inherit' }}>
                                        {opt || `Вариант ${optIdx + 1}`} {(block.correct_answers || []).includes(optIdx) && '✓'}
                                      </li>
                                    ))}
                                  </ul>
                                  {block.explanation && <p style={{ marginTop: '8px', fontStyle: 'italic' }}>{block.explanation}</p>}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Карточки уроков, когда выбран курс, но не выбран урок */}
          {selectedCourse && !selectedLesson && !isEditingCourse && !isCreatingLesson && (
            <div className="lessons-cards-view">
              <div className="lessons-cards-header">
                <h2>Уроки курса "{selectedCourse.name}"</h2>
                <button onClick={handleCreateNewLesson} className="courses-btn courses-btn-primary">
                  + Создать урок
                </button>
              </div>
              {lessons.length === 0 ? (
                <div className="lessons-cards-empty">
                  <p>В этом курсе пока нет уроков</p>
                  <button onClick={handleCreateNewLesson} className="courses-create-btn-large">
                    Создать первый урок
                  </button>
                </div>
              ) : (
                <div className="lessons-cards-grid">
                  {lessons.map(lesson => (
                    <div
                      key={lesson.id}
                      className="lesson-card"
                      onClick={() => handleSelectLesson(lesson.id)}
                    >
                      <div className="lesson-card-header">
                        <h3 className="lesson-card-title">{lesson.name}</h3>
                        <div className="lesson-card-position">#{lesson.position + 1}</div>
                      </div>
                      <div className="lesson-card-description">
                        {lesson.description || 'Без описания'}
                      </div>
                      <div className="lesson-card-footer">
                        <div className="lesson-card-meta">
                          Создан: {formatDate(lesson.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Courses;
