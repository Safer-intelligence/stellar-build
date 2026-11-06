import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Keypair } from '@stellar/stellar-sdk';
import { loadConfig } from '../src/config.js';

test('loadConfig applies testnet defaults', () => {
  const treasury = Keypair.random();
  const config = loadConfig({
    TREASURY_SECRET: treasury.secret(),
    API_KEY: 'test-api-key',
    WALLET_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64')
  });

  assert.equal(config.stellarNetwork, 'testnet');
  assert.equal(config.horizonUrl, 'https://horizon-testnet.stellar.org');
  assert.equal(config.usdcAssetCode, 'USDC');
  assert.equal(config.usdcIssuer, 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5');
  assert.equal(config.treasuryPublicKey, treasury.publicKey());
});

test('loadConfig requires a 32-byte base64 encryption key', () => {
  const treasury = Keypair.random();

  assert.throws(
    () =>
      loadConfig({
        TREASURY_SECRET: treasury.secret(),
        API_KEY: 'test-api-key',
        WALLET_ENCRYPTION_KEY: Buffer.alloc(16, 1).toString('base64')
      }),
    /WALLET_ENCRYPTION_KEY/
  );
});

test('production accepts a configured deployment hostname and rejects a mismatch', () => {
  const env = {
    NODE_ENV: 'production',
    TREASURY_SECRET: Keypair.random().secret(),
    API_KEY: 'a'.repeat(32),
    WALLET_ENCRYPTION_KEY: Buffer.alloc(32, 1).toString('base64'),
    MYSQL_PASSWORD: 'b'.repeat(32),
    MYSQL_HOST: 'mysql',
    PUBLIC_BASE_URL: 'https://service.example.org',
    ALLOWED_HOSTS: 'service.example.org'
  };
  assert.equal(loadConfig(env).publicBaseUrl, 'https://service.example.org');
  assert.throws(() => loadConfig({ ...env, ALLOWED_HOSTS: 'other.example.org' }), /ALLOWED_HOSTS/);
});
