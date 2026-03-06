'use client';
import { Fragment, useState } from 'react';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useConfirm } from '@/context/ConfirmContext';
import { useCourseNotes } from '../../../hooks/useCourseNotes';
import { Course } from '../../../data/schedule';
import type { CourseNote } from '../../../data/courseNotes';
import LoginPrompt from '../../../components/LoginPrompt';
import CourseEditor from '../../../components/CourseEditor';
import CourseNoteEditor from '../../../components/CourseNoteEditor';
import CourseNoteList from '../../../components/CourseNoteList';
import { LoadingSpinner } from '../../../components/Loading';
import styles from './page.module.css';

export default function SchoolSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  
  // 使用新的資料管理 hook
  const { courses, deleteCourse, updateCourse, canEdit } = useScheduleData();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  
  // 筆記管理
  const {
    notes,
    loading: notesLoading,
    addNote,
    updateNote,
    deleteNote,
    toggleCompletion,
  } = useCourseNotes();
  
  // 編輯器狀態
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<string | null>(null);
  
  // 筆記編輯器狀態
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editingNote, setEditingNote] = useState<CourseNote | null>(null);
  const [showNotesSection, setShowNotesSection] = useState(true);
  
  // 檢查登入狀態
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LoginPrompt />;
  }
  
  // School Schedule Configuration
  const weekDays = ['一', '二', '三', '四', '五']; // Mon-Fri only
  
  const periods = [
    { id: 1, label: '第 1 節', time: '0810-0900', start: '08:10', end: '09:00' },
    { id: 2, label: '第 2 節', time: '0910-1000', start: '09:10', end: '10:00' },
    { id: 3, label: '第 3 節', time: '1010-1100', start: '10:10', end: '11:00' },
    { id: 4, label: '第 4 節', time: '1110-1200', start: '11:10', end: '12:00' },
    { id: 5, label: '第 5 節', time: '1210-1300', start: '12:10', end: '13:00' },
    { id: 6, label: '第 6 節', time: '1310-1400', start: '13:10', end: '14:00' },
    { id: 7, label: '第 7 節', time: '1410-1500', start: '14:10', end: '15:00' },
    { id: 8, label: '第 8 節', time: '1510-1600', start: '15:10', end: '16:00' },
    { id: 9, label: '第 9 節', time: '1610-1700', start: '16:10', end: '17:00' },
    { id: 10, label: '第 10 節', time: '1710-1800', start: '17:10', end: '18:00' },
  ];

  // Helper to check if a course is in a specific period
  const getCourseAtPeriod = (day: number, periodStart: string) => {
    return courses.find(c => {
      return c.day === day && c.startTime === periodStart;
    });
  };

  // Calculate duration in periods
  const getPeriodSpan = (startTime: string, endTime: string) => {
    const startIndex = periods.findIndex(p => p.start === startTime);
    const endIndex = periods.findIndex(p => p.end === endTime);
    
    if (startIndex !== -1 && endIndex !== -1) {
        return endIndex - startIndex + 1;
    }
    
    return 1;
  };

  // 處理編輯課程
  const handleEditCourse = (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.warning('您沒有編輯權限');
      return;
    }
    setEditingCourse(course);
    setIsEditorOpen(true);
  };

  // 處理刪除課程
  const handleDeleteCourse = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) {
      toast.warning('您沒有編輯權限');
      return;
    }
    const confirmed = await confirm({
      title: '刪除課程',
      message: `確定要刪除「${course.name}」嗎？`,
      confirmText: '刪除',
      danger: true,
    });
    if (confirmed) {
      deleteCourse(course.id);
    }
  };

  // 儲存課程
  const handleSaveCourse = (course: Course) => {
    updateCourse(course.id, course);
  };

  // 開啟筆記編輯器
  const handleOpenNoteEditor = (course: Course, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCourse(course);
    setEditingNote(null);
    setIsNoteEditorOpen(true);
  };

  // 編輯筆記
  const handleEditNote = (note: CourseNote) => {
    const course = courses.find((c) => c.id === note.courseId);
    if (course) {
      setSelectedCourse(course);
      setEditingNote(note);
      setIsNoteEditorOpen(true);
    }
  };

  // 儲存筆記
  const handleSaveNote = async (noteData: Parameters<typeof addNote>[0]) => {
    try {
      if (editingNote) {
        await updateNote(editingNote.id, noteData);
      } else {
        await addNote(noteData);
      }
      setIsNoteEditorOpen(false);
      setSelectedCourse(null);
      setEditingNote(null);
    } catch (error) {
      console.error('儲存筆記失敗:', error);
    }
  };

  // 取得特定課程的筆記數量
  const getCourseNoteCount = (courseId: string) => {
    return notes.filter((note) => note.courseId === courseId).length;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass" style={{ padding: '1.5rem', minHeight: '600px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              大一下學期課表
            </h2>
            
            {/* 提示訊息 */}
            {canEdit && (
              <div className={styles.hint}>
                💡 滑鼠移到課程上可編輯或刪除
              </div>
            )}
            
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '600px', display: 'grid', gridTemplateColumns: 'minmax(100px, auto) repeat(5, 1fr)', gap: '1px', backgroundColor: 'var(--glass-border)' }}>
                {/* Header */}
                <div style={{ padding: '0.25rem', background: 'rgba(255,255,255,0.5)', textAlign: 'center' }}></div>
                {weekDays.map(d => (
                  <div key={d} style={{ padding: '0.25rem', background: 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    週{d}
                  </div>
                ))}

                {/* Grid */}
                {periods.map((period) => (
                  <Fragment key={period.id}>
                    {/* Period Label Column */}
                    <div style={{ 
                      padding: '0.1rem', textAlign: 'center', fontSize: '0.8rem', 
                      background: 'rgba(255,255,255,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      height: '48px', borderRight: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <div style={{ marginBottom: '0px', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{period.label}</div>
                      <div style={{ fontSize: '0.65rem', opacity: 0.8, lineHeight: '1' }}>{period.time.replace('-', '\n')}</div>
                    </div>
                    
                    {/* Days Columns */}
                    {Array.from({ length: 5 }).map((_, dayIndex) => {
                      const day = dayIndex + 1;
                      const course = getCourseAtPeriod(day, period.start);
                      const isOccupiedBySpan = courses.some(c => {
                          if (c.day !== day) return false;
                           const pStartIdx = periods.findIndex(p => p.start === c.startTime);
                           let pEndIdx = periods.findIndex(p => p.end === c.endTime);
                           if (pEndIdx === -1 && c.endTime === '18:00') pEndIdx = 9;

                           const currentIdx = periods.findIndex(p => p.id === period.id);
                           return currentIdx > pStartIdx && currentIdx <= pEndIdx;
                      });

                      if (isOccupiedBySpan) {
                          return null;
                      }
                      
                      if (course) {
                         const duration = getPeriodSpan(course.startTime, course.endTime);
                         const isHovered = hoveredCourse === course.id;
                         
                         return (
                          <div 
                            key={`${day}-${period.id}`} 
                            className={styles.courseCell}
                            onMouseEnter={() => setHoveredCourse(course.id)}
                            onMouseLeave={() => setHoveredCourse(null)}
                            style={{ 
                              gridRow: `span ${duration}`,
                              backgroundColor: course.color,
                              color: '#1f2937',
                              padding: '0.25rem',
                              margin: '2px',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              display: 'flex', 
                              flexDirection: 'column', 
                              justifyContent: 'center', 
                              alignItems: 'center',
                              boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
                              zIndex: isHovered ? 10 : 1,
                              position: 'relative',
                              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                              transition: 'all 0.2s ease',
                              cursor: canEdit ? 'pointer' : 'default'
                            }}
                          >
                            <div style={{ 
                              fontWeight: 'bold',
                              marginBottom: '2px', 
                              textAlign: 'center', 
                              lineHeight: '1.2', 
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(255,255,255,0.5)'
                            }}>
                              {course.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 'bold',
                              opacity: 0.9,
                              textShadow: '0 1px 1px rgba(255,255,255,0.4)'
                            }}>
                              {course.location}
                            </div>
                            
                            {/* 筆記數量標記 */}
                            {getCourseNoteCount(course.id) > 0 && (
                              <div className={styles.noteBadge}>
                                📝 {getCourseNoteCount(course.id)}
                              </div>
                            )}
                            
                            {/* Hover 時顯示操作按鈕 */}
                            {isHovered && (
                              <div className={styles.courseActions}>
                                <button 
                                  className={styles.noteButton}
                                  onClick={(e) => handleOpenNoteEditor(course, e)}
                                  title="筆記"
                                >
                                  📝
                                </button>
                                {canEdit && (
                                  <>
                                    <button 
                                      className={styles.editButton}
                                      onClick={(e) => handleEditCourse(course, e)}
                                      title="編輯"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                    </button>
                                    <button 
                                      className={styles.deleteButton}
                                      onClick={(e) => handleDeleteCourse(course, e)}
                                      title="刪除"
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                      
                      return <div key={`${day}-${period.id}`} style={{ background: 'rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.2)' }} />;
                    })}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
      </div>

      {/* 課程筆記區塊 */}
      <div className="glass" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', margin: 0 }}>
            📝 課程筆記
            {notes.length > 0 && (
              <span style={{ fontSize: '0.9rem', marginLeft: '8px', opacity: 0.7 }}>
                ({notes.length})
              </span>
            )}
          </h3>
          <button
            className={styles.toggleButton}
            onClick={() => setShowNotesSection(!showNotesSection)}
          >
            {showNotesSection ? '收合 ▲' : '展開 ▼'}
          </button>
        </div>

        {showNotesSection && (
          <>
            {notesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                載入筆記中...
              </div>
            ) : (
              <CourseNoteList
                notes={notes}
                onEdit={handleEditNote}
                onDelete={deleteNote}
                onToggleComplete={toggleCompletion}
              />
            )}
          </>
        )}
      </div>

      {/* 課程編輯器 */}
      <CourseEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingCourse(null);
        }}
        onSave={handleSaveCourse}
        course={editingCourse}
        mode="edit"
      />

      {/* 筆記編輯器 */}
      {isNoteEditorOpen && selectedCourse && (
        <CourseNoteEditor
          courseId={selectedCourse.id}
          courseName={selectedCourse.name}
          note={editingNote || undefined}
          onSave={handleSaveNote}
          onCancel={() => {
            setIsNoteEditorOpen(false);
            setSelectedCourse(null);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}
