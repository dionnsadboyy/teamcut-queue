import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://ywdffgxgcxscdaxnutgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_PfmKWNR_afXvjsKLphWMnw_JT29Z_kH";

export const isSupabaseConfigured =
  SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_SUPABASE_PUBLISHABLE_KEY");

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;

export function getSupabaseConfigError() {
  return "Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY di js/supabase.js.";
}
