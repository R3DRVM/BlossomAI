#!/usr/bin/env node

// Resolve API base and allowed origin
const API_BASE =
  process.env.API_BASE ||
  process.env.VITE_API_BASE ||
  `http://localhost:${process.env.PORT || 5050}`;

const ALLOWED = (process.env.ALLOWED_ORIGINS || '').split(',')[0] || 'http://localhost:5000';

import { dataFacade } from '../server/data/facade.ts';

console.log('Data Provider Smoke Test');
console.log('========================');

const capabilities = [
  { name: 'prices', test: () => dataFacade.getPrices(['USDC', 'WETH', 'SOL']) },
  { name: 'yields', test: () => dataFacade.getYields({ chain: 'solana', limit: 5 }) },
  { name: 'tvl', test: () => dataFacade.getTVL({ chain: 'solana' }) },
  { name: 'risk', test: () => dataFacade.getRiskScores({ protocols: ['raydium', 'orca'] }) }
];

console.log('Capability\tMode\tProvider\tTTL\tStatus');

const results = [];

for (const cap of capabilities) {
  const status = dataFacade.getProviderStatus();
  const mode = status[cap.name];
  const provider = mode === 'live' ? 'DefiLlama' : 'Mock';
  const ttl = cap.name === 'prices' ? '15s' : cap.name === 'yields' ? '120s' : '60s';
  
  try {
    const start = Date.now();
    const result = await cap.test();
    const duration = Date.now() - start;
    
    const isValid = result && 
                   result.schemaVersion === 'v1' && 
                   result.provenance && 
                   result.data && 
                   Array.isArray(result.data);
    
    const status = isValid ? '✅' : '❌';
    console.log(`${cap.name}\t\t${mode}\t${provider}\t${ttl}\t${status} (${duration}ms)`);
    
    results.push({ capability: cap.name, status: isValid, duration });
  } catch (error) {
    console.log(`${cap.name}\t\t${mode}\t${provider}\t${ttl}\t❌ (${error.message})`);
    results.push({ capability: cap.name, status: false, error: error.message });
  }
}

console.log('\nSummary:');
const passed = results.filter(r => r.status).length;
const total = results.length;
console.log(`${passed}/${total} capabilities passed`);

if (passed === total) {
  console.log('✅ All data providers healthy');
  process.exit(0);
} else {
  console.log('❌ Some data providers failed');
  process.exit(1);
}
