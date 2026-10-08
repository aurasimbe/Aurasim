/* AURASIM — shared storefront behaviour (both theme directions use this file). */
(function () {
  'use strict';

  function once(el) {
    if (el.dataset.auraBound) return false;
    el.dataset.auraBound = '1';
    return true;
  }

  /* ---------- Fade-in on scroll ---------- */
  function initReveal(root) {
    var els = (root || document).querySelectorAll('[data-reveal]:not(.is-in)');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Cart count ---------- */
  function setCartCount(count) {
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.closest('[data-cart-link]') && el.closest('[data-cart-link]').classList.toggle('has-items', count > 0);
    });
  }

  function refreshCartCount() {
    return fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { setCartCount(cart.item_count); return cart; })
      .catch(function () {});
  }

  /* ---------- Toast ---------- */
  function toast(html) {
    var el = document.querySelector('[data-aura-toast]');
    if (!el) {
      el = document.createElement('div');
      el.className = 'aura-toast';
      el.setAttribute('data-aura-toast', '');
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.innerHTML = html;
    el.classList.add('is-visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('is-visible'); }, 4200);
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    document.querySelectorAll('[data-menu-toggle]').forEach(function (btn) {
      if (!once(btn)) return;
      var target = document.getElementById(btn.getAttribute('aria-controls'));
      if (!target) return;
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        target.classList.toggle('is-open', !open);
        document.documentElement.classList.toggle('aura-menu-open', !open);
      });
      target.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          btn.setAttribute('aria-expanded', 'false');
          target.classList.remove('is-open');
          document.documentElement.classList.remove('aura-menu-open');
        });
      });
    });
  }

  /* ---------- Newsletter forms (native Shopify customer form) ---------- */
  function initNewsletter() {
    document.querySelectorAll('[data-aura-newsletter]').forEach(function (form) {
      if (!once(form)) return;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var success = form.parentElement.querySelector('[data-newsletter-success]');
        fetch(form.action, { method: 'POST', body: new FormData(form) }).catch(function () {});
        form.reset();
        form.hidden = true;
        if (success) success.hidden = false;
      });
    });
  }

  /* ---------- Aura switchers (home: swap panel by color) ---------- */
  function initSwitchers() {
    document.querySelectorAll('[data-aura-switcher]').forEach(function (wrap) {
      if (!once(wrap)) return;
      var buttons = wrap.querySelectorAll('[data-aura-switch]');
      var panels = wrap.querySelectorAll('[data-aura-panel]');
      function activate(color) {
        buttons.forEach(function (b) {
          var on = b.getAttribute('data-aura-switch') === color;
          b.classList.toggle('is-active', on);
          if (b.tagName === 'BUTTON') b.setAttribute('aria-pressed', String(on));
        });
        panels.forEach(function (p) {
          p.classList.toggle('is-active', p.getAttribute('data-aura-panel') === color);
        });
        var hex = wrap.querySelector('[data-aura-switch="' + color + '"]');
        if (hex) wrap.style.setProperty('--aura', hex.getAttribute('data-hex'));
      }
      buttons.forEach(function (b) {
        b.addEventListener('click', function (e) {
          // Touch screens: first tap opens a panel, second tap follows its link
          if (b.tagName === 'A' && !b.classList.contains('is-active') && !window.matchMedia('(hover: hover)').matches) {
            e.preventDefault();
          }
          activate(b.getAttribute('data-aura-switch'));
        });
        b.addEventListener('mouseenter', function () {
          if (window.matchMedia('(hover: hover)').matches) activate(b.getAttribute('data-aura-switch'));
        });
      });
    });
  }

  /* ---------- Collection colour filter ---------- */
  function initFilters() {
    document.querySelectorAll('[data-aura-filter]').forEach(function (wrap) {
      if (!once(wrap)) return;
      var buttons = wrap.querySelectorAll('[data-filter]');
      var items = wrap.querySelectorAll('[data-filter-item]');
      buttons.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-filter');
          buttons.forEach(function (x) {
            x.classList.toggle('is-active', x === b);
            x.setAttribute('aria-pressed', String(x === b));
          });
          items.forEach(function (it) {
            it.hidden = !(f === 'all' || it.getAttribute('data-filter-item') === f);
          });
        });
      });
    });
  }

  /* ---------- Product form ---------- */
  function initProducts() {
    document.querySelectorAll('[data-aura-product]').forEach(function (root) {
      if (!once(root)) return;
      var dataEl = root.querySelector('[data-product-json]');
      if (!dataEl) return;
      var data = JSON.parse(dataEl.textContent);
      var variants = data.variants;
      var colorIndex = data.colorIndex; // 0-based option index of Color, -1 if none
      var sizeIndex = data.sizeIndex;
      var idInput = root.querySelector('[data-variant-id]');
      var priceEl = root.querySelector('[data-price]');
      var addBtn = root.querySelector('[data-add]');
      var addLabel = root.querySelector('[data-add-label]');
      var colorLabel = root.querySelector('[data-color-label]');
      var form = root.querySelector('[data-product-form]');
      var state = { color: null, size: null };

      var current = variants.find(function (v) { return String(v.id) === String(idInput.value); }) || variants[0];
      if (colorIndex > -1) state.color = current.options[colorIndex];
      if (sizeIndex > -1) state.size = current.options[sizeIndex];

      function match() {
        return variants.find(function (v) {
          return (colorIndex < 0 || v.options[colorIndex] === state.color) &&
                 (sizeIndex < 0 || v.options[sizeIndex] === state.size);
        });
      }

      function sizeAvailable(size) {
        return variants.some(function (v) {
          return v.available && (colorIndex < 0 || v.options[colorIndex] === state.color) && v.options[sizeIndex] === size;
        });
      }

      function render(pushUrl) {
        var v = match();
        root.querySelectorAll('[data-option-color]').forEach(function (b) {
          var on = b.getAttribute('data-option-color') === state.color;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-checked', String(on));
        });
        root.querySelectorAll('[data-option-size]').forEach(function (b) {
          var s = b.getAttribute('data-option-size');
          var on = s === state.size;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-checked', String(on));
          b.classList.toggle('is-soldout', !sizeAvailable(s));
        });
        root.querySelectorAll('[data-gallery-color]').forEach(function (g) {
          g.classList.toggle('is-active', g.getAttribute('data-gallery-color') === state.color);
        });
        var hexBtn = root.querySelector('[data-option-color="' + state.color + '"]');
        if (hexBtn) {
          root.style.setProperty('--aura', hexBtn.getAttribute('data-hex'));
          document.documentElement.style.setProperty('--aura-page', hexBtn.getAttribute('data-hex'));
        }
        if (colorLabel && state.color) colorLabel.textContent = state.color;

        if (!v) {
          addBtn.disabled = true;
          addLabel.textContent = data.strings.unavailable;
          return;
        }
        idInput.value = v.id;
        if (priceEl) priceEl.textContent = v.price;
        addBtn.disabled = !v.available;
        addLabel.textContent = v.available ? data.strings.add : data.strings.soldout;
        if (pushUrl && window.history && history.replaceState) {
          var url = new URL(window.location.href);
          url.searchParams.set('variant', v.id);
          history.replaceState({}, '', url.toString());
        }
      }

      root.querySelectorAll('[data-option-color]').forEach(function (b) {
        b.addEventListener('click', function () {
          state.color = b.getAttribute('data-option-color');
          render(true);
          var gallery = root.querySelector('[data-gallery-color="' + state.color + '"]');
          if (gallery && gallery.scrollTo) gallery.scrollTo({ left: 0 });
        });
      });
      root.querySelectorAll('[data-option-size]').forEach(function (b) {
        b.addEventListener('click', function () {
          state.size = b.getAttribute('data-option-size');
          render(true);
        });
      });

      // Thumbnails (optional, Spectrum): swap main image inside the active gallery
      root.querySelectorAll('[data-thumb]').forEach(function (t) {
        t.addEventListener('click', function () {
          var g = t.closest('[data-gallery-color]');
          if (!g) return;
          var main = g.querySelector('[data-main-image], .s-viewer__main img');
          var src = t.getAttribute('data-full');
          var srcset = t.getAttribute('data-srcset');
          if (main && src) {
            main.src = src;
            if (srcset) main.srcset = srcset;
            main.alt = t.getAttribute('data-alt') || main.alt;
          }
          g.querySelectorAll('[data-thumb]').forEach(function (x) { x.classList.toggle('is-active', x === t); });
        });
      });

      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (addBtn.disabled) return;
          addBtn.disabled = true;
          addBtn.classList.add('is-loading');
          fetch((window.Shopify && Shopify.routes ? Shopify.routes.root : '/') + 'cart/add.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ items: [{ id: Number(idInput.value), quantity: 1 }] })
          })
            .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
            .then(function (res) {
              if (!res.ok) throw new Error(res.body.description || res.body.message || data.strings.error);
              return refreshCartCount().then(function () {
                toast('<span>' + data.strings.added.replace('%s', (state.color ? state.color + ' / ' : '') + (state.size || '')) + '</span><a href="' + data.cartUrl + '">' + data.strings.viewCart + ' →</a>');
              });
            })
            .catch(function (err) { toast('<span>' + err.message + '</span>'); })
            .finally(function () {
              addBtn.classList.remove('is-loading');
              render(false);
            });
        });
      }

      render(false);
    });
  }

  /* ---------- Cart page: auto-submit on quantity change ---------- */
  function initCart() {
    document.querySelectorAll('[data-aura-cart]').forEach(function (form) {
      if (!once(form)) return;
      form.querySelectorAll('[data-qty-step]').forEach(function (b) {
        b.addEventListener('click', function () {
          var input = form.querySelector('#' + b.getAttribute('aria-controls'));
          if (!input) return;
          var n = Math.max(0, (parseInt(input.value, 10) || 0) + parseInt(b.getAttribute('data-qty-step'), 10));
          input.value = n;
          form.submit();
        });
      });
      form.querySelectorAll('input[name="updates[]"]').forEach(function (input) {
        input.addEventListener('change', function () { form.submit(); });
      });
    });
  }

  function init() {
    initReveal();
    initMenu();
    initNewsletter();
    initSwitchers();
    initFilters();
    initProducts();
    initCart();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  document.addEventListener('shopify:section:load', init);
})();
