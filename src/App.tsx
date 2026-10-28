import React, { useState, useEffect, useCallback } from 'react';
import {
  Teacher,
  ClassSchedule,
  AttendanceLog,
  SchoolSettings,
  CurrentUser,
} from './types';
import {
  saveCachedData,
  getCachedTeachers,
  getCachedClasses,
  getCachedSettings,
  getCachedLogs,
  saveCurrentUser,
  getSavedCurrentUser,
  markClassAcknowledgedToday,
  queueOfflineAcknowledgment,
  getPendingOfflineAcknowledgments,
  clearPendingOfflineAcknowledgments,
  getSavedAlertMinutes,
} from './utils/offlineStorage';
import {
  dbAddTeacher,
  dbUpdateTeacher,
  dbDeleteTeacher,
  dbToggleTeacherLeave,
  dbAddClass,
  dbUpdateClass,
  dbDeleteClass,
  dbUpdateSettings,
  ensureDatabaseInitialized,
  mergeServerAndLocalData,
  INITIAL_DEFAULT_DATA,
} from './utils/database';
import { stopSchoolBell, unlockAudio } from './utils/audioBell';
import { useClassScheduler } from './hooks/useClassScheduler';
import { Header } from './components/Header';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ClassAlarmModal } from './components/ClassAlarmModal';
import { LoginModal } from './components/LoginModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { CheckCircle2 } from 'lucide-react';
import { apiUrl } from './utils/apiConfig';

