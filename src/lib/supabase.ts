import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Supabase URL available:", !!supabaseUrl)
console.log("Supabase Key available:", !!supabaseKey)

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing environment variables:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
  })
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseKey)

