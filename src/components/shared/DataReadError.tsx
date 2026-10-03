'use client';

import styles from './DataReadError.module.css';

export default function DataReadError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className={styles.error} role="alert">{message}<button type="button" onClick={() => window.location.reload()}>重新讀取</button></p>;
}
