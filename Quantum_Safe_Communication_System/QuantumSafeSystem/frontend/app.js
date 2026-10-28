// app.js

// 1. Login Page Logic
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        // Direct chat page par redirect karega
        window.location.href = 'chat.html'; 
    });
}

// 2. Chat Page Logic
const chatForm = document.getElementById('chatForm');
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('messageInput');
        if (input.value.trim() !== '') {
            console.log("Message to send:", input.value);
            // Input field clear kar dega message bhejne ke baad
            input.value = ''; 
        }
    });
}