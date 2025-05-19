// src/services/test-supabase.jsx
import { useEffect, useState } from 'react'
import { supabase } from './supabase' // Asegúrate que la ruta es correcta

function TestSupabase() {
  const [clientes, setClientes] = useState([])

  useEffect(() => {
    const fetchClientes = async () => {
      const { data, error } = await supabase.from('usuarios').select('*')

      if (error) {
        console.error('❌ Error al obtener clientes:', error)
      } else {
        setClientes(data)
      }
    }

    fetchClientes()
  }, [])

  return (
    <div>
      <h2>Clientes desde Supabase</h2>
      {clientes.length === 0 ? (
        <p>No hay clientes disponibles.</p>
      ) : (
        <ul>
          {clientes.map((cliente) => (
            <li key={cliente.id}>
              {cliente.nombre} - {cliente.correo}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TestSupabase
