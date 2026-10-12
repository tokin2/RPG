/* ==========================================================================
   Sincronização em Nuvem e Histórico de Alterações (Supabase)
   ========================================================================== */

var pending = false;
var tm = null;
var HQ = {};
var HQS = [];
var HT = null;

function st(t) {
  var e = document.getElementById("cloud");
  if (e) e.textContent = t;
}

function hclone(o) {
  return o ? JSON.parse(JSON.stringify(o)) : null;
}

function hv(v) {
  if (v === true) return "sim";
  if (v === false) return "não";
  v = (v == null ? "" : String(v)).trim();
  if (!v) return "—";
  return v.length > 80 ? v.slice(0, 80) + "…" : v;
}

function sname(d, i) {
  return (d && d["sn" + i]) || (S[i] ? S[i][0] : "") || "sem nome";
}

function hname(d, i) {
  return (d && d["hn" + i]) || "sem nome";
}

function attrName(c) {
  var a = A.filter(function(x) { return x[0] === c; })[0];
  return a ? a[1] : c;
}

function hlabel(k, N) {
  var m;
  if (HNAME[k]) return HNAME[k];
  if (m = /^v-(.+)$/.exec(k)) return attrName(m[1]) + " (valor)";
  if (m = /^t(\d+)$/.exec(k)) return "Perícia treinada: " + sname(N, m[1]);
  if (m = /^sn(\d+)$/.exec(k)) return "Perícia renomeada";
  if (m = /^sa(\d+)$/.exec(k)) return "Atributo da perícia " + sname(N, m[1]);
  if (m = /^o(\d+)$/.exec(k)) return "Outros da perícia " + sname(N, m[1]);
  if (m = /^(in|iq|ie)(\d+)$/.exec(k)) {
    return "Inventário, linha " + (+m[2] + 1) + " (" + { in: "item", iq: "quantidade", ie: "espaços" }[m[1]] + ")";
  }
  if (m = /^h([ndstx])(\d+)$/.exec(k)) {
    return "Habilidade «" + hname(N, m[2]) + "»: " + { n: "nome", d: "dano", s: "escala com", t: "tipo", x: "descrição" }[m[1]];
  }
  return k;
}

function hdiff(O, N) {
  if (!O) return [{ campo: "Ficha", de: "—", para: "criada", s: 1 }];
  var ch = [], legacy = !O._m2, addS = [], addH = [];

  function sets(key, fn, lab) {
    if (!Array.isArray(O[key]) || !Array.isArray(N[key])) return;
    N[key].forEach(function(i) {
      if (O[key].indexOf(i) < 0) {
        fn(i);
        ch.push({ campo: lab + " adicionada", de: "—", para: key === "_list" ? sname(N, i) : hname(N, i), s: 1 });
      }
    });
    O[key].forEach(function(i) {
      if (N[key].indexOf(i) < 0) {
        ch.push({ campo: lab + " removida", de: key === "_list" ? sname(O, i) : hname(O, i), para: "—", s: 1 });
      }
    });
    if (O[key].length === N[key].length && O[key].join() !== N[key].join() && N[key].every(function(i) { return O[key].indexOf(i) >= 0; })) {
      ch.push({ campo: "Ordem das " + (key === "_list" ? "perícias" : "habilidades"), de: "—", para: "alterada", s: 1 });
    }
  }

  sets("_list", function(i) { addS.push(String(i)); }, "Perícia");
  if (!legacy) sets("_hl", function(i) { addH.push(String(i)); }, "Habilidade");

  Object.keys(N).forEach(function(k) {
    if (k.charAt(0) === "_") return;
    var m;
    if (legacy && /^h[ndstx]\d+$/.test(k)) return;
    if ((m = /^h[ndstx](\d+)$/.exec(k)) && addH.indexOf(m[1]) >= 0) return;
    if ((m = /^(?:t|sn|sa|o)(\d+)$/.exec(k)) && addS.indexOf(m[1]) >= 0) return;

    var nv = N[k], ov = O[k];
    if (ov === undefined) {
      var el = document.querySelector('[data-k="' + k + '"]');
      if (!el || el.tagName === "SELECT") return;
      ov = el.type === "checkbox" ? el.defaultChecked : el.defaultValue;
    }
    if (String(ov) === String(nv)) return;
    if (k === "img") {
      ch.push({ campo: "Imagem", de: ov ? "imagem anterior" : "nenhuma", para: nv ? "nova imagem" : "removida" });
      return;
    }
    if (/^sa\d+$/.test(k)) {
      ov = attrName(ov);
      nv = attrName(nv);
    }
    ch.push({ campo: hlabel(k, N), de: hv(ov), para: hv(nv) });
  });

  return ch.slice(0, 40);
}

