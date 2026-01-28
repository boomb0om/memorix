import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { coursesApi } from '../../../services/api';

/**
 * Модальное окно для отображения результата анализа курса
 */
const CourseAnalysisModal = ({
  show,
  courseId,
  onClose,
}) => {
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [displayReport, setDisplayReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (show && courseId) {
      loadAnalysisHistory();
      setSelectedHistoryItem(null);
      setDisplayReport(null);
      setIsAnalyzing(false);
    } else {
      setDisplayReport(null);
      setSelectedHistoryItem(null);
      setIsAnalyzing(false);
    }
  }, [show, courseId]);

  const loadAnalysisHistory = async () => {
    if (!courseId) return [];
    
    try {
      setIsLoadingHistory(true);
      const response = await coursesApi.getAnalysisHistory(courseId);
      const history = response.data || [];
      setAnalysisHistory(history);
      return history;
    } catch (err) {
      console.error('Error loading analysis history:', err);
      setAnalysisHistory([]);
      return [];
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnalyze = async () => {
    if (!courseId) return;

    try {
      setIsAnalyzing(true);
      setDisplayReport(null);
      setSelectedHistoryItem(null);
      
      const response = await coursesApi.analyze(courseId);
      
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const newReport = response.data.report;
      
      if (!newReport) {
        throw new Error('Report not found in response');
      }
      
      // Обновляем историю после завершения анализа, чтобы новый анализ появился в списке
      const updatedHistory = await loadAnalysisHistory();
      
      // Находим новый элемент в истории (он будет первым, так как сортируется по дате desc)
      if (updatedHistory && Array.isArray(updatedHistory) && updatedHistory.length > 0) {
        const newestItem = updatedHistory[0];
        if (newestItem && newestItem.report) {
          setDisplayReport(newestItem.report);
          // Не устанавливаем selectedHistoryItem, чтобы показать, что это текущий анализ
          setSelectedHistoryItem(null);
        } else {
          // Если в истории нет отчета, показываем новый отчет
          setDisplayReport(newReport);
        }
      } else {
        // Если история пуста или не загрузилась, показываем новый отчет
        setDisplayReport(newReport);
      }
    } catch (err) {
      console.error('Error analyzing course:', err);
      alert(err.response?.data?.detail || 'Не удалось проанализировать курс');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget && !isAnalyzing) {
          onClose();
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
          padding: '0',
          maxWidth: '1200px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'row',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Основной контент */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Анализ курса</h2>
            <button
              onClick={onClose}
              className="courses-btn courses-btn-secondary"
              disabled={isAnalyzing}
              style={{ padding: '4px 12px', fontSize: '1.2em' }}
            >
              ✕
            </button>
          </div>

          {!displayReport && !isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '1.1em', color: '#666', marginBottom: '20px' }}>
                Нажмите кнопку ниже, чтобы проанализировать курс
              </div>
              <button
                onClick={handleAnalyze}
                className="courses-btn courses-btn-primary"
                disabled={isAnalyzing}
                style={{ padding: '12px 24px', fontSize: '1em' }}
              >
                Проанализировать курс
              </button>
            </div>
          )}

          {isAnalyzing ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '1.1em', color: '#666' }}>Анализ курса выполняется...</div>
              <div style={{ marginTop: '16px', fontSize: '0.9em', color: '#999' }}>Это может занять некоторое время</div>
            </div>
          ) : displayReport ? (
            <div 
              style={{
                padding: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '4px',
                border: '1px solid #e0e0e0'
              }}
            >
              {selectedHistoryItem && (
                <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '0.9em', color: '#1976d2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Просмотр анализа от {formatDateTime(selectedHistoryItem.created_at)}</span>
                  <button
                    onClick={() => {
                      setSelectedHistoryItem(null);
                      setDisplayReport(null);
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '0.85em',
                      backgroundColor: '#1976d2',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Скрыть
                  </button>
                </div>
              )}
              <ReactMarkdown>{displayReport}</ReactMarkdown>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Результат анализа не найден
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            {displayReport && !isAnalyzing && (
              <button
                onClick={handleAnalyze}
                className="courses-btn courses-btn-secondary"
                disabled={isAnalyzing}
                style={{ marginRight: 'auto' }}
              >
                Проанализировать снова
              </button>
            )}
            <button
              onClick={onClose}
              className="courses-btn courses-btn-primary"
              disabled={isAnalyzing}
            >
              Закрыть
            </button>
          </div>
        </div>

        {/* Боковая панель с историей */}
        <div style={{
          width: '300px',
          borderLeft: '1px solid #e0e0e0',
          padding: '24px',
          backgroundColor: '#f5f5f5',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em', color: '#333' }}>
            История запусков
          </h3>
          
          {isLoadingHistory ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Загрузка...
            </div>
          ) : analysisHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.9em' }}>
              История пуста
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysisHistory.map((item) => {
                const isSelected = selectedHistoryItem?.id === item.id;
                const isCurrent = !selectedHistoryItem && displayReport === item.report;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedHistoryItem(item);
                      setDisplayReport(item.report);
                    }}
                    style={{
                      padding: '12px',
                      backgroundColor: (isSelected || isCurrent) ? '#e3f2fd' : 'white',
                      borderRadius: '4px',
                      border: (isSelected || isCurrent) ? '2px solid #1976d2' : '1px solid #e0e0e0',
                      fontSize: '0.9em',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected && !isCurrent) {
                        e.currentTarget.style.backgroundColor = '#f5f5f5';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected && !isCurrent) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    <div style={{ 
                      color: (isSelected || isCurrent) ? '#1976d2' : '#666', 
                      marginBottom: '4px', 
                      fontWeight: (isSelected || isCurrent) ? '600' : '400',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{formatDateTime(item.created_at)}</span>
                      {isCurrent && !isSelected && (
                        <span style={{ fontSize: '0.75em', color: '#1976d2' }}>Текущий</span>
                      )}
                    </div>
                    {item.report && (
                      <div style={{ 
                        color: '#999', 
                        fontSize: '0.85em', 
                        marginTop: '4px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {item.report.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseAnalysisModal;
