import React, { useState } from 'react';
import {
  Users,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Download,
  Upload,
  RefreshCw,
  Search,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Coffee,
  Clock,
  Radio,
  GraduationCap,
  BellOff,
  UserCheck,
  Settings,
  Image,
  Palette,
  Check,
} from 'lucide-react';
import { Teacher, ClassSchedule, AttendanceLog, SchoolSettings, DAYS_OF_WEEK, getPrimaryGradeRank } from '../types';
import { formatTimeTo12Hour, formatTimeRangeTo12Hour, formatDateTo12Hour } from '../utils/timeFormat';
import { getCloudBackendUrl, setCloudBackendUrl, DEFAULT_CLOUD_RUN_BACKEND } from '../utils/apiConfig';
import { PRESET_SCHOOL_LOGOS } from '../utils/presetLogos';

interface Props {
  teachers: Teacher[];
  classes: ClassSchedule[];
  logs: AttendanceLog[];
  settings: SchoolSettings;
  currentTime?: Date;
  onToggleTeacherLeave?: (teacherId: string, isOnLeave?: boolean) => Promise<boolean>;
  onAddTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<boolean>;
  onDeleteTeacher: (id: string) => Promise<boolean>;
  onAddClass: (classItem: Omit<ClassSchedule, 'id'>) => Promise<boolean>;
  onUpdateClass: (id: string, classItem: Partial<ClassSchedule>) => Promise<boolean>;
  onDeleteClass: (id: string) => Promise<boolean>;
  onResetDemoData: () => Promise<void>;
  onRefreshData: () => Promise<void>;
  onImportDatabase: (data: any) => Promise<boolean>;
  onUpdateSettings: (settings: Partial<SchoolSettings>) => Promise<boolean>;
}

