/* ==========================================================================
   Armazenamento Local, Inicialização e Migração de Dados (localStorage)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

var PARAMETROS_URL = new URLSearchParams(location.search);
var MODO_VISUALIZACAO = PARAMETROS_URL.get("f");
var USAR_APENAS_MEMORIA = false;
var CODIGO_FICHA = "";
var MODO_EDICAO = false;
var DADOS_BASE_SINCRONIZACAO = null;
var DADOS_BASE_PRONTOS = false;
var salvandoNuvem = false;
var MEMORIA_FICHA = null;

// Aliases para retrocompatibilidade
var QS = PARAMETROS_URL;
var VIEW = MODO_VISUALIZACAO;
var USEMEM = USAR_APENAS_MEMORIA;
var CODE = CODIGO_FICHA;
var EDIT = MODO_EDICAO;
var BASE = DADOS_BASE_SINCRONIZACAO;
var BASEOK = DADOS_BASE_PRONTOS;
var pushing = salvandoNuvem;
var MEM = MEMORIA_FICHA;

// Geração ou recuperação do código único de 8 caracteres da ficha
(function() {
  CODIGO_FICHA = MODO_VISUALIZACAO || "";
  if (!CODIGO_FICHA) {
    try {
      CODIGO_FICHA = localStorage.getItem("ficha-tormenta-code") || "";
    } catch (e) {}
  }
  if (!CODIGO_FICHA) {
    var caracteres = "abcdefghjkmnpqrstuvwxyz23456789";
    var bytesAleatorios = new Uint8Array(8);
    crypto.getRandomValues(bytesAleatorios);
    for (var i = 0; i < 8; i++) {
      CODIGO_FICHA += caracteres[bytesAleatorios[i] % caracteres.length];
    }
    try {
      localStorage.setItem("ficha-tormenta-code", CODIGO_FICHA);
    } catch (e) {}
  }
  CODE = CODIGO_FICHA;
})();

function obterArmazenamentoLocal(chave) {
  try {
    return localStorage.getItem(chave);
  } catch (e) {
    return null;
  }
}
var lget = obterArmazenamentoLocal; // Alias

function definirArmazenamentoLocal(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch (e) {}
}
var lset = definirArmazenamentoLocal; // Alias

// Lista de perícias ativas
var listaPericiasAtivas = null;
if (!MODO_VISUALIZACAO) {
  try {
    listaPericiasAtivas = JSON.parse(localStorage.getItem(CHAVE_LOCAL_PERICIAS) || "null");
  } catch (e) {}
}
if (!Array.isArray(listaPericiasAtivas)) {
  listaPericiasAtivas = INDICES_PERICIAS_INICIAIS.slice();
}
var list = listaPericiasAtivas; // Alias

function salvarListaPericias() {
  if (MODO_VISUALIZACAO) return;
  try {
    localStorage.setItem(CHAVE_LOCAL_PERICIAS, JSON.stringify(listaPericiasAtivas));
  } catch (e) {}
}
var saveList = salvarListaPericias; // Alias

// Migração inteligente de dados legados para o novo schema semântico
function migrarDadosLegados(dados) {
  if (!dados) return dados;

  // Migração legada v1 -> v2 (se existirem campos antigos aw, at, ad, etc.)
  if (!dados._m2 && !dados._schema_versao) {
    var hLista = Array.isArray(dados._hl) ? dados._hl.slice() : [];
    hLista.forEach(function(id) {
      if (dados["hx" + id] === undefined) {
        var texto = [dados["he" + id]];
        if (dados["hc" + id]) texto.push("Custo: " + dados["hc" + id]);
        texto = texto.filter(Boolean).join(" | ");
        if (texto) dados["hx" + id] = texto;
      }
    });
    var proximoId = Math.max.apply(null, hLista.concat([-1])) + 1;
    for (var j = 0; j < 5; j++) {
      if (dados["aw" + j] || dados["at" + j] || dados["ad" + j] || dados["ac" + j]) {
        var novoId = proximoId++;
        hLista.push(novoId);
        dados["hn" + novoId] = dados["aw" + j] || "";
        dados["hd" + novoId] = dados["ad" + j] || "";
        dados["ht" + novoId] = "Ataque";
        var tPartes = [];
        if (dados["at" + j]) tPartes.push("Teste: " + dados["at" + j]);
        if (dados["ac" + j]) tPartes.push("Crítico: " + dados["ac" + j]);
        dados["hx" + novoId] = tPartes.join(" | ");
      }
    }
    if (hLista.length) dados._hl = hLista;
    dados._m2 = 1;
  }

  // Migração v2 -> v3 (chaves abreviadas para nomes semânticos)
  var dadosMigrados = {};
  for (var k in dados) {
    var novaChave = typeof converterChaveParaNovo === "function" ? converterChaveParaNovo(k) : k;
    dadosMigrados[novaChave] = dados[k];
  }

  // Sincronizar listas e flags de metadados
  if (dados._list && !dadosMigrados._pericias_ativas) dadosMigrados._pericias_ativas = dados._list;
  if (dados._hl && !dadosMigrados._habilidades_ordem) dadosMigrados._habilidades_ordem = dados._hl;
  if (dados._ts && !dadosMigrados._timestamp) dadosMigrados._timestamp = dados._ts;
  dadosMigrados._schema_versao = 3;

  return dadosMigrados;
}
var migr = migrarDadosLegados; // Alias

// Carregar estado inicial salvo
var DADOS_INICIAIS = null;
if (!MODO_VISUALIZACAO) {
  try {
    var bruto = JSON.parse(localStorage.getItem(CHAVE_LOCAL_FICHA) || "null");
    if (bruto) {
      DADOS_INICIAIS = migrarDadosLegados(bruto);
      localStorage.setItem(CHAVE_LOCAL_FICHA, JSON.stringify(DADOS_INICIAIS));
    }
  } catch (e) {}
}
var D0 = DADOS_INICIAIS; // Alias

var ordemHabilidades = (DADOS_INICIAIS && (DADOS_INICIAIS._habilidades_ordem || DADOS_INICIAIS._hl)) || [0, 1, 2];
var hl = ordemHabilidades; // Alias

function salvarFicha() {
  if (MODO_VISUALIZACAO && !MODO_EDICAO) return;
  var dados = {};

  document.querySelectorAll("[data-k]").forEach(function(elemento) {
    dados[elemento.dataset.k] = elemento.type === "checkbox" ? elemento.checked : elemento.value;
  });

  dados._pericias_ativas = listaPericiasAtivas;
  dados._habilidades_ordem = ordemHabilidades;
  dados._schema_versao = 3;
  dados._timestamp = Date.now();

  // Aliases nos metadados para garantir compatibilidade retroativa
  dados._list = listaPericiasAtivas;
  dados._hl = ordemHabilidades;
  dados._ts = dados._timestamp;

  MEMORIA_FICHA = dados;
  MEM = dados;

  if (!MODO_VISUALIZACAO) {
    try {
      localStorage.setItem(CHAVE_LOCAL_FICHA, JSON.stringify(dados));
    } catch (e) {}
  }

  if (typeof enviarParaNuvemDebounced === "function") {
    enviarParaNuvemDebounced();
  } else if (typeof cloudPush === "function") {
    cloudPush();
  }
}
var save = salvarFicha; // Alias

function carregarFicha() {
  var dados = null;
  if (!MODO_VISUALIZACAO && !USAR_APENAS_MEMORIA) {
    try {
      dados = JSON.parse(localStorage.getItem(CHAVE_LOCAL_FICHA) || "null");
    } catch (e) {}
  }
  if (!dados) dados = MEMORIA_FICHA || MEM;
  if (!dados) return;

  document.querySelectorAll("[data-k]").forEach(function(elemento) {
    var chave = elemento.dataset.k;
    var valor = dados[chave];

    // Fallback: se não achar a chave nova, tenta buscar pela chave legada
    if (valor === undefined && typeof converterChaveParaLegado === "function") {
      var chaveLegada = converterChaveParaLegado(chave);
      valor = dados[chaveLegada];
    }

    if (valor === undefined) return;

    if (elemento.type === "checkbox") {
      elemento.checked = Boolean(valor);
    } else {
      elemento.value = valor;
    }
  });
}
var load = carregarFicha; // Alias

function gravarLocalmente(dados) {
  if (MODO_VISUALIZACAO) return;
  definirArmazenamentoLocal(CHAVE_LOCAL_FICHA, JSON.stringify(dados));
  salvarListaPericias();
}
var writeLocal = gravarLocalmente; // Alias

function obterTimestampLocal() {
  var dados = null;
  try {
    dados = JSON.parse(localStorage.getItem(CHAVE_LOCAL_FICHA) || "null");
  } catch (e) {}
  return (dados && (dados._timestamp || dados._ts)) || 0;
}
var localTs = obterTimestampLocal; // Alias

function reiniciarFichaApagada() {
  [CHAVE_LOCAL_FICHA, CHAVE_LOCAL_PERICIAS, CHAVE_LOCAL_SINCRONIZADA, "ficha-tormenta-code"].forEach(function(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (e) {}
  });
  definirArmazenamentoLocal("ficha-tormenta-msg", "O mestre apagou a sua ficha anterior. Esta é uma ficha nova.");
  location.reload();
}
var gone = reiniciarFichaApagada; // Alias
