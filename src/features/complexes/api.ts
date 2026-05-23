import { isSupabaseConfigured, supabase } from '../../shared/supabase/client';
import { changeDemoDataset, readDemoDataset } from '../../shared/data/demoData';
import type { ApartmentComplex, ComplexInput } from './types';

export async function listComplexes(): Promise<ApartmentComplex[]> {
  if (!isSupabaseConfigured || !supabase) return readDemoDataset().complexes;
  const { data, error } = await supabase.from('apartment_complexes').select('*').order('name');
  if (error) throw error;
  return data as ApartmentComplex[];
}

export async function createComplex(input: ComplexInput): Promise<ApartmentComplex> {
  if (!isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const record: ApartmentComplex = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
    changeDemoDataset((data) => data.complexes.push(record));
    return record;
  }
  const { data, error } = await supabase.from('apartment_complexes').insert(input).select().single();
  if (error) throw error;
  return data as ApartmentComplex;
}

export async function updateComplex(id: string, input: ComplexInput): Promise<ApartmentComplex> {
  if (!isSupabaseConfigured || !supabase) {
    let record: ApartmentComplex | undefined;
    changeDemoDataset((data) => {
      const index = data.complexes.findIndex((item) => item.id === id);
      if (index < 0) return;
      record = { ...data.complexes[index], ...input, updated_at: new Date().toISOString() };
      data.complexes[index] = record;
    });
    if (!record) throw new Error('수정할 단지를 찾을 수 없습니다.');
    return record;
  }
  const { data, error } = await supabase.from('apartment_complexes').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data as ApartmentComplex;
}

export async function deleteComplex(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    changeDemoDataset((data) => {
      data.complexes = data.complexes.filter((item) => item.id !== id);
      data.listings = data.listings.filter((item) => item.complex_id !== id);
      data.memberships = data.memberships.filter((item) => item.complex_id !== id);
    });
    return;
  }
  const { error } = await supabase.from('apartment_complexes').delete().eq('id', id);
  if (error) throw error;
}
