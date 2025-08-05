"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts"

interface IncomeVsExpenseChartProps {
  data: {
    month: string
    income: number
    expenses: number
  }[]
}

export function IncomeVsExpenseChart({ data }: IncomeVsExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number, name: string) => [
            `$${value.toFixed(2)}`,
            name === "income" ? "Income" : "Expenses",
          ]}
          labelStyle={{ color: "#374151" }}
          contentStyle={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Legend />
        <Bar dataKey="income" fill="#10b981" name="Income" radius={[2, 2, 0, 0]} />
        <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
