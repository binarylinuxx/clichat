// format.js - Encodes text into special characters and decodes it back

const SPECIAL_CHARS = ['!', '@', '$', '%', '#', '&', '*', '~', '+', '=', '^'];
const BASE = SPECIAL_CHARS.length;

function encode(text) {
  if (!text) {
    throw new Error('Text cannot be empty');
  }

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
    console.log('  node format.js encode <text>     - Encode text');
    console.log('  node format.js decode <encoded>  - Decode text');
    console.log('');
    console.log('Examples:');
    console.log('  node format.js encode "mypassword123"');
    console.log('  node format.js decode "!@$%#&..."');
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
    } else {
      console.error('Unknown command:', command);
      console.log('Use "encode" or "decode"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { encode, decode };
