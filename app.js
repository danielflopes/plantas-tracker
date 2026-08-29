(function(){
  'use strict';

  var LS_TOKEN = 'pt_token';
  var LS_REPO = 'pt_repo';
  var LS_REGAS = 'pt_regas_cache';
  var LS_PENDING = 'pt_pending_sync';
  var LS_SORT = 'pt_sort';

  var plantas = [];
  var regas = {};
  var sha = null;
  var sortMode = 'urgencia';

  // ---------- utilidades de data ----------
  function pad(n){ return String(n).padStart(2, '0'); }
  function todayISO(){
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function daysSince(dateStr){
    var parts = dateStr.split('-').map(Number);
    var then = new Date(parts[0], parts[1] - 1, parts[2]);
    var now = new Date();
    var nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((nowMid - then) / 86400000);
  }

  // ---------- urgência ----------
  function computeUrgency(planta){
    var dateStr = regas[planta.id];
    if(!dateStr){
      return { registrado: false };
    }
    var dias = Math.max(0, daysSince(dateStr));
    var threshold = planta.intervaloDias / planta.limiteDias;
    var pRaw = dias / planta.limiteDias;
    var p = Math.min(1, Math.max(0, pRaw));
    var hue;
    if(p <= threshold){
      hue = threshold > 0 ? (130 + (45 - 130) * (p / threshold)) : 45;
    } else {
      var denom = (1 - threshold) || 1;
      hue = 45 + (0 - 45) * ((p - threshold) / denom);
    }
    var cor = 'hsl(' + hue.toFixed(1) + ', 62%, 42%)';
    var urgente = dias >= planta.limiteDias;
    var texto;
    if(dias === 0) texto = 'hoje';
    else if(dias === 1) texto = 'há 1 dia';
    else texto = 'há ' + dias + ' dias';
    if(urgente) texto += ' — regar!';
    return { registrado: true, dias: dias, p: p, threshold: threshold, cor: cor, urgente: urgente, texto: texto, dateStr: dateStr };
  }

  // ---------- render ----------
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function gaugeLuz(n){
    var html = '<div class="gauge">';
    for(var i = 1; i <= 3; i++) html += '<span class="dot' + (i <= n ? ' on' : '') + '"></span>';
    return html + '</div>';
  }
  function gaugeAgua(n){
    var html = '<div class="gauge">';
    for(var i = 1; i <= 4; i++) html += '<span class="drop' + (i <= n ? ' on' : '') + '"></span>';
    return html + '</div>';
  }

  function buildCard(planta){
    var card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = planta.id;
    var initial = (planta.nomeComum || '?').trim().charAt(0).toUpperCase();

    card.innerHTML =
      '<div class="num">' + planta.id + '</div>' +
      '<div class="photo-box">' +
        '<img src="' + planta.foto + '" alt="' + escapeHtml(planta.nomeComum) + '" loading="lazy">' +
        '<div class="photo-fallback" hidden>' + initial + '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<h2 class="plant-name">' + escapeHtml(planta.nomeComum) + '</h2>' +
        '<p class="sci">' + escapeHtml(planta.nomeCientifico) + '</p>' +
        '<div class="row"><span class="label">Luz</span>' + gaugeLuz(planta.luz) + '</div>' +
        '<div class="row"><span class="label">Água</span>' + gaugeAgua(planta.agua) + '</div>' +
        '<p class="tip">' + escapeHtml(planta.dica) + '</p>' +
        '<details class="details">' +
          '<summary>+ mais detalhes</summary>' +
          '<div class="details-body">' +
            '<p><strong>Luz</strong> — ' + escapeHtml(planta.luzTexto) + '</p>' +
            '<p><strong>Água</strong> — ' + escapeHtml(planta.aguaTexto) + '</p>' +
          '</div>' +
        '</details>' +
        '<div class="urgency">' +
          '<div class="urgency-track"><div class="urgency-fill"></div></div>' +
          '<p class="urgency-text"></p>' +
        '</div>' +
        '<button type="button" class="water-btn" aria-label="Marcar ' + escapeHtml(planta.nomeComum) + ' como regada hoje">' +
          '<span class="check" aria-hidden="true">✓</span><span class="label-txt">Reguei hoje</span>' +
        '</button>' +
        '<details class="fix-date">' +
          '<summary>outra data</summary>' +
          '<div class="fix-date-row">' +
            '<input type="date" aria-label="Escolher outra data de rega">' +
            '<button type="button" class="btn-confirm-date">OK</button>' +
          '</div>' +
        '</details>' +
      '</div>';

    var img = card.querySelector('.photo-box img');
    var fallback = card.querySelector('.photo-fallback');
    img.addEventListener('error', function(){
      img.hidden = true;
      fallback.hidden = false;
    }, { once: true });

    var details = card.querySelector('.details');
    var detailsSummary = details.querySelector('summary');
    details.addEventListener('toggle', function(){
      detailsSummary.textContent = details.open ? '− menos detalhes' : '+ mais detalhes';
    });

    var dateInput = card.querySelector('input[type=date]');
    dateInput.max = todayISO();

    var waterBtn = card.querySelector('.water-btn');
    waterBtn.addEventListener('click', function(){
      markWatered(planta.id, todayISO());
      pulseButton(waterBtn);
    });

    var fixDate = card.querySelector('.fix-date');
    card.querySelector('.btn-confirm-date').addEventListener('click', function(){
      var val = dateInput.value;
      if(!val) return;
      if(val > todayISO()) val = todayISO();
      markWatered(planta.id, val);
      fixDate.removeAttribute('open');
    });

    applyUrgency(card, planta);
    return card;
  }

  function applyUrgency(card, planta){
    var u = computeUrgency(planta);
    var fill = card.querySelector('.urgency-fill');
    var text = card.querySelector('.urgency-text');
    var dateInput = card.querySelector('input[type=date]');
    if(!u.registrado){
      fill.className = 'urgency-fill neutral';
      fill.style.width = '100%';
      fill.style.background = '';
      text.textContent = 'sem registo';
      text.classList.remove('urgent');
    } else {
      fill.className = 'urgency-fill';
      fill.style.width = (u.p * 100).toFixed(0) + '%';
      fill.style.background = u.cor;
      text.textContent = u.texto;
      text.classList.toggle('urgent', u.urgente);
      dateInput.value = u.dateStr;
    }
  }

  function pulseButton(btn){
    btn.classList.add('done');
    setTimeout(function(){ btn.classList.remove('done'); }, 1400);
  }

  function markWatered(id, dateStr){
    regas[id] = dateStr;
    var card = document.querySelector('.card[data-id="' + id + '"]');
    var planta = plantas.filter(function(p){ return p.id === id; })[0];
    if(card && planta) applyUrgency(card, planta);
    updateSummary();
    syncSave();
  }

  function updateSummary(){
    var precisam = 0;
    plantas.forEach(function(pl){
      var u = computeUrgency(pl);
      if(u.registrado && u.p > u.threshold) precisam++;
    });
    var el = document.getElementById('resumo');
    if(precisam === 0){
      el.textContent = 'Está tudo bem regado 🌿';
      el.classList.add('ok');
    } else {
      el.textContent = precisam + (precisam === 1 ? ' planta a precisar de água' : ' plantas a precisar de água');
      el.classList.remove('ok');
    }
  }

  function sortedPlantas(){
    var list = plantas.slice();
    list.sort(function(a, b){
      if(sortMode === 'numero') return parseInt(a.id, 10) - parseInt(b.id, 10);
      if(sortMode === 'nome') return a.nomeComum.localeCompare(b.nomeComum, 'pt');
      if(sortMode === 'luz') return (b.luz - a.luz) || (parseInt(a.id, 10) - parseInt(b.id, 10));
      if(sortMode === 'agua') return (b.agua - a.agua) || (parseInt(a.id, 10) - parseInt(b.id, 10));
      var ua = computeUrgency(a), ub = computeUrgency(b);
      var pa = ua.registrado ? ua.p : 1.0001;
      var pb = ub.registrado ? ub.p : 1.0001;
      if(pb !== pa) return pb - pa;
      return parseInt(a.id, 10) - parseInt(b.id, 10);
    });
    return list;
  }

  function render(){
    var grid = document.getElementById('grid');
    grid.innerHTML = '';
    sortedPlantas().forEach(function(pl){ grid.appendChild(buildCard(pl)); });
    updateSummary();
  }

  function initSortbar(){
    var buttons = document.querySelectorAll('#sortbar button');
    sortMode = localStorage.getItem(LS_SORT) || 'urgencia';
    buttons.forEach(function(b){
      b.setAttribute('aria-pressed', b.dataset.sort === sortMode ? 'true' : 'false');
      b.addEventListener('click', function(){
        sortMode = b.dataset.sort;
        localStorage.setItem(LS_SORT, sortMode);
        buttons.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
  }

  // ---------- sincronização com GitHub ----------
  function detectRepo(){
    var host = location.hostname;
    if(host.endsWith('.github.io')){
      var owner = host.split('.')[0];
      var parts = location.pathname.split('/').filter(Boolean);
      if(parts.length > 0) return owner + '/' + parts[0];
      return owner + '/' + owner + '.github.io';
    }
    return '';
  }
  function getToken(){ return localStorage.getItem(LS_TOKEN) || ''; }
  function getRepo(){ return localStorage.getItem(LS_REPO) || detectRepo(); }

  function b64EncodeUtf8(str){ return btoa(unescape(encodeURIComponent(str))); }
  function b64DecodeUtf8(b64){ return decodeURIComponent(escape(atob(b64.replace(/\n/g, '')))); }

  function readLocalCache(){
    try { return JSON.parse(localStorage.getItem(LS_REGAS) || '{}'); }
    catch(e){ return {}; }
  }
  function persistRegas(){ localStorage.setItem(LS_REGAS, JSON.stringify(regas)); }

  function setPending(v){ localStorage.setItem(LS_PENDING, v ? '1' : '0'); }
  function isPending(){ return localStorage.getItem(LS_PENDING) === '1'; }

  function mergeRegas(local, remote){
    var merged = Object.assign({}, remote);
    Object.keys(local).forEach(function(id){
      var l = local[id], r = remote[id];
      merged[id] = (!r || l > r) ? l : r;
    });
    return merged;
  }

  function fetchRemote(token, repo){
    return fetch('https://api.github.com/repos/' + repo + '/contents/regas.json', {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/vnd.github+json' }
    }).then(function(res){
      if(res.status === 404) return { data: {}, sha: null };
      if(!res.ok) throw new Error('github-read-failed');
      return res.json().then(function(json){
        return { data: JSON.parse(b64DecodeUtf8(json.content) || '{}'), sha: json.sha };
      });
    });
  }

  function loadRegas(){
    var token = getToken(), repo = getRepo();
    if(token && repo){
      return fetchRemote(token, repo).then(function(r){
        sha = r.sha;
        return r.data;
      }).catch(function(){
        return readLocalCache();
      });
    }
    return fetch('regas.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function(res){
        if(!res.ok) throw new Error('fetch-failed');
        return res.json();
      })
      .catch(function(){ return readLocalCache(); });
  }

  function attemptPut(token, repo, data, isRetry){
    var body = { message: 'rega: ' + todayISO(), content: b64EncodeUtf8(JSON.stringify(data, null, 2)) };
    if(sha) body.sha = sha;
    return fetch('https://api.github.com/repos/' + repo + '/contents/regas.json', {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(function(res){
      if(res.ok){
        return res.json().then(function(json){
          sha = json.content && json.content.sha;
          return true;
        });
      }
      if((res.status === 409 || res.status === 422) && !isRetry){
        return fetchRemote(token, repo).then(function(remote){
          regas = mergeRegas(regas, remote.data);
          sha = remote.sha;
          persistRegas();
          return attemptPut(token, repo, regas, true);
        });
      }
      return false;
    }).catch(function(){ return false; });
  }

  function updateSyncBanner(){
    var token = getToken(), repo = getRepo();
    var banner = document.getElementById('aviso-sync');
    var textEl = document.getElementById('aviso-sync-texto');
    if(!token || !repo){
      banner.classList.remove('hidden');
      textEl.textContent = 'não está a sincronizar — só neste dispositivo';
    } else if(isPending()){
      banner.classList.remove('hidden');
      textEl.textContent = 'por sincronizar — vai tentar de novo em breve';
    } else {
      banner.classList.add('hidden');
    }
  }

  function syncSave(){
    persistRegas();
    var token = getToken(), repo = getRepo();
    if(!token || !repo){
      setPending(true);
      updateSyncBanner();
      return;
    }
    attemptPut(token, repo, regas, false).then(function(ok){
      setPending(!ok);
      updateSyncBanner();
    });
  }

  window.addEventListener('online', function(){
    if(isPending()) syncSave();
  });

  // ---------- definições ----------
  function initSettings(){
    var overlay = document.getElementById('overlay');
    var openBtn = document.getElementById('btn-definicoes');
    var closeBtn = document.getElementById('btn-fechar-definicoes');
    var tokenInput = document.getElementById('input-token');
    var repoInput = document.getElementById('input-repo');
    var statusEl = document.getElementById('settings-status');

    function open(){
      tokenInput.value = getToken();
      repoInput.value = getRepo();
      statusEl.textContent = '';
      overlay.classList.add('open');
    }
    function close(){ overlay.classList.remove('open'); }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function(e){ if(e.target === overlay) close(); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && overlay.classList.contains('open')) close();
    });

    document.getElementById('btn-guardar-token').addEventListener('click', function(){
      var t = tokenInput.value.trim();
      var r = repoInput.value.trim();
      if(t) localStorage.setItem(LS_TOKEN, t); else localStorage.removeItem(LS_TOKEN);
      if(r) localStorage.setItem(LS_REPO, r); else localStorage.removeItem(LS_REPO);
      statusEl.textContent = 'A sincronizar…';
      sha = null;
      loadRegas().then(function(r2){
        regas = r2;
        persistRegas();
        render();
        updateSyncBanner();
        statusEl.textContent = 'Guardado.';
        setTimeout(close, 700);
      });
    });

    document.getElementById('btn-remover-token').addEventListener('click', function(){
      localStorage.removeItem(LS_TOKEN);
      tokenInput.value = '';
      statusEl.textContent = 'Token removido.';
      sha = null;
      loadRegas().then(function(r2){
        regas = r2;
        persistRegas();
        render();
        updateSyncBanner();
      });
    });
  }

  // ---------- arranque ----------
  function init(){
    initSortbar();
    initSettings();

    Promise.all([
      fetch('dados/plantas.json').then(function(r){ return r.json(); }),
      loadRegas()
    ]).then(function(results){
      plantas = results[0].plantas;
      var loaded = results[1];
      if(isPending()){
        regas = mergeRegas(readLocalCache(), loaded);
      } else {
        regas = loaded;
      }
      persistRegas();
      render();
      updateSyncBanner();
      if(isPending() && getToken() && getRepo()) syncSave();
    }).catch(function(){
      document.getElementById('grid').innerHTML = '<p style="grid-column:1/-1;color:var(--muted)">Não foi possível carregar os dados das plantas.</p>';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
