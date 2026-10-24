/* ==========================================================================
   Armazenamento Local, Inicialização e Migração de Dados (localStorage)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

var PARAMETROS_URL = new URLSearchParams(location.search);
var MODO_VISUALIZACAO = PARAMETROS_URL.get("f");
var CODIGO_JOGADOR_URL = PARAMETROS_URL.get("c") || PARAMETROS_URL.get("id") || PARAMETROS_URL.get("codigo");
var MODO_EDICAO_URL = PARAMETROS_URL.get("e");
var MODO_LEITURA_URL = PARAMETROS_URL.get("ro");

// Se a URL não trouxer ?f= E NÃO for um link explícito de jogador (?c=, ?nova),
// recupera a intenção temporária vinda da mesa do mestre (TTL de 60 segundos)
if (!MODO_VISUALIZACAO && !CODIGO_JOGADOR_URL && !PARAMETROS_URL.has("nova")) {
  try {
    var rawIntent = sessionStorage.getItem("ficha_mestre_ativa") || localStorage.getItem("ficha_mestre_ativa");
    if (rawIntent) {
      var intent = JSON.parse(rawIntent);
      if (intent && intent.id && (Date.now() - (intent.ts || 0) < 60000)) {
        MODO_VISUALIZACAO = sanitizarCodigo(intent.id);
        if (intent.modo === "e") {
          MODO_EDICAO_URL = "1";
        } else {
          MODO_LEITURA_URL = "1";
        }
      }
    }
  } catch (e) {}
}

// Limpa imediatamente a intenção de ambos os storages para que acessos subsequentes de jogador nunca herdem o modo mestre
try {
  sessionStorage.removeItem("ficha_mestre_ativa");
  localStorage.removeItem("ficha_mestre_ativa");
} catch (e) {}

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

// Geração ou recuperação do código único de 8 caracteres da ficha com suporte a URL independente por aba
(function() {
  if (MODO_VISUALIZACAO) {
    CODIGO_FICHA = sanitizarCodigo(MODO_VISUALIZACAO);
  } else if (CODIGO_JOGADOR_URL) {
    CODIGO_FICHA = sanitizarCodigo(CODIGO_JOGADOR_URL);
  }

  var pediuNova = PARAMETROS_URL.has("nova");
  if (!CODIGO_FICHA && !pediuNova) {
    try {
      CODIGO_FICHA = sanitizarCodigo(localStorage.getItem("ficha-tormenta-code") || "");
    } catch (e) {}
  }

  if (!CODIGO_FICHA) {
    var caracteres = "abcdefghjkmnpqrstuvwxyz23456789";
    var bytesAleatorios = new Uint8Array(8);
    crypto.getRandomValues(bytesAleatorios);
    for (var i = 0; i < 8; i++) {
      CODIGO_FICHA += caracteres[bytesAleatorios[i] % caracteres.length];
    }
  }

  if (MODO_VISUALIZACAO) {
    // Garante que a URL reflita ?f= e os modos mestre, mesmo se houve redirect anterior
    if (window.history && window.history.replaceState) {
      try {
        var urlAtual = new URL(window.location.href);
        if (urlAtual.searchParams.get("f") !== CODIGO_FICHA) {
          urlAtual.searchParams.set("f", CODIGO_FICHA);
          if (MODO_LEITURA_URL) urlAtual.searchParams.set("ro", "1");
          if (MODO_EDICAO_URL) urlAtual.searchParams.set("e", "1");
          urlAtual.searchParams.delete("c");
          urlAtual.searchParams.delete("nova");
          window.history.replaceState(null, "", urlAtual.toString());
        }
      } catch (e) {}
    }
  } else {
    try {
      localStorage.setItem("ficha-tormenta-code", CODIGO_FICHA);
    } catch (e) {}

    // Reflete o código na URL para permitir múltiplas abas independentes e links diretos
    if (window.history && window.history.replaceState) {
      try {
        var urlAtual = new URL(window.location.href);
        if (urlAtual.searchParams.get("c") !== CODIGO_FICHA || urlAtual.searchParams.has("nova")) {
          urlAtual.searchParams.set("c", CODIGO_FICHA);
          urlAtual.searchParams.delete("nova");
          urlAtual.searchParams.delete("f");
          window.history.replaceState(null, "", urlAtual.toString());
        }
      } catch (e) {}
    }
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

// Helpers para leitura e escrita isoladas por ficha com fallback de migração automática
function obterDadosFichaArmazenados(codigo) {
  var cod = codigo || CODIGO_FICHA;
  var chaveEspecifica = obterChaveLocalFicha(cod);
  var bruto = obterArmazenamentoLocal(chaveEspecifica);
  if (!bruto && cod) {
    var codLegado = obterArmazenamentoLocal("ficha-tormenta-code");
    if (codLegado === cod) {
      bruto = obterArmazenamentoLocal(CHAVE_LOCAL_FICHA_BASE);
      if (bruto) {
        definirArmazenamentoLocal(chaveEspecifica, bruto);
      }
    }
  }
  try {
    return bruto ? JSON.parse(bruto) : null;
  } catch (e) {
    return null;
  }
}

function obterPericiasArmazenadas(codigo) {
  var cod = codigo || CODIGO_FICHA;
  var chaveEspecifica = obterChaveLocalPericias(cod);
  var bruto = obterArmazenamentoLocal(chaveEspecifica);
  if (!bruto && cod) {
    var codLegado = obterArmazenamentoLocal("ficha-tormenta-code");
    if (codLegado === cod) {
      bruto = obterArmazenamentoLocal(CHAVE_LOCAL_PERICIAS_BASE);
      if (bruto) {
        definirArmazenamentoLocal(chaveEspecifica, bruto);
      }
    }
  }
  try {
    var lista = bruto ? JSON.parse(bruto) : null;
    return Array.isArray(lista) ? lista : null;
  } catch (e) {
    return null;
  }
}

function gravarFichaLocal(dados, codigo) {
  var cod = codigo || CODIGO_FICHA;
  if (!cod || !dados) return;
  definirArmazenamentoLocal(obterChaveLocalFicha(cod), JSON.stringify(dados));
}

function gravarPericiasLocais(lista, codigo) {
  var cod = codigo || CODIGO_FICHA;
  if (!cod || !Array.isArray(lista)) return;
  definirArmazenamentoLocal(obterChaveLocalPericias(cod), JSON.stringify(lista));
}

// Lista de perícias ativas
var listaPericiasAtivas = null;
if (!MODO_VISUALIZACAO) {
  listaPericiasAtivas = obterPericiasArmazenadas(CODIGO_FICHA);
}
function validarPericiasValidas(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return false;
  for (var i = 0; i < lista.length; i++) {
    if (typeof lista[i] !== "number" || (lista[i] > 17 && lista[i] < 100)) {
      return false;
    }
  }
  return true;
}
if (!validarPericiasValidas(listaPericiasAtivas)) {
  listaPericiasAtivas = INDICES_PERICIAS_INICIAIS.slice();
}
var list = listaPericiasAtivas; // Alias

function salvarListaPericias() {
  if (MODO_VISUALIZACAO) return;
  gravarPericiasLocais(listaPericiasAtivas, CODIGO_FICHA);
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
    var valorCampo = dados[k];
    if (/^pericia_atributo_\d+$/.test(novaChave) && MAPA_ATRIBUTO_LEGADO && MAPA_ATRIBUTO_LEGADO[valorCampo]) {
      valorCampo = MAPA_ATRIBUTO_LEGADO[valorCampo];
    }
    dadosMigrados[novaChave] = valorCampo;
  }

  // Sincronizar listas e flags de metadados
  if (dados._list && !dadosMigrados._pericias_ativas) dadosMigrados._pericias_ativas = dados._list;
  if (dados._hl && !dadosMigrados._habilidades_ordem) dadosMigrados._habilidades_ordem = dados._hl;
  if (dados._ts && !dadosMigrados._timestamp) dadosMigrados._timestamp = dados._ts;

  // Migração v3 -> v4 (Perícias Baldur's Gate 3 / D&D 5e em ordem alfabética)
  var jaMigradoParaBg3 = Boolean(dadosMigrados._bg3_pericias && dadosMigrados._schema_versao && dadosMigrados._schema_versao >= 4);
  if (!jaMigradoParaBg3) {
    var listaPer = dadosMigrados._pericias_ativas || dadosMigrados._list;
    var precisaMigrarPericias = false;
    if (!Array.isArray(listaPer) || listaPer.length !== INDICES_PERICIAS_INICIAIS.length) {
      precisaMigrarPericias = true;
    } else {
      for (var p = 0; p < listaPer.length; p++) {
        if (listaPer[p] > 17 && listaPer[p] < 100) {
          precisaMigrarPericias = true;
          break;
        }
      }
    }

    if (precisaMigrarPericias) {
      // Mapeamento inteligente de proficiências previamente marcadas na ficha do jogador
      var nomesTreinados = {};
      var periciasTormentaAntigas = [
        "Acrobacia", "Adestramento", "Atletismo", "Atuação", "Cavalgar",
        "Conhecimento", "Cura", "Diplomacia", "Enganação", "Fortitude",
        "Furtividade", "Guerra", "Iniciativa", "Intimidação", "Intuição",
        "Investigação", "Jogatina", "Ladinagem", "Luta", "Misticismo",
        "Nobreza", "Ofício", "Percepção", "Pilotagem", "Pontaria",
        "Reflexos", "Religião", "Sobrevivência", "Vontade", "Medicina"
      ];
      for (var k = 0; k < 30; k++) {
        var treinado = dadosMigrados["pericia_treinada_" + k] === true || dadosMigrados["pericia_treinada_" + k] === "true" || dados["t" + k] === true || dados["t" + k] === "true";
        if (treinado) {
          var nomeAntigo = (dados["pericia_nome_" + k] || dados["sn" + k] || periciasTormentaAntigas[k] || "").trim().toLowerCase();
          if (nomeAntigo) nomesTreinados[nomeAntigo] = true;
        }
      }

      var mapaNomeParaBg3 = {
        "acrobacia": 0,
        "adestramento": 1,
        "adestrar animais": 1,
        "atuação": 2,
        "atuacao": 2,
        "apresentação": 2,
        "apresentacao": 2,
        "arcanismo": 3,
        "misticismo": 3,
        "furtividade": 4,
        "história": 5,
        "historia": 5,
        "conhecimento": 5,
        "intimidação": 6,
        "intimidacao": 6,
        "intuição": 7,
        "intuicao": 7,
        "investigação": 8,
        "investigacao": 8,
        "enganação": 9,
        "enganacao": 9,
        "manipulação": 9,
        "manipulacao": 9,
        "cura": 10,
        "medicina": 10,
        "natureza": 11,
        "percepção": 12,
        "percepcao": 12,
        "diplomacia": 13,
        "persuasão": 13,
        "persuasao": 13,
        "atletismo": 14,
        "preparo físico": 14,
        "preparo fisico": 14,
        "ladinagem": 15,
        "prestidigitação": 15,
        "prestidigitacao": 15,
        "religião": 16,
        "religiao": 16,
        "sobrevivência": 17,
        "sobrevivencia": 17
      };

      var novosTreinados = {};
      for (var nome in nomesTreinados) {
        if (mapaNomeParaBg3[nome] !== undefined) {
          novosTreinados[mapaNomeParaBg3[nome]] = true;
        }
      }

      // Limpar campos de perícias legadas além do índice 17
      for (var oldK = 18; oldK < 35; oldK++) {
        delete dadosMigrados["pericia_treinada_" + oldK];
        delete dadosMigrados["pericia_nome_" + oldK];
        delete dadosMigrados["pericia_atributo_" + oldK];
        delete dadosMigrados["pericia_outros_" + oldK];
      }

      dadosMigrados._pericias_ativas = INDICES_PERICIAS_INICIAIS.slice();
      dadosMigrados._list = dadosMigrados._pericias_ativas;
      for (var idx = 0; idx < PERICIAS_PADRAO.length; idx++) {
        dadosMigrados["pericia_nome_" + idx] = PERICIAS_PADRAO[idx][0];
        dadosMigrados["pericia_atributo_" + idx] = PERICIAS_PADRAO[idx][1];
        dadosMigrados["pericia_treinada_" + idx] = Boolean(novosTreinados[idx]);
      }
    }
    dadosMigrados._bg3_pericias = true;
  }
  dadosMigrados._schema_versao = 4;

  return dadosMigrados;
}
var migr = migrarDadosLegados; // Alias

// Carregar estado inicial salvo
var DADOS_INICIAIS = null;
if (!MODO_VISUALIZACAO) {
  var bruto = obterDadosFichaArmazenados(CODIGO_FICHA);
  if (bruto) {
    DADOS_INICIAIS = migrarDadosLegados(bruto);
    gravarFichaLocal(DADOS_INICIAIS, CODIGO_FICHA);
    if (Array.isArray(DADOS_INICIAIS._pericias_ativas)) {
      listaPericiasAtivas = DADOS_INICIAIS._pericias_ativas.filter(function(id) {
        return typeof id === "number" && (id < 18 || id >= 100);
      });
      list = listaPericiasAtivas;
      salvarListaPericias();
    }
  }
}
var D0 = DADOS_INICIAIS; // Alias

var ordemHabilidades = (DADOS_INICIAIS && (DADOS_INICIAIS._habilidades_ordem || DADOS_INICIAIS._hl)) || [0, 1, 2];
var hl = ordemHabilidades; // Alias

function salvarFicha() {
  if (MODO_VISUALIZACAO && !MODO_EDICAO) return;
  var dados = {};

  document.querySelectorAll("[data-k]").forEach(function(elemento) {
    var valorCampo = elemento.type === "checkbox"
      ? elemento.checked
      : (elemento.value !== undefined ? elemento.value : (elemento.textContent || ""));
    dados[elemento.dataset.k] = valorCampo;
  });

  dados._pericias_ativas = listaPericiasAtivas;
  dados._habilidades_ordem = ordemHabilidades;
  dados._schema_versao = 4;
  dados._bg3_pericias = true;
  dados._timestamp = Date.now();

  // Aliases nos metadados para garantir compatibilidade retroativa
  dados._list = listaPericiasAtivas;
  dados._hl = ordemHabilidades;
  dados._ts = dados._timestamp;

  MEMORIA_FICHA = dados;
  MEM = dados;

  if (!MODO_VISUALIZACAO) {
    gravarFichaLocal(dados, CODIGO_FICHA);
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
    dados = obterDadosFichaArmazenados(CODIGO_FICHA);
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
    } else if ("value" in elemento) {
      if (elemento.tagName === "SELECT" && MAPA_ATRIBUTO_LEGADO && MAPA_ATRIBUTO_LEGADO[valor]) {
        valor = MAPA_ATRIBUTO_LEGADO[valor];
      }
      elemento.value = valor;
    }
  });

  if (typeof atualizarVisibilidadeHabilidades === "function") {
    atualizarVisibilidadeHabilidades();
  }
  if (typeof exibirImagemPersonagem === "function") {
    exibirImagemPersonagem();
  }
}
var load = carregarFicha; // Alias

function gravarLocalmente(dados) {
  if (MODO_VISUALIZACAO) return;
  gravarFichaLocal(dados, CODIGO_FICHA);
  salvarListaPericias();
}
var writeLocal = gravarLocalmente; // Alias

function obterTimestampLocal() {
  var dados = obterDadosFichaArmazenados(CODIGO_FICHA);
  return (dados && (dados._timestamp || dados._ts)) || 0;
}
var localTs = obterTimestampLocal; // Alias

function reiniciarFichaApagada() {
  var cod = CODIGO_FICHA;
  [
    obterChaveLocalFicha(cod),
    obterChaveLocalPericias(cod),
    obterChaveLocalSincronizada(cod),
    CHAVE_LOCAL_FICHA_BASE,
    CHAVE_LOCAL_PERICIAS_BASE,
    CHAVE_LOCAL_SINCRONIZADA_BASE
  ].forEach(function(chave) {
    try {
      localStorage.removeItem(chave);
    } catch (e) {}
  });
  if (localStorage.getItem("ficha-tormenta-code") === cod) {
    try {
      localStorage.removeItem("ficha-tormenta-code");
    } catch (e) {}
  }
  definirArmazenamentoLocal("ficha-tormenta-msg", "O mestre apagou a sua ficha anterior. Esta é uma ficha nova.");
  if (window.location.search) {
    window.location.href = window.location.pathname;
  } else {
    location.reload();
  }
}
var gone = reiniciarFichaApagada; // Alias
