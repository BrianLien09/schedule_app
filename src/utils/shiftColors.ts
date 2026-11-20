export interface ShiftColor {
  backgroundColor: string;
  color: string;
}

// 講師、助教固定色，其他自訂班別依名稱雜湊取色；同一個班別在月曆、清單、手機色條都會是同一個顏色
const FALLBACK_PALETTE: ShiftColor[] = [
  { backgroundColor: '#b87e6b', color: '#f0ece1' },
  { backgroundColor: '#6b8e78', color: '#f0ece1' },
  { backgroundColor: '#886b86', color: '#f0ece1' },
  { backgroundColor: '#78716c', color: '#f0ece1' },
  { backgroundColor: '#9e6d5b', color: '#f0ece1' },
];

/** 依班別名稱與職稱決定班次顏色 */
export function getShiftColor(title: string, role?: string): ShiftColor {
  const isInstructor = role === 'instructor' || title.includes('講師');
  const isAssistant = role === 'assistant' || title.includes('助教');
  if (isInstructor) return { backgroundColor: '#c88d55', color: '#f0ece1' };
  if (isAssistant) return { backgroundColor: '#5f7186', color: '#f0ece1' };

  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return FALLBACK_PALETTE[Math.abs(hash) % FALLBACK_PALETTE.length];
}
