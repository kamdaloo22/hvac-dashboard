"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowUpDown } from "lucide-react"

export interface QuoteRow {
  job_id: string
  customer_name: string
  technician: string
  service_type: string
  quote_amount: number
  date: string
  daysSince: number
}

export function OpenQuotesTable({ quotes }: { quotes: QuoteRow[] }) {
  const [asc, setAsc] = useState(false)

  const sorted = [...quotes].sort((a, b) =>
    asc ? a.daysSince - b.daysSince : b.daysSince - a.daysSince
  )

  if (sorted.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400">No open quotes</p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Technician</TableHead>
          <TableHead>Service</TableHead>
          <TableHead className="text-right">Quote Amount</TableHead>
          <TableHead
            className="text-right cursor-pointer select-none"
            onClick={() => setAsc((v) => !v)}
          >
            <span className="inline-flex items-center gap-1">
              Days Since Quoted
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            </span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((q) => (
          <TableRow key={q.job_id || q.customer_name + q.date}>
            <TableCell className="font-medium">{q.customer_name}</TableCell>
            <TableCell className="text-slate-600">{q.technician}</TableCell>
            <TableCell className="text-slate-600">{q.service_type}</TableCell>
            <TableCell className="text-right font-mono">
              ${q.quote_amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </TableCell>
            <TableCell className="text-right">
              <Badge
                variant={q.daysSince > 14 ? "destructive" : "secondary"}
                className="ml-auto"
              >
                {q.daysSince}d
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
