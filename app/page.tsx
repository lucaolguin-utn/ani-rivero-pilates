import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  
  // Probar conexión obteniendo los paquetes
  const { data: packages, error } = await supabase
    .from('packages')
    .select('*')
    .eq('active', true)

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Ani Rivero Pilates</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Conexión con Supabase:</h2>
        {error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <p className="text-green-500">✓ Conectado exitosamente</p>
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Paquetes disponibles:</h2>
        <div className="grid gap-4">
          {packages?.map((pkg) => (
            <div key={pkg.id} className="border p-4 rounded-lg">
              <h3 className="font-bold">{pkg.name}</h3>
              <p>{pkg.classes_per_week} clases por semana</p>
              <p className="text-lg font-semibold">${pkg.price}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}