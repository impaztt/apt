import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Trash2, X } from 'lucide-react';
import type { ApartmentComplex } from '../types';
import { Button } from '../../../shared/components/Button';

interface DeleteComplexDialogProps {
  complex: ApartmentComplex;
  buttonLabel?: string;
}

export function DeleteComplexDialog({
  complex,
  buttonLabel = '단지 삭제',
}: DeleteComplexDialogProps) {
  const [open, setOpen] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [confirmName, setConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);
  const confirmed = confirmName.trim() === complex.name;

  function close() {
    if (deleting) return;
    setOpen(false);
    setAdminKey('');
    setConfirmName('');
    setError(null);
    setCompleted(null);
    setCommitUrl(null);
  }

  async function handleDelete() {
    if (!confirmed) {
      setError('삭제 확인을 위해 단지명을 정확히 입력해 주세요.');
      return;
    }
    if (!adminKey.trim()) {
      setError('관리자 저장 키를 입력해 주세요.');
      return;
    }

    setDeleting(true);
    setError(null);
    try {
      const response = await fetch('/api/complex-files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({ id: complex.id, name: complex.name }),
      });
      const result = (await response.json()) as { message?: string; commitUrl?: string | null };
      if (!response.ok) throw new Error(result.message ?? '단지 삭제 요청에 실패했습니다.');
      setCompleted(result.message ?? '단지 삭제 커밋을 생성했습니다.');
      setCommitUrl(result.commitUrl ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '단지 삭제 요청에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-600"
      >
        <Trash2 className="h-4 w-4" /> {buttonLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">단지를 삭제하시겠습니까?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  <strong className="text-ink">{complex.name}</strong> 단지와 포함된 매물 전체가 삭제됩니다.
                  삭제 후 Cloudflare 재배포가 완료되면 화면에서 사라집니다.
                </p>
              </div>
              <button type="button" aria-label="닫기" className="rounded-lg p-1 text-slate-400" onClick={close}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {!completed ? (
              <>
                <label className="mt-5 block text-sm font-medium text-slate-700">
                  삭제 확인을 위해 단지명을 입력하세요
                  <input
                    className="field-control"
                    value={confirmName}
                    onChange={(event) => setConfirmName(event.target.value)}
                    placeholder={complex.name}
                  />
                </label>
                <label className="mt-4 block text-sm font-medium text-slate-700">
                  관리자 저장 키
                  <input
                    className="field-control"
                    type="password"
                    value={adminKey}
                    onChange={(event) => setAdminKey(event.target.value)}
                    placeholder="관리자 저장 키 입력"
                  />
                </label>
                {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                <div className="mt-5 flex gap-2">
                  <Button variant="ghost" fullWidth onClick={close} disabled={deleting}>
                    취소
                  </Button>
                  <Button variant="danger" fullWidth onClick={() => void handleDelete()} disabled={!confirmed || deleting}>
                    {deleting ? '삭제 중...' : '단지 및 매물 삭제'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-5 rounded-2xl bg-brand-50 px-4 py-3 text-sm leading-6 text-brand-700">{completed}</p>
                <div className="mt-5 flex flex-col gap-2">
                  {commitUrl && (
                    <a
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700"
                      href={commitUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      삭제 커밋 확인 <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Link to="/complexes" onClick={close}>
                    <Button fullWidth>단지 목록으로 이동</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
