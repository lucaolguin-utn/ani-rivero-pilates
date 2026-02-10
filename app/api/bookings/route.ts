import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { classId } = await request.json()

  // NUEVO: Verificar que tenga suscripción activa y pagada
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, packages(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (!subscription) {
    return NextResponse.json({ 
      error: 'No tenés una membresía activa. Contactá al administrador para activar tu plan.' 
    }, { status: 400 })
  }

  if (subscription.payment_status !== 'paid') {
    return NextResponse.json({ 
      error: 'Tu cuota está pendiente de pago. Solo la cuota al día mantiene el lugar reservado.' 
    }, { status: 400 })
  }

  // Verificar que la clase esté dentro del período de suscripción
  const { data: clase, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('active', true)
    .single()

  if (classError || !clase) {
    return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
  }

  const classDate = new Date(clase.date)
  const subStart = new Date(subscription.start_date)
  const subEnd = new Date(subscription.end_date)

  if (classDate < subStart || classDate > subEnd) {
    return NextResponse.json({ 
      error: 'Esta clase está fuera del período de tu membresía actual.' 
    }, { status: 400 })
  }

  // Verificar cupo disponible
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', classId)
    .eq('status', 'confirmed')

  if (count && count >= clase.max_capacity) {
    return NextResponse.json({ error: 'No hay cupo disponible' }, { status: 400 })
  }

  // Verificar que el usuario no tenga ya una reserva para esta clase
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('class_id', classId)
    .eq('user_id', user.id)
    .single()

  if (existingBooking) {
    return NextResponse.json({ error: 'Ya tenés una reserva para esta clase' }, { status: 400 })
  }

  // Crear la reserva
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      class_id: classId,
      user_id: user.id,
      status: 'confirmed'
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  return NextResponse.json({ booking }, { status: 201 })
}