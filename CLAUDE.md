# W2R Connect — Landing Page

Landing de `w2rconnect.com.br`. **HTML/CSS/JS puro, sem build, sem framework.** Abre `index.html` direto no navegador. Deploy por Docker/Cloud Build.

O produto é um CRM com IA para **correspondentes bancários** (financiamento imobiliário): lê matrículas, extrai R1/averbações/proprietários, gera contratos e envia dados aos sistemas dos bancos.

---

## 1. Identidade visual

> **Regra número um: a landing existe para parecer o mesmo produto que o app.** Toda decisão visual se resolve olhando `assets/screen-hero.png` (dashboard), as telas de auth e `assets/logo-full.png` — nunca inventando do zero e nunca copiando template de SaaS.

### O gradiente é a marca

O app usa **azul → verde como gradiente**, não como duas cores separadas. Aparece em três lugares fixos:

1. **CTA primária** — gradiente horizontal, texto branco
2. **Borda superior do card** — barra de 3–4px no topo de cards de destaque
3. **Divisor curto** — barra de ~80×3px sob parágrafos de introdução

```css
--brand-grad: linear-gradient(96deg, #5b8bff 0%, #2be38b 100%);
--btn-grad:   linear-gradient(96deg, #3560e0 0%, #0d8355 100%);
```

`--brand-grad` é traço e texto sobre fundo escuro. `--btn-grad` é fundo de CTA com texto branco.

**São dois tokens porque um só não serve.** `--brand-grad` é claro de propósito — precisa contrastar com `#080c14` como traçado e como texto em `background-clip`. Como *fundo* de botão ele reprova feio: 3,2:1 no azul e 1,7:1 no verde contra texto branco. `--btn-grad` faz o mesmo movimento azul→verde com as duas pontas acima de 4,5:1 (5,4:1 e 4,8:1). Verificado por amostragem das paradas, não por estimativa.

Valores do app são mais saturados (~`#1668c8` → `#1f9d55`) — e o verde do app também reprova (3,5:1). Ao portar um componente do app, ajuste o gradiente, não copie o hex.

Gradiente não interpola em `transition`. O hover da CTA escurece por `filter: brightness(0.92)`, que escurece texto e fundo juntos e **sobe** o contraste em vez de derrubá-lo.

### Semântica de cor

| Token | Cor | Significa | Onde |
|---|---|---|---|
| `--action` | `#5b8bff` escuro / `#2f56c9` claro | ação, sistema, o produto | links, hover de nav, traçados, ícones de processo |
| `--btn-grad` | `#3560e0` → `#0d8355` | fundo de CTA primária (texto branco, pior ponto 4.8:1) | `.btn-primary`, `.nav-cta`, `.mob-btn-cta` |
| `--btn` | `#3560e0` | mesma cor, chapada — rótulo, não ação | badges de plano em `conversion.css` |
| `--accent` | `#2be38b` escuro / `#0b7b50` claro | confirmação, resultado, "feito" | checks, badges de status, números de ganho |
| prata/metálico | — | a marca em si | logo |

**Nunca use uma cor só para tudo.** Foi exatamente isso que deixou a versão anterior genérica: `#2be38b` cobria ação, resultado, decoração e marca ao mesmo tempo, e o verde-menta é o accent padrão de toda landing de IA desde 2024.

Verde nunca significa "clicável". Azul nunca significa "concluído".

### Motivo da marca: documento → traçado → nó

O logo é feito de traçados de circuito, nós e ícones de documento. Esse é o motivo estrutural da landing, não um enfeite. O hero implementa como **trilha do documento** (`.hero-trail`): `Envio de documentos` → `IA processando` → `Próximas etapas`, com o traço em gradiente que desenha na entrada e nós que acendem em sequência.

Dentro dos nós a semântica de cor vale sem exceção: os três nós acendem em **azul** (`is-lit`) porque acender é o sistema trabalhando; o **verde** aparece só nos checks do nó 2, que são resultado consumado. As etapas do nó 3 usam anel azul vazado — check verde em etapa que ainda não aconteceu leria como mentira.

Ao criar seção nova, prefira estender esse motivo a inventar uma metáfora visual nova.

### Padrões herdados do app

