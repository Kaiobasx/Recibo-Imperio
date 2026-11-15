// Acesso ao Upstash Redis pela API REST (sem dependências).
const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

module.exports = async function redis(comando) {
  if (!BASE || !TOKEN) throw new Error('Banco não configurado');
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(comando),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
