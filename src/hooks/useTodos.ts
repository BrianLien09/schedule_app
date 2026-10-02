'use client';

import { startTransition, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Todo, TodoInput } from '@/data/todos';
import { subscribeTodos, saveTodo, removeTodo, syncTodoToFamily } from '@/services/todoRepository';
import { validateTodo } from '@/utils/todos';
import { hasFamilyWebSyncAccess } from '@/config/permissions';

export function useTodos() {
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    startTransition(() => { setTodos([]); setError(null); setLoading(Boolean(user)); });
    if (!user) return;
    try {
      return subscribeTodos(user.uid, (items) => { setTodos(items); setLoading(false); }, (failure) => { setError(failure.message); setLoading(false); });
    } catch (failure) {
      startTransition(() => { setError(failure instanceof Error ? failure.message : '待辦讀取失敗'); setLoading(false); });
    }
  }, [user]);

  const persist = async (todo: Todo, previouslySynced: boolean): Promise<boolean> => {
    if (!user) throw new Error('請先登入');
    await saveTodo(user.uid, todo);
    if (todo.syncToFamily || previouslySynced) {
      try { await syncTodoToFamily(user.uid, user.email, todo); } catch { return false; }
    }
    return true;
  };
  const save = async (input: TodoInput, existing?: Todo): Promise<boolean> => {
    const failure = validateTodo(input);
    if (failure) throw new Error(failure);
    if (input.syncToFamily && !hasFamilyWebSyncAccess(user?.email)) throw new Error('此帳號沒有家庭同步權限');
    const now = new Date().toISOString();
    return persist({ ...input, title: input.title.trim(), id: existing?.id ?? crypto.randomUUID(), type: 'todo', completed: existing?.completed ?? false, createdAt: existing?.createdAt ?? now, updatedAt: now }, existing?.syncToFamily ?? false);
  };
  const complete = async (todo: Todo): Promise<boolean> => persist({ ...todo, completed: true, updatedAt: new Date().toISOString() }, todo.syncToFamily);
  const remove = async (todo: Todo): Promise<boolean> => {
    if (!user) throw new Error('請先登入');
    await removeTodo(user.uid, todo.id);
    if (todo.syncToFamily) {
      try { await syncTodoToFamily(user.uid, user.email, todo, true); } catch { return false; }
    }
    return true;
  };
  return { todos, loading, error, save, complete, remove };
}
