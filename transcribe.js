// pages/api/transcribe.js
// Verwerkt de audio upload en stuurt het naar Groq Whisper voor transcriptie.
// De GROQ_API_KEY staat veilig op de server — bezoekers zien hem nooit.

export const config = {
  api: {
    bodyParser: false, // We verwerken de FormData zelf via formidable
  },
};

import formidable from "formidable";
import fs from "fs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse het geüploade bestand
  const form = formidable({ maxFileSize: 25 * 1024 * 1024 }); // max 25MB

  let fields, files;
  try {
    [fields, files] = await form.parse(req);
  } catch (e) {
    return res.status(400).json({ error: "Bestand te groot of ongeldig (max 25MB)" });
  }

  const uploadedFile = files.file?.[0];
  if (!uploadedFile) {
    return res.status(400).json({ error: "Geen bestand ontvangen" });
  }

  // Stuur naar Groq Whisper API
  try {
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    const blob = new Blob([fileBuffer], { type: uploadedFile.mimetype || "audio/mpeg" });

    const formData = new FormData();
    formData.append("file", blob, uploadedFile.originalFilename || "audio.mp3");
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "text");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      console.error("Groq error:", err);
      return res.status(500).json({ error: "Transcriptie mislukt. Controleer je GROQ_API_KEY." });
    }

    const transcript = await groqRes.text();
    return res.status(200).json({ transcript });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  } finally {
    // Verwijder tijdelijk bestand
    if (uploadedFile?.filepath) {
      fs.unlink(uploadedFile.filepath, () => {});
    }
  }
}
