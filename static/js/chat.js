document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');
    const conversationList = document.getElementById('conversation-list');
    const themeToggle = document.getElementById('theme-toggle');
    const newChatBtn = document.getElementById('new-chat-btn');

    let currentConversationId = null;

    // Theme Toggle
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const icon = themeToggle.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        // Clear current conversation
        currentConversationId = null;
        chatMessages.innerHTML = '';
        
        // Update active state in conversation list
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Focus on input
        messageInput.focus();
    });

    // Load conversations
    const loadConversations = async () => {
        try {
            const response = await fetch('/api/conversations');
            const conversations = await response.json();
            
            conversationList.innerHTML = conversations.map(conv => `
                <div class="conversation-item ${conv.id === currentConversationId ? 'active' : ''}" 
                     data-id="${conv.id}">
                    <div class="conversation-preview">
                        ${conv.preview}
                    </div>
                    <div class="conversation-timestamp">
                        ${new Date(conv.timestamp).toLocaleString()}
                    </div>
                </div>
            `).join('');

            // Add click handlers to conversation items
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.addEventListener('click', () => loadConversation(item.dataset.id));
            });
        } catch (error) {
            console.error('Error loading conversations:', error);
        }
    };

    // Load specific conversation
    const loadConversation = async (conversationId) => {
        try {
            currentConversationId = conversationId;
            const response = await fetch(`/api/conversation/${conversationId}`);
            const messages = await response.json();
            
            chatMessages.innerHTML = messages.map(msg => `
                <div class="message ${msg.role === 'user' ? 'user' : 'bot'}">
                    ${msg.content}
                </div>
            `).join('');
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
            
            // Update active state in conversation list
            document.querySelectorAll('.conversation-item').forEach(item => {
                item.classList.toggle('active', item.dataset.id === conversationId);
            });
        } catch (error) {
            console.error('Error loading conversation:', error);
        }
    };

    // Handle message submission
    const sendMessage = async (message) => {
        if (!message) return;

        // Add user message to chat
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'message user';
        userMessageElement.textContent = message;
        chatMessages.appendChild(userMessageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    conversation_id: currentConversationId
                }),
            });

            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }

            // Add bot response to chat
            const botMessageElement = document.createElement('div');
            botMessageElement.className = 'message bot';
            botMessageElement.textContent = data.response;
            chatMessages.appendChild(botMessageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Update conversation ID if this is a new conversation
            if (!currentConversationId) {
                currentConversationId = data.conversation_id;
                loadConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorElement = document.createElement('div');
            errorElement.className = 'message bot error';
            errorElement.textContent = 'Error: Could not send message. Please try again.';
            chatMessages.appendChild(errorElement);
        }
    };

    // Handle form submission
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        sendMessage(message);
    });

    // Handle Enter key (without Shift)
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const message = messageInput.value.trim();
            sendMessage(message);
        }
    });

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Initial load of conversations
    loadConversations();
}); 