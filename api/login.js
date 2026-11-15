// GET -> { logado }   POST { email, senha } -> entra   DELETE -> sai
const auth = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') return res.status(200).json({ logado: auth.logado(req) });
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', auth.cookieSair());
    return res.status(200).json({ logado: false });
  }
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido' });
  if (!auth.configurado()) return res.status(500).json({ erro: 'Defina LOGIN_EMAIL e LOGIN_SENHA nas variáveis de ambiente' });
  let corpo = req.body || {};
  if (typeof corpo === 'string') { try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; } }
  if (!auth.credenciaisOk(corpo.email, corpo.senha)) {
    await new Promise(ok => setTimeout(ok, 600)); // atrasa tentativas erradas
    return res.status(401).json({ erro: 'E-mail ou senha incorretos' });
  }
  res.setHeader('Set-Cookie', auth.cookieEntrar());
  return res.status(200).json({ logado: true });
};
