import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, MapPin, BookOpen, Clock, AlertTriangle, Users, Volume2 } from 'lucide-react';
import { ClassSchedule, CurrentUser } from '../types';
import { stopSchoolBell, playSchoolBell, isBellRinging, unlockAudio } from '../utils/audioBell';
import { getSavedSoundVolume, getSavedSoundType } from '../utils/offlineStorage';
import { formatTimeRangeTo12Hour } from '../utils/timeFormat';

interface Props {
  activeClass: ClassSchedule | null;
  currentUser: CurrentUser | null;
  secondsRemaining: number;
  onAcknowledge: (classItem: ClassSchedule, note?: string) => Promise<void>;
}

export const ClassAlarmModal: React.FC<Props> = ({
  activeClass,
  currentUser,
  secondsRemaining,
  onAcknowledge,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pulseScale, setPulseScale] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(isBellRinging());

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseScale((prev) => !prev);
      setIsPlayingSound(isBellRinging());
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // When modal appears, ensure bell is actively playing
  useEffect(() => {
    if (activeClass) {
      unlockAudio();
      const soundType = getSavedSoundType();
      const vol = getSavedSoundVolume();
      playSchoolBell(
        soundType,
        15,
        vol,
        {
          subject: activeClass.subject,
          gradeAndSection: activeClass.gradeAndSection,
          room: activeClass.room,
        },
        () => {
          stopSchoolBell();
          setIsPlayingSound(false);
        }
      ).then((played) => {
        setIsPlayingSound(played);
      });
    }
  }, [activeClass]);

  if (!activeClass) return null;

  const handleManualPlaySound = () => {
    unlockAudio();
    const soundType = getSavedSoundType();
    const vol = getSavedSoundVolume();
    playSchoolBell(soundType, 15, vol, {
      subject: activeClass.subject,
      gradeAndSection: activeClass.gradeAndSection,
      room: activeClass.room,
    });
    setIsPlayingSound(true);
  };

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return 'بدأت الحصة الآن!';
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  const handleConfirmHeading = async () => {
    // 1. Immediately kill all sounds and media completely
    stopSchoolBell();
    setIsPlayingSound(false);
    setIsSubmitting(true);
    try {
      await onAcknowledge(activeClass, 'قام المدرس بإلغاء التنبيه وأكد التوجه للدرس');
    } finally {
      stopSchoolBell();
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleManualPlaySound}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-slate-900 border-2 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.45)] p-6 sm:p-8 text-white relative overflow-hidden"
      >
        {/* Urgent Glow Background Elements */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Pulsating Bell Badge */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 cursor-pointer" onClick={handleManualPlaySound} title="انقر لتشغيل صوت الجرس">
            {/* Animated Ring Circles */}
            <div
              className={`absolute inset-0 rounded-full bg-amber-500/35 blur-md transition-transform duration-700 ${
                pulseScale ? 'scale-150 opacity-100' : 'scale-110 opacity-40'
              }`}
            />
            <div
              className={`relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-2xl text-slate-950 transition-transform duration-500 ${
                pulseScale ? 'scale-105 rotate-6' : 'scale-95 -rotate-6'
              }`}
            >
              <Bell className="w-12 h-12 stroke-[2.5]" />
            </div>
            {/* 2-Min Alert Pill */}
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black text-xs px-3 py-0.5 rounded-full shadow border-2 border-slate-900">
              تنبيه الحصة
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-amber-400 mb-1 leading-tight">
            حان موعد التوجه إلى الصف!
          </h2>
          <p className="text-slate-300 text-sm mb-3">
            أستاذ <span className="font-bold text-white">{currentUser?.name || 'المدرس'}</span>، يرجى التوجه للقاعة الدراسية فوراً.
          </p>

          {/* Sound State Button / Autoplay Prompt */}
          {!isPlayingSound ? (
            <button
              onClick={handleManualPlaySound}
              className="mb-4 py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 animate-bounce cursor-pointer shadow-lg shadow-amber-500/30"
            >
              <Volume2 className="w-4 h-4" />
              <span>اضغط هنا لتشغيل رنين الجرس بأعلى صوت</span>
            </button>
          ) : (
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>صوت الجرس يرن الآن (صوت مدرسة عالي ونقي)</span>
            </div>
          )}

          {/* Countdown timer badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 mb-5">
            <Clock className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="text-xs">الوقت المتبقي لبدء الحصة:</span>
            <span className="font-mono font-black text-lg text-white">
              {formatCountdown(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Class Details Card */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/80 p-4 sm:p-5 space-y-3 mb-5 text-sm">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2.5 text-slate-300">
              <BookOpen className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-slate-400">المادة الدراسية:</span>
            </div>
            <span className="font-bold text-white text-base">{activeClass.subject}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Users className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <span className="text-xs text-slate-400">الصف والشعبة:</span>
            </div>
            <span className="font-bold text-white">{activeClass.gradeAndSection}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-slate-300">
              <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-slate-400">توقيت الحصة (١٢ ساعة):</span>
            </div>
            <span className="font-mono font-bold text-amber-300 text-sm">
              {formatTimeRangeTo12Hour(activeClass.startTime, activeClass.endTime)}
            </span>
          </div>
        </div>

        {/* Action Button: Required: "من ايدوس الغاء يجيني اشعار انو راح يتوجه للدرس" */}
        <div className="space-y-2.5">
          <button
            onClick={handleConfirmHeading}
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-[0.98] text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-6 h-6 text-slate-950" />
            <span>{isSubmitting ? 'جارٍ إيقاف الصوت وإبلاغ الإدارة...' : 'إلغاء الجرس وتأكيد التوجه للدرس'}</span>
          </button>

          <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>الضغط يوقف الصوت فوراً ويسجل إشعار توجهك للدرس لدى إدارة المدرسة</span>
          </p>
        </div>
      </div>
    </div>
  );
};
