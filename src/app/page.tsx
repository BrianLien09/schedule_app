'use client';
import { schoolSchedule, workShifts, importantEvents } from '../data/schedule';
import Link from 'next/link';

export default function Home() {
  // Simple logic to find "Next" items (mock logic since we don't have real-time date matching perfectly in static build without date libs)
  const nextClass = schoolSchedule[0]; 
  const nextShift = workShifts[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <section style={{ textAlign: 'center', margin: '2rem 0' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Welcome Back, Brian!
        </h2>
        <p style={{ opacity: 0.8, fontSize: '1.2rem' }}>今天也是充滿活力的一天 💪</p>
      </section>

      <div className="grid-auto">
        {/* Today's Overview */}
        <section className="glass card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'var(--color-primary)', borderRadius: '50%', opacity: 0.1 }} />
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
            今日概況
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>下一堂課</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{nextClass.name}</div>
              <div style={{ color: 'var(--color-primary)' }}>{nextClass.startTime} @ {nextClass.location}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>下次打工</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{nextShift.date}</div>
              <div style={{ color: 'var(--color-highlight)' }}>{nextShift.startTime} - {nextShift.endTime} ({nextShift.note})</div>
            </div>
            
            <Link href="/schedule" className="btn" style={{ background: 'var(--color-primary)', color: 'white', textAlign: 'center', marginTop: '1rem' }}>
              查看完整日程 &rarr;
            </Link>
          </div>
        </section>

        {/* Important Events */}
        <section className="glass card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>即將到來</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {importantEvents.map(event => (
              <div key={event.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s' }}>
                <div style={{ 
                  backgroundColor: event.type === 'deadline' ? '#ef4444' : event.type === 'holiday' ? '#10b981' : '#8b5cf6',
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{event.title}</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{event.date}</div>
                </div>
                {event.type === 'deadline' && <span style={{ fontSize: '0.8rem', background: '#fee2e2', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>緊急</span>}
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Current Month Work Shifts Summary */}
      <section className="glass card">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-highlight)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📅</span> 本月打工一覽 (1月)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {workShifts
            .filter(s => s.date.startsWith('2026-01'))
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
                <div style={{ fontWeight: 'bold', color: '#b45309', fontSize: '1.2rem', minWidth: '50px', textAlign: 'center' }}>
                  {shift.date.split('-')[1]}/{shift.date.split('-')[2]}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{shift.note}</div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.8, color: 'var(--foreground)' }}>{shift.startTime} - {shift.endTime}</div>
                </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ 
        marginTop: '2rem', padding: '2rem', borderRadius: '16px', 
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>休息一下？</h3>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>工作學習之餘，也別忘了放鬆心情。</p>
        <Link href="/games" className="btn" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          前往攻略中心 🎮
        </Link>
      </section>
    </div>
  );
}
