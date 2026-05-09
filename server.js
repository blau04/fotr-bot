const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ============================================================
// CONFIGURATION — paste your values here
// ============================================================
const CONFIG = {
  PAGE_ACCESS_TOKEN: process.env.PAGE_ACCESS_TOKEN || "PASTE_YOUR_PAGE_ACCESS_TOKEN_HERE",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "PASTE_YOUR_ANTHROPIC_API_KEY_HERE",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "fotr_verify_2026",
  PAGE_ID: process.env.PAGE_ID || "100553482651771",
};

// ============================================================
// FRIENDS ON THE RUN — Knowledge Base
// ============================================================
const KNOWLEDGE = `
Eres el asistente virtual de "Friends on the Run" (FOTR), un run club en Panamá.
Responde SIEMPRE en el idioma en que te escriben — español por defecto, inglés si te escriben en inglés.
Sé amigable, energético y conciso (máximo 3-4 oraciones por respuesta). Usa 1 emoji máximo.

INFORMACIÓN DEL RUN CLUB:

📍 PUNTO DE ENCUENTRO (MIÉRCOLES):
- Día y hora: Todos los miércoles a las 7:00 PM
- Ubicación: Estacionamiento del Hotel InterContinental Miramar, La Cinta Costera, Ciudad de Panamá
- Link exacto del punto de encuentro: https://maps.app.goo.gl/5r4SmfkQefYmaeb98
- A las 7:30 PM terminamos el calentamiento y salimos a correr

🏃 GRUPOS Y NIVELES:
1. Avanzado — ritmo 4:00–5:00 min/km
2. Intermedio — ritmo 5:00–6:00 min/km
3. Grupo run/walk — alternamos correr y caminar
4. Grupo caminata — solo caminar
Hay un nivel para cada persona, desde principiantes hasta atletas avanzados.

✅ REQUISITOS PARA UNIRSE:
- No hay requisitos. Solo tienes que presentarte listo/a para correr o caminar.
- No necesitas registrarte ni traer nada especial.

📅 SÁBADOS:
- Los entrenamientos del sábado varían en horario y ubicación según el programa de entrenamiento de esa semana
- Todos los lunes subimos el flyer semanal con las actividades de la semana
- Síguenos en Instagram para estar al tanto: @friendsontherun

💰 COSTO:
- Completamente GRATIS para todos

👥 ¿QUIÉN PUEDE VENIR?
- Todas las edades y niveles son bienvenidos — desde principiantes hasta atletas avanzados
- No hay requisitos previos, solo llegar con ganas
- Menores de edad deben venir acompañados de un adulto responsable

⚠️ IMPORTANTE:
- El run club no se hace responsable por objetos robados o perdidos
- Al terminar el run, pedimos amablemente llenar el formulario en nuestro perfil de Instagram (@friendsontherun) — esta información nos ayuda a mejorar la experiencia del grupo

📲 REDES SOCIALES:
- Instagram: @friendsontherun
- Sigue la cuenta para ver el flyer semanal cada lunes con horarios y ubicaciones actualizadas

Si te preguntan algo que no está en esta información, diles que sigan @friendsontherun en Instagram para estar al día, o que estén pendientes al flyer del lunes.
`;

// ============================================================
// BUSINESS LEAD DETECTION
// ============================================================
const BUSINESS_KEYWORDS = [
  // Spanish
  "patrocinio", "patrocinador", "patrocinar", "sponsor", "sponsorship",
  "colaboración", "colaborar", "collab", "alianza", "partnership",
  "marca", "empresa", "negocio", "propuesta", "propuesta comercial",
  "publicidad", "anuncio", "promoción", "embajador", "embajadora",
  "acuerdo", "contrato", "inversión", "oportunidad de negocio",
  "representar", "representación", "campaña",
  // English
  "business", "brand deal", "ambassador", "promotion", "advertise",
  "advertising", "commercial", "deal", "opportunity", "partner",
  "invest", "investment", "contract", "proposal", "marketing",
  "represent", "campaign", "affiliate"
];

function isBusinessLead(message) {
  const lower = message.toLowerCase();
  return BUSINESS_KEYWORDS.some(keyword => lower.includes(keyword));
}

const BUSINESS_REPLY_ES = `¡Hola! Gracias por comunicarte con Friends on the Run 🙌 Tu mensaje ha sido recibido y lo compartiremos con nuestro equipo. Alguien se pondrá en contacto contigo muy pronto para hablar sobre esta oportunidad.`;

const BUSINESS_REPLY_EN = `Hi! Thanks for reaching out to Friends on the Run 🙌 Your message has been received and we'll share it with our team. Someone will be in touch with you shortly to discuss this opportunity.`;

function detectLanguage(message) {
  const spanishWords = ["hola", "gracias", "buenos", "quiero", "como", "cómo", "qué", "que", "para", "con", "una", "por", "nos", "les", "del", "las", "los"];
  const lower = message.toLowerCase();
  const spanishCount = spanishWords.filter(w => lower.includes(w)).length;
  return spanishCount >= 1 ? "es" : "en";
}

