import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'love_coupons_supabase_url';
const STORAGE_KEY_ANON = 'love_coupons_supabase_anon_key';
const STORAGE_KEY_LOCAL_SELECTIONS = 'love_coupons_local_selections_v1';

let supabaseClient = null;
let realtimeChannel = null;

export const SQL_SCHEMA_SCRIPT = `-- ==========================================
-- LOVE COUPONS SUPABASE DATABASE SCHEMA
-- Jalankan skrip ini di SQL Editor Supabase
-- ==========================================

-- 1. Tabel Kupon Cinta yang Dipilih Istri
CREATE TABLE IF NOT EXISTS public.coupon_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id TEXT NOT NULL,
  coupon_title TEXT NOT NULL,
  coupon_category TEXT,
  coupon_image_url TEXT,
  wife_name TEXT DEFAULT 'Istri Tercinta',
  wife_note TEXT,
  status TEXT NOT NULL DEFAULT 'selected', -- 'selected', 'in_progress', 'completed'
  husband_reply_note TEXT,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.coupon_selections ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS (Izinkan Baca, Tambah, Ubah, Hapus untuk Akses Pasangan)
DROP POLICY IF EXISTS "Public select selections" ON public.coupon_selections;
CREATE POLICY "Public select selections" ON public.coupon_selections FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert selections" ON public.coupon_selections;
CREATE POLICY "Public insert selections" ON public.coupon_selections FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update selections" ON public.coupon_selections;
CREATE POLICY "Public update selections" ON public.coupon_selections FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete selections" ON public.coupon_selections;
CREATE POLICY "Public delete selections" ON public.coupon_selections FOR DELETE USING (true);

-- 4. Aktifkan Fitur Realtime Supabase untuk tabel coupon_selections
ALTER PUBLICATION supabase_realtime ADD TABLE public.coupon_selections;
`;

/**
 * Membaca konfigurasi Supabase dari LocalStorage atau URL query
 */
export function getSupabaseCredentials() {
  const urlParams = new URLSearchParams(window.location.search);
  const paramUrl = urlParams.get('sb_url');
  const paramKey = urlParams.get('sb_key');

  if (paramUrl && paramKey) {
    localStorage.setItem(STORAGE_KEY_URL, paramUrl.trim());
    localStorage.setItem(STORAGE_KEY_ANON, paramKey.trim());
    // Hapus parameter dari URL agar rapi
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  const envUrl = (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
  const envKey = (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';

  const url = localStorage.getItem(STORAGE_KEY_URL) || envUrl;
  const anonKey = localStorage.getItem(STORAGE_KEY_ANON) || envKey;

  return {
    url: url.trim(),
    anonKey: anonKey.trim(),
    isConfigured: Boolean(url.trim() && anonKey.trim())
  };
}

/**
 * Inisialisasi Supabase Client jika kredensial tersedia
 */
export function initSupabase() {
  const creds = getSupabaseCredentials();
  if (creds.isConfigured) {
    try {
      supabaseClient = createClient(creds.url, creds.anonKey, {
        auth: {
          persistSession: false
        }
      });
      return supabaseClient;
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      supabaseClient = null;
      return null;
    }
  }
  supabaseClient = null;
  return null;
}

export function getClient() {
  if (!supabaseClient) {
    return initSupabase();
  }
  return supabaseClient;
}

/**
 * Menyimpan kredensial baru
 */
export function saveSupabaseCredentials(url, anonKey) {
  if (!url || !anonKey) {
    throw new Error('Supabase URL dan Anon Key tidak boleh kosong.');
  }
  localStorage.setItem(STORAGE_KEY_URL, url.trim());
  localStorage.setItem(STORAGE_KEY_ANON, anonKey.trim());
  return initSupabase();
}

/**
 * Menghapus konfigurasi Supabase (kembali ke local mode)
 */
export function removeSupabaseCredentials() {
  localStorage.removeItem(STORAGE_KEY_URL);
  localStorage.removeItem(STORAGE_KEY_ANON);
  if (realtimeChannel && supabaseClient) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  supabaseClient = null;
}

/**
 * Menguji koneksi ke Supabase dan ketersediaan tabel coupon_selections
 */
export async function testSupabaseConnection(overrideUrl, overrideKey) {
  let client = null;
  if (overrideUrl && overrideKey) {
    client = createClient(overrideUrl.trim(), overrideKey.trim(), {
      auth: { persistSession: false }
    });
  } else {
    client = getClient();
  }

  if (!client) {
    return {
      success: false,
      message: 'Supabase belum dikonfigurasi. Silakan masukkan Project URL & Anon Key.'
    };
  }

  try {
    const { data, error } = await client
      .from('coupon_selections')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation "public.coupon_selections" does not exist')) {
        return {
          success: false,
          code: 'TABLE_NOT_FOUND',
          message: 'Terkoneksi ke Supabase, namun tabel "coupon_selections" belum dibuat di database.',
          detail: 'Silakan jalankan SQL Setup Script yang kami sediakan di SQL Editor Supabase Anda.'
        };
      }
      return {
        success: false,
        code: error.code || 'QUERY_ERROR',
        message: 'Gagal melakukan query ke Supabase: ' + error.message,
        detail: error.details || error.hint || ''
      };
    }

    return {
      success: true,
      message: 'Berhasil terkoneksi ke database Supabase secara online! Sinkronisasi antarperangkat aktif.'
    };
  } catch (err) {
    return {
      success: false,
      message: 'Koneksi gagal: ' + (err.message || 'Periksa format URL dan Anon Key Anda.')
    };
  }
}

/**
 * Ambil daftar kupon yang dipilih (dari Supabase jika ada, fallback ke localStorage)
 */
export async function fetchCouponSelections() {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('coupon_selections')
        .select('*')
        .order('claimed_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        // Cache ke local storage sebagai backup
        localStorage.setItem(STORAGE_KEY_LOCAL_SELECTIONS, JSON.stringify(data));
        return {
          source: 'cloud',
          data
        };
      }
    } catch (err) {
      console.warn('Gagal memuat dari Supabase, beralih ke cache lokal:', err);
    }
  }

  // Fallback ke Local Storage
  const raw = localStorage.getItem(STORAGE_KEY_LOCAL_SELECTIONS);
  let localData = [];
  if (raw) {
    try {
      localData = JSON.parse(raw);
    } catch (e) {
      localData = [];
    }
  }
  return {
    source: 'local',
    data: localData
  };
}

