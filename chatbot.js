(function () {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .chat-widget-toggle {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #10b981;
            color: #0b132b;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            z-index: 9999;
            transition: transform 0.2s ease;
        }

        .chat-widget-toggle:hover {
            transform: scale(1.08);
        }

        .chat-container {
            position: fixed;
            bottom: 90px;
            right: 24px;
            width: 350px;
            height: 480px;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            display: none;
            flex-direction: column;
            overflow: hidden;
            z-index: 9999;
            font-family: system-ui, -apple-system, sans-serif;
        }

        .chat-container.open {
            display: flex;
        }

        .chat-header {
            background-color: #0b132b;
            padding: 14px 16px;
            border-bottom: 1px solid #1f2937;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #f9fafb;
            font-weight: 600;
            font-size: 0.95rem;
        }

        .chat-header span.status {
            display: inline-block;
            width: 8px;
            height: 8px;
            background-color: #10b981;
            border-radius: 50%;
            margin-right: 6px;
        }

        .chat-close-btn {
            background: none;
            border: none;
            color: #9ca3af;
            cursor: pointer;
            font-size: 18px;
        }

        .chat-messages {
            flex: 1;
            padding: 14px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
            background-color: #0d1322;
        }

        .chat-msg {
            max-width: 80%;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 0.875rem;
            line-height: 1.4;
        }

        .chat-msg.bot {
            background-color: #1f2937;
            color: #e5e7eb;
            align-self: flex-start;
            border-bottom-left-radius: 2px;
        }

        .chat-msg.user {
            background-color: #10b981;
            color: #064e3b;
            font-weight: 500;
            align-self: flex-end;
            border-bottom-right-radius: 2px;
        }

        .chat-input-area {
            padding: 12px;
            border-top: 1px solid #1f2937;
            background-color: #111827;
            display: flex;
            gap: 8px;
        }

        .chat-input-area input {
            flex: 1;
            background-color: #1f2937;
            border: 1px solid #374151;
            color: #fff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
            outline: none;
        }

        .chat-input-area input:focus {
            border-color: #10b981;
        }

        .chat-input-area button {
            background-color: #10b981;
            color: #0b132b;
            border: none;
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML Markup
    const widget = document.createElement('div');
    widget.innerHTML = `
        <button class="chat-widget-toggle" id="chatToggleBtn">💬</button>
        <div class="chat-container" id="chatWindow">
            <div class="chat-header">
                <div><span class="status"></span> Value Assistant</div>
                <button class="chat-close-btn" id="chatCloseBtn">✕</button>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div class="chat-msg bot">Hello! Ask me anything about tracking item value, cost per ounce, or shrinkflation.</div>
            </div>
            <form class="chat-input-area" id="chatForm">
                <input type="text" id="chatInput" placeholder="Ask a question..." required autocomplete="off">
                <button type="submit">Send</button>
            </form>
        </div>
    `;
    document.body.appendChild(widget);

    // 3. Logic & Event Listeners
    const toggleBtn = document.getElementById('chatToggleBtn');
    const closeBtn = document.getElementById('chatCloseBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    toggleBtn.addEventListener('click', () => chatWindow.classList.toggle('open'));
    closeBtn.addEventListener('click', () => chatWindow.classList.remove('open'));

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (!text) return;

        // Render user message
        appendMessage(text, 'user');
        chatInput.value = '';

        // Fetch response from serverless backend API
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            appendMessage(data.reply || "Sorry, I couldn't process that request.", 'bot');
        } catch (err) {
            appendMessage("Unable to connect to assistant backend.", 'bot');
        }
    });

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-msg ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
})();
