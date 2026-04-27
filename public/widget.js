(() => {
  const scriptEl = document.currentScript;
  const clientId = new URL(scriptEl.src, window.location.href).searchParams.get("client");

  if (!clientId) {
    console.error("[Widget] Parametre 'client' manquant. Ex: <script src=\"widget.js?client=bistro-lumiere\">");
    return;
  }

  let isOpen = false;
  let messages = [];
  let loading = false;
  let lang = "fr";

  function injectStyles(c) {
    document.documentElement.style.setProperty("--bl-primary", c.primaryColor);
    document.documentElement.style.setProperty("--bl-dark", c.darkColor);

    const style = document.createElement("style");
    style.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Playfair+Display:wght@700&display=swap');",
      "#bl-widget-btn {",
      "  position: fixed; bottom: 24px; right: 24px;",
      "  width: 58px; height: 58px; border-radius: 50%;",
      "  background: linear-gradient(135deg, var(--bl-primary), #e8b97a);",
      "  border: none; cursor: pointer;",
      "  box-shadow: 0 6px 24px rgba(200,150,90,0.5);",
      "  display: flex; align-items: center; justify-content: center;",
      "  font-size: 24px; z-index: 999999;",
      "  transition: transform 0.2s, box-shadow 0.2s;",
      "}",
      "#bl-widget-btn:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(200,150,90,0.6); }",
      "#bl-widget-window {",
      "  position: fixed; bottom: 96px; right: 24px;",
      "  width: 360px; height: 520px;",
      "  background: var(--bl-dark);",
      "  border-radius: 20px; box-shadow: 0 24px 80px rgba(0,0,0,0.5);",
      "  border: 1px solid rgba(200,150,90,0.2);",
      "  display: flex; flex-direction: column;",
      "  z-index: 999998; overflow: hidden;",
      "  font-family: 'Lora', Georgia, serif;",
      "  transition: opacity 0.2s, transform 0.2s;",
      "  transform-origin: bottom right;",
      "}",
      "#bl-widget-window.hidden { display: none; }",
      "#bl-widget-header {",
      "  background: rgba(26,15,8,0.98);",
      "  border-bottom: 1px solid rgba(200,150,90,0.2);",
      "  padding: 14px 16px; display: flex; align-items: center; gap: 10px;",
      "}",
      "#bl-widget-avatar {",
      "  width: 36px; height: 36px; border-radius: 50%;",
      "  background: linear-gradient(135deg, var(--bl-primary), #e8b97a);",
      "  display: flex; align-items: center; justify-content: center;",
      "  font-size: 16px; flex-shrink: 0;",
      "}",
      "#bl-widget-title { font-family: 'Playfair Display', Georgia, serif; font-size: 15px; font-weight: 700; color: #f5e6d0; }",
      "#bl-widget-subtitle { font-size: 10px; color: var(--bl-primary); margin-top: 1px; }",
      "#bl-widget-lang { margin-left: auto; display: flex; gap: 4px; }",
      ".bl-lang-btn {",
      "  background: transparent; border: 1px solid rgba(200,150,90,0.2);",
      "  border-radius: 5px; color: #888; padding: 3px 8px; cursor: pointer;",
      "  font-size: 10px; font-weight: 600; font-family: inherit;",
      "  text-transform: uppercase; letter-spacing: 1px;",
      "}",
      ".bl-lang-btn.active { background: rgba(200,150,90,0.15); border-color: var(--bl-primary); color: var(--bl-primary); }",
      "#bl-widget-messages {",
      "  flex: 1; overflow-y: auto; padding: 16px 12px;",
      "  display: flex; flex-direction: column; gap: 10px;",
      "  scrollbar-width: thin; scrollbar-color: rgba(200,150,90,0.2) transparent;",
      "}",
      ".bl-msg { display: flex; animation: blMsgIn 0.2s ease; }",
      ".bl-msg.user { justify-content: flex-end; }",
      ".bl-msg.bot { justify-content: flex-start; }",
      "@keyframes blMsgIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }",
      ".bl-bubble { max-width: 78%; padding: 9px 13px; border-radius: 14px; font-size: 13px; line-height: 1.6; word-break: break-word; white-space: pre-wrap; }",
      ".bl-bubble.user { background: linear-gradient(135deg, #2c1810, #4a2c1a); color: #f5e6d0; border-radius: 14px 14px 4px 14px; }",
      ".bl-bubble.bot { background: rgba(255,252,245,0.92); color: #2c1810; border-radius: 14px 14px 14px 4px; border: 1px solid rgba(200,150,90,0.15); }",
      ".bl-typing { display: flex; gap: 4px; align-items: center; padding: 10px 13px; }",
      ".bl-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--bl-primary); animation: blDot 1.4s infinite ease-in-out; }",
      ".bl-dot:nth-child(2) { animation-delay: 0.16s; }",
      ".bl-dot:nth-child(3) { animation-delay: 0.32s; }",
      "@keyframes blDot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.3; } 40% { transform: translateY(-5px); opacity: 1; } }",
      "#bl-widget-input-area { padding: 10px 12px 14px; background: rgba(26,15,8,0.98); border-top: 1px solid rgba(200,150,90,0.15); }",
      "#bl-widget-input-row {",
      "  display: flex; gap: 8px; align-items: flex-end;",
      "  background: rgba(255,252,245,0.05); border: 1px solid rgba(200,150,90,0.2);",
      "  border-radius: 12px; padding: 8px 10px;",
      "}",
      "#bl-widget-input {",
      "  flex: 1; background: transparent; border: none; outline: none;",
      "  color: #f5e6d0; font-size: 16px; font-family: 'Lora', Georgia, serif;",
      "  line-height: 1.5; resize: none; max-height: 80px; overflow-y: auto;",
      "}",
      "#bl-widget-input::placeholder { color: #6a4a30; }",
      "#bl-widget-send {",
      "  width: 30px; height: 30px; border-radius: 8px; border: none;",
      "  background: linear-gradient(135deg, var(--bl-primary), #e8b97a);",
      "  color: #1a0f08; cursor: pointer; font-size: 14px; font-weight: 700;",
      "  display: flex; align-items: center; justify-content: center;",
      "  flex-shrink: 0; transition: opacity 0.2s;",
      "}",
      "#bl-widget-send:disabled { background: rgba(255,255,255,0.05); color: #444; cursor: not-allowed; }",
      "#bl-widget-footer { text-align: center; font-size: 9px; color: #3a2010; margin-top: 6px; letter-spacing: 0.5px; }",
      "@media (max-width: 480px) {",
      "  #bl-widget-window { position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; height: 100dvh !important; max-height: none !important; border-radius: 0 !important; bottom: auto !important; right: auto !important; }",
      "  #bl-widget-btn { right: 16px; bottom: 16px; }",
      "  body.bl-open #bl-widget-btn { bottom: 90px; right: 16px; width: 32px; height: 32px; font-size: 16px; box-shadow: none; }",
      "}"
    ].join("\n");
    document.head.appendChild(style);
  }

  function buildWidget(c) {
    const btn = document.createElement("button");
    btn.id = "bl-widget-btn";
    btn.innerHTML = "&#x1F4AC;";
    btn.title = "Chat avec " + c.restaurantName;

    const win = document.createElement("div");
    win.id = "bl-widget-window";
    win.classList.add("hidden");
    win.innerHTML =
      '<div id="bl-widget-header">' +
        '<div id="bl-widget-avatar">&#x1F37D;</div>' +
        '<div>' +
          '<div id="bl-widget-title">' + c.restaurantName + '</div>' +
          '<div id="bl-widget-subtitle">Assistant virtuel &middot; En ligne</div>' +
        '</div>' +
        '<div id="bl-widget-lang">' +
          '<button class="bl-lang-btn active" data-lang="fr">FR</button>' +
          '<button class="bl-lang-btn" data-lang="en">EN</button>' +
        '</div>' +
      '</div>' +
      '<div id="bl-widget-messages"></div>' +
      '<div id="bl-widget-input-area">' +
        '<div id="bl-widget-input-row">' +
          '<textarea id="bl-widget-input" rows="1" placeholder="' + c.placeholder + '"></textarea>' +
          '<button id="bl-widget-send" disabled>&#x2191;</button>' +
        '</div>' +
        '<div id="bl-widget-footer">Propuls&eacute; par IA &middot; ' + c.restaurantName + '</div>' +
      '</div>';

    document.body.appendChild(btn);
    document.body.appendChild(win);

    const messagesEl = document.getElementById("bl-widget-messages");
    const inputEl = document.getElementById("bl-widget-input");
    const sendBtn = document.getElementById("bl-widget-send");

    function renderMessages() {
      messagesEl.innerHTML = "";
      if (messages.length === 0) {
        const greeting = document.createElement("div");
        greeting.className = "bl-msg bot";
        greeting.innerHTML = '<div class="bl-bubble bot">' + (lang === "fr" ? c.greeting : c.greetingEn) + '</div>';
        messagesEl.appendChild(greeting);
      }
      messages.forEach(function(m) {
        const role = m.role === "user" ? "user" : "bot";
        const div = document.createElement("div");
        div.className = "bl-msg " + role;
        div.innerHTML = '<div class="bl-bubble ' + role + '">' + m.content.replace(/</g, "&lt;") + '</div>';
        messagesEl.appendChild(div);
      });
      if (loading) {
        const typing = document.createElement("div");
        typing.className = "bl-msg bot";
        typing.innerHTML = '<div class="bl-bubble bot"><div class="bl-typing"><div class="bl-dot"></div><div class="bl-dot"></div><div class="bl-dot"></div></div></div>';
        messagesEl.appendChild(typing);
      }
      const lastMsg = messages[messages.length - 1];
      if (loading || !lastMsg || lastMsg.role === "user") {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      } else {
        const botMsgs = messagesEl.querySelectorAll(".bl-msg.bot");
        const lastBot = botMsgs[botMsgs.length - 1];
        if (lastBot) {
          messagesEl.scrollTo({ top: lastBot.offsetTop, behavior: "smooth" });
        } else {
          messagesEl.scrollTop = messagesEl.scrollHeight;
        }
      }
    }

    async function send() {
      const text = inputEl.value.trim();
      if (!text || loading) return;
      inputEl.value = "";
      inputEl.style.height = "auto";
      sendBtn.disabled = true;
      messages.push({ role: "user", content: text });
      loading = true;
      renderMessages();

      try {
        const res = await fetch("https://mon-chatbot-production.up.railway.app/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientId,
            messages: messages.map(function(m) { return { role: m.role, content: m.content }; })
          })
        });
        const data = await res.json();
        const reply = (data.content && data.content.find(function(b) { return b.type === "text"; }))
          ? data.content.find(function(b) { return b.type === "text"; }).text
          : "Desole, une erreur s'est produite.";
        messages.push({ role: "assistant", content: reply });
      } catch (e) {
        messages.push({ role: "assistant", content: "Desole, je ne suis pas disponible pour le moment." });
      }

      loading = false;
      renderMessages();
    }

    btn.addEventListener("click", function() {
      isOpen = !isOpen;
      win.classList.toggle("hidden", !isOpen);
      btn.innerHTML = isOpen ? "&#x2715;" : "&#x1F4AC;";
      if (window.innerWidth <= 480) {
        document.body.classList.toggle("bl-open", isOpen);
      }
      if (isOpen) { renderMessages(); }
    });

    inputEl.addEventListener("input", function() {
      sendBtn.disabled = !inputEl.value.trim();
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 80) + "px";
    });

    inputEl.addEventListener("focus", function() {
      if (window.innerWidth <= 420) {
        setTimeout(function() { messagesEl.scrollTop = messagesEl.scrollHeight; }, 300);
      }
    });

    inputEl.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
    });

    sendBtn.addEventListener("click", send);

    document.querySelectorAll(".bl-lang-btn").forEach(function(b) {
      b.addEventListener("click", function() {
        lang = b.dataset.lang;
        document.querySelectorAll(".bl-lang-btn").forEach(function(x) { x.classList.remove("active"); });
        b.classList.add("active");
        inputEl.placeholder = lang === "fr" ? c.placeholder : c.placeholderEn;
        renderMessages();
      });
    });

    renderMessages();
  }

  async function init() {
    try {
      const res = await fetch("https://mon-chatbot-production.up.railway.app/api/config/" + clientId);
      if (!res.ok) throw new Error('Client "' + clientId + '" introuvable');
      const config = await res.json();
      injectStyles(config);
      buildWidget(config);
    } catch (err) {
      console.error("[Widget]", err.message);
    }
  }

  init();
})();
