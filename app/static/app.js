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

// New GitHub functionality elements
const githubBtn = document.getElementById('githubBtn');
const githubSection = document.getElementById('githubSection');
const githubUrlInput = document.getElementById('githubUrlInput');
const analyzeGithubBtn = document.getElementById('analyzeGithubBtn');
const cancelGithubBtn = document.getElementById('cancelGithubBtn');

// --- DATA STRUCTURES ---
let history = JSON.parse(localStorage.getItem('lcda_history') || '[]');
let currentChat = [];
let currentChatId = null;

// --- DRAWER FUNCTIONALITY ---
drawerBtn.addEventListener('click', () => {
    sidebar.classList.toggle('sidebar-open');
});

// --- GITHUB FUNCTIONALITY ---
githubBtn.addEventListener('click', () => {
    githubSection.style.display = githubSection.style.display === 'none' ? 'block' : 'none';
    if (githubSection.style.display === 'block') {
        githubUrlInput.focus();
    }
});

cancelGithubBtn.addEventListener('click', () => {
    githubSection.style.display = 'none';
    githubUrlInput.value = '';
});

analyzeGithubBtn.addEventListener('click', async () => {
    const githubUrl = githubUrlInput.value.trim();
    if (!githubUrl) {
        alert('Please enter a GitHub repository URL');
        return;
    }
    
    if (!githubUrl.includes('github.com')) {
        alert('Please enter a valid GitHub repository URL');
        return;
    }
    
    await analyzeGitHubRepository(githubUrl);
});

// Allow Enter key to trigger GitHub analysis
githubUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        analyzeGithubBtn.click();
    }
});

async function analyzeGitHubRepository(githubUrl) {
    const userMessage = `Analyzing GitHub repository: ${githubUrl}`;
    addMessageToUI(userMessage, 'user');
    
    const assistantMessage = addMessageToUI('🔍 Analyzing GitHub repository... This may take a moment.', 'assistant');
    
    try {
        const formData = new FormData();
        formData.append('github_url', githubUrl);
        
        const response = await fetch('/analyze-github', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            const repoInfo = data.repository_info;
            const documentation = data.documentation;
            
            // Update the assistant message with results
            const resultHtml = `
                <div class="github-analysis-result">
                    <h3>📊 Repository Analysis Complete</h3>
                    <p><strong>Repository:</strong> ${repoInfo.owner}/${repoInfo.name}</p>
                    <p><strong>Files Analyzed:</strong> ${repoInfo.files_analyzed}</p>
                    <div class="documentation-content">
                        ${formatResponseToHTML(documentation)}
                    </div>
                </div>
            `;
            assistantMessage.innerHTML = resultHtml;
            
            // Save to chat history
            currentChat.push({ role: 'user', content: userMessage });
            currentChat.push({ role: 'assistant', content: documentation });
            saveCurrentChat();
            
        } else {
            assistantMessage.innerHTML = `❌ Error analyzing repository: ${data.error}`;
        }
        
    } catch (error) {
        assistantMessage.innerHTML = `❌ Error analyzing repository: ${error.message}`;
    }
    
    // Hide GitHub section after analysis
    githubSection.style.display = 'none';
    githubUrlInput.value = '';
    
    chat.scrollTop = chat.scrollHeight;
}

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

fileInput.addEventListener('change', async () => {
    previewArea.innerHTML = '';
    if (fileInput.files.length === 0) return;
    
    // Show file previews
    for (const f of fileInput.files) {
        const p = document.createElement('div');
        p.className = 'preview-item';
        p.style.cssText = 'padding: 8px; background: rgba(255,255,255,0.1); margin: 4px 0; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;';
        
        const fileName = document.createElement('span');
        fileName.textContent = f.name;
        
        const fileSize = document.createElement('small');
        fileSize.textContent = ` (${(f.size / 1024 / 1024).toFixed(2)} MB)`;
        fileSize.style.color = 'rgba(255,255,255,0.6)';
        
        p.appendChild(fileName);
        p.appendChild(fileSize);
        previewArea.appendChild(p);
        
        // Auto-process PDFs
        if (f.name.toLowerCase().endsWith('.pdf')) {
            await uploadAndProcessFile(f);
        }
    }
});

async function uploadAndProcessFile(file) {
    const userMessage = `📎 Uploading file: ${file.name}`;
    addMessageToUI(userMessage, 'user');
    
    const assistantMessage = addMessageToUI('📄 Processing file... Please wait.', 'assistant');
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.documentation) {
                // File was processed (e.g., PDF)
                const resultHtml = `
                    <div class="file-analysis-result">
                        <h3>📄 File Analysis Complete</h3>
                        <p><strong>File:</strong> ${data.filename}</p>
                        <p><strong>Type:</strong> ${data.content_type}</p>
                        <div class="documentation-content">
                            ${formatResponseToHTML(data.documentation)}
                        </div>
                    </div>
                `;
                assistantMessage.innerHTML = resultHtml;
                
                // Save to chat history
                currentChat.push({ role: 'user', content: userMessage });
                currentChat.push({ role: 'assistant', content: data.documentation });
                saveCurrentChat();
            } else {
                assistantMessage.innerHTML = `✅ File uploaded successfully: ${data.filename}`;
            }
        } else {
            assistantMessage.innerHTML = `❌ Error uploading file: ${data.error || 'Unknown error'}`;
        }
        
    } catch (error) {
        assistantMessage.innerHTML = `❌ Error uploading file: ${error.message}`;
    }
    
    chat.scrollTop = chat.scrollHeight;
}

imgBtn.addEventListener('click', () => {
    fileInput.accept = 'image/*';
    fileInput.click();
    setTimeout(() => fileInput.accept = '', 200);
});

// --- INITIALIZATION ---
renderHistory();
