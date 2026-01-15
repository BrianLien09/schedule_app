'use client';
import { useWorkCalendar } from '../../../hooks/useWorkCalendar';
import { useIsMobile } from '../../../hooks/useIsMobile';
import styles from './page.module.css';

export default function WorkSchedulePage() {
  const { currentMonth, selectedDate, changeMonth, getDaysInMonth, getShiftsForDate, currentMonthShifts, handleDateClick } =
    useWorkCalendar();

  const isMobile = useIsMobile();

  const { days, startDay } = getDaysInMonth(currentMonth);

  return (
    <div className={styles.pageContainer}>
      <div className={`glass ${isMobile ? styles.calendarContainerMobile : styles.calendarContainer}`}>
        {/* Work Month Calendar */}
        <div>
          <div className="calendar-header">
            <button
              onClick={() => changeMonth(-1)}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              &larr; 上個月
            </button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {currentMonth.getFullYear()} 年 {currentMonth.getMonth() + 1} 月
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="btn"
              style={{ background: 'rgba(255,255,255,0.3)', color: 'white' }}
            >
              下個月 &rarr;
            </button>
          </div>

          {/* 週標題 */}
          <div className={isMobile ? styles.weekdaysGridMobile : styles.weekdaysGrid}>
            {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
              <div key={d} className={isMobile ? styles.weekdayLabelMobile : styles.weekdayLabel}>
                {d}
              </div>
            ))}
          </div>

          {/* 日期格子 */}
          <div className={isMobile ? styles.daysGridMobile : styles.daysGrid}>
            {/* 月初空白格 */}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className={isMobile ? styles.emptyCellMobile : styles.emptyCell} />
            ))}

            {/* 日期 */}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const shifts = getShiftsForDate(day);
              const hasShifts = shifts.length > 0;

              return (
                <div
                  key={day}
                  onClick={() => hasShifts && handleDateClick(day)}
                  className={`${isMobile ? styles.dayCellMobile : styles.dayCell} ${
                    hasShifts ? styles.dayCellWithShift : styles.dayCellEmpty
                  } ${hasShifts ? 'card' : ''}`}
                >
                  <div
                    className={`${isMobile ? styles.dayNumberMobile : styles.dayNumber} ${
                      hasShifts ? styles.dayNumberWithShift : styles.dayNumberEmpty
                    }`}
                  >
                    {day}
                  </div>
                  {shifts.map((shift) => (
                    <div key={shift.id} className={isMobile ? styles.shiftBadgeMobile : styles.shiftBadge}>
                      {shift.note || '打工'}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 詳細列表 */}
          <div className={styles.detailsSection}>
            <h3 className={styles.sectionTitle}>本月詳細列表</h3>
            <div className={styles.shiftsGrid}>
              {currentMonthShifts.map((shift: any) => {
                const isSelected = selectedDate === shift.date;
                return (
                  <div
                    key={shift.id}
                    data-date={shift.date}
                    className={`${styles.shiftCard} ${isSelected ? styles.shiftCardSelected : styles.shiftCardNormal}`}
                  >
                    <div className={styles.shiftDate}>{shift.date.split('-')[2]}日</div>
                    <div className={styles.shiftDetails}>
                      <div className={styles.shiftName}>{shift.note}</div>
                      <div className={styles.shiftTime}>
                        {shift.startTime} - {shift.endTime}
                      </div>
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

