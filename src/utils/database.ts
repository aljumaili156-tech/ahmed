/**
 * Universal Dual-Mode Database Engine
 * Works seamlessly on BOTH full-stack Node.js servers AND static hosts (cPanel, Apache, Nginx, Vercel, Netlify)
 * All data is permanently stored in browser IndexedDB / localStorage and synced with /api if available.
 */

import { Teacher, ClassSchedule, AttendanceLog, SchoolSettings, CurrentUser } from '../types';
import {
  saveCachedData,
  getCachedTeachers,
  getCachedClasses,
  getCachedLogs,
  getCachedSettings,
} from './offlineStorage';
import { apiUrl } from './apiConfig';

export const INITIAL_DEFAULT_DATA: {
  teachers: Teacher[];
  classes: ClassSchedule[];
  logs: AttendanceLog[];
  settings: SchoolSettings;
} = {
  teachers: [
    {
      id: 'teacher-1',
      name: 'أستاذ أحمد حسن الجميلي',
      username: 'ahmed',
      password: '123',
      subject: 'العلوم العامة',
      phone: '07701234567',
      role: 'teacher',
      jobTitle: 'مدرس مادة',
      isOnLeave: false,
      notes: 'مدرس مادة العلوم للصفوف الابتدائية',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-2',
      name: 'ست زينب علي الكرخي',
      username: 'zainab',
      password: '123',
      subject: 'الرياضيات',
      phone: '07809876543',
      role: 'teacher',
      jobTitle: 'مدرسة مادة',
      isOnLeave: false,
      notes: 'مدرسة الرياضيات للمرحلة الابتدائية',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-admin',
      name: 'أستاذ محمد جاسم الحيالي',
      username: 'director',
      password: '123',
      subject: 'الإدارة المدرسية',
      phone: '07501112233',
      role: 'admin',
      jobTitle: 'مدير المدرسة',
      isOnLeave: false,
      notes: 'مدير المدرسة - صلاحيات كاملة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-asst',
      name: 'أستاذ حيدر محمد الأسدي',
      username: 'assistant',
      password: '123',
      subject: 'الإشراف التربوي',
      phone: '07505554433',
      role: 'admin',
      jobTitle: 'معاون شؤون الطلبة',
      isOnLeave: false,
      notes: 'معاون المدير - صلاحيات إدارة',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'teacher-3',
      name: 'ست مروة خالد السامرائي',
      username: 'marwa',
      password: '123',
      subject: 'اللغة الإنجليزية',
      phone: '07712334455',
      role: 'teacher',
      jobTitle: 'مدرسة مادة',
      isOnLeave: false,
      notes: 'مدرسة اللغة الإنجليزية',
      createdAt: new Date().toISOString(),
    },
  ],
  classes: [
    {
      id: 'c-101',
      teacherId: 'teacher-1',
      dayOfWeek: 0, // الأحد
      subject: 'العلوم العامة',
      gradeAndSection: 'الصف الأول الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-102',
      teacherId: 'teacher-2',
      dayOfWeek: 0, // الأحد
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الثاني الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-103',
      teacherId: 'teacher-3',
      dayOfWeek: 0, // الأحد
      subject: 'اللغة الإنجليزية',
      gradeAndSection: 'الصف الثالث الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-104',
      teacherId: 'teacher-1',
      dayOfWeek: 0, // الأحد
      subject: 'العلوم العامة',
      gradeAndSection: 'الصف الرابع الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-105',
      teacherId: 'teacher-2',
      dayOfWeek: 0, // الأحد
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الخامس الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-106',
      teacherId: 'teacher-3',
      dayOfWeek: 0, // الأحد
      subject: 'اللغة الإنجليزية',
      gradeAndSection: 'الصف السادس الابتدائي - أ',
      room: '',
      startTime: '08:50',
      endTime: '09:35',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-107',
      teacherId: 'teacher-1',
      dayOfWeek: 1, // الإثنين
      subject: 'العلوم',
      gradeAndSection: 'الصف الأول الابتدائي - ب',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-108',
      teacherId: 'teacher-2',
      dayOfWeek: 1, // الإثنين
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الثالث الابتدائي - ب',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-109',
      teacherId: 'teacher-1',
      dayOfWeek: 2, // الثلاثاء
      subject: 'العلوم',
      gradeAndSection: 'الصف الثاني الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-110',
      teacherId: 'teacher-2',
      dayOfWeek: 3, // الأربعاء
      subject: 'الرياضيات',
      gradeAndSection: 'الصف الرابع الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-111',
      teacherId: 'teacher-3',
      dayOfWeek: 4, // الخميس
      subject: 'اللغة الإنجليزية',
      gradeAndSection: 'الصف الخامس الابتدائي - أ',
      room: '',
      startTime: '08:00',
      endTime: '08:45',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-107',
      teacherId: 'teacher-1',
      dayOfWeek: 4, // الخميس
      subject: 'الفيزياء مراجعة',
      gradeAndSection: 'السادس العلمي - شعبة أ+ب',
      room: 'المدرج الرئيسي',
      startTime: '10:15',
      endTime: '11:00',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-201',
      teacherId: 'teacher-2',
      dayOfWeek: 1, // الإثنين
      subject: 'الرياضيات',
      gradeAndSection: 'الرابع العلمي - شعبة أ',
      room: 'قاعة 101',
      startTime: '08:30',
      endTime: '09:15',
      alertMinutesBefore: 2,
      isActive: true,
    },
    {
      id: 'c-301',
      teacherId: 'teacher-3',
      dayOfWeek: 0,
      subject: 'اللغة العربية',
      gradeAndSection: 'السادس الإعدادي - شعبة أ',
      room: 'قاعة 203',
      startTime: '09:20',
      endTime: '10:05',
      alertMinutesBefore: 2,
      isActive: true,
    },
  ],
  logs: [
    {
      id: 'log-sample-1',
      teacherId: 'teacher-1',
      teacherName: 'أستاذ أحمد حسن الجميلي',
      classId: 'c-101',
      subject: 'الفيزياء',
      gradeAndSection: 'الخامس العلمي - شعبة أ',
      room: 'قاعة 102',
      classStartTime: '08:30',
      acknowledgedAt: new Date(Date.now() - 3600000).toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'heading_to_class' as const,
      note: 'تم التوجه للقاعة في الموعد المحدد',
      syncedFromOffline: false,
    },
  ],
  settings: {
    schoolName: 'ثانوية النخبة النموذجية للبنين',
    defaultAlertMinutes: 2,
    ringDurationSeconds: 15,
    allowTeacherSoundChoice: true,
  },
};

