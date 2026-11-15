// Sessão por cookie assinado (HMAC). Credenciais ficam nas variáveis de ambiente LOGIN_EMAIL e LOGIN_SENHA.
const crypto = require('crypto');
const DIAS = 30;
const segredo = () => (process.env.LOGIN_SENHA || '') + '|' + (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '');
const assinar = exp => crypto.createHmac('sha256', segredo()).update(String(exp)).digest('hex');
const igual = (a, b) => {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
};

exports.configurado = () => Boolean(process.env.LOGIN_EMAIL && process.env.LOGIN_SENHA);
exports.credenciaisOk = (email, senha) =>
  igual(String(email || '').trim().toLowerCase(), String(process.env.LOGIN_EMAIL).trim().toLowerCase()) & igual(senha || '', process.env.LOGIN_SENHA);
exports.cookieEntrar = () => {
  const exp = Date.now() + DIAS * 864e5;
  return 'sessao=' + exp + '.' + assinar(exp) + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + DIAS * 86400;
};
exports.cookieSair = () => 'sessao=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
exports.logado = req => {
  if (!exports.configurado()) return false;
  const c = (req.headers.cookie || '').split(/;\s*/).find(x => x.startsWith('sessao='));
  if (!c) return false;
  const [exp, sig] = c.slice(7).split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return igual(sig, assinar(exp));
};
