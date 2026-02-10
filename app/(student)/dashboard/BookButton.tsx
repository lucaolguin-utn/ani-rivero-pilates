'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookButton({ 
  classId, 
  bookingId,
  isBooked 
}: { 
  classId: string
  bookingId?: string
  isBooked: boolean 
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleBook = async () => {
    setLoading(true)

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId })
    })

    const data = await response.json()

    if (response.ok) {
      alert('¡Reserva confirmada!')
      router.refresh()
    } else {
      alert(data.error || 'Error al reservar')
    }

    setLoading(false)
  }

  const handleCancel = async () => {
    if (!confirm('¿Estás segura que querés cancelar esta reserva?')) {
      return
    }

    setLoading(true)

    const response = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    })

    const data = await response.json()

    if (response.ok) {
      alert('Reserva cancelada')
      router.refresh()
    } else {
      alert(data.error || 'Error al cancelar')
    }

    setLoading(false)
  }

  if (isBooked) {
    return (
      <div className="flex gap-2">
        <span className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium">
          ✓ Reservado
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Cancelando...' : 'Cancelar'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleBook}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Reservando...' : 'Reservar'}
    </button>
  )
}