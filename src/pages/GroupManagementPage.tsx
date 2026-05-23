import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Scale, Trash2, X } from 'lucide-react';
import {
  addComplexToGroup,
  createComparisonGroup,
  deleteComparisonGroup,
  removeComplexFromGroup,
} from '../features/comparisons/api';
import type { ComparisonGroup } from '../features/comparisons/types';
import { Button } from '../shared/components/Button';
import { Card } from '../shared/components/Card';
import { Field } from '../shared/components/Field';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';

export function GroupManagementPage() {
  const { groups, memberships, complexes, loading, error, reload } = useAppData();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedComplex, setSelectedComplex] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setNotice('그룹명을 입력해 주세요.');
      return;
    }
    setCreating(true);
    try {
      await createComparisonGroup({ name: name.trim(), description: description.trim() || null });
      setName('');
      setDescription('');
      await reload();
      setNotice('비교 그룹을 생성했습니다. 단지를 추가해 주세요.');
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : '그룹을 저장하지 못했습니다.');
    } finally {
      setCreating(false);
    }
  }

  async function handleAdd(group: ComparisonGroup, fallbackId: string | undefined) {
    const complexId = selectedComplex[group.id] || fallbackId;
    if (!complexId) return;
    const count = memberships.filter((item) => item.group_id === group.id).length;
    try {
      await addComplexToGroup(group.id, complexId, count);
      await reload();
      setSelectedComplex((values) => ({ ...values, [group.id]: '' }));
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : '단지를 그룹에 추가하지 못했습니다.');
    }
  }

  async function handleRemove(groupId: string, complexId: string) {
    try {
      await removeComplexFromGroup(groupId, complexId);
      await reload();
    } catch (caught) {
      setNotice(caught instanceof Error ? caught.message : '단지를 그룹에서 제거하지 못했습니다.');
    }
  }

  async function handleDelete(group: ComparisonGroup) {
    if (!window.confirm(`'${group.name}' 비교 그룹을 삭제하시겠습니까?`)) return;
    await deleteComparisonGroup(group.id);
    await reload();
    setNotice('비교 그룹을 삭제했습니다.');
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="비교 그룹 관리"
        description="경쟁 단지 3~4곳을 하나의 그룹으로 묶어 평형별 가격을 비교합니다."
        action={
          <Link to="/compare">
            <Button variant="secondary">
              <span className="flex items-center gap-2">
                <Scale className="h-4 w-4" /> 비교 화면
              </span>
            </Button>
          </Link>
        }
      />

      {notice && <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">{notice}</p>}

      <Card>
        <h2 className="text-lg font-bold">새 비교 그룹</h2>
        <form className="mt-5 grid gap-4 md:grid-cols-[1fr_1.4fr_auto] md:items-end" onSubmit={handleCreate}>
          <Field label="그룹명 *">
            <input className="field-control" value={name} onChange={(event) => setName(event.target.value)} placeholder="화서역·정자동 비교" />
          </Field>
          <Field label="설명">
            <input className="field-control" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="전용 84㎡ 중심" />
          </Field>
          <Button type="submit" disabled={creating}>
            <span className="flex items-center justify-center gap-2">
              <Plus className="h-4 w-4" /> {creating ? '생성 중...' : '그룹 생성'}
            </span>
          </Button>
        </form>
      </Card>

      {groups.length ? (
        <div className="space-y-4">
          {groups.map((group) => {
            const groupMemberships = memberships
              .filter((item) => item.group_id === group.id)
              .sort((a, b) => a.sort_order - b.sort_order);
            const memberIds = groupMemberships.map((item) => item.complex_id);
            const available = complexes.filter((complex) => !memberIds.includes(complex.id));
            const fallbackId = available[0]?.id;
            return (
              <Card key={group.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{group.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{group.description ?? '설명 없음'}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-600"
                    aria-label="그룹 삭제"
                    onClick={() => void handleDelete(group)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {groupMemberships.length ? (
                    groupMemberships.map((membership) => {
                      const complex = complexes.find((item) => item.id === membership.complex_id);
                      if (!complex) return null;
                      return (
                        <span key={membership.id} className="inline-flex items-center gap-2 rounded-full bg-slate-50 py-2 pl-3 pr-2 text-sm">
                          {complex.name}
                          <button
                            type="button"
                            className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-red-500"
                            aria-label={`${complex.name} 제거`}
                            onClick={() => void handleRemove(group.id, complex.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-400">아직 포함된 단지가 없습니다.</p>
                  )}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <select
                    className="field-control mt-0 flex-1"
                    value={selectedComplex[group.id] || fallbackId || ''}
                    onChange={(event) =>
                      setSelectedComplex((values) => ({ ...values, [group.id]: event.target.value }))
                    }
                    disabled={!available.length}
                  >
                    {available.length ? (
                      available.map((complex) => (
                        <option key={complex.id} value={complex.id}>
                          {complex.name}
                        </option>
                      ))
                    ) : (
                      <option value="">추가 가능한 단지 없음</option>
                    )}
                  </select>
                  <Button
                    variant="secondary"
                    disabled={!available.length}
                    onClick={() => void handleAdd(group, fallbackId)}
                  >
                    단지 추가
                  </Button>
                </div>
                <p className="mt-4 text-xs text-slate-400">
                  포함 단지 {groupMemberships.length}개 {groupMemberships.length > 4 ? '· 화면 가독성을 위해 3~4개를 권장합니다.' : ''}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title="생성된 비교 그룹이 없습니다" description="상단 폼에서 첫 비교 그룹을 생성하세요." />
      )}
    </div>
  );
}
