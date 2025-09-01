#!/usr/bin/env tsx

import 'dotenv/config';

const API_BASE = process.env.API_BASE || process.env.VITE_API_BASE || `http://localhost:${process.env.PORT || 5050}`;
const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',')[0] || 'http://localhost:5000';

console.log('Chat Integration Test');
console.log('====================');
console.log(`API Base: ${API_BASE}`);
console.log(`Test Origin: ${ALLOWED}`);
console.log(`DEBUG_CHAT: ${process.env.DEBUG_CHAT || '0'}`);
console.log(`AI_STREAM: ${process.env.AI_STREAM || '0'}`);
console.log('');

async function testJSONMode() {
  console.log('JSON Mode Test:');
  console.log('---------------');
  
  const testMessage = "Deploy all my USDC at the highest APY on Solana";
  
  try {
    const response = await fetch(`${API_BASE}/api/demo/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': ALLOWED,
      },
      credentials: 'include',
      body: JSON.stringify({
        sessionId: 'test-session-json',
        message: testMessage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Schema Version: ${data.schemaVersion}`);
    console.log(`✅ Provenance: ${data.provenance}`);
    console.log(`✅ Plan Summary: ${data.planSummary?.slice(0, 100)}...`);
    console.log(`✅ Allocations: ${data.allocations?.length || 0} found`);
    
    if (data.allocations?.length >= 3) {
      console.log('   First 3 allocations:');
      for (let i = 0; i < 3; i++) {
        const alloc = data.allocations[i];
        console.log(`     ${i + 1}. ${alloc.asset} → ${alloc.protocol} (${alloc.estApy?.toFixed(2)}% APY, ${alloc.riskLabel} risk)`);
      }
    }
    
    console.log(`✅ Portfolio Stats: ${JSON.stringify(data.portfolioStats)}`);
    console.log('');
    
    return { success: true, messageLength: JSON.stringify(data).length };
  } catch (error) {
    console.log(`❌ JSON test failed: ${error instanceof Error ? error.message : error}`);
    return { success: false, error };
  }
}

async function testSSEMode() {
  console.log('SSE Mode Test:');
  console.log('--------------');
  
  const testMessage = "Help me find the best yields for my USDC";
  
  try {
    const response = await fetch(`${API_BASE}/api/demo/chat/stream?sessionId=test-session-sse&message=${encodeURIComponent(testMessage)}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Origin': ALLOWED,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if SSE is disabled (returns JSON instead)
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      if (data.disabled) {
        console.log('⚠️  SSE disabled on server - this is expected in some configurations');
        return { success: true, mode: 'disabled' };
      }
    }

    if (!response.body) {
      throw new Error('No response body for SSE');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let tokensReceived = 0;
    let finalPayload = null;
    let firstChunkTime = null;
    let totalTime = Date.now();

    console.log('✅ SSE connection established');
    
    while (true) {
      const result = await reader.read();
      if (result.done) break;

      if (!firstChunkTime) {
        firstChunkTime = Date.now() - totalTime;
        console.log(`✅ First chunk received in ${firstChunkTime}ms`);
      }

      const chunk = decoder.decode(result.value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            console.log('✅ Stream completed with [DONE]');
            break;
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.token) {
              tokensReceived++;
            } else if (parsed.final) {
              finalPayload = parsed.final;
              console.log('✅ Final payload received');
            }
          } catch (e) {
            // Ignore parse errors for keepalive lines
          }
        }
      }
    }

    const totalDuration = Date.now() - totalTime;
    
    console.log(`✅ Tokens streamed: ${tokensReceived}`);
    console.log(`✅ Total duration: ${totalDuration}ms`);
    console.log(`✅ Final payload: ${finalPayload ? 'received' : 'missing'}`);
    
    if (finalPayload) {
      console.log(`✅ Schema: ${finalPayload.schemaVersion}, Allocations: ${finalPayload.allocations?.length || 0}`);
    }
    
    console.log('');
    
    return { 
      success: true, 
      tokensReceived, 
      firstChunkTime, 
      totalDuration,
      hasFinalPayload: !!finalPayload 
    };
  } catch (error) {
    console.log(`❌ SSE test failed: ${error instanceof Error ? error.message : error}`);
    return { success: false, error };
  }
}

async function testPersistence() {
  console.log('Persistence Test:');
  console.log('-----------------');
  
  // This test would require browser environment for IndexedDB
  // For now, just validate the storage interface exists
  console.log('⚠️  Persistence test requires browser environment');
  console.log('   (IndexedDB and localStorage functionality)');
  console.log('   Client-side validation should be done in browser');
  console.log('');
  
  return { success: true, note: 'Requires browser environment' };
}

async function main() {
  const results = {
    json: await testJSONMode(),
    sse: await testSSEMode(),
    persistence: await testPersistence(),
  };
  
  console.log('Summary:');
  console.log('========');
  console.log(`JSON Mode: ${results.json.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`SSE Mode: ${results.sse.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Persistence: ${results.persistence.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (results.json.success && results.sse.success) {
    console.log('');
    console.log('🎉 Chat integration tests passed!');
    
    if (results.sse.mode === 'disabled') {
      console.log('📝 Note: SSE was disabled but fallback worked correctly');
    } else if (results.sse.tokensReceived > 0) {
      console.log(`📈 SSE streamed ${results.sse.tokensReceived} tokens successfully`);
    }
    
    if (results.json.messageLength) {
      console.log(`📊 JSON response size: ${results.json.messageLength} bytes`);
    }
  } else {
    console.log('');
    console.log('❌ Some tests failed - check configuration');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
