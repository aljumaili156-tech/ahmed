export interface Teacher {
  id: string;
  name: string;
  username: string;
  password?: string;
  role?: 'teacher' | 'admin'; // 'teacher' for subject teachers, 'admin' for مدير or معاون
  jobTitle?: string; // e.g. "مدرس مادة", "مدير مدرسة", "معاون مدرسة"
  subject: string;
  phone: string;
  notes?: string;
  isOnLeave?: boolean; // هل المدرس مجاز حالياً
  leaveDate?: string;
  createdAt?: string;
}

export interface ClassSchedule {
  id: string;
  teacherId: string;
  dayOfWeek: number; // 0: الأحد, 1: الإثنين, 2: الثلاثاء, 3: الأربعاء, 4: الخميس, 5: الجمعة, 6: السبت
  subject: string;
  gradeAndSection: string;
  room: string;
  startTime: string; // HH:mm format (24-hour)
  endTime: string;   // HH:mm format (24-hour)
  alertMinutesBefore: number; // Default 2
  isActive: boolean;
}

export interface AttendanceLog {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  subject: string;
  gradeAndSection: string;
  room: string;
  classStartTime: string;
  acknowledgedAt: string;
  scheduledDate: string; // YYYY-MM-DD
  status: 'heading_to_class' | 'late' | 'excused';
  note?: string;
  syncedFromOffline?: boolean;
}

export interface SchoolSettings {
  schoolName: string;
  schoolLogo?: string; // base64 Data URL or image URL for custom school crest/logo
  defaultAlertMinutes: number;
  ringDurationSeconds: number;
  allowTeacherSoundChoice: boolean;
}

export interface CurrentUser {
  id: string;
  name: string;
  username: string;
  role: 'teacher' | 'admin';
  jobTitle?: string;
  subject?: string;
  phone?: string;
  isOnLeave?: boolean;
}

// Order primary grades strictly: الاول ابتدائي (1) to السادس ابتدائي (6)
export function getPrimaryGradeRank(gradeStr: string): number {
  if (!gradeStr) return 99;
  const g = gradeStr.toLowerCase().trim();
  if (g.includes('اول') || g.includes('أول') || g.includes('الأول') || g.includes('الاول') || g.includes('1')) return 1;
  if (g.includes('ثاني') || g.includes('الثاني') || g.includes('2')) return 2;
  if (g.includes('ثالث') || g.includes('الثالث') || g.includes('3')) return 3;
  if (g.includes('رابع') || g.includes('الرابع') || g.includes('4')) return 4;
  if (g.includes('خامس') || g.includes('الخامس') || g.includes('5')) return 5;
  if (g.includes('سادس') || g.includes('السادس') || g.includes('6')) return 6;
  return 90; // other
}

export const DAYS_OF_WEEK = [
  { id: 0, name: 'الأحد', short: 'أحد' },
  { id: 1, name: 'الإثنين', short: 'إثنين' },
  { id: 2, name: 'الثلاثاء', short: 'ثلاثاء' },
  { id: 3, name: 'الأربعاء', short: 'أربعاء' },
  { id: 4, name: 'الخميس', short: 'خميس' },
] as const;

