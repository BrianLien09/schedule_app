'use client';
import { schoolSchedule, workShifts, importantEvents } from '../data/schedule';
import Link from 'next/link';
import { CalendarIcon, GamepadIcon, SchoolIcon, BriefcaseIcon } from '../components/Icons';
import { StatCard, CircularProgress, TimelineItem } from '../components/VisualComponents';

export default function Home() {
  // Simple logic to find "Next" items
  const nextClass = schoolSchedule[0]; 
  const nextShift = workShifts[0];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
  const todayDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5); // "HH:MM"
  const currentDayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)

  // 1. Calculate This Week's Classes
  const thisWeekClasses = schoolSchedule.filter(course => {
    return course.day >= 1 && course.day <= 7;
  }).length;
  
  // 2. Calculate This Month's Work
  const thisMonthWorkDays = workShifts.filter(s => s.date.startsWith(currentMonthStr)).length;
  
  // 3. Find Next Event Logic (Replaces Progress)
  const upcomingClasses = schoolSchedule
      .filter(c => c.day === currentDayOfWeek && c.startTime > currentTimeStr)
      .map(c => ({ type: 'class', time: c.startTime, title: c.name, location: c.location, id: c.id.toString() }));

  const upcomingWork = workShifts
      .filter(s => s.date === todayDateStr && s.startTime > currentTimeStr)
      .map(s => ({ type: 'work', time: s.startTime, title: s.note || '打工', location: '工作地點', id: s.id }));

  const allUpcoming = [...upcomingClasses, ...upcomingWork].sort((a,b) => a.time.localeCompare(b.time));
  const nextEvent = allUpcoming[0];

  // 4. Find Current Event Logic
  // Helper to interpret "09:00 - 12:00" logic (assuming standard 1hr classes if no end time, but data has endTime usually implied or fixed duration)
  // For simplicity, let's assume classes are 2 hours if not specified, or just check start times.
  // Actually, schedule.ts likely has fixed slots. But here we have start times.
  // Let's check ranges. workShifts has endTime. schoolSchedule usually implies slots.
  // We'll define current if: currentTime >= start && currentTime < end
  
  const currentClasses = schoolSchedule
      .filter(c => c.day === currentDayOfWeek && c.startTime <= currentTimeStr && (c.endTime || "23:59") > currentTimeStr)
      .map(c => ({ type: 'class', time: `${c.startTime} - ${c.endTime || '?'}`, title: c.name, location: c.location, id: c.id.toString() }));

  const currentWork = workShifts
      .filter(s => s.date === todayDateStr && s.startTime <= currentTimeStr && s.endTime > currentTimeStr)
      .map(s => ({ type: 'work', time: `${s.startTime} - ${s.endTime}`, title: s.note || '打工', location: '工作地點', id: s.id }));
      
  const currentEvent = [...currentClasses, ...currentWork][0];

  // 4. Today's Schedule List
  const todaySchedule = schoolSchedule
    .filter(course => course.day === currentDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .slice(0, 5);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      
      {/* Header */}
      <section style={{ textAlign: 'center', margin: 'var(--spacing-xl) 0' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)', background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome Back, Brian!
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '1.2rem' }}>今天也是充滿活力的一天 💪</p>
      </section>

      {/* 統計卡片區 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
        <StatCard 
          icon={<CalendarIcon size={32} />}
          label="本週課程"
          value={thisWeekClasses}
          subtext="堂課"
          color="var(--color-primary)"
        />
        <StatCard 
          icon={<CalendarIcon size={32} />}
          label="本月打工"
          value={thisMonthWorkDays}
          subtext="天"
          color="var(--color-highlight)"
        />
        <div className="glass card" style={{ 
          padding: '0', // Removing padding here to let children control it
          borderTop: '3px solid var(--color-accent)',
          background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(139, 92, 246, 0.1) 100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden' // Ensure rounded corners
        }}>
          {/* Top Section: Current Event */}
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', marginBottom: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="animate-pulse">●</span> {currentEvent ? '正在進行' : '目前狀態'}
              </div>
              
              {currentEvent ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '48px', height: '48px', 
                        borderRadius: '12px', 
                        background: currentEvent.type === 'class' ? 'rgba(124, 58, 237, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                        color: currentEvent.type === 'class' ? '#7c3aed' : '#b45309',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {currentEvent.type === 'class' ? <SchoolIcon size={28} /> : <BriefcaseIcon size={28} />}
                    </div>
                    <div>
                       <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{currentEvent.title}</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                          {currentEvent.time}
                       </div>
                    </div>
                 </div>
              ) : (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.8 }}>
                    <div style={{ 
                        width: '48px', height: '48px', 
                        borderRadius: '12px', 
                        background: 'rgba(59, 130, 246, 0.1)',
                        color: '#3b82f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                       <span style={{ fontSize: '24px' }}>☕</span>
                    </div>
                    <div>
                       <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--foreground)' }}>目前空檔</div>
                       <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>休息一下，準備迎接挑戰</div>
                    </div>
                 </div>
              )}
          </div>

          {/* Bottom Section: Next Event */}
          <div style={{ padding: 'var(--spacing-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '8px' }}>
                {nextEvent ? '稍後行程' : '今日後續'}
              </div>

              {nextEvent ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                        width: '40px', height: '40px', // Slightly smaller
                        borderRadius: '10px', 
                        background: nextEvent.type === 'class' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                        color: nextEvent.type === 'class' ? '#7c3aed' : '#b45309',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {nextEvent.type === 'class' ? <SchoolIcon size={20} /> : <BriefcaseIcon size={20} />}
                    </div>
                    <div>
                       <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--foreground)' }}>{nextEvent.title}</div>
                       <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
                          {nextEvent.time} <span style={{ color: 'var(--muted)' }}>@ {nextEvent.location}</span>
                       </div>
                    </div>
                 </div>
              ) : (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.6 }}>
                    <div style={{ 
                        width: '40px', height: '40px', 
                        borderRadius: '10px', 
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                       <span style={{ fontSize: '20px' }}>🌙</span>
                    </div>
                    <div>
                       <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--foreground)' }}>今日行程已結束</div>
                    </div>
                 </div>
              )}
          </div>
        </div>
      </div>

      <div className="grid-auto">
        {/* 今日時間軸 */}
        <section className="glass card">
          <h3 style={{ marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--spacing-sm)' }}>
            📅 今日課程
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            {todaySchedule.length > 0 ? (
              todaySchedule.map((item, idx) => (
                <TimelineItem 
                  key={item.id}
                  time={item.startTime}
                  title={item.name}
                  location={item.location}
                  isActive={idx === 0}  // 第一個項目標記為進行中
                  isPast={false}
                />
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: 'var(--spacing-xl)', 
                color: 'var(--muted)',
                fontSize: '1.1rem'
              }}>
                {currentDayOfWeek === 0 || currentDayOfWeek === 6 ? (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>🎉</div>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>今天是週末!</div>
                    <div style={{ fontSize: '0.9rem' }}>好好休息,享受美好時光 ✨</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-sm)' }}>☕</div>
                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>今天沒有課程</div>
                    <div style={{ fontSize: '0.9rem' }}>可以好好利用這段時間!</div>
                  </>
                )}
              </div>
            )}
          </div>
          
          <Link href="/schedule" className="btn" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center', marginTop: 'var(--spacing-lg)', display: 'block' }}>
            查看完整日程 &rarr;
          </Link>
        </section>

        {/* Important Events */}
        <section className="glass card">
          <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-secondary)' }}>⚡ 即將到來</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            {importantEvents
              .filter(event => event.date >= new Date().toISOString().split('T')[0])
              .map(event => (
              <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-sm)', borderRadius: '8px', transition: 'background 0.2s' }}>
                <div style={{ 
                  backgroundColor: event.type === 'deadline' ? '#ef4444' : event.type === 'holiday' ? '#10b981' : '#8b5cf6',
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{event.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{event.date}</div>
                </div>
                {event.type === 'deadline' && <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>緊急</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Current Month Work Shifts Summary */}
      <section className="glass card">
        <h3 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-highlight)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <CalendarIcon size={24} />
          <span>本月打工一覽 ({currentMonth}月)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {workShifts
            .filter(s => s.date.startsWith(currentMonthStr))
            .sort((a,b) => a.date.localeCompare(b.date))
            .map(shift => (
            <div key={shift.id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-md)', 
              padding: 'var(--spacing-md)', 
              backgroundColor: 'rgba(251, 191, 36, 0.15)', 
              borderRadius: '12px',
              borderLeft: '4px solid var(--color-highlight)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
                <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '1.2rem', minWidth: '50px', textAlign: 'center' }}>
                  {shift.date.split('-')[1]}/{shift.date.split('-')[2]}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{shift.note}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{shift.startTime} - {shift.endTime}</div>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ 
        marginTop: 'var(--spacing-xl)', padding: 'var(--spacing-xl)', borderRadius: '16px', 
        background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1) 0%, rgba(244, 114, 182, 0.1) 100%)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>休息一下?</h3>
        <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--muted)' }}>工作學習之餘,也別忘了放鬆心情。</p>
        <Link href="/games" className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <GamepadIcon size={20} />
          <span>前往攻略中心</span>
        </Link>
      </section>
    </div>
  );
}
