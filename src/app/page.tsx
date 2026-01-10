'use client';
import { schoolSchedule, workShifts, importantEvents } from '../data/schedule';
import Link from 'next/link';
import { CalendarIcon, GamepadIcon } from '../components/Icons';
import { StatCard, CircularProgress, TimelineItem } from '../components/VisualComponents';

export default function Home() {
  // Simple logic to find "Next" items
  const nextClass = schoolSchedule[0]; 
  const nextShift = workShifts[0];

  // 計算統計數據
  const today = new Date().toISOString().split('T')[0];
  
  // 本週課程數 - 基於當前週的星期幾計算
  const currentDay = new Date().getDay(); // 0 (Sun) - 6 (Sat)
  const thisWeekClasses = schoolSchedule.filter(course => {
    // 本週的課程 (假設週一到週日)
    return course.day >= 1 && course.day <= 7;
  }).length;
  
  const thisMonthWorkDays = workShifts.filter(s => s.date.startsWith('2026-01')).length;
  
  // 計算今日進度 (假設一天從 8:00 開始,到 22:00 結束)
  const now = new Date();
  const currentHour = now.getHours();
  const dayProgress = Math.max(0, Math.min(100, ((currentHour - 8) / 14) * 100));

  // 今日課程時間軸 - 根據今天星期幾篩選
  const currentDayOfWeek = now.getDay(); // 0 (日) - 6 (六)
  const todaySchedule = schoolSchedule
    .filter(course => course.day === currentDayOfWeek)  // 只顯示今天的課程
    .sort((a, b) => a.startTime.localeCompare(b.startTime))  // 按時間排序
    .slice(0, 5);  // 最多顯示5堂課


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
          padding: 'var(--spacing-md)', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '3px solid var(--color-accent)'
        }}>
          <CircularProgress 
            percentage={Math.round(dayProgress)}
            size={100}
            strokeWidth={8}
            color="var(--color-accent)"
            label="今日進度"
          />
        </div>
      </div>

      <div className="grid-auto">
        {/* 今日時間軸 */}
        <section className="glass card">
          <h3 style={{ marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--glass-border)', paddingBottom: 'var(--spacing-sm)' }}>
            📅 今日行程
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
          <span>本月打工一覽 (1月)</span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--spacing-md)' }}>
          {workShifts
            .filter(s => s.date.startsWith('2026-01'))
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