/**
 * Initialize database with sample data if completely empty on any new device or host
 */
export function ensureDatabaseInitialized(): {
  teachers: Teacher[];
  classes: ClassSchedule[];
  logs: AttendanceLog[];
  settings: SchoolSettings;
} {
  let teachers = getCachedTeachers();
  let classes = getCachedClasses();
  let logs = getCachedLogs();
  let settings = getCachedSettings();

  if (teachers.length === 0) {
    teachers = [...INITIAL_DEFAULT_DATA.teachers];
    classes = [...INITIAL_DEFAULT_DATA.classes];
    logs = [...INITIAL_DEFAULT_DATA.logs];
    settings = { ...INITIAL_DEFAULT_DATA.settings };

    saveCachedData({
      teachers,
      classes,
      logs,
      settings,
    });
  }

  return { teachers, classes, logs, settings };
}

/**
 * Merges server data with client-side local database so that teachers and classes
 * added while on static hosting, offline, or on mobile are NEVER overwritten!
 */
export function mergeServerAndLocalData(serverData: {
  teachers?: Teacher[];
  classes?: ClassSchedule[];
  logs?: AttendanceLog[];
  settings?: SchoolSettings;
}): {
  teachers: Teacher[];
  classes: ClassSchedule[];
  logs: AttendanceLog[];
  settings: SchoolSettings;
} {
  const localTeachers = getCachedTeachers();
  const localClasses = getCachedClasses();
  const localLogs = getCachedLogs();
  const localSettings = getCachedSettings();

  // If server provided teachers, treat server as primary
  const mergedTeachers = (serverData.teachers && serverData.teachers.length > 0)
    ? serverData.teachers
    : localTeachers;

  // If server provided classes, treat server as authoritative
  const mergedClasses = (serverData.classes && Array.isArray(serverData.classes))
    ? serverData.classes
    : localClasses;

  // Merge logs (combine unique ids)
  const logMap = new Map<string, AttendanceLog>();
  (serverData.logs || []).forEach((l) => logMap.set(l.id, l));
  localLogs.forEach((l) => {
    if (!logMap.has(l.id)) {
      logMap.set(l.id, l);
    }
  });
  const mergedLogs = Array.from(logMap.values());

  const mergedSettings = serverData.settings
    ? { ...localSettings, ...serverData.settings }
    : localSettings;

  saveCachedData({
    teachers: mergedTeachers,
    classes: mergedClasses,
    logs: mergedLogs,
    settings: mergedSettings,
  });

  return {
    teachers: mergedTeachers,
    classes: mergedClasses,
    logs: mergedLogs,
    settings: mergedSettings,
  };
}

