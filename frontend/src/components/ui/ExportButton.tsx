import { useState } from 'react'
import { exportToCsvApi, exportToPdfApi }
  from '../../api/transactionApi'
import { toast } from './Toast'

interface ExportButtonProps {
  from?: string
  to?: string
}

export default function ExportButton(
    { from, to }: ExportButtonProps) {
  const [loading, setLoading] = useState<'csv' | 'pdf' | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const downloadFile = (
      blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const handleExportCsv = async () => {
    setLoading('csv')
    setShowMenu(false)
    try {
      const res = await exportToCsvApi(from, to)
      const blob = new Blob([res.data], {
        type: 'text/csv' })
      downloadFile(blob,
        `transactions-${new Date()
          .toISOString().split('T')[0]}.csv`)
      toast.success('CSV downloaded successfully!')
    } catch {
      toast.error('Failed to export CSV')
    } finally {
      setLoading(null)
    }
  }

  const handleExportPdf = async () => {
    setLoading('pdf')
    setShowMenu(false)
    try {
      const res = await exportToPdfApi(from, to)
      const blob = new Blob([res.data], {
        type: 'application/pdf' })
      downloadFile(blob,
        `finance-report-${new Date()
          .toISOString().split('T')[0]}.pdf`)
      toast.success('PDF downloaded successfully!')
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading !== null}
        className="flex items-center gap-2 px-4 py-2
          border border-gray-200 dark:border-gray-700
          text-gray-700 dark:text-gray-300
          hover:bg-gray-50 dark:hover:bg-gray-800
          rounded-lg text-sm font-medium transition
          disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="btn-spinner
              !border-gray-400 !border-t-gray-700"/>
            Exporting...
          </>
        ) : (
          <>
            ⬇️ Export
          </>
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-11
            w-44 bg-white dark:bg-gray-900 border
            border-gray-200 dark:border-gray-700
            rounded-xl shadow-xl py-1 z-50">
            <button
              onClick={handleExportCsv}
              className="w-full flex items-center gap-3
                px-4 py-2.5 text-sm text-gray-700
                dark:text-gray-300 hover:bg-gray-50
                dark:hover:bg-gray-800 transition"
            >
              <span className="text-base">📊</span>
              <div className="text-left">
                <div className="font-medium">
                  Export CSV
                </div>
                <div className="text-xs
                  text-gray-400">
                  Open in Excel
                </div>
              </div>
            </button>
            <button
              onClick={handleExportPdf}
              className="w-full flex items-center gap-3
                px-4 py-2.5 text-sm text-gray-700
                dark:text-gray-300 hover:bg-gray-50
                dark:hover:bg-gray-800 transition"
            >
              <span className="text-base">📄</span>
              <div className="text-left">
                <div className="font-medium">
                  Export PDF
                </div>
                <div className="text-xs
                  text-gray-400">
                  Printable report
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  )
}