- **Tipografia**: **Lato** (display) + **Open Sans** (corpo) — as mesmas que `w2rconnect.app` carrega. **JetBrains Mono** fica no papel técnico (eyebrow, trilha, endereço), onde o app não tem opinião. Não trocar por Inter/Space Grotesk/Geist: além de saturadas, não são as do produto. Lato não tem 500/600 — pedir esses pesos cai em 400.
- **Eyebrow**: MAIÚSCULA, `letter-spacing: 0.16em`, mono, cor muted. Usado em `CRIAR CONTA`, `ACESSAR PLATAFORMA`, `.hero-eyebrow`, `.sec-eyebrow`.
- **Ícones**: outline, stroke 1.3–1.5, `currentColor`, viewBox 16 ou 24. Em listas de feature, dentro de container quadrado arredondado com fundo tintado. **Nunca emoji como ícone.**
- **Raios**: card 16–20px, botão/input 10–12px, pill 100px.
- **Fundo escuro**: navy profundo com glow azul no topo e verde no canto inferior-esquerdo, textura de grid sutil.
- **Rodapé de formulário**: ícone de cadeado + nota de segurança.

### Aberto / a resolver

- **Assets de logo (resolvido).** `assets/logo.svg` é o símbolo W2R sozinho, em azul→verde, vetorial — é o que vai na nav (32px) e no rodapé (44px). `assets/home.svg` é o símbolo dentro do motivo de circuito e documentos: só legível a partir de ~90px, usado no preloader. `logo.png` / `logo-full.png` são o lockup com tagline em raster — **não usar em UI**, viram borrão abaixo de 100px.
- Ver `~/.claude/projects/.../memory/w2r-landing-pendencias.md` para o resto.

---

## 2. Convenções de código

### CSS

Sete arquivos carregados em ordem em `index.html`. **`responsive.css` é o último** — regras de breakpoint dependem dessa cascata.

```
base.css → layout.css → hero.css → content.css → conversion.css → footer.css → responsive.css
```

- Tokens vivem em `base.css`: `:root` (globais) + `.t-dark` / `.t-light` (por tema). **Componente novo não tem hex hardcoded.**
- Cuidado com especificidade em override responsivo: `.trail-node[data-node='1']` (0,2,0) ganha de `.trail-node` (0,1,0). Se o mobile precisa sobrescrever um seletor com atributo, repita o atributo.
- **Uma só coluna de conteúdo: `max-width: 1280px` centralizado, dentro de `4%` de respiro.** Vale para `.section-inner`, `.hero-inner` e `.nav-inner`. Elemento fixo ou full-bleed que ignore isso desalinha visivelmente — a nav ficava 22px mais larga que o hero acima de 1391px. Verificado em 1200/1366/1440/1600/1920: 0.0px de diferença nas duas bordas.
- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande e elementos não-textuais. Verificar antes de commitar, não depois.

### JS (`js/main.js`)

Um arquivo, IIFEs e funções nomeadas dentro de um `DOMContentLoaded`. GSAP + ScrollTrigger + SplitText + Lenis via CDN com `defer`.

**Progressive enhancement é obrigatório.** O CSS padrão mostra o **estado final**; o JS esconde e então anima. Se o GSAP não carregar, ou `prefers-reduced-motion` estiver ativo, a página fica completa e legível.

```css
.js-anim .trail-fact { opacity: 0; visibility: hidden; }
```

`.js-anim` é setada no `<head>`, antes do paint.

Vocabulário de atributos:

| Atributo | Efeito |
|---|---|
| `data-intro` | fade+slide na entrada, stagger por ordem no DOM |
| `data-intro-visual` | entrada mais lenta e ampla, para o screenshot |
| `data-reveal` | revela no scroll via `ScrollTrigger.batch` |
| `data-parallax` | parallax leve no scroll |
| `data-gsap-ignore` | exclui o elemento e seus filhos das animações automáticas |

**Nunca animar propriedades de layout.** `top`, `left`, `width`, `height`, `padding`, `margin` causam reflow por frame. Use `transform` e `opacity`. (Os chips flutuantes antigos animavam `top`/`left` em loop infinito — foi um dos motivos de terem sido removidos.)

