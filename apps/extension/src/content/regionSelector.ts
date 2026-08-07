import { RegionSelection } from '@lumen/shared';

const OVERLAY_ID = 'lumen-region-overlay';

function isVisible(el: HTMLElement): boolean {
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

/**
 * DOM text is only auxiliary evidence. The cropped screenshot is always the
 * primary source for region mode, which is what makes canvas/SVG graphs,
 * charts, heatmaps, patterns and complex tables work.
 */
function extractTextInRegion(cropX: number, cropY: number, cropWidth: number, cropHeight: number): string {
  const cropRight = cropX + cropWidth;
  const cropBottom = cropY + cropHeight;
  const pieces: string[] = [];
  const seen = new Set<string>();

  const elements = Array.from(
    document.body.querySelectorAll<HTMLElement>(
      'h1,h2,h3,h4,h5,h6,p,span,li,td,th,label,button,strong,em,small,code,pre,blockquote,a,figcaption,caption,[role="cell"],[role="columnheader"],[role="rowheader"],[aria-label]'
    )
  );

  for (const el of elements) {
    if (el.closest(`#${OVERLAY_ID}`) || !isVisible(el)) continue;
    const rect = el.getBoundingClientRect();
    const intersects =
      rect.right > cropX &&
      rect.left < cropRight &&
      rect.bottom > cropY &&
      rect.top < cropBottom;
    if (!intersects) continue;

    const text = (
      el.innerText ||
      el.getAttribute('aria-label') ||
      el.textContent ||
      ''
    )
      .replace(/\s+/g, ' ')
      .trim();

    if (!text || text.length > 1500 || seen.has(text)) continue;
    seen.add(text);
    pieces.push(text);

    // Keep auxiliary context bounded; vision is the source of truth.
    if (pieces.join('\n').length > 6000) break;
  }

  return pieces.join('\n').slice(0, 6000).trim();
}

function runtimeNotify(message: any): void {
  chrome.runtime.sendMessage(message, () => void chrome.runtime.lastError);
}

function afterOverlayPaintRemoval(callback: () => void): void {
  // Two animation frames ensure Chrome has actually repainted the page after
  // removing our dark overlay/selection rectangle before captureVisibleTab().
  requestAnimationFrame(() => requestAnimationFrame(callback));
}

/**
 * Neeraj-style region flow:
 * start cropper -> user draws -> remove overlay -> capture/crop in background
 * -> emit a fresh EXECUTE_SUMMARIZE_PAYLOAD message to the side panel.
 */
export function startRegionSelection(): void {
  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    zIndex: '2147483647',
    cursor: 'crosshair',
    background: 'rgba(10,10,10,.28)',
    userSelect: 'none',
    touchAction: 'none',
  });

  const hint = document.createElement('div');
  hint.textContent = 'Drag over a graph, chart, table, pattern, or any visible area • Esc to cancel';
  Object.assign(hint.style, {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0A0A0A',
    color: '#E8FF3B',
    border: '1px solid #E8FF3B',
    borderRadius: '9px',
    padding: '9px 14px',
    fontFamily: 'Inter,system-ui,sans-serif',
    fontSize: '12px',
    fontWeight: '700',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    boxShadow: '0 8px 24px rgba(0,0,0,.45)',
  });
  overlay.appendChild(hint);

  const selectionBox = document.createElement('div');
  Object.assign(selectionBox.style, {
    position: 'fixed',
    display: 'none',
    border: '2px solid #E8FF3B',
    background: 'rgba(232,255,59,.08)',
    boxShadow: '0 0 18px rgba(232,255,59,.45)',
    pointerEvents: 'none',
  });
  overlay.appendChild(selectionBox);

  const badge = document.createElement('div');
  Object.assign(badge.style, {
    position: 'absolute',
    right: '0',
    bottom: '-27px',
    background: '#E8FF3B',
    color: '#0A0A0A',
    borderRadius: '4px',
    padding: '3px 7px',
    fontFamily: 'monospace',
    fontSize: '10px',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  });
  selectionBox.appendChild(badge);

  document.documentElement.appendChild(overlay);

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let isDragging = false;

  const clampX = (x: number) => Math.max(0, Math.min(window.innerWidth, x));
  const clampY = (y: number) => Math.max(0, Math.min(window.innerHeight, y));

  function currentRect() {
    const x = Math.min(startX, currentX);
    const y = Math.min(startY, currentY);
    return {
      x,
      y,
      width: Math.abs(currentX - startX),
      height: Math.abs(currentY - startY),
    };
  }

  function cleanup(): void {
    isDragging = false;
    overlay.remove();
    window.removeEventListener('keydown', onKeyDown, true);
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cleanup();
    runtimeNotify({ action: 'REGION_CAPTURE_CANCELLED' });
  }

  function onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    isDragging = true;
    startX = clampX(event.clientX);
    startY = clampY(event.clientY);
    currentX = startX;
    currentY = startY;

    selectionBox.style.left = `${startX}px`;
    selectionBox.style.top = `${startY}px`;
    selectionBox.style.width = '0px';
    selectionBox.style.height = '0px';
    selectionBox.style.display = 'block';
  }

  function onMouseMove(event: MouseEvent): void {
    if (!isDragging) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    currentX = clampX(event.clientX);
    currentY = clampY(event.clientY);
    const rect = currentRect();

    selectionBox.style.left = `${rect.x}px`;
    selectionBox.style.top = `${rect.y}px`;
    selectionBox.style.width = `${rect.width}px`;
    selectionBox.style.height = `${rect.height}px`;
    badge.textContent = `${Math.round(rect.width)}px × ${Math.round(rect.height)}px`;
  }

  function onMouseUp(event: MouseEvent): void {
    if (!isDragging) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    currentX = clampX(event.clientX);
    currentY = clampY(event.clientY);
    isDragging = false;

    const { x, y, width, height } = currentRect();

    if (width < 15 || height < 15) {
      cleanup();
      runtimeNotify({
        action: 'REGION_CAPTURE_ERROR',
        error: 'Region is too small. Draw a larger rectangle around the visual you want analyzed.',
      });
      return;
    }

    // Read any useful labels/cells before removing the overlay.
    const regionText = extractTextInRegion(x, y, width, height);

    const region: RegionSelection = {
      x,
      y,
      width,
      height,
      devicePixelRatio: window.devicePixelRatio || 1,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    };

    cleanup();

    afterOverlayPaintRemoval(() => {
      chrome.runtime.sendMessage(
        {
          action: 'CAPTURE_VISIBLE_TAB',
          rect: {
            x,
            y,
            width,
            height,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            dpr: window.devicePixelRatio || 1,
          },
        },
        (response) => {
          const runtimeError = chrome.runtime.lastError;
          if (runtimeError || !response?.success || !response?.dataUrl) {
            runtimeNotify({
              action: 'REGION_CAPTURE_ERROR',
              error:
                runtimeError?.message ||
                response?.error ||
                'Could not capture this visual region. Refresh the page and try again.',
            });
            return;
          }

          runtimeNotify({
            action: 'EXECUTE_SUMMARIZE_PAYLOAD',
            payload: {
              success: true,
              mode: 'region',
              url: window.location.href,
              title: document.title || 'Drawn Region Screenshot',
              imageDataUrl: response.dataUrl,
              text: regionText || '[No DOM text detected. Analyze the screenshot itself as the primary source.]',
              region,
              visualPrimary: true,
            },
          });
        }
      );
    });
  }

  overlay.addEventListener('mousedown', onMouseDown, true);
  overlay.addEventListener('mousemove', onMouseMove, true);
  overlay.addEventListener('mouseup', onMouseUp, true);
  window.addEventListener('keydown', onKeyDown, true);
}
