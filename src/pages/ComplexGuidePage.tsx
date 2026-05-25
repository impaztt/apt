import {
  BookOpen,
  Building2,
  ChevronRight,
  ExternalLink,
  House,
  MapPinned,
  Phone,
  Trees,
} from 'lucide-react';
import type { ComplexGuide } from '../features/guides/types';
import { Card } from '../shared/components/Card';
import { EmptyState, ErrorState } from '../shared/components/States';
import { loadComplexGuides } from '../features/guides/data';

const GUIDE_COMPLEX_ID = 'hwaseo-prugio-edu';

export function ComplexGuidePage() {
  let guides: ComplexGuide[];
  try {
    guides = loadComplexGuides();
  } catch (caught) {
    return <ErrorState message={caught instanceof Error ? caught.message : '우리 단지 가이드를 불러오지 못했습니다.'} />;
  }
  const guide = guides.find((item) => item.complex_id === GUIDE_COMPLEX_ID) ?? guides[0];
  if (!guide) return <EmptyState title="우리 단지 가이드가 없습니다" description="관리 화면에서 가이드 JSON을 등록해 주세요." />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-keep text-lg font-extrabold tracking-tight text-slate-900 sm:text-2xl">{guide.title}</h1>
            <p className="mt-1 break-keep text-xs text-slate-500">{guide.contact.address}</p>
          </div>
          <span className="shrink-0 rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
            {guide.updated_at.replace(/-/g, '.')} 기준
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <a href={`tel:${guide.contact.office_phone.replace(/-/g, '')}`} className="rounded-2xl bg-brand-50 p-3 text-center">
            <Phone className="mx-auto h-5 w-5 text-brand-600" />
            <p className="mt-2 text-[11px] font-bold text-brand-700">관리사무소</p>
          </a>
          <a href={guide.contact.homepage_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 p-3 text-center">
            <BookOpen className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 text-[11px] font-bold text-slate-700">공식 홈페이지</p>
          </a>
          <a href={guide.contact.map_url} target="_blank" rel="noreferrer" className="rounded-2xl bg-slate-50 p-3 text-center">
            <MapPinned className="mx-auto h-5 w-5 text-slate-600" />
            <p className="mt-2 text-[11px] font-bold text-slate-700">지도 보기</p>
          </a>
        </div>
      </Card>

      <nav className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold text-slate-600">
        {[
          ['입주 준비', 'move-in'],
          ['생활 안내', 'living'],
          ['시설', 'facilities'],
          ['단지 지도', 'site-map'],
          ['주변 생활', 'nearby'],
          ['FAQ', 'faq'],
        ].map(([label, id]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full bg-white px-3 py-2 shadow-card">{label}</a>
        ))}
      </nav>

      <Card className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-brand-50 p-2.5 text-brand-700"><House className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="text-base font-bold">단지 한눈에</h2>
            <p className="mt-1 break-keep text-xs text-slate-500">{guide.contact.address}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {guide.overview.map((item) => (
            <div key={item.label} className="rounded-2xl bg-slate-50 p-3">
              <p className="text-[10px] font-semibold text-slate-400">{item.label}</p>
              <p className="mt-1 break-keep text-xs font-bold text-slate-800">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 text-sm">
          <span className="text-slate-500">관리사무소</span>
          <a className="font-bold text-brand-700" href={`tel:${guide.contact.office_phone.replace(/-/g, '')}`}>{guide.contact.office_phone}</a>
        </div>
      </Card>

      <section id="move-in" className="scroll-mt-36 space-y-3">
        <h2 className="px-1 text-lg font-bold">입주 준비</h2>
        {guide.move_in_sections.map((section) => (
          <Card key={section.title} className="p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-900">{section.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{section.description}</p>
            <div className="mt-3 space-y-2">
              {section.items.map((item) => (
                <p key={item} className="flex gap-2 text-xs leading-5 text-slate-600">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </p>
              ))}
            </div>
          </Card>
        ))}
      </section>

      <section id="living" className="scroll-mt-36 space-y-3">
        <h2 className="px-1 text-lg font-bold">생활 안내</h2>
        {guide.living_guides.map((item) => (
          <details key={item.title} className="group rounded-3xl bg-white p-4 shadow-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <span>
                <strong className="block text-sm text-slate-900">{item.title}</strong>
                <span className="mt-1 block text-xs text-slate-500">{item.description}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
            </summary>
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {item.items.map((detail) => (
                <p key={detail} className="text-xs leading-5 text-slate-600">- {detail}</p>
              ))}
            </div>
          </details>
        ))}
      </section>

      <section id="facilities" className="scroll-mt-36">
        <div className="mb-3 flex items-center gap-2 px-1">
          <Building2 className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold">단지 시설</h2>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {guide.facilities.map((facility) => (
            <Card key={facility.name} className="p-3.5 shadow-none">
              <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">{facility.category}</span>
              <h3 className="mt-2 text-sm font-bold">{facility.name}</h3>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{facility.description}</p>
              {(facility.location || facility.hours) && (
                <p className="mt-2 text-[10px] text-slate-400">{facility.location ?? ''} {facility.hours ?? ''}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section id="site-map" className="scroll-mt-36 space-y-3">
        <h2 className="px-1 text-lg font-bold">단지 지도·동별 안내</h2>
        <Card className="p-4 sm:p-6">
          {guide.site_map.image_url ? (
            <img src={guide.site_map.image_url} alt={`${guide.title} 단지 배치도`} className="w-full rounded-2xl object-cover" />
          ) : (
            <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
              <MapPinned className="h-7 w-7 text-slate-300" />
              <p className="mt-3 text-xs leading-5 text-slate-500">{guide.site_map.caption}</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {guide.site_map.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {link.label}<ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </Card>
        {guide.building_notes.length ? (
          <div className="space-y-2">
            {guide.building_notes.map((building) => (
              <Card key={building.building_no} className="p-4 shadow-none">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-brand-700">{building.building_no}</p>
                    <h3 className="mt-1 text-sm font-bold">{building.title}</h3>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {building.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-500">{tag}</span>)}
                  </div>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">{building.description}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white px-4 py-3 text-xs text-slate-500 shadow-card">동별 위치와 생활 동선 설명은 관리자 화면에서 추가할 수 있습니다.</p>
        )}
      </section>

      <section id="nearby" className="scroll-mt-36 space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Trees className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold">주변 생활</h2>
        </div>
        {guide.nearby_places.map((place) => (
          <a key={place.name} href={place.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
            <span>
              <span className="text-[10px] font-bold text-brand-600">{place.category}</span>
              <strong className="mt-1 block text-sm">{place.name}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-500">{place.description}</span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-slate-300" />
          </a>
        ))}
      </section>

      <section id="faq" className="scroll-mt-36 space-y-2">
        <h2 className="mb-3 px-1 text-lg font-bold">자주 묻는 질문</h2>
        {guide.faqs.map((item) => (
          <details key={item.question} className="group rounded-2xl bg-white p-4 shadow-card">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
              {item.question}
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" />
            </summary>
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-6 text-slate-600">{item.answer}</p>
          </details>
        ))}
      </section>

      <Card className="p-4 shadow-none">
        <p className="text-xs font-bold text-slate-700">정보 출처</p>
        <div className="mt-2 space-y-2">
          {guide.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="truncate">{source.label} · 확인 {source.checked_at.replace(/-/g, '.')}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
