#!/usr/bin/env node

/**
 * Create a fresh restaurant for this copy.
 *
 * Usage: npm run new-restaurant -- "Restaurant Name"
 *
 * Calls create_restaurant_instance, which inserts a new restaurant and a
 * starter set of tables. Bookings for other restaurants are not touched.
 * The new id is stored in .env and is not committed.
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envPath = path.join(root, '.env');
const clientPath = path.join(root, 'src/integrations/supabase/client.ts');

const readEnv = (file) => {
  if (!fs.existsSync(file)) return {};
  const values = {};
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match || line.trim().startsWith('#')) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return values;
};

const upsertEnv = (file, key, value) => {
  const current = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  const next = pattern.test(current)
    ? current.replace(pattern, line)
    : `${current}${current.endsWith('\n') || current === '' ? '' : '\n'}${line}\n`;
  fs.writeFileSync(file, next);
};

const ask = (prompt) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(prompt, (answer) => {
    rl.close();
    resolve(answer.trim());
  });
});

const publicSupabase = () => {
  const source = fs.readFileSync(clientPath, 'utf8');
  const url = source.match(/VITE_SUPABASE_URL \|\| "([^"]+)"/)?.[1] || '';
  const key = source.match(/VITE_SUPABASE_ANON_KEY \|\| "([^"]+)"/)?.[1] || '';
  return { url, key };
};

const slugify = (value) => {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return slug || 'restaurant';
};

const main = async () => {
  const existing = readEnv(envPath);
  if (existing.VITE_RESTAURANT_ID) {
    console.log(`This copy already writes to ${existing.VITE_RESTAURANT_ID}.`);
    console.log('Remove VITE_RESTAURANT_ID from .env before creating another restaurant.');
    return;
  }

  const named = process.argv.slice(2).join(' ').trim();
  const name = named || (process.stdin.isTTY ? await ask('Restaurant name: ') : '') || 'Your Restaurant';
  if (name.length < 2 || name.length > 80) {
    throw new Error('Restaurant name must be between 2 and 80 characters.');
  }

  const published = publicSupabase();
  const url = (existing.VITE_SUPABASE_URL || published.url).replace(/\/+$/, '');
  const key = existing.VITE_SUPABASE_ANON_KEY || published.key;
  if (!url || !key) {
    throw new Error('The Supabase URL and anon key are missing.');
  }

  const response = await fetch(`${url}/rest/v1/rpc/create_restaurant_instance`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_name: name }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload === 'object' && 'message' in payload
      ? String(payload.message)
      : `HTTP ${response.status}`;
    throw new Error(`Could not create the restaurant: ${detail}`);
  }

  const id = typeof payload === 'string' ? payload : '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error('The database did not return a restaurant id.');
  }

  const basePath = `/${slugify(name)}`;
  upsertEnv(envPath, 'VITE_RESTAURANT_ID', id);
  upsertEnv(envPath, 'VITE_RESTAURANT_NAME', name);
  upsertEnv(envPath, 'VITE_BASE_PATH', basePath);

  console.log(`\nRestaurant: ${name}`);
  console.log(`Restaurant id: ${id}`);
  console.log(`Public path: ${basePath}`);
  console.log('Saved in .env. That file stays off GitHub, so the next clone gets its own id.');
  console.log('Eight empty tables were created. Restart npm run dev, then build and upload dist to that path.');
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
