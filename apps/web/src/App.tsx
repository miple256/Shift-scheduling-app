import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Avatar } from './components/Avatar';
import { calcHours, formatCurrency, formatDateLabel, todayKey, toDateKey } from './lib/date';
import { authClient } from './lib/auth-client';
import { useAuth } from './hooks/useAuth';
import { useShifts, useSaveShifts } from './hooks/useShifts';
import { useDeleteShift } from './hooks/useDeleteShift';
import { useUpdateShiftTimes } from './hooks/useUpdateShiftTimes';
import { useMembersByDate } from './hooks/useMembersByDate';
import { useProfile, useSaveProfile } from './hooks/useProfile';
import { useIncomeSettings, useSaveIncomeSettings } from './hooks/useIncomeSettings';
import { useHelpItems as useHelpItemsQuery } from './hooks/useHelpItems';
import { useSwaps } from './hooks/useSwaps';
import { useSubmitHelpItem, useApproveHelpItem } from './hooks/useHelpMutations';
import { useCreateSwap, useSwapCandidates } from './hooks/useSwaps';
import { useDeleteAccount } from './hooks/useDeleteAccount';
import { MEMBER_COLORS, type AuthScreen, type HelpItem, type IncomeSettings, type Screen, type Shift, type TimePreset, type UserProfile } from './types';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Static data ──────────────────────────────────────────────────────────────

