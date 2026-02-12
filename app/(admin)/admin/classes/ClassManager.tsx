'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { toast } from 'sonner'

interface Class {
  id: string
  title: string
  description: string
  date: string
  start_time: string
  end_time: string
  max_capacity: number
  instructor_name: string
  bookings: any[]
}

export default function ClassManager({ classes }: { classes: Class[] }) {
  const router = useRouter()
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    max_capacity: 10,
    instructor_name: 'Ani Rivero'
  })

  const handleEdit = (clase: Class) => {
    setEditingClass(clase)
    setFormData({
      title: clase.title,
      description: clase.description || '',
      date: clase.date,
      start_time: clase.start_time,
      end_time: clase.end_time,
      max_capacity: clase.max_capacity,
      instructor_name: clase.instructor_name
    })
  }

  const handleSave = async () => {
    if (!editingClass) return
    setLoading(true)

    const response = await fetch(`/api/admin/classes/${editingClass.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })

    if (response.ok) {
      toast.success('Clase actualizada con éxito')
      setEditingClass(null)
      router.refresh()
    } else {
      const data = await response.json()
      toast.error(data.error || 'Error al actualizar')
    }
    
    setLoading(false)
  }

  const handleDelete = async (classId: string) => {
    const result = await Swal.fire({
      title: 'Confirmar',
      text: '¿Segura que sedeas eliminar esta clase?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'No, volver'
    });

    if (!result.isConfirmed) {
      return;
    }

    setLoading(true)

    const response = await fetch(`/api/admin/classes/${classId}`, {
      method: 'DELETE'
    })

    const data = await response.json()

    if (response.ok) {
      toast.success('Clase eliminada con éxito'); 
      router.refresh()
    } else {
      toast.error(data.error || 'Error al eliminar la clase');
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4">
      {classes.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No hay clases activas</p>
          <a href="/admin/classes/new" className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block">
            Crear primera clase
          </a>
        </div>
      )}

      {classes.map((clase) => {
        const bookingCount = clase.bookings?.[0]?.count || 0
        const isEditing = editingClass?.id === clase.id

        return (
          <div key={clase.id} className="bg-white rounded-lg shadow p-6">
            {isEditing ? (
              // Modo edición
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Editando clase</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad máxima</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructora</label>
                    <input
                      type="text"
                      value={formData.instructor_name}
                      onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{clase.title}</h3>
                  {clase.description && (
                    <p className="text-sm text-gray-600 mt-1">{clase.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span>📅 {new Date(clase.date).toLocaleDateString('es-AR')}</span>
                    <span>🕐 {clase.start_time} - {clase.end_time}</span>
                    <span>👤 {clase.instructor_name}</span>
                    <span className={`font-medium ${bookingCount >= clase.max_capacity ? 'text-red-600' : 'text-green-600'}`}>
                      👥 {bookingCount} / {clase.max_capacity}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(clase)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDelete(clase.id)}
                    disabled={loading}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm disabled:opacity-50"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}