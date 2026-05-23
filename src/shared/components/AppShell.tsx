import { BarChart3, Building2, FileJson, Layers3, Scale, TrendingUp } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const navigation = [
  { to: '/', label: '대시보드', icon: BarChart3, end: true },
  { to: '/complexes', label: '단지', icon: Building2 },
  { to: '/data/input', label: 'JSON 입력', icon: FileJson },
  { to: '/groups', label: '그룹', icon: Layers3 },
  { to: '/compare', label: '비교', icon: Scale },
  { to: '/trends', label: '변화', icon: TrendingUp },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? 'grid grid-cols-6 px-1' : 'space-y-1'}>
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
  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-100 bg-white px-5 py-7 lg:block">
        <div className="px-3">
          <p className="text-xs font-semibold text-brand-600">APT PRICE COMPARE</p>
          <p className="mt-2 text-xl font-bold tracking-tight">단지비교랩</p>
          <span className="mt-4 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            JSON 파일 데이터
          </span>
        </div>
        <div className="mt-10">
          <Navigation />
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/90 px-5 py-4 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs font-semibold text-brand-600">단지비교랩</p>
          <p className="text-sm font-bold">호가 분석 대시보드</p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
          JSON
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-10 lg:pt-9">
        <Outlet />
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-100 bg-white lg:hidden">
        <Navigation mobile />
      </div>
    </div>
  );
}
