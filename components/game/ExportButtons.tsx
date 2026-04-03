'use client'

import { useState } from 'react'
import { GameArchive } from '@/lib/export'
import { exportAsJSON, exportAsTXT } from '@/lib/export'
import { Download, CheckCheck } from 'lucide-react'

interface ExportButtonsProps {
  archive: GameArchive
}

export default function ExportButtons({ archive }: ExportButtonsProps) {
  const [jsonDone, setJsonDone] = useState(false)
  const [txtDone, setTxtDone] = useState(false)

  const handleExportJSON = () => {
    exportAsJSON(archive)
    setJsonDone(true)
    setTimeout(() => setJsonDone(false), 2000)
  }

  const handleExportTXT = () => {
    exportAsTXT(archive)
    setTxtDone(true)
    setTimeout(() => setTxtDone(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportJSON}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-900/30 transition-all text-sm font-medium"
      >
        {jsonDone ? (
          <>
            <CheckCheck className="h-4 w-4 text-green-400" />
            <span className="text-green-400">已导出</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>📥 导出存档（JSON）</span>
          </>
        )}
      </button>
      <button
        onClick={handleExportTXT}
        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-indigo-400 text-indigo-400 hover:bg-indigo-900/30 transition-all text-sm font-medium"
      >
        {txtDone ? (
          <>
            <CheckCheck className="h-4 w-4 text-green-400" />
            <span className="text-green-400">已导出</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>📄 导出存档（TXT）</span>
          </>
        )}
      </button>
    </div>
  )
}
