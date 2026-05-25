import { type FormEvent, useEffect, useState } from 'react';
import { BarChart3, BookOpen, Building2, FileJson, Layers3, MoreHorizontal, Palette, Pencil, Scale, TrendingUp } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { KakaoBrowserNotice } from './KakaoBrowserNotice';

const NAVIGATION_UNLOCKED_KEY = 'apt-mobile-navigation-unlocked';
const NAVIGATION_PASSWORD = '3514';

const desktopNavigation = [
  { to: '/', label: '대시보드', icon: BarChart3, end: true },
  { to: '/guide', label: '우리 단지', icon: BookOpen },
  { to: '/complexes', label: '단지', icon: Building2 },
  { to: '/data/input', label: 'JSON 입력', icon: FileJson },
  { to: '/groups', label: '그룹', icon: Layers3 },
  { to: '/settings/display', label: '표시 설정', icon: Palette },
  { to: '/guide/edit', label: '가이드 관리', icon: Pencil },
  { to: '/compare', label: '비교', icon: Scale },
  { to: '/trends', label: '변화', icon: TrendingUp },
];

const mobileNavigation = [
  { to: '/', label: '대시보드', icon: BarChart3, end: true },
  { to: '/guide', label: '우리 단지', icon: BookOpen },
  { to: '/compare', label: '비교', icon: Scale },
  { to: '/trends', label: '변화', icon: TrendingUp },
  { to: '/manage', label: '관리', icon: MoreHorizontal },
];

function Navigation({ mobile = false, unlocked = true }: { mobile?: boolean; unlocked?: boolean }) {
  const navigation = mobile
    ? (unlocked ? mobileNavigation : mobileNavigation.slice(0, 2))
    : (unlocked ? desktopNavigation : desktopNavigation.slice(0, 2));
  return (
    <nav className={mobile ? (unlocked ? 'grid grid-cols-5 px-1' : 'mx-auto grid max-w-48 grid-cols-2') : 'space-y-1'}>
      {navigation.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            mobile
              ? `flex flex-col items-center gap-1 py-3 text-[11px] font-medium ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              : `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'
                }`
          }
        >
          <Icon className={mobile ? 'h-5 w-5' : 'h-5 w-5'} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
export function AppShell() {
  const [navigationUnlocked, setNavigationUnlocked] = useState(
    () => sessionStorage.getItem(NAVIGATION_UNLOCKED_KEY) === 'true',
  );
  const [brandTapCount, setBrandTapCount] = useState(0);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!brandTapCount || showUnlockDialog) return undefined;
    const timer = window.setTimeout(() => setBrandTapCount(0), 2500);
    return () => window.clearTimeout(timer);
  }, [brandTapCount, showUnlockDialog]);

  function handleBrandTap() {
    if (navigationUnlocked) return;

    setBrandTapCount((current) => {
      const next = current + 1;
      if (next >= 5) {
        setShowUnlockDialog(true);
        setPassword('');
        setPasswordError('');
        return 0;
      }
      return next;
    });
  }

  function closeUnlockDialog() {
    setShowUnlockDialog(false);
    setPassword('');
    setPasswordError('');
  }

  function unlockNavigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== NAVIGATION_PASSWORD) {
      setPasswordError('비밀번호가 올바르지 않습니다.');
      return;
    }

    sessionStorage.setItem(NAVIGATION_UNLOCKED_KEY, 'true');
    setNavigationUnlocked(true);
    closeUnlockDialog();
  }

  return (
    <div className="min-h-screen bg-canvas">
      <KakaoBrowserNotice />
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-100 bg-white px-5 py-7 lg:block">
        <button type="button" className="block w-full px-3 text-left" onClick={handleBrandTap} aria-label="단지비교랩">
          <p className="text-xs font-semibold text-brand-600">APT PRICE COMPARE</p>
          <p className="mt-2 text-xl font-bold tracking-tight">단지비교랩</p>
          <p className="mt-2 text-sm font-medium text-slate-500">호가 분석 대시보드</p>
        </button>
        <div className="mt-10">
          <Navigation unlocked={navigationUnlocked} />
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-3.5 backdrop-blur lg:hidden">
        <button type="button" className="text-left" onClick={handleBrandTap} aria-label="단지비교랩">
          <p className="text-xl font-extrabold tracking-tight text-slate-900">단지비교랩</p>
          <p className="mt-0.5 text-xs font-medium text-slate-500">호가 분석 대시보드</p>
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-rose-600">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          Live
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-3.5 pb-24 pt-5 sm:px-6 sm:pt-6 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-9">
        <Outlet />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white lg:hidden">
        <Navigation mobile unlocked={navigationUnlocked} />
      </div>

      {showUnlockDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" role="dialog" aria-modal="true" aria-label="추가 메뉴 열기">
          <button type="button" className="absolute inset-0 bg-slate-900/35" onClick={closeUnlockDialog} aria-label="닫기" />
          <form className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" onSubmit={unlockNavigation}>
            <h2 className="text-lg font-bold text-slate-900">추가 메뉴 열기</h2>
            <p className="mt-1 text-sm text-slate-500">비밀번호를 입력하면 숨겨진 메뉴가 표시됩니다.</p>
            <input
              autoFocus
              className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:border-brand-400 focus:bg-white"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError('');
              }}
              placeholder="비밀번호 입력"
            />
            {passwordError && <p className="mt-2 text-sm font-medium text-rose-600">{passwordError}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600" onClick={closeUnlockDialog}>
                취소
              </button>
              <button type="submit" className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white">
                확인
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
