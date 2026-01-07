import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lessonsApi } from '../../../services/api';
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '../config';

/**
 * Хук для управления уроками
 */
export const useLessons = (selectedCourse) => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isEditingLesson, setIsEditingLesson] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [editedLessonName, setEditedLessonName] = useState('');
  const [editedLessonDescription, setEditedLessonDescription] = useState('');
  const [editedLessonBlocks, setEditedLessonBlocks] = useState([]);
  const [editingBlockIndex, setEditingBlockIndex] = useState(null);
  const [editingLessonName, setEditingLessonName] = useState(false);
  const [editingLessonDescription, setEditingLessonDescription] = useState(false);
  const [tempLessonName, setTempLessonName] = useState('');
  const [tempLessonDescription, setTempLessonDescription] = useState('');
  const [draggedLessonId, setDraggedLessonId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState({});
  const [checkedQuestions, setCheckedQuestions] = useState({});

  const loadLessons = async (courseId) => {
    try {
      const response = await lessonsApi.getByCourse(courseId);
      const lessonsList = response.data || [];
      const sortedLessons = [...lessonsList].sort((a, b) => a.position - b.position);
      setLessons(sortedLessons);
    } catch (err) {
      console.error('Error loading lessons:', err);
      throw err;
    }
  };

  const handleSelectLesson = async (lessonIdNum) => {
    if (!selectedCourse) return;
    try {
      const response = await lessonsApi.getById(selectedCourse.id, lessonIdNum);
      setSelectedLesson(response.data);
      setIsEditingLesson(false);
      setIsCreatingLesson(false);
      navigate(`/courses/${selectedCourse.id}/lessons/${lessonIdNum}`);
    } catch (err) {
      console.error('Error loading lesson:', err);
      throw err;
    }
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) return;
    try {
      // Валидация длины названия
      if (editedLessonName.trim().length > MAX_NAME_LENGTH) {
        throw new Error(`Название урока не должно превышать ${MAX_NAME_LENGTH} символов`);
      }
      
      // Валидация длины описания
      if (editedLessonDescription && editedLessonDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Описание урока не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`);
      }

      const blocksToSend = editedLessonBlocks.map((block) => {
        const { block_id, ...blockData } = block;
        return blockData;
      });
      
      const response = await lessonsApi.create(selectedCourse.id, {
        course_id: selectedCourse.id,
        position: lessons.length,
        name: editedLessonName.trim(),
        description: editedLessonDescription.trim() || null,
        blocks: blocksToSend,
      });
      setSelectedLesson(response.data);
      await loadLessons(selectedCourse.id);
      setIsCreatingLesson(false);
      navigate(`/courses/${selectedCourse.id}/lessons/${response.data.id}`);
      setIsEditingLesson(false);
      setEditingBlockIndex(null);
    } catch (err) {
      console.error('Error saving lesson:', err);
      throw err;
    }
  };

  const handleDeleteLesson = async () => {
    if (selectedLesson && selectedCourse && window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      try {
        await lessonsApi.delete(selectedCourse.id, selectedLesson.id);
        setSelectedLesson(null);
        await loadLessons(selectedCourse.id);
        navigate(`/courses/${selectedCourse.id}`);
      } catch (err) {
        console.error('Error deleting lesson:', err);
        throw err;
      }
    }
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

  const handleCancelLesson = () => {
    setIsEditingLesson(false);
    setIsCreatingLesson(false);
    setEditedLessonName('');
    setEditedLessonDescription('');
    setEditedLessonBlocks([]);
    setEditingBlockIndex(null);
  };

  const handleStartEditLessonName = (isAuthor) => {
    if (!isAuthor) return;
    setTempLessonName(selectedLesson.name);
    setEditingLessonName(true);
  };

  const handleSaveLessonName = async () => {
    if (!selectedCourse || !selectedLesson) return;
    try {
      // Валидация длины названия
      if (tempLessonName.trim().length > MAX_NAME_LENGTH) {
        throw new Error(`Название урока не должно превышать ${MAX_NAME_LENGTH} символов`);
      }

      const response = await lessonsApi.update(selectedCourse.id, selectedLesson.id, {
        name: tempLessonName.trim(),
      });
      setSelectedLesson(response.data);
      setEditingLessonName(false);
    } catch (err) {
      console.error('Error saving lesson name:', err);
      throw err;
    }
  };

  const handleCancelEditLessonName = () => {
    setEditingLessonName(false);
    setTempLessonName('');
  };

  const handleStartEditLessonDescription = (isAuthor) => {
    if (!isAuthor) return;
    setTempLessonDescription(selectedLesson.description || '');
    setEditingLessonDescription(true);
  };

  const handleSaveLessonDescription = async () => {
    if (!selectedCourse || !selectedLesson) return;
    try {
      // Валидация длины описания
      if (tempLessonDescription && tempLessonDescription.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`Описание урока не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`);
      }

      const response = await lessonsApi.update(selectedCourse.id, selectedLesson.id, {
        description: tempLessonDescription.trim() || null,
      });
      setSelectedLesson(response.data);
      setEditingLessonDescription(false);
    } catch (err) {
      console.error('Error saving lesson description:', err);
      throw err;
    }
  };

  const handleCancelEditLessonDescription = () => {
    setEditingLessonDescription(false);
    setTempLessonDescription('');
  };

  // Drag and drop для уроков
  const handleDragStart = (e, lessonId) => {
    setIsDragging(true);
    setDraggedLessonId(lessonId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedLessonId(null);
    setDragOverIndex(null);
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleDragOver = (e, index) => {
    if (draggedLessonId === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const draggedIndex = lessons.findIndex(l => l.id === draggedLessonId);
    if (draggedIndex === -1) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;
    
    if (draggedIndex < index) {
      setDragOverIndex(index);
    } else if (draggedIndex > index) {
      setDragOverIndex(index);
    } else {
      setDragOverIndex(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    if (draggedLessonId === null || !selectedCourse) return;
    e.preventDefault();
    
    const draggedLesson = lessons.find(l => l.id === draggedLessonId);
    if (!draggedLesson) return;

    const currentIndex = lessons.findIndex(l => l.id === draggedLessonId);
    if (currentIndex === targetIndex) {
      setDraggedLessonId(null);
      setDragOverIndex(null);
      return;
    }

    try {
      const sortedLessons = [...lessons];
      const [removed] = sortedLessons.splice(currentIndex, 1);
      
      let insertIndex;
      if (currentIndex < targetIndex) {
        insertIndex = targetIndex;
      } else {
        insertIndex = targetIndex;
      }
      
      sortedLessons.splice(insertIndex, 0, removed);
      
      const updatedLessons = sortedLessons.map((lesson, index) => ({
        ...lesson,
        position: index
      }));
      
      setLessons(updatedLessons);

      await lessonsApi.reorder(selectedCourse.id, draggedLessonId, insertIndex);
      await loadLessons(selectedCourse.id);
    } catch (err) {
      await loadLessons(selectedCourse.id);
      throw err;
    } finally {
      setDraggedLessonId(null);
      setDragOverIndex(null);
    }
  };

  // Обработчики для вопросов
  const handleSingleChoiceSelect = (blockId, answerIndex) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [blockId]: answerIndex
    }));
  };

  const handleMultipleChoiceToggle = (blockId, answerIndex) => {
    setQuestionAnswers(prev => {
      const currentAnswers = prev[blockId] || [];
      const newAnswers = currentAnswers.includes(answerIndex)
        ? currentAnswers.filter(a => a !== answerIndex)
        : [...currentAnswers, answerIndex];
      return {
        ...prev,
        [blockId]: newAnswers
      };
    });
  };

  const handleCheckAnswer = async (blockId) => {
    if (!selectedCourse || !selectedLesson) return;
    
    const userAnswer = questionAnswers[blockId];
    if (userAnswer === undefined || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      alert('Пожалуйста, выберите ответ');
      return;
    }

    try {
      const response = await lessonsApi.checkAnswer(
        selectedCourse.id,
        selectedLesson.id,
        blockId,
        userAnswer
      );
      
      const result = response.data;
      setCheckedQuestions(prev => ({
        ...prev,
        [blockId]: result
      }));
    } catch (error) {
      console.error('Error checking answer:', error);
      alert('Ошибка при проверке ответа');
    }
  };

  // Загрузка урока из URL
  useEffect(() => {
    const loadFromUrl = async () => {
      if (courseId && selectedCourse) {
        try {
          await loadLessons(selectedCourse.id);
          
          if (lessonId) {
            const lessonIdNum = parseInt(lessonId);
            const lessonResponse = await lessonsApi.getById(selectedCourse.id, lessonIdNum);
            setSelectedLesson(lessonResponse.data);
            setQuestionAnswers({});
            setCheckedQuestions({});
          } else {
            setSelectedLesson(null);
            setQuestionAnswers({});
            setCheckedQuestions({});
          }
        } catch (err) {
          console.error('Error loading from URL:', err);
        }
      } else {
        // Очищаем все состояние уроков когда курс не выбран
        setLessons([]);
        setSelectedLesson(null);
        setIsEditingLesson(false);
        setIsCreatingLesson(false);
        setQuestionAnswers({});
        setCheckedQuestions({});
      }
    };
    
    if (selectedCourse) {
      loadFromUrl();
    } else {
      // Если курс не выбран, сразу очищаем состояние
      setLessons([]);
      setSelectedLesson(null);
      setIsEditingLesson(false);
      setIsCreatingLesson(false);
      setQuestionAnswers({});
      setCheckedQuestions({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId, selectedCourse]);

  return {
    lessons,
    selectedLesson,
    setSelectedLesson,
    isEditingLesson,
    isCreatingLesson,
    editedLessonName,
    editedLessonDescription,
    editedLessonBlocks,
    editingBlockIndex,
    editingLessonName,
    editingLessonDescription,
    tempLessonName,
    tempLessonDescription,
    draggedLessonId,
    dragOverIndex,
    isDragging,
    questionAnswers,
    checkedQuestions,
    setEditedLessonName,
    setEditedLessonDescription,
    setEditedLessonBlocks,
    setEditingBlockIndex,
    setTempLessonName,
    setTempLessonDescription,
    loadLessons,
    handleSelectLesson,
    handleSaveLesson,
    handleDeleteLesson,
    handleCreateNewLesson,
    handleCancelLesson,
    handleStartEditLessonName,
    handleSaveLessonName,
    handleCancelEditLessonName,
    handleStartEditLessonDescription,
    handleSaveLessonDescription,
    handleCancelEditLessonDescription,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleSingleChoiceSelect,
    handleMultipleChoiceToggle,
    handleCheckAnswer,
  };
};

