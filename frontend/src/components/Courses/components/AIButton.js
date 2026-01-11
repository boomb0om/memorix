import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Компонент кнопки с AI фичами
 * Автоматически делает кнопку неактивной для пользователей с free планом
 * Показывает tooltip при наведении, если план free
 * 
 * @param {Function} onClick - обработчик клика
 * @param {boolean} disabled - состояние загрузки/блокировки
 * @param {string} tooltipText - текст подсказки (опционально)
 * @param {string} className - классы кнопки
 * @param {object} style - стили кнопки
 * @param {React.ReactNode} children - содержимое кнопки
 * @param {object} ...props - остальные пропсы для кнопки
 */
const AIButton = ({
  onClick,
  disabled = false,
  tooltipText = null,
  className = '',
  style = {},
  children,
  ...props
}) => {
  const { user } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Проверяем, есть ли у пользователя доступ к AI фичам
  // Если пользователь не залогинен или план free - блокируем
  const isFreePlan = !user || user?.plan === 'free';
  const isDisabled = disabled || isFreePlan;
  
  // Текст подсказки по умолчанию
  const defaultTooltipText = 'Для использования AI функций необходимо улучшить план.';
  const finalTooltipText = tooltipText || defaultTooltipText;
  
  const handleClick = (e) => {
    if (isFreePlan) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick && !disabled) {
      onClick(e);
    }
  };
  
  const handleMouseEnter = () => {
    if (isFreePlan) {
      setShowTooltip(true);
    }
  };
  
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };
  
  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={className}
        style={{
          ...style,
          cursor: isFreePlan ? 'not-allowed' : (disabled ? 'not-allowed' : 'pointer'),
          opacity: isFreePlan ? 0.6 : (disabled ? 0.6 : 1),
          position: 'relative'
        }}
        {...props}
      >
        {children}
      </button>
      
      {/* Tooltip */}
      {showTooltip && isFreePlan && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '8px 12px',
            backgroundColor: '#333',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '0.875rem',
            whiteSpace: 'normal',
            zIndex: 10000,
            pointerEvents: 'none',
            maxWidth: '300px',
            minWidth: '200px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            wordWrap: 'break-word'
          }}
        >
          {finalTooltipText}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              border: '6px solid transparent',
              borderTopColor: '#333'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default AIButton;

