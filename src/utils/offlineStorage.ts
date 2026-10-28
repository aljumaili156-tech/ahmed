import { Teacher, ClassSchedule, AttendanceLog, SchoolSettings, CurrentUser } from '../types';

const STORAGE_KEYS = {
  TEACHERS: 'school_bell_teachers',
  CLASSES: 'school_bell_classes',
  SETTINGS: 'school_bell_settings',
  LOGS: 'school_bell_logs',
  CURRENT_USER: 'school_bell_user',
  PENDING_LOGS: 'school_bell_pending_logs',
  ACKNOWLEDGED_TODAY: 'school_bell_acknowledged_today',
  SOUND_TYPE: 'school_bell_sound_type', // 'electric' | 'melodic'
  SOUND_VOLUME: 'school_bell_sound_volume',
  ALERT_MINUTES: 'school_bell_alert_minutes',
};

export function saveCachedData(data: {
  teachers?: Teacher[];
  classes?: ClassSchedule[];
  settings?: SchoolSettings;
  logs?: AttendanceLog[];
}) {
  try {
    if (data.teachers) {
      localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(data.teachers));
    }
    if (data.classes) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(data.classes));
    }
    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    }
    if (data.logs) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
    }
  } catch (err) {
    console.warn('Failed saving cache to localStorage:', err);
  }
}

export function getCachedTeachers(): Teacher[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCachedClasses(): ClassSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getCachedSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw
      ? JSON.parse(raw)
      : {
          schoolName: 'ثانوية النخبة النموذجية للبنين',
          defaultAlertMinutes: 2,
          ringDurationSeconds: 15,
          allowTeacherSoundChoice: true,
        };
  } catch {
    return {
      schoolName: 'ثانوية النخبة النموذجية للبنين',
      defaultAlertMinutes: 2,
      ringDurationSeconds: 15,
      allowTeacherSoundChoice: true,
    };
  }
}

export function getCachedLogs(): AttendanceLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Current User session persistence
export function saveCurrentUser(user: CurrentUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (err) {
    console.warn('User session storage error:', err);
  }
}

export function getSavedCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Acknowledged today tracking (ClassId + YYYY-MM-DD)
export function markClassAcknowledgedToday(classId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${classId}_${today}`;
    const raw = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_TODAY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(key)) {
      set.push(key);
      localStorage.setItem(STORAGE_KEYS.ACKNOWLEDGED_TODAY, JSON.stringify(set));
    }
  } catch (err) {
    console.warn('Error marking class acknowledged:', err);
  }
}

export function isClassAcknowledgedToday(classId: string): boolean {
  try {
    const today = new Date().toISOString().split('T')[0];
    const key = `${classId}_${today}`;
    const raw = localStorage.getItem(STORAGE_KEYS.ACKNOWLEDGED_TODAY);
    const set: string[] = raw ? JSON.parse(raw) : [];
    return set.includes(key);
  } catch {
    return false;
  }
}

// Pending Offline Acknowledgments Queue
export function queueOfflineAcknowledgment(log: AttendanceLog) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS);
    const pending: AttendanceLog[] = raw ? JSON.parse(raw) : [];
    pending.push(log);
    localStorage.setItem(STORAGE_KEYS.PENDING_LOGS, JSON.stringify(pending));

    // Also push to local logs cache immediately
    const existingLogs = getCachedLogs();
    saveCachedData({ logs: [log, ...existingLogs] });
  } catch (err) {
    console.warn('Failed to queue offline acknowledgment:', err);
  }
}

export function getPendingOfflineAcknowledgments(): AttendanceLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PENDING_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearPendingOfflineAcknowledgments() {
  try {
    localStorage.removeItem(STORAGE_KEYS.PENDING_LOGS);
  } catch {
    // ignore
  }
}

// User preferences
export function getSavedSoundType(): 'electric' | 'melodic' {
  return (localStorage.getItem(STORAGE_KEYS.SOUND_TYPE) as any) || 'electric';
}

export function saveSoundType(type: 'electric' | 'melodic') {
  localStorage.setItem(STORAGE_KEYS.SOUND_TYPE, type);
}

export function getSavedSoundVolume(): number {
  const val = localStorage.getItem(STORAGE_KEYS.SOUND_VOLUME);
  return val ? parseFloat(val) : 0.85;
}

export function saveSoundVolume(vol: number) {
  localStorage.setItem(STORAGE_KEYS.SOUND_VOLUME, String(vol));
}

export function getSavedAlertMinutes(): number {
  const val = localStorage.getItem(STORAGE_KEYS.ALERT_MINUTES);
  return val ? parseInt(val, 10) : 2;
}

export function saveAlertMinutes(mins: number) {
  localStorage.setItem(STORAGE_KEYS.ALERT_MINUTES, String(mins));
}
