import { changeDemoDataset, readDemoDataset } from '../../shared/data/demoData';
import { isSupabaseConfigured, supabase } from '../../shared/supabase/client';
import type { ComparisonGroup, ComparisonGroupComplex, ComparisonGroupInput } from './types';

export async function listComparisonGroups(): Promise<ComparisonGroup[]> {
  if (!isSupabaseConfigured || !supabase) return readDemoDataset().groups;
  const { data, error } = await supabase.from('comparison_groups').select('*').order('created_at');
  if (error) throw error;
  return data as ComparisonGroup[];
}

export async function listGroupMemberships(): Promise<ComparisonGroupComplex[]> {
  if (!isSupabaseConfigured || !supabase) return readDemoDataset().memberships;
  const { data, error } = await supabase.from('comparison_group_complexes').select('*').order('sort_order');
  if (error) throw error;
  return data as ComparisonGroupComplex[];
}

export async function createComparisonGroup(input: ComparisonGroupInput): Promise<ComparisonGroup> {
  if (!isSupabaseConfigured || !supabase) {
    const now = new Date().toISOString();
    const record: ComparisonGroup = { ...input, id: crypto.randomUUID(), created_at: now, updated_at: now };
    changeDemoDataset((data) => data.groups.push(record));
    return record;
  }
  const { data, error } = await supabase.from('comparison_groups').insert(input).select().single();
  if (error) throw error;
  return data as ComparisonGroup;
}

export async function deleteComparisonGroup(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    changeDemoDataset((data) => {
      data.groups = data.groups.filter((group) => group.id !== id);
      data.memberships = data.memberships.filter((item) => item.group_id !== id);
    });
    return;
  }
  const { error } = await supabase.from('comparison_groups').delete().eq('id', id);
  if (error) throw error;
}
export async function addComplexToGroup(groupId: string, complexId: string, sortOrder: number): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    changeDemoDataset((data) => {
      const exists = data.memberships.some((item) => item.group_id === groupId && item.complex_id === complexId);
      if (!exists) {
        data.memberships.push({
          id: crypto.randomUUID(),
          group_id: groupId,
          complex_id: complexId,
          sort_order: sortOrder,
          created_at: new Date().toISOString(),
        });
      }
    });
    return;
  }
  const { error } = await supabase
    .from('comparison_group_complexes')
    .insert({ group_id: groupId, complex_id: complexId, sort_order: sortOrder });
  if (error) throw error;
}

export async function removeComplexFromGroup(groupId: string, complexId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    changeDemoDataset((data) => {
      data.memberships = data.memberships.filter(
        (item) => item.group_id !== groupId || item.complex_id !== complexId,
      );
    });
    return;
  }
  const { error } = await supabase
    .from('comparison_group_complexes')
    .delete()
    .eq('group_id', groupId)
    .eq('complex_id', complexId);
  if (error) throw error;
}
