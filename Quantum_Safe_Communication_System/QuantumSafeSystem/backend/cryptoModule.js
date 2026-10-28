const kyber = require('crystals-kyber');
const crypto = require('crypto');

// 1. ML-KEM-768: Key Pair Generation
function generateKeyPair() {
    return kyber.KeyGen768(); // Returns array: [publicKey, secretKey]
}

// 2. ML-KEM-768: Encapsulation
function encapsulate(publicKey) {
    return kyber.Encrypt768(publicKey); // Returns array: [ciphertext, sharedSecret]
}

// 3. ML-KEM-768: Decapsulation
function decapsulate(ciphertext, secretKey) {
    return kyber.Decrypt768(ciphertext, secretKey); // Returns sharedSecret
}

// 4. HKDF: Derive AES-256 Key from Shared Secret
function deriveAESKey(sharedSecretArray) {
    const sharedSecret = Buffer.from(sharedSecretArray);
    return crypto.hkdfSync('sha256', sharedSecret, Buffer.alloc(0), 'session-bound-info', 32);
}

// 5. AES-256-GCM: Encrypt Message
function encryptMessage(message, key) {
    const nonce = crypto.randomBytes(12); // Unique 96-bit nonce
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    
    let ciphertext = cipher.update(message, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    
    return {
        ciphertext,
        nonce: nonce.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

// 6. AES-256-GCM: Decrypt & Verify Message
function decryptMessage(ciphertext, nonceHex, authTagHex, key) {
    const nonce = Buffer.from(nonceHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    generateKeyPair, encapsulate, decapsulate, deriveAESKey, encryptMessage, decryptMessage
};