'use client';
import { useState } from 'react';
import { useScheduleData } from '../hooks/useScheduleData';
import { Course } from '../data/schedule';
import CourseEditor from './CourseEditor';
import styles from './CourseManager.module.css';

/**
 * Course Manager Component
 * 管理課程的新增、編輯、刪除
 */
export default function CourseManager() {
  const { courses, addCourse, updateCourse, deleteCourse } = useScheduleData();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');

  const dayNames = ['', '一', '二', '三', '四', '五', '六', '日'];

  const handleAddCourse = () => {
    setEditingCourse(null);
    setEditorMode('add');
    setIsEditorOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditorMode('edit');
    setIsEditorOpen(true);
  };

  const handleDeleteCourse = (course: Course) => {
    if (confirm(`確定要刪除「${course.name}」嗎？`)) {
      deleteCourse(course.id);
    }
  };

  const handleSaveCourse = (course: Course) => {
    if (editorMode === 'add') {
      addCourse(course);
    } else {
      updateCourse(course.id, course);
    }
  };

  const sortedCourses = [...courses].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>課程管理</h2>
        <button className={`btn ${styles.addButton}`} onClick={handleAddCourse}>
          + 新增課程
        </button>
      </div>

      <div className={styles.courseList}>
        {sortedCourses.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📚</div>
            <p>尚未新增任何課程</p>
            <button className="btn" onClick={handleAddCourse}>
              新增第一堂課
            </button>
          </div>
        ) : (
          sortedCourses.map((course) => (
            <div key={course.id} className={`glass ${styles.courseCard}`}>
              <div
                className={styles.colorBar}
                style={{ backgroundColor: course.color || '#818cf8' }}
              />
              <div className={styles.courseInfo}>
                <div className={styles.courseName}>{course.name}</div>
                <div className={styles.courseDetails}>
                  <span>星期{dayNames[course.day]}</span>
                  <span>
                    {course.startTime} - {course.endTime}
                  </span>
                  {course.location && <span>{course.location}</span>}
                </div>
              </div>
              <div className={styles.courseActions}>
                <button
                  className={styles.editButton}
                  onClick={() => handleEditCourse(course)}
                  title="編輯"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteCourse(course)}
                  title="刪除"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <CourseEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCourse}
        course={editingCourse}
        mode={editorMode}
      />
    </div>
  );
}
