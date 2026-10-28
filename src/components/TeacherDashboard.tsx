import React, { useState, useEffect } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  BellRing,
  Volume2,
  Check,
} from 'lucide-react';
import { ClassSchedule, CurrentUser, DAYS_OF_WEEK } from '../types';
import { isClassAcknowledgedToday } from '../utils/offlineStorage';
import {
  unlockAudio,
  startBackgroundGuard,
  playSchoolBell,
} from '../utils/audioBell';
import { formatTimeTo12Hour, formatTimeRangeTo12Hour, formatDateTo12Hour } from '../utils/timeFormat';

interface Props {
  currentUser: CurrentUser;
  classes: ClassSchedule[];
  nextUpcomingClass: ClassSchedule | null;
  secondsToNextClass: number;
  currentRunningClass: ClassSchedule | null;
  currentTime: Date;
  onToggleLeave?: (isOnLeave: boolean) => Promise<boolean | void>;
  onCreateQuickTestClass?: (secondsOffset?: number) => Promise<void>;
  onOpenSettings?: () => void;
}

export const TeacherDashboard: React.FC<Props> = ({
  currentUser,
  classes,
  nextUpcomingClass,
  secondsToNextClass,
  currentRunningClass,
  currentTime,
  onToggleLeave,
}) => {
  const currentDay = currentTime.getDay();
  // Ensure selectedDay falls within Sunday (0) to Thursday (4)
  const defaultSelectedDay = currentDay >= 0 && currentDay <= 4 ? currentDay : 0;
  const [selectedDay, setSelectedDay] = useState<number>(defaultSelectedDay);

  const checkIsFullyActive = (): boolean => {
    if (typeof window === 'undefined') return false;
    const isBellActivated = localStorage.getItem('teacher_bell_activated') === 'true';
    if (!isBellActivated) return false;
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        return false;
      }
    }
    return true;
  };

  const [isFullyActive, setIsFullyActive] = useState<boolean>(checkIsFullyActive);

  // Monitor notification permission and focus so banner reappears if permission revoked in browser settings
  useEffect(() => {
    const handleCheck = () => {
      setIsFullyActive(checkIsFullyActive());
    };

    handleCheck();

    window.addEventListener('focus', handleCheck);
    document.addEventListener('visibilitychange', handleCheck);

    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      try {
        navigator.permissions?.query({ name: 'notifications' as PermissionName })
          .then((status) => {
            status.onchange = handleCheck;
          })
          .catch(() => {});
      } catch {}
    }

    return () => {
      window.removeEventListener('focus', handleCheck);
      document.removeEventListener('visibilitychange', handleCheck);
    };
  }, []);

  // One-time permission modal state: must approve to stop showing on future logins
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('bell_permissions_accepted') !== 'true' &&
        localStorage.getItem('teacher_bell_activated') !== 'true'
      );
    } catch {
      return false;
    }
  });

  const [activationFeedback, setActivationFeedback] = useState<string | null>(null);

  // Auto-start background guard if already approved
  useEffect(() => {
    try {
      if (localStorage.getItem('bell_permissions_accepted') === 'true' || localStorage.getItem('teacher_bell_activated') === 'true') {
        startBackgroundGuard(`أستاذ ${currentUser.name}`);
      }
    } catch {
      // ignore
    }
  }, [currentUser.name]);

  const handleActivateBellAndLessons = async () => {
    try {
      unlockAudio();
      startBackgroundGuard(`أستاذ ${currentUser.name}`);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission !== 'granted') {
          const perm = await Notification.requestPermission();
          if (perm !== 'granted') {
            setIsFullyActive(false);
            setActivationFeedback('يرجى السماح بالإشعارات من إعدادات المتصفح لضمان الرنين والتنبيه');
            return;
          }
        }
      }
      // Play a short pleasant test chime so the teacher immediately hears the bell ringing!
      playSchoolBell('melodic', 2.5, 0.95);
      localStorage.setItem('teacher_bell_activated', 'true');
      localStorage.setItem('bell_permissions_accepted', 'true');
      setShowPermissionModal(false);
      setIsFullyActive(true);
      setActivationFeedback('تم تفعيل مكبر الصوت والإشعارات بنجاح!');
      setTimeout(() => setActivationFeedback(null), 3000);
    } catch (e) {
      console.warn('Error activating bell:', e);
    }
  };

  const handleApprovePermissions = handleActivateBellAndLessons;

  // Filter classes belonging to this teacher
  const myClasses = classes.filter((c) => c.teacherId === currentUser.id);

  // Today's classes for this teacher (only if within school week)
  const todaysClasses = (currentDay >= 0 && currentDay <= 4)
    ? myClasses.filter((c) => c.dayOfWeek === currentDay && c.isActive)
    : [];
  todaysClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Classes for the selected tab day
  const displayedDayClasses = myClasses.filter((c) => c.dayOfWeek === selectedDay && c.isActive);
  displayedDayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return 'الآن';
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    if (hours > 0) {
      return `${hours} ساعة و ${mins} دقيقة`;
    }
    return `${mins} دقيقة و ${remainingSecs} ثانية`;
  };

  return (
    <div className="space-y-6">

      {/* TOP ACTIVATION BUTTON & NOTIFICATION CONTROLLER (Requested: disappears when active, reappears if permission revoked) */}
      {!isFullyActive && (
        <div className="rounded-3xl p-5 border-2 border-amber-500 bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 text-white shadow-xl ring-4 ring-amber-500/20 animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-lg shrink-0 animate-bounce">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  اضغط هنا لتفعيل رنين جرس الحصص والإشعارات فوراً 🔔
                </h3>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                  مهم جداً: متصفحات الموبايل تتطلب نقرة لتشغيل مكبر الصوت وضمان دقة مواعيد التنبيهات مع اهتزاز الهاتف عند بدء الحصة.
                </p>
                {activationFeedback && (
                  <p className="text-xs font-bold text-amber-300 mt-1 animate-pulse">
                    {activationFeedback}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleActivateBellAndLessons}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transition transform active:scale-95 bg-amber-500 hover:bg-amber-400 text-slate-950 ring-4 ring-amber-500/30"
              >
                <Volume2 className="w-4 h-4" />
                <span>تفعيل رنين الجرس والدروس الآن 🔔</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* On-Leave Status Banner (Requested: "زر للمدرس مال اجازة من ايدوسه مينطي لا تنبيه ولا صوت واتصير حالة المدرس بالجدول مجاز مال الادارة وبنفس الزر ايدوسة ينهي الاجازة") */}
      {currentUser.isOnLeave ? (
        <div className="rounded-3xl p-5 bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-slate-900 border-2 border-amber-500/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg shadow-amber-500/20">
              🏖️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-amber-300">
                  أنت في وضع الإجازة الرسمية اليوم (مجاز)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  الكتم التام مفعل
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                تم كتم جرس الحصص والتنبيهات الصوتية بالكامل، وتظهر حالتك الآن في جدول ومراقبة الإدارة بصفة (مجاز 🏖️).
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleLeave && onToggleLeave(false)}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition shrink-0"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>إنهاء الإجازة والعودة للدوام ✅</span>
          </button>
        </div>
      ) : null}
      
      {/* Teacher Welcome Header */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-800/60 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام التنبيهات المدرسية الذاتي</span>
              <span className="opacity-50">•</span>
              <span className="font-mono text-amber-300">
                ساعة هاتفك: {formatDateTo12Hour(currentTime, false)}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              مرحباً، {currentUser.name}
            </h2>
            <p className="text-blue-200/90 text-sm max-w-2xl">
              مادة: <strong className="text-white font-bold">{currentUser.subject}</strong> • يتم فحص المواعيد محلياً على هاتفك كل ثانية، ويرن الجرس تلقائياً قبل <strong className="text-amber-300 font-bold">دقيقتين</strong> من بدء الحصة حتى بدون إنترنت.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!currentUser.isOnLeave ? (
              <button
                onClick={() => onToggleLeave && onToggleLeave(true)}
                className="px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 shadow-md"
                title="تسجيل إجازة اليوم - يتم كتم رنين الجرس وإشعار الإدارة"
              >
                <span>🏖️ تسجيل إجازة (تعطيل الرنين)</span>
              </button>
            ) : (
              <span className="px-3.5 py-1.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5">
                <span>🏖️ حالة المدرس: مجاز</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Real-time Next Class Status Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                الحصة القادمة اليوم
              </h3>
              <p className="text-xs text-slate-500">
                حسب توقيت هاتفك المحلي الحالي ({formatDateTo12Hour(currentTime, true)})
              </p>
            </div>
          </div>

          {nextUpcomingClass && (
            <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              باقي على الجرس: {formatCountdown(Math.max(0, secondsToNextClass - (nextUpcomingClass.alertMinutesBefore || 2) * 60))}
            </span>
          )}
        </div>

        {currentRunningClass && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                  حصة جارية الآن!
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentRunningClass.subject} — {currentRunningClass.gradeAndSection}
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {formatTimeRangeTo12Hour(currentRunningClass.startTime, currentRunningClass.endTime)}
            </span>
          </div>
        )}

        {nextUpcomingClass ? (
          <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/60 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-600 text-white">
                  الحصة القادمة
                </span>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  {nextUpcomingClass.subject}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="font-bold">{nextUpcomingClass.gradeAndSection}</span>
                </div>
              </div>

              <div className="text-right sm:text-left flex flex-col items-start sm:items-end justify-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[11px] text-slate-500 block mb-0.5">موعد الحصة:</span>
                <span className="font-mono text-xl font-black text-blue-600 dark:text-blue-400">
                  {formatTimeRangeTo12Hour(nextUpcomingClass.startTime, nextUpcomingClass.endTime)}
                </span>
                <span className="text-[11px] text-amber-500 font-bold mt-1">
                  يرن الجرس قبل دقيقتين ({(() => {
                    const [h, m] = nextUpcomingClass.startTime.split(':').map(Number);
                    const d = new Date();
                    d.setHours(h, m - (nextUpcomingClass.alertMinutesBefore || 2), 0);
                    return formatDateTo12Hour(d, false);
                  })()})
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              لا توجد حصص قادمة متبقية لهذا اليوم
            </p>
            <p className="text-xs text-slate-500 mt-1">
              سيتم إطلاق جرس التنبيه تلقائياً عند اقتراب موعد حصتك القادمة
            </p>
          </div>
        )}
      </div>

      {/* Today's Schedule Overview */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>
                جدول حصص اليوم ({DAYS_OF_WEEK.find((d) => d.id === currentDay)?.name || 'عطلة نهاية الأسبوع'})
              </span>
            </h3>
            <p className="text-xs text-slate-500">إجمالي حصصك اليوم: {todaysClasses.length} حصة</p>
          </div>
        </div>

        {todaysClasses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              ليس لديك أي حصص مجدولة لهذا اليوم
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todaysClasses.map((item) => {
              const isAcknowledged = isClassAcknowledgedToday(item.id);
              const [startH, startM] = item.startTime.split(':').map(Number);
              const [endH, endM] = item.endTime.split(':').map(Number);
              const startDt = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), startH, startM);
              const endDt = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), endH, endM);
              const isFinished = currentTime > endDt;
              const isCurrent = currentTime >= startDt && currentTime <= endDt;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4.5 transition-all ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-500/10'
                      : isAcknowledged
                      ? 'border-blue-300 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20'
                      : isFinished
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 opacity-70'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-xs font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                      {formatTimeRangeTo12Hour(item.startTime, item.endTime)}
                    </span>

                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white animate-pulse">
                        جارية الآن
                      </span>
                    ) : isAcknowledged ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم التوجه
                      </span>
                    ) : isFinished ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                        منتهية
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        قادمة (جرس: قبل 2 د)
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
                    {item.subject}
                  </h4>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-bold">{item.gradeAndSection}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full Weekly Schedule Tabs (Sunday to Thursday Only) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              الجدول الأسبوعي الكامل للحصص
            </h3>
            <p className="text-xs text-slate-500">
              أيام الدوام المدرسي من الأحد إلى الخميس: اختر اليوم لعرض الحصص المقررة
            </p>
          </div>
        </div>

        {/* Days of Week Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {DAYS_OF_WEEK.map((day) => {
            const countForDay = myClasses.filter((c) => c.dayOfWeek === day.id && c.isActive).length;
            const isToday = day.id === currentDay;
            const isSelected = day.id === selectedDay;

            return (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{day.name}</span>
                {isToday && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-500'}`}>
                    اليوم
                  </span>
                )}
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
                  {countForDay}
                </span>
              </button>
            );
          })}
        </div>

        {/* Classes list for selected day */}
        {displayedDayClasses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500">
              لا توجد حصص مجدولة ليوم {DAYS_OF_WEEK.find((d) => d.id === selectedDay)?.name}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 px-4 font-bold">وقت الحصة (١٢ ساعة)</th>
                  <th className="py-3 px-4 font-bold">المادة الدراسية</th>
                  <th className="py-3 px-4 font-bold">الصف والشعبة</th>
                  <th className="py-3 px-4 font-bold">التنبيه المسبق</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedDayClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                      {formatTimeRangeTo12Hour(c.startTime, c.endTime)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {c.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                      {c.gradeAndSection}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        قبل {c.alertMinutesBefore || 2} دقائق
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Mandatory Notification & Screen-Lock Ringing Permission Modal for New / Unapproved Users */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-amber-500/80 p-6 sm:p-7 shadow-2xl text-white relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
              <BellRing className="w-8 h-8 animate-bounce" />
            </div>

            <div className="text-center space-y-2 mb-6">
              <h3 className="text-xl font-black text-amber-400">
                تفعيل الإشعارات ورنين قفل الشاشة
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                مرحباً أستاذ <strong className="text-white">{currentUser.name}</strong>، لضمان انطلاق جرس الحصص بالصوت العالي في موعده بدقة حتى لو كانت شاشة هاتفك مقفلة أو كنت خارج المتصفح، يُرجى الموافقة على تشغيل التنبيهات ورنين قفل الشاشة.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs space-y-2 text-slate-300 mb-6">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>رنين تلقائي قبل دقيقتين من كل حصة</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>يعمل حتى لو الهاتف مقفول أو بدون نت</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>إيقاف الصوت فوراً بضغطة زر وإشعار الإدارة</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleApprovePermissions}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>موافق وتفعيل التنبيهات ورنين قفل الشاشة</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-semibold text-xs transition"
              >
                لاحقاً (سيُطلب منك في تسجيل الدخول القادم)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
