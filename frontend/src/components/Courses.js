import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate, useParams } from 'react-router-dom';
import { coursesApi, lessonsApi } from '../services/api';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';

function Courses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [myCourses, setMyCourses] = useState([]);
  const [communityCourses, setCommunityCourses] = useState([]);
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
  const [editingBlockId, setEditingBlockId] = useState(null); // ID редактируемого блока в режиме просмотра
  const [editingBlockData, setEditingBlockData] = useState(null); // Данные редактируемого блока
  const [editingLessonName, setEditingLessonName] = useState(false); // Inline редактирование названия урока
  const [editingLessonDescription, setEditingLessonDescription] = useState(false); // Inline редактирование описания урока
  const [tempLessonName, setTempLessonName] = useState(''); // Временное значение названия урока
  const [tempLessonDescription, setTempLessonDescription] = useState(''); // Временное значение описания урока
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [showGenerateLessonsModal, setShowGenerateLessonsModal] = useState(false);
  const [generateFormData, setGenerateFormData] = useState({
    goal: '',
    start_knowledge: '',
    target_knowledge: '',
    target_audience: '',
    topics: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [draggedLessonId, setDraggedLessonId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [questionAnswers, setQuestionAnswers] = useState({}); // { blockId: answer } для хранения выбранных ответов
  const [checkedQuestions, setCheckedQuestions] = useState({}); // { blockId: { is_correct, correct_answer/answers, explanation } } для проверенных вопросов
  const { isSidebarOpen } = useSidebar();

  // Загрузка списка курсов при монтировании
  useEffect(() => {
    loadCourses();
  }, []);

  // Загрузка курса и урока из URL при монтировании или изменении параметров
  useEffect(() => {
    const loadFromUrl = async () => {
      if (courseId) {
        try {
          const courseIdNum = parseInt(courseId);
          const response = await coursesApi.getById(courseIdNum);
          setSelectedCourse(response.data);
          await loadLessons(courseIdNum);
          
          if (lessonId) {
            const lessonIdNum = parseInt(lessonId);
            const lessonResponse = await lessonsApi.getById(courseIdNum, lessonIdNum);
            setSelectedLesson(lessonResponse.data);
            // Сбрасываем состояния ответов при загрузке нового урока
            setQuestionAnswers({});
            setCheckedQuestions({});
          } else {
            setSelectedLesson(null);
            setQuestionAnswers({});
            setCheckedQuestions({});
          }
        } catch (err) {
          setError('Не удалось загрузить курс или урок');
          console.error('Error loading from URL:', err);
          navigate('/courses');
        }
      } else {
        setSelectedCourse(null);
        setLessons([]);
        setSelectedLesson(null);
      }
    };
    
    loadFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const loadCourses = async (queryText = '') => {
    const normalizedQuery = queryText.trim();
    try {
      setLoading(true);
      if (normalizedQuery) {
        setIsSearching(true);
        setActiveSearchQuery(normalizedQuery);
        const response = await coursesApi.search(normalizedQuery);
        const myList = response.data?.my || [];
        const communityList = response.data?.community || [];
        setMyCourses(myList);
        setCommunityCourses(communityList);
      } else {
        setIsSearching(false);
        setActiveSearchQuery('');
        const [allResponse, myResponse] = await Promise.all([
          coursesApi.getAll(),
          coursesApi.getMy(),
        ]);
        const myList = myResponse.data || [];
        const allList = allResponse.data || [];
        const myIds = new Set(myList.map(course => course.id));
        const communityList = allList.filter(course => !myIds.has(course.id));
        setMyCourses(myList);
        setCommunityCourses(communityList);
      }
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
      const lessonsList = response.data || [];
      // Сортируем уроки по позиции
      const sortedLessons = [...lessonsList].sort((a, b) => a.position - b.position);
      setLessons(sortedLessons);
      setError(null);
    } catch (err) {
      setError('Не удалось загрузить уроки');
      console.error('Error loading lessons:', err);
    }
  };

  const handleSelectCourse = async (courseIdNum) => {
    try {
      const response = await coursesApi.getById(courseIdNum);
      setSelectedCourse(response.data);
      setIsEditingCourse(false);
      setIsCreatingCourse(false);
      setSelectedLesson(null);
      navigate(`/courses/${courseIdNum}`);
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
    navigate('/courses');
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
      setError('Не удалось загрузить урок');
      console.error('Error loading lesson:', err);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    loadCourses(searchQuery);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    loadCourses('');
  };

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    if (value.trim() === '' && isSearching) {
      loadCourses('');
    }
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      setEditedCourseName(selectedCourse.name);
      setEditedCourseDescription(selectedCourse.description || '');
      setIsEditingCourse(true);
    }
  };

  const handleStartEditLessonName = () => {
    if (!isCourseAuthor()) return;
    setTempLessonName(selectedLesson.name);
    setEditingLessonName(true);
  };

  const handleSaveLessonName = async () => {
    if (!selectedCourse || !selectedLesson) return;
    try {
      const response = await lessonsApi.update(selectedCourse.id, selectedLesson.id, {
        name: tempLessonName,
      });
      setSelectedLesson(response.data);
      setEditingLessonName(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить название урока');
      console.error('Error saving lesson name:', err);
    }
  };

  const handleCancelEditLessonName = () => {
    setEditingLessonName(false);
    setTempLessonName('');
  };

  const handleStartEditLessonDescription = () => {
    if (!isCourseAuthor()) return;
    setTempLessonDescription(selectedLesson.description || '');
    setEditingLessonDescription(true);
  };

  const handleSaveLessonDescription = async () => {
    if (!selectedCourse || !selectedLesson) return;
    try {
      const response = await lessonsApi.update(selectedCourse.id, selectedLesson.id, {
        description: tempLessonDescription || null,
      });
      setSelectedLesson(response.data);
      setEditingLessonDescription(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить описание урока');
      console.error('Error saving lesson description:', err);
    }
  };

  const handleCancelEditLessonDescription = () => {
    setEditingLessonDescription(false);
    setTempLessonDescription('');
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
        navigate(`/courses/${response.data.id}`);
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

  const handleOpenGenerateLessonsModal = () => {
    // Проверяем, что курс сохранен
    if (!selectedCourse) {
      setError('Сначала создайте и сохраните курс');
      return;
    }

    // Если курс редактируется, проверяем, что изменения сохранены
    if (isEditingCourse) {
      setError('Пожалуйста, сначала сохраните изменения в курсе');
      return;
    }

    // Проверяем, что название и описание заполнены
    const courseName = selectedCourse.name;
    const courseDescription = selectedCourse.description;

    if (!courseName || !courseName.trim()) {
      setError('Пожалуйста, заполните название курса перед генерацией уроков');
      return;
    }

    if (!courseDescription || !courseDescription.trim()) {
      setError('Пожалуйста, заполните описание курса перед генерацией уроков');
      return;
    }

    // Проверяем, есть ли уже уроки
    if (lessons.length > 0) {
      if (!window.confirm('В курсе уже есть уроки. Сгенерировать новый план? Существующие уроки будут удалены.')) {
        return;
      }
    }

    // Сбрасываем форму
    setGenerateFormData({
      goal: '',
      start_knowledge: '',
      target_knowledge: '',
      target_audience: '',
      topics: ''
    });
    setShowGenerateLessonsModal(true);
    setError(null);
  };

  const handleGenerateLessons = async () => {
    if (!selectedCourse) {
      setError('Сначала сохраните курс');
      return;
    }

    try {
      setIsGeneratingLessons(true);
      setError(null);

      // Подготавливаем данные для запроса
      const requestData = {
        goal: generateFormData.goal.trim() || null,
        start_knowledge: generateFormData.start_knowledge.trim() || null,
        target_knowledge: generateFormData.target_knowledge.trim() || null,
        target_audience: generateFormData.target_audience.trim() || null,
        topics: generateFormData.topics.trim() 
          ? generateFormData.topics.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : null
      };

      const response = await coursesApi.generateLessons(selectedCourse.id, requestData);
      
      // Обновляем список уроков
      await loadLessons(selectedCourse.id);
      
      // Закрываем модальное окно
      setShowGenerateLessonsModal(false);
      setGenerateFormData({
        goal: '',
        start_knowledge: '',
        target_knowledge: '',
        target_audience: '',
        topics: ''
      });
      
      alert(`Успешно сгенерировано ${response.data.lessons_count} уроков!`);
      setIsGeneratingLessons(false);
    } catch (err) {
      setIsGeneratingLessons(false);
      const errorMessage = err.response?.data?.detail || 'Не удалось сгенерировать уроки';
      setError(errorMessage);
      console.error('Error generating lessons:', err);
    }
  };

  const prepareBlocksForApi = (blocks) => {
    // Сохраняем block_id для существующих блоков, чтобы бэкенд мог их обновить вместо пересоздания
    return blocks.map((block) => {
      const { block_id, ...blockData } = block;
      // Если есть block_id, сохраняем его для обновления существующего блока
      if (block_id) {
        return { ...blockData, block_id };
      }
      // Для новых блоков block_id не нужен, бэкенд создаст новый
      return blockData;
    });
  };

  const handleSaveLesson = async () => {
    if (!selectedCourse) return;
    try {
      // Подготавливаем блоки для отправки (убираем block_id)
      const blocksToSend = prepareBlocksForApi(editedLessonBlocks);
      
      // Создаем новый урок с блоками
      const response = await lessonsApi.create(selectedCourse.id, {
        course_id: selectedCourse.id,
        position: lessons.length,
        name: editedLessonName,
        description: editedLessonDescription || null,
        blocks: blocksToSend,
      });
      setSelectedLesson(response.data);
      await loadLessons(selectedCourse.id);
      setIsCreatingLesson(false);
      navigate(`/courses/${selectedCourse.id}/lessons/${response.data.id}`);
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

  // Функции для работы с отдельными блоками в режиме просмотра
  const handleEditBlock = (block) => {
    if (!block.block_id) {
      setError('Блок еще не сохранен. Сохраните урок, чтобы редактировать блоки отдельно.');
      return;
    }
    setEditingBlockId(block.block_id);
    setEditingBlockData({ ...block });
  };

  const handleCancelBlockEdit = () => {
    setEditingBlockId(null);
    setEditingBlockData(null);
  };

  const handleSaveBlock = async () => {
    if (!selectedCourse || !selectedLesson || !editingBlockId || !editingBlockData) return;
    
    try {
      const response = await lessonsApi.updateBlock(
        selectedCourse.id,
        selectedLesson.id,
        editingBlockId,
        editingBlockData
      );
      setSelectedLesson(response.data);
      setEditingBlockId(null);
      setEditingBlockData(null);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить блок');
      console.error('Error saving block:', err);
    }
  };

  const handleUpdateBlockData = (field, value) => {
    setEditingBlockData({ ...editingBlockData, [field]: value });
  };

  const handleUpdateBlockOptions = (optIndex, value) => {
    const newOptions = [...(editingBlockData.options || [])];
    newOptions[optIndex] = value;
    setEditingBlockData({ ...editingBlockData, options: newOptions });
  };

  const handleAddBlockOption = () => {
    const newOptions = [...(editingBlockData.options || []), ''];
    setEditingBlockData({ ...editingBlockData, options: newOptions });
  };

  const handleAddBlock = async (type) => {
    if (!selectedCourse || !selectedLesson) return;
    
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
    
    try {
      const response = await lessonsApi.addBlock(selectedCourse.id, selectedLesson.id, newBlock);
      setSelectedLesson(response.data);
      // Автоматически открываем редактирование нового блока
      const newBlockId = response.data.blocks[response.data.blocks.length - 1]?.block_id;
      if (newBlockId) {
        setEditingBlockId(newBlockId);
        setEditingBlockData({ ...newBlock, block_id: newBlockId });
      }
      setError(null);
    } catch (err) {
      setError('Не удалось добавить блок');
      console.error('Error adding block:', err);
    }
  };

  const handleRemoveBlockOption = (optIndex) => {
    const newOptions = (editingBlockData.options || []).filter((_, i) => i !== optIndex);
    let updatedData = { ...editingBlockData, options: newOptions };
    
    // Обновляем correct_answer/correct_answers в зависимости от типа блока
    if (editingBlockData.type === 'single_choice') {
      if (editingBlockData.correct_answer === optIndex) {
        updatedData.correct_answer = 0;
      } else if (editingBlockData.correct_answer > optIndex) {
        updatedData.correct_answer = editingBlockData.correct_answer - 1;
      }
    } else if (editingBlockData.type === 'multiple_choice') {
      updatedData.correct_answers = (editingBlockData.correct_answers || [])
        .filter(i => i !== optIndex)
        .map(i => i > optIndex ? i - 1 : i);
    }
    
    setEditingBlockData(updatedData);
  };

  // Drag and drop для блоков
  const handleDragStartBlock = (e, blockId) => {
    if (!isCourseAuthor() || !blockId) return;
    // Не позволяем перетаскивать блок, который сейчас редактируется
    if (editingBlockId === blockId) {
      e.preventDefault();
      return;
    }
    setIsDraggingBlock(true);
    setDraggedBlockId(blockId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target);
    e.target.style.opacity = '0.5';
  };

  const handleDragEndBlock = (e) => {
    e.target.style.opacity = '1';
    setDraggedBlockId(null);
    setDragOverBlockIndex(null);
    setTimeout(() => setIsDraggingBlock(false), 100);
  };

  const handleDragOverBlock = (e, index) => {
    if (!isCourseAuthor() || draggedBlockId === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    const draggedIndex = selectedLesson.blocks.findIndex(b => b.block_id === draggedBlockId);
    if (draggedIndex === -1) return;
    
    // Определяем, куда вставлять - выше или ниже элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;
    
    // Если перетаскиваем вниз, вставляем после элемента, если вверх - перед
    if (draggedIndex < index) {
      // Перетаскиваем вниз - вставляем после текущего элемента
      setDragOverBlockIndex(index);
    } else if (draggedIndex > index) {
      // Перетаскиваем вверх - вставляем перед текущим элементом
      setDragOverBlockIndex(index);
    } else {
      setDragOverBlockIndex(null);
    }
  };

  const handleDragLeaveBlock = () => {
    setDragOverBlockIndex(null);
  };

  const handleDropBlock = async (e, targetIndex) => {
    if (!isCourseAuthor() || draggedBlockId === null || !selectedCourse || !selectedLesson) return;
    e.preventDefault();
    e.stopPropagation();
    
    const draggedBlock = selectedLesson.blocks.find(b => b.block_id === draggedBlockId);
    if (!draggedBlock) return;

    const currentIndex = selectedLesson.blocks.findIndex(b => b.block_id === draggedBlockId);
    if (currentIndex === targetIndex) {
      setDraggedBlockId(null);
      setDragOverBlockIndex(null);
      return;
    }

    try {
      // Обновляем позиции локально для мгновенного отклика
      const sortedBlocks = [...selectedLesson.blocks];
      const [removed] = sortedBlocks.splice(currentIndex, 1);
      
      // Вычисляем правильную позицию для вставки
      // Если перетаскиваем вниз (currentIndex < targetIndex), 
      // после удаления targetIndex уменьшается на 1, поэтому используем targetIndex
      // Если перетаскиваем вверх (currentIndex > targetIndex), 
      // targetIndex не меняется, используем targetIndex
      let insertIndex;
      if (currentIndex < targetIndex) {
        // Перетаскиваем вниз - вставляем после целевого элемента
        insertIndex = targetIndex; // После удаления это будет targetIndex - 1, но мы хотим вставить после, поэтому targetIndex
      } else {
        // Перетаскиваем вверх - вставляем на позицию целевого элемента
        insertIndex = targetIndex;
      }
      
      sortedBlocks.splice(insertIndex, 0, removed);
      
      // Обновляем позиции в отсортированном порядке
      const updatedBlocks = sortedBlocks.map((block, index) => ({
        ...block,
        position: index
      }));
      
      // Находим новую позицию перетащенного блока в отсортированном массиве
      const newPosition = updatedBlocks.findIndex(b => b.block_id === draggedBlockId);
      
      setSelectedLesson({ ...selectedLesson, blocks: updatedBlocks });

      // Обновляем позицию перетащенного блока на сервере
      await lessonsApi.reorderBlock(selectedCourse.id, selectedLesson.id, draggedBlockId, newPosition);
      
      // Перезагружаем урок для синхронизации с сервером
      const lessonResponse = await lessonsApi.getById(selectedCourse.id, selectedLesson.id);
      setSelectedLesson(lessonResponse.data);
      
      setError(null);
    } catch (err) {
      // В случае ошибки перезагружаем урок
      const lessonResponse = await lessonsApi.getById(selectedCourse.id, selectedLesson.id);
      setSelectedLesson(lessonResponse.data);
      setError('Не удалось изменить позицию блока');
      console.error('Error reordering block:', err);
    } finally {
      setDraggedBlockId(null);
      setDragOverBlockIndex(null);
    }
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
    if (selectedLesson && selectedCourse && window.confirm('Вы уверены, что хотите удалить этот урок?')) {
      try {
        await lessonsApi.delete(selectedCourse.id, selectedLesson.id);
        setSelectedLesson(null);
        await loadLessons(selectedCourse.id);
        navigate(`/courses/${selectedCourse.id}`);
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

  // Проверка, является ли текущий пользователь автором курса
  const isCourseAuthor = () => {
    return selectedCourse && user && selectedCourse.author_id === user.id;
  };

  // Обработчик выбора ответа для single_choice
  const handleSingleChoiceSelect = (blockId, answerIndex) => {
    setQuestionAnswers(prev => ({
      ...prev,
      [blockId]: answerIndex
    }));
  };

  // Обработчик выбора ответа для multiple_choice
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

  // Обработчик проверки ответа
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

  // Обработчики для drag and drop
  const handleDragStart = (e, lessonId) => {
    if (!isCourseAuthor()) return;
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
    // Небольшая задержка, чтобы onClick не сработал после dragEnd
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleDragOver = (e, index) => {
    if (!isCourseAuthor() || draggedLessonId === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const draggedIndex = lessons.findIndex(l => l.id === draggedLessonId);
    if (draggedIndex === -1) return;
    
    // Определяем, куда вставлять - выше или ниже элемента
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;
    
    // Если перетаскиваем вниз, вставляем после элемента, если вверх - перед
    if (draggedIndex < index) {
      // Перетаскиваем вниз - вставляем после текущего элемента
      setDragOverIndex(index);
    } else if (draggedIndex > index) {
      // Перетаскиваем вверх - вставляем перед текущим элементом
      setDragOverIndex(index);
    } else {
      setDragOverIndex(null);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetIndex) => {
    if (!isCourseAuthor() || draggedLessonId === null) return;
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
      // Обновляем позиции локально для мгновенного отклика
      const sortedLessons = [...lessons];
      const [removed] = sortedLessons.splice(currentIndex, 1);
      
      // Вычисляем правильную позицию для вставки
      // Если перетаскиваем вниз (currentIndex < targetIndex), 
      // после удаления targetIndex уменьшается на 1, поэтому используем targetIndex
      // Если перетаскиваем вверх (currentIndex > targetIndex), 
      // targetIndex не меняется, используем targetIndex
      let insertIndex;
      if (currentIndex < targetIndex) {
        // Перетаскиваем вниз - вставляем после целевого элемента
        insertIndex = targetIndex; // После удаления это будет targetIndex - 1, но мы хотим вставить после, поэтому targetIndex
      } else {
        // Перетаскиваем вверх - вставляем на позицию целевого элемента
        insertIndex = targetIndex;
      }
      
      sortedLessons.splice(insertIndex, 0, removed);
      
      // Обновляем позиции в отсортированном порядке
      const updatedLessons = sortedLessons.map((lesson, index) => ({
        ...lesson,
        position: index
      }));
      
      setLessons(updatedLessons);

      // Обновляем позицию перетащенного урока на сервере
      await lessonsApi.reorder(selectedCourse.id, draggedLessonId, insertIndex);
      
      // Перезагружаем уроки для синхронизации с сервером
      await loadLessons(selectedCourse.id);
      
      setError(null);
    } catch (err) {
      // В случае ошибки перезагружаем уроки
      await loadLessons(selectedCourse.id);
      setError('Не удалось изменить позицию урока');
      console.error('Error reordering lesson:', err);
    } finally {
      setDraggedLessonId(null);
      setDragOverIndex(null);
    }
  };

  return (
    <>
      <Sidebar />
      <div className={`courses-container ${!isSidebarOpen ? 'courses-container-expanded' : ''}`}>
        {/* Левая панель со списком уроков */}
        <div className="lessons-panel" style={{ display: selectedCourse ? 'flex' : 'none' }}>
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
            {isCourseAuthor() && (
              <button onClick={handleCreateNewLesson} className="courses-create-btn">
                + Создать урок
              </button>
            )}
          </div>
          
          {lessons.length === 0 && (
            <div className="courses-empty">
              <p>В этом курсе пока нет уроков</p>
              {isCourseAuthor() && (
                <button onClick={handleCreateNewLesson} className="courses-create-btn-large">
                  Создать первый урок
                </button>
              )}
            </div>
          )}
          
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`courses-item ${selectedLesson?.id === lesson.id ? 'courses-item-active' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              onClick={() => {
                if (!isDragging) {
                  handleSelectLesson(lesson.id);
                }
              }}
              draggable={isCourseAuthor()}
              onDragStart={(e) => handleDragStart(e, lesson.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              style={{
                cursor: isCourseAuthor() ? 'grab' : 'pointer',
                opacity: draggedLessonId === lesson.id ? 0.5 : 1
              }}
            >
              {isCourseAuthor() && (
                <div 
                  style={{
                    position: 'absolute',
                    left: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '18px',
                    color: '#666',
                    userSelect: 'none',
                    pointerEvents: 'none'
                  }}
                >
                  ⋮⋮
                </div>
              )}
              <div className="courses-item-title" style={{ marginLeft: isCourseAuthor() ? '24px' : '0' }}>
                {lesson.name}
              </div>
              <div className="courses-item-description">
                {lesson.description ? (
                  <ReactMarkdown>{lesson.description}</ReactMarkdown>
                ) : (
                  <span>Без описания</span>
                )}
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

          {/* Карточки курсов */}
          {!selectedCourse && !isCreatingCourse && !isEditingCourse && (
            <div className="courses-library">
              <div className="courses-search-bar">
                <form className="courses-search-form" onSubmit={handleSearchSubmit}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Поиск по названиям и описаниям курсов"
                    className="courses-search-input"
                  />
                  {isSearching && (
                    <button
                      type="button"
                      className="courses-search-clear"
                      onClick={handleSearchClear}
                    >
                      Очистить
                    </button>
                  )}
                  <button type="submit" className="courses-search-btn">
                    Поиск
                  </button>
                </form>
                {isSearching && activeSearchQuery && (
                  <p className="courses-search-hint">
                    Показаны результаты по запросу "{activeSearchQuery}"
                  </p>
                )}
              </div>
              <section className="courses-section">
                <div className="courses-section-header">
                  <div>
                    <h2>Мои курсы</h2>
                    <p>Создавайте и развивайте собственные программы обучения</p>
                  </div>
                  <button onClick={handleCreateNewCourse} className="courses-create-btn">
                    + Создать курс
                  </button>
                </div>
                {loading ? (
                  <div className="courses-loading">Загрузка...</div>
                ) : myCourses.length === 0 ? (
                  <div className="courses-empty">
                    <p>{isSearching ? 'По запросу ничего не найдено' : 'У вас пока нет курсов'}</p>
                    {!isSearching && (
                      <button onClick={handleCreateNewCourse} className="courses-create-btn-large">
                        Создать первый курс
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="courses-card-grid">
                    {myCourses.map(course => (
                      <div
                        key={course.id}
                        className="course-card"
                        onClick={() => handleSelectCourse(course.id)}
                      >
                        <div className="course-card-meta">
                          <span className="course-card-badge course-card-badge-mine">Мой курс</span>
                          <span>{formatDate(course.created_at) || '—'}</span>
                        </div>
                        <h3 className="course-card-title">{course.name}</h3>
                        <div className="course-card-description">
                          {course.description ? (
                            <ReactMarkdown>{course.description}</ReactMarkdown>
                          ) : (
                            <p>Без описания</p>
                          )}
                        </div>
                        <div className="course-card-footer">
                          <button
                            className="courses-btn courses-btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCourse(course.id);
                            }}
                          >
                            Открыть
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="courses-section">
                <div className="courses-section-header">
                  <div>
                    <h2>Все курсы</h2>
                    <p>Курсы, созданные другими пользователями платформы</p>
                  </div>
                </div>
                {loading ? (
                  <div className="courses-loading">Загрузка...</div>
                ) : communityCourses.length === 0 ? (
                  <div className="courses-empty">
                    <p>{isSearching ? 'По запросу ничего не найдено' : 'Пока нет курсов от других пользователей'}</p>
                  </div>
                ) : (
                  <div className="courses-card-grid">
                    {communityCourses.map(course => (
                      <div
                        key={course.id}
                        className="course-card"
                        onClick={() => handleSelectCourse(course.id)}
                      >
                        <div className="course-card-meta">
                          <span className="course-card-badge">Курс сообщества</span>
                          <span>{formatDate(course.created_at) || '—'}</span>
                        </div>
                        <h3 className="course-card-title">{course.name}</h3>
                        <div className="course-card-description">
                          {course.description ? (
                            <ReactMarkdown>{course.description}</ReactMarkdown>
                          ) : (
                            <p>Без описания</p>
                          )}
                        </div>
                        <div className="course-card-footer">
                          <button
                            className="courses-btn courses-btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectCourse(course.id);
                            }}
                          >
                            Подробнее
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
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
                {!isCreatingCourse && selectedCourse && (
                  <div className="courses-form-group">
                    <button 
                      onClick={handleOpenGenerateLessonsModal} 
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
          )}

          {/* Просмотр урока */}
          {selectedLesson && !isEditingLesson && (
            <div className="courses-view">
              <div className="courses-view-header">
                <div>
                  {editingLessonName ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={tempLessonName}
                        onChange={(e) => setTempLessonName(e.target.value)}
                        className="courses-input"
                        style={{ fontSize: '2em', fontWeight: 'bold', padding: '8px' }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveLessonName();
                          } else if (e.key === 'Escape') {
                            handleCancelEditLessonName();
                          }
                        }}
                        autoFocus
                      />
                      <button onClick={handleSaveLessonName} className="courses-btn courses-btn-primary" style={{ padding: '8px 16px' }}>
                        ✓
                      </button>
                      <button onClick={handleCancelEditLessonName} className="courses-btn courses-btn-secondary" style={{ padding: '8px 16px' }}>
                        ✕
                      </button>
                    </div>
                  ) : (
                    <h1 
                      onClick={handleStartEditLessonName}
                      style={{ 
                        cursor: isCourseAuthor() ? 'pointer' : 'default',
                        userSelect: 'none'
                      }}
                      title={isCourseAuthor() ? 'Нажмите для редактирования' : ''}
                    >
                      {selectedLesson.name}
                    </h1>
                  )}
                  <p className="courses-view-meta">
                    Позиция: {selectedLesson.position + 1} • Создан: {formatDate(selectedLesson.created_at)}
                    {selectedLesson.updated_at && (
                      <> • Обновлен: {formatDate(selectedLesson.updated_at)}</>
                    )}
                  </p>
                </div>
                {isCourseAuthor() && (
                  <div className="courses-view-actions">
                    <button onClick={handleDeleteLesson} className="courses-btn courses-btn-danger">
                      Удалить
                    </button>
                  </div>
                )}
              </div>
              <div className="courses-view-content">
                <h3>Описание</h3>
                {editingLessonDescription ? (
                  <div>
                    <textarea
                      value={tempLessonDescription}
                      onChange={(e) => setTempLessonDescription(e.target.value)}
                      className="courses-textarea"
                      rows="5"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleCancelEditLessonDescription();
                        }
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <button onClick={handleSaveLessonDescription} className="courses-btn courses-btn-primary">
                        Сохранить
                      </button>
                      <button onClick={handleCancelEditLessonDescription} className="courses-btn courses-btn-secondary">
                        Отменить
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={handleStartEditLessonDescription}
                    style={{
                      cursor: isCourseAuthor() ? 'pointer' : 'default',
                      padding: '8px',
                      borderRadius: '4px',
                      border: isCourseAuthor() ? '1px dashed transparent' : 'none',
                      minHeight: '40px'
                    }}
                    onMouseEnter={(e) => {
                      if (isCourseAuthor()) {
                        e.currentTarget.style.borderColor = '#ccc';
                        e.currentTarget.style.backgroundColor = '#f9f9f9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isCourseAuthor()) {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    title={isCourseAuthor() ? 'Нажмите для редактирования' : ''}
                  >
                    {selectedLesson.description ? (
                      <ReactMarkdown>{selectedLesson.description}</ReactMarkdown>
                    ) : (
                      <p style={{ color: '#999', fontStyle: 'italic' }}>Нажмите для добавления описания</p>
                    )}
                  </div>
                )}
                {selectedLesson.blocks && selectedLesson.blocks.length > 0 && (
                  <>
                    <h3>Содержимое урока</h3>
                    {isCourseAuthor() && (
                      <div className="lesson-blocks-add-menu" style={{ marginBottom: '16px' }}>
                        <button className="courses-btn courses-btn-secondary" onClick={() => handleAddBlock('theory')}>
                          + Теория
                        </button>
                        <button className="courses-btn courses-btn-secondary" onClick={() => handleAddBlock('code')}>
                          + Код
                        </button>
                        <button className="courses-btn courses-btn-secondary" onClick={() => handleAddBlock('note')}>
                          + Заметка
                        </button>
                        <button className="courses-btn courses-btn-secondary" onClick={() => handleAddBlock('single_choice')}>
                          + Вопрос (один ответ)
                        </button>
                        <button className="courses-btn courses-btn-secondary" onClick={() => handleAddBlock('multiple_choice')}>
                          + Вопрос (несколько ответов)
                        </button>
                      </div>
                    )}
                    <div className="lesson-blocks">
                      {selectedLesson.blocks.map((block, index) => {
                        const canDrag = isCourseAuthor() && block.block_id && editingBlockId !== block.block_id;
                        return (
                        <div 
                          key={block.block_id || index} 
                          className={`lesson-block-view ${dragOverBlockIndex === index ? 'drag-over' : ''}`}
                          draggable={canDrag}
                          onDragStart={(e) => {
                            if (canDrag && block.block_id) {
                              handleDragStartBlock(e, block.block_id);
                            }
                          }}
                          onDragEnd={handleDragEndBlock}
                          onDragOver={(e) => {
                            if (isCourseAuthor() && draggedBlockId) {
                              handleDragOverBlock(e, index);
                            }
                          }}
                          onDragLeave={handleDragLeaveBlock}
                          onDrop={(e) => {
                            if (isCourseAuthor() && draggedBlockId) {
                              handleDropBlock(e, index);
                            }
                          }}
                          style={{
                            cursor: canDrag ? 'grab' : 'default',
                            opacity: draggedBlockId === block.block_id ? 0.5 : 1,
                            position: 'relative'
                          }}
                        >
                          {isCourseAuthor() && block.block_id && editingBlockId !== block.block_id && (
                            <div 
                              style={{
                                position: 'absolute',
                                left: '8px',
                                top: '8px',
                                fontSize: '18px',
                                color: '#666',
                                userSelect: 'none',
                                pointerEvents: 'none',
                                zIndex: 1
                              }}
                            >
                              ⋮⋮
                            </div>
                          )}
                          {editingBlockId === block.block_id ? (
                            <div className="lesson-block-edit-form" style={{ marginLeft: isCourseAuthor() ? '24px' : '0' }}>
                              {editingBlockData.type === 'theory' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Заголовок</label>
                                    <input
                                      type="text"
                                      value={editingBlockData.title || ''}
                                      onChange={(e) => handleUpdateBlockData('title', e.target.value)}
                                      className="courses-input"
                                      placeholder="Заголовок блока"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Содержимое (Markdown)</label>
                                    <textarea
                                      value={editingBlockData.content || ''}
                                      onChange={(e) => handleUpdateBlockData('content', e.target.value)}
                                      className="courses-textarea"
                                      rows="8"
                                      placeholder="Теоретический материал в формате Markdown"
                                    />
                                  </div>
                                </>
                              )}
                              {editingBlockData.type === 'code' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Заголовок (необязательно)</label>
                                    <input
                                      type="text"
                                      value={editingBlockData.title || ''}
                                      onChange={(e) => handleUpdateBlockData('title', e.target.value)}
                                      className="courses-input"
                                      placeholder="Заголовок блока кода"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Язык программирования</label>
                                    <select
                                      value={editingBlockData.language || 'python'}
                                      onChange={(e) => handleUpdateBlockData('language', e.target.value)}
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
                                      value={editingBlockData.code || ''}
                                      onChange={(e) => handleUpdateBlockData('code', e.target.value)}
                                      className="courses-textarea"
                                      rows="10"
                                      placeholder="Введите код"
                                      style={{ fontFamily: 'monospace' }}
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={editingBlockData.explanation || ''}
                                      onChange={(e) => handleUpdateBlockData('explanation', e.target.value)}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к коду"
                                    />
                                  </div>
                                </>
                              )}
                              {editingBlockData.type === 'note' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Тип заметки</label>
                                    <select
                                      value={editingBlockData.note_type || 'info'}
                                      onChange={(e) => handleUpdateBlockData('note_type', e.target.value)}
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
                                      value={editingBlockData.content || ''}
                                      onChange={(e) => handleUpdateBlockData('content', e.target.value)}
                                      className="courses-textarea"
                                      rows="5"
                                      placeholder="Текст заметки"
                                    />
                                  </div>
                                </>
                              )}
                              {editingBlockData.type === 'single_choice' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Вопрос</label>
                                    <input
                                      type="text"
                                      value={editingBlockData.question || ''}
                                      onChange={(e) => handleUpdateBlockData('question', e.target.value)}
                                      className="courses-input"
                                      placeholder="Формулировка вопроса"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Варианты ответов</label>
                                    {(editingBlockData.options || ['', '']).map((option, optIndex) => (
                                      <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                          type="radio"
                                          name={`correct-${editingBlockId}`}
                                          checked={editingBlockData.correct_answer === optIndex}
                                          onChange={() => handleUpdateBlockData('correct_answer', optIndex)}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => handleUpdateBlockOptions(optIndex, e.target.value)}
                                          className="courses-input"
                                          placeholder={`Вариант ${optIndex + 1}`}
                                          style={{ flex: 1 }}
                                        />
                                        {(editingBlockData.options || []).length > 2 && (
                                          <button
                                            onClick={() => handleRemoveBlockOption(optIndex)}
                                            className="courses-btn courses-btn-danger"
                                            style={{ padding: '4px 8px' }}
                                          >
                                            Удалить
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={handleAddBlockOption}
                                      className="courses-btn courses-btn-secondary"
                                      style={{ marginTop: '8px' }}
                                    >
                                      + Добавить вариант
                                    </button>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={editingBlockData.explanation || ''}
                                      onChange={(e) => handleUpdateBlockData('explanation', e.target.value)}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к правильному ответу"
                                    />
                                  </div>
                                </>
                              )}
                              {editingBlockData.type === 'multiple_choice' && (
                                <>
                                  <div className="courses-form-group">
                                    <label>Вопрос</label>
                                    <input
                                      type="text"
                                      value={editingBlockData.question || ''}
                                      onChange={(e) => handleUpdateBlockData('question', e.target.value)}
                                      className="courses-input"
                                      placeholder="Формулировка вопроса"
                                    />
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Варианты ответов</label>
                                    {(editingBlockData.options || ['', '']).map((option, optIndex) => (
                                      <div key={optIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                        <input
                                          type="checkbox"
                                          checked={(editingBlockData.correct_answers || []).includes(optIndex)}
                                          onChange={(e) => {
                                            const currentAnswers = editingBlockData.correct_answers || [];
                                            const newAnswers = e.target.checked
                                              ? [...currentAnswers, optIndex]
                                              : currentAnswers.filter(i => i !== optIndex);
                                            handleUpdateBlockData('correct_answers', newAnswers);
                                          }}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => handleUpdateBlockOptions(optIndex, e.target.value)}
                                          className="courses-input"
                                          placeholder={`Вариант ${optIndex + 1}`}
                                          style={{ flex: 1 }}
                                        />
                                        {(editingBlockData.options || []).length > 2 && (
                                          <button
                                            onClick={() => handleRemoveBlockOption(optIndex)}
                                            className="courses-btn courses-btn-danger"
                                            style={{ padding: '4px 8px' }}
                                          >
                                            Удалить
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                    <button
                                      onClick={handleAddBlockOption}
                                      className="courses-btn courses-btn-secondary"
                                      style={{ marginTop: '8px' }}
                                    >
                                      + Добавить вариант
                                    </button>
                                  </div>
                                  <div className="courses-form-group">
                                    <label>Пояснение (необязательно)</label>
                                    <textarea
                                      value={editingBlockData.explanation || ''}
                                      onChange={(e) => handleUpdateBlockData('explanation', e.target.value)}
                                      className="courses-textarea"
                                      rows="3"
                                      placeholder="Пояснение к правильным ответам"
                                    />
                                  </div>
                                </>
                              )}
                              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                <button onClick={handleSaveBlock} className="courses-btn courses-btn-primary">
                                  Сохранить
                                </button>
                                <button onClick={handleCancelBlockEdit} className="courses-btn courses-btn-secondary">
                                  Отменить
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ marginLeft: isCourseAuthor() ? '24px' : '0' }}>
                              {isCourseAuthor() && block.block_id && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px' }}>
                                  <button 
                                    onClick={() => handleEditBlock(block)} 
                                    className="courses-btn courses-btn-secondary"
                                    style={{ padding: '4px 12px', fontSize: '0.9em' }}
                                  >
                                    ✎ Редактировать
                                  </button>
                                </div>
                              )}
                              {block.type === 'theory' && (
                            <div>
                              <div className="lesson-block-type-badge">📖 Теория</div>
                              {block.title && <h4 style={{ marginTop: '12px', marginBottom: '8px' }}>{block.title}</h4>}
                              <div className="lesson-block-content">
                                {block.content ? (
                                  <ReactMarkdown>{block.content}</ReactMarkdown>
                                ) : (
                                  <p>Пусто</p>
                                )}
                              </div>
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
                                  <strong>Пояснение:</strong>
                                  <ReactMarkdown>{block.explanation}</ReactMarkdown>
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
                              <div className="lesson-block-content" style={{ marginTop: '12px' }}>
                                {block.content ? (
                                  <ReactMarkdown>{block.content}</ReactMarkdown>
                                ) : (
                                  <p>Пусто</p>
                                )}
                              </div>
                            </div>
                          )}
                          {block.type === 'single_choice' && (
                            <div>
                              <div className="lesson-block-type-badge">❓ Вопрос (один ответ)</div>
                              <h4 style={{ marginTop: '12px', marginBottom: '12px' }}>{block.question || 'Вопрос не указан'}</h4>
                              {isCourseAuthor() ? (
                                // Для автора показываем правильные ответы
                                <>
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
                                      <strong>Пояснение:</strong>
                                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Для не-автора показываем интерактивный вопрос
                                <>
                                  <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {(block.options || []).map((opt, optIdx) => {
                                      const selectedAnswer = questionAnswers[block.block_id];
                                      const checkedResult = checkedQuestions[block.block_id];
                                      const isSelected = selectedAnswer === optIdx;
                                      // Показываем правильный ответ только после успешной проверки в текущей сессии
                                      const showCorrect = checkedResult?.is_correct && checkedResult?.correct_answer === optIdx;
                                      
                                      return (
                                        <li 
                                          key={optIdx} 
                                          onClick={() => !checkedResult?.is_correct && handleSingleChoiceSelect(block.block_id, optIdx)}
                                          style={{ 
                                            padding: '8px 12px', 
                                            marginBottom: '8px', 
                                            background: showCorrect ? '#d1fae5' : isSelected ? '#e0e7ff' : '#f3f4f6',
                                            border: showCorrect ? '2px solid #10b981' : isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: checkedResult?.is_correct ? 'default' : 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                        >
                                          <span>
                                            {showCorrect ? '✓' : isSelected ? '●' : '○'}
                                          </span>
                                          <span>{opt || `Вариант ${optIdx + 1}`}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  {!checkedQuestions[block.block_id]?.is_correct && (
                                    <button
                                      onClick={() => handleCheckAnswer(block.block_id)}
                                      disabled={questionAnswers[block.block_id] === undefined}
                                      style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        background: questionAnswers[block.block_id] !== undefined ? '#6366f1' : '#9ca3af',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: questionAnswers[block.block_id] !== undefined ? 'pointer' : 'not-allowed',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Проверить ответ
                                    </button>
                                  )}
                                  {checkedQuestions[block.block_id]?.is_correct && checkedQuestions[block.block_id]?.explanation && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
                                      <strong>Пояснение:</strong>
                                      <ReactMarkdown>{checkedQuestions[block.block_id].explanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                          {block.type === 'multiple_choice' && (
                            <div>
                              <div className="lesson-block-type-badge">❓ Вопрос (несколько ответов)</div>
                              <h4 style={{ marginTop: '12px', marginBottom: '12px' }}>{block.question || 'Вопрос не указан'}</h4>
                              {isCourseAuthor() ? (
                                // Для автора показываем правильные ответы
                                <>
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
                                      <strong>Пояснение:</strong>
                                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </>
                              ) : (
                                // Для не-автора показываем интерактивный вопрос
                                <>
                                  <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {(block.options || []).map((opt, optIdx) => {
                                      const selectedAnswers = questionAnswers[block.block_id] || [];
                                      const checkedResult = checkedQuestions[block.block_id];
                                      const isSelected = selectedAnswers.includes(optIdx);
                                      // Показываем правильные ответы только после успешной проверки в текущей сессии
                                      const showCorrect = checkedResult?.is_correct && (checkedResult?.correct_answers || []).includes(optIdx);
                                      
                                      return (
                                        <li 
                                          key={optIdx} 
                                          onClick={() => !checkedResult?.is_correct && handleMultipleChoiceToggle(block.block_id, optIdx)}
                                          style={{ 
                                            padding: '8px 12px', 
                                            marginBottom: '8px', 
                                            background: showCorrect ? '#d1fae5' : isSelected ? '#e0e7ff' : '#f3f4f6',
                                            border: showCorrect ? '2px solid #10b981' : isSelected ? '2px solid #6366f1' : '1px solid #e5e7eb',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: checkedResult?.is_correct ? 'default' : 'pointer',
                                            transition: 'all 0.2s'
                                          }}
                                        >
                                          <span>
                                            {showCorrect ? '✓' : isSelected ? '☑' : '☐'}
                                          </span>
                                          <span>{opt || `Вариант ${optIdx + 1}`}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                  {!checkedQuestions[block.block_id]?.is_correct && (
                                    <button
                                      onClick={() => handleCheckAnswer(block.block_id)}
                                      disabled={!questionAnswers[block.block_id] || questionAnswers[block.block_id].length === 0}
                                      style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        background: (questionAnswers[block.block_id] && questionAnswers[block.block_id].length > 0) ? '#6366f1' : '#9ca3af',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: (questionAnswers[block.block_id] && questionAnswers[block.block_id].length > 0) ? 'pointer' : 'not-allowed',
                                        fontWeight: '500'
                                      }}
                                    >
                                      Проверить ответ
                                    </button>
                                  )}
                                  {checkedQuestions[block.block_id]?.is_correct && checkedQuestions[block.block_id]?.explanation && (
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#eff6ff', borderRadius: '4px', fontStyle: 'italic' }}>
                                      <strong>Пояснение:</strong>
                                      <ReactMarkdown>{checkedQuestions[block.block_id].explanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Создание нового урока */}
          {isEditingLesson && isCreatingLesson && (
            <div className="courses-edit">
              <div className="courses-edit-header">
                <h2>Создание нового урока</h2>
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

                {/* Редактор блоков - только для создания нового урока */}
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
                        <div key={block.block_id || `new-${index}`} className={`lesson-block-editor ${editingBlockIndex === index ? 'editing' : ''}`}>
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
                                  <div style={{ marginTop: '8px' }}>
                                    {block.content ? (
                                      <ReactMarkdown>{block.content}</ReactMarkdown>
                                    ) : (
                                      <p>Пусто</p>
                                    )}
                                  </div>
                                </div>
                              )}
                              {block.type === 'code' && (
                                <div>
                                  {block.title && <strong>{block.title}</strong>}
                                  <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflow: 'auto' }}>
                                    <code>{block.code || 'Пусто'}</code>
                                  </pre>
                                  {block.explanation && (
                                    <div style={{ marginTop: '8px' }}>
                                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                              )}
                              {block.type === 'note' && (
                                <div style={{ padding: '12px', background: '#f0f0f0', borderRadius: '4px' }}>
                                  <strong>{block.note_type === 'info' ? 'ℹ️ Информация' : block.note_type === 'warning' ? '⚠️ Предупреждение' : block.note_type === 'tip' ? '💡 Совет' : '❗ Важно'}</strong>
                                  <div style={{ marginTop: '8px' }}>
                                    {block.content ? (
                                      <ReactMarkdown>{block.content}</ReactMarkdown>
                                    ) : (
                                      <p>Пусто</p>
                                    )}
                                  </div>
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
                                  {block.explanation && (
                                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                                    </div>
                                  )}
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
                                  {block.explanation && (
                                    <div style={{ marginTop: '8px', fontStyle: 'italic' }}>
                                      <ReactMarkdown>{block.explanation}</ReactMarkdown>
                                    </div>
                                  )}
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
                {isCourseAuthor() && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={handleOpenGenerateLessonsModal} 
                      className="courses-btn courses-btn-secondary"
                      disabled={isGeneratingLessons}
                    >
                      {isGeneratingLessons ? 'Генерация...' : '✨ Сгенерировать уроки'}
                    </button>
                    <button onClick={handleCreateNewLesson} className="courses-btn courses-btn-primary">
                      + Создать урок
                    </button>
                  </div>
                )}
              </div>
              {lessons.length === 0 ? (
                <div className="lessons-cards-empty">
                  <p>В этом курсе пока нет уроков</p>
                  {isCourseAuthor() && (
                    <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'center' }}>
                      <button 
                        onClick={handleOpenGenerateLessonsModal} 
                        className="courses-create-btn-large"
                        disabled={isGeneratingLessons}
                      >
                        {isGeneratingLessons ? 'Генерация...' : '✨ Сгенерировать план уроков'}
                      </button>
                      <span style={{ color: '#666', fontSize: '0.9em' }}>или</span>
                      <button onClick={handleCreateNewLesson} className="courses-create-btn-large">
                        Создать первый урок вручную
                      </button>
                    </div>
                  )}
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
                        {lesson.description ? (
                          <ReactMarkdown>{lesson.description}</ReactMarkdown>
                        ) : (
                          <span>Без описания</span>
                        )}
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

      {/* Модальное окно для генерации уроков */}
      {showGenerateLessonsModal && (
        <div 
          className="modal-overlay" 
          onClick={(e) => {
            if (e.target === e.currentTarget && !isGeneratingLessons) {
              setShowGenerateLessonsModal(false);
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
                value={generateFormData.goal}
                onChange={(e) => setGenerateFormData({ ...generateFormData, goal: e.target.value })}
                placeholder="Например: Научиться программировать на Python"
                className="courses-input"
                disabled={isGeneratingLessons}
              />
            </div>

            <div className="courses-form-group">
              <label htmlFor="generate-start-knowledge">Начальные знания (опционально)</label>
              <input
                id="generate-start-knowledge"
                type="text"
                value={generateFormData.start_knowledge}
                onChange={(e) => setGenerateFormData({ ...generateFormData, start_knowledge: e.target.value })}
                placeholder="Например: Базовые знания о программировании"
                className="courses-input"
                disabled={isGeneratingLessons}
              />
            </div>

            <div className="courses-form-group">
              <label htmlFor="generate-target-knowledge">Конечные знания (опционально)</label>
              <input
                id="generate-target-knowledge"
                type="text"
                value={generateFormData.target_knowledge}
                onChange={(e) => setGenerateFormData({ ...generateFormData, target_knowledge: e.target.value })}
                placeholder="Например: Профессиональные навыки в Python"
                className="courses-input"
                disabled={isGeneratingLessons}
              />
            </div>

            <div className="courses-form-group">
              <label htmlFor="generate-target-audience">Целевая аудитория (опционально)</label>
              <input
                id="generate-target-audience"
                type="text"
                value={generateFormData.target_audience}
                onChange={(e) => setGenerateFormData({ ...generateFormData, target_audience: e.target.value })}
                placeholder="Например: Начинающие программисты"
                className="courses-input"
                disabled={isGeneratingLessons}
              />
            </div>

            <div className="courses-form-group">
              <label htmlFor="generate-topics">Темы для включения (опционально, через запятую)</label>
              <input
                id="generate-topics"
                type="text"
                value={generateFormData.topics}
                onChange={(e) => setGenerateFormData({ ...generateFormData, topics: e.target.value })}
                placeholder="Например: декораторы, генераторы, асинхронное программирование"
                className="courses-input"
                disabled={isGeneratingLessons}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  if (!isGeneratingLessons) {
                    setShowGenerateLessonsModal(false);
                  }
                }}
                className="courses-btn courses-btn-secondary"
                disabled={isGeneratingLessons}
              >
                Отменить
              </button>
              <button
                onClick={handleGenerateLessons}
                className="courses-btn courses-btn-primary"
                disabled={isGeneratingLessons}
              >
                {isGeneratingLessons ? 'Генерация...' : 'Сгенерировать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Courses;
