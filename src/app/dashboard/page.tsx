"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import CarSprayApp from "@/components/CarSprayApp"
import { toast } from "react-toastify"

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  total_spent: number
  last_visit: string
}

interface InventoryItem {
  id: number
  name: string
  quantity: number
  unit: string
  category: string
  threshold: number
}

interface Service {
  description: string
  price: number
}

interface Invoice {
  id: number
  customer_id: number
  date: string
  total: number
  status: string
  paid_amount: number
  customers: {
    name: string
  }
  services: Service[]
}

interface DashboardData {
  customers: Customer[]
  inventory: InventoryItem[]
  invoices: Invoice[]
}

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
    const checkAuthAndFetchData = async () => {
      try {
        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (!session) {
          router.replace('/login')
          return
        }

        // Fetch all data in parallel
        const [
          { data: customers, error: customersError },
          { data: inventory, error: inventoryError },
          { data: invoices, error: invoicesError }
        ] = await Promise.all([
          supabase.from("customers").select("*") as Promise<{ data: Customer[] | null, error: any }>,
          supabase.from("inventory").select("*") as Promise<{ data: InventoryItem[] | null, error: any }>,
          supabase.from("invoices").select(`
            *,
            customers(name),
            services(description, price)
          `) as Promise<{ data: Invoice[] | null, error: any }>
        ])

        // Check for any data fetching errors
        if (customersError) throw customersError
        if (inventoryError) throw inventoryError
        if (invoicesError) throw invoicesError

        // Update state with fetched data
        setData({
          customers: customers || [],
          inventory: inventory || [],
          invoices: invoices || []
        })

      } catch (err) {
        console.error('Dashboard data loading error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndFetchData()

    // Set up real-time subscriptions
    const customersSubscription = supabase
      .channel('customers_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'customers' },
        (payload) => {
          // Type assertion for payload.new as Customer
          const newCustomer = payload.new as Customer
          setData((prev) => ({
            ...prev,
            customers: prev.customers.map((customer) => 
              customer.id === newCustomer.id ? newCustomer : customer
            )
          }))
        }
      )
      .subscribe()

    const inventorySubscription = supabase
      .channel('inventory_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'inventory' },
        (payload) => {
          // Type assertion for payload.new as InventoryItem
          const newItem = payload.new as InventoryItem
          setData((prev) => ({
            ...prev,
            inventory: prev.inventory.map((item) => 
              item.id === newItem.id ? newItem : item
            )
          }))
        }
      )
      .subscribe()

    const invoicesSubscription = supabase
      .channel('invoices_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => {
          // Type assertion for payload.new as Invoice
          const newInvoice = payload.new as Invoice
          setData((prev) => ({
            ...prev,
            invoices: prev.invoices.map((invoice) => 
              invoice.id === newInvoice.id ? newInvoice : invoice
            )
          }))
        }
      )
      .subscribe()

    // Cleanup subscriptions
    return () => {
      customersSubscription.unsubscribe()
      inventorySubscription.unsubscribe()
      invoicesSubscription.unsubscribe()
    }
  }, [router])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-600 text-xl mb-4">Error loading dashboard</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <CarSprayApp
      initialCustomers={data.customers}
      initialInventory={data.inventory}
      initialInvoices={data.invoices}
    />
  )
}
