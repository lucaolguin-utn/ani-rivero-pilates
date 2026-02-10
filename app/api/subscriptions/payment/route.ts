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

  const { subscriptionId, paymentDate, applyLateFee } = await request.json()

  // Actualizar estado de pago
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .update({
      payment_status: 'paid',
      payment_date: paymentDate,
      late_fee_applied: applyLateFee || false
    })
    .eq('id', subscriptionId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ subscription }, { status: 200 })
}