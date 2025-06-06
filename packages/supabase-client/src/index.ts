import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Vessel {
  id: string;
  name: string;
  status: string;
  last_position?: any;
  created_at?: string;
}

export interface SyncLog {
  id?: string;
  vessel_id: string;
  action: string;
  data?: any;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      vessels: {
        Row: Vessel;
        Insert: Omit<Vessel, 'created_at'>;
        Update: Partial<Vessel>;
      };
      sync_logs: {
        Row: SyncLog;
        Insert: Omit<SyncLog, 'id' | 'created_at'>;
        Update: Partial<SyncLog>;
      };
    };
  };
}

let supabaseClient: SupabaseClient<Database> | null = null;

export function initSupabase(url: string, anonKey: string): SupabaseClient<Database> {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(url, anonKey);
  }
  return supabaseClient;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Call initSupabase first.');
  }
  return supabaseClient;
}

export async function registerVessel(vessel: Omit<Vessel, 'created_at'>): Promise<Vessel> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vessels')
    .upsert(vessel)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateVesselStatus(id: string, status: string, position?: any): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('vessels')
    .update({ 
      status, 
      last_position: position 
    })
    .eq('id', id);
  
  if (error) throw error;
}

export async function getAllVessels(): Promise<Vessel[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('vessels')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function logSync(log: Omit<SyncLog, 'id' | 'created_at'>): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('sync_logs')
    .insert(log);
  
  if (error) throw error;
}

export async function checkConnection(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('vessels').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}