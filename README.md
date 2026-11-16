# 🌿 As minhas plantas

Base de dados de consulta das plantas que tenho: para cada uma, a luz e a água de que precisa, mais cuidados especiais e curiosidades. Sem apps, sem contas: só HTML, CSS e JavaScript, servido pelo GitHub Pages.

(Já foi um tracker de regas, com datas e botões. Deixou de ser — ver "Dados de rega guardados" mais abaixo.)

## Como funciona

- Duas abas: **Interior** e **Exterior**. Cada planta pertence a uma delas (campo `local`).
- Cada planta aparece numa linha com a foto, o nome e dois indicadores: luz (bolinhas) e água (gotas). Um toque abre a ficha completa.
- Dá para ordenar por nome, número, luz ou água.

## Adicionar uma planta nova

1. Tira uma foto, redimensiona para ~675×900 e põe em `fotos/` (ex.: `fotos/19-nome-da-planta.jpg`).
2. Acrescenta uma entrada ao array `plantas` em [`dados/plantas.json`](dados/plantas.json):

```json
{
  "id": "19",
  "nomeComum": "Nome comum",
  "nomeCientifico": "Nome científico",
  "local": "interior",
  "foto": "fotos/19-nome-da-planta.jpg",
  "luz": 2,
  "luzTexto": "Descrição da necessidade de luz",
  "agua": 3,
  "aguaTexto": "Descrição da necessidade de água",
  "verificar": "Como confirmar que já precisa de água (teste do dedo, peso do vaso…)",
  "cedoDemais": "O que indica que ainda é cedo, e o falso alarme típico desta planta",
  "dica": "Cuidados especiais ou curiosidades."
}
```

- `local`: `"interior"` ou `"exterior"`
- `luz`: 1 = pouca · 2 = média · 3 = muita
- `agua`: 1 = muito pouca · 2 = pouca · 3 = moderada · 4 = muita
- `quantidade` (opcional): número de vasos, se tiveres mais do que um
- `verificar` e `cedoDemais` (opcionais): como saber se a planta já precisa de água e qual o falso alarme típico. Aparecem num bloco destacado na ficha.

3. Acrescenta a ficha em [`dados/guia-plantas.md`](dados/guia-plantas.md) — o guia é a versão longa dos mesmos dados e deve ficar em sincronia com o `plantas.json`.
4. Faz commit e push.

Sem foto, o site mostra um placeholder (fundo verde com a inicial do nome) em vez de quebrar.

## Dados de rega guardados (já não aparecem na app)

- [`regas.json`](regas.json): as datas da última rega (as mais recentes são de 2026-09-14) e o intervalo ajustado à mão da planta 08 (14 dias). Não é lido por nada.
- `intervaloDias` e `limiteDias` em cada planta de [`dados/plantas.json`](dados/plantas.json): a frequência de rega usada pelo tracker. Não aparecem na app. As plantas novas não precisam deles.
- No telemóvel/computador onde a app foi usada, o navegador pode ainda ter uma cópia das regas e o token do GitHub (`localStorage`). Já não são usados.

## Site

**https://danielflopes.github.io/plantas-tracker/**

## Ficheiros

```
index.html          estrutura da página
estilo.css           estilos (paleta, tipografia, modo escuro)
app.js               abas, ordenação e fichas
dados/plantas.json   dados de cada planta
dados/guia-plantas.md  guia em texto com a ficha longa de cada planta
regas.json           datas de rega antigas (guardadas, não usadas)
fotos/               fotos das plantas
manifest.json        permite instalar no ecrã principal do telemóvel
```

## Nota: cache do browser

`index.html` referencia `estilo.css` e `app.js` com um sufixo `?v=N`. **Sempre que editares `estilo.css` ou `app.js`, aumenta o número em `?v=N` em `index.html`**, para os browsers irem buscar a versão nova. Editar só `dados/plantas.json` não precisa disto.
