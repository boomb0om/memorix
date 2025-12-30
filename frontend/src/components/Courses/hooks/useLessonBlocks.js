import { useState } from 'react';
import { lessonsApi } from '../../../services/api';
import { createNewBlock } from '../utils';

/**
 * Хук для управления блоками уроков
 */
export const useLessonBlocks = (selectedCourse, selectedLesson, setSelectedLesson) => {
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingBlockData, setEditingBlockData] = useState(null);
  const [draggedBlockId, setDraggedBlockId] = useState(null);
  const [dragOverBlockIndex, setDragOverBlockIndex] = useState(null);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [isGeneratingLessonContent, setIsGeneratingLessonContent] = useState(false);

  const handleEditBlock = (block) => {
    if (!block.block_id) {
      throw new Error('Блок еще не сохранен. Сохраните урок, чтобы редактировать блоки отдельно.');
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
      return response.data;
    } catch (err) {
      console.error('Error saving block:', err);
      throw err;
    }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!selectedCourse || !selectedLesson || !blockId) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить этот блок?')) {
      return;
    }
    
    try {
      const response = await lessonsApi.deleteBlock(
        selectedCourse.id,
        selectedLesson.id,
        blockId
      );
      setSelectedLesson(response.data);
      if (editingBlockId === blockId) {
        setEditingBlockId(null);
        setEditingBlockData(null);
      }
      return response.data;
    } catch (err) {
      console.error('Error deleting block:', err);
      throw err;
    }
  };

  const handleAddBlock = async (type) => {
    if (!selectedCourse || !selectedLesson) return;
    
    const newBlock = createNewBlock(type);
    if (!newBlock) return;
    
    try {
      const response = await lessonsApi.addBlock(selectedCourse.id, selectedLesson.id, newBlock);
      setSelectedLesson(response.data);
      const newBlockId = response.data.blocks[response.data.blocks.length - 1]?.block_id;
      if (newBlockId) {
        setEditingBlockId(newBlockId);
        setEditingBlockData({ ...newBlock, block_id: newBlockId });
      }
      return response.data;
    } catch (err) {
      console.error('Error adding block:', err);
      throw err;
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

  const handleRemoveBlockOption = (optIndex) => {
    const newOptions = (editingBlockData.options || []).filter((_, i) => i !== optIndex);
    let updatedData = { ...editingBlockData, options: newOptions };
    
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

  const handleGenerateLessonContent = async () => {
    if (!selectedCourse || !selectedLesson) return;

    try {
      setIsGeneratingLessonContent(true);

      const response = await lessonsApi.generateContent(selectedCourse.id, selectedLesson.id, {
        context: null,
        goal: null,
        focus_points: null
      });

      const generatedBlocks = response.data.blocks || [];
      
      for (const block of generatedBlocks) {
        await lessonsApi.addBlock(selectedCourse.id, selectedLesson.id, block);
      }

      const lessonResponse = await lessonsApi.getById(selectedCourse.id, selectedLesson.id);
      setSelectedLesson(lessonResponse.data);
      
      return generatedBlocks.length;
    } catch (err) {
      console.error('Error generating lesson content:', err);
      throw err;
    } finally {
      setIsGeneratingLessonContent(false);
    }
  };

  // Drag and drop для блоков
  const handleDragStartBlock = (e, blockId) => {
    if (!blockId || editingBlockId === blockId) {
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
    if (draggedBlockId === null) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    const draggedIndex = selectedLesson.blocks.findIndex(b => b.block_id === draggedBlockId);
    if (draggedIndex === -1) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const midpoint = rect.height / 2;
    
    if (draggedIndex < index) {
      setDragOverBlockIndex(index);
    } else if (draggedIndex > index) {
      setDragOverBlockIndex(index);
    } else {
      setDragOverBlockIndex(null);
    }
  };

  const handleDragLeaveBlock = () => {
    setDragOverBlockIndex(null);
  };

  const handleDropBlock = async (e, targetIndex) => {
    if (draggedBlockId === null || !selectedCourse || !selectedLesson) return;
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
      const sortedBlocks = [...selectedLesson.blocks];
      const [removed] = sortedBlocks.splice(currentIndex, 1);
      
      let insertIndex;
      if (currentIndex < targetIndex) {
        insertIndex = targetIndex;
      } else {
        insertIndex = targetIndex;
      }
      
      sortedBlocks.splice(insertIndex, 0, removed);
      
      const updatedBlocks = sortedBlocks.map((block, index) => ({
        ...block,
        position: index
      }));
      
      const newPosition = updatedBlocks.findIndex(b => b.block_id === draggedBlockId);
      
      setSelectedLesson({ ...selectedLesson, blocks: updatedBlocks });

      await lessonsApi.reorderBlock(selectedCourse.id, selectedLesson.id, draggedBlockId, newPosition);
      
      const lessonResponse = await lessonsApi.getById(selectedCourse.id, selectedLesson.id);
      setSelectedLesson(lessonResponse.data);
    } catch (err) {
      const lessonResponse = await lessonsApi.getById(selectedCourse.id, selectedLesson.id);
      setSelectedLesson(lessonResponse.data);
      throw err;
    } finally {
      setDraggedBlockId(null);
      setDragOverBlockIndex(null);
    }
  };

  return {
    editingBlockId,
    editingBlockData,
    draggedBlockId,
    dragOverBlockIndex,
    isDraggingBlock,
    isGeneratingLessonContent,
    setEditingBlockId,
    setEditingBlockData,
    handleEditBlock,
    handleCancelBlockEdit,
    handleSaveBlock,
    handleDeleteBlock,
    handleAddBlock,
    handleUpdateBlockData,
    handleUpdateBlockOptions,
    handleAddBlockOption,
    handleRemoveBlockOption,
    handleGenerateLessonContent,
    handleDragStartBlock,
    handleDragEndBlock,
    handleDragOverBlock,
    handleDragLeaveBlock,
    handleDropBlock,
  };
};

