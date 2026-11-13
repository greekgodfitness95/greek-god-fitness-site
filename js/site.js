(function(){
  // Fill every link from config.js
  var L = window.GGF_LINKS || {};
  document.querySelectorAll('[data-link]').forEach(function(a){
    var v = L[a.getAttribute('data-link')];
    if (v === '') { a.remove(); return; }   // empty = hide this link
    if (v && v !== '#') {
      a.setAttribute('href', v);
      if (/^https?:/i.test(v)) { a.setAttribute('target','_blank'); a.setAttribute('rel','noopener'); }
    } else {
      a.addEventListener('click', function(e){ e.preventDefault(); });
    }
  });

  // Mobile menu + Services dropdown
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  if (burger) burger.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  document.querySelectorAll('.has-sub > button').forEach(function(b){
    b.addEventListener('click', function(){ b.parentNode.classList.toggle('open'); });
  });
  document.querySelectorAll('.nav a[href^="/#"], .nav a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(){ nav.classList.remove('open'); });
  });
})();
