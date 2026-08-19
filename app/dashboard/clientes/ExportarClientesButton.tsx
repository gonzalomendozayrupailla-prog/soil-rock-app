'use client'

import { useState } from 'react'
import { IconDownload } from '@tabler/icons-react'

export default function ExportarClientesButton() {
  const [loading, setLoading] = useState(false)

  async function handleExportar() {
    setLoading(true)
    try {
      const res = await fetch('/api/clientes/exportar')
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Clientes_SoilRock.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExportar}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'transparent',
        color: '#004aad',
        padding: '7px 14px',
        borderRadius: 7,
        fontSize: 13,
        fontWeight: 500,
        border: '1px solid #004aad',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
      }}
    >
      <IconDownload size={14} />
      {loading ? 'Exportando...' : 'Descargar Excel'}
    </button>
  )
}
