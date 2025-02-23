"use client"

import { useRouter, useSearchParams } from "next/navigation"
// ... other imports remain the same

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // ... other state declarations remain the same

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) throw signInError

      if (data.user) {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          toast.success("Login successful!")
          
          // Get the redirect URL from search params or default to dashboard
          const redirectTo = searchParams.get('redirectTo') || '/dashboard'
          
          // Use Next.js router for navigation
          router.push(redirectTo)
          router.refresh() // Force a refresh of the page
        } else {
          throw new Error("Session not established")
        }
      }
    } catch (err) {
      // ... error handling remains the same
    } finally {
      setIsLoading(false)
    }
  }

  // ... rest of the component remains the same
}