// ============================================================
// EMAIL ALERT FOR BUSINESS LEADS
// ============================================================
async function sendLeadAlert(senderId, message) {
  const ALERT_EMAIL = process.env.ALERT_EMAIL || "somos@frenesontherun.com";
  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || null;

  // Log to console always (visible in Render logs)
  console.log("🔥 BUSINESS LEAD DETECTED!");
  console.log(`   Instagram Sender ID: ${senderId}`);
  console.log(`   Message: ${message}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  console.log("─────────────────────────────────────────");

  // Send email via SendGrid if API key is configured
  if (SENDGRID_API_KEY) {
    try {
      await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        {
          personalizations: [{ to: [{ email: ALERT_EMAIL }] }],
          from: { email: "bot@friendsontherun.com", name: "FOTR Bot" },
          subject: "🔥 Nuevo Business Lead en Instagram — Friends on the Run",
          content: [
            {
              type: "text/html",
              value: `
                <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px;background:#f9f9f9;border-radius:12px;">
                  <h2 style="color:#c94b2a;margin-bottom:4px;">🔥 Business Lead Detectado</h2>
                  <p style="color:#666;font-size:13px;margin-bottom:20px;">${new Date().toLocaleString("es-PA", {timeZone:"America/Panama"})}</p>
                  
                  <div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;border:1px solid #eee;">
                    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Instagram Sender ID</div>
                    <div style="font-size:15px;font-weight:600;font-family:monospace;">${senderId}</div>
                  </div>
                  
                  <div style="background:white;border-radius:8px;padding:16px;border:1px solid #eee;">
                    <div style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">Mensaje recibido</div>
                    <div style="font-size:14px;line-height:1.6;color:#333;">"${message}"</div>
                  </div>
                  
                  <p style="margin-top:20px;font-size:13px;color:#888;">Responde directamente en Instagram para dar seguimiento a este lead.</p>
                </div>
              `,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${SENDGRID_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(`📧 Lead alert email sent to ${ALERT_EMAIL}`);
    } catch (err) {
      console.error("Email alert error:", err.response?.data || err.message);
    }
  } else {
    console.log("📧 (Email alerts not configured — add SENDGRID_API_KEY to enable)");
  }
}

// ============================================================
// CONVERSATION MEMORY (in-memory, resets on server restart)
// ============================================================
const conversations = {};

// ============================================================
// CLAUDE API
// ============================================================
async function askClaude(senderId, userMessage) {
  // Initialize conversation history for this user
  if (!conversations[senderId]) {
    conversations[senderId] = [];
  }

  // Add user message to history
  conversations[senderId].push({
    role: "user",
    content: userMessage,
  });

  // Keep only last 10 messages to avoid token overflow
  if (conversations[senderId].length > 10) {
    conversations[senderId] = conversations[senderId].slice(-10);
  }

  try {
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: KNOWLEDGE,
        messages: conversations[senderId],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": CONFIG.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const reply = response.data.content[0].text;

    // Add assistant reply to history
    conversations[senderId].push({
      role: "assistant",
      content: reply,
    });

    return reply;
  } catch (error) {
    console.error("Claude API error:", error.response?.data || error.message);
    return "Lo siento, tuve un problema técnico. Por favor escríbenos de nuevo en unos momentos. 🙏";
  }
}

// ============================================================
// SEND DM VIA INSTAGRAM API
// ============================================================
async function sendDM(recipientId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v20.0/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: message },
        messaging_type: "RESPONSE",
      },
      {
        params: { access_token: CONFIG.PAGE_ACCESS_TOKEN },
        headers: { "Content-Type": "application/json" },
      }
    );
    console.log(`✅ Message sent to ${recipientId}`);
  } catch (error) {
    console.error("Send DM error:", error.response?.data || error.message);
  }
}

// ============================================================
// WEBHOOK — VERIFICATION (GET)
// ============================================================
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === CONFIG.VERIFY_TOKEN) {
    console.log("✅ Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.error("❌ Webhook verification failed");
    res.sendStatus(403);
  }
});

// ============================================================
// WEBHOOK — RECEIVE MESSAGES (POST)
// ============================================================
app.post("/webhook", async (req, res) => {
  // Always respond 200 immediately so Meta doesn't retry
  res.sendStatus(200);

  const body = req.body;

  if (body.object !== "instagram" && body.object !== "page") return;

  for (const entry of body.entry || []) {
    const messagingEvents = entry.messaging || entry.changes?.[0]?.value?.messages || [];

    for (const event of messagingEvents) {
      // Handle direct messages
      if (event.message && !event.message.is_echo) {
        const senderId = event.sender?.id || event.from?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) continue;

        console.log(`📩 DM from ${senderId}: ${messageText}`);

        // Check if this is a business lead
        if (isBusinessLead(messageText)) {
          console.log(`💼 Business lead from ${senderId} — flagging for manual follow-up`);
          const lang = detectLanguage(messageText);
          const businessReply = lang === "es" ? BUSINESS_REPLY_ES : BUSINESS_REPLY_EN;
          await sendDM(senderId, businessReply);
          await sendLeadAlert(senderId, messageText);
        } else {
          // Regular run club question — answer with Claude
          const reply = await askClaude(senderId, messageText);
          await sendDM(senderId, reply);
        }
      }
    }
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================
app.get("/", (req, res) => {
  res.json({
    status: "✅ Friends on the Run Bot is running",
    page_id: CONFIG.PAGE_ID,
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏃 FOTR Bot server running on port ${PORT}`);
});
