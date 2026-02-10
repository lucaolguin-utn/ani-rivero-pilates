import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProfilePage() {
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

  // Obtener suscripción activa del usuario
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      packages (
        name,
        classes_per_week,
        price
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  // Obtener suscripciones pasadas
  const { data: pastSubscriptions } = await supabase
    .from('subscriptions')
    .select(`
      *,
      packages (
        name,
        classes_per_week,
        price
      )
    `)
    .eq('user_id', user.id)
    .neq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Mi Perfil</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del miembro */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Información del miembro</h3>
          <p className="text-sm text-gray-600 mb-6">Detalles personales y de contacto</p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600">👤</span>
              </div>
              <div>
                <p className="font-semibold">{profile?.full_name}</p>
                <p className="text-sm text-gray-500">
                  Creado: {new Date(profile?.created_at || '').toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span>📧</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span>📱</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{profile?.phone || '-'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span>ℹ️</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className="inline-block mt-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Última membresía */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-1">Última membresía</h3>
          <p className="text-sm text-gray-600 mb-6">Información sobre la membresía y pagos</p>

          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de inicio</p>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <p className="font-medium">
                      {new Date(subscription.start_date).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Precio</p>
                  <p className="font-medium">${subscription.packages?.price || 'Pendiente'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de vencimiento</p>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <p className="font-medium">
                      {subscription.end_date 
                        ? new Date(subscription.end_date).toLocaleDateString('es-AR')
                        : 'Sin vencimiento'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha de pago</p>
                  <div className="flex items-center gap-2">
                    <span>📅</span>
                    <p className={`font-medium ${subscription.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                      {subscription.payment_date 
                        ? new Date(subscription.payment_date).toLocaleDateString('es-AR')
                        : 'Pendiente'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Estado</p>
                {subscription.payment_status === 'paid' ? (
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-md border border-green-300">
                    Pagado ✓
                    {subscription.late_fee_applied && <span className="ml-1 text-xs">(con recargo)</span>}
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-md border border-orange-300">
                    Pago pendiente
                  </span>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Actividades</p>
                <p className="font-medium">Pilates</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Pack</p>
                <p className="font-medium">{subscription.packages?.name || '-'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No tenés una membresía activa</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Activar membresía
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Membresías pasadas */}
      {pastSubscriptions && pastSubscriptions.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Membresías pasadas</h3>
          <div className="space-y-3">
            {pastSubscriptions.map((sub: any) => (
              <div key={sub.id} className="border rounded-lg p-4 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{sub.packages?.name}</p>
                    <p className="text-gray-600">
                      {new Date(sub.start_date).toLocaleDateString('es-AR')} - 
                      {sub.end_date ? new Date(sub.end_date).toLocaleDateString('es-AR') : 'Presente'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                    {sub.status === 'cancelled' ? 'Cancelada' : 
                     sub.status === 'paused' ? 'Pausada' : sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}