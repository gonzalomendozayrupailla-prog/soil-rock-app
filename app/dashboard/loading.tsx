const shimmer: React.CSSProperties = {
  backgroundColor: '#e8eaed',
  borderRadius: 6,
  animation: 'skeleton-pulse 1.4s ease-in-out infinite',
}

export default function DashboardLoading() {
  return (
    <>
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ padding: 28 }}>
        {/* Título */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...shimmer, height: 20, width: 200, marginBottom: 8 }} />
          <div style={{ ...shimmer, height: 13, width: 140 }} />
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                backgroundColor: '#ffffff',
                border: '0.5px solid #e8eaed',
                borderRadius: 10,
                padding: 20,
              }}
            >
              <div style={{ ...shimmer, height: 11, width: 90, marginBottom: 14 }} />
              <div style={{ ...shimmer, height: 28, width: 120, marginBottom: 8 }} />
              <div style={{ ...shimmer, height: 11, width: 70 }} />
            </div>
          ))}
        </div>

        {/* Tabla placeholder */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '0.5px solid #e8eaed',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          {/* Cabecera tabla */}
          <div style={{ padding: '14px 20px', borderBottom: '0.5px solid #f4f6f8' }}>
            <div style={{ ...shimmer, height: 14, width: 160 }} />
          </div>
          {/* Filas */}
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                padding: '14px 20px',
                borderBottom: '0.5px solid #f4f6f8',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ ...shimmer, height: 13, width: 80, flexShrink: 0 }} />
              <div style={{ ...shimmer, height: 13, flex: 1 }} />
              <div style={{ ...shimmer, height: 13, width: 60, flexShrink: 0 }} />
              <div style={{ ...shimmer, height: 20, width: 72, flexShrink: 0, borderRadius: 20 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
