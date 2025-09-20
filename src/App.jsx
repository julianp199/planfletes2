import React, { useEffect, useMemo, useState } from "react";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const LS_KEY = "freightPlanner.v1";

export default function App() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const dayList = useMemo(() => data[date] || [], [data, date]);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }, [data]);

  function setDayList(nextList) {
    setData((prev) => ({ ...prev, [date]: nextList }));
  }

  function addClientRow() {
    const item = {
      id: uid(),
      client: "",
      planned: 1,
      ticks: [false],
      notes: "",
    };
    setDayList([...dayList, item]);
  }

  function removeRow(id) {
    setDayList(dayList.filter((x) => x.id !== id));
  }

  function updateRow(id, patch) {
    setDayList(dayList.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  function setPlanned(id, planned) {
    planned = Math.max(0, Math.floor(Number(planned) || 0));
    setDayList(
      dayList.map((x) => {
        if (x.id !== id) return x;
        const ticks = [...x.ticks];
        if (planned > ticks.length) {
          while (ticks.length < planned) ticks.push(false);
        } else if (planned < ticks.length) {
          ticks.length = planned;
        }
        return { ...x, planned, ticks };
      })
    );
  }

  function toggleTick(id, idx) {
    setDayList(
      dayList.map((x) => {
        if (x.id !== id) return x;
        const ticks = x.ticks.map((t, i) => (i === idx ? !t : t));
        return { ...x, ticks };
      })
    );
  }

  function deliveredCount(item) {
    return item.ticks.filter(Boolean).length;
  }

  function remainingCount(item) {
    return Math.max(0, item.planned - deliveredCount(item));
  }

  const totals = useMemo(() => {
    const delivered = dayList.reduce((acc, it) => acc + deliveredCount(it), 0);
    const planned = dayList.reduce((acc, it) => acc + it.planned, 0);
    const remaining = Math.max(0, planned - delivered);
    return { planned, delivered, remaining };
  }, [dayList]);

  function exportCSV() {
    const headers = ["Fecha", "Cliente", "Planificados", "Entregados", "Pendientes", "Notas"];
    const rows = dayList.map((it) => [
      date,
      safeCSV(it.client),
      it.planned,
      deliveredCount(it),
      remainingCount(it),
      safeCSV(it.notes || ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plan-fletes_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function safeCSV(value) {
    if (value == null) return "";
    const s = String(value);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replaceAll('"', '""') + '"';
    }
    return s;
  }

  function duplicateFrom(dateFrom) {
    if (!data[dateFrom]) return;
    const clone = data[dateFrom].map((it) => ({
      ...it,
      id: uid(),
      ticks: Array.from({ length: it.planned }, () => false),
    }));
    setDayList(clone);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-bold">Planificador de Fletes</span>
            <span className="text-xs md:text-sm text-slate-500">MVP</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium">Fecha</label>
            <input
              type="date"
              className="px-3 py-2 border rounded-xl bg-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
              onClick={addClientRow}
            >
              + Cliente
            </button>
            <button
              className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
              onClick={exportCSV}
            >
              Exportar CSV
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard label="Planificados" value={totals.planned} />
            <SummaryCard label="Entregados" value={totals.delivered} />
            <SummaryCard label="Pendientes" value={totals.remaining} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <DuplicatePanel data={data} currentDate={date} onDuplicate={duplicateFrom} />
        </div>

        {dayList.length === 0 ? (
          <EmptyState onAdd={addClientRow} />
        ) : (
          <div className="space-y-4">
            {dayList.map((item) => (
              <ClientRow
                key={item.id}
                item={item}
                onRemove={() => removeRow(item.id)}
                onClient={(v) => updateRow(item.id, { client: v })}
                onNotes={(v) => updateRow(item.id, { notes: v })}
                onPlanned={(v) => setPlanned(item.id, v)}
                onToggle={(i) => toggleTick(item.id, i)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <div className="text-xl font-semibold mb-2">Sin clientes por hoy</div>
      <p className="text-slate-600 mb-6">
        Agregá tus clientes y definí cuántos viajes se planifican. Marcá cada envío con un ✓.
      </p>
      <button
        className="px-4 py-2 rounded-xl border bg-white hover:bg-slate-50"
        onClick={onAdd}
      >
        + Agregar cliente
      </button>
    </div>
  );
}

function ClientRow({ item, onRemove, onClient, onNotes, onPlanned, onToggle }) {
  const delivered = item.ticks.filter(Boolean).length;
  const remaining = Math.max(0, item.planned - delivered);

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <input
              className="w-full md:w-80 px-3 py-2 border rounded-xl"
              placeholder="Cliente (ej. Panedile)"
              value={item.client}
              onChange={(e) => onClient(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Planificados</label>
              <input
                type="number"
                min={0}
                className="w-24 px-3 py-2 border rounded-xl"
                value={item.planned}
                onChange={(e) => onPlanned(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-600">
              <span className="font-medium">Entregados:</span> {delivered} •{" "}
              <span className="font-medium">Pendientes:</span> {remaining}
            </div>
          </div>

          <textarea
            className="w-full px-3 py-2 border rounded-xl"
            placeholder="Notas (obra, materiales, patentes, restricción horaria, etc.)"
            value={item.notes}
            onChange={(e) => onNotes(e.target.value)}
          />
        </div>

        <button
          className="self-start md:self-auto px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
          onClick={onRemove}
          title="Eliminar cliente del día"
        >
          Eliminar
        </button>
      </div>

      <div className="mt-4">
        <div className="text-sm text-slate-600 mb-2">Marcá un ✓ por cada viaje enviado</div>
        <div className="flex flex-wrap gap-2">
          {item.ticks.length === 0 && (
            <span className="text-slate-400 text-sm">(sin viajes planificados)</span>
          )}
          {item.ticks.map((t, i) => (
            <label key={i} className="inline-flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={t}
                onChange={() => onToggle(i)}
              />
              <span>Viaje {i + 1}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DuplicatePanel({ data, currentDate, onDuplicate }) {
  const [from, setFrom] = useState("");
  const sameMonthDates = useMemo(() => {
    const prefix = currentDate.slice(0, 7);
    return Object.keys(data)
      .filter((d) => d.startsWith(prefix) && d !== currentDate)
      .sort()
      .reverse();
  }, [data, currentDate]);

  useEffect(() => {
    if (sameMonthDates.length > 0) setFrom(sameMonthDates[0]);
  }, [sameMonthDates]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-slate-600">Duplicar plan desde:</span>
      <select
        className="px-3 py-2 border rounded-xl bg-white"
        value={from}
        onChange={(e) => setFrom(e.target.value)}
      >
        <option value="">Seleccionar fecha…</option>
        {sameMonthDates.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <button
        className="px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-50"
        disabled={!from}
        onClick={() => from && onDuplicate(from)}
      >
        Duplicar
      </button>
    </div>
  );
}
