import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const classData = await request.json()

  // Crear la clase
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert({
      title: classData.title,
      description: classData.description,
      date: classData.date,
      start_time: classData.start_time,
      end_time: classData.end_time,
      max_capacity: classData.max_capacity,
      instructor_name: classData.instructor_name,
      active: true
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ class: newClass }, { status: 201 })
}