/* ==========================================================================
   Sincronização em Nuvem e Histórico de Alterações (Supabase)
   Compatível com Novas Chaves Legíveis e Chaves Legadas
   ========================================================================== */

var pendenteSalvamento = false;
var timerSalvamento = null;
var filaHistoricoMap = {};
var filaHistoricoArray = [];
var timerHistorico = null;

// Aliases para retrocompatibilidade
var pending = pendenteSalvamento;
var tm = timerSalvamento;
var HQ = filaHistoricoMap;
var HQS = filaHistoricoArray;
var HT = timerHistorico;

function atualizarStatusNuvem(texto) {
  var el = document.getElementById("cloud");
  if (el) el.textContent = texto;
}
var st = atualizarStatusNuvem; // Alias

function clonarObjeto(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : null;
}
var hclone = clonarObjeto; // Alias

function formatarValorHistorico(valor) {
  if (valor === true) return "sim";
  if (valor === false) return "não";
  valor = (valor == null ? "" : String(valor)).trim();
  if (!valor) return "—";
  return valor.length > 80 ? valor.slice(0, 80) + "…" : valor;
}
var hv = formatarValorHistorico; // Alias

function obterNomePericiaPorIndice(dados, indice) {
  return (dados && (dados["pericia_nome_" + indice] || dados["sn" + indice])) ||
         (PERICIAS_PADRAO[indice] ? PERICIAS_PADRAO[indice][0] : "") ||
         "sem nome";
}
var sname = obterNomePericiaPorIndice; // Alias

function obterNomeHabilidadePorIndice(dados, indice) {
  return (dados && (dados["hab_nome_" + indice] || dados["hn" + indice])) || "sem nome";
}
var hname = obterNomeHabilidadePorIndice; // Alias

function obterNomeAtributoPorCodigo(cod) {
  var codNormalizado = (MAPA_ATRIBUTO_LEGADO && MAPA_ATRIBUTO_LEGADO[cod]) || cod;
  var attr = ATRIBUTOS_PADRAO.filter(function(x) { return x[0] === codNormalizado; })[0];
  return attr ? attr[1] : cod;
}
var attrName = obterNomeAtributoPorCodigo; // Alias

function obterRotuloHistorico(chave, dadosNovos) {
  var m;
  if (DICIONARIO_NOMES_HISTORICO[chave]) return DICIONARIO_NOMES_HISTORICO[chave];

  // Atributos (novos: atr_forca ou legados: v-for)
  if ((m = /^atr_(.+)$/.exec(chave))) return obterNomeAtributoPorCodigo(m[1]) + " (valor)";
  if ((m = /^v-(.+)$/.exec(chave))) return obterNomeAtributoPorCodigo(m[1]) + " (valor)";

  // Perícias
  if ((m = /^pericia_treinada_(\d+)$/.exec(chave)) || (m = /^t(\d+)$/.exec(chave))) {
    return "Perícia treinada: " + obterNomePericiaPorIndice(dadosNovos, m[1]);
  }
  if ((m = /^pericia_nome_(\d+)$/.exec(chave)) || (m = /^sn(\d+)$/.exec(chave))) {
    return "Perícia renomeada";
  }
  if ((m = /^pericia_atributo_(\d+)$/.exec(chave)) || (m = /^sa(\d+)$/.exec(chave))) {
    return "Atributo da perícia " + obterNomePericiaPorIndice(dadosNovos, m[1]);
  }
  if ((m = /^pericia_outros_(\d+)$/.exec(chave)) || (m = /^o(\d+)$/.exec(chave))) {
    return "Outros da perícia " + obterNomePericiaPorIndice(dadosNovos, m[1]);
  }

  // Inventário
  if ((m = /^item_(nome|qtd|espaco)_(\d+)$/.exec(chave))) {
    var tiposItem = { nome: "item", qtd: "quantidade", espaco: "espaços" };
    return "Inventário, linha " + (+m[2] + 1) + " (" + tiposItem[m[1]] + ")";
  }
  if ((m = /^(in|iq|ie)(\d+)$/.exec(chave))) {
    var tiposItemLeg = { in: "item", iq: "quantidade", ie: "espaços" };
    return "Inventário, linha " + (+m[2] + 1) + " (" + tiposItemLeg[m[1]] + ")";
  }

  // Habilidades
  if ((m = /^hab_(nome|dano|escala|tipo|descricao)_(\d+)$/.exec(chave))) {
    var tiposHab = { nome: "nome", dano: "dano", escala: "escala com", tipo: "tipo", descricao: "descrição" };
    return "Habilidade «" + obterNomeHabilidadePorIndice(dadosNovos, m[2]) + "»: " + tiposHab[m[1]];
  }
  if ((m = /^h([ndstx])(\d+)$/.exec(chave))) {
    var tiposHabLeg = { n: "nome", d: "dano", s: "escala com", t: "tipo", x: "descrição" };
    return "Habilidade «" + obterNomeHabilidadePorIndice(dadosNovos, m[2]) + "»: " + tiposHabLeg[m[1]];
  }

  return chave;
}
var hlabel = obterRotuloHistorico; // Alias

