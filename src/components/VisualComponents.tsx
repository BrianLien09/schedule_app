// 統計卡片與視覺化元件

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}

export const StatCard = ({ icon, label, value, subtext, color }: StatCardProps) => (
  <div 
    className="glass card" 
    style={{ 
      padding: 'var(--spacing-md)', 
      textAlign: 'center',
      borderTop: `3px solid ${color}`,
      transition: 'all 300ms ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <div style={{ 
      color: color, 
      marginBottom: 'var(--spacing-sm)',
      display: 'flex',
      justifyContent: 'center'
    }}>
      {icon}
    </div>
    <div style={{ fontSize: '1rem', color: 'var(--muted)', marginBottom: 'var(--spacing-xs)', fontWeight: 'bold' }}>
      {label}
    </div>
    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: 'var(--spacing-xs)' }}>
      {value}
    </div>
    {subtext && (
      <div style={{ fontSize: '0.9rem', color: 'var(--muted-dark)' }}>
        {subtext}
      </div>
    )}
  </div>
);

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label: string;
}

export const CircularProgress = ({ 
  percentage, 
  size = 80, 
  strokeWidth = 8, 
  color, 
  label 
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* 背景圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* 進度圓環 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{ marginTop: 'var(--spacing-xs)', fontSize: '0.85rem', color: 'var(--muted)' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: color }}>
        {percentage}%
      </div>
    </div>
  );
};

interface TimelineItemProps {
  time: string;
  title: string;
  location?: string;
  isActive?: boolean;
  isPast?: boolean;
}

export const TimelineItem = ({ time, title, location, isActive, isPast }: TimelineItemProps) => (
  <div style={{ 
    display: 'flex', 
    gap: 'var(--spacing-md)',
    opacity: isPast ? 0.5 : 1,
    position: 'relative',
    paddingLeft: 'var(--spacing-lg)'
  }}>
    {/* 時間軸線與點 */}
    <div style={{ 
      position: 'absolute',
      left: '8px',
      top: 0,
      bottom: 0,
      width: '2px',
      background: isActive ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)'
    }} />
    <div style={{ 
      position: 'absolute',
      left: '2px',
      top: '8px',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      background: isActive ? 'var(--color-primary)' : isPast ? 'var(--muted-dark)' : 'var(--glass-border)',
      border: `2px solid ${isActive ? 'var(--color-primary)' : 'var(--glass-border)'}`,
      boxShadow: isActive ? '0 0 12px var(--color-primary)' : 'none'
    }} />
    
    <div style={{ flex: 1, paddingLeft: 'var(--spacing-md)' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 'var(--spacing-xs)' }}>
        {time}
      </div>
      <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
        {title}
      </div>
      {location && (
        <div style={{ fontSize: '0.85rem', color: 'var(--muted-dark)' }}>
          📍 {location}
        </div>
      )}
    </div>
  </div>
);
