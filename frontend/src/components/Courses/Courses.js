import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useSidebar } from '../../contexts/SidebarContext';
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi } from '../../services/api';
import { isCourseAuthor } from './utils';
import { useCourses } from './hooks/useCourses';
import { useLessons } from './hooks/useLessons';
import { useLessonBlocks } from './hooks/useLessonBlocks';
import CourseLibrary from './components/CourseLibrary';
import CourseEditForm from './components/CourseEditForm';
import CourseView from './components/CourseView';
import LessonList from './components/LessonList';
import LessonView from './components/LessonView';
import LessonEditForm from './components/LessonEditForm';
import GenerateLessonsModal from './components/GenerateLessonsModal';

/**
 * Главный компонент Courses - объединяет все части модуля курсов
 */
function Courses() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isSidebarOpen } = useSidebar();
  
  // Состояние для генерации уроков
  const [isGeneratingLessons, setIsGeneratingLessons] = useState(false);
  const [showGenerateLessonsModal, setShowGenerateLessonsModal] = useState(false);
  const [generateFormData, setGenerateFormData] = useState({
    goal: '',
    start_knowledge: '',
    target_knowledge: '',
    target_audience: '',
    topics: ''
  });

  // Хуки для управления данными
  const coursesHook = useCourses();
  const lessonsHook = useLessons(coursesHook.selectedCourse);
  const blocksHook = useLessonBlocks(
    coursesHook.selectedCourse,
    lessonsHook.selectedLesson,
    lessonsHook.setSelectedLesson
  );

  // Проверка прав автора
  const authorCheck = () => isCourseAuthor(coursesHook.selectedCourse, user);

  // Обработчик открытия модального окна генерации уроков
  const handleOpenGenerateLessonsModal = () => {
    if (!coursesHook.selectedCourse) {
      coursesHook.setError('Сначала создайте и сохраните курс');
      return;
    }

    if (coursesHook.isEditingCourse) {
      coursesHook.setError('Пожалуйста, сначала сохраните изменения в курсе');
      return;
    }

    const courseName = coursesHook.selectedCourse.name;
    const courseDescription = coursesHook.selectedCourse.description;

    if (!courseName || !courseName.trim()) {
      coursesHook.setError('Пожалуйста, заполните название курса перед генерацией уроков');
      return;
    }

    if (!courseDescription || !courseDescription.trim()) {
      coursesHook.setError('Пожалуйста, заполните описание курса перед генерацией уроков');
      return;
    }

    if (lessonsHook.lessons.length > 0) {
      if (!window.confirm('В курсе уже есть уроки. Сгенерировать новый план? Существующие уроки будут удалены.')) {
        return;
      }
    }

    setGenerateFormData({
      goal: '',
      start_knowledge: '',
      target_knowledge: '',
      target_audience: '',
      topics: ''
    });
    setShowGenerateLessonsModal(true);
    coursesHook.setError(null);
  };

  // Обработчик генерации уроков
  const handleGenerateLessons = async () => {
    if (!coursesHook.selectedCourse) {
      coursesHook.setError('Сначала сохраните курс');
      return;
    }

    try {
      setIsGeneratingLessons(true);
      coursesHook.setError(null);

      const requestData = {
        goal: generateFormData.goal.trim() || null,
        start_knowledge: generateFormData.start_knowledge.trim() || null,
        target_knowledge: generateFormData.target_knowledge.trim() || null,
        target_audience: generateFormData.target_audience.trim() || null,
        topics: generateFormData.topics.trim() 
          ? generateFormData.topics.split(',').map(t => t.trim()).filter(t => t.length > 0)
          : null
      };

      const response = await coursesApi.generateLessons(coursesHook.selectedCourse.id, requestData);
      
      await lessonsHook.loadLessons(coursesHook.selectedCourse.id);
      
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
      coursesHook.setError(errorMessage);
      console.error('Error generating lessons:', err);
    }
  };

  // Обработчик генерации контента урока
  const handleGenerateLessonContent = async () => {
    try {
      const count = await blocksHook.handleGenerateLessonContent();
      alert(`Успешно сгенерировано и добавлено ${count} блоков!`);
    } catch (err) {
      coursesHook.setError('Не удалось сгенерировать контент урока');
      console.error('Error generating lesson content:', err);
    }
  };

  // Обработчики для блоков в режиме создания урока
  const addBlock = (type) => {
    const { createNewBlock } = require('./utils');
    const newBlock = createNewBlock(type);
    if (newBlock) {
      lessonsHook.setEditedLessonBlocks([...lessonsHook.editedLessonBlocks, newBlock]);
      lessonsHook.setEditingBlockIndex(lessonsHook.editedLessonBlocks.length);
    }
  };

  const updateBlock = (index, updatedBlock) => {
    const newBlocks = [...lessonsHook.editedLessonBlocks];
    newBlocks[index] = updatedBlock;
    lessonsHook.setEditedLessonBlocks(newBlocks);
  };

  const deleteBlock = (index) => {
    const newBlocks = lessonsHook.editedLessonBlocks.filter((_, i) => i !== index);
    lessonsHook.setEditedLessonBlocks(newBlocks);
    if (lessonsHook.editingBlockIndex === index) {
      lessonsHook.setEditingBlockIndex(null);
    } else if (lessonsHook.editingBlockIndex > index) {
      lessonsHook.setEditingBlockIndex(lessonsHook.editingBlockIndex - 1);
    }
  };

  const moveBlock = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === lessonsHook.editedLessonBlocks.length - 1)) {
      return;
    }
    const newBlocks = [...lessonsHook.editedLessonBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    lessonsHook.setEditedLessonBlocks(newBlocks);
    if (lessonsHook.editingBlockIndex === index) {
      lessonsHook.setEditingBlockIndex(targetIndex);
    } else if (lessonsHook.editingBlockIndex === targetIndex) {
      lessonsHook.setEditingBlockIndex(index);
    }
  };

  // Обработчики для сохранения урока
  const handleSaveLesson = async () => {
    try {
      await lessonsHook.handleSaveLesson();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить урок');
      console.error('Error saving lesson:', err);
    }
  };

  // Обработчики для сохранения имени и описания курса
  const handleSaveCourseName = async () => {
    try {
      await coursesHook.handleSaveCourseName();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить название курса');
      console.error('Error saving course name:', err);
    }
  };

  const handleSaveCourseDescription = async () => {
    try {
      await coursesHook.handleSaveCourseDescription();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить описание курса');
      console.error('Error saving course description:', err);
    }
  };

  // Обработчики для сохранения имени и описания урока
  const handleSaveLessonName = async () => {
    try {
      await lessonsHook.handleSaveLessonName();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить название урока');
      console.error('Error saving lesson name:', err);
    }
  };

  const handleSaveLessonDescription = async () => {
    try {
      await lessonsHook.handleSaveLessonDescription();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить описание урока');
      console.error('Error saving lesson description:', err);
    }
  };

  // Обработчики для блоков в режиме просмотра
  const handleEditBlock = (block) => {
    try {
      blocksHook.handleEditBlock(block);
    } catch (err) {
      coursesHook.setError(err.message);
    }
  };

  const handleSaveBlock = async () => {
    try {
      await blocksHook.handleSaveBlock();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось сохранить блок');
      console.error('Error saving block:', err);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await blocksHook.handleDeleteBlock(blockId);
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось удалить блок');
      console.error('Error deleting block:', err);
    }
  };

  const handleAddBlock = async (type) => {
    try {
      await blocksHook.handleAddBlock(type);
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось добавить блок');
      console.error('Error adding block:', err);
    }
  };

  // Обработчики для drag and drop блоков
  const handleDropBlock = async (e, targetIndex) => {
    try {
      await blocksHook.handleDropBlock(e, targetIndex);
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось изменить позицию блока');
      console.error('Error reordering block:', err);
    }
  };

  // Обработчики для drag and drop уроков
  const handleDrop = async (e, targetIndex) => {
    try {
      await lessonsHook.handleDrop(e, targetIndex);
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось изменить позицию урока');
      console.error('Error reordering lesson:', err);
    }
  };

  // Обработчик удаления урока
  const handleDeleteLesson = async () => {
    try {
      await lessonsHook.handleDeleteLesson();
      coursesHook.setError(null);
    } catch (err) {
      coursesHook.setError('Не удалось удалить урок');
      console.error('Error deleting lesson:', err);
    }
  };

  // Обработчик проверки ответа
  const handleCheckAnswer = async (blockId) => {
    try {
      await lessonsHook.handleCheckAnswer(blockId);
    } catch (err) {
      // Ошибка уже обработана в хуке
    }
  };

  // Обработчик возврата (из списка уроков)
  // Если выбран урок - возврат к странице курса (карточки уроков)
  // Если урока нет - возврат к странице со всеми курсами
  const handleBackToCourse = () => {
    if (lessonsHook.selectedLesson) {
      // Если выбран урок, возвращаемся к странице курса (карточки уроков)
      lessonsHook.setSelectedLesson(null);
      coursesHook.setError(null);
      navigate(`/courses/${coursesHook.selectedCourse.id}`);
    } else if (coursesHook.selectedCourse) {
      // Если урока нет, но есть курс, возвращаемся к списку всех курсов
      coursesHook.handleBackToCourses();
    }
  };

  return (
    <>
      <Sidebar />
      <div className={`courses-container ${!isSidebarOpen ? 'courses-container-expanded' : ''}`}>
        {/* Левая панель со списком уроков */}
        {coursesHook.selectedCourse && (
          <LessonList
            courseName={coursesHook.selectedCourse.name}
            lessons={lessonsHook.lessons}
            selectedLesson={lessonsHook.selectedLesson}
            isCourseAuthor={authorCheck()}
            onBack={handleBackToCourse}
            onCreateLesson={lessonsHook.handleCreateNewLesson}
            onSelectLesson={lessonsHook.handleSelectLesson}
            draggedLessonId={lessonsHook.draggedLessonId}
            dragOverIndex={lessonsHook.dragOverIndex}
            isDragging={lessonsHook.isDragging}
            onDragStart={lessonsHook.handleDragStart}
            onDragEnd={lessonsHook.handleDragEnd}
            onDragOver={lessonsHook.handleDragOver}
            onDragLeave={lessonsHook.handleDragLeave}
            onDrop={handleDrop}
          />
        )}

        {/* Правая панель с содержимым */}
        <div className="courses-content">
          {coursesHook.error && (
            <div className="courses-error">
              {coursesHook.error}
              <button onClick={() => coursesHook.setError(null)} className="courses-error-close">✕</button>
            </div>
          )}

          {/* Библиотека курсов */}
          {!coursesHook.selectedCourse && !coursesHook.isCreatingCourse && !coursesHook.isEditingCourse && !lessonsHook.selectedLesson && (
            <CourseLibrary
              myCourses={coursesHook.myCourses}
              communityCourses={coursesHook.communityCourses}
              loading={coursesHook.loading}
              isSearching={coursesHook.isSearching}
              activeSearchQuery={coursesHook.activeSearchQuery}
              searchQuery={coursesHook.searchQuery}
              onSearchSubmit={coursesHook.handleSearchSubmit}
              onSearchChange={coursesHook.handleSearchChange}
              onSearchClear={coursesHook.handleSearchClear}
              onSelectCourse={coursesHook.handleSelectCourse}
              onCreateCourse={coursesHook.handleCreateNewCourse}
            />
          )}

          {/* Редактирование курса */}
          {coursesHook.isEditingCourse && (
            <CourseEditForm
              isCreating={coursesHook.isCreatingCourse}
              editedCourseName={coursesHook.editedCourseName}
              editedCourseDescription={coursesHook.editedCourseDescription}
              onNameChange={(e) => coursesHook.setEditedCourseName(e.target.value)}
              onDescriptionChange={(e) => coursesHook.setEditedCourseDescription(e.target.value)}
              onSave={coursesHook.handleSaveCourse}
              onCancel={coursesHook.handleCancelCourse}
              onGenerateLessons={coursesHook.isCreatingCourse ? null : handleOpenGenerateLessonsModal}
              isGeneratingLessons={isGeneratingLessons}
            />
          )}

          {/* Просмотр урока */}
          {lessonsHook.selectedLesson && !lessonsHook.isEditingLesson && (
            <LessonView
              lesson={lessonsHook.selectedLesson}
              isAuthor={authorCheck()}
              editingLessonName={lessonsHook.editingLessonName}
              editingLessonDescription={lessonsHook.editingLessonDescription}
              tempLessonName={lessonsHook.tempLessonName}
              tempLessonDescription={lessonsHook.tempLessonDescription}
              onStartEditName={() => lessonsHook.handleStartEditLessonName(authorCheck())}
              onSaveName={handleSaveLessonName}
              onCancelEditName={lessonsHook.handleCancelEditLessonName}
              onNameChange={(e) => lessonsHook.setTempLessonName(e.target.value)}
              onStartEditDescription={() => lessonsHook.handleStartEditLessonDescription(authorCheck())}
              onSaveDescription={handleSaveLessonDescription}
              onCancelEditDescription={lessonsHook.handleCancelEditLessonDescription}
              onDescriptionChange={(e) => lessonsHook.setTempLessonDescription(e.target.value)}
              onDeleteLesson={handleDeleteLesson}
              editingBlockId={blocksHook.editingBlockId}
              editingBlockData={blocksHook.editingBlockData}
              draggedBlockId={blocksHook.draggedBlockId}
              dragOverBlockIndex={blocksHook.dragOverBlockIndex}
              onEditBlock={handleEditBlock}
              onDeleteBlock={handleDeleteBlock}
              onAddBlock={handleAddBlock}
              onUpdateBlockData={blocksHook.handleUpdateBlockData}
              onUpdateBlockOptions={blocksHook.handleUpdateBlockOptions}
              onAddBlockOption={blocksHook.handleAddBlockOption}
              onRemoveBlockOption={blocksHook.handleRemoveBlockOption}
              onSaveBlock={handleSaveBlock}
              onCancelBlockEdit={blocksHook.handleCancelBlockEdit}
              onDragStartBlock={blocksHook.handleDragStartBlock}
              onDragEndBlock={blocksHook.handleDragEndBlock}
              onDragOverBlock={blocksHook.handleDragOverBlock}
              onDragLeaveBlock={blocksHook.handleDragLeaveBlock}
              onDropBlock={handleDropBlock}
              onGenerateContent={handleGenerateLessonContent}
              isGeneratingContent={blocksHook.isGeneratingLessonContent}
              questionAnswers={lessonsHook.questionAnswers}
              checkedQuestions={lessonsHook.checkedQuestions}
              onSingleChoiceSelect={lessonsHook.handleSingleChoiceSelect}
              onMultipleChoiceToggle={lessonsHook.handleMultipleChoiceToggle}
              onCheckAnswer={handleCheckAnswer}
              courseId={coursesHook.selectedCourse?.id}
              lessonId={lessonsHook.selectedLesson?.id}
              onGenerateBlock={async (blockId, data) => {
                try {
                  await blocksHook.handleGenerateBlockContent(blockId, data);
                } catch (err) {
                  coursesHook.setError('Не удалось сгенерировать контент блока');
                  console.error('Error generating block:', err);
                  throw err;
                }
              }}
              isGeneratingBlock={blocksHook.isGeneratingBlock}
            />
          )}

          {/* Создание нового урока */}
          {lessonsHook.isEditingLesson && lessonsHook.isCreatingLesson && (
            <LessonEditForm
              editedLessonName={lessonsHook.editedLessonName}
              editedLessonDescription={lessonsHook.editedLessonDescription}
              editedLessonBlocks={lessonsHook.editedLessonBlocks}
              editingBlockIndex={lessonsHook.editingBlockIndex}
              onNameChange={(e) => lessonsHook.setEditedLessonName(e.target.value)}
              onDescriptionChange={(e) => lessonsHook.setEditedLessonDescription(e.target.value)}
              onSave={handleSaveLesson}
              onCancel={lessonsHook.handleCancelLesson}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onMoveBlock={moveBlock}
              onSetEditingBlockIndex={lessonsHook.setEditingBlockIndex}
              courseId={coursesHook.selectedCourse?.id}
              lessonId={null}
            />
          )}

          {/* Страница курса */}
          {coursesHook.selectedCourse && !lessonsHook.selectedLesson && !coursesHook.isEditingCourse && !lessonsHook.isCreatingLesson && (
            <CourseView
              course={coursesHook.selectedCourse}
              lessons={lessonsHook.lessons}
              isAuthor={authorCheck()}
              editingCourseName={coursesHook.editingCourseName}
              editingCourseDescription={coursesHook.editingCourseDescription}
              tempCourseName={coursesHook.tempCourseName}
              tempCourseDescription={coursesHook.tempCourseDescription}
              onStartEditName={() => coursesHook.handleStartEditCourseName(authorCheck())}
              onSaveName={handleSaveCourseName}
              onCancelEditName={coursesHook.handleCancelEditCourseName}
              onNameChange={(e) => coursesHook.setTempCourseName(e.target.value)}
              onStartEditDescription={() => coursesHook.handleStartEditCourseDescription(authorCheck())}
              onSaveDescription={handleSaveCourseDescription}
              onCancelEditDescription={coursesHook.handleCancelEditCourseDescription}
              onDescriptionChange={(e) => coursesHook.setTempCourseDescription(e.target.value)}
              onSelectLesson={lessonsHook.handleSelectLesson}
              onCreateLesson={lessonsHook.handleCreateNewLesson}
              onGenerateLessons={handleOpenGenerateLessonsModal}
              isGeneratingLessons={isGeneratingLessons}
            />
          )}
        </div>
      </div>

      {/* Модальное окно генерации уроков */}
      <GenerateLessonsModal
        show={showGenerateLessonsModal}
        formData={generateFormData}
        isGenerating={isGeneratingLessons}
        onClose={() => {
          if (!isGeneratingLessons) {
            setShowGenerateLessonsModal(false);
          }
        }}
        onGenerate={handleGenerateLessons}
        onFormDataChange={setGenerateFormData}
      />
    </>
  );
}

export default Courses;