function calcularDiferencasHistorico(anterior, novo) {
  if (!anterior) return [{ campo: "Ficha", de: "—", para: "criada", s: 1 }];
  var mudancas = [];
  var adicionadasPericias = [];
  var adicionadasHabilidades = [];

  // 1. Diferenças estruturais nas listas
  function verificarMudancasLista(chaveNova, chaveLegada, coletor, rotuloItem, nomeFn) {
    var arrAnt = (Array.isArray(anterior[chaveNova]) ? anterior[chaveNova] : anterior[chaveLegada]) || [];
    var arrNov = (Array.isArray(novo[chaveNova]) ? novo[chaveNova] : novo[chaveLegada]) || [];

    arrNov.forEach(function(item) {
      if (arrAnt.indexOf(item) < 0) {
        coletor(item);
        mudancas.push({
          campo: rotuloItem + " adicionada",
          de: "—",
          para: nomeFn(novo, item),
          s: 1
        });
      }
    });

    arrAnt.forEach(function(item) {
      if (arrNov.indexOf(item) < 0) {
        mudancas.push({
          campo: rotuloItem + " removida",
          de: nomeFn(anterior, item),
          para: "—",
          s: 1
        });
      }
    });
  }

  verificarMudancasLista("_pericias_ativas", "_list", function(i) { adicionadasPericias.push(String(i)); }, "Perícia", obterNomePericiaPorIndice);
  verificarMudancasLista("_habilidades_ordem", "_hl", function(i) { adicionadasHabilidades.push(String(i)); }, "Habilidade", obterNomeHabilidadePorIndice);

  // 2. Diferenças campo a campo
  Object.keys(novo).forEach(function(chave) {
    if (chave.charAt(0) === "_" || /^hab_oculto_\d+$/.test(chave) || /^ho\d+$/.test(chave)) return;

    var m;
    if ((m = /^hab_(?:nome|dano|escala|tipo|descricao)_(\d+)$/.exec(chave)) && adicionadasHabilidades.indexOf(m[1]) >= 0) return;
    if ((m = /^pericia_(?:treinada|nome|atributo|outros)_(\d+)$/.exec(chave)) && adicionadasPericias.indexOf(m[1]) >= 0) return;

    var valorNovo = novo[chave];
    var valorAntigo = anterior[chave];

    // Fallback para chave legada se no anterior ainda estava no padrão antigo
    if (valorAntigo === undefined && typeof converterChaveParaLegado === "function") {
      valorAntigo = anterior[converterChaveParaLegado(chave)];
    }

    if (valorAntigo === undefined) {
      var elemento = document.querySelector('[data-k="' + chave + '"]');
      if (!elemento || elemento.tagName === "SELECT") return;
      valorAntigo = elemento.type === "checkbox" ? elemento.defaultChecked : elemento.defaultValue;
    }

    if (String(valorAntigo) === String(valorNovo)) return;

    if (chave === "imagem" || chave === "img") {
      mudancas.push({
        campo: "Imagem",
        de: valorAntigo ? "imagem anterior" : "nenhuma",
        para: valorNovo ? "nova imagem" : "removida"
      });
      return;
    }

    if (/^pericia_atributo_\d+$/.test(chave) || /^sa\d+$/.test(chave)) {
      valorAntigo = obterNomeAtributoPorCodigo(valorAntigo);
      valorNovo = obterNomeAtributoPorCodigo(valorNovo);
    }

    mudancas.push({
      campo: obterRotuloHistorico(chave, novo),
      de: formatarValorHistorico(valorAntigo),
      para: formatarValorHistorico(valorNovo)
    });
  });

  return mudancas.slice(0, 40);
}
var hdiff = calcularDiferencasHistorico; // Alias

