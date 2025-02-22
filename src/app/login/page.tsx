"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Car, Lock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "react-toastify"
import { supabase } from "@/lib/supabase"

interface LoginCredentials {
  email: string
  password: string
}

export default function LoginPage() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const router = useRouter()

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          window.location.href = "/dashboard"
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }
    }
    
    checkAuth()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Validate email format
      if (!credentials.email.includes('@')) {
        setError("Please enter a valid email address")
        setIsLoading(false)
        return
      }

      // Validate password length
      if (credentials.password.length < 6) {
        setError("Password must be at least 6 characters long")
        setIsLoading(false)
        return
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) {
        throw signInError
      }

      if (data.user) {
        toast.success("Login successful!")
        
        // Verify session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Use window.location for a full page reload
          window.location.href = "/dashboard"
        } else {
          throw new Error("Session not established")
        }
      }
    } catch (err) {
      console.error("Login error:", err)
      
      // Handle specific error messages
      if (err instanceof Error) {
        if (err.message.includes("Invalid login credentials")) {
          setError("Invalid email or password")
        } else if (err.message.includes("Email not confirmed")) {
          setError("Please verify your email address")
        } else if (err.message.includes("rate limit")) {
          setError("Too many login attempts. Please try again later")
        } else {
          setError("Login failed. Please try again")
        }
      } else {
        setError("An unexpected error occurred")
      }
      
      toast.error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-8 h-8 text-red-600" />
            <span className="font-bold text-xl">BURGER SPRAYING SHOP</span>
          </div>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full"
                required
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700 text-white transition-colors"
              disabled={isLoading}
            >
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
