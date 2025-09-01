#!/usr/bin/env node

// Resolve API base and allowed origin
const API_BASE =
  process.env.API_BASE ||
  process.env.VITE_API_BASE ||
  `http://localhost:${process.env.PORT || 5050}`;

const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',')[0] || 'http://localhost:5000';

console.log('Demo Chat Smoke Test');
console.log('===================');
console.log(`API Base: ${API_BASE}`);
console.log(`Allowed Origin: ${ALLOWED}`);

const testPrompt = "Deploy all my USDC at the highest APY on Solana";

async function testChat() {
  try {
    const response = await fetch(`${API_BASE}/api/demo/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
      },
      body: JSON.stringify({
        sessionId: 'smoke-test',
        message: testPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Chat endpoint responded successfully');
    console.log('\nResponse Analysis:');
    console.log('==================');
    
    // Check schema
    if (result.schemaVersion === 'v1') {
      console.log('✅ Schema version: v1');
    } else {
      console.log('❌ Invalid schema version:', result.schemaVersion);
    }
    
    if (result.provenance) {
      console.log('✅ Provenance:', result.provenance);
    } else {
      console.log('❌ Missing provenance');
    }
    
    // Check plan summary
    if (result.planSummary && typeof result.planSummary === 'string') {
      console.log('✅ Plan summary:', result.planSummary.substring(0, 100) + '...');
    } else {
      console.log('❌ Missing or invalid plan summary');
    }
    
    // Check allocations
    if (result.allocations && Array.isArray(result.allocations) && result.allocations.length > 0) {
      console.log('✅ Allocations found:', result.allocations.length);
      console.log('\nFirst 3 allocations:');
      result.allocations.slice(0, 3).forEach((alloc, i) => {
        console.log(`  ${i + 1}. ${alloc.asset} → ${alloc.protocol} (${alloc.estApy.toFixed(2)}% APY, ${alloc.riskLabel} risk)`);
      });
    } else {
      console.log('❌ Missing or invalid allocations');
    }
    
    // Check strategy
    if (result.strategy && typeof result.strategy === 'object') {
      console.log('✅ Strategy payload keys:', Object.keys(result.strategy));
    } else {
      console.log('❌ Missing strategy payload');
    }
    
    // Check portfolio stats
    if (result.portfolioStats && typeof result.portfolioStats === 'object') {
      console.log('✅ Portfolio stats:', {
        totalValue: result.portfolioStats.totalValue,
        avgApy: result.portfolioStats.avgApy?.toFixed(2) + '%',
        riskScore: result.portfolioStats.riskScore?.toFixed(1),
        diversification: result.portfolioStats.diversification?.toFixed(2)
      });
    } else {
      console.log('❌ Missing portfolio stats');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Chat test failed:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\nCORS Test');
  console.log('=========');
  
  try {
    // Test with origin
    const response = await fetch(`${API_BASE}/api/demo/health`, {
      headers: {
        'Origin': ALLOWED,
      }
    });
    
    const acao = response.headers.get('Access-Control-Allow-Origin');
    const acc = response.headers.get('Access-Control-Allow-Credentials');
    const vary = response.headers.get('Vary');
    
    console.log('Allowed origin + Cookie → /api/demo/health:');
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  ACAO: ${acao}`);
    console.log(`  ACC: ${acc}`);
    console.log(`  Vary: ${vary}`);
    
    const corsOk = response.ok && acao === ALLOWED && acc === 'true' && vary?.includes('Origin');
    console.log(corsOk ? '✅ CORS configured correctly' : '❌ CORS misconfigured');
    
    return corsOk;
  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    return false;
  }
}

async function main() {
  const chatOk = await testChat();
  const corsOk = await testCORS();
  
  console.log('\nSummary:');
  console.log('========');
  console.log(`Chat: ${chatOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS: ${corsOk ? '✅ PASS' : '❌ FAIL'}`);
  
  if (chatOk && corsOk) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Test runner failed:', error);
  process.exit(1);
});
