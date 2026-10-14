/* ==========================================================================
   Configurações, Constantes Globais e Dicionários - Tormenta20 RPG
   Compatível com GitHub Pages, Supabase REST API e Execução Local
   ========================================================================== */

// Configurações de Conexão com o Supabase
var URL_SUPABASE = "https://tfguskhdabewpabiqbml.supabase.co";
var CHAVE_PUBLICA_SUPABASE = "sb_publishable_F9RIyN4V4nl9d4H40Wf2bw_EcuPJje7";

// Aliases para retrocompatibilidade
var SB_URL = URL_SUPABASE;
var SB_KEY = CHAVE_PUBLICA_SUPABASE;

// Chaves Base de Armazenamento Local (localStorage)
var CHAVE_LOCAL_FICHA_BASE = "ficha-tormenta-v1";
var CHAVE_LOCAL_PERICIAS_BASE = "ficha-tormenta-skills-v4";
var CHAVE_LOCAL_SINCRONIZADA_BASE = "ficha-tormenta-synced";

// Chaves legadas globais mantidas para retrocompatibilidade
var CHAVE_LOCAL_FICHA = CHAVE_LOCAL_FICHA_BASE;
var CHAVE_LOCAL_PERICIAS = CHAVE_LOCAL_PERICIAS_BASE;
var CHAVE_LOCAL_SINCRONIZADA = CHAVE_LOCAL_SINCRONIZADA_BASE;
var KEY = CHAVE_LOCAL_FICHA;
var LKEY = CHAVE_LOCAL_PERICIAS;
var SYNCK = CHAVE_LOCAL_SINCRONIZADA;

// Sanitização segura de código de ficha (apenas caracteres alfanuméricos seguros)
function sanitizarCodigo(cod) {
  if (typeof cod !== "string") return "";
  return cod.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
}

// Funções para isolamento de armazenamento por ficha (evita colisão entre múltiplas abas)
function obterChaveLocalFicha(codigo) {
  var cod = sanitizarCodigo(codigo || (typeof CODIGO_FICHA !== "undefined" ? CODIGO_FICHA : ""));
  return cod ? CHAVE_LOCAL_FICHA_BASE + "-" + cod : CHAVE_LOCAL_FICHA_BASE;
}

function obterChaveLocalPericias(codigo) {
  var cod = sanitizarCodigo(codigo || (typeof CODIGO_FICHA !== "undefined" ? CODIGO_FICHA : ""));
  return cod ? CHAVE_LOCAL_PERICIAS_BASE + "-" + cod : CHAVE_LOCAL_PERICIAS_BASE;
}

function obterChaveLocalSincronizada(codigo) {
  var cod = sanitizarCodigo(codigo || (typeof CODIGO_FICHA !== "undefined" ? CODIGO_FICHA : ""));
  return cod ? CHAVE_LOCAL_SINCRONIZADA_BASE + "-" + cod : CHAVE_LOCAL_SINCRONIZADA_BASE;
}

// Lista de Atributos Base de Tormenta20: [identificador, nome por extenso]
var ATRIBUTOS_PADRAO = [
  ["forca", "Força"],
  ["destreza", "Destreza"],
  ["constituicao", "Constituição"],
  ["inteligencia", "Inteligência"],
  ["sabedoria", "Sabedoria"],
  ["carisma", "Carisma"]
];
var A = ATRIBUTOS_PADRAO; // Alias

// Mapeamento de atributos legados (ex: "for" -> "forca")
var MAPA_ATRIBUTO_LEGADO = {
  "for": "forca",
  "des": "destreza",
  "con": "constituicao",
  "int": "inteligencia",
  "sab": "sabedoria",
  "car": "carisma"
};

// Lista de Perícias Padrão: [nome, atributo-base]
var PERICIAS_PADRAO = [
  ["Acrobacia", "destreza"],
  ["Adestramento", "carisma"],
  ["Atletismo", "forca"],
  ["Atuação", "carisma"],
  ["Cavalgar", "destreza"],
  ["Conhecimento", "inteligencia"],
  ["Cura", "sabedoria"],
  ["Diplomacia", "carisma"],
  ["Enganação", "carisma"],
  ["Fortitude", "constituicao"],
  ["Furtividade", "destreza"],
  ["Guerra", "inteligencia"],
  ["Iniciativa", "destreza"],
  ["Intimidação", "carisma"],
  ["Intuição", "sabedoria"],
  ["Investigação", "inteligencia"],
  ["Jogatina", "carisma"],
  ["Ladinagem", "destreza"],
  ["Luta", "forca"],
  ["Misticismo", "inteligencia"],
  ["Nobreza", "inteligencia"],
  ["Ofício", "inteligencia"],
  ["Percepção", "sabedoria"],
  ["Pilotagem", "destreza"],
  ["Pontaria", "destreza"],
  ["Reflexos", "destreza"],
  ["Religião", "sabedoria"],
  ["Sobrevivência", "sabedoria"],
  ["Vontade", "sabedoria"],
  ["Medicina", "sabedoria"]
];
var S = PERICIAS_PADRAO; // Alias

