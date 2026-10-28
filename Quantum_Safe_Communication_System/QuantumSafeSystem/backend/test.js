const { generateKeyPair, encapsulate, decapsulate, deriveAESKey, encryptMessage, decryptMessage } = require('./cryptoModule');
const crypto = require('crypto');

console.log("--- Starting Phase 2 Crypto Tests ---\n");

// Setup ML-KEM Keys & Secrets
console.log("Setting up ML-KEM-768 keys...");
const [alicePk, aliceSk] = generateKeyPair();
const [bobCt, bobSharedSecret] = encapsulate(alicePk);
const aliceSharedSecret = decapsulate(bobCt, aliceSk);

// Derive AES Keys using HKDF
const bobAesKey = deriveAESKey(bobSharedSecret);
const aliceAesKey = deriveAESKey(aliceSharedSecret);

const originalMessage = "Strictly confidential project data.";
console.log(`Original Message: "${originalMessage}"\n`);

// ---------------------------------------------------------
// Test 1: Sahi key se decrypt hota hai
try {
    const encrypted = encryptMessage(originalMessage, bobAesKey);
    const decrypted = decryptMessage(encrypted.ciphertext, encrypted.nonce, encrypted.authTag, aliceAesKey);
    console.log("✅ Test 1 Passed: Sahi key se decryption successful.");
} catch (e) {
    console.log("❌ Test 1 Failed:", e.message);
}

// ---------------------------------------------------------
// Test 2: Galat key se fail hota hai
try {
    const encrypted = encryptMessage(originalMessage, bobAesKey);
    const wrongKey = crypto.randomBytes(32); // Random 256-bit fake key
    decryptMessage(encrypted.ciphertext, encrypted.nonce, encrypted.authTag, wrongKey);
    console.log("❌ Test 2 Failed: Galat key se bhi decrypt ho gaya!");
} catch (e) {
    console.log("✅ Test 2 Passed: Galat key par decryption fail hua (Expected).");
}

// ---------------------------------------------------------
// Test 3: Ciphertext badalne par tag verification fail hota hai
try {
    const encrypted = encryptMessage(originalMessage, bobAesKey);
    // Tampering the ciphertext
    const tamperedCt = encrypted.ciphertext.substring(0, encrypted.ciphertext.length - 1) + (encrypted.ciphertext.endsWith('0') ? '1' : '0');
    decryptMessage(tamperedCt, encrypted.nonce, encrypted.authTag, aliceAesKey);
    console.log("❌ Test 3 Failed: Tampered data bina error accept ho gaya!");
} catch (e) {
    console.log("✅ Test 3 Passed: Ciphertext tampering par authTag verification fail hua (Expected).");
}

// ---------------------------------------------------------
// Test 4: Mismatched ML-KEM key pair par fail hota hai
try {
    const [evePk, eveSk] = generateKeyPair(); // Eve's different key pair
    const eveSharedSecret = decapsulate(bobCt, eveSk); 
    const eveAesKey = deriveAESKey(eveSharedSecret); // Wrong derived key
    
    const encrypted = encryptMessage(originalMessage, bobAesKey);
    decryptMessage(encrypted.ciphertext, encrypted.nonce, encrypted.authTag, eveAesKey);
    console.log("❌ Test 4 Failed: Mismatched ML-KEM key ne message decrypt kar liya!");
} catch (e) {
    console.log("✅ Test 4 Passed: Mismatched ML-KEM key se decryption fail hua (Expected).");
}

console.log("\n--- Phase 2 Testing Complete ---");
