import "react-native-url-polyfill/auto"
import { AppState } from "react-native"
import { createClient } from "@supabase/supabase-js"

import { storage } from "@/utils/storage"

/**
 * Supabase client configuration for React Native
 *
 * This creates a properly configured Supabase client for React Native environments.
 * Uses MMKV for high-performance session storage and handles app state changes
 * for automatic token refresh.
 */

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase configuration. Please check that EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your environment variables.",
  )
}

// Create MMKV storage adapter for Supabase auth
const MMKVStorage = {
  getItem: (key: string) => {
    const item = storage.getString(key)
    return item || null
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: MMKVStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disable for React Native
  },
})

// Handle app state changes for automatic session refresh
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

export default supabase