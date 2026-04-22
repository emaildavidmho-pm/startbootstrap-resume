// Interview Agent Chat Widget
// Replace WORKER_URL with your deployed Cloudflare Worker URL
const WORKER_URL = "https://david-resume-agent.code-38d.workers.dev";

const styles = `
  #dmh-chat-toggle {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background-color: #002366;
    color: white;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    z-index: 9999;
    transition: background-color 0.2s, transform 0.2s;
  }
  #dmh-chat-toggle:hover {
    background-color: #00308F;
    transform: scale(1.08);
  }
  #dmh-chat-window {
    position: fixed;
    bottom: 6rem;
    right: 2rem;
    width: 350px;
    max-height: 500px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    display: flex;
    flex-direction: column;
    z-index: 9998;
    overflow: hidden;
    font-family: 'Muli', sans-serif;
    transition: opacity 0.2s, transform 0.2s;
  }
  #dmh-chat-window.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
  }
  #dmh-chat-header {
    background-color: #002366;
    color: white;
    padding: 0.85rem 1rem;
    font-weight: 700;
    font-size: 0.95rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  #dmh-chat-header span { opacity: 0.8; font-weight: 400; font-size: 0.8rem; }
  #dmh-chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    background: #f8f9fa;
  }
  .dmh-msg {
    max-width: 85%;
    padding: 0.5rem 0.8rem;
    border-radius: 10px;
    font-size: 0.875rem;
    line-height: 1.5;
  }
  .dmh-msg.user {
    background-color: #002366;
    color: white;
    align-self: flex-end;
    border-bottom-right-radius: 2px;
  }
  .dmh-msg.agent {
    background-color: #fff;
    color: #212529;
    align-self: flex-start;
    border: 1px solid #dee2e6;
    border-bottom-left-radius: 2px;
  }
  .dmh-msg.typing { color: #6c757d; font-style: italic; }
  #dmh-chat-input-row {
    display: flex;
    border-top: 1px solid #dee2e6;
    background: #fff;
    padding: 0.5rem;
    gap: 0.5rem;
  }
  #dmh-chat-input {
    flex: 1;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    padding: 0.4rem 0.7rem;
    font-size: 0.875rem;
    outline: none;
    font-family: 'Muli', sans-serif;
  }
  #dmh-chat-input:focus { border-color: #002366; }
  #dmh-chat-send {
    background-color: #002366;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.4rem 0.8rem;
    cursor: pointer;
    font-size: 0.875rem;
    transition: background-color 0.2s;
  }
  #dmh-chat-send:hover { background-color: #00308F; }
  #dmh-chat-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    border-top: 1px solid #dee2e6;
    background: #fff;
  }
  .dmh-prompt-chip {
    background: #f0f4ff;
    border: 1px solid #c0cce8;
    color: #002366;
    border-radius: 50rem;
    padding: 0.25rem 0.65rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: background-color 0.2s;
    white-space: nowrap;
  }
  .dmh-prompt-chip:hover { background-color: #dce5f7; }
  @media (max-width: 480px) {
    #dmh-chat-window { width: calc(100vw - 2rem); right: 1rem; bottom: 5rem; }
    #dmh-chat-toggle { bottom: 1rem; right: 1rem; }
  }
`;

const styleEl = document.createElement("style");
styleEl.textContent = styles;
document.head.appendChild(styleEl);

const toggleBtn = document.createElement("button");
toggleBtn.id = "dmh-chat-toggle";
toggleBtn.title = "Ask about David";
toggleBtn.innerHTML = `<i class="fas fa-comment-dots"></i>`;
document.body.appendChild(toggleBtn);

const chatWindow = document.createElement("div");
chatWindow.id = "dmh-chat-window";
chatWindow.classList.add("hidden");
chatWindow.innerHTML = `
  <div id="dmh-chat-header">
    Ask About David <span>AI Interview Agent</span>
  </div>
  <div id="dmh-chat-messages">
    <div class="dmh-msg agent">Hi! I'm David's interview agent. Ask me anything about his background, experience, or availability.</div>
  </div>
  <div id="dmh-chat-prompts">
    <button class="dmh-prompt-chip">What's David's background?</button>
    <button class="dmh-prompt-chip">What programs has he managed?</button>
    <button class="dmh-prompt-chip">What's his clearance level?</button>
    <button class="dmh-prompt-chip">When is he available?</button>
    <button class="dmh-prompt-chip">What roles is he targeting?</button>
    <button class="dmh-prompt-chip">What are his key skills?</button>
  </div>
  <div id="dmh-chat-input-row">
    <input id="dmh-chat-input" type="text" placeholder="Ask a question..." maxlength="500" />
    <button id="dmh-chat-send">Send</button>
  </div>
`;
document.body.appendChild(chatWindow);

const messages = [];
const messagesEl = chatWindow.querySelector("#dmh-chat-messages");
const inputEl = chatWindow.querySelector("#dmh-chat-input");
const sendBtn = chatWindow.querySelector("#dmh-chat-send");

toggleBtn.addEventListener("click", () => {
  chatWindow.classList.toggle("hidden");
  if (!chatWindow.classList.contains("hidden")) inputEl.focus();
});

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = "";
  appendMessage("user", text);
  messages.push({ role: "user", content: text });

  const typingEl = appendMessage("agent", "Thinking…", true);
  sendBtn.disabled = true;
  inputEl.disabled = true;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    typingEl.remove();
    appendMessage("agent", data.reply);
    messages.push({ role: "assistant", content: data.reply });
  } catch {
    typingEl.remove();
    appendMessage("agent", "Sorry, I'm having trouble connecting. Please try again or email David directly at Email@david-ho.com.");
  }

  sendBtn.disabled = false;
  inputEl.disabled = false;
  inputEl.focus();
}

function appendMessage(role, text, isTyping = false) {
  const el = document.createElement("div");
  el.className = `dmh-msg ${role}${isTyping ? " typing" : ""}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return el;
}

sendBtn.addEventListener("click", sendMessage);
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

const promptsEl = chatWindow.querySelector("#dmh-chat-prompts");
promptsEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".dmh-prompt-chip");
  if (!chip) return;
  inputEl.value = chip.textContent;
  promptsEl.style.display = "none";
  sendMessage();
});
