// GET /api/numero -> { ultimo }: último número emitido, só para mostrar o próximo na tela. Exige login.
const auth = require('../lib/auth');
const redis = require('../lib/redis');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth.logado(req)) return res.status(401).json({ erro: 'Faça login' });
  try {
    return res.status(200).json({ ultimo: Number(await redis(['GET', 'recibo:numero'])) || 0 });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
};
