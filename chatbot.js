// Chatbot Assistant for Admin Panel

class AdminChatbot {
    constructor() {
        this.chatContainer = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.sendButton = null;
        this.initializeChatbot();
    }

    initializeChatbot() {
        this.createChatbotUI();
        this.addEventListeners();
    }

    createChatbotUI() {
        const chatbotHTML = `
            <div id="admin-chatbot" class="admin-chatbot">
                <div class="chatbot-header">
                    <h3>Admin Assistant</h3>
                    <button id="chatbot-minimize">-</button>
                </div>
                <div class="chatbot-messages" id="chatbot-messages"></div>
                <div class="chatbot-input-container">
                    <input type="text" id="chatbot-input" placeholder="Ask me anything about the admin panel...">
                    <button id="chatbot-send">Send</button>
                </div>
            </div>
            <div id="chatbot-launcher" class="chatbot-launcher">
                <span class="material-icons">chat_bubble</span>
            </div>
        `;

        const chatbotContainer = document.createElement('div');
        chatbotContainer.innerHTML = chatbotHTML;
        document.body.appendChild(chatbotContainer);

        this.chatContainer = document.getElementById('admin-chatbot');
        this.chatMessages = document.getElementById('chatbot-messages');
        this.chatInput = document.getElementById('chatbot-input');
        this.sendButton = document.getElementById('chatbot-send');
        this.minimizeButton = document.getElementById('chatbot-minimize');
        this.launcherButton = document.getElementById('chatbot-launcher');
    }

    addEventListeners() {
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') this.sendMessage();
        });
        this.minimizeButton.addEventListener('click', () => this.toggleChatbot());
        this.launcherButton.addEventListener('click', () => this.toggleChatbot());
    }

    toggleChatbot() {
        this.chatContainer.classList.toggle('minimized');
        this.launcherButton.classList.toggle('hidden');
    }

    sendMessage() {
        const userMessage = this.chatInput.value.trim();
        if (!userMessage) return;

        this.displayMessage('user', userMessage);
        this.chatInput.value = '';

        // Simulate bot response (replace with actual AI/API integration)
        const botResponse = this.generateBotResponse(userMessage);
        setTimeout(() => {
            this.displayMessage('bot', botResponse);
        }, 500);
    }

    displayMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', `${sender}-message`);
        messageElement.innerHTML = `
            <div class="message-content">${message}</div>
            <div class="message-timestamp">${this.getCurrentTime()}</div>
        `;
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    generateBotResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        const responses = {
            'total orders': 'You can view total orders in the Orders Management section. Currently, you have 0 total orders.',
            'pending orders': 'Check the Pending Orders count in the Quick Stats section of the Welcome page.',
            'add food': 'To add a new food item, click on the "Add Food" button in the navigation or go to the "Add Food" section.',
            'revenue': 'Navigate to the Revenue Dashboard to see total revenue, today\'s revenue, and monthly revenue charts.',
            'users': 'In the Users Management section, you can search, filter, and manage user accounts.',
            'analytics': 'The Analytics section provides insights into daily orders, order status, and top-selling items.',
            'help': 'I can help you with navigation and understanding different sections of the admin panel. Ask me about total orders, pending orders, adding food, revenue, users, or analytics.'
        };

        for (const [keyword, response] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        return 'I\'m not sure about that. Try asking about total orders, pending orders, adding food, revenue, users, or analytics.';
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}

// Initialize chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AdminChatbot();
});
