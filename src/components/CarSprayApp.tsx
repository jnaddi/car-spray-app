"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Car, Users, Boxes, DollarSign, Plus, Trash2, Printer, Lock, LogOut, Edit, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { PaymentDialog } from "./payments/PaymentDialog"
import { PaymentHistory } from "./payments/PaymentHistory"

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

interface CarSprayAppProps {
  initialCustomers: Customer[]
  initialInventory: InventoryItem[]
  initialInvoices: Invoice[]
}

const CarSprayApp: React.FC<CarSprayAppProps> = ({
  initialCustomers,
  initialInventory: initialInventoryItems,
  initialInvoices,
}) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [loginError, setLoginError] = useState("")

  // Application state
  const [activeTab, setActiveTab] = useState("customers")
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  // Payment state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null)

  // Data state
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventoryItems)
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices)

  // Inventory state
  const [showNewItem, setShowNewItem] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [sortBy, setSortBy] = useState("name")

  const [newInvoiceServices, setNewInvoiceServices] = useState<Array<{ description: string; price: string }>>([
    { description: "", price: "" },
  ])

  const predefinedServices = ["Full body spray", "Scratch and Dent repair", "Body works", "Touch up respray"]

  // Login handlers
  const validCredentials = {
    username: "admin",
    password: "password123",
  }

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    if (username === validCredentials.username && password === validCredentials.password) {
      setIsAuthenticated(true)
      setLoginError("")
    } else {
      setLoginError("Invalid username or password")
    }
  }

  // Customer handlers
  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newCustomer = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      total_spent: 0,
      last_visit: new Date().toISOString().split("T")[0],
    }
    const { data, error } = await supabase.from("customers").insert([newCustomer]).select()
    if (error) {
      console.error("Error adding customer:", error)
      toast.error("Failed to add customer")
    } else {
      setCustomers([...customers, data[0]])
      setShowNewCustomer(false)
      toast.success("Customer added successfully")
    }
  }

  // Invoice handlers
  const handleAddInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const customerName = formData.get("customerName") as string

    try {
      // First, find or create the customer
      const { data: existingCustomers, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("name", customerName)
        .limit(1)

      if (customerError) throw customerError

      let customerId: number
      if (existingCustomers && existingCustomers.length > 0) {
        customerId = existingCustomers[0].id
      } else {
        const { data: newCustomer, error: newCustomerError } = await supabase
          .from("customers")
          .insert({ name: customerName })
          .select()

        if (newCustomerError) throw newCustomerError
        customerId = newCustomer[0].id
      }

      const services = newInvoiceServices
        .filter((service) => service.description && service.price)
        .map((service) => ({
          description: service.description,
          price: Number.parseFloat(service.price),
        }))

      const total = services.reduce((sum, service) => sum + service.price, 0)

      // Create the invoice
      const { data: invoiceData, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          customer_id: customerId,
          date: new Date().toISOString().split("T")[0],
          total,
          status: "Pending",
        })
        .select()

      if (invoiceError) throw invoiceError

      const invoiceId = invoiceData[0].id

      // Add services to the invoice
      const { error: servicesError } = await supabase
        .from("services")
        .insert(services.map((service) => ({ ...service, invoice_id: invoiceId })))

      if (servicesError) throw servicesError

      setShowNewInvoice(false)
      setNewInvoiceServices([{ description: "", price: "" }])
      fetchInvoices() // Refresh the invoices list
      toast.success("Invoice created successfully")
    } catch (error) {
      console.error("Error creating invoice:", error)
      toast.error("Failed to create invoice")
    }
  }

  const addServiceLine = () => {
    setNewInvoiceServices([...newInvoiceServices, { description: "", price: "" }])
  }

  const updateServiceLine = (index: number, field: "description" | "price", value: string) => {
    const updatedServices = [...newInvoiceServices]
    updatedServices[index][field] = value
    setNewInvoiceServices(updatedServices)
  }

  const removeServiceLine = (index: number) => {
    if (newInvoiceServices.length > 1) {
      setNewInvoiceServices(newInvoiceServices.filter((_, i) => i !== index))
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    toast.info("You have been logged out")
    router.push("/login")
  }

  // Inventory handlers
  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const newItem = {
      name: formData.get("name") as string,
      quantity: Number(formData.get("quantity")),
      unit: formData.get("unit") as string,
      category: formData.get("category") as string,
      threshold: Number(formData.get("threshold")),
    }
    const { data, error } = await supabase.from("inventory").insert([newItem]).select()
    if (error) {
      console.error("Error adding inventory item:", error)
      toast.error("Failed to add inventory item")
    } else {
      setInventory([...inventory, data[0]])
      setShowNewItem(false)
      toast.success("Inventory item added successfully")
    }
  }

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingItem) return

    const formData = new FormData(e.currentTarget)
    const updatedItem = {
      name: formData.get("name") as string,
      quantity: Number(formData.get("quantity")),
      unit: formData.get("unit") as string,
      category: formData.get("category") as string,
      threshold: Number(formData.get("threshold")),
    }
    const { data, error } = await supabase.from("inventory").update(updatedItem).eq("id", editingItem.id).select()
    if (error) {
      console.error("Error updating inventory item:", error)
      toast.error("Failed to update inventory item")
    } else {
      setInventory(inventory.map((item) => (item.id === editingItem.id ? data[0] : item)))
      setEditingItem(null)
      toast.success("Inventory item updated successfully")
    }
  }

  const handleDeleteItem = async (id: number) => {
    const { error } = await supabase.from("inventory").delete().eq("id", id)
    if (error) {
      console.error("Error deleting inventory item:", error)
      toast.error("Failed to delete inventory item")
    } else {
      setInventory(inventory.filter((item) => item.id !== id))
      toast.success("Inventory item deleted successfully")
    }
  }

  // Inventory filtering and sorting
  const filteredInventory = inventory
    .filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === "All" || item.category === categoryFilter),
    )
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "stock") return b.quantity - a.quantity
      return 0
    })

  const categories = ["All", ...new Set(inventory.map((item) => item.category))]

  const lowStockItems = inventory.filter((item) => item.quantity < item.threshold)

  // Fetch data from Supabase
  useEffect(() => {
    fetchCustomers()
    fetchInventory()
    fetchInvoices()
  }, [])

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("customers").select("*")
    if (error) {
      console.error("Error fetching customers:", error)
    } else {
      setCustomers(data || [])
    }
  }

  const fetchInventory = async () => {
    const { data, error } = await supabase.from("inventory").select("*")
    if (error) {
      console.error("Error fetching inventory:", error)
    } else {
      setInventory(data || [])
    }
  }

  const fetchInvoices = async () => {
    const { data, error } = await supabase.from("invoices").select(`
        *,
        customers (name),
        services (description, price)
      `)
    if (error) {
      console.error("Error fetching invoices:", error)
    } else {
      setInvoices(data || [])
    }
  }

  const router = useRouter()

  // Login page render
  if (!isAuthenticated) {
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" name="username" required placeholder="Enter your username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required placeholder="Enter your password" />
              </div>
              {loginError && <p className="text-sm text-red-600">{loginError}</p>}
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

  // Main application render
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4 flex items-center gap-2">
          <Car className="w-8 h-8" />
          <span className="font-bold text-lg">BURGER SPRAYING SHOP</span>
        </div>
        <nav className="mt-8">
          {[
            { key: "customers", icon: Users, label: "Customers" },
            { key: "inventory", icon: Boxes, label: "Inventory" },
            { key: "invoices", icon: DollarSign, label: "Invoices" },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800 transition-colors ${
                activeTab === key ? "bg-gray-800" : ""
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>
        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800 transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
            {activeTab === "customers" && (
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowNewCustomer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            )}
            {activeTab === "invoices" && (
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowNewInvoice(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
            {activeTab === "inventory" && (
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setShowNewItem(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>

          {/* Content Area */}
          <div className="grid gap-4">
            {/* Customers List */}
            {activeTab === "customers" && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <div
                        key={customer.id}
                        className="flex justify-between items-center p-4 bg-white rounded-lg shadow"
                      >
                        <div>
                          <h3 className="font-semibold">{customer.name}</h3>
                          <p className="text-sm text-gray-600">{customer.email}</p>
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Total Spent: GHS {customer.total_spent}</p>
                          <p className="text-sm text-gray-600">Last Visit: {customer.last_visit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Invoices List */}
            {activeTab === "invoices" && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center p-4 bg-white rounded-lg shadow"
                      >
                        <div>
                          <h3 className="font-semibold">{invoice.customers?.name}</h3>
                          <p className="text-sm text-gray-600">Date: {invoice.date}</p>
                          <p className="text-sm text-gray-600">
                            Status:{" "}
                            <span
                              className={
                                invoice.status === "Paid"
                                  ? "text-green-600"
                                  : invoice.status === "Partially Paid"
                                    ? "text-yellow-600"
                                    : "text-red-600"
                              }
                            >
                              {invoice.status}
                            </span>
                          </p>
                          {invoice.paid_amount > 0 && (
                            <p className="text-sm text-gray-600">Paid: GHS {invoice.paid_amount.toFixed(2)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">
                            {invoice.paid_amount < invoice.total && (
                              <span className="text-sm text-gray-600 block">
                                Remaining: GHS {(invoice.total - invoice.paid_amount).toFixed(2)}
                              </span>
                            )}
                            Total: GHS {invoice.total.toFixed(2)}
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceForPayment(invoice)
                              setShowPaymentDialog(true)
                            }}
                          >
                            Record Payment
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedInvoice(invoice)
                              setShowReceipt(true)
                            }}
                          >
                            <Printer className="w-4 h-4 mr-2" />
                            Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory List */}
            {activeTab === "inventory" && (
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Inventory Controls */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-2">
                        <Input
                          type="text"
                          placeholder="Search inventory..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-64"
                        />
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="stock">Stock Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Low Stock Alerts */}
                    {lowStockItems.length > 0 && (
                      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
                        <div className="flex items-center">
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          <p className="font-bold">Low Stock Alert</p>
                        </div>
                        <ul className="list-disc list-inside mt-2">
                          {lowStockItems.map((item) => (
                            <li key={item.id}>
                              {item.name}: {item.quantity} {item.unit} remaining
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Inventory Items */}
                    {filteredInventory.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} {item.unit}
                          </p>
                          <p className="text-sm text-gray-600">Category: {item.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Add Customer Dialog */}
          <Dialog open={showNewCustomer} onOpenChange={setShowNewCustomer}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Enter customer details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewCustomer(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    Add Customer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Create Invoice Dialog */}
          <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Create an invoice for a customer</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name</Label>
                  <Input id="customerName" name="customerName" required />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Services</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addServiceLine}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Service
                    </Button>
                  </div>
                  {newInvoiceServices.map((service, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2"
                        value={service.description}
                        onChange={(e) => updateServiceLine(index, "description", e.target.value)}
                      >
                        <option value="">Select a service</option>
                        {predefinedServices.map((service) => (
                          <option key={service} value={service}>
                            {service}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Price (GHS)"
                        value={service.price}
                        onChange={(e) => updateServiceLine(index, "price", e.target.value)}
                        className="w-32"
                      />
                      {newInvoiceServices.length > 1 && (
                        <Button type="button" variant="destructive" size="sm" onClick={() => removeServiceLine(index)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewInvoice(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    Create Invoice
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Inventory Item Dialog */}
          <Dialog open={showNewItem} onOpenChange={setShowNewItem}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>Enter item details below</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Item Name</Label>
                  <Input id="name" name="name" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" name="unit" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold">Low Stock Threshold</Label>
                  <Input id="threshold" name="threshold" type="number" required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowNewItem(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                    Add Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Inventory Item Dialog */}
          <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Inventory Item</DialogTitle>
                <DialogDescription>Update item details below</DialogDescription>
              </DialogHeader>
              {editingItem && (
                <form onSubmit={handleEditItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input id="name" name="name" defaultValue={editingItem.name} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" defaultValue={editingItem.quantity} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Input id="unit" name="unit" defaultValue={editingItem.unit} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" defaultValue={editingItem.category} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Low Stock Threshold</Label>
                    <Input
                      id="threshold"
                      name="threshold"
                      type="number"
                      defaultValue={editingItem.threshold}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                      Update Item
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Receipt Dialog */}
          <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Receipt</DialogTitle>
              </DialogHeader>
              {selectedInvoice && (
                <div className="bg-white p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold">BURGER SPRAYING SHOP</h2>
                    <p className="text-gray-600">Quality, Customer Service, Affordability</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="font-bold">Receipt #{selectedInvoice.id}</h3>
                    <p>Date: {selectedInvoice.date}</p>
                    <p>Customer: {selectedInvoice.customers.name}</p>
                  </div>

                  <table className="w-full mb-6">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Service</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.services.map((service, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2">{service.description}</td>
                          <td className="text-right py-2">GHS {service.price.toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr className="font-bold">
                        <td className="py-2">Total</td>
                        <td className="text-right py-2">GHS {selectedInvoice.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Add this after the receipt table */}
                  <div className="mt-8">
                    <PaymentHistory invoiceId={selectedInvoice.id} />
                  </div>

                  <div className="text-center text-sm text-gray-600 mt-8">
                    <p>Thank you for your business!</p>
                    <p>Contact: (233) 244 363 049</p>
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700 text-white">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Receipt
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Add these components before the closing return statement */}
      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        invoice={selectedInvoiceForPayment}
        onPaymentAdded={() => {
          fetchInvoices()
          setShowPaymentDialog(false)
        }}
      />

      {/* Toast Container for notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  )
}

export default CarSprayApp

