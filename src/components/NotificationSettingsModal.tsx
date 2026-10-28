import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Square,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import {
  getNotificationStatus,
  requestNotificationPermission,
  sendClassAlertNotification,
  requestWakeLock,
  releaseWakeLock,
} from '../utils/notifications';
import {
  playSchoolBell,
  stopSchoolBell,
  isBellRinging,
  unlockAudio,
  startBackgroundGuard,
  stopBackgroundGuard,
  isBackgroundGuardRunning,
} from '../utils/audioBell';
import {
  getSavedSoundType,
  saveSoundType,
  getSavedSoundVolume,
  saveSoundVolume,
  getSavedAlertMinutes,
  saveAlertMinutes,
} from '../utils/offlineStorage';
import { SchoolSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings?: SchoolSettings;
  onUpdateSettings?: (settings: Partial<SchoolSettings>) => Promise<boolean>;
}

export const NotificationSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [permStatus, setPermStatus] = useState(getNotificationStatus());
  const [soundType, setSoundTypeState] = useState<'electric' | 'melodic'>(getSavedSoundType());
  const [volume, setVolumeState] = useState(getSavedSoundVolume());
  const [alertMinutes, setAlertMinutesState] = useState(getSavedAlertMinutes());
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [backgroundGuardActive, setBackgroundGuardActive] = useState(isBackgroundGuardRunning());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setPermStatus(getNotificationStatus());
    setBackgroundGuardActive(isBackgroundGuardRunning());
  }, [isOpen]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermStatus(getNotificationStatus());
    if (granted) {
      showToast('✅ تم تفعيل إشعارات الهاتف بنجاح!');
      sendClassAlertNotification('تم تفعيل إشعارات الحصص', 'ستصلك تنبيهات الحصص قبل موعدها بصوت الجرس واهتزاز الموبايل');
    } else {
      showToast('⚠️ لم يتم منح إذن الإشعارات، يرجى تفعيلها من إعدادات المتصفح');
    }
  };

  const handleTestNotification = () => {
    const sent = sendClassAlertNotification(
      '🔔 تجربة إشعار الحصة المدرسية',
      'تنبيه: حان وقت التوجه إلى الصف! تبدأ الحصة خلال دقيقتين'
    );
    if (!sent && permStatus !== 'granted') {
      showToast('يرجى أولاً الضغط على تفعيل الإشعارات لمنح الإذن للمتصفح');
    } else {
      showToast('تم إرسال إشعار تجريبي لهاتفك مع الاهتزاز!');
    }
  };

  const handleToggleSoundTest = () => {
    if (isPlayingAudio || isBellRinging()) {
      stopSchoolBell();
      setIsPlayingAudio(false);
    } else {
      unlockAudio();
      setIsPlayingAudio(true);
      playSchoolBell(soundType, 7, volume);
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 7000);
    }
  };

  const handleSoundTypeChange = (type: 'electric' | 'melodic') => {
    setSoundTypeState(type);
    saveSoundType(type);
    // Play short preview of the selected bell
    unlockAudio();
    setIsPlayingAudio(true);
    playSchoolBell(type, 3.5, volume);
    setTimeout(() => {
      setIsPlayingAudio(false);
    }, 3500);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolumeState(newVol);
    saveSoundVolume(newVol);
  };

  const handleAlertMinutesChange = (mins: number) => {
    setAlertMinutesState(mins);
    saveAlertMinutes(mins);
  };

  const handleToggleBackgroundGuard = () => {
    if (backgroundGuardActive) {
      stopBackgroundGuard();
      setBackgroundGuardActive(false);
      showToast('تم إيقاف حارس التنبيهات في الخلفية');
    } else {
      unlockAudio();
      const started = startBackgroundGuard('جرس الحصص الذكي');
      if (started) {
        setBackgroundGuardActive(true);
        showToast('✅ تم تفعيل حارس التنبيهات! سيدق الجرس حتى لو أغلقت شاشة الهاتف');
      }
    }
  };

  const handleToggleWakeLock = async () => {
    if (wakeLockActive) {
      releaseWakeLock();
      setWakeLockActive(false);
      showToast('تم إيقاف وضع إبقاء الشاشة نشطة');
    } else {
      const success = await requestWakeLock();
      if (success) {
        setWakeLockActive(true);
        showToast('تم تفعيل إبقاء الشاشة نشطة لمنع قفل الموبايل');
      } else {
        showToast('خاصية إبقاء الشاشة غير مدعومة في هذا المتصفح');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-slate-800 dark:text-slate-100 my-8 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إعدادات الإشعارات وجرس الحصة</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">تخصيص نغمة الجرس وتنبيهات الخلفية وشاشة القفل</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopSchoolBell();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {toastMessage && (
          <div className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="mt-5 space-y-5">
          
          {/* Background Alarm Guard for Locked Screen */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Radio className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>حارس الرنين لشاشة الهاتف المقفولة</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500 text-white font-bold">مهم جداً</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    يضمن انطلاق صوت الجرس حتى لو أغلقت شاشة الهاتف أو خرجت من الموقع
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleBackgroundGuard}
                className={`py-1.5 px-3.5 rounded-full text-xs font-black transition cursor-pointer ${
                  backgroundGuardActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                }`}
              >
                {backgroundGuardActive ? 'مفعل وجاهز ✅' : 'اضغط للتفعيل'}
              </button>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
              * عند التفعيل، يظهر شريط التحكم بالجرس على شاشة قفل الموبايل (Lock Screen) مع زر إلغاء وتأكيد التوجه.
            </p>
          </div>

          {/* Sound Preferences Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5 text-amber-500" />
                <div>
                  <h4 className="text-sm font-bold">صوت ونغمة جرس الحصة</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">جرس نقي وعالي جداً بدون إنترنت</p>
                </div>
              </div>
              <button
                onClick={handleToggleSoundTest}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isPlayingAudio
                    ? 'bg-rose-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف الصوت</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>تجربة النغمة</span>
                  </>
                )}
              </button>
            </div>

            {/* Sound Style Choice */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleSoundTypeChange('melodic')}
                className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                  soundType === 'melodic'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold mb-1 flex items-center gap-1">
                  <span>جرس موسيقي نقي</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1 rounded">موصى به</span>
                </div>
                <div className="text-[11px] opacity-75">دقات برونزية رخيمة وواضحة (صوت عالي ومريح)</div>
              </button>

              <button
                type="button"
                onClick={() => handleSoundTypeChange('electric')}
                className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                  soundType === 'electric'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="font-bold mb-1">جرس كهربائي تقليدي</div>
                <div className="text-[11px] opacity-75">رنين نبضات معدنية متكررة وقوية (ترررن ترررن)</div>
              </button>
            </div>

            {/* Volume Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>مستوى الصوت:</span>
                <span className="font-mono font-bold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Notification Permission Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="text-sm font-bold">إشعارات واهتزاز الموبايل</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {permStatus === 'granted'
                      ? 'مفعلة وتعمل مع اهتزاز الهاتف وشاشة القفل'
                      : 'تحتاج إلى منح إذن الإشعارات'}
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  permStatus === 'granted'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {permStatus === 'granted' ? 'مفعلة ✅' : 'غير مفعلة ⚠️'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {permStatus !== 'granted' ? (
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4" />
                  <span>تفعيل إشعارات الهاتف الآن</span>
                </button>
              ) : (
                <button
                  onClick={handleTestNotification}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-blue-500" />
                  <span>إرسال إشعار تجريبي واهتزاز</span>
                </button>
              )}
            </div>
          </div>

          {/* Alert Timing Selection */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-emerald-500" />
              <div>
                <h4 className="text-sm font-bold">وقت إطلاق جرس التنبيه قبل بدء الحصة</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">كم دقيقة ترغب بأن يندق الجرس لتستعد وتتوجه للقاعة؟</p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleAlertMinutesChange(mins)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition border cursor-pointer ${
                    alertMinutes === mins
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {mins === 2 ? 'دقيقتين (الموصى به)' : `${mins} ${mins === 1 ? 'دقيقة' : 'دقائق'}`}
                </button>
              ))}
            </div>
          </div>

          {/* Screen Wake Lock Option */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-indigo-500" />
              <div>
                <h4 className="text-sm font-bold">إبقاء شاشة الهاتف نشطة (Wake Lock)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">يمنع شاشة الموبايل من الإغلاق أثناء الدوام</p>
              </div>
            </div>
            <button
              onClick={handleToggleWakeLock}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition cursor-pointer ${
                wakeLockActive
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {wakeLockActive ? 'مفعل' : 'معطل'}
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => {
              stopSchoolBell();
              onClose();
            }}
            className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow cursor-pointer transition"
          >
            حفظ وإغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
