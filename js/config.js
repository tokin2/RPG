/* ==========================================================================
   Configurações e Constantes Globais - Tormenta20 RPG
   Compatível com GitHub Pages e Supabase REST API
   ========================================================================== */

var SB_URL = "https://tfguskhdabewpabiqbml.supabase.co";
var SB_KEY = "sb_publishable_F9RIyN4V4nl9d4H40Wf2bw_EcuPJje7";

var KEY = "ficha-tormenta-v1";
var LKEY = "ficha-tormenta-skills-v4";
var SYNCK = "ficha-tormenta-synced";

// Lista de Atributos: [identificador, nome por extenso]
var A = [
  ["for", "Força"],
  ["des", "Destreza"],
  ["con", "Constituição"],
  ["int", "Inteligência"],
  ["sab", "Sabedoria"],
  ["car", "Carisma"]
];

// Lista de Perícias Padrão: [nome, atributo-base]
var S = [
  ["Acrobacia", "des"],
  ["Adestramento", "car"],
  ["Atletismo", "for"],
  ["Atuação", "car"],
  ["Cavalgar", "des"],
  ["Conhecimento", "int"],
  ["Cura", "sab"],
  ["Diplomacia", "car"],
  ["Enganação", "car"],
  ["Fortitude", "con"],
  ["Furtividade", "des"],
  ["Guerra", "int"],
  ["Iniciativa", "des"],
  ["Intimidação", "car"],
  ["Intuição", "sab"],
  ["Investigação", "int"],
  ["Jogatina", "car"],
  ["Ladinagem", "des"],
  ["Luta", "for"],
  ["Misticismo", "int"],
  ["Nobreza", "int"],
  ["Ofício", "int"],
  ["Percepção", "sab"],
  ["Pilotagem", "des"],
  ["Pontaria", "des"],
  ["Reflexos", "des"],
  ["Religião", "sab"],
  ["Sobrevivência", "sab"],
  ["Vontade", "sab"],
  ["Medicina", "sab"]
];

// Índices das perícias padrão visíveis inicialmente
var DEF = [0, 2, 3, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 17, 18, 29, 19, 20, 21, 22, 24, 25, 26, 27, 28];

// Dicionário de tradução de chaves para nomes legíveis no histórico
var HNAME = {
  classe: "Classe",
  nivel: "Nível",
  nome: "Nome",
  subtitulo: "Subtítulo",
  raca: "Raça",
  origem: "Origem",
  devocao: "Devoção",
  antecedentes: "Antecedentes",
  pv: "PV atuais",
  pvm: "PV máximos",
  pm: "PM atuais",
  pmm: "PM máximos",
  pvt: "PV temporários",
  defx: "Bônus de defesa",
  desl: "Deslocamento",
  dado: "Dado da sorte",
  carga: "Limite de espaços",
  eqp: "Equipado",
  pas: "Características passivas",
  hab: "Anotações",
  img: "Imagem",
  cn0: "Moeda (nome)",
  tib: "Moeda (quantidade)",
  cl: "Poção de cura (nome)",
  cq: "Poção de cura (quantidade)",
  ml: "Poção de mana (nome)",
  mq: "Poção de mana (quantidade)"
};

// Moldura SVG das pedras de atributos
var FR = '<svg class="fr" viewBox="0 0 100 140" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round"><path class="p" stroke-width="2.4" d="M13 6H87Q96 6 96 15Q96 26 87 26H13Q4 26 4 15Q4 6 13 6Z"/><path class="l" stroke-width="1" d="M9 16Q9 11 14 11M91 16Q91 11 86 11M9 16Q9 21 14 21M91 16Q91 21 86 21"/><path class="p" stroke-width="2.4" d="M10 32H90V101H10Z"/><path class="l" stroke-width="1" d="M15 37H85V96H15Z"/><path class="l" stroke-width="1.2" d="M10 44Q18 44 18 32M90 44Q82 44 82 32M10 89Q18 89 18 101M90 89Q82 89 82 101"/><path class="k" d="M50 29L53 32L50 35L47 32Z"/><g transform="translate(32 91) scale(.56)"><path class="p" stroke-width="3.2" d="M32 8C19 8 10 17 10 29c0 8 4 13 9 16v9h8v-5h10v5h8v-9c5-3 9-8 9-16C54 17 45 8 32 8z"/><ellipse class="k" cx="23" cy="30" rx="5" ry="6"/><ellipse class="k" cx="41" cy="30" rx="5" ry="6"/><path class="k" d="M32 37l-3 6h6z"/><path class="l" stroke-width="2.5" d="M27 48v6M32 49v5M37 48v6"/></g></svg>';

// Funções utilitárias básicas compartilhadas
function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function n(v) {
  return parseInt(v, 10) || 0;
}

function esc(t) {
  var d = document.createElement("div");
  d.textContent = t == null ? "" : t;
  return d.innerHTML;
}

function pct(a, m) {
  return m > 0 ? Math.max(0, Math.min(100, (a / m) * 100)) : 0;
}
