/* ==========================================================================
   Motor de Cálculos e Regras de RPG (Tormenta20)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

function obterNumero(id) {
  var el = document.getElementById(id);
  return el ? (parseInt(el.value, 10) || 0) : 0;
}
var num = obterNumero; // Alias

function formatarSinal(numero) {
  return numero >= 0 ? "+" + numero : "" + numero;
}
var sg = formatarSinal; // Alias

function obterFloatDataK(chave) {
  var el = document.querySelector('[data-k="' + chave + '"]');
  if (!el && typeof converterChaveParaLegado === "function") {
    el = document.querySelector('[data-k="' + converterChaveParaLegado(chave) + '"]');
  }
  return el ? parseFloat(el.value) : NaN;
}
var fl = obterFloatDataK; // Alias

function calcularModificadorAtributo(identificador) {
  var attrNome = identificador;
  if (MAPA_ATRIBUTO_LEGADO && MAPA_ATRIBUTO_LEGADO[identificador]) {
    attrNome = MAPA_ATRIBUTO_LEGADO[identificador];
  }
  var el = document.getElementById("atr_" + attrNome) ||
    document.getElementById("v-" + identificador);
  var valor = el ? parseInt(el.value, 10) : 10;
  if (isNaN(valor)) valor = 10;
  return Math.floor((valor - 10) / 2);
}
var mod = calcularModificadorAtributo; // Alias

function atualizarDadosDaSorte() {
  var el = document.getElementById("dado");
  if (!el) return;
  var valor = parseInt(el.value, 10);
  if (isNaN(valor)) valor = 3;
  valor = Math.max(0, Math.min(3, valor));

  var htmlPips = "";
  for (var i = 0; i < 3; i++) {
    htmlPips += '<svg class="pip' + (i < valor ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/><path d="M12 7L17.5 16.5H6.5ZM12 2V7M21 7L17.5 16.5M3 7L6.5 16.5M12 22V16.5"/></svg>';
  }

  var containerPips = document.getElementById("pips");
  if (containerPips) containerPips.innerHTML = htmlPips;

  var textoContador = document.getElementById("dcnt");
  if (textoContador) textoContador.textContent = valor + " / 3";

  var botaoUsar = document.getElementById("dusar");
  if (botaoUsar) botaoUsar.disabled = valor <= 0;
}
var pips = atualizarDadosDaSorte; // Alias

function ajustarAlturaTextareas() {
  document.querySelectorAll(".hx").forEach(function (textarea) {
    if (textarea.hidden || textarea.offsetParent === null) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.max(30, textarea.scrollHeight + 2) + "px";
  });
}
var grow = ajustarAlturaTextareas; // Alias

function calcularFicha() {
  atualizarDadosDaSorte();
  ajustarAlturaTextareas();
  if (typeof exibirImagemPersonagem === "function") exibirImagemPersonagem();
  else if (typeof showPic === "function") showPic();

  // 1. Modificadores dos 6 Atributos
  ATRIBUTOS_PADRAO.forEach(function (attr) {
    var idMod = document.getElementById("mod_" + attr[0]) || document.getElementById("m-" + attr[0]);
    if (idMod) idMod.textContent = formatarSinal(calcularModificadorAtributo(attr[0]));
  });

  // 2. Inventário e Cálculo de Carga
  var pesoTotal = 0;
  for (var k = 0; k < 14; k++) {
    var inEl = document.querySelector('[data-k="item_nome_' + k + '"]') || document.querySelector('[data-k="in' + k + '"]');
    var nomeItem = inEl ? inEl.value.trim() : "";
    var qtd = obterFloatDataK("item_qtd_" + k);
    if (isNaN(qtd)) qtd = obterFloatDataK("iq" + k);
    var espaco = obterFloatDataK("item_espaco_" + k);
    if (isNaN(espaco)) espaco = obterFloatDataK("ie" + k);

    if (isNaN(qtd)) qtd = nomeItem ? 1 : 0;
    if (isNaN(espaco)) espaco = 0;
    pesoTotal += qtd * espaco;
  }

  var elementoCargaUsada = document.getElementById("usado");
  var limiteCarga = obterNumero("carga_maxima") || obterNumero("carga");
  if (elementoCargaUsada) {
    elementoCargaUsada.textContent = Math.round(pesoTotal * 10) / 10;
    elementoCargaUsada.className = (limiteCarga > 0 && pesoTotal > limiteCarga) ? "over" : "";
  }

  // 3. Bônus de Proficiência (D&D 5e / Baldur's Gate 3)
  var nivelAtual = Math.max(1, Math.min(20, obterNumero("nivel") || 1));
  var bonusProficiencia = 2 + Math.floor((nivelAtual - 1) / 4);
  var profEl = document.getElementById("prof");
  if (profEl) profEl.textContent = "+" + bonusProficiencia;

  // 4. Perícias BG3 / D&D 5e: Modificador do Atributo + Bônus de Proficiência (se treinada) + Outros
  var listaPericias = typeof listaPericiasAtivas !== "undefined" ? listaPericiasAtivas : list;
  if (Array.isArray(listaPericias)) {
    listaPericias.forEach(function (indice) {
      var treinadaEl = document.getElementById("pericia_treinada_" + indice) || document.getElementById("t" + indice);
      var treino = (treinadaEl && treinadaEl.checked) ? bonusProficiencia : 0;

      var attrSelect = document.getElementById("pericia_atributo_" + indice) || document.getElementById("sa" + indice);
      var atributoEscolhido = attrSelect ? attrSelect.value : "forca";

      var elOutros = document.getElementById("pericia_outros_" + indice) || document.getElementById("o" + indice);
      var outrosValor = elOutros ? (parseInt(elOutros.value, 10) || 0) : 0;
      var totalSkillEl = document.getElementById("pericia_total_" + indice) || document.getElementById("s" + indice);

      if (totalSkillEl) {
        totalSkillEl.textContent = formatarSinal(calcularModificadorAtributo(atributoEscolhido) + treino + outrosValor);
      }
    });
  }

  // 5. Iniciativa (D&D 5e / Baldur's Gate 3: igual ao modificador de Destreza)
  var iniBadge = document.getElementById("ini");
  if (iniBadge) iniBadge.textContent = formatarSinal(calcularModificadorAtributo("destreza"));

  // 6. Defesa: 10 + Destreza + Bônus Adicional
  var elBonusDef = document.getElementById("defesa_bonus") || document.getElementById("defx");
  var bonusDefesa = elBonusDef ? (parseInt(elBonusDef.value, 10) || 0) : 0;
  var defesaEl = document.getElementById("defesa");
  if (defesaEl) defesaEl.textContent = 10 + calcularModificadorAtributo("destreza") + bonusDefesa;

  // 7. Barras de Progresso de Pontos de Vida (PV) e Pontos de Mana (PM)
  var vidaAtual = obterNumero("vida_atual") || obterNumero("pv");
  var vidaMax = obterNumero("vida_maxima") || obterNumero("pvm");
  var manaAtual = obterNumero("mana_atual") || obterNumero("pm");
  var manaMax = obterNumero("mana_maxima") || obterNumero("pmm");

  var barPv = document.getElementById("bpv");
  if (barPv) barPv.style.width = calcularPorcentagem(vidaAtual, vidaMax) + "%";

  var barPm = document.getElementById("bpm");
  if (barPm) barPm.style.width = calcularPorcentagem(manaAtual, manaMax) + "%";
}
var calc = calcularFicha; // Alias
