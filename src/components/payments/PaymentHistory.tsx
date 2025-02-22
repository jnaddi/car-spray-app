"use client"

import React from "react"
import { supabase } from "@/lib/supabase"

interface Payment {
  id: number
  date: string
  amount: number
}

interface PaymentHistoryProps {
  invoiceId: number
}

export function PaymentHistory({ invoiceId }: PaymentHistoryProps) {
  const [payments, setPayments] = React.useState<Payment[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchPayments = async () => {
      try {
        const { data, error } = await supabase
          .from("payments")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("date", { ascending: false })

        if (error) throw error
        setPayments(data || [])
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [invoiceId])

  if (loading) return <div>Loading payment history...</div>

  return (
    <div>
      <h3 className="font-bold mb-2">Payment History</h3>
      {payments.length === 0 ? (
        <p>No payments recorded</p>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="border-b text-sm">
              <th className="text-left py-2">Date</th>
              <th className="text-right py-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b text-sm">
                <td className="py-2">{payment.date}</td>
                <td className="text-right py-2">GHS {payment.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

