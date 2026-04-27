import { useState, useRef, useEffect } from "react";

const RESTAURANT = {
  name: "Bistro Lumière",
  tagline: "Cuisine franco-méditerranéenne · Montréal",
  hours: "Mar–Ven 11h–22h · Sam–Dim 10h–23h · Lun fermé",
  address: "1247 Rue Saint-Denis, Montréal, QC",
  phone: "(514) 555-0192",
  email: "info@bistrolumiere.ca",
};

const SYSTEM_PROMPT = `Tu es l'assistant virtuel du ${RESTAURANT.name}, un restaurant de cuisine franco-méditerranéenne à Montréal. Tu réponds aux clients en français ou en anglais selon la langue qu'ils utilisent. Tu es chaleureux, professionnel et utile.

Informations sur le restaurant :
- Nom : ${RESTAURANT.name}
- Adresse : ${RESTAURANT.address}
- Téléphone : ${RESTAURANT.phone}
- Horaires : ${RESTAURANT.hours}
- Spécialités : Bouillabaisse, Magret de canard, Tarte tatin, Plateau de fromages, Brunch du weekend
- Réservations : Par téléphone ou en ligne sur notre site
- Allergènes : Nous accommodons les allergies sur demande, merci de nous prévenir lors de la réservation
- Stationnement : Rue payante devant, stationnement gratuit rue Cherrier
- Terrasse : Oui, disponible mai à octobre

Tu ne peux pas effectuer de réservations toi-même, mais tu peux donner le numéro de téléphone et encourager à appeler. Reste toujours dans le contexte du restaurant.`;

const SUGGESTIONS_FR = [
  "Quels sont vos horaires ?",
  "Comment faire une réservation ?",
  "Avez-vous des options végétariennes ?",
  "Où êtes-vous situés ?",
];

