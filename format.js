// format.js - Encodes text into special characters and decodes it back

const crypto = require('crypto');

const SPECIAL_CHARS = ['!', '@', '$', '%', '#', '&', '*', '~', '+', '=', '^'];
const BASE = SPECIAL_CHARS.length;

function encode(text, salt = null) {
  if (!text) {
    throw new Error('Text cannot be empty');
  }

  // If salt is provided, use secure hashing (for passwords)
  if (salt !== null) {
    const hash = crypto.pbkdf2Sync(text, salt, 10000, 32, 'sha256');
    let encoded = '';

    for (let i = 0; i < hash.length; i++) {
      const byte = hash[i];
      const digit1 = Math.floor(byte / BASE);
      const digit2 = byte % BASE;
      encoded += SPECIAL_CHARS[digit1 % BASE] + SPECIAL_CHARS[digit2];
    }

    return `${salt}:${encoded}`;
  }

  // Original encoding for non-password text
  let encoded = '';

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);

    // Convert to base-11 using 3 digits
    const digit1 = Math.floor(charCode / (BASE * BASE)) % BASE;
    const digit2 = Math.floor(charCode / BASE) % BASE;
    const digit3 = charCode % BASE;

    encoded += SPECIAL_CHARS[digit1] + SPECIAL_CHARS[digit2] + SPECIAL_CHARS[digit3];
  }

  return encoded;
}

function hashPassword(password) {
  if (!password) {
    throw new Error('Password cannot be empty');
  }

  // Generate random salt
  const salt = crypto.randomBytes(16).toString('hex');
  return encode(password, salt);
}

function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }

  try {
    const [salt] = storedHash.split(':');
    const newHash = encode(password, salt);
    return newHash === storedHash;
  } catch (error) {
    return false;
  }
}

function decode(encodedText) {
  if (!encodedText) {
    throw new Error('Encoded text cannot be empty');
  }

  if (encodedText.length % 3 !== 0) {
    throw new Error('Invalid encoded text format');
  }

  let decoded = '';

  for (let i = 0; i < encodedText.length; i += 3) {
    const char1 = encodedText[i];
    const char2 = encodedText[i + 1];
    const char3 = encodedText[i + 2];

    const digit1 = SPECIAL_CHARS.indexOf(char1);
    const digit2 = SPECIAL_CHARS.indexOf(char2);
    const digit3 = SPECIAL_CHARS.indexOf(char3);

    if (digit1 === -1 || digit2 === -1 || digit3 === -1) {
      throw new Error('Invalid character in encoded text');
    }

    // Convert from base-11 back to character code
    const charCode = digit1 * (BASE * BASE) + digit2 * BASE + digit3;
    decoded += String.fromCharCode(charCode);
  }

  return decoded;
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node format.js encode <text>           - Encode text');
    console.log('  node format.js decode <encoded>        - Decode text');
    console.log('  node format.js hash <password>         - Hash password');
    console.log('  node format.js verify <password> <hash> - Verify password');
    console.log('');
    console.log('Examples:');
    console.log('  node format.js encode "mytext"');
    console.log('  node format.js decode "!@$%#&..."');
    console.log('  node format.js hash "mypassword123"');
    console.log('  node format.js verify "mypassword123" "salt:hash..."');
    process.exit(0);
  }

  const command = args[0];
  const input = args.slice(1).join(' ');

  try {
    if (command === 'encode') {
      const encoded = encode(input);
      console.log('Encoded:', encoded);
    } else if (command === 'decode') {
      const decoded = decode(input);
      console.log('Decoded:', decoded);
    } else if (command === 'hash') {
      const hashed = hashPassword(input);
      console.log('Hashed:', hashed);
    } else if (command === 'verify') {
      const password = args[1];
      const hash = args[2];
      const valid = verifyPassword(password, hash);
      console.log('Valid:', valid);
    } else {
      console.error('Unknown command:', command);
      console.log('Use "encode", "decode", "hash", or "verify"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { encode, decode, hashPassword, verifyPassword };
