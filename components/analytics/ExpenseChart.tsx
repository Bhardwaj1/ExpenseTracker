"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ExpenseChartProps {
  data: {
    month: string
    income: number
    expenses: number
  }[]
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Expenses"]}
          labelStyle={{ color: "#374151" }}
          contentStyle={{
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
          }}
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
