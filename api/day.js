export const config = { runtime: "edge" }

const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN

async function kv(path, body) {
  const res = await fetch(`${url}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return res.json()
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get("date")

  if (!date) {
    return new Response(JSON.stringify({ error: "Missing date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (req.method === "POST") {
    const body = await req.json()
    await kv(`/set/planfletes:${date}`, { value: JSON.stringify(body) })
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    })
  }

  const data = await kv(`/get/planfletes:${date}`)
  return new Response(JSON.stringify({ date, list: data?.result ? JSON.parse(data.result) : [] }), {
    headers: { "Content-Type": "application/json" },
  })
}