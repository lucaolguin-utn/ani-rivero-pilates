import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookButton from './BookButton'

export default async function DashboardPage() {
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

  // Obtener clases disponibles
  const { data: classes } = await supabase
    .from('classes')
    .select('*')
    .eq('active', true)
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

    // Obtener reservas del usuario
    const { data: userBookings } = await supabase
    .from('bookings')
    .select('id, class_id')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  const bookedClassIds = userBookings?.map(b => b.class_id) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-xl font-bold">Ani Rivero Pilates</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Hola, {profile?.full_name}
              </span>
              <form action="/api/auth/logout" method="POST">
                <button className="text-sm text-blue-600 hover:text-blue-500">
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Bienvenida a tu dashboard</h2>
          <p className="text-gray-600">
            Acá podés ver y reservar las clases disponibles
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Próximas clases</h3>
          
          {classes && classes.length > 0 ? (
            <div className="space-y-4">
              {classes.map((clase) => {
                const booking = userBookings?.find(b => b.class_id === clase.id)
                const isBooked = !!booking
                
                return (
                    <div key={clase.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold text-lg">{clase.title}</h4>
                                <p className="text-sm text-gray-600">{clase.description}</p>
                                <div className="mt-2 text-sm text-gray-500">
                                    <p>📅 {new Date(clase.date).toLocaleDateString('es-AR')}</p>
                                    <p>🕐 {clase.start_time} - {clase.end_time}</p>
                                    <p>👥 Cupos: {clase.max_capacity}</p>
                                    <p>👤 {clase.instructor_name}</p>
                                </div>
                            </div>
                            <BookButton 
                            classId={clase.id} 
                            bookingId={booking?.id}
                            isBooked={isBooked} 
                            />
                        </div>
                    </div>
                )
                })}
            </div>
          ) : (
            <p className="text-gray-500">No hay clases disponibles por el momento</p>
          )}
        </div>
      </main>
    </div>
  )
}