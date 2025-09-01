// Quick test of small-talk detection (Node.js compatible)

const SMALL_TALK_PATTERNS = {
  greeting: ['hi','hey','hello','yo','gm','good morning','good evening','whats up','sup'],
  help: ['help','what can you do','how do you work','what can i ask'],
  thanks: ['thanks','thank you','ty','appreciate it'],
  affirm: ['yes','y','yeah','yup','ok','okay','sure','sounds good','hmm ok','fine'],
  deny: ['no','n','nope','nah'],
  reset: ['reset','start over','clear','new conversation','begin again'],
};

function detectSmallTalk(message) {
  // Normalize: lowercase, trim, strip punctuation
  const normalized = message.toLowerCase().trim().replace(/[.!?,:;]/g, '');
  
  // Helper function to check if normalized message matches any phrase in a list
  const matchesAny = (phrases) => 
    phrases.some(phrase => normalized === phrase);
  
  // Check for reset intent first
  if (matchesAny(SMALL_TALK_PATTERNS.reset)) {
    return 'reset';
  }
  
  // Check other small-talk patterns in priority order
  if (matchesAny(SMALL_TALK_PATTERNS.greeting)) {
    return 'greeting';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.help)) {
    return 'help';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.thanks)) {
    return 'thanks';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.affirm)) {
    return 'affirm';
  }
  
  if (matchesAny(SMALL_TALK_PATTERNS.deny)) {
    return 'deny';
  }
  
  // Check for unknown (short message with no meaningful content) AFTER other checks
  const TOKENS = ['USDC', 'USDT', 'DAI', 'WETH', 'ETH', 'SOL', 'WBTC', 'BTC'];
  const CHAINS = ['solana', 'ethereum', 'arbitrum', 'base', 'polygon'];
  
  const tokens = normalized.split(/\s+/).filter(t => t.length > 0);
  if (tokens.length < 4 && !tokens.some(token => 
    TOKENS.some(t => t.toLowerCase().includes(token)) ||
    CHAINS.some(c => c.includes(token)) ||
    /\d/.test(token) ||
    /(?:deploy|invest|allocate|rebalance|alert|yield|apy|apr|risk|strategy|find|show)/.test(token)
  )) {
    return 'unknown';
  }
  
  return null;
}

// Test cases
const testCases = [
  { input: "hi", expected: "greeting" },
  { input: "hey", expected: "greeting" },
  { input: "hello", expected: "greeting" },
  { input: "yo", expected: "greeting" },
  { input: "gm", expected: "greeting" },
  { input: "good morning", expected: "greeting" },
  { input: "whats up", expected: "greeting" },
  { input: "what can you do?", expected: "help" },
  { input: "help", expected: "help" },
  { input: "how do you work", expected: "help" },
  { input: "what can i ask", expected: "help" },
  { input: "thanks", expected: "thanks" },
  { input: "thank you", expected: "thanks" },
  { input: "ty", expected: "thanks" },
  { input: "appreciate it", expected: "thanks" },
  { input: "yes", expected: "affirm" },
  { input: "yeah", expected: "affirm" },
  { input: "yup", expected: "affirm" },
  { input: "ok", expected: "affirm" },
  { input: "sure", expected: "affirm" },
  { input: "hmm ok", expected: "affirm" },
  { input: "fine", expected: "affirm" },
  { input: "no", expected: "deny" },
  { input: "nope", expected: "deny" },
  { input: "nah", expected: "deny" },
  { input: "uhm", expected: "unknown" },
  { input: "hm", expected: "unknown" },
  { input: "reset", expected: "reset" },
  { input: "start over", expected: "reset" },
  { input: "clear", expected: "reset" },
  { input: "deploy 10m usdc on solana", expected: null },
  { input: "find yield sources", expected: null },
];

console.log("=== SMALL-TALK DETECTION TESTS ===");
let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = detectSmallTalk(input);
  const status = result === expected ? "✅" : "❌";
  if (result === expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} "${input}" → Expected: ${expected}, Got: ${result}`);
  }
});

console.log(`\nResults: ${passed} passed, ${failed} failed`);
console.log('✅ Small-talk tests passed');

if (failed > 0) {
  process.exit(1);
}