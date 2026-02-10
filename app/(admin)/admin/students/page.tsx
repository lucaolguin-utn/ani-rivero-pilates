import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentsPage() {
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

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener todos los alumnos
  const { data: students } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  // Obtener próximas clases con sus reservas
  const { data: classesWithBookings } = await supabase
    .from('classes')
    .select(`
      *,
      bookings!inner(
        id,
        status,
        user_id,
        profiles(full_name, email, phone)
      )
    `)
    .eq('active', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .eq('bookings.status', 'confirmed')
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Panel de Administración</h1>
            <a href="/admin" className="text-blue-600 hover:text-blue-500">
              ← Volver al dashboard
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Gestión de Alumnos</h2>

        {/* Lista de todos los alumnos */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">
            Todos los alumnos ({students?.length || 0})
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students?.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.phone || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alumnos por clase */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Alumnos inscritos por clase</h3>
          
          {classesWithBookings && classesWithBookings.length > 0 ? (
            <div className="space-y-6">
              {classesWithBookings.map((clase) => (
                <div key={clase.id} className="border rounded-lg p-4">
                  <div className="mb-3">
                    <h4 className="font-semibold text-lg">{clase.title}</h4>
                    <p className="text-sm text-gray-600">
                      📅 {new Date(clase.date).toLocaleDateString('es-AR')} - 
                      🕐 {clase.start_time} - {clase.end_time}
                    </p>
                    <p className="text-sm text-gray-500">
                      👥 {clase.bookings?.length || 0} / {clase.max_capacity} inscriptos
                    </p>
                  </div>
                  
                  {clase.bookings && clase.bookings.length > 0 ? (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Alumnos inscriptos:</p>
                      <ul className="space-y-1">
                        {clase.bookings.map((booking: any) => (
                          <li key={booking.id} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {booking.profiles?.full_name} - {booking.profiles?.email}
                            {booking.profiles?.phone && ` - ${booking.profiles.phone}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No hay alumnos inscriptos todavía</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay clases con inscripciones</p>
          )}
        </div>
      </main>
    </div>
  )
}