import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Verificar que sea admin
async function verifyAdmin(supabase: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return profile?.role === 'admin'
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!await verifyAdmin(supabase, user.id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const classData = await request.json()

  const { data, error } = await supabase
    .from('classes')
    .update({
      title: classData.title,
      description: classData.description,
      date: classData.date,
      start_time: classData.start_time,
      end_time: classData.end_time,
      max_capacity: classData.max_capacity,
      instructor_name: classData.instructor_name,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ class: data }, { status: 200 })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { id } = await params
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!await verifyAdmin(supabase, user.id)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Verificar si hay CUALQUIER booking asociado
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('class_id', id)

  if (count && count > 0) {
    // Si hay cualquier reserva, solo desactivar la clase    
    const { error } = await supabase
      .from('classes')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Clase desactivada. Tenía ${count} reserva(s) asociada(s).` 
    }, { status: 200 })
  }

  // Ahora sí eliminar la clase (sin reservas)
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Clase eliminada' }, { status: 200 })
}