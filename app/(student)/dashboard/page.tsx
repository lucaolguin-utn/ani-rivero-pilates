import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookButton from './BookButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Verificar suscripción activa
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Obtener clases disponibles
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('active', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  // Obtener reservas del usuario con información de la clase
  const { data: userBookingsRaw } = await supabase
    .from('bookings')
    .select('id, class_id, booked_at')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  // Obtener las clases de esas reservas
  let myBookings = null
  if (userBookingsRaw && userBookingsRaw.length > 0) {
    const classIds = userBookingsRaw.map(b => b.class_id)
    
    const { data: bookedClasses } = await supabase
      .from('classes')
      .select('*')
      .in('id', classIds)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    
    // Combinar bookings con classes
    myBookings = bookedClasses?.map(clase => {
      const booking = userBookingsRaw.find(b => b.class_id === clase.id)
      return {
        ...booking,
        classes: clase
      }
    })
  }

  // Obtener solo los IDs para la lógica de BookButton
  const { data: userBookings } = await supabase
    .from('bookings')
    .select('id, class_id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  const hasActiveSubscription = !!subscription
  const hasPayment = subscription?.payment_status === 'paid'

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Bienvenida a tu dashboard</h2>
        <p className="text-gray-600">
          Acá podés ver tus clases reservadas y reservar nuevas clases
        </p>
      </div>

      {/* Alertas de membresía */}
      {!hasActiveSubscription && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Sin membresía activa</h3>
          <p className="text-sm text-red-800">
            No tenés una membresía activa. Contactá al administrador para activar tu plan y poder reservar clases.
          </p>
        </div>
      )}

      {hasActiveSubscription && !hasPayment && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-orange-900 mb-2">💳 Cuota pendiente de pago</h3>
          <p className="text-sm text-orange-800 mb-2">
            Tu cuota está pendiente. <strong>Solo la cuota al día mantiene el lugar reservado.</strong>
          </p>
          <p className="text-sm text-orange-800">
            Período: {new Date(subscription.start_date).toLocaleDateString('es-AR')} - {new Date(subscription.end_date).toLocaleDateString('es-AR')}
          </p>
          <p className="text-sm text-orange-800">
            Plan: {subscription.packages?.name} - ${subscription.packages?.price}
          </p>
        </div>
      )}

      {hasActiveSubscription && hasPayment && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 mb-2">✅ Membresía activa</h3>
          <p className="text-sm text-green-800">
            Plan: {subscription.packages?.name} | 
            Válido hasta: {new Date(subscription.end_date).toLocaleDateString('es-AR')}
          </p>
        </div>
      )}

      {/* Mis Clases Reservadas */}
      {myBookings && myBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Mis Clases Reservadas</h3>
          <div className="space-y-4">
            {myBookings.map((booking: any) => (
              <div key={booking.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-bold">✓</span>
                      <h4 className="font-semibold text-lg">{booking.classes.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600 ml-6">{booking.classes.description}</p>
                    <div className="mt-2 text-sm text-gray-500 ml-6">
                      <p>📅 {new Date(booking.classes.date).toLocaleDateString('es-AR')}</p>
                      <p>🕐 {booking.classes.start_time} - {booking.classes.end_time}</p>
                      <p>👤 {booking.classes.instructor_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reservado el {new Date(booking.booked_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <BookButton 
                    classId={booking.classes.id} 
                    bookingId={booking.id}
                    isBooked={true} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clases Disponibles */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Clases disponibles para reservar</h3>
        
        {classes && classes.length > 0 ? (
          <div className="space-y-4">
            {classes.map((clase) => {
              const booking = userBookings?.find(b => b.class_id === clase.id)
              const isBooked = !!booking
              
              // No mostrar clases ya reservadas en esta sección
              if (isBooked) return null
              
              return (
                <div key={clase.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-lg">{clase.title}</h4>
                      <p className="text-sm text-gray-600">{clase.description}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <p>📅 {new Date(clase.date).toLocaleDateString('es-AR')}</p>
                        <p>🕐 {clase.start_time} - {clase.end_time}</p>
                        <p>👥 Cupos: {clase.max_capacity}</p>
                        <p>👤 {clase.instructor_name}</p>
                      </div>
                    </div>
                    <BookButton 
                      classId={clase.id} 
                      bookingId={booking?.id}
                      isBooked={isBooked} 
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500">No hay clases disponibles por el momento</p>
        )}
      </div>
    </div>
  )
}