// Índices das 25 perícias visíveis inicialmente na ficha
var INDICES_PERICIAS_INICIAIS = [0, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 29, 19, 20, 21, 22, 24, 25, 26, 27, 28];
var DEF = INDICES_PERICIAS_INICIAIS; // Alias

// Mapeamento bidirecional de compatibilidade (Legado <-> Novo)
var MAPA_CHAVES_LEGADO_PARA_NOVO = {
  "v-for": "atr_forca",
  "v-des": "atr_destreza",
  "v-con": "atr_constituicao",
  "v-int": "atr_inteligencia",
  "v-sab": "atr_sabedoria",
  "v-car": "atr_carisma",
  "pv": "vida_atual",
  "pvm": "vida_maxima",
  "pm": "mana_atual",
  "pmm": "mana_maxima",
  "pvt": "vida_temporaria",
  "defx": "defesa_bonus",
  "desl": "deslocamento",
  "dado": "dados_sorte_qtd",
  "carga": "carga_maxima",
  "eqp": "equipamento",
  "pas": "passivas",
  "hab": "anotacoes",
  "img": "imagem",
  "cn0": "moeda_nome",
  "tib": "moeda_qtd",
  "cl": "pocao_cura_nome",
  "cq": "pocao_cura_qtd",
  "ml": "pocao_mana_nome",
  "mq": "pocao_mana_qtd",
  "_list": "_pericias_ativas",
  "_hl": "_habilidades_ordem",
  "_ts": "_timestamp",
  "_m2": "_schema_versao"
};

var MAPA_CHAVES_NOVO_PARA_LEGADO = {};
for (var leg in MAPA_CHAVES_LEGADO_PARA_NOVO) {
  MAPA_CHAVES_NOVO_PARA_LEGADO[MAPA_CHAVES_LEGADO_PARA_NOVO[leg]] = leg;
}

// Conversores dinâmicos de chaves
function converterChaveParaNovo(chave) {
  if (MAPA_CHAVES_LEGADO_PARA_NOVO[chave]) return MAPA_CHAVES_LEGADO_PARA_NOVO[chave];
  var m;
  if ((m = /^t(\d+)$/.exec(chave))) return "pericia_treinada_" + m[1];
  if ((m = /^sn(\d+)$/.exec(chave))) return "pericia_nome_" + m[1];
  if ((m = /^sa(\d+)$/.exec(chave))) return "pericia_atributo_" + m[1];
  if ((m = /^o(\d+)$/.exec(chave))) return "pericia_outros_" + m[1];
  if ((m = /^in(\d+)$/.exec(chave))) return "item_nome_" + m[1];
  if ((m = /^iq(\d+)$/.exec(chave))) return "item_qtd_" + m[1];
  if ((m = /^ie(\d+)$/.exec(chave))) return "item_espaco_" + m[1];
  if ((m = /^hn(\d+)$/.exec(chave))) return "hab_nome_" + m[1];
  if ((m = /^hd(\d+)$/.exec(chave))) return "hab_dano_" + m[1];
  if ((m = /^hs(\d+)$/.exec(chave))) return "hab_escala_" + m[1];
  if ((m = /^ht(\d+)$/.exec(chave))) return "hab_tipo_" + m[1];
  if ((m = /^hx(\d+)$/.exec(chave))) return "hab_descricao_" + m[1];
  return chave;
}

