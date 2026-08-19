'use client'

import { useState, useEffect } from 'react'

export default function LoginPage() {
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const e = params.get('error')
    if (e === 'no_access')       setError('No tienes acceso. Contacta al administrador.')
    else if (e === 'google_denied') setError('Acceso con Google cancelado.')
    else if (e)                  setError('Error al iniciar sesión con Google. Intenta de nuevo.')
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' }}>
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: 16, padding: '40px 36px 36px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Soil Rock" style={{ width: 180, height: 'auto', display: 'block', margin: '0 auto 28px' }} />
        <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px', textAlign: 'center' }}>Ingresa con tu cuenta Google para continuar</p>

        <button
          type="button"
          onClick={() => { window.location.href = '/api/auth/google' }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px 0', backgroundColor: '#ffffff', color: '#1a1d1e',
            border: '1px solid #dadce0', borderRadius: 8, cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        {error && (
          <p style={{ fontSize: 13, color: '#a32d2d', margin: '16px 0 0', textAlign: 'center' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
