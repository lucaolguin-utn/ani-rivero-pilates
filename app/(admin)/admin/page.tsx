import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboard() {
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

  // Verificar que sea admin
  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener estadísticas
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  const { count: totalClasses } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('active', true)
    .gte('date', new Date().toISOString().split('T')[0])

  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  // Obtener próximas clases con cantidad de reservas
  const { data: upcomingClasses } = await supabase
    .from('classes')
    .select(`
      *,
      bookings(count)
    `)
    .eq('active', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Panel de Administración</h2>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Total Alumnos</h3>
            <p className="text-3xl font-bold mt-2">{totalStudents || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Clases Activas</h3>
            <p className="text-3xl font-bold mt-2">{totalClasses || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm font-medium">Reservas Totales</h3>
            <p className="text-3xl font-bold mt-2">{totalBookings || 0}</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Acciones rápidas</h3>
          <div className="flex gap-4">
            <Link 
              href="/admin/classes/new"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              + Nueva Clase
            </Link>
            <Link 
              href="/admin/students"
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Ver Alumnos
            </Link>
            <Link 
              href="/admin/subscriptions"
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Gestionar Suscripciones
            </Link>
          </div>
        </div>

        {/* Próximas clases */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Próximas clases</h3>
          <div className="space-y-4">
            {upcomingClasses && upcomingClasses.length > 0 ? (
              upcomingClasses.map((clase) => (
                <div key={clase.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{clase.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        📅 {new Date(clase.date).toLocaleDateString('es-AR')} - 
                        🕐 {clase.start_time} - {clase.end_time}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        👥 Reservas: {clase.bookings?.[0]?.count || 0} / {clase.max_capacity}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No hay clases programadas</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}