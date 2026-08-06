import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

// 1. schedule-app Firebase Config
const scheduleFirebaseConfig = {
  apiKey: "AIzaSyCDo0pWieA1HghrjLDITQkk_Slxw6Svpf8",
  authDomain: "schedule-app-ed4c1.firebaseapp.com",
  projectId: "schedule-app-ed4c1",
  storageBucket: "schedule-app-ed4c1.firebasestorage.app",
  messagingSenderId: "725087132889",
  appId: "1:725087132889:web:966e88179291ae909672c8"
};

// 2. family-web Firebase Config
const familyFirebaseConfig = {
  apiKey: "AIzaSyA5IVEOzJVKtp4s7dL9fLna08bw8CRZrQQ",
  authDomain: "schedule-app-7a2c4.firebaseapp.com",
  projectId: "schedule-app-7a2c4",
  storageBucket: "schedule-app-7a2c4.firebasestorage.app",
  messagingSenderId: "334823230880",
  appId: "1:334823230880:web:974dcd5337c2f04e8f28c5"
};

const scheduleApp = initializeApp(scheduleFirebaseConfig, 'scheduleApp');
const familyApp = initializeApp(familyFirebaseConfig, 'familyApp');

const scheduleDb = getFirestore(scheduleApp);
const familyDb = getFirestore(familyApp);

async function runSync() {
  console.log('🔄 開始同步 2026 年 8 月的打工排班至 family-web...');

  // 從 schedule-app 讀取 salaryRecords 與 workShifts
  const salarySnap = await getDocs(collection(scheduleDb, 'shared', 'data', 'salaryRecords'));
  const workShiftSnap = await getDocs(collection(scheduleDb, 'shared', 'data', 'workShifts'));

  const salaryRecords = salarySnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const legacyShifts = workShiftSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  console.log(`[ScheduleDB] 找到 ${salaryRecords.length} 筆 salaryRecords，${legacyShifts.length} 筆 legacyShifts`);

  // 合併兩邊資料並進行 8 月份過濾 (2026-08)
  const allShiftsMap = new Map();

  for (const shift of legacyShifts) {
    if (shift.date && shift.date.startsWith('2026-08')) {
      allShiftsMap.set(shift.id, shift);
    }
  }

  for (const record of salaryRecords) {
    if (record.date && record.date.startsWith('2026-08')) {
      allShiftsMap.set(record.id, record);
    }
  }

  const augustShifts = Array.from(allShiftsMap.values());
  console.log(`📅 篩選出 2026 年 8 月份打工排班共 ${augustShifts.length} 筆：`);

  if (augustShifts.length === 0) {
    console.log('⚠️ 未找到 2026 年 8 月份的打工排班。');
    return;
  }

  let successCount = 0;
  for (const shift of augustShifts) {
    const note = shift.note || '';
    const location = shift.location || '';

    let title = '阿弟排班';
    if (note && note.trim()) {
      title = note.trim();
    }

    const descParts = [];
    if (location) descParts.push(`地點: ${location}`);
    if (note && note.trim() !== title) descParts.push(note.trim());

    const familyDocId = `workshift_${shift.id}`;
    const targetDocRef = doc(familyDb, 'schedules', familyDocId);

    const payload = {
      title,
      date: shift.date,
      startTime: shift.startTime || '09:00',
      endTime: shift.endTime || '18:00',
      category: '阿弟排班',
      description: descParts.join(' | ') || title,
      source: 'schedule-app',
      workShiftId: shift.id,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(targetDocRef, payload, { merge: true });
      console.log(`  ✅ 同步成功: [${shift.date}] ${title} (${shift.startTime || ''}~${shift.endTime || ''}) -> family-web (ID: ${familyDocId})`);
      successCount++;
    } catch (err) {
      console.error(`  ❌ 同步失敗: [${shift.date}]`, err.message);
    }
  }

  console.log(`\n🎉 8 月份打工排班同步完成！成功同步 ${successCount} / ${augustShifts.length} 筆。`);
}

runSync().catch(console.error);