function converterChaveParaLegado(chave) {
  if (MAPA_CHAVES_NOVO_PARA_LEGADO[chave]) return MAPA_CHAVES_NOVO_PARA_LEGADO[chave];
  var m;
  if ((m = /^pericia_treinada_(\d+)$/.exec(chave))) return "t" + m[1];
  if ((m = /^pericia_nome_(\d+)$/.exec(chave))) return "sn" + m[1];
  if ((m = /^pericia_atributo_(\d+)$/.exec(chave))) return "sa" + m[1];
  if ((m = /^pericia_outros_(\d+)$/.exec(chave))) return "o" + m[1];
  if ((m = /^item_nome_(\d+)$/.exec(chave))) return "in" + m[1];
  if ((m = /^item_qtd_(\d+)$/.exec(chave))) return "iq" + m[1];
  if ((m = /^item_espaco_(\d+)$/.exec(chave))) return "ie" + m[1];
  if ((m = /^hab_nome_(\d+)$/.exec(chave))) return "hn" + m[1];
  if ((m = /^hab_dano_(\d+)$/.exec(chave))) return "hd" + m[1];
  if ((m = /^hab_escala_(\d+)$/.exec(chave))) return "hs" + m[1];
  if ((m = /^hab_tipo_(\d+)$/.exec(chave))) return "ht" + m[1];
  if ((m = /^hab_descricao_(\d+)$/.exec(chave))) return "hx" + m[1];
  return chave;
}

// Dicionário de tradução para exibição amigável no Histórico de Alterações
var DICIONARIO_NOMES_HISTORICO = {
  classe: "Classe",
  nivel: "Nível",
  nome: "Nome",
  subtitulo: "Subtítulo",
  raca: "Raça",
  origem: "Origem",
  devocao: "Devoção",
  antecedentes: "Antecedentes",
  vida_atual: "PV atuais",
  vida_maxima: "PV máximos",
  mana_atual: "PM atuais",
  mana_maxima: "PM máximos",
  vida_temporaria: "PV temporários",
  defesa_bonus: "Bônus de defesa",
  deslocamento: "Deslocamento",
  dados_sorte_qtd: "Dado da sorte",
  carga_maxima: "Limite de carga",
  equipamento: "Equipado",
  passivas: "Características passivas",
  anotacoes: "Anotações",
  imagem: "Imagem do personagem",
  moeda_nome: "Moeda (nome)",
  moeda_qtd: "Moeda (quantidade)",
  pocao_cura_nome: "Poção de cura (nome)",
  pocao_cura_qtd: "Poção de cura (quantidade)",
  pocao_mana_nome: "Poção de mana (nome)",
  pocao_mana_qtd: "Poção de mana (quantidade)"
};
var HNAME = DICIONARIO_NOMES_HISTORICO; // Alias

// Moldura SVG das pedras de atributos
var SVG_MOLDURA_ATRIBUTO = '<svg class="fr" viewBox="0 0 100 140" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round"><path class="p" stroke-width="2.4" d="M13 6H87Q96 6 96 15Q96 26 87 26H13Q4 26 4 15Q4 6 13 6Z"/><path class="l" stroke-width="1" d="M9 16Q9 11 14 11M91 16Q91 11 86 11M9 16Q9 21 14 21M91 16Q91 21 86 21"/><path class="p" stroke-width="2.4" d="M10 32H90V101H10Z"/><path class="l" stroke-width="1" d="M15 37H85V96H15Z"/><path class="l" stroke-width="1.2" d="M10 44Q18 44 18 32M90 44Q82 44 82 32M10 89Q18 89 18 101M90 89Q82 89 82 101"/><path class="k" d="M50 29L53 32L50 35L47 32Z"/><g transform="translate(32 91) scale(.56)"><path class="p" stroke-width="3.2" d="M32 8C19 8 10 17 10 29c0 8 4 13 9 16v9h8v-5h10v5h8v-9c5-3 9-8 9-16C54 17 45 8 32 8z"/><ellipse class="k" cx="23" cy="30" rx="5" ry="6"/><ellipse class="k" cx="41" cy="30" rx="5" ry="6"/><path class="k" d="M32 37l-3 6h6z"/><path class="l" stroke-width="2.5" d="M27 48v6M32 49v5M37 48v6"/></g></svg>';
var FR = SVG_MOLDURA_ATRIBUTO; // Alias

// Funções utilitárias fundamentais
function capitalizar(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}
var cap = capitalizar; // Alias

function converterParaInteiro(valor) {
  return parseInt(valor, 10) || 0;
}
var n = converterParaInteiro; // Alias

function escaparHtml(texto) {
  var elemento = document.createElement("div");
  elemento.textContent = texto == null ? "" : texto;
  return elemento.innerHTML;
}
var esc = escaparHtml; // Alias

function calcularPorcentagem(atual, maximo) {
  return maximo > 0 ? Math.max(0, Math.min(100, (atual / maximo) * 100)) : 0;
}
var pct = calcularPorcentagem; // Alias
