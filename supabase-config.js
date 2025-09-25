// Supabase Configuration
// Bu dosyayı Supabase Console'dan aldığın config ile güncelle

const SUPABASE_URL = 'https://kpndjydmbdlkerpgsblg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbmRqeWRtYmRsa2VycGdzYmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTc1ODQsImV4cCI6MjA3NDM5MzU4NH0.OCTMJnm3Zqx1y9nLuwJr4jIUA4lHI3Jzd9GJcwovb2w';

// Supabase client'ı başlat
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global olarak erişilebilir yap
window.supabase = supabaseClient;
