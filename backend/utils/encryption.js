const crypto = require('crypto');
require('dotenv').config();

// User provided key: GKTHMS@2025
// We must derive a 32-byte key from this passphrase for AES-256.
// Using SHA-256 hash of the key is a standard way to get 32 bytes.
const RAW_KEY = process.env.ENCRYPTION_KEY || 'GKTHMS@2025';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(RAW_KEY)).digest();

const IV_LENGTH = 16;

function encrypt(text) {
    if (!text) return text;

    try {
        let iv = crypto.randomBytes(IV_LENGTH);
        let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);

        encrypted = Buffer.concat([encrypted, cipher.final()]);

        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}

function decrypt(text) {
    if (!text) return text;

    // Check if text is in valid format (iv:content)
    if (!text.includes(':')) return text;

    try {
        let textParts = text.split(':');
        let iv = Buffer.from(textParts.shift(), 'hex');
        let encryptedText = Buffer.from(textParts.join(':'), 'hex');
        let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);

        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return text;
    }
}

function mask(text) {
    if (!text || text.length < 4) return text;
    const visibleDigits = 4;
    return '*'.repeat(text.length - visibleDigits) + text.slice(-visibleDigits);
}

module.exports = { encrypt, decrypt, mask };
