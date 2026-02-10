import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NewClassForm from './NewClassForm'

export default async function NewClassPage() {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Crear Nueva Clase</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <NewClassForm />
        </div>
      </main>
    </div>
  )
}