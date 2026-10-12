/* ==========================================================================
   Motor de Cálculos e Regras de RPG (Tormenta20)
   ========================================================================== */

function num(id) {
  var el = document.getElementById(id);
  return el ? (parseInt(el.value, 10) || 0) : 0;
}

function sg(n) {
  return n >= 0 ? "+" + n : "" + n;
}

function fl(k) {
  var el = document.querySelector('[data-k="' + k + '"]');
  return el ? parseFloat(el.value) : NaN;
}

function mod(k) {
  var el = document.getElementById("v-" + k);
  var v = el ? parseInt(el.value, 10) : 10;
  if (isNaN(v)) v = 10;
  return Math.floor((v - 10) / 2);
}

function pips() {
  var e = document.getElementById("dado");
  if (!e) return;
  var v = parseInt(e.value, 10);
  if (isNaN(v)) v = 3;
  v = Math.max(0, Math.min(3, v));
  
  var h = "";
  for (var i = 0; i < 3; i++) {
    h += '<svg class="pip' + (i < v ? ' on' : '') + '" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 21,7 21,17 12,22 3,17 3,7"/><path d="M12 7L17.5 16.5H6.5ZM12 2V7M21 7L17.5 16.5M3 7L6.5 16.5M12 22V16.5"/></svg>';
  }
  
  var pipsEl = document.getElementById("pips");
  if (pipsEl) pipsEl.innerHTML = h;
  
  var dcntEl = document.getElementById("dcnt");
  if (dcntEl) dcntEl.textContent = v + " / 3";
  
  var dusarEl = document.getElementById("dusar");
  if (dusarEl) dusarEl.disabled = v <= 0;
}

function grow() {
  document.querySelectorAll(".hx").forEach(function(t) {
    t.style.height = "auto";
    t.style.height = Math.max(30, t.scrollHeight + 2) + "px";
  });
}

function calc() {
  pips();
  grow();
  if (typeof showPic === "function") showPic();

  // Modificadores de Atributos
  A.forEach(function(a) {
    var el = document.getElementById("m-" + a[0]);
    if (el) el.textContent = sg(mod(a[0]));
  });

  // Cálculo de Carga e Inventário
  var tot = 0;
  for (var k = 0; k < 14; k++) {
    var inEl = document.querySelector('[data-k="in' + k + '"]');
    var nm = inEl ? inEl.value.trim() : "";
    var q = fl("iq" + k);
    var e = fl("ie" + k);
    if (isNaN(q)) q = nm ? 1 : 0;
    if (isNaN(e)) e = 0;
    tot += q * e;
  }
  var u = document.getElementById("usado");
  if (u) {
    u.textContent = Math.round(tot * 10) / 10;
    u.className = (num("carga") > 0 && tot > num("carga")) ? "over" : "";
  }

  // Bônus de Proficiência T20
  var lv0 = Math.max(1, Math.min(20, num("nivel") || 1));
  var profEl = document.getElementById("prof");
  if (profEl) profEl.textContent = "+" + (2 + Math.floor((lv0 - 1) / 4));

  // Cálculo de Perícias T20: metade do nível + mod atributo + treino + outros
  var lv = Math.max(1, num("nivel")),
      half = Math.floor(lv / 2),
      tr = lv >= 15 ? 6 : lv >= 7 ? 4 : 2;

  if (Array.isArray(list)) {
    list.forEach(function(i) {
      var tEl = document.getElementById("t" + i);
      var t = (tEl && tEl.checked) ? tr : 0;
      var saEl = document.getElementById("sa" + i);
      var sAttr = saEl ? saEl.value : "for";
      var sEl = document.getElementById("s" + i);
      if (sEl) sEl.textContent = sg(half + mod(sAttr) + t + num("o" + i));
    });
  }

  // Iniciativa (espelhada da perícia s12)
  var ie = document.getElementById("s12");
  var iniEl = document.getElementById("ini");
  if (iniEl) iniEl.textContent = ie ? ie.textContent : "—";

  // Defesa: 10 + Des + Bônus
  var defEl = document.getElementById("defesa");
  if (defEl) defEl.textContent = 10 + mod("des") + num("defx");

  // Barras de Progresso de PV e PM
  [["pv", "pvm", "bpv"], ["pm", "pmm", "bpm"]].forEach(function(b) {
    var m = num(b[1]),
        p = m > 0 ? Math.max(0, Math.min(100, (num(b[0]) / m) * 100)) : 0;
    var barEl = document.getElementById(b[2]);
    if (barEl) barEl.style.width = p + "%";
  });
}