const SUGGESTIONS_EN = [
  "What are your opening hours?",
  "How can I make a reservation?",
  "Do you have vegetarian options?",
  "Where are you located?",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "#c8965a",
          animation: "dotBounce 1.4s infinite ease-in-out",
          animationDelay: `${i * 0.16}s`
        }} />
      ))}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 14,
      animation: "msgIn 0.25s ease"
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "linear-gradient(135deg, #c8965a, #e8b97a)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2,
          boxShadow: "0 2px 8px rgba(200,150,90,0.3)"
        }}>🍽</div>
      )}
      <div style={{
        maxWidth: "72%",
        background: isUser
          ? "linear-gradient(135deg, #2c1810, #4a2c1a)"
          : "rgba(255,252,245,0.9)",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        padding: "11px 15px",
        color: isUser ? "#f5e6d0" : "#2c1810",
        fontSize: 13.5,
        lineHeight: 1.65,
        boxShadow: isUser
          ? "0 4px 16px rgba(44,24,16,0.3)"
          : "0 2px 12px rgba(0,0,0,0.08)",
        border: isUser ? "none" : "1px solid rgba(200,150,90,0.2)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontFamily: "'Lora', Georgia, serif"
      }}>
        {msg.content}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          background: "#2c1810",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, marginLeft: 10, flexShrink: 0, marginTop: 2
        }}>👤</div>
      )}
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState("fr");
  const bottomRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setError("");
    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error || `Erreur ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "";
      if (!reply) throw new Error("Réponse vide");
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(e.message);
      setMessages(newMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestions = lang === "fr" ? SUGGESTIONS_FR : SUGGESTIONS_EN;
  const isEmpty = messages.length === 0;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1a0f08",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Lora', Georgia, serif",
      position: "relative",
      overflow: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Playfair+Display:wght@700;800&display=swap');
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; }
        }
        textarea:focus { outline: none; }
        textarea { resize: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,150,90,0.3); border-radius: 2px; }
        button:hover { opacity: 0.85; }
      `}</style>

      {/* Ambient background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 20% 20%, rgba(200,150,90,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(120,60,20,0.1) 0%, transparent 60%)"
      }} />

      {/* Header */}
      <div style={{
        background: "rgba(26,15,8,0.95)",
        borderBottom: "1px solid rgba(200,150,90,0.2)",
        padding: "14px 20px",
        backdropFilter: "blur(20px)",
        position: "sticky", top: 0, zIndex: 10
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 10,
              background: "linear-gradient(135deg, #c8965a, #e8b97a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, boxShadow: "0 4px 16px rgba(200,150,90,0.35)"
            }}>🍽</div>
            <div>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 18, fontWeight: 800, color: "#f5e6d0",
                letterSpacing: 0.5
              }}>{RESTAURANT.name}</div>
              <div style={{ fontSize: 11, color: "#c8965a", letterSpacing: 0.5 }}>
                {RESTAURANT.tagline}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginRight: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", animation: "shimmer 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#4ade80" }}>En ligne</span>
            </div>
            {["fr", "en"].map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                background: lang === l ? "rgba(200,150,90,0.2)" : "transparent",
                border: `1px solid ${lang === l ? "#c8965a" : "rgba(200,150,90,0.2)"}`,
                borderRadius: 6, color: lang === l ? "#c8965a" : "#888",
                padding: "4px 10px", cursor: "pointer", fontSize: 11,
                fontWeight: 600, fontFamily: "inherit", textTransform: "uppercase",
                letterSpacing: 1
              }}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: isEmpty ? "0" : "20px 16px 16px",
        display: "flex", flexDirection: "column"
      }}>
        {isEmpty ? (
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "40px 20px", textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🕯️</div>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 24, fontWeight: 800, color: "#f5e6d0", marginBottom: 8
            }}>
              {lang === "fr" ? "Bonsoir, comment puis-je vous aider ?" : "Good evening, how can I help you?"}
            </div>
            <div style={{ fontSize: 13, color: "#8a6a50", marginBottom: 8 }}>
              {RESTAURANT.hours}
            </div>
            <div style={{ fontSize: 12, color: "#6a4a30", marginBottom: 32 }}>
              {RESTAURANT.address}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 340 }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => sendMessage(s)} style={{
                  background: "rgba(200,150,90,0.07)",
                  border: "1px solid rgba(200,150,90,0.2)",
                  borderRadius: 10, padding: "11px 16px",
                  color: "#d4a870", cursor: "pointer", textAlign: "left",
                  fontSize: 13, fontFamily: "inherit", lineHeight: 1.4,
                  transition: "all 0.2s"
                }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 14 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "linear-gradient(135deg, #c8965a, #e8b97a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, marginRight: 10, flexShrink: 0
                }}>🍽</div>
                <div style={{
                  background: "rgba(255,252,245,0.9)",
                  borderRadius: "18px 18px 18px 4px",
                  border: "1px solid rgba(200,150,90,0.2)"
                }}>
                  <TypingDots />
                </div>
              </div>
            )}
            {error && (
              <div style={{
                background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.3)",
                borderRadius: 8, padding: "10px 14px", color: "#ff8a8a",
                fontSize: 12, marginBottom: 10
              }}>⚠ {error}</div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "12px 16px 20px",
        background: "rgba(26,15,8,0.95)",
        borderTop: "1px solid rgba(200,150,90,0.15)",
        backdropFilter: "blur(20px)"
      }}>
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-end",
          background: "rgba(255,252,245,0.05)",
          border: "1px solid rgba(200,150,90,0.25)",
          borderRadius: 14, padding: "10px 12px"
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={lang === "fr" ? "Posez votre question..." : "Ask your question..."}
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none",
              color: "#f5e6d0", fontSize: 13.5, fontFamily: "'Lora', Georgia, serif",
              lineHeight: 1.5, maxHeight: 100, overflowY: "auto", padding: 0
            }}
            onInput={e => {
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: 34, height: 34, borderRadius: 9, border: "none",
              background: input.trim() && !loading
                ? "linear-gradient(135deg, #c8965a, #e8b97a)"
                : "rgba(255,255,255,0.05)",
              color: input.trim() && !loading ? "#1a0f08" : "#444",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 15, flexShrink: 0, transition: "all 0.2s",
              boxShadow: input.trim() && !loading ? "0 4px 14px rgba(200,150,90,0.4)" : "none",
              fontWeight: 700
            }}
          >↑</button>
        </div>
        <div style={{ textAlign: "center", fontSize: 10, color: "#4a2c1a", marginTop: 8, letterSpacing: 0.5 }}>
          {RESTAURANT.name} · {RESTAURANT.phone}
        </div>
      </div>
    </div>
  );
}