import { collection, doc, getDocsFromServer, query, where, writeBatch } from 'firebase/firestore';
import type { Todo } from '@/data/todos';
import { familyDb } from '@/lib/firebase';
import { hasFamilyWebSyncAccess } from '@/config/permissions';
import { FAMILY_COLLECTIONS, PERSONAL_COLLECTIONS } from '@/services/firestoreCollections';
import { setDocument, deleteDocument, subscribeToCollectionWithError } from '@/services/firestoreService';
import { trackDataOperation } from '@/services/dataStatusStore';
import { familyTodoPayload, todoDates } from '@/utils/todos';

export function subscribeTodos(uid: string, callback: (todos: Todo[]) => void, onError: (error: Error) => void): () => void {
  return subscribeToCollectionWithError(uid, PERSONAL_COLLECTIONS.todos, callback, onError);
}
export async function saveTodo(uid: string, todo: Todo): Promise<void> {
  await setDocument(uid, PERSONAL_COLLECTIONS.todos, todo.id, todo);
}
export async function removeTodo(uid: string, id: string): Promise<void> {
  await deleteDocument(uid, PERSONAL_COLLECTIONS.todos, id);
}

/** 只保留同一待辦的起訖日，重新同步時移除原有的中間日期與舊日期。 */
export async function syncTodoToFamily(uid: string, email: string | null | undefined, todo: Todo, remove = false): Promise<void> {
  const database = familyDb;
  if (!database || !hasFamilyWebSyncAccess(email)) throw new Error('家庭同步尚未設定或此帳號沒有同步權限');
  await trackDataOperation('family', `todo:${uid}:${todo.id}`, async () => {
    const target = collection(database, FAMILY_COLLECTIONS.schedules);
    const existing = await getDocsFromServer(query(target, where('ownerUid', '==', uid), where('todoId', '==', todo.id)));
    const dates = !remove && todo.syncToFamily && !todo.completed ? todoDates(todo) : [];
    const desired = new Map(dates.map((date) => [`todo_${uid}_${todo.id}_${date}`, date]));
    const writes = [
      ...existing.docs.filter((entry) => !desired.has(entry.id)).map((entry) => ({ ref: entry.ref, payload: null })),
      ...[...desired].map(([id, date]) => ({ ref: doc(target, id), payload: familyTodoPayload(todo, uid, date) })),
    ];
    for (let offset = 0; offset < writes.length; offset += 450) {
      const batch = writeBatch(database);
      for (const write of writes.slice(offset, offset + 450)) {
        if (write.payload) batch.set(write.ref, write.payload); else batch.delete(write.ref);
      }
      await batch.commit();
    }
  });
}
