/* ==========================================================================
   Interface e Controladores da Ficha do Personagem (index.html)
   ========================================================================== */

function opts(v) {
  return A.map(function(a) {
    return '<option value="' + a[0] + '"' + (a[0] === v ? ' selected' : '') + '>' + cap(a[0]) + '</option>';
  }).join("");
}

function rowHtml(i) {
  var s = S[i] || ["", "int"];
  return '<div class="sk"><input type="checkbox" data-k="t' + i + '" id="t' + i + '" aria-label="Treinada"><b id="s' + i + '">0</b><span class="sn"><input data-k="sn' + i + '" value="' + s[0] + '" placeholder="Nova perícia" aria-label="Nome da perícia"><select data-k="sa' + i + '" id="sa' + i + '" aria-label="Atributo">' + opts(s[1]) + '</select></span><input class="o" type="number" data-k="o' + i + '" id="o' + i + '" value="0" aria-label="Outros"><button class="x" data-del="' + i + '" aria-label="Remover perícia" title="Remover">×</button></div>';
}

function renderSkills() {
  var el = document.getElementById("skills");
  if (el) el.innerHTML = list.map(rowHtml).join("");
}

function refresh() {
  saveList();
  renderSkills();
  load();
  calc();
  save();
}

function renderHab() {
  var el = document.getElementById("habs");
  if (el) {
    el.innerHTML = hl.map(function(i, k) {
      return '<div class="hb"><input data-k="hn' + i + '" placeholder="Nome" aria-label="Nome da habilidade"><input data-k="hd' + i + '" placeholder="1d6" aria-label="Dado de dano"><input data-k="hs' + i + '" list="esc" placeholder="Escala com" aria-label="Escala com"><input data-k="ht' + i + '" list="tip" placeholder="Tipo" aria-label="Tipo"><textarea class="hx" rows="1" data-k="hx' + i + '" placeholder="Descrição" aria-label="Descrição"></textarea><div class="ac"><button type="button" class="x" data-hmv="-1" data-hid="' + i + '" aria-label="Mover para cima" title="Mover para cima"' + (k === 0 ? " disabled" : "") + '>▲</button><button type="button" class="x" data-hmv="1" data-hid="' + i + '" aria-label="Mover para baixo" title="Mover para baixo"' + (k === hl.length - 1 ? " disabled" : "") + '>▼</button><button type="button" class="x" data-hdel="' + i + '" aria-label="Remover linha" title="Remover">×</button></div></div>';
    }).join("");
  }
}

function refreshHab() {
  renderHab();
  load();
  calc();
  save();
}

// Inicializa blocos da Ficha
var stonesEl = document.getElementById("stones");
if (stonesEl) {
  stonesEl.innerHTML = A.map(function(a) {
    return '<div class="at">' + FR + '<span class="an' + (a[1].length > 9 ? ' lg' : '') + '">' + a[1].toUpperCase() + '</span><b class="mod" id="m-' + a[0] + '">+0</b><input type="number" data-k="v-' + a[0] + '" id="v-' + a[0] + '" value="10" aria-label="' + a[1] + ' (valor)"><button type="button" class="sp dn" data-step="-1" data-t="v-' + a[0] + '" aria-label="Diminuir ' + a[1] + '">−</button><button type="button" class="sp up" data-step="1" data-t="v-' + a[0] + '" aria-label="Aumentar ' + a[1] + '">+</button></div>';
  }).join("");
}

renderSkills();
renderHab();

var invEl = document.getElementById("inv");
if (invEl) {
  var iv = "";
  for (var k = 0; k < 14; k++) {
    iv += '<div class="inv"><input data-k="in' + k + '"><input type="number" min="0" data-k="iq' + k + '"><input type="number" min="0" step="0.5" data-k="ie' + k + '"></div>';
  }
  invEl.innerHTML = iv;
}

// Event Listeners Globais
document.addEventListener("input", function() {
  calc();
  save();
});

document.addEventListener("change", function() {
  calc();
  save();
});

