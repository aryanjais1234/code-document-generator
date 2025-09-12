// This file contains the updated JavaScript functionality.
// It manages chat conversations, saves them to history,
// correctly communicates with the Python FastAPI backend,
// and formats the assistant's responses into readable HTML.

// --- DOM ELEMENT SELECTORS ---
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const chat = document.getElementById('chat');
const fileInput = document.getElementById('fileInput');
const previewArea = document.getElementById('previewArea');
const historyList = document.getElementById('historyList');
const clearHistory = document.getElementById('clearHistory');
const imgBtn = document.getElementById('imgBtn');
const newChatBtn = document.getElementById('newChatBtn');
const sidebar = document.getElementById('sidebar');
const drawerBtn = document.getElementById('drawerBtn');

// --- DATA STRUCTURES ---
let history = JSON.parse(localStorage.getItem('lcda_history') || '[]');
let currentChat = [];
let currentChatId = null;

// --- DRAWER FUNCTIONALITY ---
drawerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
});

// --- RESPONSE FORMATTING ---

/**
 * Converts a string with markdown-like syntax to formatted HTML.
 * This function handles code blocks, headings, bold text, and newlines.
 * @param {string} text - The raw text from the LLM.
 * @returns {string} - An HTML string ready to be rendered.
 */
function formatResponseToHTML(text) {
    let html = text;

    // Convert ```cpp ... ``` blocks to <pre><code...>.
    // The code inside is escaped to prevent it from being rendered as HTML.
    html = html.replace(/```cpp([\s\S]*?)```/g, (match, code) => {
        const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<pre><code class="language-cpp">${escapedCode.trim()}</code></pre>`;
    });

    // Split the text by the code blocks we just created to process the rest.
    const parts = html.split(/(<pre>[\s\S]*?<\/pre>)/);

    const processedParts = parts.map(part => {
        // If this part is a code block, leave it as is.
        if (part.startsWith('<pre>')) {
            return part;
        }

        // For non-code parts, process other markdown.
        let processedPart = part;

        // Convert ## headings to <h2>...</h2>
        processedPart = processedPart.replace(/^## (.*$)/gm, '<h2>$1</h2>');

        // Convert **bold** text to <strong>...</strong>
        processedPart = processedPart.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert newlines to <br> for line breaks.
        processedPart = processedPart.replace(/\n/g, '<br>');

        return processedPart;
    });

    return processedParts.join('');
}


// --- HISTORY & CHAT MANAGEMENT ---
function saveHistory() {
  localStorage.setItem('lcda_history', JSON.stringify(history));
}

function renderHistory() {
  historyList.innerHTML = '';
  history.slice().reverse().forEach(chatItem => {
    const el = document.createElement('div');
    el.className = 'history-item';
    el.textContent = chatItem.title;
    el.dataset.id = chatItem.id;
    if (chatItem.id === currentChatId) {
      el.classList.add('active');
    }
    el.onclick = () => loadChat(chatItem.id);
    historyList.appendChild(el);
  });
}

function saveCurrentChat() {
    if (currentChat.length === 0 || currentChat[currentChat.length - 1].who !== 'assistant') return;

    const existingChat = history.find(c => c.id === currentChatId);
    if (existingChat) {
        existingChat.messages = [...currentChat];
    } else {
        const title = currentChat[0].content.substring(0, 40) + (currentChat[0].content.length > 40 ? '…' : '');
        currentChatId = Date.now();
        history.push({
            id: currentChatId,
            title: title,
            messages: [...currentChat]
        });
    }
    saveHistory();
    renderHistory();
}

function loadChat(chatId) {
    const chatToLoad = history.find(c => c.id === chatId);
    if (chatToLoad) {
        currentChatId = chatToLoad.id;
        currentChat = [...chatToLoad.messages];
        chat.innerHTML = '';
        currentChat.forEach(msg => addMessageToUI(msg.content, msg.who));
    }
    renderHistory();
}


function startNewChat() {
    saveCurrentChat();
    chat.innerHTML = '';
    currentChat = [];
    currentChatId = null;
    textInput.value = '';
    previewArea.innerHTML = '';
    fileInput.value = '';
    renderHistory();
    if (window.innerWidth < 880) {
        sidebar.classList.remove('sidebar-open');
    }
}

// --- UI & MESSAGING ---

/**
 * Adds a message to the chat UI. It formats assistant messages as HTML
 * and displays user messages as plain text for security.
 * @param {string} content The message content.
 * @param {string} [who='assistant'] The sender ('user' or 'assistant').
 * @returns {HTMLElement} The created message element.
 */
function addMessageToUI(content, who = 'assistant') {
    const m = document.createElement('div');
    m.className = 'msg ' + (who === 'user' ? 'user' : 'assistant');

    if (who === 'assistant') {
        // For the assistant, format the content and render it as HTML.
        m.innerHTML = formatResponseToHTML(content);
    } else {
        // For the user's input, always use textContent to prevent XSS attacks.
        m.textContent = content;
    }

    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
    return m;
}

async function sendMessage() {
  const text = textInput.value.trim();
  if (!text) return;

  currentChat.push({ who: 'user', content: text });
  addMessageToUI(text, 'user');
  textInput.value = '';

  const assistantMsgElement = addMessageToUI('Assistant is typing...', 'assistant');
  assistantMsgElement.id = 'temp-assistant-msg';

  // --- API Call to FastAPI Backend ---
  const apiEndpoint = '/generate'; // The endpoint from your main.py

  try {
    // Your backend expects Form Data. We create it here.
    const formData = new FormData();
    formData.append('code_snippet', text);

    const response = await fetch(apiEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantResponse = data.documentation || "No documentation generated.";

    // Update UI with formatted response
    const finalMsgElement = document.getElementById('temp-assistant-msg');
    if (finalMsgElement) {
      finalMsgElement.innerHTML = formatResponseToHTML(assistantResponse);
      finalMsgElement.id = '';
    }

    currentChat.push({ who: 'assistant', content: assistantResponse });
    saveCurrentChat();
  } catch (error) {
    console.error('Error communicating with the API:', error);
    const errorMsgElement = document.getElementById('temp-assistant-msg');
    if (errorMsgElement) {
      errorMsgElement.textContent = 'Error: Could not get response from the server.';
      errorMsgElement.id = '';
    }
  }
}

// --- EVENT LISTENERS ---
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', startNewChat);

clearHistory.addEventListener('click', () => {
  history = [];
  currentChat = [];
  currentChatId = null;
  saveHistory();
  renderHistory();
  chat.innerHTML = '';
});

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

fileInput.addEventListener('change', () => {
    previewArea.innerHTML = '';
    for (const f of fileInput.files) {
        const p = document.createElement('div');
        p.className = 'preview-item';
        p.textContent = f.name;
        previewArea.appendChild(p);
    }
});

imgBtn.addEventListener('click', () => {
    fileInput.accept = 'image/*';
    fileInput.click();
    setTimeout(() => fileInput.accept = '', 200);
});

// --- INITIALIZATION ---
renderHistory();