function hqAdd(list) {
  list.forEach(function(c) {
    if (c.s) {
      HQS.push(c);
      return;
    }
    var e = HQ[c.campo];
    if (e) {
      e.para = c.para;
      if (e.de === e.para) delete HQ[c.campo];
    } else {
      HQ[c.campo] = { campo: c.campo, de: c.de, para: c.para };
    }
  });
  clearTimeout(HT);
  HT = setTimeout(hflush, 20000);
}

function hflush() {
  clearTimeout(HT);
  var arr = Object.keys(HQ).map(function(k) { return HQ[k]; }).concat(HQS);
  HQ = {};
  HQS = [];
  if (!arr.length) return;

  arr = arr.slice(0, 60).map(function(c) {
    return { campo: c.campo, de: c.de, para: c.para };
  });

  try {
    fetch(SB_URL + "/rest/v1/historico", {
      method: "POST",
      keepalive: true,
      headers: {
        apikey: SB_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        ficha_id: CODE,
        nome: (MEM && MEM.nome) || "",
        autor: VIEW ? "mestre" : "jogador",
        mudancas: arr
      })
    }).catch(function() {});
  } catch (x) {}
}

function onPushed(snap) {
  if (BASEOK) {
    var ch = hdiff(BASE, snap);
    if (ch.length) hqAdd(ch);
  }
  BASE = hclone(snap);
  BASEOK = true;
}

window.addEventListener("pagehide", hflush);
document.addEventListener("visibilitychange", function() {
  if (document.visibilityState === "hidden") hflush();
});

function cloudPush() {
  pending = true;
  clearTimeout(tm);
  st("Salvando…");
  tm = setTimeout(doPush, 900);
}

function doPush() {
  pending = false;
  pushing = true;
  var snap = hclone(MEM);

  fetch(SB_URL + "/rest/v1/fichas", {
    method: "POST",
    headers: {
      apikey: SB_KEY,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal"
    },
    body: JSON.stringify({
      id: CODE,
      dados: snap,
      updated_at: new Date().toISOString()
    })
  }).then(function(r) {
    pushing = false;
    if (r.ok) {
      try { onPushed(snap); } catch (x) {}
    }
    if (r.ok && !VIEW) lset(SYNCK, CODE);
    st(r.ok ? (VIEW ? "Modo mestre: salvo na nuvem" : "☁ Salva na nuvem") : "Erro ao salvar na nuvem (" + r.status + ")");
  }).catch(function() {
    pushing = false;
    st("Sem conexão com a nuvem: salva só neste aparelho");
  });
}

function pull(code, cb) {
  fetch(SB_URL + "/rest/v1/fichas?id=eq." + encodeURIComponent(code) + "&select=dados", {
    headers: { apikey: SB_KEY }
  })
  .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
  .then(function(rows) {
    cb(rows && rows[0] ? rows[0].dados : null);
  })
  .catch(function() {
    st("Não consegui falar com a nuvem");
  });
}

function applyCloud(d) {
  MEM = d;
  if (Array.isArray(d._list)) list = d._list;
  migr(d);
  if (Array.isArray(d._hl)) hl = d._hl;
  if (typeof renderHab === "function") renderHab();
  USEMEM = true;
  if (typeof renderSkills === "function") renderSkills();
  load();
  USEMEM = false;
  calc();
  writeLocal(d);
  BASE = hclone(d);
  BASEOK = true;
}

function typing() {
  var a = document.activeElement;
  return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
}

function sync(first) {
  pull(CODE, function(d) {
    if (!pending && !pushing) {
      BASE = hclone(d);
      BASEOK = true;
    }
    if (!d) {
      if (VIEW) {
        st(first ? "Ficha não encontrada" : "Esta ficha foi apagada");
        return;
      }
      if (lget(SYNCK) === CODE) {
        gone();
        return;
      }
      if (first && lget(KEY)) save();
      return;
    }
    var cur = (MEM && MEM._ts) || (VIEW ? 0 : localTs());
    if ((d._ts || 0) > cur || (first && VIEW)) {
      if (!typing() && !pending) {
        applyCloud(d);
        st(VIEW ? "Modo mestre: ficha atualizada" : "☁ Atualizada pela nuvem");
      }
    } else if (first && !VIEW && lget(KEY) && (d._ts || 0) < cur) {
      save();
    }
  });
}
