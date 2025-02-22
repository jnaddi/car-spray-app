import { supabase } from "@/lib/supabase"
import CarSprayApp from "@/components/CarSprayApp"

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

export default async function DashboardPage() {
  const { data: customers } = (await supabase.from("customers").select("*")) as { data: Customer[] }

  const { data: inventory } = (await supabase.from("inventory").select("*")) as { data: InventoryItem[] }

  const { data: invoices } = (await supabase.from("invoices").select(`
      *,
      customers(name),
      services(description, price)
    `)) as { data: Invoice[] }

  return (
    <CarSprayApp
      initialCustomers={customers || []}
      initialInventory={inventory || []}
      initialInvoices={invoices || []}
    />
  )
}

