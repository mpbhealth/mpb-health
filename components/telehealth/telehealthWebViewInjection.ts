/**
 * In-page bridge for the telehealth WebView (forms, activity, optional freeze recovery).
 *
 * Intentionally does NOT replace the partner portal viewport or inject aggressive global CSS —
 * that pattern breaks SSO / SPA layouts (see WebViewContainer `portal` preset). Viewport + safe
 * area are applied separately via `buildWebViewInjectionScript('portal', …)` in TelehealthWebView.
 */
export function buildTelehealthBridgeScript(): string {
  return `
(function() {
  if (window.__mpbTelehealthBridgeV1) {
    return;
  }
  window.__mpbTelehealthBridgeV1 = true;

  var lastActivityTime = Date.now();
  var formStateCache = {};
  var isFormPage = false;
  var saveTimer = null;
  var scrollTimer = null;
  var mutationThrottleTimer = null;
  var FREEZE_IDLE_MS = 20000;
  var FREEZE_CHECK_MS = 8000;

  function detectFormPage() {
    var forms = document.querySelectorAll('form');
    var inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    isFormPage = forms.length > 0 || inputs.length > 3;
    return isFormPage;
  }

  function extractFormState() {
    var formData = {};
    var hasData = false;

    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').forEach(function(input, index) {
      var key = input.name || input.id || 'input_' + index;
      if (input.type === 'checkbox' || input.type === 'radio') {
        formData[key] = input.checked;
        if (input.checked) hasData = true;
      } else {
        formData[key] = input.value || '';
        if (input.value) hasData = true;
      }
    });

    document.querySelectorAll('textarea').forEach(function(textarea, index) {
      var key = textarea.name || textarea.id || 'textarea_' + index;
      formData[key] = textarea.value || '';
      if (textarea.value) hasData = true;
    });

    document.querySelectorAll('select').forEach(function(select, index) {
      var key = select.name || select.id || 'select_' + index;
      formData[key] = select.value || '';
      if (select.value) hasData = true;
    });

    return { formData: formData, hasData: hasData };
  }

  function restoreFormState(savedData) {
    try {
      Object.keys(savedData).forEach(function(key) {
        var elements = document.querySelectorAll('[name="' + key + '"], [id="' + key + '"]');
        elements.forEach(function(element) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = savedData[key];
          } else if (element.tagName === 'SELECT') {
            element.value = savedData[key];
          } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = savedData[key];
          }
          element.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }

  function sendMessage(type, data) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        data: data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  function scheduleFormStateSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function() {
      var extracted = extractFormState();
      var formData = extracted.formData;
      var hasData = extracted.hasData;
      if (hasData && JSON.stringify(formData) !== JSON.stringify(formStateCache)) {
        formStateCache = formData;
        sendMessage('formStateChange', {
          url: window.location.href,
          formData: formData,
          hasData: true,
          scrollPosition: { x: window.scrollX, y: window.scrollY }
        });
      }
    }, 2000);
  }

  function scrollToInput(element) {
    setTimeout(function() {
      var rect = element.getBoundingClientRect();
      var visible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!visible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }

  var hasHadActivity = false;
  var freezeReportedAt = 0;

  function monitorFreeze() {
    setInterval(function() {
      var timeSinceLastActivity = Date.now() - lastActivityTime;
      var timeSinceLastReport = Date.now() - freezeReportedAt;
      if (
        hasHadActivity &&
        isFormPage &&
        timeSinceLastActivity > FREEZE_IDLE_MS &&
        timeSinceLastReport > FREEZE_IDLE_MS
      ) {
        freezeReportedAt = Date.now();
        sendMessage('freeze', {
          url: window.location.href,
          lastActivity: lastActivityTime
        });
      }
    }, FREEZE_CHECK_MS);
  }

  function setupListeners() {
    ['touchstart', 'touchmove', 'input', 'change', 'click'].forEach(function(eventType) {
      document.addEventListener(eventType, function() {
        lastActivityTime = Date.now();
        hasHadActivity = true;
      }, { passive: true });
    });

    document.addEventListener('input', function(e) {
      if (e.target.matches && e.target.matches('input, textarea, select')) {
        scheduleFormStateSave();
      }
    }, true);

    document.addEventListener('change', function(e) {
      if (e.target.matches && e.target.matches('input, textarea, select')) {
        scheduleFormStateSave();
      }
    }, true);

    document.addEventListener('focus', function(e) {
      if (e.target.matches && e.target.matches('input, textarea, select')) {
        scrollToInput(e.target);
        lastActivityTime = Date.now();
      }
    }, true);

    document.addEventListener('submit', function(e) {
      sendMessage('formSubmit', {
        url: window.location.href,
        formAction: e.target.action
      });
    }, true);

    window.addEventListener('scroll', function() {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function() {
        sendMessage('scroll', {
          x: window.scrollX,
          y: window.scrollY
        });
      }, 500);
    }, { passive: true });
  }

  function scheduleMutationCheck() {
    if (mutationThrottleTimer) return;
    mutationThrottleTimer = setTimeout(function() {
      mutationThrottleTimer = null;
      var wasFormPage = isFormPage;
      detectFormPage();
      if (!wasFormPage && isFormPage) {
        scheduleFormStateSave();
      }
    }, 400);
  }

  window.restoreTelehealthFormState = function(savedData) {
    restoreFormState(savedData);
  };

  function init() {
    try {
      if (!document.getElementById('telehealth-bridge-base') && document.head) {
        var lightStyle = document.createElement('style');
        lightStyle.id = 'telehealth-bridge-base';
        lightStyle.textContent =
          'input, textarea, select { -webkit-tap-highlight-color: rgba(0,0,0,0); }';
        document.head.appendChild(lightStyle);
      }
    } catch (e) {}

    detectFormPage();
    setupListeners();
    monitorFreeze();

    sendMessage('formStateChange', {
      url: window.location.href,
      isFormPage: isFormPage,
      hasData: false,
      scrollPosition: { x: 0, y: 0 }
    });

    if (document.body) {
      var observer = new MutationObserver(function() {
        scheduleMutationCheck();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

true;
`;
}

/** @deprecated Use buildTelehealthBridgeScript with portal injection from TelehealthWebView */
export function generateInjectionScript(): string {
  return buildTelehealthBridgeScript();
}
