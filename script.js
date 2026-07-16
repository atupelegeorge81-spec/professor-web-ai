/* ============================================
   PROFESSOR AI - MAIN SCRIPT
   Chat Logic & Groq API Integration
   ============================================ */

class ProfessorAI {
    constructor() {
        this.messages = [];
        this.conversationHistory = [];
        this.isLoading = false;
        this.currentChatId = this.generateChatId();
        this.initializeElements();
        this.loadHistory();
        this.attachEventListeners();
    }

    /* ============ INITIALIZATION ============ */
    initializeElements() {
        this.messagesArea = document.getElementById('messagesArea');
        this.userInput = document.getElementById('userInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.chatHistory = document.getElementById('chatHistory');
        this.newChatBtn = document.getElementById('newChatBtn');
    }

    attachEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize message input text area
        this.userInput.addEventListener('input', () => {
            this.userInput.style.height = 'auto';
            this.userInput.style.height = (this.userInput.scrollHeight) + 'px';
        });

        // Quick prompts
        const quickPrompts = document.querySelectorAll('.quick-prompt-item');
        quickPrompts.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                this.userInput.value = target.dataset.prompt;
                this.userInput.focus();
                this.userInput.dispatchEvent(new Event('input'));
            });
        });

        this.newChatBtn.addEventListener('click', () => this.newChat());
    }

    /* ============ CHAT MANAGEMENT ============ */
    generateChatId() {
        return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    newChat() {
        this.messages = [];
        this.conversationHistory = [];
        this.currentChatId = this.generateChatId();
        this.messagesArea.innerHTML = `
            <div class="welcome-section">
                <div class="welcome-logo">
                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <rect x="20" y="15" width="60" height="65" rx="8" fill="none" stroke="#00ff66" stroke-width="2"/>
                        <circle cx="35" cy="35" r="6" fill="#00ff66"/>
                        <circle cx="65" cy="35" r="6" fill="#00ff66"/>
                        <line x1="30" y1="10" x2="30" y2="0" stroke="#00ff66" stroke-width="2"/>
                        <circle cx="30" cy="0" r="3" fill="#00ff66"/>
                        <line x1="70" y1="10" x2="70" y2="0" stroke="#00ff66" stroke-width="2"/>
                        <circle cx="70" cy="0" r="3" fill="#00ff66"/>
                        <path d="M 40 50 L 60 50" stroke="#00ff66" stroke-width="2" fill="none"/>
                        <circle cx="40" cy="65" r="3" fill="#00ff66"/>
                        <circle cx="50" cy="65" r="3" fill="#00ff66"/>
                        <circle cx="60" cy="65" r="3" fill="#00ff66"/>
                    </svg>
                </div>
                <h3>Professor AI</h3>
                <p>Fresh start! Niambie, una changamoto gani ya code leo?</p>
                <div class="quick-prompts">
                    <div class="quick-prompt-item" data-prompt="Write code">
                        <div class="prompt-icon">&lt;/&gt;</div>
                        <span>Write code</span>
                        <div class="prompt-arrow">→</div>
                    </div>
                    <div class="quick-prompt-item" data-prompt="Debug issues">
                        <div class="prompt-icon">🐛</div>
                        <span>Debug issues</span>
                        <div class="prompt-arrow">→</div>
                    </div>
                    <div class="quick-prompt-item" data-prompt="Learn anything">
                        <div class="prompt-icon">🎓</div>
                        <span>Learn anything</span>
                        <div class="prompt-arrow">→</div>
                    </div>
                    <div class="quick-prompt-item" data-prompt="Generate ideas">
                        <div class="prompt-icon">💡</div>
                        <span>Generate ideas</span>
                        <div class="prompt-arrow">→</div>
                    </div>
                </div>
            </div>
        `;
        this.userInput.value = '';
        this.userInput.style.height = 'auto';
        this.updateChatHistory();
        this.attachQuickPromptsListeners();
    }

    attachQuickPromptsListeners() {
        const quickPrompts = this.messagesArea.querySelectorAll('.quick-prompt-item');
        quickPrompts.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget;
                this.userInput.value = target.dataset.prompt;
                this.userInput.focus();
                this.userInput.dispatchEvent(new Event('input'));
            });
        });
    }

    /* ============ MESSAGE HANDLING ============ */
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;

        // Add user message to UI
        this.displayMessage(message, 'user');
        this.userInput.value = '';
        this.userInput.style.height = 'auto';

        // Add to conversation history
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Show loading
        this.setLoading(true);

        try {
            const response = await this.callGroqAPI();
            this.displayMessage(response, 'ai');
            this.conversationHistory.push({
                role: 'assistant',
                content: response
            });
            this.saveHistory();
        } catch (error) {
            console.error('Error:', error);
            this.displayMessage(`Oops! ${error.message}`, 'ai');
        } finally {
            this.setLoading(false);
        }
    }

    displayMessage(content, sender) {
        // Remove welcome section if this is first message
        const welcome = this.messagesArea.querySelector('.welcome-section');
        if (welcome) welcome.remove();

        // ChatGPT-style structure
        const messageRow = document.createElement('div');
        messageRow.className = `message-row ${sender}`;

        const wrapper = document.createElement('div');
        wrapper.className = 'message-content-wrapper';

        const avatarContainer = document.createElement('div');
        avatarContainer.className = 'message-avatar-container';

        const img = document.createElement('img');
        img.className = 'msg-avatar';
        if (sender === 'ai') {
            img.src = 'robot.png';
            img.alt = 'Professor AI';
        } else {
            img.src = 'cyborg-avatar.png';
            img.alt = 'User';
        }
        avatarContainer.appendChild(img);

        const body = document.createElement('div');
        body.className = 'message-body';
        
        // Format content (simple markdown support)
        let formattedContent = this.formatContent(content);
        body.innerHTML = formattedContent;

        wrapper.appendChild(avatarContainer);
        wrapper.appendChild(body);
        messageRow.appendChild(wrapper);

        this.messagesArea.appendChild(messageRow);

        // Scroll to bottom
        this.messagesArea.scrollTop = this.messagesArea.scrollHeight;
    }

    formatContent(text) {
        // Simple markdown-like formatting
        let formatted = text
            .replace(/```(.*?)\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang}">${this.escapeHtml(code.trim())}</code></pre>`;
            })
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        return formatted;
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    /* ============ GROQ API ============ */
    async callGroqAPI() {
        const payload = {
            model: CONFIG.MODEL,
            messages: [
                {
                    role: 'system',
                    content: CONFIG.SYSTEM_PROMPT
                },
                ...this.conversationHistory
            ],
            temperature: CONFIG.TEMPERATURE,
            max_tokens: CONFIG.MAX_TOKENS,
            top_p: CONFIG.TOP_P
        };

        try {
            const response = await fetch(CONFIG.GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            throw new Error(`Failed to connect to Professor: ${error.message}`);
        }
    }

    /* ============ UI UTILITIES ============ */
    setLoading(loading) {
        this.isLoading = loading;
        if (loading) {
            this.loadingIndicator.classList.add('active');
        } else {
            this.loadingIndicator.classList.remove('active');
        }
    }

    /* ============ LOCAL STORAGE ============ */
    saveHistory() {
        const chatData = {
            id: this.currentChatId,
            messages: this.conversationHistory,
            timestamp: new Date().toISOString(),
            title: this.conversationHistory[0]?.content.substring(0, 50) || 'New Chat'
        };

        let allChats = JSON.parse(localStorage.getItem('professorChats') || '[]');
        
        // Check if this chat already exists
        const existingIndex = allChats.findIndex(c => c.id === this.currentChatId);
        if (existingIndex > -1) {
            allChats[existingIndex] = chatData;
        } else {
            allChats.unshift(chatData);
        }

        // Keep only last 20 chats
        allChats = allChats.slice(0, 20);
        localStorage.setItem('professorChats', JSON.stringify(allChats));
        this.updateChatHistory();
    }

    loadHistory() {
        const allChats = JSON.parse(localStorage.getItem('professorChats') || '[]');
        this.updateChatHistory();

        // Optionally load a specific chat if needed
        if (allChats.length > 0) {
            const lastChat = allChats[0];
            // Don't auto-load, just show in history
        }
    }

    updateChatHistory() {
        const allChats = JSON.parse(localStorage.getItem('professorChats') || '[]');
        
        if (allChats.length === 0) {
            this.chatHistory.innerHTML = '<p class="empty-state">No conversations yet</p>';
            return;
        }

        this.chatHistory.innerHTML = allChats.map(chat => `
            <div class="chat-item" onclick="professor.loadChat('${chat.id}')">
                ${chat.title}
            </div>
        `).join('');
    }

    loadChat(chatId) {
        const allChats = JSON.parse(localStorage.getItem('professorChats') || '[]');
        const chat = allChats.find(c => c.id === chatId);
        
        if (!chat) return;

        this.currentChatId = chatId;
        this.conversationHistory = chat.messages;
        this.messagesArea.innerHTML = '';

        // Display all messages
        chat.messages.forEach(msg => {
            this.displayMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
        });
    }
}

/* ============ INITIALIZATION ============ */
let professor;

document.addEventListener('DOMContentLoaded', () => {
    professor = new ProfessorAI();
    console.log('✅ Professor AI initialized and ready!');
});
