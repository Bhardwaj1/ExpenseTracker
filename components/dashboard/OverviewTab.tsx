"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TrendingUp, TrendingDown, DollarSign, CreditCard } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface OverviewData {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
  monthlyTrend: {
    month: string
    income: number
    expenses: number
  }[]
}

export default function OverviewTab() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        const response = await apiClient.get("/analytics/overview")
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch overview data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchOverviewData()
  }, [])

  const balanceColor = useMemo(() => {
    if (!data) return "text-gray-600"
    return data.balance >= 0 ? "text-green-600" : "text-red-600"
  }, [data])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load overview data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Financial Overview</h2>
        <p className="text-gray-600 dark:text-gray-400">Your financial summary at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</div>
            <p className="text-xs text-muted-foreground">All time income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
            <DollarSign className={`h-4 w-4 ${balanceColor}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balanceColor}`}>{formatCurrency(data.balance)}</div>
            <p className="text-xs text-muted-foreground">Current balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.transactionCount}</div>
            <p className="text-xs text-muted-foreground">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Recent transactions will appear here</p>
            <p className="text-sm mt-2">Add some transactions to see your activity</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
