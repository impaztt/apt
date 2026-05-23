import { changeDemoDataset, readDemoDataset, toListingRecord } from '../../shared/data/demoData';
import { isSupabaseConfigured, supabase } from '../../shared/supabase/client';
import { isPossibleDuplicate } from './validation';
import type { ApartmentListing, ListingInput } from './types';

export async function listListings(): Promise<ApartmentListing[]> {
  if (!isSupabaseConfigured || !supabase) return readDemoDataset().listings;
  const { data, error } = await supabase.from('apartment_listings').select('*').order('verified_date', { ascending: false });
  if (error) throw error;
  return data as ApartmentListing[];
}

function markDuplicates(inputs: ListingInput[], existing: ApartmentListing[]): ListingInput[] {
  const observed = [...existing];
  return inputs.map((input) => {
    const marked = { ...input, is_duplicate_candidate: input.is_duplicate_candidate || isPossibleDuplicate(input, observed) };
    observed.push(toListingRecord(marked));
    return marked;
  });
}

export async function createListing(input: ListingInput): Promise<ApartmentListing> {
  const [marked] = markDuplicates([input], await listListings());
  if (!isSupabaseConfigured || !supabase) {
    const record = toListingRecord(marked);
    changeDemoDataset((data) => data.listings.unshift(record));
    return record;
  }
  const { data, error } = await supabase.from('apartment_listings').insert(marked).select().single();
  if (error) throw error;
  return data as ApartmentListing;
}

export async function createListings(inputs: ListingInput[]): Promise<ApartmentListing[]> {
  const marked = markDuplicates(inputs, await listListings());
  if (!isSupabaseConfigured || !supabase) {
    const records = marked.map(toListingRecord);
    changeDemoDataset((data) => data.listings.unshift(...records));
    return records;
  }
  const { data, error } = await supabase.from('apartment_listings').insert(marked).select();
  if (error) throw error;
  return data as ApartmentListing[];
}

export async function deleteListing(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) {
    changeDemoDataset((data) => {
      data.listings = data.listings.filter((item) => item.id !== id);
    });
    return;
  }
  const { error } = await supabase.from('apartment_listings').delete().eq('id', id);
  if (error) throw error;
}
