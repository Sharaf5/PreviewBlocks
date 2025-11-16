// preview.js - injected into Markdown preview webview
(function () {
  if (window.__previewblocks_loaded) return;
  window.__previewblocks_loaded = true;

  const MARKER = 'data-previewblocks-processed';
  const HEADER_CLASS = 'previewblocks-header';
  const WRAPPER_CLASS = 'previewblocks-wrapper';
  const STICKY_CLASS = 'previewblocks-sticky';

  // Controlled ONLY by messages from VS Code extension
  let stickyEnabled = true;

  // Safe text retrieval
  const safeText = (node) =>
    (node?.textContent || '').replace(/\u200B/g, '').trim();

  // Copy icon (uses currentColor so it adapts to theme)
  // const COPY_SVG = `
  // <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
  //   <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1z" fill="currentColor" opacity="0.9"/>
  //   <path d="M20 5H8a2 2 0 0 0-2 2v14h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h12v14z" fill="currentColor"/>
  // </svg>`;
  const COPY_SVG = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 3H14.6C16.8402 3 17.9603 3 18.816 3.43597C19.5686 3.81947 20.1805 4.43139 20.564 5.18404C21 6.03969 21 7.15979 21 9.4V16.5M6.2 21H14.3C15.4201 21 15.9802 21 16.408 20.782C16.7843 20.5903 17.0903 20.2843 17.282 19.908C17.5 19.4802 17.5 18.9201 17.5 17.8V9.7C17.5 8.57989 17.5 8.01984 17.282 7.59202C17.0903 7.21569 16.7843 6.90973 16.408 6.71799C15.9802 6.5 15.4201 6.5 14.3 6.5H6.2C5.0799 6.5 4.51984 6.5 4.09202 6.71799C3.71569 6.90973 3.40973 7.21569 3.21799 7.59202C3 8.01984 3 8.57989 3 9.7V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.0799 21 6.2 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;



  function createHeader(lang) {
    const header = document.createElement('div');
    header.className = HEADER_CLASS;

    const left = document.createElement('div');
    left.className = 'pb-left';
    const langSpan = document.createElement('div');
    langSpan.className = 'pb-lang';
    langSpan.textContent = lang || 'plaintext';
    left.appendChild(langSpan);

    const actions = document.createElement('div');
    actions.className = 'pb-actions';
    const copyBtn = document.createElement('button');
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.className = 'previewblocks-copy-btn';
    copyBtn.innerHTML = COPY_SVG;
    actions.appendChild(copyBtn);

    header.appendChild(left);
    header.appendChild(actions);

    return { header, copyBtn };
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch {
        return false;
      }
    }
  }

  function isCodeElement(el) {
    return el?.tagName === 'CODE' && el.parentElement?.tagName === 'PRE';
  }

  function getLanguageFromCodeElement(codeEl) {
    const cls = (codeEl.className || '').split(/\s+/);
    for (const c of cls) {
      const m = c.match(/(?:language|lang)-(.+)/i);
      if (m) return m[1];
    }
    return 'plaintext';
  }

  function updateStickyForAll() {
    const headers = document.querySelectorAll('.' + HEADER_CLASS);
    headers.forEach((h) =>
      stickyEnabled
        ? h.classList.add(STICKY_CLASS)
        : h.classList.remove(STICKY_CLASS)
    );
    console.log("[PreviewBlocks] updateStickyForAll stiky : ", stickyEnabled)
  }

  function attachHeader(codeEl) {
    if (!isCodeElement(codeEl)) return;
    const pre = codeEl.parentElement;
    if (!pre || pre.hasAttribute(MARKER)) return;

    const wrapper = document.createElement('div');
    wrapper.className = WRAPPER_CLASS;
    pre.parentElement.replaceChild(wrapper, pre);
    wrapper.appendChild(pre);

    const lang = getLanguageFromCodeElement(codeEl);
    const { header, copyBtn } = createHeader(lang);
    wrapper.insertBefore(header, pre);

    updateStickyForAll(); // ensure correct sticky status

    pre.setAttribute(MARKER, '1');

    copyBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const ok = await copyToClipboard(safeText(codeEl));
      if (ok) {
        const prev = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓';
        setTimeout(() => (copyBtn.innerHTML = prev), 800);
      }
    });
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        attachHeader(e.target);
        io.unobserve(e.target);
      }
    }
  }, { rootMargin: '200px' });

  function discover() {
    const codes = document.querySelectorAll('pre > code');
    codes.forEach((code) => {
      if (!code.hasAttribute('data-pb-observed')) {
        code.setAttribute('data-pb-observed', '1');
        io.observe(code);
      }
    });
  }

  const mo = new MutationObserver(() => discover());
  mo.observe(document.documentElement, { childList: true, subtree: true });


  // window.addEventListener('message', (ev) => {
  //   const msg = ev.data || {};
  //   console.log("[PreviewBlocks] msg : ", msg)
  //   // accept either key while we migrate, but prefer the plural form
  //   const isConfig = msg.type === 'previewblocks:config:sticky';
  //   if (isConfig) {
  //     stickyEnabled = !!msg.sticky;
  //     updateStickyForAll();
  //   }
  // });

  // const configKey = 'previewblocks.stickyHeader';
  // vscode.workspace.onDidChangeConfiguration(event => {
  //   console.log(event);
  //   if (event.affectsConfiguration(configKey)) {
  //     const newValue = vscode.workspace.getConfiguration().get<boolean>(configKey);
  //     console.log('[PreviewBlocks] stickyHeader changed to:', newValue);
  //     stickyEnabled = !!newValue;
  //     updateStickyForAll();
  //   }
  // });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', discover);
  } else {
    discover();
  }
})();
