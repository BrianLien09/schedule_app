'use client';

import { EditorSegmented } from '@/components/shared/EditorForm';

export type EntryType = 'work' | 'todo';

interface EntryTypeTabsProps {
  value: EntryType;
  onChange: (value: EntryType) => void;
}

const OPTIONS: { value: EntryType; label: string }[] = [
  { value: 'work', label: '打工班表' },
  { value: 'todo', label: '代辦行程' },
];

/** 行程月曆新增彈窗頂端的類型切換：兩種表單共用同一個入口，使用者不必先決定從哪裡新增。 */
export default function EntryTypeTabs({ value, onChange }: EntryTypeTabsProps) {
  return <EditorSegmented value={value} options={OPTIONS} onChange={onChange} ariaLabel="新增類型" />;
}
