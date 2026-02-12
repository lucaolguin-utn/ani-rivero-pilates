'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Swal from 'sweetalert2'

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

    if (response.ok) {
      toast.success('Clase reservada con éxito'); 
      router.refresh()
    } else {
      const data = await response.json();
      toast.error(data.error || 'Error al reservar la clase');
      setLoading(false);
    }

    setLoading(false)
  }

  const handleCancel = async () => {
    const result = await Swal.fire({
      title: '¿Estás segura?',
      text: '¿Querés cancelar esta reserva?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, cancelar',
      cancelButtonText: 'No, volver'
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true)

    const response = await fetch('/api/bookings/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId })
    })

    const data = await response.json()

    if (response.ok) {
      toast.success('Reserva cancelada con éxito'); 
      router.refresh()
    } else {
      toast.error(data.error || 'Error al cancelar la reserva');
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