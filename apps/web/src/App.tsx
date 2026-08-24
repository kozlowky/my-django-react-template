import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    fetch('/api/health/')
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(() => setStatus('Error connecting to API'))
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <h1>🚀 Django + React Template</h1>
      <p>API Status: <strong>{status}</strong></p>
    </div>
  )
}

export default App
