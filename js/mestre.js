/* ==========================================================================
   Controladores da Mesa do Mestre (mestre.html)
   ========================================================================== */

var busy = false;
var ROWS = [];
var HOPEN = false;
var HLIM = 150;

function say(x) {
  var m = document.getElementById("msg");
  if (m) {
    m.textContent = x;
    m.hidden = !x;
  }
}

function load() {
  fetch(SB_URL + "/rest/v1/fichas?select=id,dados,updated_at&order=updated_at.desc", {
    headers: { apikey: SB_KEY }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(rows) {
    ROWS = rows;
    if (busy) return;
    var stEl = document.getElementById("st");
    if (stEl) {
      stEl.textContent = rows.length
        ? rows.length + " ficha(s) na mesa. Atualiza sozinho a cada 20 segundos."
        : "Nenhuma ficha salva ainda. Peça para o pessoal abrir e preencher a ficha.";
    }
    var gEl = document.getElementById("g");
    if (gEl) {
      gEl.innerHTML = rows.map(function(r) {
        var d = r.dados || {},
            def = 10 + Math.floor(((d["v-des"] === undefined ? 10 : n(d["v-des"])) - 10) / 2) + n(d.defx),
            when = new Date(r.updated_at).toLocaleString("pt-BR");
        return '<div class="card"><h2>' + esc(d.nome || "Sem nome") + '</h2><div class="m">' +
               esc([d.raca, d.classe].filter(Boolean).join(" · ")) + (d.nivel ? " · nível " + esc(d.nivel) : "") + '</div>' +
               '<div class="row"><span>PV</span><b>' + n(d.pv) + ' / ' + n(d.pvm) + '</b></div><div class="bar"><i style="width:' + pct(n(d.pv), n(d.pvm)) + '%;background:var(--pv)"></i></div>' +
               '<div class="row"><span>PM</span><b>' + n(d.pm) + ' / ' + n(d.pmm) + '</b></div><div class="bar"><i style="width:' + pct(n(d.pm), n(d.pmm)) + '%;background:var(--pm)"></i></div>' +
               '<div class="row"><span>Defesa <span class="def">' + def + '</span></span><span style="color:var(--muted);font-size:12px">' + esc(when) + '</span></div>' +
               '<div class="row" style="margin-top:6px"><span>Dado da sorte</span><b>' + (d.dado === undefined ? 3 : Math.max(0, Math.min(3, n(d.dado)))) + ' / 3</b></div>' +
               '<a class="b" href="index.html?f=' + encodeURIComponent(r.id) + '&ro=1">Só olhar</a><a class="b" href="index.html?f=' + encodeURIComponent(r.id) + '&e=1">Editar ficha</a><button type="button" class="hbtn" data-hist="' + esc(r.id) + '">Histórico</button><button type="button" class="del" data-id="' + esc(r.id) + '">Apagar ficha</button><div class="codew"><button type="button" class="code" data-code="' + esc(r.id) + '" title="Toque para copiar o código">Código: <b>' + esc(r.id) + '</b></button></div></div>';
      }).join("");
    }
  })
  .catch(function(e) {
    var stEl = document.getElementById("st");
    if (stEl) {
      stEl.textContent = "Não consegui carregar as fichas (" + e + "). Confira a internet e se a tabela foi criada no Supabase.";
    }
  });
}

var gEl = document.getElementById("g");
if (gEl) {
  // Confirmação de exclusão em dois toques
  gEl.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".del");
    if (!b) return;
    if (b.dataset.armed) {
      delSheet(b.dataset.id, b);
      return;
    }
    b.dataset.armed = "1";
    b.textContent = "Confirmar apagar?";
    busy = true;
    setTimeout(function() {
      if (!b.isConnected) return;
      delete b.dataset.armed;
      if (!b.disabled) b.textContent = "Apagar ficha";
      busy = false;
    }, 4000);
  });

  // Cópia do código com fallback para execCommand
  gEl.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".code");
    if (!b) return;
    var c = b.dataset.code;
    function ok() {
      var o = b.innerHTML;
      b.textContent = "Copiado!";
      setTimeout(function() {
        if (b.isConnected) b.innerHTML = o;
      }, 1500);
    }
    function fb() {
      var t = document.createElement("textarea");
      t.value = c;
      t.style.position = "fixed";
      t.style.opacity = "0";
      document.body.appendChild(t);
      t.select();
      try {
        document.execCommand("copy");
        ok();
      } catch (x) {
        say("Não consegui copiar. O código é: " + c);
      }
      document.body.removeChild(t);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(c).then(ok, fb);
    } else {
      fb();
    }
  });

  // Abrir histórico de ficha específica
  gEl.addEventListener("click", function(e) {
    var b = e.target.closest && e.target.closest(".hbtn");
    if (!b) return;
    var id = b.dataset.hist;
    HOPEN = true;
    var hpEl = document.getElementById("hp");
    if (hpEl) hpEl.hidden = false;
    var sel = document.getElementById("hf");
    if (sel && !sel.querySelector('option[value="' + id.replace(/"/g, '\\"') + '"]')) {
      var o = document.createElement("option");
      o.value = id;
      o.textContent = id;
      sel.appendChild(o);
    }
    openHist(id);
  });
}

function delSheet(id, b) {
  b.disabled = true;
  b.textContent = "Apagando…";
  say("");
  fetch(SB_URL + "/rest/v1/fichas?id=eq." + encodeURIComponent(id), {
    method: "DELETE",
    headers: {
      apikey: SB_KEY,
      Prefer: "return=representation"
    }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(rows) {
    busy = false;
    if (rows.length) {
      say("Ficha apagada.");
    } else {
      say("Nada foi apagado. Falta criar no Supabase a regra que permite apagar.");
    }
    load();
  })
  .catch(function(e) {
    busy = false;
    say("Não consegui apagar (" + e + "). Confira a internet e a regra de apagar no Supabase.");
    load();
  });
}

function hfmt(t) {
  try {
    return new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (x) {
    return t;
  }
}

function loadHist() {
  if (!HOPEN) return;
  fetch(SB_URL + "/rest/v1/historico?select=id,ficha_id,nome,autor,mudancas,criado_em&order=criado_em.desc&limit=" + HLIM, {
    headers: { apikey: SB_KEY }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(rows) {
    var sel = document.getElementById("hf"),
        cur = sel ? sel.value : "",
        names = {},
        ord = [];
    ROWS.forEach(function(r) {
      names[r.id] = (r.dados && r.dados.nome) || "Sem nome";
      ord.push(r.id);
    });
    rows.forEach(function(h) {
      if (!(h.ficha_id in names)) {
        names[h.ficha_id] = (h.nome || "Sem nome") + " (apagada)";
        ord.push(h.ficha_id);
      }
    });
    if (sel) {
      sel.innerHTML = '<option value="">Todas</option>' + ord.map(function(id) {
        return '<option value="' + esc(id) + '">' + esc(names[id]) + '</option>';
      }).join("");
      sel.value = ord.indexOf(cur) >= 0 ? cur : "";
    }
    var f = sel ? sel.value : "",
        list = rows.filter(function(h) { return !f || h.ficha_id === f; });
    var hlEl = document.getElementById("hl");
    if (hlEl) {
      hlEl.innerHTML = list.length
        ? list.map(function(h) {
            var ch = (h.mudancas || []).map(function(c) {
              return '<li><span class="c">' + esc(c.campo) + ':</span> <s>' + esc(c.de) + '</s> → <b>' + esc(c.para) + '</b></li>';
            }).join("");
            return '<div class="he"><div class="hh"><b>' + esc(h.nome || names[h.ficha_id] || "Sem nome") + '</b><span class="tag' + (h.autor === "mestre" ? " m" : "") + '">' + (h.autor === "mestre" ? "mestre" : "jogador") + '</span><span class="t">' + esc(hfmt(h.criado_em)) + '</span></div><ul>' + ch + '</ul></div>';
          }).join("") + (rows.length >= HLIM ? '<p class="hmore sub">Mostrando os ' + HLIM + ' registros mais recentes.</p>' : "")
        : '<p class="sub">Nenhuma alteração registrada ainda. Os registros aparecem conforme as fichas são alteradas.</p>';
    }
  })
  .catch(function(e) {
    var hlEl = document.getElementById("hl");
    if (hlEl) {
      hlEl.innerHTML = '<p class="sub">Não consegui carregar o histórico (' + esc(e) + '). Confira se a tabela <b>historico</b> foi criada no Supabase.</p>';
    }
  });
}

function openHist(id) {
  HOPEN = true;
  var p = document.getElementById("hp");
  if (p) p.hidden = false;
  var hbEl = document.getElementById("hb");
  if (hbEl) hbEl.setAttribute("aria-expanded", "true");
  if (id !== undefined) {
    var hfEl = document.getElementById("hf");
    if (hfEl) hfEl.value = id;
  }
  loadHist();
  if (id !== undefined && p) {
    p.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function closeHist() {
  HOPEN = false;
  var p = document.getElementById("hp");
  if (p) p.hidden = true;
  var hbEl = document.getElementById("hb");
  if (hbEl) hbEl.setAttribute("aria-expanded", "false");
}

var hbBtn = document.getElementById("hb");
if (hbBtn) {
  hbBtn.onclick = function() { HOPEN ? closeHist() : openHist(); };
}

var hxBtn = document.getElementById("hx");
if (hxBtn) hxBtn.onclick = closeHist;

var hfSel = document.getElementById("hf");
if (hfSel) hfSel.onchange = loadHist;

var rfBtn = document.getElementById("rf");
if (rfBtn) {
  rfBtn.onclick = function() {
    load();
    loadHist();
  };
}

// Inicialização e atualização periódica a cada 20 segundos
load();
setInterval(function() {
  load();
  loadHist();
}, 20000);
