'use client';
import { Fragment } from 'react';
import { useScheduleData } from '../../../hooks/useScheduleData';
import { useAuth } from '../../../context/AuthContext';
import LoginPrompt from '../../../components/LoginPrompt';

export default function SchoolSchedulePage() {
  const { user, loading: authLoading } = useAuth();
  
  // 使用新的資料管理 hook
  const { courses } = useScheduleData();
  
  // 檢查登入狀態
  if (authLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>載入中...</div>;
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

  // 根據背景色計算最佳文字顏色 (確保對比度)
  const getTextColor = (bgColor: string | undefined): string => {
    if (!bgColor) return 'white';
    
    // 處理 CSS 變數 (如 var(--color-primary))
    if (bgColor.startsWith('var(')) {
      return 'white';  // CSS 變數預設使用白色
    }
    
    // 移除 # 符號
    const hex = bgColor.replace('#', '');
    
    // 轉換為 RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // 計算相對亮度 (WCAG 標準)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // 亮度 > 0.5 使用深色文字,否則使用白色
    return luminance > 0.5 ? '#1f2937' : 'white';
  };

  // Helper to check if a course is in a specific period
  const getCourseAtPeriod = (day: number, periodStart: string) => {
    return courses.find(c => {
      // Simple string match assumption since data matches period starts exactly
      // For more robustness, we could compare time values
      return c.day === day && c.startTime === periodStart;
    });
  };

  // Calculate duration in periods
  const getPeriodSpan = (startTime: string, endTime: string) => {
    // If times match period boundaries exactly
    const startIndex = periods.findIndex(p => p.start === startTime);
    const endIndex = periods.findIndex(p => p.end === endTime);
    
    // Fallback for custom times (like 15:10 to 18:00 covering periods 8, 9, 10)
    // 15:10 is start of P8, 18:00 is end of P10.
    
    if (startIndex !== -1 && endIndex !== -1) {
        return endIndex - startIndex + 1;
    }
    
    // Basic approximate calc if exact match fails
    return 1;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass" style={{ padding: '1.5rem', minHeight: '600px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              大一下學期課表
            </h2>
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
                           // Check if this period is inside a spanning course but NOT the start
                           const pStartIdx = periods.findIndex(p => p.start === c.startTime);
                           // Special handling for 18:00 end time matching period 10 end
                           let pEndIdx = periods.findIndex(p => p.end === c.endTime);
                           if (pEndIdx === -1 && c.endTime === '18:00') pEndIdx = 9; // Period 10 index

                           const currentIdx = periods.findIndex(p => p.id === period.id);
                           return currentIdx > pStartIdx && currentIdx <= pEndIdx;
                      });

                      if (isOccupiedBySpan) {
                          return null; // Don't render cell if occupied by a spanning course
                      }
                      
                      if (course) {
                         const duration = getPeriodSpan(course.startTime, course.endTime);
                         
                         return (
                          <div key={`${day}-${period.id}`} style={{ 
                            gridRow: `span ${duration}`,
                            backgroundColor: course.color,
                            color: '#1f2937',  // 統一使用深灰黑色文字
                            padding: '0.25rem',
                            margin: '2px',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 1,
                            position: 'relative'
                          }}>
                            <div style={{ 
                              fontWeight: 'bold',  // 粗體
                              marginBottom: '2px', 
                              textAlign: 'center', 
                              lineHeight: '1.2', 
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(255,255,255,0.5)'  // 柔和的白色陰影
                            }}>
                              {course.name}
                            </div>
                            <div style={{ 
                              fontSize: '0.85rem', 
                              fontWeight: 'bold',  // 粗體
                              opacity: 0.9,
                              textShadow: '0 1px 1px rgba(255,255,255,0.4)'  // 柔和的陰影
                            }}>
                              {course.location}
                            </div>
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
    </div>
  );
}
