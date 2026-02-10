import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex-shrink-0">
        <Sidebar 
          userRole={profile?.role || 'student'} 
          userName={profile?.full_name || 'Usuario'} 
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  )
}