// Tratamento de Imagem do Personagem
var PIC = "";
function showPic() {
  var h = document.querySelector('[data-k="img"]'),
      v = h ? h.value : "";
  if (v === PIC) return;
  PIC = v;
  var im = document.getElementById("picimg"),
      ph = document.getElementById("picph");
  if (v) {
    im.src = v;
    im.hidden = false;
    ph.hidden = true;
  } else {
    im.removeAttribute("src");
    im.hidden = true;
    ph.hidden = false;
  }
  document.getElementById("pic").className = "pic" + (v ? " has" : "");
  document.getElementById("picdel").hidden = !v;
}

function setPic(v) {
  var h = document.querySelector('[data-k="img"]');
  if (h) {
    h.value = v;
    h.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

var picfileEl = document.getElementById("picfile");
if (picfileEl) {
  picfileEl.addEventListener("change", function() {
    var inp = this,
        f = inp.files && inp.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function() {
      var im = new Image();
      im.onload = function() {
        var sc = Math.min(1, 400 / im.width, 540 / im.height),
            c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(im.width * sc));
        c.height = Math.max(1, Math.round(im.height * sc));
        var x = c.getContext("2d");
        x.fillStyle = "#000";
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(im, 0, 0, c.width, c.height);
        setPic(c.toDataURL("image/jpeg", 0.8));
        inp.value = "";
      };
      im.onerror = function() { inp.value = ""; };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  });
}

var picdelEl = document.getElementById("picdel");
if (picdelEl) {
  picdelEl.onclick = function() { setPic(""); };
}

// Remoção e Adição de Perícias
document.addEventListener("click", function(e) {
  var d = e.target.closest && e.target.closest("[data-del]");
  if (!d) return;
  save();
  var id = +d.dataset.del;
  list = list.filter(function(x) { return x !== id; });
  refresh();
});

var addskEl = document.getElementById("addsk");
if (addskEl) {
  addskEl.onclick = function() {
    save();
    var id = Math.max.apply(null, list.concat([99])) + 1;
    list.push(id);
    refresh();
    var el = document.querySelector('[data-k="sn' + id + '"]');
    if (el) el.focus();
  };
}

function sortSk() {
  save();
  function nm(i) {
    var e = document.querySelector('[data-k="sn' + i + '"]');
    return e ? e.value : (S[i] ? S[i][0] : "");
  }
  list.sort(function(a, b) {
    var x = nm(a), y = nm(b);
    if (!x && y) return 1;
    if (x && !y) return -1;
    return x.localeCompare(y, "pt-BR", { sensitivity: "base" });
  });
  refresh();
}

var srtskEl = document.getElementById("srtsk");
if (srtskEl) srtskEl.onclick = sortSk;

var rstskEl = document.getElementById("rstsk");
if (rstskEl) {
  rstskEl.onclick = function() {
    save();
    DEF.forEach(function(i) {
      if (list.indexOf(i) < 0) list.push(i);
    });
    sortSk();
  };
}

// Reordenação e Exclusão de Habilidades
document.addEventListener("click", function(e) {
  var b = e.target.closest && e.target.closest("[data-hmv]");
  if (!b || b.disabled) return;
  save();
  var id = +b.dataset.hid,
      k = hl.indexOf(id),
      j = k + (+b.dataset.hmv);
  if (k < 0 || j < 0 || j >= hl.length) return;
  var t = hl[k];
  hl[k] = hl[j];
  hl[j] = t;
  refreshHab();
});

document.addEventListener("click", function(e) {
  var b = e.target.closest && e.target.closest("[data-hdel]");
  if (!b) return;
  save();
  var id = +b.dataset.hdel;
  hl = hl.filter(function(x) { return x !== id; });
  refreshHab();
});

var addhbEl = document.getElementById("addhb");
if (addhbEl) {
  addhbEl.onclick = function() {
    save();
    hl.push(Math.max.apply(null, hl.concat([-1])) + 1);
    refreshHab();
    var el = document.querySelector('[data-k="hn' + hl[hl.length - 1] + '"]');
    if (el) el.focus();
  };
}

// Botões de incremento/decremento com data-step
document.addEventListener("click", function(e) {
  var b = e.target.closest && e.target.closest("[data-step]");
  if (!b) return;
  var i = document.getElementById(b.dataset.t);
  if (!i) return;
  var v = parseInt(i.value, 10);
  if (isNaN(v)) v = b.dataset.t.indexOf("v-") === 0 ? 10 : 0;
  var n = v + parseInt(b.dataset.step, 10);
  if (b.dataset.t.indexOf("v-") !== 0) n = Math.max(0, n);
  i.value = n;
  i.dispatchEvent(new Event("input", { bubbles: true }));
});

// Ações do Dado da Sorte
var dusarEl = document.getElementById("dusar");
if (dusarEl) {
  dusarEl.onclick = function() {
    var e = document.getElementById("dado"),
        v = parseInt(e.value, 10);
    if (isNaN(v)) v = 3;
    if (v <= 0) return;
    e.value = v - 1;
    e.dispatchEvent(new Event("input", { bubbles: true }));
  };
}

function twoStep(id, txt, fn) {
  var b = document.getElementById(id);
  if (!b) return;
  var o = b.textContent, t = null;
  b.onclick = function() {
    if (t) {
      clearTimeout(t);
      t = null;
      b.textContent = o;
      fn();
      return;
    }
    b.textContent = txt;
    t = setTimeout(function() {
      t = null;
      b.textContent = o;
    }, 3500);
  };
}

twoStep("drec", "Confirmar?", function() {
  var e = document.getElementById("dado");
  if (e) {
    e.value = 3;
    e.dispatchEvent(new Event("input", { bubbles: true }));
  }
});

var printEl = document.getElementById("print");
if (printEl) {
  printEl.onclick = function() { window.print(); };
}

twoStep("clear", "Tem certeza?", function() {
  var c = CODE;
  fetch(SB_URL + "/rest/v1/fichas?id=eq." + encodeURIComponent(c), {
    method: "DELETE",
    headers: { apikey: SB_KEY }
  })
  .catch(function() {})
  .then(function() {
    [KEY, LKEY, "ficha-tormenta-synced", "ficha-tormenta-code"].forEach(function(k) {
      try { localStorage.removeItem(k); } catch (x) {}
    });
    location.reload();
  });
});

load();
calc();

// Inicialização de Modo (Mestre x Jogador)
if (VIEW) {
  var cb = document.getElementById("codebox");
  if (cb) cb.style.display = "none";
  var clr = document.getElementById("clear");
  if (clr) clr.style.display = "none";

  function lock(on) {
    EDIT = !on;
    var sheetEl = document.getElementById("sheet");
    if (sheetEl) sheetEl.inert = on;
    var b = document.getElementById("mbar");
    if (b) {
      b.hidden = false;
      b.className = "mbar" + (on ? "" : " on");
    }
    var mtxt = document.getElementById("mtxt");
    if (mtxt) {
      mtxt.textContent = on ? "Modo mestre: somente leitura. A ficha do jogador não será alterada." : "Modo mestre: edição liberada. O que você mudar vai para a ficha do jogador.";
    }
    var mtog = document.getElementById("mtog");
    if (mtog) {
      mtog.textContent = on ? "Liberar edição" : "Travar edição";
    }
  }

  var mtogEl = document.getElementById("mtog");
  if (mtogEl) {
    mtogEl.onclick = function() { lock(EDIT); };
  }
  var RO = !!QS.get("ro");
  lock(!QS.get("e") || RO);
  if (RO && mtogEl) mtogEl.hidden = true;

  st("Modo mestre: carregando…");
  sync(true);
} else {
  var codeEl = document.getElementById("code");
  if (codeEl) codeEl.textContent = CODE;
  var gm = lget("ficha-tormenta-msg");
  if (gm) {
    try { localStorage.removeItem("ficha-tormenta-msg"); } catch (x) {}
    st(gm);
  } else {
    st("Alterações são salvas neste aparelho e na nuvem.");
  }
  sync(true);

  var chcodeEl = document.getElementById("chcode");
  if (chcodeEl) {
    chcodeEl.onclick = function() {
      var c = (prompt("Digite o código da ficha que você quer carregar neste aparelho:") || "").trim();
      if (!c || c === CODE) return;
      pull(c, function(d) {
        if (!d) {
          st("Código não encontrado");
          return;
        }
        if (!confirm("Isso troca a ficha deste aparelho pela ficha desse código. Continuar?")) return;
        hflush();
        CODE = c;
        lset("ficha-tormenta-code", CODE);
        document.getElementById("code").textContent = CODE;
        applyCloud(d);
        save();
      });
    };
  }
}

// Polling de sincronização a cada 10 segundos
setInterval(function() {
  sync(false);
}, 10000);
