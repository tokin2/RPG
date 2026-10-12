/* ==========================================================================
   Armazenamento Local e Migração de Dados (localStorage)
   ========================================================================== */

var QS = new URLSearchParams(location.search);
var VIEW = QS.get("f");
var USEMEM = false;
var CODE = "";
var EDIT = false;
var BASE = null;
var BASEOK = false;
var pushing = false;
var MEM = null;

// Geração ou recuperação do código de 8 caracteres da ficha
(function() {
  CODE = VIEW || "";
  if (!CODE) {
    try {
      CODE = localStorage.getItem("ficha-tormenta-code") || "";
    } catch (x) {}
  }
  if (!CODE) {
    var c = "abcdefghjkmnpqrstuvwxyz23456789", a = new Uint8Array(8);
    crypto.getRandomValues(a);
    for (var i = 0; i < 8; i++) CODE += c[a[i] % c.length];
    try {
      localStorage.setItem("ficha-tormenta-code", CODE);
    } catch (x) {}
  }
})();

function lget(k) {
  try {
    return localStorage.getItem(k);
  } catch (x) {
    return null;
  }
}

function lset(k, v) {
  try {
    localStorage.setItem(k, v);
  } catch (x) {}
}

// Recupera lista de perícias ativas
var list = null;
if (!VIEW) {
  try {
    list = JSON.parse(localStorage.getItem(LKEY) || "null");
  } catch (x) {}
}
if (!Array.isArray(list)) {
  list = DEF.slice();
}

function saveList() {
  if (VIEW) return;
  try {
    localStorage.setItem(LKEY, JSON.stringify(list));
  } catch (x) {}
}

// Migração de fichas legadas para o esquema atual de habilidades dinâmicas
function migr(d) {
  if (!d || d._m2) return d;
  var h = Array.isArray(d._hl) ? d._hl.slice() : [], had = h.length > 0;
  h.forEach(function(i) {
    if (d["hx" + i] === undefined) {
      var t = [d["he" + i]];
      if (d["hc" + i]) t.push("Custo: " + d["hc" + i]);
      t = t.filter(Boolean).join(" | ");
      if (t) d["hx" + i] = t;
    }
  });
  var nx = Math.max.apply(null, h.concat([-1])) + 1;
  for (var j = 0; j < 5; j++) {
    if (d["aw" + j] || d["at" + j] || d["ad" + j] || d["ac" + j]) {
      var id = nx++, t = [];
      h.push(id);
      d["hn" + id] = d["aw" + j] || "";
      d["hd" + id] = d["ad" + j] || "";
      d["ht" + id] = "Ataque";
      if (d["at" + j]) t.push("Teste: " + d["at" + j]);
      if (d["ac" + j]) t.push("Crítico: " + d["ac" + j]);
      d["hx" + id] = t.join(" | ");
    }
  }
  if (had || h.length) d._hl = h;
  d._m2 = 1;
  return d;
}

var D0 = null;
if (!VIEW) {
  try {
    D0 = migr(JSON.parse(localStorage.getItem(KEY) || "null"));
    if (D0) localStorage.setItem(KEY, JSON.stringify(D0));
  } catch (x) {}
}

var hl = D0 && Array.isArray(D0._hl) ? D0._hl : [0, 1, 2];

function save() {
  if (VIEW && !EDIT) return;
  var d = {};
  document.querySelectorAll("[data-k]").forEach(function(e) {
    d[e.dataset.k] = e.type === "checkbox" ? e.checked : e.value;
  });
  d._list = list;
  d._hl = hl;
  d._m2 = 1;
  d._ts = Date.now();
  MEM = d;
  if (!VIEW) {
    try {
      localStorage.setItem(KEY, JSON.stringify(d));
    } catch (x) {}
  }
  if (typeof cloudPush === "function") cloudPush();
}

function load() {
  var d = null;
  if (!VIEW && !USEMEM) {
    try {
      d = JSON.parse(localStorage.getItem(KEY) || "null");
    } catch (x) {}
  }
  if (!d) d = MEM;
  if (!d) return;
  document.querySelectorAll("[data-k]").forEach(function(e) {
    if (d[e.dataset.k] === undefined) return;
    if (e.type === "checkbox") e.checked = d[e.dataset.k];
    else e.value = d[e.dataset.k];
  });
}

function writeLocal(d) {
  if (VIEW) return;
  lset(KEY, JSON.stringify(d));
  saveList();
}

function localTs() {
  var d = null;
  try {
    d = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (x) {}
  return (d && d._ts) || 0;
}

function gone() {
  [KEY, LKEY, SYNCK, "ficha-tormenta-code"].forEach(function(k) {
    try {
      localStorage.removeItem(k);
    } catch (x) {}
  });
  lset("ficha-tormenta-msg", "O mestre apagou a sua ficha anterior. Esta é uma ficha nova.");
  location.reload();
}
