(function(){
  'use strict';

  function qs(sel, root){ return (root||document).querySelector(sel); }
  function qsa(sel, root){ return [].slice.call((root||document).querySelectorAll(sel)); }

  // Enhance endpoint explorer UX
  function initExplorer(){
    var form = qs('form.explorer');
    if(!form) return;
    var select = qs('select[name="ep"]', form);
    var custom = qs('input[name="custom"]', form);

    function toggleCustom(){
      var show = select && select.value === 'custom';
      if(show){ custom.style.display = ''; custom.focus(); }
      else { custom.style.display = 'none'; }
    }

    if(select){
      select.addEventListener('change', function(){
        localStorage.setItem('devphp.explorer.ep', select.value);
        toggleCustom();
      });
      // Restore previous selection
      var saved = localStorage.getItem('devphp.explorer.ep');
      if(saved && qsa('option', select).some(function(o){return o.value===saved;})){
        select.value = saved;
      }
      toggleCustom();
    }

    if(custom){
      // Hide custom when not chosen
      if(select && select.value !== 'custom') custom.style.display = 'none';
      // Submit with Ctrl/Cmd+Enter
      custom.addEventListener('keydown', function(e){
        if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
          form.submit();
        }
      });
    }

    // Submit on Enter inside select
    if(select){
      select.addEventListener('keydown', function(e){
        if(e.key === 'Enter'){
          form.submit();
        }
      });
    }
  }

  // Add noopener to external links without rel
  function secureLinks(){
    qsa('a[target="_blank"]').forEach(function(a){
      var rel = (a.getAttribute('rel')||'').toLowerCase();
      if(rel.indexOf('noopener') === -1){
        a.setAttribute('rel', (rel + ' noopener').trim());
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    initExplorer();
    secureLinks();
  });
})();