function adicionarFilaHistorico(lista) {
  lista.forEach(function(item) {
    if (item.s) {
      filaHistoricoArray.push(item);
      return;
    }
    var existente = filaHistoricoMap[item.campo];
    if (existente) {
      existente.para = item.para;
      if (existente.de === existente.para) delete filaHistoricoMap[item.campo];
    } else {
      filaHistoricoMap[item.campo] = { campo: item.campo, de: item.de, para: item.para };
    }
  });
  clearTimeout(timerHistorico);
  timerHistorico = setTimeout(descarregarHistorico, 20000);
}
var hqAdd = adicionarFilaHistorico; // Alias

function descarregarHistorico() {
  clearTimeout(timerHistorico);
  var itens = Object.keys(filaHistoricoMap).map(function(k) { return filaHistoricoMap[k]; }).concat(filaHistoricoArray);
  filaHistoricoMap = {};
  filaHistoricoArray = [];
  if (!itens.length) return;

  var lote = itens.slice(0, 60).map(function(c) {
    return { campo: c.campo, de: c.de, para: c.para };
  });

  try {
    fetch(URL_SUPABASE + "/rest/v1/historico", {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: CHAVE_PUBLICA_SUPABASE,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        ficha_id: CODIGO_FICHA,
        nome: (MEMORIA_FICHA && MEMORIA_FICHA.nome) || "",
        autor: MODO_VISUALIZACAO ? "mestre" : "jogador",
        mudancas: lote
      })
    }).catch(function() {});
  } catch (e) {}
}
var hflush = descarregarHistorico; // Alias

function aoConcluirEnvioNuvem(snapshot) {
  if (DADOS_BASE_PRONTOS) {
    var diferencas = calcularDiferencasHistorico(DADOS_BASE_SINCRONIZACAO, snapshot);
    if (diferencas.length) adicionarFilaHistorico(diferencas);
  }
  DADOS_BASE_SINCRONIZACAO = clonarObjeto(snapshot);
  DADOS_BASE_PRONTOS = true;
  BASE = DADOS_BASE_SINCRONIZACAO;
  BASEOK = DADOS_BASE_PRONTOS;
}
var onPushed = aoConcluirEnvioNuvem; // Alias

window.addEventListener("pagehide", descarregarHistorico);
document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "hidden") descarregarHistorico();
});

function enviarParaNuvemDebounced() {
  pendenteSalvamento = true;
  clearTimeout(timerSalvamento);
  atualizarStatusNuvem("Salvando…");
  timerSalvamento = setTimeout(executarEnvioNuvem, 900);
}
var cloudPush = enviarParaNuvemDebounced; // Alias

function executarEnvioNuvem() {
  pendenteSalvamento = false;
  salvandoNuvem = true;
  var snapshot = clonarObjeto(MEMORIA_FICHA);

  fetch(URL_SUPABASE + "/rest/v1/fichas", {
    method: "POST",
    headers: {
      apikey: CHAVE_PUBLICA_SUPABASE,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      id: CODIGO_FICHA,
      dados: snapshot,
      updated_at: new Date().toISOString()
    })
  }).then(function(resposta) {
    salvandoNuvem = false;
    if (resposta.ok) {
      try { aoConcluirEnvioNuvem(snapshot); } catch (e) {}
    }
    if (resposta.ok && !MODO_VISUALIZACAO) {
      definirArmazenamentoLocal(obterChaveLocalSincronizada(CODIGO_FICHA), CODIGO_FICHA);
    }
    atualizarStatusNuvem(resposta.ok ? (MODO_VISUALIZACAO ? "Modo mestre: salvo na nuvem" : "☁ Salva na nuvem") : "Erro ao salvar na nuvem (" + resposta.status + ")");
  }).catch(function() {
    salvandoNuvem = false;
    atualizarStatusNuvem("Sem conexão com a nuvem: salva só neste aparelho");
  });
}
var doPush = executarEnvioNuvem; // Alias