const TIME_PRESETS: TimePreset[] = [
  { label: 'ランチ（10:00-15:00）', startTime: '10:00', endTime: '15:00', type: 'lunch' },
  { label: 'ディナー（17:00-21:30）', startTime: '17:00', endTime: '21:30', type: 'dinner' },
  { label: 'ランチ（10:30-15:00）', startTime: '10:30', endTime: '15:00', type: 'lunch' },
  { label: 'ディナー（18:00-23:00）', startTime: '18:00', endTime: '23:00', type: 'dinner' },
  { label: '通し（10:00-15:00 / 17:00-21:30）', startTime: '10:00', endTime: '21:30', type: 'full' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Avatar ───────────────────────────────────────────────────────────────────

// ─── Auth Screens ─────────────────────────────────────────────────────────────

export function AuthView({ onAuth }: { onAuth: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const screen: AuthScreen = location.pathname === '/signup' ? 'signup' : location.pathname === '/password-reset' ? 'reset' : 'login';
  const resetToken = new URLSearchParams(location.search).get('token');
  const setScreen = (next: AuthScreen) => navigate(next === 'signup' ? '/signup' : next === 'reset' ? '/password-reset' : '/login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('メールアドレスとパスワードを入力してください'); return; }
    const result = await authClient.signIn.email({ email, password });
    if (result.error) { setError(result.error.message ?? 'ログインに失敗しました'); return; }
    onAuth();
  };

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) { setError('すべての項目を入力してください'); return; }
    if (password !== confirmPassword) { setError('パスワードが一致しません'); return; }
    if (password.length < 8) { setError('パスワードは8文字以上で設定してください'); return; }
    const result = await authClient.signUp.email({ email, password, name });
    if (result.error) { setError(result.error.message ?? 'アカウントを作成できませんでした'); return; }
    const profileResponse = await fetch('/api/me', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) });
    if (!profileResponse.ok) { setError('アカウントは作成されましたが、プロフィールを保存できませんでした'); return; }
    onAuth();
  };

  const handleReset = async () => {
    if (!email) { setError('メールアドレスを入力してください'); return; }
    const result = await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/password-reset` });
    if (result.error) { setError(result.error.message ?? 'リセットメールを送信できませんでした'); return; }
    setResetSent(true);
    setError('');
  };

  const handlePasswordReset = async () => {
    if (!resetToken || newPassword.length < 8) { setError('新しいパスワードは8文字以上で入力してください'); return; }
    if (newPassword !== confirmPassword) { setError('パスワードが一致しません'); return; }
    const result = await authClient.resetPassword({ newPassword, token: resetToken });
    if (result.error) { setError(result.error.message ?? 'パスワードを変更できませんでした'); return; }
    navigate('/login', { replace: true });
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50';

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Logo area */}
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4 shadow-lg">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">シフト管理</h1>
        <p className="text-sm text-gray-400 mt-1">
          {screen === 'login' ? 'アカウントにログイン' : screen === 'signup' ? '新しいアカウントを作成' : 'パスワードのリセット'}
        </p>
      </div>

      <div className="flex-1 px-6 pb-10">
        {screen === 'login' && (
          <div className="space-y-3">
            <input className={inputCls} type="email" placeholder="メールアドレス" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
            <div className="relative">
              <input className={inputCls} type={showPass ? 'text' : 'password'} placeholder="パスワード" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
              </button>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleLogin} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold mt-2 hover:bg-indigo-600 transition-colors">
              ログイン
            </button>
            <button onClick={() => { setScreen('reset'); setError(''); }} className="w-full text-center text-sm text-indigo-500 py-2">
              パスワードを忘れた方はこちら
            </button>
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-gray-100" /><span className="text-xs text-gray-300">または</span><div className="flex-1 h-px bg-gray-100" />
            </div>
            <button onClick={() => { setScreen('signup'); setError(''); }} className="w-full py-4 border-2 border-indigo-100 text-indigo-500 rounded-2xl font-bold hover:bg-indigo-50 transition-colors">
              新規アカウント作成
            </button>
          </div>
        )}

        {screen === 'signup' && (
          <div className="space-y-3">
            <input className={inputCls} type="text" placeholder="お名前" value={name} onChange={e => { setName(e.target.value); setError(''); }} />
            <input className={inputCls} type="email" placeholder="メールアドレス" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
            <input className={inputCls} type="tel" placeholder="電話番号（例：090-1234-5678）" value={phone} onChange={e => { setPhone(e.target.value); setError(''); }} />
            <div className="relative">
              <input className={inputCls} type={showPass ? 'text' : 'password'} placeholder="パスワード（8文字以上）" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{showPass ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
              </button>
            </div>
            <input className={inputCls} type="password" placeholder="パスワード（確認）" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button onClick={handleSignup} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold mt-2 hover:bg-indigo-600 transition-colors">
              アカウントを作成
            </button>
            <button onClick={() => { setScreen('login'); setError(''); }} className="w-full text-center text-sm text-gray-400 py-2">
              ← ログイン画面に戻る
            </button>
          </div>
        )}

        {screen === 'reset' && (
          <div className="space-y-3">
            {resetToken ? (
              <>
                <p className="text-sm text-gray-500">新しいパスワードを設定してください（8文字以上）。</p>
                <input className={inputCls} type="password" placeholder="新しいパスワード" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }} />
                <input className={inputCls} type="password" placeholder="新しいパスワード（確認）" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(''); }} />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button onClick={handlePasswordReset} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold">パスワードを変更</button>
              </>
            ) : resetSent ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <p className="font-bold text-gray-900 mb-1">メールを送信しました</p>
                <p className="text-sm text-gray-500">{email} にパスワードリセットのリンクを送りました</p>
                <button onClick={() => { setScreen('login'); setResetSent(false); }} className="mt-6 text-indigo-500 font-semibold text-sm">
                  ログイン画面に戻る
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-2">登録したメールアドレスを入力してください。パスワードリセットのリンクをお送りします。</p>
                <input className={inputCls} type="email" placeholder="メールアドレス" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} />
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button onClick={handleReset} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-bold mt-2 hover:bg-indigo-600 transition-colors">
                  リセットリンクを送信
                </button>
                <button onClick={() => { setScreen('login'); setError(''); }} className="w-full text-center text-sm text-gray-400 py-2">
                  ← ログイン画面に戻る
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

function Calendar({ year, month, shifts, today, onPrev, onNext, onDayClick }: {
  year: number; month: number; shifts: Shift[]; today: string;
  onPrev: () => void; onNext: () => void; onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();

  const shiftMap = new Map<string, ('L' | 'D')[]>();
  shifts.forEach((s) => {
    const key = s.date;
    if (!shiftMap.has(key)) shiftMap.set(key, []);
    shiftMap.get(key)!.push(s.type === 'lunch' ? 'L' : 'D');
  });
  shiftMap.forEach((markers) => markers.sort((a, b) => Number(a === 'D') - Number(b === 'D')));

  const [ty, tm, td] = today.split('-').map(Number);
  const isToday = (d: number) => year === ty && month === tm - 1 && d === td;
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  const cells: { day: number; cur: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevDays - firstDay + i + 1, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, cur: true });
  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++) cells.push({ day: d, cur: false });

  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm" style={{ fontSize: '0.8rem' }}>
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-semibold text-gray-800">{year}年 {monthNames[month]}</span>
        <button onClick={onNext} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['日','月','火','水','木','金','土'].map((d, i) => (
          <div key={d} className="text-center font-medium text-xs py-1" style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#9ca3af' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell, idx) => {
          const key = cell.cur ? toDateKey(year, month, cell.day) : '';
          const markers = shiftMap.get(key) || [];
          const today_ = cell.cur && isToday(cell.day);
          const col = idx % 7;
          const textColor = !cell.cur ? '#d1d5db' : col === 0 ? '#ef4444' : col === 6 ? '#3b82f6' : '#1f2937';
          return (
            <button key={idx} onClick={() => cell.cur && onDayClick(key)} disabled={!cell.cur}
              className="flex flex-col items-center py-1 rounded-xl active:bg-indigo-50 transition-colors" style={{ minHeight: 40 }}>
              <span className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium"
                style={{ background: today_ ? '#6366f1' : 'transparent', color: today_ ? 'white' : textColor }}>
                {cell.day}
              </span>
              {markers.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {markers.map((m, mi) => (
                    <span key={mi} className="text-[9px] font-bold" style={{ color: m === 'L' ? '#f59e0b' : '#6366f1' }}>{m}</span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 px-1">
        <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-amber-500">L</span><span className="text-[10px] text-gray-400">ランチ</span></div>
        <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-indigo-500">D</span><span className="text-[10px] text-gray-400">ディナー</span></div>
        <span className="text-[10px] text-indigo-400 ml-auto">← タップでシフト操作</span>
      </div>
    </div>
  );
}

// ─── Day Action Modal ─────────────────────────────────────────────────────────

function DayActionModal({ date, shifts, onClose, onShiftChange, onShiftEntry, onShiftDelete, onShiftTimeUpdate }: {
  date: string; shifts: Shift[]; onClose: () => void;
  onShiftChange: (d: string) => void; onShiftEntry: (d: string) => void;
  onShiftDelete: (d: string, t: 'lunch' | 'dinner') => Promise<void>;
  onShiftTimeUpdate: (d: string, t: 'lunch' | 'dinner', startTime: string, endTime: string) => Promise<void>;
}) {
  const [y, m, d] = date.split('-').map(Number);
  const dayNames = ['日','月','火','水','木','金','土'];
  const dow = new Date(y, m - 1, d).getDay();
  const label = `${m}月${d}日（${dayNames[dow]}）`;
  const [confirmDelete, setConfirmDelete] = useState<'lunch' | 'dinner' | null>(null);
  const [editingType, setEditingType] = useState<'lunch' | 'dinner' | null>(null);
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editError, setEditError] = useState('');
  const [savingTime, setSavingTime] = useState(false);
  const dayShifts = shifts
    .filter((s) => s.date === date)
    .sort((a, b) => Number(a.type === 'dinner') - Number(b.type === 'dinner'));

  const startEditing = (shift: Shift) => {
    setEditingType(shift.type);
    setEditStartTime(shift.startTime);
    setEditEndTime(shift.endTime);
    setEditError('');
    setConfirmDelete(null);
  };

  const saveEditedTime = async (type: 'lunch' | 'dinner') => {
    if (editEndTime <= editStartTime) {
      setEditError('終了時刻は開始時刻より後にしてください');
      return;
    }
    setSavingTime(true);
    setEditError('');
    try {
      await onShiftTimeUpdate(date, type, editStartTime, editEndTime);
    } catch (error) {
      setEditError(error instanceof Error ? error.message : 'シフト時間を変更できませんでした');
    } finally {
      setSavingTime(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-t-3xl p-6 pb-10 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <p className="text-center text-gray-500 text-sm mb-1">選択した日付</p>
        <p className="text-center font-bold text-gray-900 text-lg mb-6">{label}</p>

        <button onClick={() => onShiftChange(date)} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-indigo-100 bg-indigo-50 hover:bg-indigo-100 transition-all mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
          </div>
          <div className="text-left"><p className="font-bold text-gray-900">シフト変更</p><p className="text-xs text-gray-500 mt-0.5">担当者や時間を変更する</p></div>
          <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        <button onClick={() => onShiftEntry(date)} className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-all mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/></svg>
          </div>
          <div className="text-left"><p className="font-bold text-gray-900">シフト記入</p><p className="text-xs text-gray-500 mt-0.5">新しいシフトを登録する</p></div>
          <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>

        {dayShifts.length > 0 ? (
          <div className="border-2 border-red-100 bg-red-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-400 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </div>
              <div><p className="font-bold text-gray-900">予定の変更・削除</p><p className="text-xs text-gray-500 mt-0.5">勤務時間の変更や予定の削除ができます</p></div>
            </div>
            <div className="space-y-2">
              {dayShifts.map((s) => {
                const isConfirming = confirmDelete === s.type;
                return (
                  <div key={s.type} className="bg-white rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mr-2 ${s.type === 'lunch' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                          {s.type === 'lunch' ? 'ランチ' : 'ディナー'}
                        </span>
                        <span className="text-sm text-gray-600">{s.startTime}〜{s.endTime}</span>
                      </div>
                      <div className="flex gap-2">
                        {!isConfirming && editingType !== s.type && (
                          <button onClick={() => startEditing(s)} className="text-xs px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-500 font-semibold">時間変更</button>
                        )}
                        {isConfirming ? (
                          <>
                            <button onClick={() => setConfirmDelete(null)} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-semibold">キャンセル</button>
                            <button onClick={() => { void onShiftDelete(date, s.type); }} className="text-xs px-3 py-1.5 rounded-lg bg-red-500 text-white font-semibold">削除する</button>
                          </>
                        ) : editingType !== s.type ? (
                          <button onClick={() => setConfirmDelete(s.type)} className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-400 font-semibold">削除</button>
                        ) : null}
                      </div>
                    </div>
                    {editingType === s.type && (
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <label className="flex-1 text-xs text-gray-500">開始
                            <input type="time" value={editStartTime} onChange={(event) => setEditStartTime(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700" />
                          </label>
                          <span className="mt-5 text-gray-300">〜</span>
                          <label className="flex-1 text-xs text-gray-500">終了
                            <input type="time" value={editEndTime} onChange={(event) => setEditEndTime(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700" />
                          </label>
                        </div>
                        {editError && <p className="text-xs text-red-500">{editError}</p>}
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setEditingType(null); setEditError(''); }} disabled={savingTime} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-semibold">キャンセル</button>
                          <button onClick={() => void saveEditedTime(s.type)} disabled={savingTime || editEndTime <= editStartTime} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white font-semibold disabled:opacity-50">{savingTime ? '保存中...' : '保存する'}</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <button disabled className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 opacity-40">
            <div className="w-10 h-10 rounded-xl bg-gray-300 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <div className="text-left"><p className="font-bold text-gray-400">予定削除</p><p className="text-xs text-gray-400 mt-0.5">この日のシフトはありません</p></div>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Shift Change Screen ───────────────────────────────────────────────────────

function ShiftChangeScreen({ initialDate, shifts, currentMemberId, onBack }: {
  initialDate: string; shifts: Shift[]; currentMemberId: string; onBack: () => void;
}) {
  const createSwap = useCreateSwap();
  const [selDate, setSelDate] = useState(initialDate);
  const [selType, setSelType] = useState<'lunch' | 'dinner'>('lunch');
  const [giverId, setGiverId] = useState<string | null>(null);
  const [giverAuto, setGiverAuto] = useState(false);
  const [takerId, setTakerId] = useState<string | null>(null);
  const [takerAuto, setTakerAuto] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Members working on selDate + selType
  const candidates = useSwapCandidates(selDate, selType);
  const workingMembers = candidates.data?.assigned ?? [];
  const availableMembers = candidates.data?.available ?? [];

  const pickGiver = (id: string) => {
    setGiverId(id);
    setGiverAuto(false);
    if (id !== currentMemberId) {
      setTakerId(currentMemberId);
      setTakerAuto(true);
    }
  };

  const pickTaker = (id: string) => {
    setTakerId(id);
    setTakerAuto(false);
    if (id !== currentMemberId) {
      setGiverId(currentMemberId);
      setGiverAuto(true);
    }
  };

  // Reset selections when date/type changes
  const changeDate = (v: string) => { setSelDate(v); setGiverId(null); setTakerId(null); setGiverAuto(false); setTakerAuto(false); };
  const changeType = (t: 'lunch' | 'dinner') => { setSelType(t); setGiverId(null); setTakerId(null); setGiverAuto(false); setTakerAuto(false); };

  const giverName = workingMembers.find((member) => member.id === giverId)?.name ?? '';
  const takerName = availableMembers.find((member) => member.id === takerId)?.name ?? '';
  const [y, mo, d] = selDate.split('-').map(Number);
  const dayNames = ['日','月','火','水','木','金','土'];
  const dow = new Date(y, mo - 1, d).getDay();
  const dateLabel = `${mo}月${d}日（${dayNames[dow]}）`;
  const typeLabel = selType === 'lunch' ? 'ランチ' : 'ディナー';

  const canSubmit = !!giverId && !!takerId;

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">シフトを交代しました</h2>
      <p className="text-gray-500 text-sm">{dateLabel} {typeLabel}</p>
      <p className="text-gray-700 font-medium">{giverName} → {takerName}</p>
      <button onClick={onBack} className="mt-4 px-8 py-3 bg-indigo-500 text-white rounded-2xl font-semibold">ホームに戻る</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 overflow-y-auto flex-1">

        {/* Date */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">交代する日付</p>
          <input type="date" value={selDate} onChange={e => changeDate(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </div>

        {/* Shift type */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">シフトの種類</p>
          <div className="flex gap-2">
            <button onClick={() => changeType('lunch')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${selType === 'lunch' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
              ランチ
            </button>
            <button onClick={() => changeType('dinner')}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${selType === 'dinner' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              ディナー
            </button>
          </div>
        </div>

        {/* 渡す人 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-1">渡す人</p>
          <p className="text-xs text-gray-400 mb-3">このシフトに入っているメンバー</p>
          {workingMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">この日・この種類のシフトに入っているメンバーがいません</p>
          ) : (
            <div className="space-y-2">
              {workingMembers.map(m => {
                const selected = giverId === m.id;
                return (
                  <button key={m.id} onClick={() => pickGiver(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Avatar member={m} size={36} />
                    <span className="font-medium text-gray-800">{m.name}</span>
                    {selected && giverAuto && (
                      <span className="ml-1 text-[10px] font-bold bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded-full">自動</span>
                    )}
                    {selected && <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 引き受ける人 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-1">引き受ける人</p>
          <p className="text-xs text-gray-400 mb-3">このシフトに入っていないメンバー</p>
          {availableMembers.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">全員このシフトに入っています</p>
          ) : (
            <div className="space-y-2">
              {availableMembers.map(m => {
                const selected = takerId === m.id;
                return (
                  <button key={m.id} onClick={() => pickTaker(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${selected ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 hover:border-gray-200'}`}>
                    <Avatar member={m} size={36} />
                    <span className="font-medium text-gray-800">{m.name}</span>
                    {selected && takerAuto && (
                      <span className="ml-1 text-[10px] font-bold bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">自動</span>
                    )}
                    {selected && <svg className="ml-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <button onClick={() => setShowConfirm(true)} disabled={!canSubmit || createSwap.isPending}
          className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-40"
          style={{ background: canSubmit ? '#6366f1' : '#d1d5db' }}>
          内容を確認する
        </button>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" onClick={() => setShowConfirm(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">交代内容の確認</h3>
            <p className="text-sm text-gray-400 text-center mb-5">以下の内容でシフトを交代しますか？</p>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">日付</span>
                <span className="font-semibold text-gray-800">{dateLabel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">種類</span>
                <span className={`font-semibold ${selType === 'lunch' ? 'text-amber-600' : 'text-indigo-600'}`}>{typeLabel}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
                <span className="text-gray-500 text-sm">交代</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-sm">{giverName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  <span className="font-bold text-gray-800 text-sm">{takerName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-500 font-semibold text-sm">
                キャンセル
              </button>
              <button onClick={() => {
                setSubmitError('');
                void createSwap.mutateAsync({ date: selDate, type: selType, fromUserId: giverId!, toUserId: takerId! })
                  .then(() => {
                    setShowConfirm(false);
                    setSubmitted(true);
                    window.setTimeout(() => window.location.assign('/'), 1000);
                  })
                  .catch((error: unknown) => setSubmitError(error instanceof Error ? error.message : '交代を登録できませんでした'));
              }}
                className="flex-1 py-3.5 rounded-2xl bg-indigo-500 text-white font-bold text-sm">
                {createSwap.isPending ? '送信中...' : '交代する'}
              </button>
            </div>
            {submitError && <p className="mt-3 text-center text-xs text-red-500">{submitError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shift Entry Screen ────────────────────────────────────────────────────────

function ShiftEntryScreen({ initialDate, existingShifts, currentMemberId, onBack, onSave }: {
  initialDate: string; existingShifts: Shift[]; currentMemberId: string; onBack: () => void; onSave: (s: Shift[]) => Promise<void>;
}) {
  const [selectedDates, setSelectedDates] = useState<string[]>([initialDate]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('15:00');
  const [shiftType, setShiftType] = useState<'lunch' | 'dinner'>('lunch');
  const [allDay, setAllDay] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveError, setSaveError] = useState('');
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  // フィルタ：自分のシフトのみ対象
  const myShifts = existingShifts.filter(s => s.memberId === currentMemberId);
  const existingMap = new Map<string, Set<'lunch' | 'dinner'>>();
  myShifts.forEach(s => {
    if (!existingMap.has(s.date)) existingMap.set(s.date, new Set());
    existingMap.get(s.date)!.add(s.type);
  });

  const lunchBlockedOnAny = selectedDates.some(d => existingMap.get(d)?.has('lunch'));
  const dinnerBlockedOnAny = selectedDates.some(d => existingMap.get(d)?.has('dinner'));
  const allDayBlockedOnAny = selectedDates.some(d => existingMap.has(d));
  const toggleDate = (key: string) => setSelectedDates(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  const applyPreset = (p: TimePreset) => {
    setStartTime(p.startTime);
    setEndTime(p.endTime);
    setAllDay(p.type === 'full');
    if (p.type !== 'full') setShiftType(p.type);
    setShowPresets(false);
  };
  const savableDates = selectedDates.filter(d => allDay ? !existingMap.has(d) : !existingMap.get(d)?.has(shiftType));
  const hours = allDay ? 9.5 : calcHours(startTime, endTime);

  const handleSave = async () => {
    const count = savableDates.length;
    setSaveError('');
    try {
      const shiftsToSave = savableDates.flatMap(date => allDay
        ? [
            { date, type: 'lunch' as const, startTime: '10:00', endTime: '15:00', memberId: currentMemberId },
            { date, type: 'dinner' as const, startTime: '17:00', endTime: '21:30', memberId: currentMemberId },
          ]
        : [{ date, type: shiftType, startTime, endTime, memberId: currentMemberId }]);
      await onSave(shiftsToSave);
      setSavedCount(count);
      setSubmitted(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'シフトを登録できませんでした');
    }
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900">シフトを登録しました</h2>
      <p className="text-gray-500 text-sm">{savedCount}日分のシフトを追加しました</p>
      <button onClick={onBack} className="mt-4 px-8 py-3 bg-emerald-500 text-white rounded-2xl font-semibold">ホームに戻る</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 mb-3">
            日付を選択（複数可）{selectedDates.length > 0 && <span className="ml-2 text-indigo-500 normal-case">{selectedDates.length}日選択中</span>}
          </p>
          <div className="flex items-center justify-between mb-2">
            <button onClick={() => { calMonth === 0 ? (setCalYear(calYear-1), setCalMonth(11)) : setCalMonth(calMonth-1); }} className="w-6 h-6 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-sm font-semibold text-gray-700">{calYear}年 {monthNames[calMonth]}</span>
            <button onClick={() => { calMonth === 11 ? (setCalYear(calYear+1), setCalMonth(0)) : setCalMonth(calMonth+1); }} className="w-6 h-6 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 mb-1">
            {['日','月','火','水','木','金','土'].map((d, i) => (
              <div key={d} className="text-center text-xs py-1" style={{ color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : '#9ca3af' }}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const d = i + 1;
              const key = toDateKey(calYear, calMonth, d);
              const selected = selectedDates.includes(key);
              const col = (firstDay + i) % 7;
              const existingTypes = existingMap.get(key);
              return (
                <div key={d} className="flex flex-col items-center">
                  <button onClick={() => toggleDate(key)}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all"
                    style={{ background: selected ? '#6366f1' : 'transparent', color: selected ? 'white' : col === 0 ? '#ef4444' : col === 6 ? '#3b82f6' : '#374151' }}>
                    {d}
                  </button>
                  <div className="flex gap-0.5 h-3 items-center">
                    {existingTypes?.has('lunch') && <span className="text-[8px] font-bold text-amber-500">L</span>}
                    {existingTypes?.has('dinner') && <span className="text-[8px] font-bold text-indigo-400">D</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex gap-3 mt-1 pt-2 border-t border-gray-50">
            <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-amber-500">L</span><span className="text-[10px] text-gray-400">登録済みランチ</span></div>
            <div className="flex items-center gap-1"><span className="text-[10px] font-bold text-indigo-400">D</span><span className="text-[10px] text-gray-400">登録済みディナー</span></div>
          </div>
        </div>

        {selectedDates.length > 0 && selectedDates.some(d => existingMap.has(d)) && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-2">📋 選択した日付の登録済みシフト</p>
            <div className="space-y-1.5">
              {selectedDates.flatMap(date => {
                const types = existingMap.get(date);
                if (!types) return [];
                const [y, mo, d] = date.split('-').map(Number);
                const dayNames = ['日','月','火','水','木','金','土'];
                const dow = new Date(y, mo-1, d).getDay();
                return [...types].map(type => {
                  const s = myShifts.find(sh => sh.date === date && sh.type === type)!;
                  return (
                    <div key={`${date}-${type}`} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${type === 'lunch' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        {type === 'lunch' ? 'ランチ' : 'ディナー'}
                      </span>
                      <span className="text-xs text-gray-500">{mo}月{d}日（{dayNames[dow]}）</span>
                      <span className="text-xs text-gray-400 ml-auto">{s.startTime}〜{s.endTime}</span>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-500">時間設定</p>
            <button onClick={() => setShowPresets(!showPresets)} className="flex items-center gap-1 text-xs text-indigo-500 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              履歴から選択
            </button>
          </div>
          {showPresets && (
            <div className="mb-4 space-y-2 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-400 mb-2">よく使う時間帯</p>
              {TIME_PRESETS.map((p, i) => (
                <button key={i} onClick={() => applyPreset(p)} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all text-left">
                  <span className={`w-5 h-5 rounded text-white text-xs flex items-center justify-center font-bold ${p.type === 'lunch' ? 'bg-amber-400' : p.type === 'dinner' ? 'bg-indigo-400' : 'bg-emerald-500'}`}>{p.type === 'lunch' ? 'L' : p.type === 'dinner' ? 'D' : '通'}</span>
                  <span className="text-sm text-gray-700">{p.label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1.5">開始時間</p>
              <input type="time" value={startTime} disabled={allDay} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm disabled:bg-gray-100 disabled:text-gray-400" />
            </div>
            <div className="text-gray-300 mt-5">〜</div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 mb-1.5">終了時間</p>
              <input type="time" value={endTime} disabled={allDay} onChange={e => setEndTime(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm disabled:bg-gray-100 disabled:text-gray-400" />
            </div>
          </div>
          {allDay && <p className="text-xs text-emerald-700 text-center mb-3">10:00〜15:00（ランチ）と17:00〜21:30（ディナー）を登録します。</p>}
          <div className="flex gap-2 mb-3">
            <button onClick={() => { if (!lunchBlockedOnAny) { setAllDay(false); setShiftType('lunch'); setStartTime('10:00'); setEndTime('15:00'); } }} disabled={lunchBlockedOnAny}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${lunchBlockedOnAny ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : !allDay && shiftType === 'lunch' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
              ランチ{lunchBlockedOnAny && <span className="block text-[9px] font-normal mt-0.5 text-gray-400">登録済み</span>}
            </button>
            <button onClick={() => { if (!dinnerBlockedOnAny) { setAllDay(false); setShiftType('dinner'); setStartTime('17:00'); setEndTime('21:30'); } }} disabled={dinnerBlockedOnAny}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${dinnerBlockedOnAny ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : !allDay && shiftType === 'dinner' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              ディナー{dinnerBlockedOnAny && <span className="block text-[9px] font-normal mt-0.5 text-gray-400">登録済み</span>}
            </button>
            <button onClick={() => { if (!allDayBlockedOnAny) { setAllDay(true); setStartTime('10:00'); setEndTime('21:30'); } }} disabled={allDayBlockedOnAny}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${allDayBlockedOnAny ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : allDay ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
              通し{allDayBlockedOnAny && <span className="block text-[9px] font-normal mt-0.5 text-gray-400">登録済み</span>}
            </button>
          </div>
          {hours > 0 && <div className="bg-indigo-50 rounded-xl p-3 text-center"><span className="text-sm text-indigo-600 font-semibold">勤務時間: {hours}時間</span></div>}
        </div>
      </div>
      <div className="p-4 border-t border-gray-100 bg-white">
        {saveError && <p className="text-sm text-red-500 text-center mb-2">{saveError}</p>}
        <button onClick={handleSave} disabled={savableDates.length === 0 || hours <= 0}
          className="w-full py-4 rounded-2xl font-bold text-white transition-all disabled:opacity-40"
          style={{ background: savableDates.length > 0 && hours > 0 ? '#10b981' : '#d1d5db' }}>
          {savableDates.length > 0 ? `${savableDates.length}日分の${allDay ? '通し' : ''}シフトを登録する` : selectedDates.length > 0 ? '選択した日付は登録済みです' : '日付を選択してください'}
        </button>
      </div>
    </div>
  );
}

// ─── My Page Screen ────────────────────────────────────────────────────────────

function MyPageScreen({ profile, onUpdate, onLogout, onDeleteAccount }: {
  profile: UserProfile; onUpdate: (p: UserProfile) => Promise<void>; onLogout: () => void; onDeleteAccount: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const [colorSaving, setColorSaving] = useState(false);
  const [colorError, setColorError] = useState('');

  useEffect(() => {
    if (!editing) setForm(profile);
  }, [profile, editing]);

  const handleSave = async () => {
    try {
      await onUpdate(form);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'プロフィールを保存できませんでした');
    }
  };

  const handleColorChange = async (color: UserProfile['color']) => {
    if (color === profile.color || colorSaving) return;
    setColorSaving(true);
    setColorError('');
    try {
      await onUpdate({ ...profile, color });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setColorError(error instanceof Error ? error.message : 'アイコンの色を保存できませんでした');
    } finally {
      setColorSaving(false);
    }
  };

  if (showDeleteConfirm) return (
    <div className="p-6 flex flex-col items-center text-center h-full justify-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">アカウントを削除しますか？</h2>
      <p className="text-sm text-gray-500 mb-8">この操作は取り消せません。すべてのデータが削除されます。</p>
      <div className="w-full space-y-3">
        <button onClick={onDeleteAccount} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold">削除する</button>
        <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 border-2 border-gray-100 text-gray-500 rounded-2xl font-semibold">キャンセル</button>
      </div>
    </div>
  );

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50';

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: profile.color }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
        <p className="text-sm text-gray-400 mt-1">{profile.email}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-gray-700">アイコンの色</h3>
            <p className="text-xs text-gray-400 mt-1">色を選ぶとすぐに保存され、メンバー表示にも反映されます。</p>
          </div>
          {colorSaving && <span className="text-xs text-indigo-500">保存中...</span>}
        </div>
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="アイコンの色">
          {MEMBER_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              role="radio"
              aria-checked={profile.color === color}
              aria-label={`色 ${color}`}
              disabled={colorSaving}
              onClick={() => void handleColorChange(color)}
              className={`w-9 h-9 rounded-full transition-transform disabled:opacity-60 ${profile.color === color ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        {colorError && <p className="text-xs text-red-500 mt-3">{colorError}</p>}
        {saved && <p className="text-xs text-emerald-600 font-semibold mt-3">✓ 保存しました</p>}
      </div>

      {/* Profile info / edit */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">プロフィール</h3>
          <button onClick={() => editing ? handleSave() : setEditing(true)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${editing ? 'bg-indigo-500 text-white' : 'bg-indigo-50 text-indigo-500'}`}>
            {editing ? '保存する' : '編集する'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div><p className="text-xs text-gray-400 mb-1.5">お名前</p><input className={inputCls} type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div><p className="text-xs text-gray-400 mb-1.5">メールアドレス</p><input className={inputCls} type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
            <div><p className="text-xs text-gray-400 mb-1.5">電話番号</p><input className={inputCls} type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
            <button onClick={() => { setForm(profile); setEditing(false); }} className="w-full py-2.5 text-sm text-gray-400 border border-gray-100 rounded-xl">キャンセル</button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[{ label: 'お名前', value: profile.name }, { label: 'メールアドレス', value: profile.email }, { label: '電話番号', value: profile.phone }].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={onLogout} className="w-full py-3.5 rounded-2xl border-2 border-gray-100 text-gray-500 text-sm font-semibold">ログアウト</button>
      <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3.5 rounded-2xl border-2 border-red-100 text-red-400 text-sm font-semibold">アカウントを削除する</button>
    </div>
  );
}

// ─── Income Settings Screen ────────────────────────────────────────────────────

function IncomeSettingsScreen({ settings, onSave }: { settings: IncomeSettings; onSave: (s: IncomeSettings) => void }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const update = (key: keyof IncomeSettings, val: string | boolean) => { setForm(prev => ({ ...prev, [key]: typeof val === 'boolean' ? val : Number(val) || 0 })); setSaved(false); };
  const handleSave = () => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const estimatedTotal = 48 * form.hourlyWage + 12 * form.transportationFee + form.holidayBonus * 2;

  const inputCls = 'flex-1 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm';

  return (
    <div className="p-4 space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-xs text-indigo-600 font-semibold mb-1">💡 ヒント</p>
        <p className="text-xs text-indigo-700">ここで設定した値がホーム画面の収入予想に反映されます</p>
      </div>

      {/* Show/hide toggle */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-800">ホームに収入予想を表示</p>
          <p className="text-xs text-gray-400 mt-0.5">オフにするとホーム画面から非表示になります</p>
        </div>
        <button onClick={() => update('showForecast', !form.showForecast)}
          className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${form.showForecast ? 'bg-indigo-500' : 'bg-gray-200'}`}>
          <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.showForecast ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700">基本給設定</h3>
        {([['hourlyWage', '時給', '円/時', '基本時給'], ['nightBonus', '深夜手当', '円/時', '22時〜翌5時']] as const).map(([key, label, unit, desc]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5"><label className="text-sm font-medium text-gray-700">{label}</label><span className="text-xs text-gray-400">{desc}</span></div>
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm">¥</span><input type="number" value={form[key] || ''} onChange={e => update(key, e.target.value)} placeholder="0" className={inputCls} /><span className="text-gray-400 text-sm">{unit}</span></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-700">手当・控除</h3>
        {([['holidayBonus', '休日手当（加算）', '円/日', '祝日・特別日'], ['transportationFee', '交通費', '円/回', '1出勤あたり']] as const).map(([key, label, unit, desc]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1.5"><label className="text-sm font-medium text-gray-700">{label}</label><span className="text-xs text-gray-400">{desc}</span></div>
            <div className="flex items-center gap-2"><span className="text-gray-400 text-sm">¥</span><input type="number" value={form[key] || ''} onChange={e => update(key, e.target.value)} placeholder="0" className={inputCls} /><span className="text-gray-400 text-sm">{unit}</span></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">今月の収入予想（プレビュー）</h3>
        <div className="space-y-2">
          {[{ label: `基本給（48h × ¥${form.hourlyWage}）`, value: 48 * form.hourlyWage }, { label: '交通費（12回）', value: 12 * form.transportationFee }, { label: '休日手当', value: form.holidayBonus * 2 }].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm"><span className="text-gray-500">{label}</span><span className="font-medium text-gray-800">{formatCurrency(value)}</span></div>
          ))}
          <div className="border-t border-gray-100 pt-2 flex justify-between">
            <span className="font-bold text-gray-800">合計</span>
            <span className="font-bold text-indigo-600 text-lg">{formatCurrency(estimatedTotal)}</span>
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="w-full py-4 rounded-2xl font-bold text-white transition-all" style={{ background: saved ? '#10b981' : '#6366f1' }}>
        {saved ? '✓ 保存しました' : '設定を保存'}
      </button>
    </div>
  );
}

// ─── Help Screen ───────────────────────────────────────────────────────────────

function HelpScreen({ helpItems, onSubmitItem, onApproveItem }: {
  helpItems: HelpItem[]; onSubmitItem: (q: string, a: string) => void; onApproveItem: (id: string) => void;
}) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const approved = helpItems.filter(i => i.approved);
  const pending = helpItems.filter(i => !i.approved);

  const handleSubmit = () => {
    if (!newQ.trim() || !newA.trim()) return;
    onSubmitItem(newQ.trim(), newA.trim());
    setNewQ(''); setNewA(''); setSubmitted(true); setShowForm(false);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const howToItems = [
    { icon: '📅', title: 'シフトの確認', desc: 'ホーム画面のカレンダーでシフトを確認できます。L＝ランチ、D＝ディナーを表しています。' },
    { icon: '✏️', title: 'シフトの記入', desc: 'カレンダーの日付をタップし「シフト記入」を選択。日付・時間を設定して登録できます。複数日まとめて登録も可能です。' },
    { icon: '🔄', title: 'シフト変更', desc: 'カレンダーの日付をタップし「シフト変更」を選択。変更前後の担当者を指定して申請できます。' },
    { icon: '💰', title: '収入予想の設定', desc: 'ハンバーガーメニュー→「収入予想設定」から時給・手当を設定するとホーム画面に反映されます。' },
  ];

  return (
    <div className="p-4 space-y-4">
      {submitted && <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3 text-center text-sm text-emerald-600 font-semibold">✓ 投稿しました。管理者が承認後に表示されます</div>}

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3 text-sm">アプリの使い方</h3>
        <div className="space-y-3">
          {howToItems.map(item => (
            <div key={item.title} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div><p className="font-semibold text-gray-800 text-sm">{item.title}</p><p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ list */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">よくある質問</h3>
          <span className="text-xs text-gray-400">{approved.length}件</span>
        </div>
        <div className="space-y-2">
          {approved.map(faq => (
            <div key={faq.id} className="border border-gray-100 rounded-xl overflow-hidden">
              <button onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
                <span className="text-sm font-medium text-gray-800 pr-2">{faq.q}</span>
                <svg className="flex-shrink-0 transition-transform" style={{ transform: openFaq === faq.id ? 'rotate(180deg)' : 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {openFaq === faq.id && (
                <div className="px-4 pb-3.5 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-2">
                  {faq.a}
                  <p className="text-xs text-gray-300 mt-2">投稿者: {faq.author}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Submit new Q&A */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm">質問・回答を投稿する</h3>
          <button onClick={() => setShowForm(!showForm)} className="text-xs text-indigo-500 font-semibold bg-indigo-50 px-3 py-1.5 rounded-lg">
            {showForm ? '閉じる' : '投稿する'}
          </button>
        </div>
        {showForm && (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1.5">質問内容</p>
              <textarea value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="例：制服の洗濯方法は？" rows={2}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1.5">回答内容</p>
              <textarea value={newA} onChange={e => setNewA(e.target.value)} placeholder="例：洗濯機で30℃以下で洗えます..." rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />
            </div>
            <p className="text-xs text-gray-400">※ 管理者が承認した後に全体に表示されます</p>
            <button onClick={handleSubmit} disabled={!newQ.trim() || !newA.trim()} className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ background: newQ.trim() && newA.trim() ? '#6366f1' : '#d1d5db' }}>
              投稿する
            </button>
          </div>
        )}
      </div>

      {/* Admin panel */}
      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
        <button onClick={() => setShowAdmin(!showAdmin)} className="w-full flex items-center justify-between text-sm font-semibold text-gray-600">
          <span>🔑 管理者パネル</span>
          <svg className="transition-transform" style={{ transform: showAdmin ? 'rotate(180deg)' : 'none' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {showAdmin && (
          <div className="mt-3 space-y-2">
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">承認待ちの投稿はありません</p>
            ) : (
              pending.map(item => (
                <div key={item.id} className="bg-white rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 mb-1">承認待ち</p>
                  <p className="text-sm font-medium text-gray-800 mb-1">Q: {item.q}</p>
                  <p className="text-xs text-gray-500 mb-2">A: {item.a}</p>
                  <p className="text-xs text-gray-300 mb-2">投稿者: {item.author}</p>
                  <button onClick={() => onApproveItem(item.id)} className="text-xs px-4 py-1.5 bg-indigo-500 text-white rounded-lg font-semibold">承認して公開する</button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const shiftsQuery = useShifts();
  const saveShifts = useSaveShifts();
  const deleteShiftMutation = useDeleteShift();
  const updateShiftTimesMutation = useUpdateShiftTimes();
  const profileQuery = useProfile();
  const saveProfile = useSaveProfile();
  const incomeQuery = useIncomeSettings();
  const saveIncomeSettings = useSaveIncomeSettings();
  const helpQuery = useHelpItemsQuery();
  const swapsQuery = useSwaps();
  const submitHelpItem = useSubmitHelpItem();
  const approveHelpItem = useApproveHelpItem();
  const deleteAccount = useDeleteAccount();
  const routeScreens: Record<string, Screen> = {
    '/': 'home', '/calendar': 'calendar', '/calendar/swap': 'shift-change', '/calendar/entry': 'shift-entry',
    '/settings/mypage': 'mypage', '/settings/income': 'income-settings', '/settings/help': 'help',
  };
  const screen = routeScreens[location.pathname] ?? 'home';
  const screenPaths: Record<Screen, string> = {
    home: '/', calendar: '/calendar', 'shift-change': '/calendar/swap', 'shift-entry': '/calendar/entry',
    mypage: '/settings/mypage', 'income-settings': '/settings/income', help: '/settings/help',
  };
  const setScreen = (next: Screen, date = selectedDate) => navigate({ pathname: screenPaths[next], search: date ? `?date=${encodeURIComponent(date)}` : '' });
  const [profile, setProfile] = useState<UserProfile>({ name: '', email: '', phone: '', color: '#6366f1' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDate, setSelectedDateState] = useState<string | null>(() => new URLSearchParams(window.location.search).get('date'));
  const setSelectedDate = (date: string | null) => {
    setSelectedDateState(date);
    navigate({ pathname: location.pathname, search: date ? `?date=${encodeURIComponent(date)}` : '' }, { replace: true });
  };
  const [now, setNow] = useState(new Date());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [memberDate, setMemberDate] = useState(() => todayKey(new Date()));
  const [memberShiftType, setMemberShiftType] = useState<'lunch' | 'dinner'>('lunch');
  const memberDateQuery = useMembersByDate(memberDate);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [incomeSettings, setIncomeSettings] = useState<IncomeSettings>({ hourlyWage: 1100, nightBonus: 250, holidayBonus: 500, transportationFee: 300, showForecast: true });
  const [helpItems, setHelpItems] = useState<HelpItem[]>([]);

  // Live date update — ticks every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email, phone: (user as typeof user & { phone?: string }).phone ?? '', color: ((user as typeof user & { color?: string }).color ?? '#6366f1') as UserProfile['color'] });
  }, [user]);

  useEffect(() => {
    if (shiftsQuery.data) setShifts(shiftsQuery.data.map((shift) => ({
      id: shift.id,
      date: shift.date,
      type: shift.type,
      startTime: shift.startTime,
      endTime: shift.endTime,
      memberId: shift.userId,
    })));
  }, [shiftsQuery.data]);

  useEffect(() => {
    if (profileQuery.data) setProfile({ name: profileQuery.data.name, email: profileQuery.data.email, phone: profileQuery.data.phone ?? '', color: profileQuery.data.color as UserProfile['color'] });
  }, [profileQuery.data]);

  useEffect(() => {
    if (incomeQuery.data) setIncomeSettings(incomeQuery.data);
  }, [incomeQuery.data]);

  useEffect(() => {
    if (helpQuery.data) setHelpItems(helpQuery.data.map((item) => ({ id: item.id, q: item.question, a: item.answer, author: item.author, approved: item.approved })));
  }, [helpQuery.data]);

  const today = todayKey(now);

  const currentMemberId = user?.id ?? '';
  const myShifts = shifts.filter(s => s.memberId === currentMemberId);
  const nextShift = myShifts.filter(s => s.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const monthlyHours = myShifts.reduce((acc, s) => acc + calcHours(s.startTime, s.endTime), 0);
  const totalHours = 72;
  const estimatedIncome = Math.round(monthlyHours * incomeSettings.hourlyWage + shifts.length * incomeSettings.transportationFee);

  const addShifts = async (newShifts: Shift[]) => {
    await saveShifts.mutateAsync(newShifts);
    setShifts(prev => {
      const merged = [...prev];
      newShifts.forEach(ns => { if (!merged.find(s => s.date === ns.date && s.type === ns.type)) merged.push(ns); });
      return merged;
    });
  };

  const deleteShift = async (date: string, type: 'lunch' | 'dinner') => {
    const target = shifts.find((shift) => shift.date === date && shift.type === type && shift.memberId === currentMemberId);
    if (!target?.id) return;
    try {
      await deleteShiftMutation.mutateAsync(target.id);
      window.location.assign('/');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'シフトを削除できませんでした');
    }
  };

  const updateShiftTimes = async (date: string, type: 'lunch' | 'dinner', startTime: string, endTime: string) => {
    const target = shifts.find((shift) => shift.date === date && shift.type === type && shift.memberId === currentMemberId);
    if (!target?.id) throw new Error('シフトが見つかりません');
    await updateShiftTimesMutation.mutateAsync({ id: target.id, startTime, endTime });
    window.location.assign('/');
  };

  const saveProfileToApi = async (nextProfile: UserProfile) => {
    await saveProfile.mutateAsync({ name: nextProfile.name, phone: nextProfile.phone, color: nextProfile.color });
    setProfile(nextProfile);
  };

  const saveIncomeSettingsToApi = (settings: IncomeSettings) => {
    setIncomeSettings(settings);
    void saveIncomeSettings.mutateAsync(settings).catch((error: unknown) => window.alert(error instanceof Error ? error.message : '収入設定を保存できませんでした'));
  };

  const SCREEN_TITLES: Record<Screen, string> = { home: 'シフト管理', calendar: 'カレンダー', 'shift-change': 'シフト交代', 'shift-entry': 'シフト記入', mypage: 'マイページ', 'income-settings': '収入予想設定', help: 'ヘルプ' };

  return (
    <div className="flex justify-center bg-gray-200 min-h-screen">
      <div className="relative w-full bg-gray-50 flex flex-col overflow-hidden" style={{ maxWidth: 430, minHeight: '100dvh' }}>

        {/* Header */}
        <header className="bg-white border-b border-gray-100 flex items-center justify-between px-4 py-4 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {screen !== 'home' && (
              <button
                onClick={() => {
                  setScreen('home');
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">{SCREEN_TITLES[screen]}</h1>
          </div>
          <button onClick={() => setMenuOpen(true)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {screen === 'home' && (
            <div className="p-4 space-y-3">
              <Calendar year={calYear} month={calMonth} shifts={myShifts} today={today}
                onPrev={() => { calMonth === 0 ? (setCalYear(calYear-1), setCalMonth(11)) : setCalMonth(calMonth-1); }}
                onNext={() => { calMonth === 11 ? (setCalYear(calYear+1), setCalMonth(0)) : setCalMonth(calMonth+1); }}
                onDayClick={(date) => setSelectedDate(date)} />

              {/* Next shift */}
              {nextShift && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span className="text-xs font-semibold text-indigo-500">次回のシフト</span>
                  </div>
                  <p className="font-bold text-gray-900">{formatDateLabel(nextShift.date, nextShift.date === today)} {nextShift.type === 'lunch' ? 'ランチ' : 'ディナー'}</p>
                  <p className="text-sm text-gray-500 mt-1">{nextShift.startTime} 〜 {nextShift.endTime}（{calcHours(nextShift.startTime, nextShift.endTime)}時間）</p>
                </div>
              )}

              {/* Members by date */}
              {(() => {
                const [y, mo, d] = memberDate.split('-').map(Number);
                const dayNames = ['日','月','火','水','木','金','土'];
                const dow = new Date(y, mo-1, d).getDay();
                const isToday_ = memberDate === today;
                const label = isToday_ ? '今日' : `${mo}月${d}日（${dayNames[dow]}）`;
                const members = memberDateQuery.data
                  ? [...new Map(memberDateQuery.data.filter((member) => member.type === memberShiftType).map((member) => [member.id, member])).values()]
                  : null;
                const changeDay = (delta: number) => {
                  const dt = new Date(y, mo-1, d);
                  dt.setDate(dt.getDate() + delta);
                  setMemberDate(`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`);
                };
                return (
                  <div className="bg-white rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-400">{label}のバイトメンバー</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeDay(-1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                        </button>
                        {!isToday_ && <button onClick={() => setMemberDate(today)} className="text-xs text-indigo-500 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors">今日</button>}
                        <button onClick={() => changeDay(1)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setMemberShiftType('lunch')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${memberShiftType === 'lunch' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        ランチ
                      </button>
                      <button
                        onClick={() => setMemberShiftType('dinner')}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${memberShiftType === 'dinner' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        ディナー
                      </button>
                    </div>
                    {!members || members.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-2">この時間帯のシフトはありません</p>
                    ) : (
                      <div className="flex gap-3 flex-wrap">
                        {members.map(m => (
                          <div key={m.id} className="flex items-center gap-2"><Avatar member={m} size={32} /><span className="text-sm text-gray-700">{m.name}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Shift exchange notifications */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-gray-400 mb-3">シフト交代通知</p>
                <div className="space-y-3">
                  {(swapsQuery.data ?? []).slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-600 truncate">{item.fromName}</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      <span className="text-xs text-gray-600 truncate">{item.toName}</span>
                      <span className="text-xs text-gray-500 ml-auto">{item.date} {item.type === 'lunch' ? 'ランチ' : 'ディナー'}</span>
                    </div>
                  ))}
                  {swapsQuery.data?.length === 0 && <p className="text-xs text-gray-400">交代履歴はありません</p>}
                </div>
              </div>

              {/* Income forecast */}
              {incomeSettings.showForecast && (
                <div className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">今月の収入予想</p>
                    <span className="text-xs text-indigo-500 font-semibold">時給: {formatCurrency(incomeSettings.hourlyWage)}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-3">{formatCurrency(estimatedIncome)}</p>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min((monthlyHours/totalHours)*100, 100)}%`, background: '#6366f1' }} />
                  </div>
                  <p className="text-xs text-gray-400">稼働済み: {monthlyHours}時間 / 残り: {Math.max(totalHours - monthlyHours, 0)}時間（計{totalHours}時間）</p>
                </div>
              )}
            </div>
          )}

          {screen === 'calendar' && (
            <div className="p-4">
              <Calendar year={calYear} month={calMonth} shifts={myShifts} today={today}
                onPrev={() => { calMonth === 0 ? (setCalYear(calYear-1), setCalMonth(11)) : setCalMonth(calMonth-1); }}
                onNext={() => { calMonth === 11 ? (setCalYear(calYear+1), setCalMonth(0)) : setCalMonth(calMonth+1); }}
                onDayClick={(date) => setSelectedDate(date)} />
            </div>
          )}

          {screen === 'shift-change' && (
            <ShiftChangeScreen
              initialDate={selectedDate || today}
              shifts={shifts}
              currentMemberId={currentMemberId}
              onBack={() => setScreen('home')}
            />
          )}

          {screen === 'shift-entry' && (
            <ShiftEntryScreen initialDate={selectedDate || today} existingShifts={shifts} currentMemberId={currentMemberId} onBack={() => setScreen('home')}
              onSave={async (newShifts) => {
                await addShifts(newShifts);
                window.setTimeout(() => window.location.assign('/'), 1200);
              }} />
          )}

          {screen === 'mypage' && (
            <MyPageScreen profile={profile} onUpdate={saveProfileToApi}
                onLogout={() => { void authClient.signOut().then(() => navigate('/login')); }}
                onDeleteAccount={() => {
                  void deleteAccount.mutateAsync().then(() => authClient.signOut()).then(() => navigate('/login'))
                    .catch((error: unknown) => window.alert(error instanceof Error ? error.message : 'アカウントを削除できませんでした'));
                }} />
          )}

          {screen === 'income-settings' && <IncomeSettingsScreen settings={incomeSettings} onSave={saveIncomeSettingsToApi} />}

          {screen === 'help' && (
            <HelpScreen helpItems={helpItems}
              onSubmitItem={(q, a) => {
                void submitHelpItem.mutateAsync({ question: q, answer: a }).catch((error: unknown) => window.alert(error instanceof Error ? error.message : '投稿できませんでした'));
              }}
              onApproveItem={(id) => {
                void approveHelpItem.mutateAsync(id).catch((error: unknown) => window.alert(error instanceof Error ? error.message : '承認できませんでした'));
              }} />
          )}
        </main>

        {/* Day action modal — calendar screen only */}
        {selectedDate && (screen === 'calendar' || screen === 'home') && (
          <DayActionModal date={selectedDate} shifts={myShifts} onClose={() => setSelectedDate(null)}
            onShiftChange={(d) => { setSelectedDate(d); setScreen('shift-change', d); }}
            onShiftEntry={(d) => { setSelectedDate(d); setScreen('shift-entry', d); }}
            onShiftDelete={deleteShift}
            onShiftTimeUpdate={updateShiftTimes} />
        )}

        {/* Hamburger drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setMenuOpen(false)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Profile — always visible at top, never clipped */}
              <div className="flex-shrink-0 p-6 pt-8 border-b border-gray-100" style={{ backgroundColor: `${profile.color}18` }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: profile.color }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{profile.name}</p>
                    <p className="text-xs text-gray-500 truncate">{profile.email || 'メール未設定'}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-1">
                {([['mypage', '👤', 'マイページ', 'プロフィール・実績'], ['income-settings', '💰', '収入予想設定', '時給・手当の設定'], ['help', '❓', 'ヘルプ', '使い方・よくある質問']] as const).map(([sc, icon, label, desc]) => (
                  <button key={sc} onClick={() => { setScreen(sc); setMenuOpen(false); }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
                    <span className="text-2xl">{icon}</span>
                    <div><p className="font-semibold text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                    <svg className="ml-auto flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                ))}
              </nav>

              <div className="flex-shrink-0 p-4 border-t border-gray-100">
                {/* Live date/time display */}
                <p className="text-xs text-center text-gray-400 mb-2">{now.getFullYear()}年{now.getMonth()+1}月{now.getDate()}日（{'日月火水木金土'[now.getDay()]}）</p>
                <p className="text-xs text-center text-gray-300">シフト管理 v1.0.0</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
