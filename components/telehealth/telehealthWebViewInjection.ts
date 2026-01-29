export const generateInjectionScript = () => `
(function() {
  let lastActivityTime = Date.now();
  let formStateCache = {};
  let isFormPage = false;
  let saveTimer = null;
  let scrollTimer = null;

  // Viewport optimization for mobile
  function setupViewport() {
    // Remove any existing viewport meta tags
    const existingMetas = document.querySelectorAll('meta[name="viewport"]');
    existingMetas.forEach(meta => meta.remove());

    // Add our optimized viewport
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.insertBefore(meta, document.head.firstChild);

    // Force content to fit width
    const style = document.createElement('style');
    style.id = 'viewport-fix';
    style.textContent = \`
      html {
        overflow-x: hidden !important;
      }
      body {
        overflow-x: hidden !important;
      }
      img, iframe, video {
        max-width: 100% !important;
        height: auto !important;
      }
    \`;
    document.head.appendChild(style);

    // Prevent zoom on input focus
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });

    // Disable double-tap zoom
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }

  // Detect if current page has forms
  function detectFormPage() {
    const forms = document.querySelectorAll('form');
    const inputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    isFormPage = forms.length > 0 || inputs.length > 3;
    return isFormPage;
  }

  // Extract all form data from page
  function extractFormState() {
    const formData = {};
    let hasData = false;

    // Get all inputs
    document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])').forEach((input, index) => {
      const key = input.name || input.id || 'input_' + index;

      if (input.type === 'checkbox' || input.type === 'radio') {
        formData[key] = input.checked;
        if (input.checked) hasData = true;
      } else {
        formData[key] = input.value || '';
        if (input.value) hasData = true;
      }
    });

    // Get all textareas
    document.querySelectorAll('textarea').forEach((textarea, index) => {
      const key = textarea.name || textarea.id || 'textarea_' + index;
      formData[key] = textarea.value || '';
      if (textarea.value) hasData = true;
    });

    // Get all selects
    document.querySelectorAll('select').forEach((select, index) => {
      const key = select.name || select.id || 'select_' + index;
      formData[key] = select.value || '';
      if (select.value) hasData = true;
    });

    return { formData, hasData };
  }

  // Restore form state from saved data
  function restoreFormState(savedData) {
    try {
      Object.keys(savedData).forEach(key => {
        const elements = document.querySelectorAll('[name="' + key + '"], [id="' + key + '"]');

        elements.forEach(element => {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = savedData[key];
          } else if (element.tagName === 'SELECT') {
            element.value = savedData[key];
          } else if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            element.value = savedData[key];
          }

          // Trigger change event for any listeners
          const event = new Event('change', { bubbles: true });
          element.dispatchEvent(event);
        });
      });

      // Show visual feedback
      showToast('Form data restored');
    } catch (error) {
      console.error('Error restoring form state:', error);
    }
  }

  // Send message to React Native
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

  // Debounced form state save
  function scheduleFormStateSave() {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
      const { formData, hasData } = extractFormState();

      if (hasData && JSON.stringify(formData) !== JSON.stringify(formStateCache)) {
        formStateCache = formData;

        sendMessage('formStateChange', {
          url: window.location.href,
          formData: formData,
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          }
        });
      }
    }, 2000); // Debounce 2 seconds
  }

  // Scroll to input when focused (prevent keyboard hiding input)
  function scrollToInput(element) {
    setTimeout(() => {
      const rect = element.getBoundingClientRect();
      const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;

      if (!isVisible) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300); // Wait for keyboard animation
  }

  // Monitor for freezes (no touch/input for 10 seconds on form page with actual interaction)
  let hasHadActivity = false;
  let freezeReportedAt = 0;

  function monitorFreeze() {
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      const timeSinceLastReport = Date.now() - freezeReportedAt;

      // Only report freeze if:
      // 1. User has interacted with the page at least once
      // 2. No activity for 10 seconds
      // 3. Haven't reported a freeze in the last 10 seconds
      if (hasHadActivity && isFormPage && timeSinceLastActivity > 10000 && timeSinceLastReport > 10000) {
        freezeReportedAt = Date.now();
        sendMessage('freeze', {
          url: window.location.href,
          lastActivity: lastActivityTime
        });
      }
    }, 5000);
  }

  // Visual toast for user feedback
  function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = \`
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 999999;
      animation: fadeInOut 2s ease-in-out;
    \`;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Intercept console errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    sendMessage('consoleLog', {
      level: 'error',
      message: args.join(' ')
    });
    originalConsoleError.apply(console, args);
  };

  // Setup event listeners
  function setupListeners() {
    // Track user activity
    ['touchstart', 'touchmove', 'input', 'change', 'click'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        lastActivityTime = Date.now();
        hasHadActivity = true;
      }, { passive: true });
    });

    // Form input change detection
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea, select')) {
        scheduleFormStateSave();
      }
    }, true);

    document.addEventListener('change', (e) => {
      if (e.target.matches('input, textarea, select')) {
        scheduleFormStateSave();
      }
    }, true);

    // Focus handling for inputs
    document.addEventListener('focus', (e) => {
      if (e.target.matches('input, textarea, select')) {
        scrollToInput(e.target);
        lastActivityTime = Date.now();
      }
    }, true);

    // Detect form submission
    document.addEventListener('submit', (e) => {
      sendMessage('formSubmit', {
        url: window.location.href,
        formAction: e.target.action
      });
    }, true);

    // Track scroll position
    window.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        sendMessage('scroll', {
          x: window.scrollX,
          y: window.scrollY
        });
      }, 500);
    }, { passive: true });
  }

  // CSS for animations
  const style = document.createElement('style');
  style.textContent = \`
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      10% { opacity: 1; transform: translateX(-50%) translateY(0); }
      90% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }

    input, textarea, select {
      -webkit-tap-highlight-color: rgba(0,0,0,0);
    }

    * {
      -webkit-user-select: text;
      user-select: text;
    }
  \`;
  document.head.appendChild(style);

  // Expose restore function to React Native
  window.restoreTelehealthFormState = function(savedData) {
    restoreFormState(savedData);
  };

  // Initialize
  function init() {
    setupViewport();
    detectFormPage();
    setupListeners();
    monitorFreeze();

    // Send initial page info
    sendMessage('formStateChange', {
      url: window.location.href,
      isFormPage: isFormPage,
      scrollPosition: { x: 0, y: 0 }
    });
  }

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-check for forms on navigation/dynamic content
  const observer = new MutationObserver(() => {
    const wasFormPage = isFormPage;
    detectFormPage();

    if (!wasFormPage && isFormPage) {
      scheduleFormStateSave();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

true; // Required for iOS
`;
