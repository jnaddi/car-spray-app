"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "react-toastify"

interface Invoice {
  id: number
  total: number
  paid_amount: number
  status: string
  customers: {
    name: string
  }
}

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: Invoice | null
  onPaymentAdded: () => void
}

export function PaymentDialog({ open, onOpenChange, invoice, onPaymentAdded }: PaymentDialogProps) {
  const [amount, setAmount] = React.useState("")

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice || !amount) return

    const paymentAmount = Number.parseFloat(amount)
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid payment amount")
      return
    }

    const remainingAmount = invoice.total - (invoice.paid_amount || 0)
    if (paymentAmount > remainingAmount) {
      toast.error("Payment amount cannot exceed the remaining balance")
      return
    }

    try {
      const newPaidAmount = (invoice.paid_amount || 0) + paymentAmount
      const newStatus = newPaidAmount >= invoice.total ? "Paid" : "Partially Paid"

      // Update invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          paid_amount: newPaidAmount,
          status: newStatus,
        })
        .eq("id", invoice.id)

      if (invoiceError) throw invoiceError

      // Record payment
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount: paymentAmount,
        date: new Date().toISOString().split("T")[0],
      })

      if (paymentError) throw paymentError

      toast.success("Payment recorded successfully")
      onPaymentAdded()
      setAmount("")
    } catch (error) {
      console.error("Error recording payment:", error)
      toast.error("Failed to record payment")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        {invoice && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="font-medium">{invoice.customers?.name}</div>
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="font-medium">GHS {invoice.total.toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <Label>Remaining Balance</Label>
                <div className="font-medium">GHS {(invoice.total - (invoice.paid_amount || 0)).toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