A nav tem **altura fixa** (72px desktop / 62px mobile) justamente por isso: o shrink antigo animava `height` e `padding`. O aperto no scroll agora vem de `transform: scale(0.9)` no logo, que roda na GPU.

Ela também **sai de cena ao descer e volta ao subir** (`.nav-hidden` → `translateY(-100%)`), com folga de 8px no delta para não tremer com a oscilação do scroll suave do Lenis. Duas escapatórias obrigatórias: `.menu-open nav` e **`nav:focus-within`** — sem a segunda, quem navega por teclado tabula para dentro de uma nav fora da tela.

Alvo de toque mínimo **44×44px** para qualquer controle tocável. O hambúrguer media 37×34 e reprovava; hoje tem largura e altura fixas em 44 com os traços centralizados, e o breakpoint de 480px **não** encolhe mais o botão junto com o resto.

### Comentários

**Não escrever comentário nenhum.** Nem em CSS, nem em JS, nem em HTML. Só o código.

Isso vale sem exceção: nada de comentário de seção, de "por quê", de TODO, de marcador `ponytail:`. Se um trecho precisa de explicação, ela vai no nome da classe/função, na mensagem de commit ou nesta CLAUDE.md — nunca em `/* */`, `//` ou `<!-- -->`. Ao editar um arquivo, apague os comentários que já estiverem ali.

---

## 3. Verificação obrigatória de UI

**Nenhuma mudança visual é "pronta" sem renderizar.** Números de layout calculados na cabeça erram. As duas últimas rodadas pegaram bugs que só apareceram no navegador: card truncado por especificidade de CSS e sobreposição de dois elementos flutuantes.

Playwright já está disponível (`npx playwright`). Rode do scratchpad, nunca do repo:

Viewports mínimos: 1440×900, 1366×768 (a dobra real), 390×844.

```js
await page.goto(SITE + '?nointro', { waitUntil: 'networkidle' });
```

Query params úteis, já implementados: `?nointro` pula o preloader, `?noanim` desliga todas as animações.

Checklist por rodada:

- [ ] Screenshot **lido**, nos 3 viewports — não só capturado
- [ ] `document.body.scrollWidth === window.innerWidth` (sem scroll horizontal)
- [ ] O que precisa estar acima da dobra em 1366×768 está
- [ ] `reducedMotion: 'reduce'` → conteúdo completo e legível
- [ ] Zero erros de console e `pageerror`
- [ ] Se mexeu em token global, conferir as outras seções também

---

## 4. Skills — quando usar cada uma

24 skills instaladas em `.claude/skills/`. **Carregar todas em toda tarefa desperdiça contexto e mistura direções de design conflitantes.** Roteie pelo *momento da decisão*, não pelo nome.

### Sempre ativas (não invocar manualmente)

| Skill | Como funciona |
|---|---|
| **impeccable** | Roda como hook: checagem rápida no `PostToolUse` e passe profundo no `Stop`. Achados chegam sozinhos. Trate cada um: conserte se for real, ou classifique como falso positivo **explicando o porquê**. Nunca silenciar com ignore sem o usuário confirmar que é intencional. `/impeccable audit` para varredura completa sob demanda. |
| **ponytail** | Modo persistente da sessão. Resolve a pergunta "isso precisa existir?" antes de "como construo isso?". |

### Antes de construir algo novo — nesta ordem

**1. `ui-ux-pro-max` — decide o QUÊ.**
Invoque **primeiro**, antes de escrever qualquer CSS. Layout, escala tipográfica, paleta, padrão de UX, estrutura de landing. É a base factual: contraste, tamanho de alvo de toque, hierarquia.
→ *Gatilho: seção nova, componente novo, "que layout usar aqui".*

**2. `design-taste-frontend` — decide o COMO NÃO PARECER TEMPLATE.**
Direção autoral e anti-genérico. Entra depois que a estrutura está decidida, para dar personalidade.
→ *Gatilho: "está genérico", "sem identidade", redesign de página inteira.*
→ *(É a skill que o time chama de "taste" — vem de `Leonxlnx/taste-skill`, não da Anthropic. `design-taste-frontend-v1` é legado; não usar.)*

