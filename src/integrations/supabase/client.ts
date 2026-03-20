import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://dtqqjeaadboqrhbldicj.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cXFqZWFhZGJvcXJoYmxkaWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5OTYxMDUsImV4cCI6MjA3MTU3MjEwNX0.yKi8sMtFRd8MjBmMmcrpmJtRlMkSp2LiLXvnuPsqJIc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
