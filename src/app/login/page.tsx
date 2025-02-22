"use client"

import type React from "react"

import { useState } from "react"
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
  const [error, setError] = useState<string>("")
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast.success("Login successful!")
        router.push("/dashboard")
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An error occurred during login")
      }
      toast.error("Login failed")
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
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white">
              <Lock className="w-4 h-4 mr-2" />
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