**3. `emil-design-eng` — decide o REFINO.**
Polimento de componente, os detalhes invisíveis que fazem parecer bem-feito. Só depois que a coisa existe e funciona.
→ *Gatilho: "falta polimento", estados de hover/foco/loading, micro-decisões de componente.*

**4. `animate` — decide o MOVIMENTO.**
Constrói uma animação do zero, na ordem certa: deve animar? qual propósito? qual curva e duração? como interrompe? como sai?
→ *Gatilho: adicionar movimento novo. **Não** invoque para ajustar animação que já existe.*

### Ao mexer no que já existe

| Situação | Skill |
|---|---|
| Redesenhar seção que já está no ar | `redesign-existing-projects` — audita antes de trocar |
| Criticar o motion de um diff | `review-animations` |
| Auditar o motion do repo inteiro | `improve-animations` |
| Achar o que deveria animar e não anima | `find-animation-opportunities` |
| Achar o que dá pra deletar | `ponytail-review` (diff) / `ponytail-audit` (repo) |
| Descobrir o nome de um efeito | `animation-vocabulary` |

### Referência visual

| Situação | Skill |
|---|---|
| Usuário mandou print/mockup para reproduzir | `image-to-code` |
| Precisa de comp antes de codar | `imagegen-frontend-web` |
| Board de marca, sistema de logo | `brandkit` |

### Não usar neste projeto

`industrial-brutalist-ui`, `minimalist-ui`, `gpt-taste`, `stitch-design-taste` — impõem linguagens visuais que conflitam com a identidade já definida na seção 1. `apple-design`, `imagegen-frontend-mobile` — são para iOS/mobile nativo. `pick-ui-library` — não há biblioteca de componentes aqui, é CSS puro. `full-output-enforcement`, `design-taste-frontend-v1` — sem uso.

### Como combinar sem conflito

- **Uma skill de direção por tarefa.** `ui-ux-pro-max` + `design-taste-frontend` juntas é o teto; três direções de design ao mesmo tempo produzem colcha de retalhos.
- **Direção antes de motion, sempre.** Animar uma estrutura que ainda vai mudar é retrabalho.
- **`impeccable` não substitui julgamento.** É um detector determinístico: pega contraste, propriedade animada errada, fonte saturada. Não sabe se a seção comunica a coisa certa.
- **Skill nenhuma substitui abrir o navegador.** Seção 3 vale para todas.

---

## 5. Fluxo de trabalho

O redesign é **seção por seção**, conduzido pelo usuário. Só o hero foi reconstruído. Confirme qual seção atacar antes de mexer — não avance sozinho para a próxima.

Ordem por rodada:

1. Ler o que existe (HTML + CSS + JS da seção) **e os assets do app** antes de propor — o texto da seção junto, contra a seção 6
2. Diagnosticar com evidência: `arquivo:linha`, números reais, não impressão
3. Propor direção e confirmar com o usuário
4. Construir
5. Renderizar e verificar (seção 3)
6. Reportar o que foi verificado e o que ficou de fora

---

## 6. Texto: a herança errada

A landing foi escrita por uma equipe que não entendeu o produto. Sobrou copy apontada para **imobiliária e corretor de imóvel** — público errado, em várias seções.

O usuário é o **correspondente bancário**, e só ele: quem monta e acompanha o processo de financiamento imobiliário para o banco — lê matrícula, confere R1 e averbações, identifica proprietários, gera contrato, alimenta os sistemas dos bancos e toca vários processos ao mesmo tempo. A dor dele é volume de documento, retrabalho de digitação e processo travado no banco. Não é vender imóvel, não é captar cliente comprador, não é gestão de carteira de imóveis.

**Texto incoerente é bug, não escopo separado.** Ao mexer em qualquer seção, ler o texto dela antes do CSS. Se falar com imobiliária, ajustar na mesma rodada e levar a proposta de texto junto com a proposta de layout (passo 3 do fluxo).

Sinais de texto herdado errado:

- fala com "sua imobiliária", "sua equipe de corretores", "seus clientes compradores"
- promete vender/anunciar imóvel, captar lead, gerir carteira de imóveis
- benefício genérico de CRM de vendas em vez de ganho no processo de financiamento
- termo de mercado imobiliário onde caberia o vocabulário do correspondente (matrícula, R1, averbação, proprietário, contrato, esteira do banco)
