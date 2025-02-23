"use client"

import { useRouter } from "next/navigation"
// ... other imports remain the same

export default function DashboardPage() {
  const router = useRouter()
  // ... other state declarations remain the same

  useEffect(() => {
    let mounted = true
    let customersChannel: RealtimeChannel
    let inventoryChannel: RealtimeChannel
    let invoicesChannel: RealtimeChannel

    const checkAuthAndFetchData = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (!session) {
          router.replace('/login')
          return
        }

        // ... rest of the data fetching logic remains the same
      } catch (error) {
        console.error('Dashboard data loading error:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
          router.replace('/login')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuthAndFetchData()

    // ... cleanup function remains the same
  }, [router])

  // ... rest of the component remains the same
}
