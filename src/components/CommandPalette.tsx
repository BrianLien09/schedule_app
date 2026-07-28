'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SchoolIcon,
  BriefcaseIcon,
  GamepadIcon,
  ToolboxIcon,
  WalletIcon,
  CalculatorIcon,
} from './Icons';
import styles from './CommandPalette.module.css';

interface CommandItem {
  id: string;
  title: string;
  category: '頁面跳轉' | '快捷操作' | '工具';
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenQuickModal?: (tab: 'allowance' | 'work') => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenQuickModal }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 定義選單項目
  const commands: CommandItem[] = [
    {
      id: 'nav-home',
      title: '前往 首頁 Dashboard',
      category: '頁面跳轉',
      icon: <ToolboxIcon size={18} />,
      action: () => router.push('/'),
    },
    {
      id: 'nav-school',
      title: '前往 學校課表',
      category: '頁面跳轉',
      icon: <SchoolIcon size={18} />,
      action: () => router.push('/schedule/school'),
    },
    {
      id: 'nav-work',
      title: '前往 打工班表',
      category: '頁面跳轉',
      icon: <BriefcaseIcon size={18} />,
      action: () => router.push('/schedule/work'),
    },
    {
      id: 'nav-allowance',
      title: '前往 生活費記錄',
      category: '頁面跳轉',
      icon: <WalletIcon size={18} />,
      action: () => router.push('/tools/allowance'),
    },
    {
      id: 'nav-salary',
      title: '前往 薪資計算器',
      category: '頁面跳轉',
      icon: <CalculatorIcon size={18} />,
      action: () => router.push('/tools/salary'),
    },
    {
      id: 'nav-games',
      title: '前往 遊戲攻略筆記',
      category: '頁面跳轉',
      icon: <GamepadIcon size={18} />,
      action: () => router.push('/games'),
    },
    {
      id: 'action-quick-allowance',
      title: '💵 快速記錄生活費 (Quick Entry)',
      category: '快捷操作',
      icon: <WalletIcon size={18} />,
      action: () => {
        onOpenQuickModal?.('allowance');
      },
    },
    {
      id: 'action-quick-work',
      title: '💼 快速登記打工班表 (Quick Shift)',
      category: '快捷操作',
      icon: <BriefcaseIcon size={18} />,
      action: () => {
        onOpenQuickModal?.('work');
      },
    },
  ];

  // 搜尋過濾
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // 當開啟時聚焦輸入框
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 鍵盤導航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? (filteredCommands.length || 1) - 1 : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="搜尋功能、頁面跳轉或快捷操作..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className={styles.kbdHint}>ESC 關閉</span>
        </div>

        <ul className={styles.resultsList}>
          {filteredCommands.length > 0 ? (
            filteredCommands.map((cmd, idx) => (
              <li
                key={cmd.id}
                className={`${styles.item} ${idx === selectedIndex ? styles.activeItem : ''}`}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
              >
                <div className={styles.itemLeft}>
                  <div className={styles.itemIcon}>{cmd.icon}</div>
                  <span className={styles.itemTitle}>{cmd.title}</span>
                </div>
                <span className={styles.itemCategory}>{cmd.category}</span>
              </li>
            ))
          ) : (
            <div className={styles.emptyState}>找不到符合的搜尋結果 🔍</div>
          )}
        </ul>

        <div className={styles.footer}>
          <div className={styles.shortcutGuide}>
            <span>↑↓ 選擇</span>
            <span>↵ 執行</span>
            <span>ESC 離開</span>
          </div>
          <span>Schedule App Quick Navigation</span>
        </div>
      </div>
    </div>
  );
}
