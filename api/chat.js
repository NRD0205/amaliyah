export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Ambil semua API key yang tersedia (bisa tambah GROQ_API_KEY_2, _3, dst)
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean); // hapus yang kosong

  const { messages, system } = req.body;

  // Coba satu per satu key sampai berhasil
  for (const key of keys) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          max_tokens: 1000,
          temperature: 0.7,
          messages: [
            { role: "system", content: system },
            ...messages
          ]
        })
      });

      const data = await response.json();

      // Kalau kena rate limit, coba key berikutnya
      if (data.error?.message?.includes("rate_limit") || 
          data.error?.message?.includes("Rate limit")) {
        continue;
      }

      if (data.error) throw new Error(data.error.message);

      const text = data.choices?.[0]?.message?.content || "Maaf, tidak ada respons.";
      return res.status(200).json({
        content: [{ type: "text", text }]
      });

    } catch (error) {
      // Kalau ini key terakhir, kembalikan error
      if (key === keys[keys.length - 1]) {
        return res.status(500).json({ error: { message: error.message } });
      }
      // Kalau masih ada key lain, lanjut coba
      continue;
    }
  }

  // Semua key kena rate limit
  return res.status(429).json({ 
    error: { message: "Semua server sedang sibuk. Tunggu beberapa detik lalu coba lagi. 🙏" }
  });
}