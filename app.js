(function(){
  'use strict';

  var LS_SORT = 'pt_sort';
  var LS_TAB = 'pt_tab';

  var plantas = [];
  var sortMode = 'nome';
  var tab = 'interior';

  var TABS = {
    interior: { vazio: '', contagem: ['planta', 'plantas'], onde: 'em casa' },
    exterior: { vazio: 'Ainda não há plantas no exterior. Quando acrescentares a primeira, aparece aqui.', contagem: ['planta', 'plantas'], onde: 'no exterior' }
  };

  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function localDe(p){ return p.local === 'exterior' ? 'exterior' : 'interior'; }

  function gaugeLuz(n){
    var html = '<div class="gauge" role="img" aria-label="Luz: ' + n + ' de 3">';
    for(var i = 1; i <= 3; i++) html += '<span class="dot' + (i <= n ? ' on' : '') + '"></span>';
    return html + '</div>';
  }
  function gaugeAgua(n){
    var html = '<div class="gauge" role="img" aria-label="Água: ' + n + ' de 4">';
    for(var i = 1; i <= 4; i++) html += '<span class="drop' + (i <= n ? ' on' : '') + '"></span>';
    return html + '</div>';
  }

  function qtyBadge(planta){
    if(!planta.quantidade || planta.quantidade <= 1) return '';
    return '<span class="qty-badge" title="Tens ' + planta.quantidade + ' vasos desta planta">×' + planta.quantidade + '</span>';
  }
  function qtyNote(planta){
    if(!planta.quantidade || planta.quantidade <= 1) return '';
    return '<p class="qty-note">Tens <strong>' + planta.quantidade + ' vasos</strong> desta planta.</p>';
  }

  function checkBlock(planta){
    if(!planta.verificar && !planta.cedoDemais) return '';
    var html = '<div class="check-block">';
    if(planta.verificar){
      html += '<p class="check-go"><strong>Já precisa de água?</strong> ' + escapeHtml(planta.verificar) + '</p>';
    }
    if(planta.cedoDemais){
      html += '<p class="check-wait"><strong>Ainda é cedo se…</strong> ' + escapeHtml(planta.cedoDemais) + '</p>';
    }
    return html + '</div>';
  }

  function meterBadge(planta){
    if(planta.medidor == null) return '';
    return '<div class="lr-meter" title="Regar quando o medidor de humidade chegar a este valor (escala de 1 a 10)">Regar no <strong>' + escapeHtml(planta.medidor) + '</strong></div>';
  }
  function meterDetail(planta){
    if(planta.medidor != null){
      return '<p><strong>Medidor</strong> — rega quando o ponteiro chegar ao <strong>' + escapeHtml(planta.medidor) + '</strong> (ou abaixo), numa escala de 1 a 10. Confirma com o dedo.</p>';
    }
    if(planta.medidorNota) return '<p><strong>Medidor</strong> — ' + escapeHtml(planta.medidorNota) + '</p>';
    return '';
  }

  function buildListRow(planta){
    var row = document.createElement('div');
    row.className = 'list-row plant-item';
    row.dataset.id = planta.id;
    var initial = (planta.nomeComum || '?').trim().charAt(0).toUpperCase();
    var detailId = 'lr-detail-' + planta.id;

    row.innerHTML =
      '<div class="lr-main">' +
        '<button type="button" class="lr-toggle" aria-expanded="false" aria-controls="' + detailId + '">' +
          '<svg class="lr-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"></path></svg>' +
          '<span class="lr-thumb">' +
            '<img src="' + planta.foto + '" alt="" loading="lazy">' +
            '<span class="photo-fallback" hidden>' + initial + '</span>' +
          '</span>' +
          '<span class="lr-num">' + planta.id + '</span>' +
          '<span class="lr-name">' + escapeHtml(planta.nomeComum) + qtyBadge(planta) + '</span>' +
        '</button>' +
        '<div class="lr-side">' +
          '<div class="lr-gauges">' + gaugeLuz(planta.luz) + gaugeAgua(planta.agua) + '</div>' +
          meterBadge(planta) +
        '</div>' +
      '</div>' +
      '<div class="lr-detail" id="' + detailId + '" hidden>' +
        '<div class="lr-detail-inner">' +
          '<div class="lr-photo">' +
            '<img src="' + planta.foto + '" alt="' + escapeHtml(planta.nomeComum) + '" loading="lazy">' +
            '<div class="photo-fallback" hidden>' + initial + '</div>' +
          '</div>' +
          '<div class="lr-detail-text">' +
            '<p class="sci">' + escapeHtml(planta.nomeCientifico) + '</p>' +
            '<p><strong>Luz</strong> — ' + escapeHtml(planta.luzTexto) + '</p>' +
            '<p><strong>Água</strong> — ' + escapeHtml(planta.aguaTexto) + '</p>' +
            meterDetail(planta) +
            checkBlock(planta) +
            '<p class="tip">' + escapeHtml(planta.dica) + '</p>' +
            qtyNote(planta) +
          '</div>' +
        '</div>' +
      '</div>';

    [row.querySelector('.lr-thumb'), row.querySelector('.lr-photo')].forEach(function(box){
      var img = box.querySelector('img');
      var fallback = box.querySelector('.photo-fallback');
      img.addEventListener('error', function(){
        img.hidden = true;
        fallback.hidden = false;
      }, { once: true });
    });

    var toggleBtn = row.querySelector('.lr-toggle');
    var detail = row.querySelector('.lr-detail');
    toggleBtn.addEventListener('click', function(){
      var open = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      detail.hidden = open;
      row.classList.toggle('open', !open);
    });

    return row;
  }

  function sortedPlantas(list){
    list = list.slice();
    list.sort(function(a, b){
      var porNumero = parseInt(a.id, 10) - parseInt(b.id, 10);
      if(sortMode === 'numero') return porNumero;
      if(sortMode === 'luz') return (b.luz - a.luz) || porNumero;
      if(sortMode === 'agua') return (b.agua - a.agua) || porNumero;
      return a.nomeComum.localeCompare(b.nomeComum, 'pt');
    });
    return list;
  }

  function render(){
    var grid = document.getElementById('grid');
    var daAba = plantas.filter(function(p){ return localDe(p) === tab; });
    grid.innerHTML = '';

    var resumo = document.getElementById('resumo');
    var info = TABS[tab];
    if(daAba.length === 0){
      resumo.textContent = '';
      var vazio = document.createElement('p');
      vazio.className = 'empty';
      vazio.textContent = info.vazio || 'Ainda não há plantas aqui.';
      grid.appendChild(vazio);
    } else {
      resumo.textContent = daAba.length + (daAba.length === 1 ? ' planta ' : ' plantas ') + info.onde;
      sortedPlantas(daAba).forEach(function(pl){ grid.appendChild(buildListRow(pl)); });
    }
    document.getElementById('sortbar').hidden = daAba.length === 0;

    document.querySelectorAll('#tabs button').forEach(function(b){
      var n = plantas.filter(function(p){ return localDe(p) === b.dataset.tab; }).length;
      b.querySelector('.tab-n').textContent = n;
    });
  }

  function initTabs(){
    var saved = null;
    try { saved = localStorage.getItem(LS_TAB); } catch(e){}
    if(saved && TABS[saved]) tab = saved;
    var buttons = document.querySelectorAll('#tabs button');
    buttons.forEach(function(b){
      b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false');
      b.addEventListener('click', function(){
        tab = b.dataset.tab;
        try { localStorage.setItem(LS_TAB, tab); } catch(e){}
        buttons.forEach(function(x){ x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
        render();
      });
    });
  }

  function initSortbar(){
    var buttons = document.querySelectorAll('#sortbar button');
    var saved = null;
    try { saved = localStorage.getItem(LS_SORT); } catch(e){}
    // 'urgencia' era do tempo do tracker; já não existe
    sortMode = (saved === 'numero' || saved === 'nome' || saved === 'luz' || saved === 'agua') ? saved : 'nome';
    buttons.forEach(function(b){
      b.setAttribute('aria-pressed', b.dataset.sort === sortMode ? 'true' : 'false');
      b.addEventListener('click', function(){
        sortMode = b.dataset.sort;
        try { localStorage.setItem(LS_SORT, sortMode); } catch(e){}
        buttons.forEach(function(x){ x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        render();
      });
    });
  }

  function init(){
    initTabs();
    initSortbar();
    fetch('dados/plantas.json', { cache: 'no-store' })
      .then(function(r){ return r.json(); })
      .then(function(data){
        plantas = data.plantas;
        render();
      })
      .catch(function(){
        document.getElementById('grid').innerHTML = '<p class="empty">Não foi possível carregar os dados das plantas.</p>';
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
