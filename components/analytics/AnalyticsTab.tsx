"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ExpenseChart } from "./ExpenseChart"
import { IncomeVsExpenseChart } from "./IncomeVsExpenseChart"
import { CategoryChart } from "./CategoryChart"

interface AnalyticsData {
  monthlyTrends: {
    month: string
    income: number
    expenses: number
  }[]
  categoryBreakdown: {
    category: string
    amount: number
    percentage: number
  }[]
  yearlyComparison: {
    year: number
    income: number
    expenses: number
  }[]
}

export default function AnalyticsTab() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState("12months")

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get("/analytics/detailed", {
          params: { timeRange },
        })
        setData(response.data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [timeRange])

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
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Detailed insights into your financial patterns</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">Last 3 months</SelectItem>
            <SelectItem value="6months">Last 6 months</SelectItem>
            <SelectItem value="12months">Last 12 months</SelectItem>
            <SelectItem value="2years">Last 2 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Monthly comparison of your income and expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeVsExpenseChart data={data.monthlyTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown of expenses by category</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryChart data={data.categoryBreakdown} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Trends</CardTitle>
          <CardDescription>Track your spending patterns over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseChart data={data.monthlyTrends} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.categoryBreakdown.slice(0, 3).map((category) => (
          <Card key={category.category}>
            <CardHeader>
              <CardTitle className="text-lg">{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${category.amount.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{category.percentage.toFixed(1)}% of total expenses</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
