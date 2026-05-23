import { useEffect, useState } from 'react';
import { Copy, ExternalLink, X } from 'lucide-react';

const DISMISSED_KEY = 'apt-price-compare:kakao-browser-dismissed';

type MobilePlatform = 'ios' | 'android' | 'other';

function getPlatform(): MobilePlatform {
  const userAgent = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';
  return 'other';
}

function isKakaoBrowser(): boolean {
  return /KAKAOTALK/i.test(navigator.userAgent);
}

export function KakaoBrowserNotice() {
  const [open, setOpen] = useState(false);
  const [platform, setPlatform] = useState<MobilePlatform>('other');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isKakaoBrowser()) return;
    setPlatform(getPlatform());
    if (sessionStorage.getItem(DISMISSED_KEY) !== 'true') setOpen(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setOpen(false);
  }

  function openExternalBrowser() {
    const destination = encodeURIComponent(window.location.href);
    window.location.href = `kakaotalk://web/openExternal?url=${destination}`;
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      setCopied(true);
    }
  }

  if (!open) return null;

  const browserLabel = platform === 'ios' ? 'Safari 또는 기본 브라우저' : '기본 브라우저';
  const manualGuide =
    platform === 'ios'
      ? '전환되지 않으면 카카오톡 화면의 공유 또는 더보기 메뉴에서 Safari로 열기를 선택하세요.'
      : platform === 'android'
        ? '전환되지 않으면 카카오톡 화면의 더보기 메뉴에서 다른 브라우저로 열기를 선택하세요.'
        : '전환되지 않으면 카카오톡 메뉴에서 다른 브라우저로 열기를 선택하세요.';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/45 px-3 pb-4 sm:items-center sm:px-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="kakao-browser-title"
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-card sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-brand-600">카카오톡 브라우저 감지</p>
            <h2 id="kakao-browser-title" className="mt-2 text-lg font-bold text-slate-900">
              외부 브라우저에서 열어주세요
            </h2>
          </div>
          <button type="button" aria-label="팝업 닫기" className="rounded-xl p-1.5 text-slate-400" onClick={dismiss}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          대시보드 조작과 데이터 저장은 {browserLabel}에서 더 안정적으로 사용할 수 있습니다.
        </p>

        <button
          type="button"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 px-4 py-3.5 text-sm font-bold text-white"
          onClick={openExternalBrowser}
        >
          <ExternalLink className="h-4 w-4" /> {browserLabel}에서 열기
        </button>

        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => void copyAddress()}
        >
          <Copy className="h-4 w-4" /> {copied ? '주소가 복사되었습니다' : '주소 복사하기'}
        </button>

        <p className="mt-4 rounded-2xl bg-brand-50 px-4 py-3 text-xs leading-5 text-slate-600">{manualGuide}</p>

        <button
          type="button"
          className="mt-4 w-full py-2 text-sm font-semibold text-slate-400"
          onClick={dismiss}
        >
          카카오톡에서 계속 보기
        </button>
      </section>
    </div>
  );
}
