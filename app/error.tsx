'use client'

import Link from 'next/link'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      padding: 24,
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="Soil Rock" style={{ height: 36, width: 'auto', marginBottom: 40 }} />

      <div style={{ fontSize: 72, fontWeight: 700, color: '#004aad', lineHeight: 1, marginBottom: 16 }}>
        500
      </div>

      <h1 style={{ fontSize: 16, fontWeight: 600, color: '#1a1d1e', margin: '0 0 8px', textAlign: 'center' }}>
        Ocurrió un error
      </h1>
      <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 32px', textAlign: 'center', maxWidth: 320 }}>
        Algo salió mal. Puedes reintentar o volver al inicio.
      </p>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            padding: '9px 20px',
            backgroundColor: 'transparent',
            color: '#004aad',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 7,
            border: '1px solid #004aad',
            cursor: 'pointer',
          }}
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '9px 20px',
            backgroundColor: '#004aad',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 7,
            textDecoration: 'none',
          }}
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
