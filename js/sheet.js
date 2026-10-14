/* ==========================================================================
   Interface e Controladores da Ficha do Personagem (index.html)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

function gerarOpcoesAtributosSelect(selecionado) {
  var selNormalizado = (MAPA_ATRIBUTO_LEGADO && MAPA_ATRIBUTO_LEGADO[selecionado]) || selecionado;
  return ATRIBUTOS_PADRAO.map(function(attr) {
    return '<option value="' + attr[0] + '"' + (attr[0] === selNormalizado ? ' selected' : '') + '>' + capitalizar(attr[1]) + '</option>';
  }).join("");
}
var opts = gerarOpcoesAtributosSelect; // Alias

function gerarHtmlLinhaPericia(indice) {
  var dadosPadrao = PERICIAS_PADRAO[indice] || ["", "inteligencia"];
  var nome = dadosPadrao[0];
  var atributo = dadosPadrao[1];

  return '<div class="sk">' +
    '<input type="checkbox" data-k="pericia_treinada_' + indice + '" id="pericia_treinada_' + indice + '" aria-label="Treinada">' +
    '<b id="pericia_total_' + indice + '">0</b>' +
    '<span class="sn">' +
      '<input data-k="pericia_nome_' + indice + '" value="' + nome + '" placeholder="Nova perícia" aria-label="Nome da perícia">' +
      '<select data-k="pericia_atributo_' + indice + '" id="pericia_atributo_' + indice + '" aria-label="Atributo">' +
        gerarOpcoesAtributosSelect(atributo) +
      '</select>' +
    '</span>' +
    '<input class="o" type="number" data-k="pericia_outros_' + indice + '" id="pericia_outros_' + indice + '" value="0" aria-label="Outros">' +
    '<button class="x" data-del="' + indice + '" aria-label="Remover perícia" title="Remover">×</button>' +
  '</div>';
}
var rowHtml = gerarHtmlLinhaPericia; // Alias

function renderizarPericias() {
  var container = document.getElementById("skills");
  if (container) {
    var lista = listaPericiasAtivas || list;
    container.innerHTML = lista.map(gerarHtmlLinhaPericia).join("");
  }
}
var renderSkills = renderizarPericias; // Alias

function recarregarPericias() {
  salvarListaPericias();
  renderizarPericias();
  carregarFicha();
  calcularFicha();
  salvarFicha();
}
var refresh = recarregarPericias; // Alias

function renderizarHabilidades() {
  var container = document.getElementById("habs");
  if (container) {
    var listaHabs = ordemHabilidades || hl;
    container.innerHTML = listaHabs.map(function(idLinha, posicao) {
      return '<div class="hb">' +
        '<input data-k="hab_nome_' + idLinha + '" placeholder="Nome" aria-label="Nome da habilidade">' +
        '<input data-k="hab_dano_' + idLinha + '" placeholder="1d6" aria-label="Dado de dano">' +
        '<input data-k="hab_escala_' + idLinha + '" list="esc" placeholder="Escala com" aria-label="Escala com">' +
        '<input data-k="hab_tipo_' + idLinha + '" list="tip" placeholder="Tipo" aria-label="Tipo">' +
        '<textarea class="hx" rows="1" data-k="hab_descricao_' + idLinha + '" placeholder="Descrição" aria-label="Descrição"></textarea>' +
        '<div class="ac">' +
          '<button type="button" class="x" data-hmv="-1" data-hid="' + idLinha + '" aria-label="Mover para cima" title="Mover para cima"' + (posicao === 0 ? " disabled" : "") + '>▲</button>' +
          '<button type="button" class="x" data-hmv="1" data-hid="' + idLinha + '" aria-label="Mover para baixo" title="Mover para baixo"' + (posicao === listaHabs.length - 1 ? " disabled" : "") + '>▼</button>' +
          '<button type="button" class="x" data-hdel="' + idLinha + '" aria-label="Remover linha" title="Remover">×</button>' +
        '</div>' +
      '</div>';
    }).join("");
  }
}
var renderHab = renderizarHabilidades; // Alias

function recarregarHabilidades() {
  renderizarHabilidades();
  carregarFicha();
  calcularFicha();
  salvarFicha();
}
var refreshHab = recarregarHabilidades; // Alias

// 1. Inicializar pedras de Atributos
var containerPedras = document.getElementById("stones");
if (containerPedras) {
  containerPedras.innerHTML = ATRIBUTOS_PADRAO.map(function(attr) {
    var idAttr = attr[0];
    var nomeExtenso = attr[1];
    return '<div class="at">' +
      SVG_MOLDURA_ATRIBUTO +
      '<span class="an' + (nomeExtenso.length > 9 ? ' lg' : '') + '">' + nomeExtenso.toUpperCase() + '</span>' +
      '<b class="mod" id="mod_' + idAttr + '">+0</b>' +
      '<input type="number" data-k="atr_' + idAttr + '" id="atr_' + idAttr + '" value="10" aria-label="' + nomeExtenso + ' (valor)">' +
      '<button type="button" class="sp dn" data-step="-1" data-t="atr_' + idAttr + '" aria-label="Diminuir ' + nomeExtenso + '">−</button>' +
      '<button type="button" class="sp up" data-step="1" data-t="atr_' + idAttr + '" aria-label="Aumentar ' + nomeExtenso + '">+</button>' +
    '</div>';
  }).join("");
}

// 2. Inicializar Perícias e Habilidades
renderizarPericias();
renderizarHabilidades();

// 3. Inicializar 14 linhas de Inventário
var containerInventario = document.getElementById("inv");
if (containerInventario) {
  var htmlInv = "";
  for (var k = 0; k < 14; k++) {
    htmlInv += '<div class="inv">' +
      '<input data-k="item_nome_' + k + '">' +
      '<input type="number" min="0" data-k="item_qtd_' + k + '">' +
      '<input type="number" min="0" step="0.5" data-k="item_espaco_' + k + '">' +
    '</div>';
  }
  containerInventario.innerHTML = htmlInv;
}

// Listeners Globais para salvar automaticamente a cada alteração
document.addEventListener("input", function() {
  calcularFicha();
  salvarFicha();
});

document.addEventListener("change", function() {
  calcularFicha();
  salvarFicha();
});

// Imagem do Personagem
var IMAGEM_ATUAL = "";
function exibirImagemPersonagem() {
  var inputOculto = document.querySelector('[data-k="imagem"]') || document.querySelector('[data-k="img"]');
  var valor = inputOculto ? inputOculto.value : "";
  if (valor === IMAGEM_ATUAL) return;
  IMAGEM_ATUAL = valor;

  var imgElemento = document.getElementById("picimg");
  var placeholder = document.getElementById("picph");
  if (valor) {
    imgElemento.src = valor;
    imgElemento.hidden = false;
    placeholder.hidden = true;
  } else {
    imgElemento.removeAttribute("src");
    imgElemento.hidden = true;
    placeholder.hidden = false;
  }
  document.getElementById("pic").className = "pic" + (valor ? " has" : "");
  document.getElementById("picdel").hidden = !valor;
}
var showPic = exibirImagemPersonagem; // Alias

function definirImagemPersonagem(dataUrl) {
  var inputOculto = document.querySelector('[data-k="imagem"]') || document.querySelector('[data-k="img"]');
  if (inputOculto) {
    inputOculto.value = dataUrl;
    inputOculto.dispatchEvent(new Event("input", { bubbles: true }));
  }
}
var setPic = definirImagemPersonagem; // Alias

var fileInput = document.getElementById("picfile");
if (fileInput) {
  fileInput.addEventListener("change", function() {
    var input = this, arquivo = input.files && input.files[0];
    if (!arquivo) return;
    var reader = new FileReader();
    reader.onload = function() {
      var img = new Image();
      img.onload = function() {
        var escala = Math.min(1, 400 / img.width, 540 / img.height);
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        definirImagemPersonagem(canvas.toDataURL("image/jpeg", 0.8));
        input.value = "";
      };
      img.onerror = function() { input.value = ""; };
      img.src = reader.result;
    };
    reader.readAsDataURL(arquivo);
  });
}

var btnRemoverImg = document.getElementById("picdel");
if (btnRemoverImg) {
  btnRemoverImg.onclick = function() { definirImagemPersonagem(""); };
}

// Remover Perícia
document.addEventListener("click", function(e) {
  var botao = e.target.closest && e.target.closest("[data-del]");
  if (!botao) return;
  salvarFicha();
  var idRemover = +botao.dataset.del;
  listaPericiasAtivas = listaPericiasAtivas.filter(function(x) { return x !== idRemover; });
  list = listaPericiasAtivas;
  recarregarPericias();
});

// Adicionar Perícia
var btnAddPericia = document.getElementById("addsk");
if (btnAddPericia) {
  btnAddPericia.onclick = function() {
    salvarFicha();
    var novoId = Math.max.apply(null, listaPericiasAtivas.concat([99])) + 1;
    listaPericiasAtivas.push(novoId);
    list = listaPericiasAtivas;
    recarregarPericias();
    var campoNome = document.querySelector('[data-k="pericia_nome_' + novoId + '"]');
    if (campoNome) campoNome.focus();
  };
}

// Ordenar Perícias Alfabeticamente
function ordenarPericiasAZ() {
  salvarFicha();
  function extrairNome(indice) {
    var el = document.querySelector('[data-k="pericia_nome_' + indice + '"]');
    return el ? el.value : (PERICIAS_PADRAO[indice] ? PERICIAS_PADRAO[indice][0] : "");
  }
  listaPericiasAtivas.sort(function(a, b) {
    var nomeA = extrairNome(a), nomeB = extrairNome(b);
    if (!nomeA && nomeB) return 1;
    if (nomeA && !nomeB) return -1;
    return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
  });
  list = listaPericiasAtivas;
  recarregarPericias();
}
var srtskBtn = document.getElementById("srtsk");
if (srtskBtn) srtskBtn.onclick = ordenarPericiasAZ;

// Restaurar Perícias Padrão
var rstskBtn = document.getElementById("rstsk");
if (rstskBtn) {
  rstskBtn.onclick = function() {
    salvarFicha();
    INDICES_PERICIAS_INICIAIS.forEach(function(i) {
      if (listaPericiasAtivas.indexOf(i) < 0) listaPericiasAtivas.push(i);
    });
    list = listaPericiasAtivas;
    ordenarPericiasAZ();
  };
}

// Reordenar Habilidades (Mover cima / baixo)
document.addEventListener("click", function(e) {
  var b = e.target.closest && e.target.closest("[data-hmv]");
  if (!b || b.disabled) return;
  salvarFicha();
  var id = +b.dataset.hid,
      posicaoAtual = ordemHabilidades.indexOf(id),
      novaPosicao = posicaoAtual + (+b.dataset.hmv);
  if (posicaoAtual < 0 || novaPosicao < 0 || novaPosicao >= ordemHabilidades.length) return;
  var temporario = ordemHabilidades[posicaoAtual];
  ordemHabilidades[posicaoAtual] = ordemHabilidades[novaPosicao];
  ordemHabilidades[novaPosicao] = temporario;
  hl = ordemHabilidades;
  recarregarHabilidades();
});

// Remover Linha de Habilidade
document.addEventListener("click", function(e) {
  var b = e.target.closest && e.target.closest("[data-hdel]");
  if (!b) return;
  salvarFicha();
  var idRemover = +b.dataset.hdel;
  ordemHabilidades = ordemHabilidades.filter(function(x) { return x !== idRemover; });
  hl = ordemHabilidades;
  recarregarHabilidades();
});

// Adicionar Linha de Habilidade
var btnAddHab = document.getElementById("addhb");
if (btnAddHab) {
  btnAddHab.onclick = function() {
    salvarFicha();
    var novoId = Math.max.apply(null, ordemHabilidades.concat([-1])) + 1;
    ordemHabilidades.push(novoId);
    hl = ordemHabilidades;
    recarregarHabilidades();
    var campoNome = document.querySelector('[data-k="hab_nome_' + novoId + '"]');
    if (campoNome) campoNome.focus();
  };
}

// Steppers (Botões + / -)
document.addEventListener("click", function(e) {
  var btn = e.target.closest && e.target.closest("[data-step]");
  if (!btn) return;
  var targetId = btn.dataset.t;
  var input = document.getElementById(targetId);
  if (!input) return;

  var valor = parseInt(input.value, 10);
  if (isNaN(valor)) valor = (targetId.indexOf("atr_") === 0 || targetId.indexOf("v-") === 0) ? 10 : 0;
  var novoValor = valor + parseInt(btn.dataset.step, 10);
  if (targetId.indexOf("atr_") !== 0 && targetId.indexOf("v-") !== 0) novoValor = Math.max(0, novoValor);

  input.value = novoValor;
  input.dispatchEvent(new Event("input", { bubbles: true }));
});

// Ações do Dado da Sorte
var btnUsarDado = document.getElementById("dusar");
if (btnUsarDado) {
  btnUsarDado.onclick = function() {
    var inputDado = document.getElementById("dado");
    var valor = parseInt(inputDado.value, 10);
    if (isNaN(valor)) valor = 3;
    if (valor <= 0) return;
    inputDado.value = valor - 1;
    inputDado.dispatchEvent(new Event("input", { bubbles: true }));
  };
}

// Confirmação de Ação em Dois Passos
function confirmacaoEmDoisPassos(idElemento, textoConfirmacao, aoConfirmar) {
  var btn = document.getElementById(idElemento);
  if (!btn) return;
  var textoOriginal = btn.textContent, timer = null;
  btn.onclick = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
      btn.textContent = textoOriginal;
      aoConfirmar();
      return;
    }
    btn.textContent = textoConfirmacao;
    timer = setTimeout(function() {
      timer = null;
      btn.textContent = textoOriginal;
    }, 3500);
  };
}
var twoStep = confirmacaoEmDoisPassos; // Alias

confirmacaoEmDoisPassos("drec", "Confirmar?", function() {
  var inputDado = document.getElementById("dado");
  if (inputDado) {
    inputDado.value = 3;
    inputDado.dispatchEvent(new Event("input", { bubbles: true }));
  }
});

var btnPrint = document.getElementById("print");
if (btnPrint) {
  btnPrint.onclick = function() { window.print(); };
}

confirmacaoEmDoisPassos("clear", "Tem certeza?", function() {
  var cod = CODIGO_FICHA;
  fetch(URL_SUPABASE + "/rest/v1/fichas?id=eq." + encodeURIComponent(cod), {
    method: "DELETE",
    headers: { apikey: CHAVE_PUBLICA_SUPABASE }
  })
  .catch(function() {})
  .then(function() {
    [
      obterChaveLocalFicha(cod),
      obterChaveLocalPericias(cod),
      obterChaveLocalSincronizada(cod),
      CHAVE_LOCAL_FICHA_BASE,
      CHAVE_LOCAL_PERICIAS_BASE,
      CHAVE_LOCAL_SINCRONIZADA_BASE
    ].forEach(function(k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
    if (localStorage.getItem("ficha-tormenta-code") === cod) {
      try { localStorage.removeItem("ficha-tormenta-code"); } catch (e) {}
    }
    if (window.location.search) {
      window.location.href = window.location.pathname;
    } else {
      location.reload();
    }
  });
});

// Carregamento inicial da ficha
carregarFicha();
calcularFicha();

// Configuração do Modo (Mestre x Jogador)
if (MODO_VISUALIZACAO) {
  var boxCodigo = document.getElementById("codebox");
  if (boxCodigo) boxCodigo.style.display = "none";
  var btnLimpar = document.getElementById("clear");
  if (btnLimpar) btnLimpar.style.display = "none";

  function bloquearEdicaoModoMestre(bloquear) {
    MODO_EDICAO = !bloquear;
    EDIT = MODO_EDICAO;
    var fichaContainer = document.getElementById("sheet");
    if (fichaContainer) fichaContainer.inert = bloquear;
    var barraMestre = document.getElementById("mbar");
    if (barraMestre) {
      barraMestre.hidden = false;
      barraMestre.className = "mbar" + (bloquear ? "" : " on");
    }
    var textoMestre = document.getElementById("mtxt");
    if (textoMestre) {
      textoMestre.textContent = bloquear
        ? "Modo mestre: somente leitura. A ficha do jogador não será alterada."
        : "Modo mestre: edição liberada. O que você mudar vai para a ficha do jogador.";
    }
    var btnToggle = document.getElementById("mtog");
    if (btnToggle) {
      btnToggle.textContent = bloquear ? "Liberar edição" : "Travar edição";
    }
  }

  var btnToggleEdicao = document.getElementById("mtog");
  if (btnToggleEdicao) {
    btnToggleEdicao.onclick = function() { bloquearEdicaoModoMestre(MODO_EDICAO); };
  }
  var somenteLeitura = Boolean(PARAMETROS_URL.get("ro"));
  bloquearEdicaoModoMestre(!PARAMETROS_URL.get("e") || somenteLeitura);
  if (somenteLeitura && btnToggleEdicao) btnToggleEdicao.hidden = true;

  atualizarStatusNuvem("Modo mestre: carregando…");
  sincronizarFicha(true);
} else {
  var spanCodigo = document.getElementById("code");
  if (spanCodigo) spanCodigo.textContent = CODIGO_FICHA;
  var msgMestre = obterArmazenamentoLocal("ficha-tormenta-msg");
  if (msgMestre) {
    try { localStorage.removeItem("ficha-tormenta-msg"); } catch (e) {}
    atualizarStatusNuvem(msgMestre);
  } else {
    atualizarStatusNuvem("Alterações são salvas neste aparelho e na nuvem.");
  }
  sincronizarFicha(true);

  // Copiar link da ficha para a área de transferência
  function copiarLinkFicha(btnOrigem) {
    var linkCompleto = window.location.origin + window.location.pathname + "?c=" + encodeURIComponent(CODIGO_FICHA);
    function sucesso() {
      var textoAntigo = btnOrigem ? btnOrigem.textContent : "";
      if (btnOrigem) btnOrigem.textContent = "Copiado!";
      atualizarStatusNuvem("Link copiado para a área de transferência!");
      setTimeout(function() {
        if (btnOrigem && btnOrigem.isConnected) btnOrigem.textContent = textoAntigo;
      }, 2000);
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = linkCompleto;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        sucesso();
      } catch (err) {
        prompt("Copie o link da sua ficha:", linkCompleto);
      }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(linkCompleto).then(sucesso, fallback);
    } else {
      fallback();
    }
  }

  var btnCopiarLink = document.getElementById("copybtn");
  if (btnCopiarLink) {
    btnCopiarLink.onclick = function() { copiarLinkFicha(btnCopiarLink); };
  }

  if (spanCodigo) {
    spanCodigo.style.cursor = "pointer";
    spanCodigo.title = "Clique para copiar o link da ficha";
    spanCodigo.onclick = function() { copiarLinkFicha(btnCopiarLink); };
  }

  var btnTrocarCodigo = document.getElementById("chcode");
  if (btnTrocarCodigo) {
    btnTrocarCodigo.onclick = function() {
      var digitado = sanitizarCodigo((prompt("Digite o código da ficha que você quer carregar neste aparelho:") || ""));
      if (!digitado || digitado === CODIGO_FICHA) return;
      buscarFichaNuvem(digitado, function(dadosEncontrados) {
        if (!dadosEncontrados) {
          atualizarStatusNuvem("Código não encontrado");
          return;
        }
        if (!confirm("Isso troca a ficha deste aparelho pela ficha desse código. Continuar?")) return;
        descarregarHistorico();
        CODIGO_FICHA = digitado;
        CODE = CODIGO_FICHA;
        definirArmazenamentoLocal("ficha-tormenta-code", CODIGO_FICHA);
        if (window.history && window.history.replaceState) {
          try {
            var url = new URL(window.location.href);
            url.searchParams.set("c", CODIGO_FICHA);
            url.searchParams.delete("f");
            url.searchParams.delete("nova");
            window.history.replaceState(null, "", url.toString());
          } catch (e) {}
        }
        if (spanCodigo) spanCodigo.textContent = CODIGO_FICHA;
        aplicarDadosNuvem(dadosEncontrados);
        salvarFicha();
      });
    };
  }

  var btnNovaFicha = document.getElementById("newcode");
  if (btnNovaFicha) {
    btnNovaFicha.onclick = function() {
      if (!confirm("Deseja abrir uma nova ficha em branco?")) return;
      descarregarHistorico();
      var url = new URL(window.location.href);
      url.searchParams.set("nova", "1");
      url.searchParams.delete("c");
      url.searchParams.delete("f");
      window.location.href = url.toString();
    };
  }
}

// Polling de sincronização automática a cada 10 segundos
setInterval(function() {
  sincronizarFicha(false);
}, 10000);
