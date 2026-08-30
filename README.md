# 🌿 Plantas Tracker

Página única para ver, num relance, quais plantas precisam de água — e marcar a rega com um toque. Sem apps, sem contas: só HTML, CSS e JavaScript, servido pelo GitHub Pages.

## Como funciona

- Cada planta tem uma **barra de urgência** que enche e muda de cor (verde → âmbar → vermelho) consoante os dias desde a última rega.
- Um toque em **"Reguei hoje"** grava a data.
- O estado das regas fica no ficheiro [`regas.json`](regas.json), neste repositório — por isso o telemóvel e o computador ficam sincronizados.

## Sincronizar entre dispositivos (token do GitHub)

Sem token, a app funciona só neste dispositivo (guarda tudo em `localStorage`, sem sincronizar). Para sincronizar:

1. No GitHub, vai a **Settings → Developer settings → Personal access tokens → Fine-grained tokens** ([github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new)).
2. Em **Repository access**, escolhe **Only select repositories** e seleciona `plantas-tracker`.
3. Em **Permissions → Repository permissions**, muda **Contents** para **Read and write**.
4. Gera o token e copia-o (só o vês uma vez).
5. No site, abre o ícone de engrenagem (⚙️) no topo, cola o token no campo **Token de acesso** e confirma que o campo **Repositório** tem `utilizador/plantas-tracker`.
6. Toca em **Guardar**. Repete nos outros dispositivos.

O token fica guardado só no `localStorage` do teu navegador — nunca é enviado para lado nenhum além da API do GitHub, nem fica no código.

## Adicionar uma planta nova

1. Tira uma foto, redimensiona para ~800px de largura e põe em `fotos/` (ex.: `fotos/15-nome-da-planta.jpg`).
2. Acrescenta uma entrada ao array `plantas` em [`dados/plantas.json`](dados/plantas.json), seguindo o formato das existentes:

```json
{
  "id": "15",
  "nomeComum": "Nome comum",
  "nomeCientifico": "Nome científico",
  "foto": "fotos/15-nome-da-planta.jpg",
  "luz": 2,
  "luzTexto": "Descrição da necessidade de luz",
  "agua": 3,
  "aguaTexto": "Descrição da necessidade de água",
  "verificar": "Como confirmar que já precisa de água (teste do dedo, peso do vaso, cor das raízes…)",
  "cedoDemais": "O que indica que ainda é cedo, e o falso alarme típico desta planta",
  "intervaloDias": 7,
  "limiteDias": 12,
  "dica": "Uma dica curta e útil."
}
```

- `luz`: 1 = pouca · 2 = média · 3 = muita
- `agua`: 1 = muito pouca · 2 = pouca · 3 = moderada · 4 = muita
- `intervaloDias`: regas ideais (fim da barra verde)
- `limiteDias`: ponto de rega urgente (barra fica vermelha)
- `verificar` e `cedoDemais`: o teste concreto a fazer antes de regar esta espécie — aparecem no bloco destacado dos detalhes. O calendário é só uma estimativa; estes dois campos é que decidem. Ambos são opcionais: sem eles o bloco simplesmente não aparece.

3. Acrescenta a ficha em [`dados/guia-plantas.md`](dados/guia-plantas.md) — o guia é a versão longa dos mesmos
   dados (tabela resumo, notas e histórico por planta) e deve ficar em sincronia com o `plantas.json`.
4. Faz commit e push. Não é preciso mexer no `regas.json` — a planta nova aparece com "sem registo" até seres regada pela primeira vez.

## Fotos em falta

Falta a foto da **Jibóia (16)** — põe o ficheiro em `fotos/16-jiboia.jpg` (~800px de largura) e fica logo a aparecer, sem mexer em mais nada. As outras 15 plantas têm foto.

Enquanto uma foto falta, o site mostra um placeholder (fundo verde com a inicial do nome) em vez de quebrar.

## Site

**https://danielflopes.github.io/plantas-tracker/**

## Ficheiros

```
index.html          estrutura da página
estilo.css           estilos (paleta, tipografia, modo escuro)
app.js               lógica: urgência, ordenação, sincronização
dados/plantas.json   dados fixos de cada planta
regas.json           última data de rega por planta (id → data)
fotos/               fotos das plantas
manifest.json        permite instalar no ecrã principal do telemóvel
```

## Nota: cache do browser

`index.html` referencia `estilo.css` e `app.js` com um sufixo `?v=N` (ex.: `estilo.css?v=2`). Isto existe porque os browsers guardam estes ficheiros em cache durante bastante tempo — sem isto, depois de um `git push`, alguns dispositivos continuam a usar a versão antiga do CSS/JS mesmo com o HTML novo, o que pode desalinhar a página (ex.: elementos sem estilo, a parecer "partidos").

**Sempre que editares `estilo.css` ou `app.js`, aumenta o número em `?v=N` nas tags correspondentes em `index.html`**, para forçar os browsers a irem buscar a versão nova. Editar só `dados/plantas.json` ou `regas.json` não precisa disto (já não ficam em cache).
