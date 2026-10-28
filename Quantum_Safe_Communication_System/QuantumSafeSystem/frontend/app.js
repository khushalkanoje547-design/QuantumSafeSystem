// app.js

// --- 1. LOGIN LOGIC ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); 
        const emailInput = document.querySelector('input[type="email"]').value;
        const username = emailInput.split('@')[0]; 
        
        localStorage.setItem('username', username);
        window.location.href = 'chat.html'; 
    });
}

// --- 2. CHAT LOGIC (Quantum-Safe E2E + File Sharing) ---
const chatForm = document.getElementById('chatForm');
if (chatForm) {
    const socket = io();
    const currentUser = localStorage.getItem('username') || 'Unknown';
    const messageInput = document.getElementById('messageInput');
    const fileInput = document.getElementById('fileInput');
    const chatContainer = document.getElementById('chatContainer');

    const targetUser = currentUser === 'alice' ? 'bob' : 'alice'; 

    socket.emit('register_user', currentUser);
    console.log(`${currentUser} registered on socket.`);

    const demoSharedSecret = new Uint8Array(32); 
    const sessionKey = QuantumCrypto.deriveAESKey(demoSharedSecret);
    console.log("Client-side AES Session Key ready.");

    // --- Send Message & File ---
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const plaintext = messageInput.value.trim();
        const file = fileInput.files[0];

        let contentToSend = plaintext;
        let isFile = false;

        // Agar file select ki hai, toh pehle use read karo
        if (file) {
            const reader = new FileReader();
            contentToSend = await new Promise((resolve) => {
                reader.onload = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            isFile = true;
        }

        if (!contentToSend) return;

        // Browser ke andar file/text ko encrypt karna
        const encryptedData = QuantumCrypto.encryptMessage(contentToSend, sessionKey);
        
        socket.emit('send_secure_message', {
            sender: currentUser,
            receiver: targetUser,
            ciphertext: encryptedData.ciphertext,
            nonce: encryptedData.nonce,
            authTag: encryptedData.authTag,
            isFile: isFile
        });

        appendMessage('You', isFile ? `📁 File sent: ${file.name}` : plaintext, 'out', false, isFile ? contentToSend : null);
        
        messageInput.value = ''; 
        fileInput.value = ''; 
    });

    // --- Receive Message ---
    socket.on('receive_secure_message', (data) => {
        try {
            // Decrypt inside the browser
            const decryptedData = QuantumCrypto.decryptMessage(
                data.ciphertext, 
                data.nonce, 
                data.authTag, 
                sessionKey
            );
            
            if (data.isFile) {
                appendMessage(data.sender, "📁 Secure File Received", 'in', false, decryptedData);
            } else {
                appendMessage(data.sender, decryptedData, 'in');
            }

        } catch (error) {
            console.error("Integrity check failed!", error);
            appendMessage(data.sender, "⚠️ [Decryption Failed - Tampered Data]", 'in', true);
        }
    });

    // --- UI Helper Function ---
    function appendMessage(sender, text, type, isError = false, fileData = null) {
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const alignment = type === 'out' ? 'self-end' : 'self-start';
        const bgColor = type === 'out' ? 'btn-green text-white' : (isError ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white border-gray-200 text-gray-800');
        
        let mediaHtml = '';
        if (fileData) {
            // Agar file image hai toh dikha do
            if (fileData.startsWith('data:image')) {
                mediaHtml = `<img src="${fileData}" class="mt-2 rounded max-w-xs max-h-48 object-cover">`;
            } else {
                mediaHtml = `<a href="${fileData}" download="secure_file" class="mt-2 text-sm underline block">Download File</a>`;
            }
        }

        const html = `
            <div class="${alignment} max-w-md mt-4">
                <div class="border rounded p-4 shadow-sm ${bgColor}">
                    <p class="font-semibold text-xs opacity-75 mb-1">${sender}</p>
                    <p>${text}</p>
                    ${mediaHtml}
                </div>
                <p class="text-xs text-gray-500 mt-2 px-1 ${type === 'out' ? 'text-right' : ''}">${time}</p>
            </div>
        `;
        chatContainer.insertAdjacentHTML('beforeend', html);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}