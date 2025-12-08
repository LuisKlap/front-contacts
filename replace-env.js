#!/usr/bin/env node

/**
 * Script para substituir variáveis de ambiente no index.html após o build
 * Usado no Vercel para injetar API_KEY e API_URL
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'front-contacts', 'browser', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html não encontrado:', indexPath);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

// Substitui as variáveis de ambiente
const API_KEY = process.env.API_KEY || '';
const API_URL = process.env.API_URL || 'https://backend-uex-contacts-production.up.railway.app/api';

html = html.replace('{{API_KEY}}', API_KEY);
html = html.replace('{{API_URL}}', API_URL);

fs.writeFileSync(indexPath, html, 'utf8');

console.log('✅ Variáveis de ambiente injetadas no index.html');
console.log(`   API_KEY: ${API_KEY ? '***' + API_KEY.slice(-4) : 'não configurada'}`);
console.log(`   API_URL: ${API_URL}`);
