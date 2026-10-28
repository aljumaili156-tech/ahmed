import React from 'react';
import {
  Bell,
  Settings,
  LogOut,
  UserCheck,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CurrentUser, DAYS_OF_WEEK } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { formatDateTo12Hour } from '../utils/timeFormat';

interface Props {
  currentUser: CurrentUser | null;
  schoolName: string;
  schoolLogo?: string;
  currentTime: Date;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({
  currentUser,
  schoolName,
  schoolLogo,
  currentTime,
  onOpenSettings,
  onLogout,
}) => {
  const currentDayInfo = DAYS_OF_WEEK.find((d) => d.id === currentTime.getDay());

  const formatDateStr = (d: Date) => {
    return d.toLocaleDateString('ar-IQ', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & School Branding */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              {schoolLogo ? (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden border border-amber-400/40 shadow-md shadow-amber-500/20 bg-slate-800 p-0.5 flex items-center justify-center">
                  <img src={schoolLogo} alt={schoolName} className="w-full h-full object-contain rounded-xl" />
                </div>
              ) : (
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  {schoolName}
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3" />
                  جرس الحصص الذكي
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-amber-400">
                  {currentDayInfo ? `يوم ${currentDayInfo.name}` : 'اليوم'}
                </span>
                <span className="opacity-50">•</span>
                <span className="hidden sm:inline">{formatDateStr(currentTime)}</span>
                <span className="opacity-50 hidden sm:inline">•</span>
                <span className="font-mono font-bold text-slate-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {formatDateTo12Hour(currentTime, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            
            {/* Real-time Cloud Sync Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="قاعدة البيانات متصلة وتتزامن لحظياً بين الأجهزة">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>مزامنة سحابية</span>
            </div>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Notification & Sound Settings Button - ONLY visible to Admin */}
            {currentUser?.role === 'admin' && (
              <button
                onClick={onOpenSettings}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="إعدادات التنبيهات وصوت الجرس"
              >
                <Settings className="w-4 h-4 text-amber-400" />
                <span className="hidden lg:inline">إعدادات الجرس</span>
              </button>
            )}

            {/* User Profile / Logout */}
            {currentUser && (
              <div className="flex items-center gap-2 pl-1 border-r border-slate-800 pr-2">
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                    {currentUser.role === 'admin' ? (
                      <>
                        <Shield className="w-2.5 h-2.5" />
                        <span>مدير النظام (Admin)</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>مدرس: {currentUser.subject}</span>
                      </>
                    )}
                  </span>
                </div>

                <button
                  onClick={onLogout}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">خروج</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
