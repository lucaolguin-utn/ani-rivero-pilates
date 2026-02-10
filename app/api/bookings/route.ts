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

  // Verificar que la clase existe y está activa
  const { data: clase, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .eq('active', true)
    .single()

  if (classError || !clase) {
    return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
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