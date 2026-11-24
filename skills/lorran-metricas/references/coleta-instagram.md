# Coleta dos Insights do Instagram pelo Chrome

Testado em 23/11/2026 com a interface em português. Se o Instagram mudar os rótulos, ajuste as expressões e anote a mudança aqui.

## Preparar

- Carregue as ferramentas do Claude in Chrome num único ToolSearch e leia a skill `anthropic-skills:chrome-browser` antes.
- `tabs_context_mcp` → abra uma aba nova. Feche a aba ao terminar.
- Não leia cookies nem tokens: o navegador bloqueia e não é necessário.
- Cada chamada de `javascript_tool` tem limite de ~45s; trabalhe em lotes de até 6 posts.
- Saídas longas são truncadas: imprima linhas curtas.

## Visão da conta

Navegue para `https://www.instagram.com/accounts/insights/?timeframe=30`, espere ~3s e use `get_page_text`. Anote: visualizações, % seguidores vs não seguidores, visualizadores (alcance), interações, visitas ao perfil, toques em links externos, total de seguidores, horários mais ativos.

## Lista de posts

`https://www.instagram.com/accounts/insights/content/?media_type=all&metric=views&sort_by=highest&timeframe=7&view_type=card`

- `timeframe`: 7, 30 ou 90.
- `sort_by=lowest` para os piores.

Os cards são botões sem link. O método que funciona é clicar, ler o texto da página de detalhe e voltar.

### Lote de coleta (troque START por 0, 6, 12...)

```js
window.__res = window.__res || {}; const sleep = ms => new Promise(r => setTimeout(r, ms));
async function grab(i){
  for (let k = 0; k < 5; k++){ if ([...document.querySelectorAll('main [role=button]')].filter(e => /mil|--|^\s*\d/.test(e.innerText)).length > i + 2) break; window.scrollTo(0, document.body.scrollHeight); await sleep(900); }
  const b = [...document.querySelectorAll('main [role=button]')].filter(e => /mil|--|^\s*\d/.test(e.innerText)); if (!b[i]) return;
  b[i].click(); await sleep(2600);
  const t = document.body.innerText.replace(/\n/g, '|'); const s = t.indexOf('Visualizações');
  window.__res[i] = { url: location.pathname, t: t.slice(Math.max(0, s - 40), s + 900) };
  history.back(); await sleep(2200);
}
for (let i = START; i < START + 6; i++) await grab(i); Object.keys(window.__res).length
```

### Extrair os campos (chamada separada)

```js
const P = t => {
  const g = k => { const m = t.match(new RegExp('\\|' + k + '\\|([\\d\\.]+)')); return m ? m[1] : '-'; };
  const vi = t.match(/Visualizações\|Visualizações\|([\d\.]+)\|Seguidores\|([\d\.]+%)\|Não seguidores\|([\d\.]+%)/) || [];
  const fol = t.match(/Toques no endereço comercial\|\d+\|Seguidores\|([\d\.]+)/) || t.match(/Atividade do perfil\|[\d\.]+\|Seguidores\|([\d\.]+)/) || [];
  const tipo = /Interações com reels/.test(t) ? 'R' : 'P';
  return [tipo, vi[1], vi[3], 'Vz' + g('Visualizadores'), 'L' + g('Curtidas'), 'Sh' + g('Compartilhamentos'), 'Sv' + g('Salvamentos'), 'C' + g('Comentários'), 'V' + g('Visitas ao perfil'), 'F' + (fol[1] || '-')].join(' ');
};
Object.entries(window.__res).map(([i, r]) => i + ' ' + r.url.split('/')[3] + ' ' + P(r.t)).join('\n')
```

Campos: tipo (R = reel, P = post/carrossel), views, % não seguidores, visualizadores (alcance), curtidas, compartilhamentos, salvamentos, comentários, visitas ao perfil (só posts), seguidores ganhos.

## Legenda de cada post

O detalhe fica em `/insights/media/<id>/`. Converta o id em shortcode e busque a página do post:

```js
const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const sc = id => { let n = BigInt(id), s = ''; while (n > 0n) { s = A[Number(n % 64n)] + s; n /= 64n; } return s; };
const dec = s => { const d = document.createElement('textarea'); d.innerHTML = s; return d.value; };
const out = await Promise.all(Object.entries(window.__res).map(async ([i, r]) => {
  const h = await (await fetch('/p/' + sc(r.url.split('/')[3]) + '/')).text();
  const m = h.match(/<meta property="og:title" content="([^"]*)"/);
  return i + ' ' + dec(m ? m[1] : '').replace(/^.*? no Instagram: /, '').replace(/\s+/g, ' ').slice(0, 90);
}));
out.join('\n')
```

## O que não dá pela web

Tempo médio de visualização, gráfico de retenção e taxa de pulo dos reels só aparecem no app: peça print ao Lorran.
