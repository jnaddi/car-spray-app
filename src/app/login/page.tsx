"use client"

import { useRouter, useSearchParams } from "next/navigation"
// ... other imports remain the same

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

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
          const redirectTo = searchParams?.get('redirectTo') || '/dashboard'
          router.push(redirectTo)
          router.refresh()
        } else {
          throw new Error("Session not established")
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      
      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password")
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Please verify your email address")
      } else {
        setError(errorMessage)
      }
      
      toast.error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  // Rest of the component remains the same...
}
