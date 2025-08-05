"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TransactionForm } from "./TransactionForm"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/contexts/AuthContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, Search, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface Transaction {
  id: string
  type: "income" | "expense"
  amount: number
  description: string
  category: string
  date: string
  createdAt: string
}

export default function TransactionsTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const { hasPermission } = useAuth()
  const { toast } = useToast()

  const canWrite = hasPermission("write")

  const fetchTransactions = useCallback(
    async (page = 1, search = "") => {
      try {
        setLoading(true)
        const response = await apiClient.get("/transactions", {
          params: { page, limit: 10, search },
        })
        setTransactions(response.data.transactions)
        setTotalPages(response.data.totalPages)
        setCurrentPage(page)
      } catch (error) {
        console.error("Failed to fetch transactions:", error)
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    fetchTransactions(1, searchTerm)
  }, [fetchTransactions, searchTerm])

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleDelete = useCallback(
    async (id: string) => {
      if (!canWrite) return

      try {
        await apiClient.delete(`/transactions/${id}`)
        toast({
          title: "Success",
          description: "Transaction deleted successfully",
        })
        fetchTransactions(currentPage, searchTerm)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete transaction",
          variant: "destructive",
        })
      }
    },
    [canWrite, currentPage, searchTerm, fetchTransactions, toast],
  )

  const handleEdit = useCallback(
    (transaction: Transaction) => {
      if (!canWrite) return
      setEditingTransaction(transaction)
      setShowForm(true)
    },
    [canWrite],
  )

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setEditingTransaction(null)
    fetchTransactions(currentPage, searchTerm)
  }, [currentPage, searchTerm, fetchTransactions])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [transactions, searchTerm])

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Transactions</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage your income and expenses</p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Transactions</CardTitle>
          <CardDescription>Find transactions by description or category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>{filteredTransactions.length} transaction(s) found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transactions found</p>
              {canWrite && (
                <Button variant="outline" className="mt-4 bg-transparent" onClick={() => setShowForm(true)}>
                  Add your first transaction
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={transaction.type === "income" ? "default" : "destructive"}>
                        {transaction.type}
                      </Badge>
                      <span className="font-medium">{transaction.description}</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {transaction.category} • {formatDate(transaction.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-lg font-semibold ${
                        transaction.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </span>
                    {canWrite && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(transaction.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => fetchTransactions(currentPage - 1, searchTerm)}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => fetchTransactions(currentPage + 1, searchTerm)}
          >
            Next
          </Button>
        </div>
      )}

      {showForm && (
        <TransactionForm
          transaction={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
        />
      )}
    </div>
  )
}
