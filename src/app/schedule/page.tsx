'use client';
import { Fragment, useState } from 'react';
import { schoolSchedule, workShifts } from '../../data/schedule';

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState<'school' | 'work'>('school');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); // Default to Jan 2026

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
    { id: 11, label: '第 11 節', time: '1810-1900', start: '18:10', end: '19:00' },
  ];

  // Helper to check if a course is in a specific period
  const getCourseAtPeriod = (day: number, periodStart: string) => {
    return schoolSchedule.find(c => {
      // Simple string match assumption since data matches period starts exactly
      // For more robustness, we could compare time values
      return c.day === day && c.startTime === periodStart;
    });
  };

  // Calculate duration in periods
  const getPeriodSpan = (startTime: string, endTime: string) => {
    const startIndex = periods.findIndex(p => p.start === startTime);
    const endIndex = periods.findIndex(p => p.end === endTime);
    if (startIndex === -1 || endIndex === -1) return 1;
    return endIndex - startIndex + 1;
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    
    // Adjust for Monday start: Mon=0, Sun=6
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    
    return { days, startDay };
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getShiftsForDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    return workShifts.filter(s => s.date === dateStr);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('school')}
          className={`btn ${activeTab === 'school' ? 'active' : ''}`}
          style={{ 
            backgroundColor: activeTab === 'school' ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
            color: activeTab === 'school' ? 'white' : 'var(--foreground)',
            fontSize: '1.1rem', padding: '0.75rem 2rem'
          }}
        >
          🏫 學校課表
        </button>
        <button 
          onClick={() => setActiveTab('work')}
          className={`btn ${activeTab === 'work' ? 'active' : ''}`}
          style={{ 
            backgroundColor: activeTab === 'work' ? 'var(--color-highlight)' : 'rgba(255,255,255,0.5)',
            color: activeTab === 'work' ? 'white' : 'var(--foreground)',
             fontSize: '1.1rem', padding: '0.75rem 2rem'
          }}
        >
          💼 打工月曆
        </button>
      </div>

      <div className="glass" style={{ padding: '1.5rem', minHeight: '600px' }}>
        {activeTab === 'school' ? (
          /* School Schedule view - Mon-Fri Only */
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
              每週課表 (週一至週五)
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
                      const isOccupiedBySpan = schoolSchedule.some(c => {
                          if (c.day !== day) return false;
                           // Check if this period is inside a spanning course but NOT the start
                           const pStartIdx = periods.findIndex(p => p.start === c.startTime);
                           const pEndIdx = periods.findIndex(p => p.end === c.endTime);
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
                            color: 'white',
                            padding: '0.25rem',
                            margin: '2px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            zIndex: 1,
                            position: 'relative'
                          }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '2px', textAlign: 'center', lineHeight: '1.2' }}>{course.name}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>{course.location}</div>
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
        ) : (
          /* Work Month Calendar */
          <div>
             <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} className="btn" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>&larr; 上個月</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                   {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
                </h2>
                <button onClick={() => changeMonth(1)} className="btn" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>下個月 &rarr;</button>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem' }}>
                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                   <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontWeight: 'bold', opacity: 0.7 }}>{d}</div>
                ))}
                
                {/* Empty cells for start of month */}
                {Array.from({ length: getDaysInMonth(currentMonth).startDay }).map((_, i) => (
                   <div key={`empty-${i}`} style={{ minHeight: '80px' }} />
                ))}

                {/* Days */}
                {Array.from({ length: getDaysInMonth(currentMonth).days }).map((_, i) => {
                   const day = i + 1;
                   const shifts = getShiftsForDate(day);
                   const isToday = false; // TODO: Implement if needed, requires hydration safe date check

                   return (
                      <div key={day} style={{ 
                         minHeight: '80px', 
                         backgroundColor: shifts.length > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.3)',
                         borderRadius: '12px',
                         padding: '0.5rem',
                         display: 'flex', flexDirection: 'column',
                         border: shifts.length > 0 ? '2px solid var(--color-highlight)' : 'none',
                         transition: 'transform 0.2s',
                         cursor: shifts.length > 0 ? 'pointer' : 'default'
                      }}
                      className={shifts.length > 0 ? 'card' : ''}
                      >
                         <div style={{ fontWeight: 'bold', marginBottom: '0.2rem', color: shifts.length > 0 ? '#b45309' : 'inherit' }}>{day}</div>
                         {shifts.map(shift => (
                            <div key={shift.id} style={{ 
                               fontSize: '0.75rem', 
                               backgroundColor: '#b45309', 
                               color: 'white', 
                               padding: '2px 4px', 
                               borderRadius: '4px',
                               marginBottom: '2px',
                               whiteSpace: 'nowrap',
                               overflow: 'hidden',
                               textOverflow: 'ellipsis'
                            }}>
                               {shift.note || '打工'}
                            </div>
                         ))}
                      </div>
                   );
                })}
             </div>
             
             {/* List view for selected month's shifts below calendar for detail */}
             <div style={{ marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>本月詳細列表</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                   {workShifts
                     .filter(s => {
                        const d = new Date(s.date);
                        return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                     })
                     .sort((a,b) => a.date.localeCompare(b.date))
                     .map(shift => (
                      <div key={shift.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        backgroundColor: 'rgba(251, 191, 36, 0.15)', 
                        borderRadius: '12px',
                        borderLeft: '4px solid var(--color-highlight)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}>
                         <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '1.2rem', minWidth: '50px', textAlign: 'center' }}>{shift.date.split('-')[2]}日</div>
                         <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{shift.note}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--foreground)' }}>{shift.startTime} - {shift.endTime}</div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
