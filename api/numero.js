// Guarda o número do último recibo emitido (Upstash Redis, pela integração da Vercel).
// GET  /api/numero -> { ultimo }   consulta, não altera
// POST /api/numero -> { numero }   soma 1 e devolve o novo número (operação atômica)
const BASE = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const CHAVE = 'recibo:numero';

async function redis(comando) {
  const r = await fetch(BASE, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(comando),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!BASE || !TOKEN) throw new Error('Banco não configurado');
    if (req.method === 'POST') {
      return res.status(200).json({ numero: await redis(['INCR', CHAVE]) });
    }
    return res.status(200).json({ ultimo: Number(await redis(['GET', CHAVE])) || 0 });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
};
