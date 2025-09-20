// /api/day.js — API para leer/escribir en Redis (Upstash)
export const config = { runtime: "edge" };

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

async function kv(path, body) {
  const res = await fetch(`${url}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`KV error ${res.status}`);
  return res.json();
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // YYYY-MM-DD
    if (!date)
      return new Response(JSON.stringify({ error: "date required" }), {
        status: 400,
      });

    if (req.method === "GET") {
      // Leer viajes
      const r = await kv(`/get/planfletes:${date}`);
      const list = r?.result ? JSON.parse(r.result) : [];
      return Response.json({ date, list });
    }

    if (req.method === "PUT") {
      // Guardar viajes
      const { list } = await req.json();
      await kv(`/set/planfletes:${date}`, {
        value: JSON.stringify(list || []),
      });
      return Response.json({ ok: true });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}