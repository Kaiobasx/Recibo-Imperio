// Histórico de recibos no Redis. Exige login.
// POST { numero: null, dados }  -> gera o próximo número (INCR, atômico), guarda o recibo e devolve { numero }
// POST { numero: 12,   dados }  -> atualiza o recibo 12 (reimpressão)
// GET                           -> { recibos: [resumos, do mais novo para o mais antigo] }
// GET ?n=12                     -> { dados } do recibo 12
// Chaves: recibo:numero (contador), recibo:dados:<n> (JSON), recibo:indice (conjunto ordenado dos números)
const auth = require('../lib/auth');
const redis = require('../lib/redis');
const LIMITE = 500; // quantos recibos a lista devolve

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!auth.logado(req)) return res.status(401).json({ erro: 'Faça login' });
  try {
    if (req.method === 'POST') {
      let corpo = req.body || {};
      if (typeof corpo === 'string') corpo = JSON.parse(corpo);
      const dados = corpo.dados;
      if (!dados || typeof dados !== 'object') return res.status(400).json({ erro: 'Recibo sem dados' });
      const texto = JSON.stringify(dados);
      if (texto.length > 50000) return res.status(413).json({ erro: 'Recibo grande demais' });
      let numero = Number(corpo.numero);
      if (numero) {
        if (!(await redis(['EXISTS', 'recibo:dados:' + numero]))) return res.status(404).json({ erro: 'Recibo não encontrado' });
      } else {
        numero = await redis(['INCR', 'recibo:numero']);
        await redis(['ZADD', 'recibo:indice', numero, String(numero)]);
      }
      await redis(['SET', 'recibo:dados:' + numero, texto]);
      return res.status(200).json({ numero });
    }

    const n = Number((req.query || {}).n || new URL(req.url, 'http://x').searchParams.get('n'));
    if (n) {
      const bruto = await redis(['GET', 'recibo:dados:' + n]);
      if (!bruto) return res.status(404).json({ erro: 'Recibo não encontrado' });
      return res.status(200).json({ numero: n, dados: JSON.parse(bruto) });
    }

    const numeros = await redis(['ZREVRANGE', 'recibo:indice', 0, LIMITE - 1]);
    if (!numeros.length) return res.status(200).json({ recibos: [] });
    const brutos = await redis(['MGET', ...numeros.map(x => 'recibo:dados:' + x)]);
    const recibos = numeros.map((x, i) => {
      const d = brutos[i] ? JSON.parse(brutos[i]) : {};
      const c = d.campos || {};
      return { numero: Number(x), tipo: d.tipo, total: d.total, nome: c.nome, doc: c.doc, data: c.data };
    });
    return res.status(200).json({ recibos });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
};
