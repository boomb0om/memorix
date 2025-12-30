import React from 'react';
import CourseCard from './CourseCard';

/**
 * Компонент библиотеки курсов
 */
const CourseLibrary = ({
  myCourses,
  communityCourses,
  loading,
  isSearching,
  activeSearchQuery,
  searchQuery,
  onSearchSubmit,
  onSearchChange,
  onSearchClear,
  onSelectCourse,
  onCreateCourse,
}) => {
  return (
    <div className="courses-library">
      <div className="courses-search-bar">
        <form className="courses-search-form" onSubmit={onSearchSubmit}>
          <input
            type="text"
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Поиск по названиям и описаниям курсов"
            className="courses-search-input"
          />
          {isSearching && (
            <button
              type="button"
              className="courses-search-clear"
              onClick={onSearchClear}
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
          <button onClick={onCreateCourse} className="courses-create-btn">
            + Создать курс
          </button>
        </div>
        {loading ? (
          <div className="courses-loading">Загрузка...</div>
        ) : myCourses.length === 0 ? (
          <div className="courses-empty">
            <p>{isSearching ? 'По запросу ничего не найдено' : 'У вас пока нет курсов'}</p>
            {!isSearching && (
              <button onClick={onCreateCourse} className="courses-create-btn-large">
                Создать первый курс
              </button>
            )}
          </div>
        ) : (
          <div className="courses-card-grid">
            {myCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onSelectCourse(course.id)}
                isMine={true}
              />
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
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => onSelectCourse(course.id)}
                isMine={false}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CourseLibrary;