/**
 * Simpan pemilihan kupon baru oleh istri
 */
export async function saveCouponSelection(selection) {
  const client = getClient();
  const newSelection = {
    id: selection.id || (crypto.randomUUID ? crypto.randomUUID() : 'sel-' + Date.now()),
    coupon_id: selection.coupon_id,
    coupon_title: selection.coupon_title,
    coupon_category: selection.coupon_category || 'Romantic',
    coupon_image_url: selection.coupon_image_url || '',
    wife_name: selection.wife_name || 'Istri Tercinta',
    wife_note: selection.wife_note || '',
    status: 'selected', // 'selected', 'in_progress', 'completed'
    husband_reply_note: '',
    claimed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Selalu simpan ke local cache terlebih dahulu
  const raw = localStorage.getItem(STORAGE_KEY_LOCAL_SELECTIONS);
  let list = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {
    list = [];
  }
  list.unshift(newSelection);
  localStorage.setItem(STORAGE_KEY_LOCAL_SELECTIONS, JSON.stringify(list));

  // Jika Supabase aktif, simpan ke database online
  if (client) {
    try {
      const { data, error } = await client
        .from('coupon_selections')
        .insert([newSelection])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return {
          success: false,
          source: 'local_fallback',
          data: newSelection,
          error: error.message
        };
      }

      return {
        success: true,
        source: 'cloud',
        data: data || newSelection
      };
    } catch (err) {
      console.error('Network error during Supabase insert:', err);
      return {
        success: false,
        source: 'local_fallback',
        data: newSelection,
        error: err.message
      };
    }
  }

  return {
    success: true,
    source: 'local',
    data: newSelection
  };
}

/**
 * Update status kupon oleh suami (selected -> in_progress -> completed)
 * serta catatan balasan suami
 */
export async function updateSelectionStatus(id, newStatus, husbandReplyNote = null) {
  const client = getClient();
  const updatePayload = {
    status: newStatus,
    updated_at: new Date().toISOString()
  };
  if (husbandReplyNote !== null) {
    updatePayload.husband_reply_note = husbandReplyNote;
  }

  // Update local cache
  const raw = localStorage.getItem(STORAGE_KEY_LOCAL_SELECTIONS);
  let list = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {
    list = [];
  }
  const idx = list.findIndex(item => item.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updatePayload };
    localStorage.setItem(STORAGE_KEY_LOCAL_SELECTIONS, JSON.stringify(list));
  }

  if (client) {
    try {
      const { data, error } = await client
        .from('coupon_selections')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return { success: false, source: 'local_fallback', error: error.message };
      }
      return { success: true, source: 'cloud', data };
    } catch (err) {
      console.error('Network error during Supabase update:', err);
      return { success: false, source: 'local_fallback', error: err.message };
    }
  }

  return { success: true, source: 'local', data: list[idx] };
}

/**
 * Hapus penukaran kupon (jika suami ingin mereset kupon)
 */
export async function deleteSelection(id) {
  const client = getClient();

  // Local cache delete
  const raw = localStorage.getItem(STORAGE_KEY_LOCAL_SELECTIONS);
  let list = [];
  try {
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {
    list = [];
  }
  list = list.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEY_LOCAL_SELECTIONS, JSON.stringify(list));

  if (client) {
    try {
      const { error } = await client
        .from('coupon_selections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase delete error:', error);
        return { success: false, error: error.message };
      }
    } catch (err) {
      console.error('Network error during Supabase delete:', err);
    }
  }

  return { success: true };
}

/**
 * Daftarkan listener Supabase Realtime agar HP/Laptop Suami langsung menerima pilihan istri secara instan
 */
export function subscribeToSelectionChanges(onUpdate) {
  const client = getClient();
  if (!client) {
    return () => {};
  }

  try {
    if (realtimeChannel) {
      client.removeChannel(realtimeChannel);
    }

    realtimeChannel = client
      .channel('public:coupon_selections_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupon_selections' },
        (payload) => {
          console.log('Realtime change received from Supabase:', payload);
          if (typeof onUpdate === 'function') {
            onUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('Supabase Realtime subscription status:', status);
      });

    return () => {
      if (realtimeChannel && client) {
        client.removeChannel(realtimeChannel);
        realtimeChannel = null;
      }
    };
  } catch (err) {
    console.error('Failed to subscribe to realtime changes:', err);
    return () => {};
  }
}
