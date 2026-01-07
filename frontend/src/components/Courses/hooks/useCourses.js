import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { coursesApi } from '../../../services/api';
import { MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '../config';

/**
 * Хук для управления курсами
 */
export const useCourses = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [myCourses, setMyCourses] = useState([]);
  const [communityCourses, setCommunityCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [editedCourseName, setEditedCourseName] = useState('');
  const [editedCourseDescription, setEditedCourseDescription] = useState('');
  const [editingCourseName, setEditingCourseName] = useState(false);
  const [editingCourseDescription, setEditingCourseDescription] = useState(false);
  const [tempCourseName, setTempCourseName] = useState('');
  const [tempCourseDescription, setTempCourseDescription] = useState('');

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

  const loadCourseById = async (courseIdNum) => {
    try {
      const response = await coursesApi.getById(courseIdNum);
      setSelectedCourse(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Не удалось загрузить курс');
      console.error('Error loading course:', err);
      throw err;
    }
  };

  const handleSelectCourse = async (courseIdNum) => {
    try {
      const course = await loadCourseById(courseIdNum);
      setIsEditingCourse(false);
      setIsCreatingCourse(false);
      navigate(`/courses/${courseIdNum}`);
    } catch (err) {
      // Ошибка уже обработана в loadCourseById
    }
  };

  const handleSaveCourse = async () => {
    try {
      // Валидация длины названия
      if (editedCourseName.trim().length > MAX_NAME_LENGTH) {
        setError(`Название курса не должно превышать ${MAX_NAME_LENGTH} символов`);
        return;
      }
      
      // Валидация длины описания
      if (editedCourseDescription && editedCourseDescription.length > MAX_DESCRIPTION_LENGTH) {
        setError(`Описание курса не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`);
        return;
      }

      if (isCreatingCourse) {
        const response = await coursesApi.create({
          name: editedCourseName.trim(),
          description: editedCourseDescription.trim() || null,
        });
        setSelectedCourse(response.data);
        await loadCourses();
        setIsCreatingCourse(false);
        navigate(`/courses/${response.data.id}`);
      } else if (selectedCourse) {
        const response = await coursesApi.update(selectedCourse.id, {
          name: editedCourseName.trim(),
          description: editedCourseDescription.trim() || null,
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

  const handleDeleteCourse = async () => {
    if (selectedCourse && window.confirm('Вы уверены, что хотите удалить этот курс?')) {
      try {
        await coursesApi.delete(selectedCourse.id);
        setSelectedCourse(null);
        await loadCourses();
        navigate('/courses');
        setError(null);
      } catch (err) {
        setError('Не удалось удалить курс');
        console.error('Error deleting course:', err);
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

  const handleEditCourse = () => {
    if (selectedCourse) {
      setEditedCourseName(selectedCourse.name);
      setEditedCourseDescription(selectedCourse.description || '');
      setIsEditingCourse(true);
    }
  };

  const handleCancelCourse = () => {
    setIsEditingCourse(false);
    setIsCreatingCourse(false);
    setEditedCourseName('');
    setEditedCourseDescription('');
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setIsEditingCourse(false);
    setIsCreatingCourse(false);
    navigate('/courses');
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

  const handleStartEditCourseName = (isAuthor) => {
    if (!isAuthor || !selectedCourse) return;
    setTempCourseName(selectedCourse.name);
    setEditingCourseName(true);
  };

  const handleSaveCourseName = async () => {
    if (!selectedCourse) return;
    try {
      // Валидация длины названия
      if (tempCourseName.trim().length > MAX_NAME_LENGTH) {
        setError(`Название курса не должно превышать ${MAX_NAME_LENGTH} символов`);
        return;
      }

      const response = await coursesApi.update(selectedCourse.id, {
        name: tempCourseName.trim(),
      });
      setSelectedCourse(response.data);
      await loadCourses();
      setEditingCourseName(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить название курса');
      console.error('Error saving course name:', err);
    }
  };

  const handleCancelEditCourseName = () => {
    setEditingCourseName(false);
    setTempCourseName('');
  };

  const handleStartEditCourseDescription = (isAuthor) => {
    if (!isAuthor || !selectedCourse) return;
    setTempCourseDescription(selectedCourse.description || '');
    setEditingCourseDescription(true);
  };

  const handleSaveCourseDescription = async () => {
    if (!selectedCourse) return;
    try {
      // Валидация длины описания
      if (tempCourseDescription && tempCourseDescription.length > MAX_DESCRIPTION_LENGTH) {
        setError(`Описание курса не должно превышать ${MAX_DESCRIPTION_LENGTH} символов`);
        return;
      }

      const response = await coursesApi.update(selectedCourse.id, {
        description: tempCourseDescription.trim() || null,
      });
      setSelectedCourse(response.data);
      await loadCourses();
      setEditingCourseDescription(false);
      setError(null);
    } catch (err) {
      setError('Не удалось сохранить описание курса');
      console.error('Error saving course description:', err);
    }
  };

  const handleCancelEditCourseDescription = () => {
    setEditingCourseDescription(false);
    setTempCourseDescription('');
  };

  // Загрузка курса из URL или списка курсов
  useEffect(() => {
    const loadFromUrl = async () => {
      if (courseId) {
        // Загружаем конкретный курс
        try {
          const courseIdNum = parseInt(courseId);
          await loadCourseById(courseIdNum);
        } catch (err) {
          navigate('/courses');
        }
      } else {
        // Очищаем выбранный курс и загружаем список курсов
        setSelectedCourse(null);
        setIsEditingCourse(false);
        setIsCreatingCourse(false);
        loadCourses();
      }
    };
    
    loadFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  return {
    myCourses,
    communityCourses,
    selectedCourse,
    setSelectedCourse,
    loading,
    error,
    setError,
    searchQuery,
    activeSearchQuery,
    isSearching,
    isEditingCourse,
    isCreatingCourse,
    editedCourseName,
    editedCourseDescription,
    setEditedCourseName,
    setEditedCourseDescription,
    editingCourseName,
    editingCourseDescription,
    tempCourseName,
    tempCourseDescription,
    setTempCourseName,
    setTempCourseDescription,
    loadCourses,
    handleSelectCourse,
    handleSaveCourse,
    handleDeleteCourse,
    handleCreateNewCourse,
    handleEditCourse,
    handleCancelCourse,
    handleBackToCourses,
    handleSearchSubmit,
    handleSearchClear,
    handleSearchChange,
    handleStartEditCourseName,
    handleSaveCourseName,
    handleCancelEditCourseName,
    handleStartEditCourseDescription,
    handleSaveCourseDescription,
    handleCancelEditCourseDescription,
  };
};

