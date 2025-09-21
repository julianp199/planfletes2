import React, { useState, useEffect } from 'react'

export default function App() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [list, setList] = useState([])
  const [newClient, setNewClient] = useState("")

  async function loadData() {
    const res = await fetch(`/api/day?date=${date}`)
    const data = await res.json()
    setList(data.list || [])
  }

  async function saveData(newList) {
    await fetch(`/api/day?date=${date}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newList)
    })
    setList(newList)
  }

  function addClient() {
    if (!newClient) return
    const newList = [...list, { name: newClient, done: false }]
    saveData(newList)
    setNewClient("")
  }

  function toggleDone(index) {
    const newList = [...list]
    newList[index].done = !newList[index].done
    saveData(newList)
  }

  useEffect(() => { loadData() }, [date])

  return (
    <div style={{ padding: 20 }}>
      <h1>Planificador de Fletes</h1>
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <div>
        <input
          value={newClient}
          onChange={e => setNewClient(e.target.value)}
          placeholder="Nuevo cliente"
        />
        <button onClick={addClient}>Agregar</button>
      </div>
      <ul>
        {list.map((c, i) => (
          <li key={i}>
            <input type="checkbox" checked={c.done} onChange={() => toggleDone(i)} />
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  )
}