export default function App() {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Initialize data with local persistence and default seeding
  const initialDb = ensureDatabaseInitialized();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const remember = localStorage.getItem('school_bell_remember_me');
      if (remember === 'false') {
        return null;
      }
      return getSavedCurrentUser();
    } catch {
      return null;
    }
  });
  const [teachers, setTeachers] = useState<Teacher[]>(initialDb.teachers);
  const [classes, setClasses] = useState<ClassSchedule[]>(initialDb.classes);
  const [logs, setLogs] = useState<AttendanceLog[]>(initialDb.logs);
  const [settings, setSettings] = useState<SchoolSettings>(initialDb.settings);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // Update pending sync count
  const checkPendingSync = useCallback(() => {
    const pending = getPendingOfflineAcknowledgments();
    setPendingSyncCount(pending.length);
  }, []);

  // Sync queued offline logs when internet is available
  const syncOfflineQueue = useCallback(async () => {
    const pending = getPendingOfflineAcknowledgments();
    if (pending.length === 0) return;

    try {
      const res = await fetch(apiUrl('/api/logs/sync-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: pending }),
      });
      if (res.ok) {
        clearPendingOfflineAcknowledgments();
        setPendingSyncCount(0);
        showToast(`✅ تمت مزامنة ${pending.length} إشعار توجه مع الخادم بنجاح`);
      }
    } catch {
      // offline
    }
  }, [showToast]);

  // Load and cache database from backend if present, else keep local database
  // silent = true during periodic background polling to avoid distracting resets
  const loadDatabase = useCallback(async (silent = false) => {
    try {
      const res = await fetch(apiUrl('/api/sync-cache'));
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const merged = mergeServerAndLocalData(data);
        
        // Real-time diff update to keep Teacher's phone instantly in sync with Admin changes
        setTeachers((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(merged.teachers)) {
            return merged.teachers;
          }
          return prev;
        });

        setClasses((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(merged.classes)) {
            return merged.classes;
          }
          return prev;
        });

        setLogs((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(merged.logs)) {
            return merged.logs;
          }
          return prev;
        });

        setSettings((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(merged.settings)) {
            return merged.settings;
          }
          return prev;
        });

        syncOfflineQueue();
        checkPendingSync();
        setIsOnline(true);
        return;
      }
    } catch {
      // Server not reachable or static host; use local persistent database
    }

    if (!silent) {
      const currentCached = ensureDatabaseInitialized();
      setTeachers(currentCached.teachers);
      setClasses(currentCached.classes);
      setLogs(currentCached.logs);
      setSettings(currentCached.settings);
      checkPendingSync();
    }
  }, [syncOfflineQueue, checkPendingSync]);

  useEffect(() => {
    // Initial fetch
    loadDatabase();

    // 1. Auto-poll cloud database every 3 seconds for instant real-time multi-device sync
    // When Admin adds a class on device A, Teacher on device B receives it immediately!
    const pollInterval = setInterval(() => {
      loadDatabase(true);
      syncOfflineQueue();
    }, 3000);

    // 2. Immediate refresh when teacher switches to tab or unlocks mobile phone
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadDatabase(true);
      }
    };

    const handleOnline = () => {
      setIsOnline(true);
      showToast('🌐 متصل بقاعدة البيانات السحابية');
      syncOfflineQueue();
      loadDatabase();
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('📴 وضع عدم الاتصال - قاعدة البيانات تعمل وتخزن محلياً بالكامل');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [loadDatabase, syncOfflineQueue, showToast]);

  // Dynamic School Name & Logo updater (Updates document.title, favicon, apple-touch-icon, and meta tags)
  useEffect(() => {
    const name = settings.schoolName || 'نظام جرس الحصص الذكي';
    document.title = name;

    const metaAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (metaAppleTitle) metaAppleTitle.setAttribute('content', name);

    const metaOgTitle = document.querySelector('meta[property="og:title"]');
    if (metaOgTitle) metaOgTitle.setAttribute('content', name);

    if (settings.schoolLogo) {
      let iconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!iconLink) {
        iconLink = document.createElement('link');
        iconLink.rel = 'icon';
        document.head.appendChild(iconLink);
      }
      iconLink.href = settings.schoolLogo;

      let appleIconLink = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
      if (!appleIconLink) {
        appleIconLink = document.createElement('link');
        appleIconLink.rel = 'apple-touch-icon';
        document.head.appendChild(appleIconLink);
      }
      appleIconLink.href = settings.schoolLogo;
    }

    // Dynamic PWA Manifest Updater: Ensures the Install dialog & Phone Homescreen show the exact new School Name & Logo
    try {
      const dynamicManifest = {
        id: '/',
        name: name,
        short_name: name.length > 15 ? name.substring(0, 15) : name,
        description: `تطبيق جدول الحصص وجرس التنبيه الذكي - ${name}`,
        theme_color: '#1e3a8a',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'ar',
        dir: 'rtl',
        icons: settings.schoolLogo
          ? [
              {
                src: settings.schoolLogo,
                sizes: '192x192',
                type: settings.schoolLogo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
                purpose: 'any',
              },
              {
                src: settings.schoolLogo,
                sizes: '512x512',
                type: settings.schoolLogo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/png',
                purpose: 'any maskable',
              },
            ]
          : [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any',
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable',
              },
            ],
      };

      const manifestBlob = new Blob([JSON.stringify(dynamicManifest)], { type: 'application/manifest+json' });
      const manifestUrl = URL.createObjectURL(manifestBlob);

      let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;
    } catch (e) {
      console.warn('Failed to update dynamic manifest link:', e);
    }
  }, [settings.schoolName, settings.schoolLogo]);

  // Scheduler hook: Checks every second for current teacher's classes
  const alertMinutes = getSavedAlertMinutes();
  const {
    currentTime,
    activeAlarmClass,
    secondsRemainingToAlarmClass,
    nextUpcomingClass,
    secondsToNextClass,
    currentRunningClass,
    dismissAlarm,
  } = useClassScheduler(
    currentUser?.role === 'teacher' ? currentUser.id : null,
    classes,
    alertMinutes,
    Boolean(currentUser?.isOnLeave)
  );

  // Toggle Teacher On-Leave (Requested: "زر للمدرس مال اجازة من ايدوسه مينطي لا تنبيه ولا صوت")
  const handleToggleTeacherLeave = async (teacherId: string, isOnLeave?: boolean) => {
    try {
      const res = await dbToggleTeacherLeave(teachers, teacherId, isOnLeave);
      setTeachers(res.updatedTeachers);

      // If the currently logged in user is this teacher, update currentUser state immediately
      if (currentUser && currentUser.id === teacherId) {
        const updatedCurrentUser: CurrentUser = {
          ...currentUser,
          isOnLeave: res.teacher.isOnLeave,
        };
        setCurrentUser(updatedCurrentUser);
        saveCurrentUser(updatedCurrentUser);
      }

      if (res.teacher.isOnLeave) {
        stopSchoolBell();
        showToast('🏖️ تم تفعيل وضع الإجازة: تم إيقاف الجرس والأصوات وحفظ حالتك (مجاز)');
      } else {
        showToast('✅ تم إنهاء الإجازة والعودة للدوام الرسمي');
      }
      return true;
    } catch {
      showToast('تعذر تحديث حالة الإجازة');
      return false;
    }
  };

  // Acknowledge Heading to Class ("من ايدوس الغاء يجيني اشعار انو راح يتوجه للدرس")
  const handleAcknowledgeHeading = async (classItem: ClassSchedule, note?: string) => {
    stopSchoolBell();
    markClassAcknowledgedToday(classItem.id);
    dismissAlarm();

    const newLogItem: AttendanceLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      teacherId: currentUser?.id || classItem.teacherId,
      teacherName: currentUser?.name || 'مدرس المادة',
      classId: classItem.id,
      subject: classItem.subject,
      gradeAndSection: classItem.gradeAndSection,
      room: classItem.room,
      classStartTime: classItem.startTime,
      acknowledgedAt: new Date().toISOString(),
      scheduledDate: new Date().toISOString().split('T')[0],
      status: 'heading_to_class',
      note: note || 'قام المدرس بإلغاء التنبيه وأكد التوجه للصف',
      syncedFromOffline: !navigator.onLine,
    };

    // Update state locally first
    const updatedLogs = [newLogItem, ...logs];
    setLogs(updatedLogs);
    saveCachedData({ logs: updatedLogs });

    if (!navigator.onLine) {
      queueOfflineAcknowledgment(newLogItem);
      checkPendingSync();
      showToast('✅ تم إيقاف الجرس وتسجيل توجهك محلياً (سيتم إرساله للإدارة فور توفر النت)');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/logs/acknowledge'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLogItem),
      });
      if (res.ok) {
        showToast('✅ تم إيقاف الجرس وتأكيد التوجه للدرس، تم إشعار الإدارة فوراً');
      } else {
        queueOfflineAcknowledgment(newLogItem);
        checkPendingSync();
      }
    } catch {
      queueOfflineAcknowledgment(newLogItem);
      checkPendingSync();
      showToast('✅ تم حفظ التوجه محلياً، ستتم مزامنته تلقائياً');
    }
  };

  // Login handler
  const handleLogin = async (username: string, pass: string, rememberMe = true) => {
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Admin login check (supports admin / admin as requested)
    if (
      (cleanUser === 'admin' && (cleanPass === 'admin' || cleanPass === 'admin123')) ||
      (cleanUser === 'مدير' && (cleanPass === 'admin' || cleanPass === '123'))
    ) {
      const adminUser: CurrentUser = {
        id: 'admin-1',
        name: 'إدارة المدرسة (المشرف العام)',
        username: 'admin',
        role: 'admin',
      };
      setCurrentUser(adminUser);
      if (rememberMe) {
        localStorage.setItem('school_bell_remember_me', 'true');
        saveCurrentUser(adminUser);
      } else {
        localStorage.setItem('school_bell_remember_me', 'false');
      }
      showToast('مرحباً بك في لوحة الإدارة');
      return { success: true };
    }

    // 2. Local teacher check
    const localTeacher = teachers.find(
      (t) =>
        t.username.trim().toLowerCase() === cleanUser &&
        t.password?.trim() === cleanPass
    );

    if (localTeacher) {
      const isUserAdmin = localTeacher.role === 'admin';
      const u: CurrentUser = {
        id: localTeacher.id,
        name: localTeacher.name,
        username: localTeacher.username,
        role: isUserAdmin ? 'admin' : 'teacher',
        jobTitle: localTeacher.jobTitle || (isUserAdmin ? 'إدارة المدرسة' : 'مدرس مادة'),
        subject: localTeacher.subject,
        phone: localTeacher.phone,
        isOnLeave: localTeacher.isOnLeave || false,
      };
      setCurrentUser(u);
      if (rememberMe) {
        localStorage.setItem('school_bell_remember_me', 'true');
        saveCurrentUser(u);
      } else {
        localStorage.setItem('school_bell_remember_me', 'false');
      }
      showToast(isUserAdmin ? `مرحباً بك في لوحة الإدارة، ${u.name}` : `مرحباً بك، ${u.name}`);
      return { success: true };
    }

    // 3. Fallback to API if server is running
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        let loggedUser: CurrentUser;
        if (data.role === 'admin') {
          loggedUser = {
            id: data.user.id,
            name: data.user.name,
            username: data.user.username,
            role: 'admin',
            jobTitle: data.user.jobTitle || 'إدارة المدرسة',
            subject: data.user.subject,
            phone: data.user.phone,
          };
        } else {
          loggedUser = {
            id: data.teacher.id,
            name: data.teacher.name,
            username: data.teacher.username,
            role: 'teacher',
            jobTitle: data.teacher.jobTitle || 'مدرس مادة',
            subject: data.teacher.subject,
            phone: data.teacher.phone,
            isOnLeave: data.teacher.isOnLeave || false,
          };
        }
        setCurrentUser(loggedUser);
        if (rememberMe) {
          localStorage.setItem('school_bell_remember_me', 'true');
          saveCurrentUser(loggedUser);
        } else {
          localStorage.setItem('school_bell_remember_me', 'false');
        }
        showToast(`مرحباً بك، ${loggedUser.name}`);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
  };

  const handleLogout = () => {
    stopSchoolBell();
    setCurrentUser(null);
    saveCurrentUser(null);
    localStorage.removeItem('school_bell_remember_me');
    showToast('تم تسجيل الخروج بنجاح');
  };

  // Universal Database CRUD Operations
  const handleAddTeacher = async (teacherData: Omit<Teacher, 'id' | 'createdAt'>) => {
    try {
      const res = await dbAddTeacher(teachers, teacherData);
      setTeachers(res.updatedTeachers);
      showToast('✅ تمت إضافة المدرس بنجاح وحفظه في قاعدة البيانات');
      return true;
    } catch (e: any) {
      showToast(`خطأ: ${e.message}`);
      return false;
    }
  };

  const handleUpdateTeacher = async (id: string, teacherData: Partial<Teacher>) => {
    try {
      const res = await dbUpdateTeacher(teachers, id, teacherData);
      setTeachers(res.updatedTeachers);
      showToast('✅ تم تحديث بيانات المدرس وحفظها');
      return true;
    } catch (e: any) {
      showToast(`خطأ: ${e.message}`);
      return false;
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      const res = await dbDeleteTeacher(teachers, classes, id);
      setTeachers(res.updatedTeachers);
      setClasses(res.updatedClasses);
      showToast('تم حذف المدرس وحصصه');
      return true;
    } catch {
      showToast('فشل حذف المدرس');
      return false;
    }
  };

  const handleAddClass = async (classData: Omit<ClassSchedule, 'id'>) => {
    try {
      const res = await dbAddClass(classes, classData);
      setClasses(res.updatedClasses);
      showToast('✅ تمت إضافة الحصة بنجاح وحفظها في الجدول');
      return true;
    } catch (e: any) {
      showToast(`خطأ: ${e.message}`);
      return false;
    }
  };

  const handleUpdateClass = async (id: string, classData: Partial<ClassSchedule>) => {
    try {
      const res = await dbUpdateClass(classes, id, classData);
      setClasses(res.updatedClasses);
      showToast('✅ تم تحديث موعد الحصة وحفظه');
      return true;
    } catch (e: any) {
      showToast(`خطأ: ${e.message}`);
      return false;
    }
  };

  const handleDeleteClass = async (id: string) => {
    try {
      const res = await dbDeleteClass(classes, id);
      setClasses(res.updatedClasses);
      showToast('تم حذف الحصة من الجدول');
      return true;
    } catch {
      showToast('فشل حذف الحصة');
      return false;
    }
  };

  const handleImportDatabase = async (data: any) => {
    if (!data || (!data.teachers && !data.classes)) {
      showToast('⚠️ ملف النسخة الاحتياطية غير صالح');
      return false;
    }
    const newTeachers = data.teachers || teachers;
    const newClasses = data.classes || classes;
    const newLogs = data.logs || logs;
    const newSettings = data.settings || settings;

    setTeachers(newTeachers);
    setClasses(newClasses);
    setLogs(newLogs);
    setSettings(newSettings);

    saveCachedData({
      teachers: newTeachers,
      classes: newClasses,
      logs: newLogs,
      settings: newSettings,
    });

    try {
      fetch(apiUrl('/api/database/import'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teachers: newTeachers, classes: newClasses, logs: newLogs, settings: newSettings }),
      }).catch(() => {});
    } catch {}

    showToast('✅ تم استيراد وتفعيل قاعدة البيانات بنجاح!');
    return true;
  };

  const handleUpdateSettings = async (newSettings: Partial<SchoolSettings>) => {
    const updated = await dbUpdateSettings(newSettings);
    setSettings(updated);
    showToast('✅ تم حفظ إعدادات المدرسة في قاعدة البيانات');
    return true;
  };

  // Quick Action: Create Test Class Starting in 2 Minutes or 10 seconds for current teacher
  const handleCreateQuickTestClass = async (secondsOffset = 120) => {
    if (!currentUser) return;
    unlockAudio();

    // Calculate time strictly according to user's phone / browser local clock
    const clientNow = new Date();
    const targetDate = new Date(clientNow.getTime() + secondsOffset * 1000);
    const testH = String(targetDate.getHours()).padStart(2, '0');
    const testM = String(targetDate.getMinutes()).padStart(2, '0');
    const testEndH = String(new Date(targetDate.getTime() + 45 * 60 * 1000).getHours()).padStart(2, '0');
    const testEndM = String(new Date(targetDate.getTime() + 45 * 60 * 1000).getMinutes()).padStart(2, '0');

    const clientStartTime = `${testH}:${testM}`;
    const clientEndTime = `${testEndH}:${testEndM}`;
    const clientDayOfWeek = clientNow.getDay();

    const localTest: ClassSchedule = {
      id: `test-local-${Date.now()}`,
      teacherId: currentUser.id,
      dayOfWeek: clientDayOfWeek,
      subject:
        secondsOffset <= 30
          ? `${currentUser.subject || 'الفيزياء'} (تجربة جرس سريعة)`
          : `${currentUser.subject || 'الفيزياء'} (تجربة جرس الحصة)`,
      gradeAndSection: 'الصف الرابع العلمي (أ)',
      room: 'المختبر الرئيسي',
      startTime: clientStartTime,
      endTime: clientEndTime,
      alertMinutesBefore: 2,
      isActive: true,
    };

    const updated = [localTest, ...classes.filter((c) => !c.id.startsWith('test-'))];
    setClasses(updated);
    saveCachedData({ classes: updated });

    if (secondsOffset <= 30) {
      showToast(`⚡ انطلقت التجربة السريعة! موعدها ${clientStartTime} وسيرن الجرس الآن`);
    } else {
      showToast(`🔔 تم تجهيز الحصة لتوقيت هاتفك (${clientStartTime})! سيبدأ الجرس خلال دقيقتين`);
    }

    try {
      fetch('/api/classes/create-quick-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localTest),
      }).catch(() => {});
    } catch {}
  };

  const handleResetDemoData = async () => {
    setTeachers(INITIAL_DEFAULT_DATA.teachers);
    setClasses(INITIAL_DEFAULT_DATA.classes);
    setLogs(INITIAL_DEFAULT_DATA.logs);
    setSettings(INITIAL_DEFAULT_DATA.settings);

    saveCachedData({
      teachers: INITIAL_DEFAULT_DATA.teachers,
      classes: INITIAL_DEFAULT_DATA.classes,
      logs: INITIAL_DEFAULT_DATA.logs,
      settings: INITIAL_DEFAULT_DATA.settings,
    });

    try {
      fetch('/api/reset-demo', { method: 'POST' }).catch(() => {});
    } catch {}

    showToast('✅ تمت استعادة البيانات النموذجية للمدرسة');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Login Screen if not authenticated */}
      {!currentUser ? (
        <LoginModal
          teachers={teachers}
          schoolName={settings.schoolName}
          schoolLogo={settings.schoolLogo}
          onLogin={handleLogin}
        />
      ) : (
        <>
          {/* Main Top Header */}
          <Header
            currentUser={currentUser}
            schoolName={settings.schoolName}
            schoolLogo={settings.schoolLogo}
            currentTime={currentTime}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onLogout={handleLogout}
          />

          {/* Main Content Area */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {currentUser.role === 'teacher' ? (
              <TeacherDashboard
                currentUser={currentUser}
                classes={classes}
                nextUpcomingClass={nextUpcomingClass}
                secondsToNextClass={secondsToNextClass}
                currentRunningClass={currentRunningClass}
                currentTime={currentTime}
                onToggleLeave={(leaveState) => handleToggleTeacherLeave(currentUser.id, leaveState)}
              />
            ) : (
              <AdminDashboard
                teachers={teachers}
                classes={classes}
                logs={logs}
                settings={settings}
                currentTime={currentTime}
                onAddTeacher={handleAddTeacher}
                onUpdateTeacher={handleUpdateTeacher}
                onDeleteTeacher={handleDeleteTeacher}
                onToggleTeacherLeave={handleToggleTeacherLeave}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onDeleteClass={handleDeleteClass}
                onResetDemoData={handleResetDemoData}
                onRefreshData={loadDatabase}
                onImportDatabase={handleImportDatabase}
                onUpdateSettings={handleUpdateSettings}
              />
            )}
          </main>

          {/* The High-Urgency 2-Minute Bell Alarm Modal */}
          <ClassAlarmModal
            activeClass={activeAlarmClass}
            currentUser={currentUser}
            secondsRemaining={secondsRemainingToAlarmClass}
            onAcknowledge={handleAcknowledgeHeading}
          />

          {/* Sound & Notifications Settings Modal */}
          <NotificationSettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        </>
      )}

    </div>
  );
}
