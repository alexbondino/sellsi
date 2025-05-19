import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TestSupabase from './services/test-supabase'

function App() {
  return (
    <>
      <div>
        <h1>This is sellsi</h1>
        <TestSupabase />
      </div>
    </>
  )
}

export default App