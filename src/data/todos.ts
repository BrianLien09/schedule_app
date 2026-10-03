import type { CourseNote } from '@/data/courseNotes';

export interface Todo {
  id: string;
  type: 'todo';
  title: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  association: 'none' | 'course' | 'work';
  associationId: string;
  associationLabel: string;
  syncToFamily: boolean;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  priority?: 'low' | 'medium' | 'high';
}
export type TodoInput = Omit<Todo, 'id' | 'type' | 'completed' | 'createdAt' | 'updatedAt'>;
export type AgendaTask = Todo | CourseNote;
