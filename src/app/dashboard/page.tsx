"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import CarSprayApp from "@/components/CarSprayApp"
import { toast } from "react-toastify"
import { RealtimeChannel } from '@supabase/supabase-js'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardData>({
    customers: [],
    inventory: [],
    invoices: []
  })

  useEffect(() => {
    let mounted = true
    let customersChannel: RealtimeChannel
    let inventoryChannel: RealtimeChannel
    let invoicesChannel: RealtimeChannel

    const checkAuthAndFetchData = async () => {
      try {
        console.log("Checking session...")
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        
        if (authError) throw authError
        
        if (!session) {
          console.log("No session found, redirecting to login...")
          window.location.replace('/login')
          return
        }

        console.log("Session found, fetching data...")

        // Fetch all data with proper typing
        const customersPromise = supabase.from("customers").select("*")
        const inventoryPromise = supabase.from("inventory").select("*")
        const invoicesPromise = supabase.from("invoices").select(`
          *,
          customers(name),
          services(description, price)
        `)

        const [
          { data: customers, error: customersError },
          { data: inventory, error: inventoryError },
          { data: invoices, error: invoicesError }
        ] = await Promise.all([
          customersPromise,
          inventoryPromise,
          invoicesPromise
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

        // Set up real-time subscriptions after initial data fetch
        customersChannel = supabase.channel('customers')
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

        inventoryChannel = supabase.channel('inventory')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'inventory'
          }, (payload) => {
            if (!mounted) return
            const newItem = payload.new as InventoryItem
            setData(prev => ({
              ...prev,
              inventory: prev.inventory.map(item => 
                item.id === newItem.id ? newItem : item
              )
            }))
          })
          .subscribe()

        invoicesChannel = supabase.channel('invoices')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'invoices'
          }, (payload) => {
            if (!mounted) return
            const newInvoice = payload.new as Invoice
            setData(prev => ({
              ...prev,
              invoices: prev.invoices.map(invoice => 
                invoice.id === newInvoice.id ? newInvoice : invoice
              )
            }))
          })
          .subscribe()

      } catch (error) {
        console.error('Dashboard data loading error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data'
        if (mounted) {
          setError(errorMessage)
          toast.error(errorMessage)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    checkAuthAndFetchData()

    // Cleanup function
    return () => {
      mounted = false
      if (customersChannel) customersChannel.unsubscribe()
      if (inventoryChannel) inventoryChannel.unsubscribe()
      if (invoicesChannel) invoicesChannel.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

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
