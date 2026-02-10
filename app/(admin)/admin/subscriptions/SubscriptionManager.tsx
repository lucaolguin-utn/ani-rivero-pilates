'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  full_name: string
  email: string
  subscriptions: any[]
}

interface Package {
  id: string
  name: string
  classes_per_week: number
  price: number
}

export default function SubscriptionManager({ 
  students, 
  packages 
}: { 
  students: Student[]
  packages: Package[]
}) {
  const router = useRouter()
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const getActiveSubscription = (student: Student) => {
    return student.subscriptions?.find((sub: any) => sub.status === 'active')
  }

  const getPaymentStatus = (subscription: any) => {
    if (!subscription) return null
    
    const today = new Date()
    const startDate = new Date(subscription.start_date)
    const dayOfMonth = startDate.getDate()
    
    // Verificar si estamos después del día 10 del mes y aún no pagó
    if (today.getDate() > 10 && subscription.payment_status === 'pending') {
      return { status: 'late', message: 'Mora - 20% recargo', color: 'red' }
    }
    
    if (subscription.payment_status === 'paid') {
      return { status: 'paid', message: 'Pagado', color: 'green' }
    }
    
    return { status: 'pending', message: 'Pendiente', color: 'orange' }
  }

  const handleMarkAsPaid = async (subscriptionId: string, applyLateFee: boolean) => {
    setLoading(true)

    const response = await fetch('/api/subscriptions/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId,
        paymentDate: new Date().toISOString().split('T')[0],
        applyLateFee
      })
    })

    if (response.ok) {
      alert('Pago registrado correctamente')
      router.refresh()
    } else {
      alert('Error al registrar el pago')
    }

    setLoading(false)
  }

  const handleCreateSubscription = async (studentId: string, packageId: string) => {
  setLoading(true)

  const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        packageId,
        userId: studentId,  // ← Agregá esta línea
        startDate: new Date().toISOString().split('T')[0]
        })
    })

    if (response.ok) {
        alert('Suscripción creada correctamente')
        setSelectedStudent(null)
        router.refresh()
    } else {
        const data = await response.json()
        alert(data.error || 'Error al crear la suscripción')
    }

    setLoading(false)
    }

  return (
    <div className="space-y-4">
      {students.map((student) => {
        const activeSub = getActiveSubscription(student)
        const paymentStatus = getPaymentStatus(activeSub)

        return (
          <div key={student.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{student.full_name}</h3>
                <p className="text-sm text-gray-600">{student.email}</p>
                
                {activeSub ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Plan:</span>
                      <span className="text-sm">{activeSub.packages?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Período:</span>
                      <span className="text-sm">
                        {new Date(activeSub.start_date).toLocaleDateString('es-AR')} - 
                        {new Date(activeSub.end_date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Precio:</span>
                      <span className="text-sm">${activeSub.packages?.price}</span>
                      {paymentStatus?.status === 'late' && (
                        <span className="text-xs text-red-600 font-semibold">
                          (+20% = ${(activeSub.packages?.price * 1.2).toFixed(0)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Estado de pago:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${paymentStatus?.color}-100 text-${paymentStatus?.color}-800`}>
                        {paymentStatus?.message}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Sin suscripción activa</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                {activeSub && paymentStatus?.status !== 'paid' && (
                  <button
                    onClick={() => handleMarkAsPaid(activeSub.id, paymentStatus?.status === 'late')}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Marcar como Pagado
                  </button>
                )}
                
                {!activeSub && (
                  <div>
                    {selectedStudent === student.id ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Seleccionar plan:</p>
                        {packages.map((pkg) => (
                          <button
                            key={pkg.id}
                            onClick={() => handleCreateSubscription(student.id, pkg.id)}
                            disabled={loading}
                            className="block w-full text-left px-3 py-2 border rounded hover:bg-gray-50 text-sm disabled:opacity-50"
                          >
                            {pkg.name} - ${pkg.price}
                          </button>
                        ))}
                        <button
                          onClick={() => setSelectedStudent(null)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedStudent(student.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Activar Suscripción
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}