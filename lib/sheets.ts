import { google } from "googleapis"

export interface Job {
  job_id: string
  date: string
  customer_name: string
  technician: string
  service_type: string
  quote_amount: number
  status: string
  revenue: number
  margin: number
}

export async function fetchJobs(): Promise<Job[]> {
  const sheetId = process.env.GOOGLE_SHEET_ID
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!sheetId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing required environment variables: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY"
    )
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A:I",
  })

  const rows = response.data.values
  if (!rows || rows.length < 2) return []

  const headers = rows[0].map((h) => String(h).trim())
  const col = (name: string) => headers.indexOf(name)

  function str(row: unknown[], name: string): string {
    const i = col(name)
    return i === -1 ? "" : String(row[i] ?? "").trim()
  }

  function money(row: unknown[], name: string): number {
    const raw = str(row, name).replace(/[\$,\s]/g, "")
    return parseFloat(raw) || 0
  }

  return rows.slice(1).map((row) => ({
    job_id: str(row, "Job ID"),
    date: str(row, "Date"),
    customer_name: str(row, "Customer Name"),
    technician: str(row, "Technician"),
    service_type: str(row, "Service Type"),
    quote_amount: money(row, "Quote Amount"),
    status: str(row, "Status"),
    revenue: money(row, "Revenue"),
    margin: money(row, "Margin"),
  }))
}