function buscarFichaNuvem(codigo, callback) {
  fetch(URL_SUPABASE + "/rest/v1/fichas?id=eq." + encodeURIComponent(codigo) + "&select=dados", {
    headers: { apikey: CHAVE_PUBLICA_SUPABASE }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(linhas) {
    callback(linhas && linhas[0] ? linhas[0].dados : null);
  })
  .catch(function() {
    atualizarStatusNuvem("Não consegui falar com a nuvem");
    if (typeof callback === "function") callback(null);
  });
}
var pull = buscarFichaNuvem; // Alias

function aplicarDadosNuvem(dados) {
  var dadosNormalizados = typeof migrarDadosLegados === "function" ? migrarDadosLegados(dados) : dados;
  MEMORIA_FICHA = dadosNormalizados;
  MEM = dadosNormalizados;

  var periciasLista = dadosNormalizados._pericias_ativas || dadosNormalizados._list;
  if (Array.isArray(periciasLista)) {
    listaPericiasAtivas = periciasLista.filter(function(id) {
      return typeof id === "number" && (id < 18 || id >= 100);
    });
    list = listaPericiasAtivas;
  }

  var habilidadesLista = dadosNormalizados._habilidades_ordem || dadosNormalizados._hl;
  if (Array.isArray(habilidadesLista)) {
    ordemHabilidades = habilidadesLista;
    hl = ordemHabilidades;
  }

  if (typeof renderizarHabilidades === "function") renderizarHabilidades();
  else if (typeof renderHab === "function") renderHab();

  USAR_APENAS_MEMORIA = true;
  if (typeof renderizarPericias === "function") renderizarPericias();
  else if (typeof renderSkills === "function") renderSkills();

  carregarFicha();
  USAR_APENAS_MEMORIA = false;

  calcularFicha();
  gravarLocalmente(dadosNormalizados);

  DADOS_BASE_SINCRONIZACAO = clonarObjeto(dadosNormalizados);
  DADOS_BASE_PRONTOS = true;
  BASE = DADOS_BASE_SINCRONIZACAO;
  BASEOK = DADOS_BASE_PRONTOS;
}
var applyCloud = aplicarDadosNuvem; // Alias

function usuarioDigitando() {
  var elementoAtivo = document.activeElement;
  return elementoAtivo && /^(INPUT|TEXTAREA|SELECT)$/.test(elementoAtivo.tagName);
}
var typing = usuarioDigitando; // Alias

function sincronizarFicha(primeiraVez) {
  buscarFichaNuvem(CODIGO_FICHA, function(dados) {
    if (!pendenteSalvamento && !salvandoNuvem) {
      DADOS_BASE_SINCRONIZACAO = clonarObjeto(dados);
      DADOS_BASE_PRONTOS = true;
      BASE = DADOS_BASE_SINCRONIZACAO;
      BASEOK = DADOS_BASE_PRONTOS;
    }
    if (!dados) {
      if (MODO_VISUALIZACAO) {
        atualizarStatusNuvem(primeiraVez ? "Ficha não encontrada" : "Esta ficha foi apagada");
        return;
      }
      if (obterArmazenamentoLocal(obterChaveLocalSincronizada(CODIGO_FICHA)) === CODIGO_FICHA) {
        reiniciarFichaApagada();
        return;
      }
      if (primeiraVez && obterDadosFichaArmazenados(CODIGO_FICHA)) salvarFicha();
      return;
    }

    var timestampNuvem = (dados._timestamp || dados._ts || 0);
    var timestampAtual = (MEMORIA_FICHA && (MEMORIA_FICHA._timestamp || MEMORIA_FICHA._ts)) ||
                         (MODO_VISUALIZACAO ? 0 : obterTimestampLocal());

    if (timestampNuvem > timestampAtual || (primeiraVez && MODO_VISUALIZACAO)) {
      if (!usuarioDigitando() && !pendenteSalvamento) {
        aplicarDadosNuvem(dados);
        atualizarStatusNuvem(MODO_VISUALIZACAO ? "Modo mestre: ficha atualizada" : "☁ Atualizada pela nuvem");
      }
    } else if (primeiraVez && !MODO_VISUALIZACAO && obterDadosFichaArmazenados(CODIGO_FICHA) && timestampNuvem < timestampAtual) {
      salvarFicha();
    }
  });
}
var sync = sincronizarFicha; // Alias
