import { orderBy, where } from 'firebase/firestore';
import type { CourseNote } from '@/data/courseNotes';
import {
  addDocument,
  deleteDocument,
  getDocuments,
  subscribeToCollection,
  updateDocument,
} from '@/services/firestoreService';
import { PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';

const COURSE_NOTES_COLLECTION = PERSONAL_COLLECTIONS.courseNotes;

export function getAllCourseNotes(userId: string): Promise<CourseNote[]> {
  return getDocuments<CourseNote>(userId, COURSE_NOTES_COLLECTION);
}

export function getCourseNotesByCourse(
  userId: string,
  courseId: string
): Promise<CourseNote[]> {
  return getDocuments<CourseNote>(
    userId,
    COURSE_NOTES_COLLECTION,
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc')
  );
}

export function subscribeToCourseNotes(
  userId: string,
  callback: (notes: CourseNote[]) => void
) {
  return subscribeToCollection<CourseNote>(
    userId,
    COURSE_NOTES_COLLECTION,
    callback,
    orderBy('createdAt', 'desc')
  );
}

export function subscribeToCourseNotesByCourse(
  userId: string,
  courseId: string,
  callback: (notes: CourseNote[]) => void
) {
  return subscribeToCollection<CourseNote>(
    userId,
    COURSE_NOTES_COLLECTION,
    callback,
    where('courseId', '==', courseId),
    orderBy('createdAt', 'desc')
  );
}

export function addCourseNote(
  userId: string,
  note: Omit<CourseNote, 'id'>
): Promise<string> {
  return addDocument(userId, COURSE_NOTES_COLLECTION, note);
}

export function updateCourseNote(
  userId: string,
  noteId: string,
  updates: Partial<CourseNote>
): Promise<void> {
  return updateDocument(userId, COURSE_NOTES_COLLECTION, noteId, updates);
}

export function deleteCourseNote(userId: string, noteId: string): Promise<void> {
  return deleteDocument(userId, COURSE_NOTES_COLLECTION, noteId);
}

export function toggleCourseNoteCompletion(
  userId: string,
  noteId: string,
  completed: boolean
): Promise<void> {
  return updateCourseNote(userId, noteId, { completed });
}

export async function getIncompleteTasks(userId: string): Promise<CourseNote[]> {
  const notes = await getDocuments<CourseNote>(
    userId,
    COURSE_NOTES_COLLECTION,
    where('completed', '==', false),
    where('type', 'in', ['homework', 'exam'])
  );

  return notes
    .filter((note) => note.dueDate)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
}