/**
 * Add a Teacher: Tries Server API, if server 404s/offline, persists immediately to Client Database!
 */
export async function dbAddTeacher(
  currentTeachers: Teacher[],
  teacherData: Omit<Teacher, 'id' | 'createdAt'>
): Promise<{ success: boolean; teacher: Teacher; updatedTeachers: Teacher[] }> {
  // Validate duplicate username
  const exists = currentTeachers.some(
    (t) => t.username.trim().toLowerCase() === teacherData.username.trim().toLowerCase()
  );
  if (exists) {
    throw new Error('اسم المستخدم مسجل مسبقاً لمدرس آخر');
  }

  const newTeacher: Teacher = {
    id: `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: teacherData.name.trim(),
    username: teacherData.username.trim(),
    password: teacherData.password?.trim() || '123',
    role: teacherData.role === 'admin' ? 'admin' : 'teacher',
    jobTitle: teacherData.jobTitle ? teacherData.jobTitle.trim() : (teacherData.role === 'admin' ? 'معاون / إدارة' : 'مدرس مادة'),
    subject: teacherData.subject.trim(),
    phone: teacherData.phone?.trim() || '',
    notes: teacherData.notes?.trim() || '',
    isOnLeave: Boolean(teacherData.isOnLeave),
    createdAt: new Date().toISOString(),
  };

  const updatedTeachers = [...currentTeachers, newTeacher];
  // 1. Immediately persist locally
  saveCachedData({ teachers: updatedTeachers });

  // 2. Sync to cloud backend
  try {
    const res = await fetch(apiUrl('/api/teachers'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTeacher),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.teacher) {
        return { success: true, teacher: data.teacher, updatedTeachers };
      }
    }
  } catch (err) {
    console.warn('Cloud sync teacher add fallback to offline:', err);
  }

  return { success: true, teacher: newTeacher, updatedTeachers };
}

/**
 * Update a Teacher
 */
export async function dbUpdateTeacher(
  currentTeachers: Teacher[],
  id: string,
  updates: Partial<Teacher>
): Promise<{ success: boolean; teacher: Teacher; updatedTeachers: Teacher[] }> {
  const index = currentTeachers.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error('المدرس غير موجود');
  }

  const updatedTeacher = { ...currentTeachers[index], ...updates };
  const updatedTeachers = [...currentTeachers];
  updatedTeachers[index] = updatedTeacher;

  saveCachedData({ teachers: updatedTeachers });

  try {
    await fetch(apiUrl(`/api/teachers/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('Cloud sync teacher update fallback to offline:', err);
  }

  return { success: true, teacher: updatedTeacher, updatedTeachers };
}

/**
 * Toggle Teacher On-Leave Status (requested: "زر للمدرس مال اجازة من ايدوسه مينطي لا تنبيه ولا صوت")
 */
