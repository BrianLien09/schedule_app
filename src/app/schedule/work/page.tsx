'use client';
import { useState, useEffect } from 'react';
import { workShifts } from '../../../data/schedule';

export default function WorkSchedulePage() {
  // Default to Jan 2026
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1)); 
  const [isMobile, setIsMobile] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDateClick = (day: number) => {
     const year = currentMonth.getFullYear();
     const month = currentMonth.getMonth() + 1;
     const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
     
     setSelectedDate(dateStr);
     
     // Find the element and scroll
     // We need to find *any* shift for this date to scroll to.
     // Since one day can have multiple shifts, we scroll to the first one found or a container.
     // In the list below, we map through shifts. Let's make sure IDs are findable.
     // We will use the date string as ID prefix or just search by data-date.
     
     setTimeout(() => {
         const element = document.querySelector(`[data-date="${dateStr}"]`);
         if (element) {
             element.scrollIntoView({ behavior: 'smooth', block: 'center' });
         }
     }, 100);
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
      <div className="glass" style={{ padding: isMobile ? '0.5rem' : '1.5rem', minHeight: '600px' }}>
          {/* Work Month Calendar */}
          <div>
             <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} className="btn" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>&larr; 上個月</button>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                   {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
                </h2>
                <button onClick={() => changeMonth(1)} className="btn" style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}>下個月 &rarr;</button>
             </div>

             <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', 
                gap: isMobile ? '2px' : '0.5rem' 
             }}>
                {['一', '二', '三', '四', '五', '六', '日'].map(d => (
                   <div key={d} style={{ 
                      textAlign: 'center', 
                      padding: isMobile ? '2px' : '0.5rem', 
                      fontWeight: 'bold', 
                      opacity: 0.7,
                      fontSize: isMobile ? '10px' : '1rem'
                   }}>{d}</div>
                ))}
                
                {/* Empty cells for start of month */}
                {Array.from({ length: getDaysInMonth(currentMonth).startDay }).map((_, i) => (
                   <div key={`empty-${i}`} style={{ 
                      aspectRatio: isMobile ? '1' : undefined,
                      minHeight: isMobile ? undefined : '110px'
                   }} />
                ))}

                {/* Days */}
                {Array.from({ length: getDaysInMonth(currentMonth).days }).map((_, i) => {
                   const day = i + 1;
                   const shifts = getShiftsForDate(day);

                   return (
                      <div key={day} 
                        onClick={() => shifts.length > 0 && handleDateClick(day)}
                        style={{ 
                           aspectRatio: isMobile ? '1' : undefined,
                           minHeight: isMobile ? undefined : '110px',
                           backgroundColor: shifts.length > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255,255,255,0.3)',
                           borderRadius: isMobile ? '8px' : '12px',
                           padding: isMobile ? '2px' : '0.5rem',
                           display: 'flex', flexDirection: 'column',
                           border: shifts.length > 0 ? '2px solid var(--color-highlight)' : 'none',
                           transition: 'transform 0.2s',
                           cursor: shifts.length > 0 ? 'pointer' : 'default',
                           overflow: 'hidden'
                        }}
                        className={shifts.length > 0 ? 'card' : ''}
                      >
                         <div style={{ 
                            fontWeight: 'bold', 
                            marginBottom: isMobile ? '2px' : '0.2rem', 
                            color: shifts.length > 0 ? '#b45309' : 'inherit',
                            fontSize: isMobile ? '12px' : '1rem'
                         }}>{day}</div>
                         {shifts.map(shift => (
                            <div key={shift.id} style={{
                               fontSize: isMobile ? '9px' : '0.75rem',
                               backgroundColor: '#b45309',
                               color: 'white',
                               padding: isMobile ? '0 2px' : '2px 4px',
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
                     .map(shift => {
                       const isSelected = selectedDate === shift.date;
                       return (
                      <div key={shift.id} data-date={shift.date} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '1rem', 
                        padding: '1rem', 
                        backgroundColor: isSelected ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.15)', 
                        borderRadius: '12px',
                        borderLeft: isSelected ? '4px solid white' : '4px solid var(--color-highlight)',
                        boxShadow: isSelected ? '0 0 15px rgba(251, 191, 36, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                        transition: 'all 0.3s ease',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)'
                      }}>
                         <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '1.2rem', minWidth: '50px', textAlign: 'center' }}>{shift.date.split('-')[2]}日</div>
                         <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{shift.note}</div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--foreground)' }}>{shift.startTime} - {shift.endTime}</div>
                         </div>
                      </div>
                       );
                    })}
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}
