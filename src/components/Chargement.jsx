// Skeleton card — shimmer animated placeholder
function SkeletonCarte() {
  return (
    <div className="df-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div className="df-skeleton" style={{ height: '16px', width: '40%' }} />
        <div className="df-skeleton" style={{ height: '16px', width: '60px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', margin: '16px 0', padding: '12px 0', borderTop: '1px solid var(--df-border)', borderBottom: '1px solid var(--df-border)' }}>
        <div className="df-skeleton" style={{ height: '32px' }} />
        <div className="df-skeleton" style={{ height: '32px' }} />
        <div className="df-skeleton" style={{ height: '32px' }} />
      </div>
      <div className="df-skeleton" style={{ height: '12px', width: '66%', marginBottom: '8px' }} />
      <div className="df-skeleton" style={{ height: '12px', width: '50%' }} />
    </div>
  )
}

// Affiche N skeleton cards
function Chargement({ nombre = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {Array.from({ length: nombre }).map((_, i) => (
        <SkeletonCarte key={i} />
      ))}
    </div>
  )
}

export default Chargement