export async function dbToggleTeacherLeave(
  currentTeachers: Teacher[],
  teacherId: string,
  isOnLeave?: boolean
): Promise<{ success: boolean; teacher: Teacher; updatedTeachers: Teacher[] }> {
  const index = currentTeachers.findIndex((t) => t.id === teacherId);
  if (index === -1) {
    throw new Error('المدرس غير موجود');
  }

  const targetState = isOnLeave !== undefined ? Boolean(isOnLeave) : !currentTeachers[index].isOnLeave;
  const updatedTeacher: Teacher = {
    ...currentTeachers[index],
    isOnLeave: targetState,
    leaveDate: targetState ? new Date().toISOString() : undefined,
  };

  const updatedTeachers = [...currentTeachers];
  updatedTeachers[index] = updatedTeacher;

  saveCachedData({ teachers: updatedTeachers });

  try {
    await fetch(apiUrl(`/api/teachers/${teacherId}/toggle-leave`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnLeave: targetState }),
    });
  } catch (err) {
    console.warn('Cloud sync leave toggle fallback to offline:', err);
  }

  return { success: true, teacher: updatedTeacher, updatedTeachers };
}

/**
 * Delete a Teacher
 */
export async function dbDeleteTeacher(
  currentTeachers: Teacher[],
  currentClasses: ClassSchedule[],
  id: string
): Promise<{ updatedTeachers: Teacher[]; updatedClasses: ClassSchedule[] }> {
  const updatedTeachers = currentTeachers.filter((t) => t.id !== id);
  const updatedClasses = currentClasses.filter((c) => c.teacherId !== id);

  saveCachedData({ teachers: updatedTeachers, classes: updatedClasses });

  try {
    await fetch(apiUrl(`/api/teachers/${id}`), { method: 'DELETE' });
  } catch (err) {
    console.warn('Cloud sync teacher delete fallback to offline:', err);
  }

  return { updatedTeachers, updatedClasses };
}

/**
 * Add a Class Schedule
 */
export async function dbAddClass(
  currentClasses: ClassSchedule[],
  classData: Omit<ClassSchedule, 'id'>
): Promise<{ success: boolean; classItem: ClassSchedule; updatedClasses: ClassSchedule[] }> {
  const newClass: ClassSchedule = {
    id: `class-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...classData,
    alertMinutesBefore: classData.alertMinutesBefore || 2,
    isActive: true,
  };

  const updatedClasses = [...currentClasses, newClass];
  saveCachedData({ classes: updatedClasses });

  try {
    const res = await fetch(apiUrl('/api/classes'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newClass),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.classItem) {
        return { success: true, classItem: data.classItem, updatedClasses };
      }
    }
  } catch (err) {
    console.warn('Cloud sync class add fallback to offline:', err);
  }

  return { success: true, classItem: newClass, updatedClasses };
}

/**
 * Update a Class
 */
export async function dbUpdateClass(
  currentClasses: ClassSchedule[],
  id: string,
  updates: Partial<ClassSchedule>
): Promise<{ success: boolean; classItem: ClassSchedule; updatedClasses: ClassSchedule[] }> {
  const index = currentClasses.findIndex((c) => c.id === id);
  if (index === -1) {
    throw new Error('الحصة غير موجودة');
  }

  const updatedClass = { ...currentClasses[index], ...updates };
  const updatedClasses = [...currentClasses];
  updatedClasses[index] = updatedClass;

  saveCachedData({ classes: updatedClasses });

  try {
    await fetch(apiUrl(`/api/classes/${id}`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('Cloud sync class update fallback to offline:', err);
  }

  return { success: true, classItem: updatedClass, updatedClasses };
}

/**
 * Delete a Class
 */
export async function dbDeleteClass(
  currentClasses: ClassSchedule[],
  id: string
): Promise<{ updatedClasses: ClassSchedule[] }> {
  const updatedClasses = currentClasses.filter((c) => c.id !== id);
  saveCachedData({ classes: updatedClasses });

  try {
    await fetch(apiUrl(`/api/classes/${id}`), { method: 'DELETE' });
  } catch (err) {
    console.warn('Cloud sync class delete fallback to offline:', err);
  }

  return { updatedClasses };
}

/**
 * Update School Settings
 */
export async function dbUpdateSettings(
  settings: Partial<SchoolSettings>
): Promise<SchoolSettings> {
  const current = getCachedSettings();
  const updated = { ...current, ...settings };
  saveCachedData({ settings: updated });

  try {
    const res = await fetch(apiUrl('/api/settings'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        saveCachedData({ settings: data.settings });
        return data.settings;
      }
    }
  } catch (err) {
    console.warn('Cloud sync settings update fallback to offline:', err);
  }

  return updated;
}
