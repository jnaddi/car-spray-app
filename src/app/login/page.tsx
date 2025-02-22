"use client"

import type React from "react"
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
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Checking Supabase connection...")
  const router = useRouter()

  // Check session on mount
  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()
        console.log("Initial session check:", {
          hasSession: !!session,
          timestamp: new Date().toISOString(),
        })

        if (session) {
          console.log("Active session found, redirecting to dashboard")
          router.push("/dashboard")
        }

        if (error) {
          console.error("Session check error:", error)
        }
      } catch (err) {
        console.error("Session check failed:", err)
      }
    }

    checkSession()
  }, [router])

  // Test Supabase connection on component mount
  useEffect(() => {
    async function checkSupabase() {
      try {
        console.log("Environment check:", {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        })

        // Test Supabase connection
        const { data, error } = await supabase.from("customers").select("count").limit(1)

        if (error) {
          console.error("Supabase connection error:", {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint,
          })
          setSupabaseStatus(`Connection Error: ${error.message}`)
          return
        }

        setSupabaseStatus("Supabase connected successfully")
        console.log("Supabase connection test:", {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error("Supabase check error:", err)
        setSupabaseStatus(`Connection Error: ${err instanceof Error ? err.message : "Unknown error"}`)
      }
    }

    checkSupabase()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      console.log("Login attempt:", {
        email: credentials.email,
        timestamp: new Date().toISOString(),
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        console.error("Authentication error:", {
          code: error.status,
          message: error.message,
          timestamp: new Date().toISOString(),
        })

        // Handle specific error cases
        if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password")
        } else if (error.message.includes("Email not confirmed")) {
          setError("Please verify your email address")
        } else {
          setError(error.message)
        }

        toast.error("Login failed")
        return
      }

      if (data.user) {
        console.log("Login successful:", {
          userId: data.user.id,
          email: data.user.email,
          timestamp: new Date().toISOString(),
        })

        // Verify session was created
        const {
          data: { session },
        } = await supabase.auth.getSession()
        console.log("Session after login:", {
          hasSession: !!session,
          timestamp: new Date().toISOString(),
        })

        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred")
      toast.error("Login failed")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Card className="w-96">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-8 h-8 text-red-600" />
            <span className="font-bold text-lg">BURGER SPRAYING SHOP</span>
          </div>
          <CardTitle>Login</CardTitle>
          <CardDescription>Enter your credentials to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Supabase Status Indicator */}
          <div
            className={`mb-4 p-2 rounded text-sm ${
              supabaseStatus.includes("Error")
                ? "bg-red-100 text-red-700"
                : supabaseStatus.includes("successfully")
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
            }`}
          >
            {supabaseStatus}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isLoading}>
              <Lock className="w-4 h-4 mr-2" />
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

