import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

/** 載入中的占位塊，光帶樣式定義於 globals.css 的 .skeleton */
export default function Skeleton({ width = '100%', height = '1rem', className }: SkeletonProps) {
  const style: CSSProperties = { width, height };
  return <div className={`skeleton ${className ?? ''}`} style={style} aria-hidden="true" />;
}
