const MARGIN = 8;
const MAX_CHARS = 30;

function trimText(text, max) {
  if (!text) return '';                              // ← nullガード
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function getRectAtMouseX(el, mouseX) {
  const rects = Array.from(el.getClientRects());
  return rects.find(r => mouseX >= r.left && mouseX <= r.right) ?? rects[0];
}

function positionTooltip(tooltipEl, el, mouseX, mouseY) {
  const rect = getRectAtMouseX(el, mouseX);
  const tw   = tooltipEl.offsetWidth;
  const th   = tooltipEl.offsetHeight;
  const vw   = window.innerWidth;
  const vh   = window.innerHeight;

  let x = mouseX - tw / 2;
  x = Math.max(4, Math.min(vw - tw - 4, x));

  const img = el.querySelector('img');

  let y;

  if (img) {
    // 画像リンク：カーソル付近
    y = mouseY - th - MARGIN;

    // 上には置けない場合はカーソルの下
    if (y < 4) {
      y = mouseY + MARGIN;
    }
  } else {
    // 通常のテキストリンク：従来通り
    y = rect.top - th - MARGIN;

    if (y < 4) {
      y = rect.bottom + MARGIN;
    }
  }

  // 下端からはみ出す場合
  y = Math.max(4, Math.min(vh - th - 4, y));

  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top  = y + 'px';
}

function showTooltip(tooltipEl, el, text, mouseX, mouseY) {
  tooltipEl.textContent = trimText(text, MAX_CHARS);
  tooltipEl.classList.add('visible');
  positionTooltip(tooltipEl, el, mouseX, mouseY);
}

function hideTooltip(tooltipEl) {
  tooltipEl.classList.remove('visible');
}

export function initTooltip(selector = '[title]', tooltipId = 'custom-tooltip') {
  // DOM構築後に呼ばれることを保証する内部処理
  const setup = () => {
    const tooltipEl = document.getElementById(tooltipId); // ← ここで取得

    if (!tooltipEl) {
      console.warn(`initTooltip: #${tooltipId} が見つかりません`);
      return;
    }

    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        el.dataset.tooltip = el.getAttribute('title') ?? '';
        el.removeAttribute('title');
        showTooltip(tooltipEl, el, el.dataset.tooltip, e.clientX, e.clientY);
      });

      el.addEventListener('mousemove', (e) => {
        positionTooltip(tooltipEl, el, e.clientX, e.clientY);
      });

      el.addEventListener('mouseleave', () => {
        el.setAttribute('title', el.dataset.tooltip);
        hideTooltip(tooltipEl);
      });
    });
  };

  // すでにDOMが構築済みならそのまま、まだならイベント待ち
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
}
