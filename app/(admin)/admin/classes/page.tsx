import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ClassManager from './ClassManager'

export default async function AdminClassesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Obtener clases con cantidad de reservas
  const { data: classes } = await supabase
    .from('classes')
    .select(`
      *,
      bookings(count)
    `)
    .eq('active', true)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Clases</h2>
          <p className="text-gray-600 mt-1">Editá, eliminá o creá nuevas clases</p>
        </div>
        <a
          href="/admin/classes/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"        >
          Nueva Clase
        </a>
      </div>

      <ClassManager classes={classes || []} />
    </div>
  )
}