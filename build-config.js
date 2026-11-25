// Gera config.local.js a partir das variáveis de ambiente (usado no deploy da Vercel).
const fs = require('fs');
const senha = process.env.ADMIN_SENHA;
if (!senha) {
  console.error('Variável de ambiente faltando na Vercel: ADMIN_SENHA');
  process.exit(1);
}
fs.writeFileSync('config.local.js', 'window.APP_CONFIG = ' + JSON.stringify({ ADMIN_SENHA: senha }) + ';\n');
console.log('config.local.js gerado.');
