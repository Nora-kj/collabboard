"use client";
import { createSupabaseBrowserClient } from "./supabase-client";
import { generateAnonymousName } from "./names";

const STORAGE_KEY = "collabboard:anon-name";

const getOrCreateAnonName = (): string => {
  if (typeof window === "undefined") return generateAnonymousName();
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const name = generateAnonymousName();
  window.localStorage.setItem(STORAGE_KEY, name);
  return name;
};

export const ensureAnonymousSession = async (): Promise<void> => {
  const supabase = createSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return;

  const display_name = getOrCreateAnonName();
  const { error } = await supabase.auth.signInAnonymously({
    options: { data: { display_name } },
  });
  if (error) throw error;
};
