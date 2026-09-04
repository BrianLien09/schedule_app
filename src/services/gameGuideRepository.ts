import { orderBy } from 'firebase/firestore';
import type { GameGuide } from '@/data/gameGuides';
import {
  addSharedDocument,
  deleteSharedDocument,
  getSharedDocuments,
  subscribeToSharedCollection,
  updateSharedDocument,
} from '@/services/firestoreService';
import { SHARED_COLLECTIONS } from '@/services/firestoreCollections';

const GAME_GUIDES_COLLECTION = SHARED_COLLECTIONS.gameGuides;

export function getAllGameGuides(): Promise<GameGuide[]> {
  return getSharedDocuments<GameGuide>(GAME_GUIDES_COLLECTION, orderBy('order', 'asc'));
}

export function subscribeToGameGuides(
  callback: (guides: GameGuide[]) => void
) {
  return subscribeToSharedCollection<GameGuide>(
    GAME_GUIDES_COLLECTION,
    callback,
    orderBy('order', 'asc')
  );
}

export function addGameGuide(guide: Omit<GameGuide, 'id'>): Promise<string> {
  return addSharedDocument(GAME_GUIDES_COLLECTION, guide);
}

export function updateGameGuide(
  guideId: string,
  updates: Partial<GameGuide>
): Promise<void> {
  return updateSharedDocument(GAME_GUIDES_COLLECTION, guideId, updates);
}

export function deleteGameGuide(guideId: string): Promise<void> {
  return deleteSharedDocument(GAME_GUIDES_COLLECTION, guideId);
}

export async function batchImportGameGuides(
  guides: Array<Omit<GameGuide, 'id'>>
): Promise<void> {
  await Promise.all(guides.map(addGameGuide));
}
