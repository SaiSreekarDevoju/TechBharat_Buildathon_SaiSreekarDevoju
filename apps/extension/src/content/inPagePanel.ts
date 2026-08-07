export function toggleInPagePanel(): void {
  const HOST_ID = 'lumen-inpage-host';
  const existing = document.getElementById(HOST_ID);

  if (existing) {
    existing.style.display = existing.style.display === 'none' ? 'block' : 'none';
    return;
  }

  const host = document.createElement('div');
  host.id = HOST_ID;
  Object.assign(host.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    width: '420px',
    height: '640px',
    zIndex: '2147483646',
    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
    borderRadius: '16px',
    overflow: 'hidden',
  });

  const shadow = host.attachShadow({ mode: 'open' });

  const container = document.createElement('div');
  container.className = 'lumen-container';
  container.innerHTML = `
    <style>
      .lumen-container {
        width: 100%;
        height: 100%;
        background: #0A0A0A;
        color: #FAFAF5;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        border: 1px solid #272A2D;
        box-sizing: border-box;
      }
      .lumen-header {
        height: 48px;
        background: #111111;
        border-bottom: 1px solid #272A2D;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        cursor: move;
        user-select: none;
      }
      .lumen-title {
        color: #E8FF3B;
        font-weight: 700;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .lumen-controls {
        display: flex;
        gap: 8px;
      }
      .lumen-btn {
        background: transparent;
        border: none;
        color: #929292;
        cursor: pointer;
        font-size: 16px;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .lumen-btn:hover {
        color: #E8FF3B;
        background: #181818;
      }
      .lumen-iframe {
        flex: 1;
        width: 100%;
        border: none;
        background: #0A0A0A;
      }
    </style>
    <div class="lumen-header" id="lumen-drag-handle">
      <span class="lumen-title">
        <span>⚡</span> Lumen Side Panel
      </span>
      <div class="lumen-controls">
        <button class="lumen-btn" id="lumen-min-btn" title="Minimize">—</button>
        <button class="lumen-btn" id="lumen-close-btn" title="Close">✕</button>
      </div>
    </div>
    <iframe class="lumen-iframe" src="${chrome.runtime.getURL('src/sidepanel/index.html')}"></iframe>
  `;

  shadow.appendChild(container);

  // Dragging logic
  const handle = shadow.getElementById('lumen-drag-handle');
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  if (handle) {
    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - host.getBoundingClientRect().left;
      offsetY = e.clientY - host.getBoundingClientRect().top;
    });
  }

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    host.style.left = `${e.clientX - offsetX}px`;
    host.style.top = `${e.clientY - offsetY}px`;
    host.style.right = 'auto';
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  shadow.getElementById('lumen-close-btn')?.addEventListener('click', () => {
    host.remove();
  });

  shadow.getElementById('lumen-min-btn')?.addEventListener('click', () => {
    const iframe = shadow.querySelector('.lumen-iframe') as HTMLElement;
    if (iframe) {
      if (iframe.style.display === 'none') {
        iframe.style.display = 'block';
        host.style.height = '640px';
      } else {
        iframe.style.display = 'none';
        host.style.height = '48px';
      }
    }
  });

  document.body.appendChild(host);
}
