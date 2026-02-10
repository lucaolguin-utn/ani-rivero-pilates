import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { packageId, startDate, userId } = await request.json()

  // Si viene userId, verificar que quien hace la request sea admin
  let targetUserId = user.id
  
  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }
    
    targetUserId = userId
  }

  // Verificar que el paquete existe
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select('*')
    .eq('id', packageId)
    .eq('active', true)
    .single()

  if (pkgError || !pkg) {
    return NextResponse.json({ error: 'Paquete no encontrado' }, { status: 404 })
  }

  // Calcular fecha de vencimiento (mismo día del mes siguiente)
  const start = new Date(startDate)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  // Crear suscripción
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: targetUserId,
      package_id: packageId,
      status: 'active',
      start_date: startDate,
      end_date: end.toISOString().split('T')[0],
      payment_status: 'pending',
      payment_date: null,
      late_fee_applied: false,
      recoveries_used: 0,
      max_recoveries: 1
    })
    .select()
    .single()

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  return NextResponse.json({ subscription }, { status: 201 })
}