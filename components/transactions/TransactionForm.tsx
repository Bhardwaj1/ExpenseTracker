"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import type { Transaction } from "./TransactionsTab"

interface TransactionFormProps {
  transaction?: Transaction | null
  onSuccess: () => void
  onCancel: () => void
}

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Income",
  "Other",
]

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    type: transaction?.type || "expense",
    amount: transaction?.amount?.toString() || "",
    description: transaction?.description || "",
    category: transaction?.category || "",
    date: transaction?.date ? transaction.date.split("T")[0] : new Date().toISOString().split("T")[0],
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
        const payload = {
          ...formData,
          amount: Number.parseFloat(formData.amount),
        }

        if (transaction) {
          await apiClient.put(`/transactions/${transaction.id}`, payload)
          toast({
            title: "Success",
            description: "Transaction updated successfully",
          })
        } else {
          await apiClient.post("/transactions", payload)
          toast({
            title: "Success",
            description: "Transaction created successfully",
          })
        }

        onSuccess()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || "Failed to save transaction",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [formData, transaction, onSuccess, toast],
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{transaction ? "Edit Transaction" : "Add Transaction"}</CardTitle>
          <CardDescription>{transaction ? "Update transaction details" : "Enter transaction details"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as "income" | "expense" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Saving..." : transaction ? "Update" : "Create"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