export const AdminDashboard: React.FC<Props> = ({
  teachers,
  classes,
  logs,
  settings,
  currentTime,
  onToggleTeacherLeave,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  onResetDemoData,
  onRefreshData,
  onImportDatabase,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'live' | 'logs' | 'teachers' | 'classes' | 'settings'>('live');

  // School Settings State (Name, Logo, Timing)
  const [schoolNameInput, setSchoolNameInput] = useState(settings.schoolName);
  const [schoolLogoInput, setSchoolLogoInput] = useState<string>(settings.schoolLogo || '');
  const [alertMinutesInput, setAlertMinutesInput] = useState(settings.defaultAlertMinutes || 2);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState(() => getCloudBackendUrl() || DEFAULT_CLOUD_RUN_BACKEND);
  const [cloudUrlSaved, setCloudUrlSaved] = useState(false);

  React.useEffect(() => {
    setSchoolNameInput(settings.schoolName);
    setSchoolLogoInput(settings.schoolLogo || '');
    setAlertMinutesInput(settings.defaultAlertMinutes || 2);
  }, [settings.schoolName, settings.schoolLogo, settings.defaultAlertMinutes]);

  // Live Monitor Day state (Defaults to today, or Sunday if weekend)
  const currentNow = currentTime || new Date();
  const currentDayOfWeek = currentNow.getDay();
  const initialMonitorDay = currentDayOfWeek >= 0 && currentDayOfWeek <= 4 ? currentDayOfWeek : 0;
  const [monitorDay, setMonitorDay] = useState<number>(initialMonitorDay);

  // Teacher Form State
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [teacherRole, setTeacherRole] = useState<'teacher' | 'admin'>('teacher');
  const [teacherJobTitle, setTeacherJobTitle] = useState('مدرس مادة');
  const [teacherIsOnLeave, setTeacherIsOnLeave] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [id: string]: boolean }>({});
  const [teacherFormError, setTeacherFormError] = useState<string | null>(null);

  // In-UI Confirmation state for teacher and class deletion (replaces window.confirm)
  const [confirmDeleteTeacherId, setConfirmDeleteTeacherId] = useState<string | null>(null);
  const [confirmDeleteClassId, setConfirmDeleteClassId] = useState<string | null>(null);
  const [confirmResetDemo, setConfirmResetDemo] = useState(false);

  // Class Form State (Room removed per user request)
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classTeacherId, setClassTeacherId] = useState('');
  const [classDayOfWeek, setClassDayOfWeek] = useState<number>(0);
  const [classSubject, setClassSubject] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [classStartTime, setClassStartTime] = useState('08:30');
  const [classEndTime, setClassEndTime] = useState('09:15');
  const [classAlertMinutes, setClassAlertMinutes] = useState(2);
  const [classFormError, setClassFormError] = useState<string | null>(null);
  const [classSavedSuccessMessage, setClassSavedSuccessMessage] = useState<string | null>(null);
  const [sessionClassesAddedCount, setSessionClassesAddedCount] = useState<number>(0);

  // Filters
  const [filterTeacher, setFilterTeacher] = useState<string>('all');
  const [filterDay, setFilterDay] = useState<string>('all');
  const [searchLog, setSearchLog] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open Teacher Modal
  const handleOpenAddTeacher = () => {
    setEditingTeacherId(null);
    setTeacherName('');
    setTeacherUsername('');
    setTeacherPassword('');
    setTeacherSubject('');
    setTeacherPhone('');
    setTeacherNotes('');
    setTeacherRole('teacher');
    setTeacherJobTitle('مدرس مادة');
    setTeacherIsOnLeave(false);
    setTeacherFormError(null);
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacher = (t: Teacher) => {
    setEditingTeacherId(t.id);
    setTeacherName(t.name);
    setTeacherUsername(t.username);
    setTeacherPassword(t.password || '');
    setTeacherSubject(t.subject);
    setTeacherPhone(t.phone || '');
    setTeacherNotes(t.notes || '');
    setTeacherRole(t.role || 'teacher');
    setTeacherJobTitle(t.jobTitle || (t.role === 'admin' ? 'مدير مدرسة' : 'مدرس مادة'));
    setTeacherIsOnLeave(Boolean(t.isOnLeave));
    setTeacherFormError(null);
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !teacherUsername.trim() || !teacherPassword.trim() || !teacherSubject.trim()) {
      setTeacherFormError('يرجى ملء جميع الحقول الأساسية: الاسم، اسم المستخدم، كلمة المرور، والمادة');
      return;
    }

    setIsSubmitting(true);
    setTeacherFormError(null);

    try {
      if (editingTeacherId) {
        const ok = await onUpdateTeacher(editingTeacherId, {
          name: teacherName.trim(),
          username: teacherUsername.trim(),
          password: teacherPassword.trim(),
          subject: teacherSubject.trim(),
          phone: teacherPhone.trim(),
          notes: teacherNotes.trim(),
          role: teacherRole,
          jobTitle: teacherJobTitle.trim() || (teacherRole === 'admin' ? 'مدير مدرسة' : 'مدرس مادة'),
          isOnLeave: teacherIsOnLeave,
        });
        if (ok !== false) {
          setShowTeacherModal(false);
          setActiveTab('teachers');
        }
      } else {
        const ok = await onAddTeacher({
          name: teacherName.trim(),
          username: teacherUsername.trim(),
          password: teacherPassword.trim(),
          subject: teacherSubject.trim(),
          phone: teacherPhone.trim(),
          notes: teacherNotes.trim(),
          role: teacherRole,
          jobTitle: teacherJobTitle.trim() || (teacherRole === 'admin' ? 'مدير مدرسة' : 'مدرس مادة'),
          isOnLeave: teacherIsOnLeave,
        });
        if (ok !== false) {
          setShowTeacherModal(false);
          setActiveTab('teachers');
        }
      }
    } catch (err: any) {
      setTeacherFormError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to advance time by given minutes for consecutive periods
  const advanceTimeByMinutes = (timeStr: string, minutes: number): string => {
    try {
      const [h, m] = timeStr.split(':').map(Number);
      const total = (h * 60 + m + minutes) % (24 * 60);
      const newH = Math.floor(total / 60);
      const newM = total % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    } catch {
      return timeStr;
    }
  };

  // Open Class Modal (Room removed)
  const handleOpenAddClass = (defaultTeacherId?: string) => {
    setEditingClassId(null);
    setClassSavedSuccessMessage(null);
    setSessionClassesAddedCount(0);
    setClassTeacherId(defaultTeacherId || (teachers[0]?.id ?? ''));
    setClassDayOfWeek(0); // Sunday
    const selectedT = teachers.find((t) => t.id === (defaultTeacherId || teachers[0]?.id));
    setClassSubject(selectedT?.subject || '');
    setClassGrade('الصف الخامس العلمي - شعبة أ');
    setClassStartTime('08:30');
    setClassEndTime('09:15');
    setClassAlertMinutes(2);
    setClassFormError(null);
    setShowClassModal(true);
  };

  const handleOpenEditClass = (c: ClassSchedule) => {
    setEditingClassId(c.id);
    setClassSavedSuccessMessage(null);
    setSessionClassesAddedCount(0);
    setClassTeacherId(c.teacherId);
    setClassDayOfWeek(c.dayOfWeek);
    setClassSubject(c.subject);
    setClassGrade(c.gradeAndSection);
    setClassStartTime(c.startTime);
    setClassEndTime(c.endTime);
    setClassAlertMinutes(c.alertMinutesBefore || 2);
    setClassFormError(null);
    setShowClassModal(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classTeacherId || !classSubject || !classGrade || !classStartTime || !classEndTime) {
      setClassFormError('يرجى ملء جميع بيانات الحصة');
      return;
    }

    setIsSubmitting(true);
    setClassFormError(null);

    try {
      if (editingClassId) {
        const ok = await onUpdateClass(editingClassId, {
          teacherId: classTeacherId,
          dayOfWeek: Number(classDayOfWeek),
          subject: classSubject.trim(),
          gradeAndSection: classGrade.trim(),
          room: '',
          startTime: classStartTime,
          endTime: classEndTime,
          alertMinutesBefore: Number(classAlertMinutes),
          isActive: true,
        });
        if (ok !== false) {
          setShowClassModal(false);
          setActiveTab('classes');
        }
      } else {
        const ok = await onAddClass({
          teacherId: classTeacherId,
          dayOfWeek: Number(classDayOfWeek),
          subject: classSubject.trim(),
          gradeAndSection: classGrade.trim(),
          room: '',
          startTime: classStartTime,
          endTime: classEndTime,
          alertMinutesBefore: Number(classAlertMinutes),
          isActive: true,
        });
        if (ok !== false) {
          // Rapid Class Entry: Keep page/modal OPEN as requested!
          const newCount = sessionClassesAddedCount + 1;
          setSessionClassesAddedCount(newCount);
          setClassSavedSuccessMessage(
            `تم حفظ الحصة (${newCount}) بنجاح في الجدول السحابي! يمكنك الآن تعديل وتثبيت الحصة التالية مباشرة.`
          );

          // Calculate period duration and advance to next consecutive class slot
          const [startH, startM] = classStartTime.split(':').map(Number);
          const [endH, endM] = classEndTime.split(':').map(Number);
          const duration = (endH * 60 + endM) - (startH * 60 + startM);
          const validDuration = duration > 0 && duration <= 120 ? duration : 45;

          const nextStartTime = classEndTime;
          const nextEndTime = advanceTimeByMinutes(classEndTime, validDuration);

          setClassStartTime(nextStartTime);
          setClassEndTime(nextEndTime);
          // Keep teacher, day, and alert minutes selected for ultra-fast schedule entry
        }
      }
    } catch (err: any) {
      setClassFormError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If SVG, read directly as data URL
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSchoolLogoInput(reader.result);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // For raster images (PNG, JPG, WEBP):
    // Resize to max 400x400 to keep it lightweight (~30KB), guaranteeing instant sync across all phones!
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png', 0.9);
          setSchoolLogoInput(compressedDataUrl);
        } else {
          setSchoolLogoInput(rawDataUrl);
        }
      };
      img.onerror = () => {
        setSchoolLogoInput(rawDataUrl);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSchoolSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!schoolNameInput.trim()) return;
    setIsSavingSettings(true);
    try {
      const ok = await onUpdateSettings({
        schoolName: schoolNameInput.trim(),
        schoolLogo: schoolLogoInput,
        defaultAlertMinutes: alertMinutesInput,
      });
      if (ok !== false) {
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 3500);
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Sort classes strictly by primary school grade:
  // 1. الأول الابتدائي (Rank 1)
  // 2. الثاني الابتدائي (Rank 2)
  // 3. الثالث الابتدائي (Rank 3)
  // 4. الرابع الابتدائي (Rank 4)
  // 5. الخامس الابتدائي (Rank 5)
  // 6. السادس الابتدائي (Rank 6)
  // Then by start time
  const sortClassesByPrimaryGrade = (a: ClassSchedule, b: ClassSchedule) => {
    const rankA = getPrimaryGradeRank(a.gradeAndSection);
    const rankB = getPrimaryGradeRank(b.gradeAndSection);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }
    return a.gradeAndSection.localeCompare(b.gradeAndSection, 'ar');
  };

  const nowTime = currentTime || new Date();
  const currentMinutes = nowTime.getHours() * 60 + nowTime.getMinutes();

  // Classes on selected live monitoring day
  const liveDayClasses = classes.filter((c) => c.dayOfWeek === monitorDay);

  // 1. Running Classes Right Now (Active at this exact minute)
  const runningClassesNow = liveDayClasses
    .filter((c) => {
      const [sh, sm] = c.startTime.split(':').map(Number);
      const [eh, em] = c.endTime.split(':').map(Number);
      const s = sh * 60 + sm;
      const e = eh * 60 + em;
      return currentMinutes >= s && currentMinutes < e;
    })
    .sort(sortClassesByPrimaryGrade);

  // 2. Next Upcoming Classes Today (Starting after this minute)
  const upcomingClassesToday = liveDayClasses
    .filter((c) => {
      const [sh, sm] = c.startTime.split(':').map(Number);
      const s = sh * 60 + sm;
      return currentMinutes < s;
    })
    .sort(sortClassesByPrimaryGrade);

  // Filter and sort classes for weekly schedule:
  // 1. By Day: Sunday (0) to Thursday (4)
  // 2. By Teacher Name alphabetically
  // 3. By Start Time
  const sortedClasses = [...classes].filter((c) => {
    // Only school days Sunday (0) to Thursday (4)
    if (c.dayOfWeek < 0 || c.dayOfWeek > 4) return false;
    if (filterTeacher !== 'all' && c.teacherId !== filterTeacher) return false;
    if (filterDay !== 'all' && c.dayOfWeek !== Number(filterDay)) return false;
    return true;
  });

  sortedClasses.sort((a, b) => {
    // 1. Day order (0 to 4)
    if (a.dayOfWeek !== b.dayOfWeek) {
      return a.dayOfWeek - b.dayOfWeek;
    }
    // 2. Teacher name order
    const teacherA = teachers.find((t) => t.id === a.teacherId)?.name || '';
    const teacherB = teachers.find((t) => t.id === b.teacherId)?.name || '';
    const nameCmp = teacherA.localeCompare(teacherB, 'ar');
    if (nameCmp !== 0) return nameCmp;
    // 3. Time order
    return a.startTime.localeCompare(b.startTime);
  });

  // Filter logs
  const filteredLogs = logs.filter((l) => {
    if (!searchLog) return true;
    const q = searchLog.toLowerCase();
    return (
      l.teacherName.toLowerCase().includes(q) ||
      l.subject.toLowerCase().includes(q) ||
      l.gradeAndSection.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Admin Top Dashboard Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              لوحة تحكم الإدارة المدرسية
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-semibold">{settings.schoolName}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            إدارة المدرسين والجداول وإشعارات التوجه للحصص
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefreshData}
            className="p-2.5 px-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="تحديث البيانات"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث البيانات</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
            activeTab === 'live'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg shadow-blue-600/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Radio className={`w-4 h-4 ${activeTab === 'live' ? 'text-emerald-300 animate-pulse' : 'text-blue-500'}`} />
          <span>مراقبة الحصص الحية (الصفوف الابتدائية)</span>
          {runningClassesNow.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-slate-950 animate-pulse">
              {runningClassesNow.length} جارية
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>سجل إشعارات توجه المدرسين</span>
          <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'logs' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('teachers')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
            activeTab === 'teachers'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>مدرسي المواد والحسابات</span>
          <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'teachers' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {teachers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
            activeTab === 'classes'
              ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>جدول الحصص الأسبوعي</span>
          <span className={`px-2 py-0.2 rounded-full text-[11px] ${activeTab === 'classes' ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
            {classes.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold transition border cursor-pointer shrink-0 ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Settings className={`w-4 h-4 ${activeTab === 'settings' ? 'text-slate-950' : 'text-amber-500'}`} />
          <span>إعدادات وهوية المدرسة واللوكو</span>
        </button>
      </div>

      {/* TAB 0: Live Classroom Monitor (Requested by User: Currently Running & Next Classes by 1st to 6th Primary) */}
      {activeTab === 'live' && (
        <div className="space-y-6">
          
          {/* Day & Live Clock Control Header */}
          <div className="rounded-3xl bg-slate-900 text-white p-5 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </span>
                  <span className="text-xs font-black tracking-wider text-emerald-400 uppercase">
                    مراقبة حية للحصص المدرسية في المدرسة
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  الحصص الحالية والتالية مرتبة من الأول إلى السادس ابتدائي
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  تحديث لحظي لجميع الشعب والحصص مع توضيح حالة المدرس (متواجد أو مجاز)
                </p>
              </div>

              {/* Day selection and current 12-hour clock */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 p-1.5 rounded-2xl">
                  {DAYS_OF_WEEK.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setMonitorDay(d.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        monitorDay === d.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="font-mono font-black text-xs sm:text-sm text-emerald-400">
                    {formatDateTo12Hour(nowTime, false)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 1: Currently Running Classes (Ordered 1st to 6th Primary) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  الحصص الحالية الجارية الآن (مرتبة من الأول إلى السادس ابتدائي)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {runningClassesNow.length} حصة جارية الآن
              </span>
            </div>

            {runningClassesNow.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  لا توجد حصص جارية في هذه الدقيقة المحددة
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  الوقت الحالي هو {formatDateTo12Hour(nowTime, false)}. يمكنك مشاهدة الحصص التالية القادمة في القسم أدناه.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runningClassesNow.map((c) => {
                  const teacher = teachers.find((t) => t.id === c.teacherId);
                  const rank = getPrimaryGradeRank(c.gradeAndSection);
                  const isAck = logs.some((l) => l.classId === c.id);

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent p-4.5 space-y-3 shadow-sm hover:border-emerald-500/50 transition relative overflow-hidden"
                    >
                      {/* Grade Rank Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                            {rank <= 6 ? rank : '★'}
                          </span>
                          <div>
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                              {c.gradeAndSection}
                            </h4>
                            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                              مادة {c.subject}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500 text-slate-950 animate-pulse">
                          جارية الآن 🔴
                        </span>
                      </div>

                      {/* Teacher Details & Leave Status */}
                      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/80 p-3 space-y-2 text-xs border border-slate-200 dark:border-slate-700/60">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">مدرس المادة:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {teacher?.name || 'مدرس غير مسجل'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-semibold">وقت الحصة (١٢ ساعة):</span>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {formatTimeRangeTo12Hour(c.startTime, c.endTime)}
                          </span>
                        </div>

                        {/* Teacher Presence / Leave Status */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-slate-500 font-semibold">حالة المدرس:</span>
                          {teacher?.isOnLeave ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center gap-1">
                              <Coffee className="w-3 h-3" />
                              مجاز 🏖️ (الرنين معطل)
                            </span>
                          ) : isAck ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              توجه للدرس ✅
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500">
                              متواجد في الصف 🏫
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 2: Next Upcoming Classes (Ordered 1st to 6th Primary) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  الحصص التالية القادمة (مرتبة من الأول إلى السادس ابتدائي)
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                {upcomingClassesToday.length} حصة تالية
              </span>
            </div>

            {upcomingClassesToday.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
                <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  لا توجد حصص تالية متبقية في جدول هذا اليوم
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  اكتمل جدول هذا اليوم بنجاح أو لم يتم إدخال حصص إضافية بعد.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                      <th className="py-3 px-4 font-bold">الترتيب</th>
                      <th className="py-3 px-4 font-bold">الصف والمرحلة</th>
                      <th className="py-3 px-4 font-bold">المادة الدراسية</th>
                      <th className="py-3 px-4 font-bold">اسم المدرس</th>
                      <th className="py-3 px-4 font-bold">موعد الحصة (١٢ ساعة)</th>
                      <th className="py-3 px-4 font-bold">الوقت المتبقي للبدء</th>
                      <th className="py-3 px-4 font-bold">حالة المدرس</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {upcomingClassesToday.map((c) => {
                      const teacher = teachers.find((t) => t.id === c.teacherId);
                      const rank = getPrimaryGradeRank(c.gradeAndSection);

                      const [sh, sm] = c.startTime.split(':').map(Number);
                      const startTotal = sh * 60 + sm;
                      const diffMins = startTotal - currentMinutes;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                          <td className="py-3.5 px-4">
                            <span className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs inline-flex items-center justify-center">
                              {rank <= 6 ? rank : '-'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white">
                            {c.gradeAndSection}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-blue-600 dark:text-blue-400">
                            {c.subject}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {teacher?.name || 'مدرس غير مسجل'}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {formatTimeRangeTo12Hour(c.startTime, c.endTime)}
                          </td>
                          <td className="py-3.5 px-4">
                            {diffMins > 0 ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                تبدأ بعد {diffMins} دقيقة
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                قريباً
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {teacher?.isOnLeave ? (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/40 inline-flex items-center gap-1">
                                <Coffee className="w-3 h-3" />
                                مجاز 🏖️
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                متواجد بالدوام ✅
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 1: Attendance Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span>إشعارات تأكيد توجه المدرسين للحصص</span>
              </h3>
              <p className="text-xs text-slate-500">
                يصل هذا الإشعار تلقائياً عندما يدق الجرس ويضغط المدرس على زر (إلغاء الجرس وتأكيد التوجه للدرس)
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم المدرس أو المادة..."
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                className="w-full pr-10 pl-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <CheckCircle2 className="w-12 h-12 text-slate-400 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                لا توجد إشعارات مسجلة حتى الآن
              </p>
              <p className="text-xs text-slate-500 mt-1">
                عندما يدق جرس الحصة لدى أي مدرس ويقوم بإلغائه، ستظهر تأكيداته هنا لحظة بلحظة مع الوقت الدقيق.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-3 px-4 font-bold">المدرس</th>
                    <th className="py-3 px-4 font-bold">المادة الدراسية</th>
                    <th className="py-3 px-4 font-bold">الصف والشعبة</th>
                    <th className="py-3 px-4 font-bold">موعد الحصة (١٢ ساعة)</th>
                    <th className="py-3 px-4 font-bold">وقت إلغاء التنبيه وتأكيد التوجه</th>
                    <th className="py-3 px-4 font-bold">الحالة والمصدر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log) => {
                    const ackDate = new Date(log.acknowledgedAt);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {log.teacherName}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-blue-600 dark:text-blue-400">
                          {log.subject}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                          {log.gradeAndSection}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {formatTimeTo12Hour(log.classStartTime)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                            {formatDateTo12Hour(ackDate, true)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              توجه للدرس
                            </span>
                            {log.syncedFromOffline && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                مزامنة محلية
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Teachers Management */}
      {activeTab === 'teachers' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>إدارة مدرسي المواد وحسابات الدخول</span>
              </h3>
              <p className="text-xs text-slate-500">
                أضف اسم المدرس، اسم المستخدم، وكلمة المرور لكي يستطيع تسجيل الدخول بهاتفه
              </p>
            </div>

            <button
              onClick={handleOpenAddTeacher}
              className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مدرس جديد</span>
            </button>
          </div>

          {/* Teacher Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((t) => {
              const isPassVisible = showPasswords[t.id];
              const teacherClassesCount = classes.filter((c) => c.teacherId === t.id).length;
              const isConfirmingDelete = confirmDeleteTeacherId === t.id;

              return (
                <div
                  key={t.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900/50 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3.5"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {t.name}
                        </h4>
                        {t.isOnLeave && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950">
                            مجاز 🏖️
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          مادة {t.subject}
                        </span>
                        {t.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            صلاحية إدارة ({t.jobTitle || 'مدير/معاون'})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            <GraduationCap className="w-3 h-3" />
                            صلاحية مدرس ({t.jobTitle || 'مدرس مادة'})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditTeacher(t)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="تعديل المدرس"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTeacherId(t.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        title="حذف المدرس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Delete Confirmation to eliminate window.confirm issues on mobile */}
                  {isConfirmingDelete && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-2">
                      <p className="font-bold">هل أنت متأكد من حذف المدرس ({t.name}) وحصصه؟</p>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            await onDeleteTeacher(t.id);
                            setConfirmDeleteTeacherId(null);
                          }}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                        >
                          نعم، حذف المدرس
                        </button>
                        <button
                          onClick={() => setConfirmDeleteTeacherId(null)}
                          className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Teacher Leave Status Badge (Status display only - Teacher toggles from their own account) */}
                  <div className={`rounded-xl border p-2.5 flex items-center justify-between text-xs transition ${
                    t.isOnLeave
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}>
                    {t.isOnLeave ? (
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5 font-bold text-amber-500">
                          <Coffee className="w-4 h-4 text-amber-500" />
                          <span>المدرس مجاز حالياً 🏖️</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          الرنين معطل
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                          <span>متواجد في الدوام المدرسي</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                          دوام كامل ✅
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Login Credentials Box for Admin */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>اسم المستخدم:</span>
                      <code className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {t.username}
                      </code>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>كلمة المرور:</span>
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {isPassVisible ? t.password : '••••••'}
                        </code>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(t.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {t.phone && (
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                        <span>رقم الهاتف:</span>
                        <span className="font-mono">{t.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">إجمالي الحصص: {teacherClassesCount}</span>
                    <button
                      onClick={() => handleOpenAddClass(t.id)}
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة حصة للمدرس</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: Classes Timetable Management */}
      {activeTab === 'classes' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>جدول الحصص الأسبوعي (من الأحد إلى الخميس)</span>
              </h3>
              <p className="text-xs text-slate-500">
                مرتب بالأيام وبأسماء المدرسين مع التوقيت بنظام ١٢ ساعة
              </p>
            </div>

            <button
              onClick={() => handleOpenAddClass()}
              className="py-2.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة حصة جديدة</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-3 items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">تصفية بالمدرس:</span>
              <select
                value={filterTeacher}
                onChange={(e) => setFilterTeacher(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">جميع المدرسين ({teachers.length})</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600 dark:text-slate-300">تصفية باليوم:</span>
              <select
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
              >
                <option value="all">جميع أيام الدوام (الأحد - الخميس)</option>
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d.id} value={d.id}>
                    يوم {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Classes Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-4 font-bold">اليوم</th>
                  <th className="py-3 px-4 font-bold">المدرس</th>
                  <th className="py-3 px-4 font-bold">المادة الدراسية</th>
                  <th className="py-3 px-4 font-bold">الصف والشعبة</th>
                  <th className="py-3 px-4 font-bold">وقت الحصة (١٢ ساعة)</th>
                  <th className="py-3 px-4 font-bold">التنبيه المسبق</th>
                  <th className="py-3 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedClasses.map((c) => {
                  const teacher = teachers.find((t) => t.id === c.teacherId);
                  const day = DAYS_OF_WEEK.find((d) => d.id === c.dayOfWeek);
                  const isConfirmingDelete = confirmDeleteClassId === c.id;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          {day?.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{teacher?.name || 'مدرس غير معروف'}</span>
                          {teacher?.isOnLeave && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/40">
                              مجاز 🏖️
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {c.subject}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {c.gradeAndSection}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                        {formatTimeRangeTo12Hour(c.startTime, c.endTime)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          قبل {c.alertMinutesBefore || 2} د
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isConfirmingDelete ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={async () => {
                                await onDeleteClass(c.id);
                                setConfirmDeleteClassId(null);
                              }}
                              className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
                            >
                              حذف
                            </button>
                            <button
                              onClick={() => setConfirmDeleteClassId(null)}
                              className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px] cursor-pointer"
                            >
                              إلغاء
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditClass(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="تعديل الحصة"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteClassId(c.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="حذف الحصة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: School Identity, Logo & App Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    إعدادات وهوية المدرسة ولوكو التطبيق
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تغيير اسم المدرسة وشعارها؛ سيتم تلقائياً تحديث أيقونة التطبيق (App Icon) واسم التطبيق في المتصفح والهاتف والترويسة
                  </p>
                </div>
              </div>

              {settingsSavedSuccess && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم حفظ وتحديث الهوية بنجاح!</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveSchoolSettings} className="mt-6 space-y-8">
              
              {/* Section 1: School Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  اسم المدرسة أو المؤسسة التعليمية (اسم التطبيق):
                </label>
                <input
                  type="text"
                  required
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="مثال: ثانوية النخبة النموذجية للبنين"
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition"
                />
                <p className="text-[11px] text-slate-400">
                  يظهر هذا الاسم في أعلى صفحات التطبيق، شاشة تسجيل دخول المدرسين، وعنوان نافذة المتصفح وأيقونة التثبيت (PWA).
                </p>
              </div>

              {/* Section 2: School Logo (Upload or Preset) */}
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  شعار ولوكو المدرسة (أيقونة التطبيق):
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                  
                  {/* Current Active Logo Card */}
                  <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                    <span className="text-xs font-bold text-slate-500 block">الشعار المعتمد حالياً:</span>
                    <div className="w-24 h-24 rounded-2xl mx-auto overflow-hidden border-2 border-amber-500/50 bg-slate-900 shadow-lg flex items-center justify-center p-2">
                      {schoolLogoInput ? (
                        <img
                          src={schoolLogoInput}
                          alt="لوكو المدرسة"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-amber-400 flex flex-col items-center">
                          <GraduationCap className="w-10 h-10 mb-1" />
                          <span className="text-[9px] font-bold">افتراضي</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      {/* File Upload Button */}
                      <label
                        htmlFor="school-logo-file-picker"
                        className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>رفع لوكو من جهازك 📁</span>
                      </label>
                      <input
                        id="school-logo-file-picker"
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />

                      {schoolLogoInput && (
                        <button
                          type="button"
                          onClick={() => setSchoolLogoInput('')}
                          className="py-1.5 px-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition cursor-pointer"
                        >
                          إلغاء واستعادة الشعار الافتراضي
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preset Badges Choice */}
                  <div className="md:col-span-2 space-y-2.5">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
                      أو اختر من الشعارات والنماذج التعليمية الراقية الجاهزة فوراً:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {PRESET_SCHOOL_LOGOS.map((preset) => {
                        const isSelected = schoolLogoInput === preset.dataUrl;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSchoolLogoInput(preset.dataUrl)}
                            className={`p-3 rounded-2xl border text-right transition flex items-center gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold ring-2 ring-amber-500/20'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-amber-300 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 shrink-0 p-1 flex items-center justify-center overflow-hidden">
                              <img src={preset.dataUrl} alt={preset.name} className="w-full h-full object-contain" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs truncate">{preset.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-500" />}
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">{preset.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Section 3: Live Preview Component */}
              <div className="rounded-2xl bg-slate-900 text-white p-5 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">
                    معاينة حية: كيف ستظهر الهوية واللوكو في المتصفح والهاتف؟
                  </span>
                </div>

                {/* Mock Browser Tab */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">1. علامة تبويب المتصفح (Browser Tab):</span>
                  <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-t-xl bg-slate-800 border-t border-x border-slate-700 text-xs font-semibold text-slate-200 max-w-sm">
                    <div className="w-4 h-4 rounded shrink-0 overflow-hidden bg-slate-900 flex items-center justify-center">
                      {schoolLogoInput ? (
                        <img src={schoolLogoInput} alt="icon" className="w-full h-full object-contain" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <span className="truncate">{schoolNameInput || 'نظام جرس الحصص الذكي'}</span>
                  </div>
                </div>

                {/* Mock Header Branding */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-slate-400 block">2. ترويسة التطبيق (App Header):</span>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 max-w-md">
                    <div className="w-10 h-10 rounded-xl overflow-hidden border border-amber-400/30 bg-slate-900 p-0.5 flex items-center justify-center shrink-0">
                      {schoolLogoInput ? (
                        <img src={schoolLogoInput} alt="icon" className="w-full h-full object-contain" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-amber-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-black text-white block truncate">
                        {schoolNameInput || 'نظام جرس الحصص الذكي'}
                      </span>
                      <span className="text-[10px] text-amber-400 font-semibold block">
                        جرس الحصص الذكي • جدول المدرسين
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Class Alert Timing */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">
                  وقت تنبيه ورنين جرس الحصة قبل الموعد:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-xl">
                  {[1, 2, 3, 5].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setAlertMinutesInput(mins)}
                      className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        alertMinutesInput === mins
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {mins === 2 ? 'دقيقتين (الموصى به)' : `${mins} ${mins === 1 ? 'دقيقة' : 'دقائق'}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="py-3 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSavingSettings ? 'جارٍ الحفظ وتحديث الأيقونة...' : 'حفظ وتثبيت اسم ولوكو المدرسة 💾'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Teacher */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100 my-8">
            <h3 className="text-lg font-bold mb-1">
              {editingTeacherId ? 'تعديل بيانات المدرس' : 'إضافة مدرس مادة جديد'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              أدخل بيانات المدرس وبيانات تسجيل الدخول الخاصة به
            </p>

            {teacherFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{teacherFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTeacher} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">اسم المدرس الثلاثي:</label>
                <input
                  type="text"
                  required
                  placeholder="اسم المدرس"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">المادة الدراسية:</label>
                <input
                  type="text"
                  required
                  placeholder="المادة الدراسية (الفيزياء، الرياضيات...)"
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">اسم المستخدم (للدخول):</label>
                  <input
                    type="text"
                    required
                    placeholder="اسم المستخدم"
                    value={teacherUsername}
                    onChange={(e) => setTeacherUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">كلمة المرور:</label>
                  <input
                    type="text"
                    required
                    placeholder="كلمة المرور"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">رقم الهاتف (اختياري):</label>
                <input
                  type="text"
                  placeholder="07xxxxxxxxx"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Account Role & Permission (Requested: Director & Assistant get Admin role, Teacher gets own classes only) */}
              <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2.5">
                <label className="block font-bold text-slate-900 dark:text-white">
                  نوع الحساب والصلاحية الممنوحة:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTeacherRole('teacher');
                      setTeacherJobTitle('مدرس مادة');
                    }}
                    className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                      teacherRole === 'teacher'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      مدرس مادة
                    </span>
                    <span className={`text-[10px] mt-1 ${teacherRole === 'teacher' ? 'text-blue-100' : 'text-slate-500'}`}>
                      يرى حصصه وجدوله فقط
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTeacherRole('admin');
                      setTeacherJobTitle('مدير مدرسة');
                    }}
                    className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                      teacherRole === 'admin' && teacherJobTitle === 'مدير مدرسة'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      مدير مدرسة
                    </span>
                    <span className={`text-[10px] mt-1 ${teacherRole === 'admin' && teacherJobTitle === 'مدير مدرسة' ? 'text-amber-100' : 'text-slate-500'}`}>
                      صلاحية إدارة كاملة
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTeacherRole('admin');
                      setTeacherJobTitle('معاون مدرسة');
                    }}
                    className={`p-2.5 rounded-xl border text-right transition cursor-pointer flex flex-col justify-between ${
                      teacherRole === 'admin' && teacherJobTitle === 'معاون مدرسة'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      معاون مدرسة
                    </span>
                    <span className={`text-[10px] mt-1 ${teacherRole === 'admin' && teacherJobTitle === 'معاون مدرسة' ? 'text-indigo-100' : 'text-slate-500'}`}>
                      صلاحية إدارة كاملة
                    </span>
                  </button>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold shrink-0">المسمى الوظيفي:</span>
                  <input
                    type="text"
                    value={teacherJobTitle}
                    onChange={(e) => setTeacherJobTitle(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold focus:outline-none"
                    placeholder="مثال: مدرس أول / معاون شؤون الطلبة"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">ملاحظات إضافية:</label>
                <textarea
                  rows={2}
                  placeholder="ملاحظات حول المدرس..."
                  value={teacherNotes}
                  onChange={(e) => setTeacherNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTeacherModal(false)}
                  className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ بيانات المدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Class Schedule (Room field removed per user request) */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100 my-8">
            <h3 className="text-lg font-bold mb-1">
              {editingClassId ? 'تعديل موعد الحصة' : 'إضافة حصة جديدة في الجدول'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              حدد المدرس، اليوم، والصف والشعبة والتوقيت
            </p>

            {classSavedSuccessMessage && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs">{classSavedSuccessMessage}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px]">
                      +{sessionClassesAddedCount} حصة مضافة
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    تبقى الصفحة مفتوحة لراحتك. تم تقديم وقت الحصة تلقائياً ويمكنك حفظ حصص أخرى فوراً.
                  </p>
                </div>
              </div>
            )}

            {classFormError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{classFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveClass} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">اختر المدرس:</label>
                <select
                  required
                  value={classTeacherId}
                  onChange={(e) => {
                    setClassTeacherId(e.target.value);
                    const selected = teachers.find((t) => t.id === e.target.value);
                    if (selected && !classSubject) {
                      setClassSubject(selected.subject);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- اختر المدرس --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">يوم الحصة (من الأحد إلى الخميس):</label>
                <select
                  required
                  value={classDayOfWeek}
                  onChange={(e) => setClassDayOfWeek(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.id} value={d.id}>
                      يوم {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">وقت البدء:</label>
                  <input
                    type="time"
                    required
                    value={classStartTime}
                    onChange={(e) => setClassStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    العرض: {formatTimeTo12Hour(classStartTime)}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold mb-1">وقت الانتهاء:</label>
                  <input
                    type="time"
                    required
                    value={classEndTime}
                    onChange={(e) => setClassEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    العرض: {formatTimeTo12Hour(classEndTime)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">المادة الدراسية:</label>
                <input
                  type="text"
                  required
                  placeholder="المادة الدراسية"
                  value={classSubject}
                  onChange={(e) => setClassSubject(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">الصف والشعبة (الابتدائي):</label>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">اختيار سريع:</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { label: 'الأول الابتدائي', value: 'الصف الأول الابتدائي - أ' },
                    { label: 'الثاني الابتدائي', value: 'الصف الثاني الابتدائي - أ' },
                    { label: 'الثالث الابتدائي', value: 'الصف الثالث الابتدائي - أ' },
                    { label: 'الرابع الابتدائي', value: 'الصف الرابع الابتدائي - أ' },
                    { label: 'الخامس الابتدائي', value: 'الصف الخامس الابتدائي - أ' },
                    { label: 'السادس الابتدائي', value: 'الصف السادس الابتدائي - أ' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setClassGrade(preset.value)}
                      className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer text-center ${
                        classGrade.includes(preset.label)
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  placeholder="مثال: الصف الأول الابتدائي - شعبة أ"
                  value={classGrade}
                  onChange={(e) => setClassGrade(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">إطلاق جرس التنبيه قبل بدء الحصة بـ:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={classAlertMinutes}
                    onChange={(e) => setClassAlertMinutes(Number(e.target.value))}
                    className="w-24 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-slate-500 font-semibold">دقائق (افتراضي: دقيقتين)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                {!editingClassId ? (
                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowClassModal(false);
                        setClassSavedSuccessMessage(null);
                        setSessionClassesAddedCount(0);
                      }}
                      className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-center text-xs transition"
                    >
                      {sessionClassesAddedCount > 0
                        ? `تم الانتهاء وإغلاق النافذة (${sessionClassesAddedCount} مضافة) ✓`
                        : 'إلغاء وإغلاق'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50 text-xs flex items-center justify-center gap-2 transition"
                    >
                      {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ ومتابعة إضافة حصة أخرى ➕'}
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowClassModal(false)}
                      className="py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 cursor-pointer text-xs"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-2 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow cursor-pointer disabled:opacity-50 text-xs"
                    >
                      {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات في الجدول'}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
