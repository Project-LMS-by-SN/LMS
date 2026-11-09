#!/usr/bin/env node

/**
 * Sequential Test Runner for Library Management System
 * Executes Unit -> Integration -> API -> E2E test suites in order.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const suites = [
  {
    name: 'Unit Tests (Frontend & Backend)',
    type: 'Vitest',
    cmd: npxCmd,
    args: ['vitest', 'run', 'tests/unit'],
    flag: '--unit',
  },
  {
    name: 'Integration Tests (Frontend & Backend)',
    type: 'Vitest',
    cmd: npxCmd,
    args: ['vitest', 'run', 'tests/integration'],
    flag: '--integration',
  },
  {
    name: 'API Endpoint Tests',
    type: 'Supertest',
    cmd: npxCmd,
    args: ['vitest', 'run', 'tests/api'],
    flag: '--api',
  },
  {
    name: 'UI & E2E Userflow Tests',
    type: 'Playwright',
    cmd: npxCmd,
    args: ['playwright', 'test'],
    flag: '--e2e',
  },
];

const userArgs = process.argv.slice(2);
const skipE2E = userArgs.includes('--skip-e2e');
const hasSpecificFlag = suites.some(s => userArgs.includes(s.flag));

const selectedSuites = suites.filter(s => {
  if (skipE2E && s.flag === '--e2e') return false;
  if (hasSpecificFlag) return userArgs.includes(s.flag);
  return true;
});

console.log('\n=============================================================');
console.log('       🚀  SEQUENTIAL TEST SUITE RUNNER  🚀');
console.log('=============================================================\n');
console.log(`Executing ${selectedSuites.length} test suite(s) sequentially...\n`);

const results = [];
let overallSuccess = true;

selectedSuites.forEach((suite, index) => {
  const stepNumber = `[${index + 1}/${selectedSuites.length}]`;
  console.log(`-------------------------------------------------------------`);
  console.log(`${stepNumber} RUNNING: ${suite.name} (${suite.type})`);
  console.log(`Command: ${suite.cmd} ${suite.args.join(' ')}`);
  console.log(`-------------------------------------------------------------`);

  const startTime = Date.now();
  const run = spawnSync(suite.cmd, suite.args, {
    stdio: 'inherit',
    shell: true,
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, CI: '1' },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = run.status === 0;

  if (!passed) {
    overallSuccess = false;
  }

  results.push({
    name: suite.name,
    type: suite.type,
    duration: `${durationSec}s`,
    status: passed ? 'PASSED' : 'FAILED',
    icon: passed ? '✅' : '❌',
  });

  console.log(`\n${passed ? '✅' : '❌'} Finished in ${durationSec}s: ${suite.name}\n`);
});

// Summary Table
console.log('\n=============================================================');
console.log('                 TEST EXECUTION SUMMARY');
console.log('=============================================================');
console.table(
  results.map(r => ({
    Suite: r.name,
    Framework: r.type,
    Duration: r.duration,
    Result: `${r.icon} ${r.status}`,
  }))
);

if (overallSuccess) {
  console.log('🎉 ALL TEST SUITES PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('💥 ONE OR MORE TEST SUITES FAILED.\n');
  process.exit(1);
}
