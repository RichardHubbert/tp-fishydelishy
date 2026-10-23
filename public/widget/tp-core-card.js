/**
 * TP Core booking card
 *
 * Paste this into the directory or any other site:
 *
 * <script src="https://tablepilot.co.uk/your-path/widget/tp-core-card.js"></script>
 * <tp-core-card restaurant-id="RESTAURANT_ID"></tp-core-card>
 */
(function () {
  'use strict';

  function widgetBaseUrl() {
    if (window.TP_CORE_WIDGET_URL) {
      return String(window.TP_CORE_WIDGET_URL).replace(/\/+$/, '');
    }
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || '';
      if (src.indexOf('tp-core-card.js') !== -1) {
        return src.replace(/\/widget\/tp-core-card\.js(?:\?.*)?$/, '').replace(/\/+$/, '');
      }
    }
    return window.location.origin;
  }

  var BASE_URL = widgetBaseUrl();
  var STYLE_ID = 'tp-core-card-styles';

  function widgetOrigin() {
    try {
      return new URL(BASE_URL, window.location.href).origin;
    } catch (error) {
      return '';
    }
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      'tp-core-card{display:block;width:100%;max-width:420px;}',
      'tp-core-card .tp-core-card-frame{width:100%;border:0;display:block;background:transparent;overflow:hidden;}',
      '.tp-core-book-overlay{position:fixed;inset:0;z-index:1000000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(0,0,0,.5);}',
      '.tp-core-book-frame{width:100%;max-width:720px;height:min(90vh,820px);border:0;border-radius:12px;background:#fff;}',
      '.tp-core-book-close{position:absolute;top:12px;right:12px;z-index:1000001;width:44px;height:44px;border:0;border-radius:50%;background:#fff;color:#111827;font-size:24px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.15);}',
      '@media (max-width:640px){.tp-core-book-overlay{padding:0;align-items:stretch;}.tp-core-book-frame{max-width:none;height:100%;border-radius:0;}}'
    ].join('');
    document.head.appendChild(style);
  }

  class TpCoreCard extends HTMLElement {
    constructor() {
      super();
      this.frame = null;
      this.overlay = null;
      this.onMessage = this.handleMessage.bind(this);
    }

    connectedCallback() {
      ensureStyles();
      this.render();
      window.addEventListener('message', this.onMessage);
    }

    disconnectedCallback() {
      window.removeEventListener('message', this.onMessage);
      this.closeBooking();
    }

    static get observedAttributes() {
      return ['restaurant-id'];
    }

    attributeChangedCallback() {
      if (this.isConnected) this.render();
    }

    render() {
      this.replaceChildren();
      var restaurantId = this.getAttribute('restaurant-id');
      if (!restaurantId) {
        var error = document.createElement('p');
        error.textContent = 'Add a restaurant-id to this card.';
        error.style.cssText = 'color:#991b1b;margin:0;font-family:sans-serif;';
        this.appendChild(error);
        return;
      }

      this.frame = document.createElement('iframe');
      this.frame.className = 'tp-core-card-frame';
      this.frame.title = 'Make a booking';
      this.frame.height = '460';
      this.frame.src = BASE_URL + '/embed?restaurant=' + encodeURIComponent(restaurantId) + '&widget=1';
      this.appendChild(this.frame);
    }

    handleMessage(event) {
      if (event.origin !== widgetOrigin()) return;
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'TP_CORE_CARD_HEIGHT' && this.frame && event.source === this.frame.contentWindow) {
        var height = Number(event.data.height);
        if (height > 0) this.frame.height = String(height);
        return;
      }

      if (event.data.type === 'TP_CORE_OPEN_BOOKING') {
        this.openBooking(event.data);
        return;
      }

      if (event.data.type === 'TP_CORE_CLOSE') {
        this.closeBooking();
      }
    }

    openBooking(detail) {
      var restaurantId = detail.restaurantId || this.getAttribute('restaurant-id');
      if (!restaurantId) return;
      this.closeBooking();

      var params = new URLSearchParams({
        restaurant: restaurantId,
        date: detail.date || '',
        time: detail.time || '',
        party: String(detail.partySize || ''),
        step: String(detail.step || 1)
      });

      this.overlay = document.createElement('div');
      this.overlay.className = 'tp-core-book-overlay';
      this.overlay.setAttribute('role', 'dialog');
      this.overlay.setAttribute('aria-modal', 'true');
      this.overlay.setAttribute('aria-label', 'Book a table');

      var close = document.createElement('button');
      close.type = 'button';
      close.className = 'tp-core-book-close';
      close.setAttribute('aria-label', 'Close booking');
      close.textContent = '×';
      close.addEventListener('click', this.closeBooking.bind(this));

      var frame = document.createElement('iframe');
      frame.className = 'tp-core-book-frame';
      frame.title = 'Book a table';
      frame.src = BASE_URL + '/book?' + params.toString();

      this.overlay.appendChild(close);
      this.overlay.appendChild(frame);
      this.overlay.addEventListener('click', function (clickEvent) {
        if (clickEvent.target === this.overlay) this.closeBooking();
      }.bind(this));
      document.body.appendChild(this.overlay);
      document.body.style.overflow = 'hidden';
      close.focus();
    }

    closeBooking() {
      if (this.overlay && this.overlay.parentNode) {
        this.overlay.parentNode.removeChild(this.overlay);
      }
      this.overlay = null;
      document.body.style.overflow = '';
    }
  }

  if (!customElements.get('tp-core-card')) {
    customElements.define('tp-core-card', TpCoreCard);
  }
})();
