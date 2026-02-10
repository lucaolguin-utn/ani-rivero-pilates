import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscriptionManager from './SubscriptionManager'

export default async function SubscriptionsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener todos los alumnos con sus suscripciones
  const { data: students } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (
        *,
        packages (
          name,
          classes_per_week,
          price
        )
      )
    `)
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  // Obtener paquetes disponibles
  const { data: packages } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)
    .order('classes_per_week', { ascending: true })

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Gestión de Suscripciones y Pagos</h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">📋 Reglas de Pago</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Pagos del 1 al 10 de cada mes</li>
          <li>• Después del día 10: 20% de recargo automático</li>
          <li>• Fecha de vencimiento: mismo día que ingresó (ej: ingresó el 5, vence el 5)</li>
          <li>• Solo cuota al día mantiene el lugar reservado</li>
        </ul>
      </div>

      <SubscriptionManager students={students || []} packages={packages || []} />
    </div>
  )
}