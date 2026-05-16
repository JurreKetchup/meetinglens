// pages/api/summarize.js
// Ontvangt een transcript en vraagt Groq (Llama 3) om een gestructureerde samenvatting.
// Volledig gratis — zelfde GROQ_API_KEY als de transcriptie.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { transcript } = req.body;
  if (!transcript || transcript.trim().length < 10) {
    return res.status(400).json({ error: "Transcript is leeg of te kort" });
  }

  const prompt = `Je bent een professionele meeting-assistent. Analyseer het volgende meeting-transcript en geef een gestructureerde samenvatting terug.

TRANSCRIPT:
${transcript}

Geef je antwoord ALLEEN als geldig JSON in dit exacte formaat (geen markdown, geen uitleg, geen tekst ervoor of erna):
{
  "samenvatting": "Een beknopte samenvatting van de meeting in 2-4 zinnen.",
  "onderwerpen": [
    "Onderwerp 1",
    "Onderwerp 2",
    "Onderwerp 3"
  ],
  "actiepunten": [
    { "taak": "Beschrijving van de taak", "eigenaar": "Naam of Onbekend", "deadline": "Deadline of Niet opgegeven" }
  ]
}`;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "Je bent een professionele meeting-assistent. Je antwoordt altijd met alleen geldige JSON, zonder enige extra tekst, uitleg of markdown.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      console.error("Groq summarize error:", err);
      return res.status(500).json({ error: "Samenvatting mislukt. Controleer je GROQ_API_KEY." });
    }

    const data = await groqRes.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Kon de samenvatting niet verwerken: " + e.message });
  }
}
