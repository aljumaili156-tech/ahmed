import React, { useState } from 'react';
import {
  Bell,
  Lock,
  User,
  AlertCircle,
  LogIn,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Teacher } from '../types';

interface Props {
  teachers: Teacher[];
  schoolName?: string;
  schoolLogo?: string;
  onLogin: (username: string, pass: string, rememberMe: boolean) => Promise<{ success: boolean; error?: string }>;
}

export const LoginModal: React.FC<Props> = ({ schoolName, schoolLogo, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await onLogin(username.trim(), password.trim(), rememberMe);
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-slate-100">
      <div className="w-full max-w-md rounded-3xl bg-slate-900/95 border border-slate-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* School Bell / Custom School Logo Header */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            {schoolLogo ? (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-400/40 shadow-xl shadow-amber-500/20 mx-auto bg-slate-800 flex items-center justify-center p-1">
                <img src={schoolLogo} alt={schoolName || 'لوكو المدرسة'} className="w-full h-full object-contain rounded-xl" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 mx-auto">
                <Bell className="w-8 h-8" />
              </div>
            )}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            {schoolName || 'نظام جرس الحصص الذكي'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تسجيل دخول مدرس المادة أو إدارة المدرسة
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              اسم المستخدم:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pr-10 pl-3 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 transition"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              كلمة المرور:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-3 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-amber-400 transition"
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition cursor-pointer select-none"
            >
              {rememberMe ? (
                <CheckSquare className="w-4 h-4 text-amber-400 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold">
                حفظ تسجيل الدخول (تذكرني دائماً على هذا الجهاز)
              </span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'جارٍ التحقق...' : 'تسجيل الدخول'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
