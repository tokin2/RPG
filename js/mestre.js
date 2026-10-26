/* ==========================================================================
   Controladores da Mesa do Mestre (mestre.html)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

var operacaoOcupada = false;
var fichasCarregadas = [];
var painelHistoricoAberto = false;
var LIMITE_HISTORICO = 150;

// Aliases para retrocompatibilidade
var busy = operacaoOcupada;
var ROWS = fichasCarregadas;
var HOPEN = painelHistoricoAberto;
var HLIM = LIMITE_HISTORICO;

function exibirMensagemStatus(texto) {
  var el = document.getElementById("msg");
  if (el) {
    el.textContent = texto;
    el.hidden = !texto;
  }
}
function obterLinkFicha(id, modo) {
  var param = modo === "ro" ? "&ro=1" : "&e=1";
  var baseUrl = "index.html";
  if (typeof window !== "undefined" && window.location && window.location.protocol !== "file:") {
    var path = window.location.pathname || "";
    if (path.endsWith("/mestre") || path === "/mestre") {
      baseUrl = "./";
    }
  }
  return baseUrl + "?f=" + encodeURIComponent(id) + param;
}


function carregarFichasMesa() {
  fetch(URL_SUPABASE + "/rest/v1/fichas?select=id,dados,updated_at&order=updated_at.desc", {
    headers: { apikey: CHAVE_PUBLICA_SUPABASE }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(linhas) {
    fichasCarregadas = linhas;
    ROWS = fichasCarregadas;
    if (operacaoOcupada) return;

    var statusEl = document.getElementById("st");
    if (statusEl) {
      statusEl.textContent = linhas.length
        ? linhas.length + " ficha(s) na mesa. Atualiza sozinho a cada 20 segundos."
        : "Nenhuma ficha salva ainda. Peça para o pessoal abrir e preencher a ficha.";
    }

    var gridEl = document.getElementById("g");
    if (gridEl) {
      gridEl.innerHTML = linhas.map(function(registro) {
        var d = registro.dados || {};

        // Extração de valores com suporte tanto ao novo schema quanto ao legado
        var desValor = d.atr_destreza !== undefined ? d.atr_destreza : (d["v-des"] !== undefined ? d["v-des"] : 10);
        var bonusDef = d.defesa_bonus !== undefined ? d.defesa_bonus : (d.defx || 0);
        var def = 10 + Math.floor((converterParaInteiro(desValor) - 10) / 2) + converterParaInteiro(bonusDef);

        var pvAtual = d.vida_atual !== undefined ? d.vida_atual : d.pv;
        var pvMax = d.vida_maxima !== undefined ? d.vida_maxima : d.pvm;
        var pmAtual = d.mana_atual !== undefined ? d.mana_atual : d.pm;
        var pmMax = d.mana_maxima !== undefined ? d.mana_maxima : d.pmm;
        var dadoSorte = d.dados_sorte_qtd !== undefined ? d.dados_sorte_qtd : (d.dado !== undefined ? d.dado : 3);

        var atualizadoEm = new Date(registro.updated_at).toLocaleString("pt-BR");

        var linkOlhar = obterLinkFicha(registro.id, "ro");
        var linkEditar = obterLinkFicha(registro.id, "e");

        var historicoNome = "";
        if (d.historico) {
          if (typeof HISTORICOS_BG3 !== "undefined") {
            var hFound = HISTORICOS_BG3.find(function(h) {
              return h.id === d.historico || h.nome.toLowerCase() === String(d.historico).toLowerCase();
            });
            historicoNome = hFound ? hFound.nome : (d.historico === "personalizado" ? "Personalizado" : d.historico);
          } else {
            historicoNome = d.historico;
          }
        }

        var subtituloPartes = [d.raca, d.classe, historicoNome].filter(Boolean);
        var subtituloTexto = subtituloPartes.join(" · ") + (d.nivel ? (subtituloPartes.length ? " · nível " : "Nível ") + d.nivel : "");

        return '<div class="card"><h2>' + escaparHtml(d.nome || "Sem nome") + '</h2><div class="m">' +
               escaparHtml(subtituloTexto) + '</div>' +
               '<div class="row"><span>PV</span><b>' + converterParaInteiro(pvAtual) + ' / ' + converterParaInteiro(pvMax) + '</b></div><div class="bar"><i style="width:' + calcularPorcentagem(converterParaInteiro(pvAtual), converterParaInteiro(pvMax)) + '%;background:var(--pv)"></i></div>' +
               '<div class="row"><span>PM</span><b>' + converterParaInteiro(pmAtual) + ' / ' + converterParaInteiro(pmMax) + '</b></div><div class="bar"><i style="width:' + calcularPorcentagem(converterParaInteiro(pmAtual), converterParaInteiro(pmMax)) + '%;background:var(--pm)"></i></div>' +
               '<div class="row"><span>Defesa <span class="def">' + def + '</span></span><span style="color:var(--muted);font-size:12px">' + escaparHtml(atualizadoEm) + '</span></div>' +
               '<div class="row" style="margin-top:6px"><span>Dado da sorte</span><b>' + Math.max(0, Math.min(3, converterParaInteiro(dadoSorte))) + ' / 3</b></div>' +
               '<a class="b" href="' + linkOlhar + '" data-id="' + escaparHtml(registro.id) + '" data-modo="ro">Só olhar</a><a class="b" href="' + linkEditar + '" data-id="' + escaparHtml(registro.id) + '" data-modo="e">Editar ficha</a><button type="button" class="hbtn" data-hist="' + escaparHtml(registro.id) + '">Histórico</button><button type="button" class="del" data-id="' + escaparHtml(registro.id) + '">Apagar ficha</button><div class="codew"><button type="button" class="code" data-code="' + escaparHtml(registro.id) + '" title="Toque para copiar o código">Código: <b>' + escaparHtml(registro.id) + '</b></button></div></div>';
      }).join("");
    }
  })
  .catch(function(erro) {
    var statusEl = document.getElementById("st");
    if (statusEl) {
      statusEl.textContent = "Não consegui carregar as fichas (" + erro + "). Confira a conexão com a internet.";
    }
  });
}
var load = carregarFichasMesa; // Alias

var gridContainer = document.getElementById("g");
if (gridContainer) {
  // Salva intenção de navegação para a ficha (garante abertura mesmo se o servidor estático fizer redirect descartando a query string)
  gridContainer.addEventListener("click", function(e) {
    var link = e.target.closest && e.target.closest("a.b");
    if (!link) return;
    var id = link.dataset.id;
    var modo = link.dataset.modo || "ro";
    if (id) {
      var payload = { id: id, modo: modo, ts: Date.now() };
      try {
        sessionStorage.setItem("ficha_mestre_ativa", JSON.stringify(payload));
        localStorage.setItem("ficha_mestre_ativa", JSON.stringify(payload));
      } catch (err) {}
    }
  });

  // Confirmação de exclusão da ficha em dois toques
  gridContainer.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".del");
    if (!b) return;
    if (b.dataset.armed) {
      excluirFicha(b.dataset.id, b);
      return;
    }
    b.dataset.armed = "1";
    b.textContent = "Confirmar apagar?";
    operacaoOcupada = true;
    setTimeout(function() {
      if (!b.isConnected) return;
      delete b.dataset.armed;
      if (!b.disabled) b.textContent = "Apagar ficha";
      operacaoOcupada = false;
    }, 4000);
  });

  // Copiar código da ficha
  gridContainer.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".code");
    if (!b) return;
    var codigo = b.dataset.code;

    function copiadoComSucesso() {
      var textoAntigo = b.innerHTML;
      b.textContent = "Copiado!";
      setTimeout(function() {
        if (b.isConnected) b.innerHTML = textoAntigo;
      }, 1500);
    }

    function fallbackCopia() {
      var textarea = document.createElement("textarea");
      textarea.value = codigo;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        copiadoComSucesso();
      } catch (x) {
        exibirMensagemStatus("Não consegui copiar. O código é: " + codigo);
      }
      document.body.removeChild(textarea);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codigo).then(copiadoComSucesso, fallbackCopia);
    } else {
      fallbackCopia();
    }
  });

  // Abrir histórico de alterações de uma ficha específica
  gridContainer.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".hbtn");
    if (!b) return;
    var id = b.dataset.hist;
    painelHistoricoAberto = true;
    var hpEl = document.getElementById("hp");
    if (hpEl) hpEl.hidden = false;
    var sel = document.getElementById("hf");
    if (sel && !sel.querySelector('option[value="' + id.replace(/"/g, '\\"') + '"]')) {
      var opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      sel.appendChild(opt);
    }
    abrirPainelHistorico(id);
  });
}

function excluirFicha(id, botao) {
  botao.disabled = true;
  botao.textContent = "Apagando…";
  exibirMensagemStatus("");

  fetch(URL_SUPABASE + "/rest/v1/fichas?id=eq." + encodeURIComponent(id), {
    method: "DELETE",
    headers: {
      apikey: CHAVE_PUBLICA_SUPABASE,
      Prefer: "return=representation"
    }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(linhas) {
    operacaoOcupada = false;
    if (linhas.length) {
      exibirMensagemStatus("Ficha apagada.");
    } else {
      exibirMensagemStatus("Nada foi apagado. Confira as permissões no Supabase.");
    }
    carregarFichasMesa();
  })
  .catch(function(e) {
    operacaoOcupada = false;
    exibirMensagemStatus("Não consegui apagar (" + e + ").");
    carregarFichasMesa();
  });
}
var delSheet = excluirFicha; // Alias

function formatarDataHistorico(dataIso) {
  try {
    return new Date(dataIso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return dataIso;
  }
}
var hfmt = formatarDataHistorico; // Alias

function carregarHistoricoAlteracoes() {
  if (!painelHistoricoAberto) return;

  fetch(URL_SUPABASE + "/rest/v1/historico?select=id,ficha_id,nome,autor,mudancas,criado_em&order=criado_em.desc&limit=" + LIMITE_HISTORICO, {
    headers: { apikey: CHAVE_PUBLICA_SUPABASE }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(linhas) {
    var sel = document.getElementById("hf"),
        atual = sel ? sel.value : "",
        nomes = {},
        ordem = [];

    fichasCarregadas.forEach(function(r) {
      nomes[r.id] = (r.dados && r.dados.nome) || "Sem nome";
      ordem.push(r.id);
    });

    linhas.forEach(function(h) {
      if (!(h.ficha_id in nomes)) {
        nomes[h.ficha_id] = (h.nome || "Sem nome") + " (apagada)";
        ordem.push(h.ficha_id);
      }
    });

    if (sel) {
      sel.innerHTML = '<option value="">Todas</option>' + ordem.map(function(id) {
        return '<option value="' + escaparHtml(id) + '">' + escaparHtml(nomes[id]) + '</option>';
      }).join("");
      sel.value = ordem.indexOf(atual) >= 0 ? atual : "";
    }

    var filtro = sel ? sel.value : "";
    var filtradas = linhas.filter(function(h) { return !filtro || h.ficha_id === filtro; });

    var listaEl = document.getElementById("hl");
    if (listaEl) {
      listaEl.innerHTML = filtradas.length
        ? filtradas.map(function(h) {
            var mudancasHtml = (h.mudancas || []).map(function(c) {
              return '<li><span class="c">' + escaparHtml(c.campo) + ':</span> <s>' + escaparHtml(c.de) + '</s> → <b>' + escaparHtml(c.para) + '</b></li>';
            }).join("");
            return '<div class="he"><div class="hh"><b>' + escaparHtml(h.nome || nomes[h.ficha_id] || "Sem nome") + '</b><span class="tag' + (h.autor === "mestre" ? " m" : "") + '">' + (h.autor === "mestre" ? "mestre" : "jogador") + '</span><span class="t">' + escaparHtml(formatarDataHistorico(h.criado_em)) + '</span></div><ul>' + mudancasHtml + '</ul></div>';
          }).join("") + (linhas.length >= LIMITE_HISTORICO ? '<p class="hmore sub">Mostrando os ' + LIMITE_HISTORICO + ' registros mais recentes.</p>' : "")
        : '<p class="sub">Nenhuma alteração registrada ainda. Os registros aparecem conforme as fichas são alteradas.</p>';
    }
  })
  .catch(function(e) {
    var listaEl = document.getElementById("hl");
    if (listaEl) {
      listaEl.innerHTML = '<p class="sub">Não consegui carregar o histórico (' + escaparHtml(e) + ').</p>';
    }
  });
}
var loadHist = carregarHistoricoAlteracoes; // Alias

function abrirPainelHistorico(idFicha) {
  painelHistoricoAberto = true;
  var painel = document.getElementById("hp");
  if (painel) painel.hidden = false;
  var btnHistorico = document.getElementById("hb");
  if (btnHistorico) btnHistorico.setAttribute("aria-expanded", "true");
  if (idFicha !== undefined) {
    var sel = document.getElementById("hf");
    if (sel) sel.value = idFicha;
  }
  carregarHistoricoAlteracoes();
  if (idFicha !== undefined && painel) {
    painel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
var openHist = abrirPainelHistorico; // Alias

function fecharPainelHistorico() {
  painelHistoricoAberto = false;
  var painel = document.getElementById("hp");
  if (painel) painel.hidden = true;
  var btnHistorico = document.getElementById("hb");
  if (btnHistorico) btnHistorico.setAttribute("aria-expanded", "false");
}
var closeHist = fecharPainelHistorico; // Alias

var btnHistorico = document.getElementById("hb");
if (btnHistorico) {
  btnHistorico.onclick = function() { painelHistoricoAberto ? fecharPainelHistorico() : abrirPainelHistorico(); };
}

var btnFecharHistorico = document.getElementById("hx");
if (btnFecharHistorico) btnFecharHistorico.onclick = fecharPainelHistorico;

var selectFiltroFicha = document.getElementById("hf");
if (selectFiltroFicha) selectFiltroFicha.onchange = carregarHistoricoAlteracoes;

var btnAtualizarAgora = document.getElementById("rf");
if (btnAtualizarAgora) {
  btnAtualizarAgora.onclick = function() {
    carregarFichasMesa();
    carregarHistoricoAlteracoes();
  };
}

// Inicialização e atualização periódica a cada 20 segundos
carregarFichasMesa();
setInterval(function() {
  carregarFichasMesa();
  carregarHistoricoAlteracoes();
}, 20000);
