import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { bookingId } = await request.json()

  // Obtener la reserva con los datos de la clase
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, classes(*)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })
  }

  // Verificar que sea con al menos 3 horas de anticipación
  const classDateTime = new Date(`${booking.classes.date}T${booking.classes.start_time}`)
  const now = new Date()
  const hoursUntilClass = (classDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)

  if (hoursUntilClass < 3) {
    return NextResponse.json({ 
      error: 'No podés cancelar con menos de 3 horas de anticipación' 
    }, { status: 400 })
  }

  // Cancelar la reserva
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({ 
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', bookingId)

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Reserva cancelada' }, { status: 200 })
}