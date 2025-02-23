"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// ... other imports remain the same

export default function DashboardPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData>({
    customers: [],
    inventory: [],
    invoices: []
  })

  useEffect(() => {
    const mounted = true
    let channels = {
      customers: null as RealtimeChannel | null,
      inventory: null as RealtimeChannel | null,
      invoices: null as RealtimeChannel | null
    }

    const checkAuthAndFetchData = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (!session) {
          router.replace('/login')
          return
        }

        // Fetch all data with proper typing
        const [
          { data: customers, error: customersError },
          { data: inventory, error: inventoryError },
          { data: invoices, error: invoicesError }
        ] = await Promise.all([
          supabase.from("customers").select("*"),
          supabase.from("inventory").select("*"),
          supabase.from("invoices").select(`
            *,
            customers(name),
            services(description, price)
          `)
        ])

        if (customersError) throw customersError
        if (inventoryError) throw inventoryError
        if (invoicesError) throw invoicesError

        if (!mounted) return

        setData({
          customers: (customers as Customer[]) || [],
          inventory: (inventory as InventoryItem[]) || [],
          invoices: (invoices as Invoice[]) || []
        })

        // Set up realtime subscriptions
        channels.customers = supabase.channel('customers')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'customers'
          }, (payload) => {
            if (!mounted) return
            const newCustomer = payload.new as Customer
            setData(prev => ({
              ...prev,
              customers: prev.customers.map(customer => 
                customer.id === newCustomer.id ? newCustomer : customer
              )
            }))
          })
          .subscribe()

        // Similar updates for inventory and invoices channels
        // ... (rest of the channel setup code)

      } catch (error) {
        console.error('Dashboard data loading error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data'
        if (mounted) {
          setError(errorMessage)
          toast.error(errorMessage)
          router.replace('/login')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuthAndFetchData()

    return () => {
      Object.values(channels).forEach(channel => {
        if (channel) channel.unsubscribe()
      })
    }
  }, [router])

  // Rest of the component remains the same...
}
