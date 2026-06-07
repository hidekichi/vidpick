export function back2top() {
  const headerInner = document.querySelector(".back-to-top-text");
  headerInner.addEventListener("click", () => {
		window.scroll({
			top: 0,
    });
	});
};

// scroll-filter.js

const TOP_THRESHOLD = 100; // ★これより上は「最上部エリア」とみなして初期化
const DEADZONE = 1;        // 静止しているとみなす「差」のしきい値（px）
const EASING = 0.15;       // 追従の遅れ度合い（0〜1）

export const initPhysicalScrollWatcher = () => {
  let targetY = window.scrollY;  // 観念の四角形（実際のスクロール位置）
  let currentY = window.scrollY; // 遅れて追従する四角形

  let isLooping = false;
  let currentDirection = 'top';  // 'down' | 'up' | 'stop' | 'top'

  const updatePhysics = () => {
    // 1. 【最上部ガード】実際のスクロールが閾値より上なら、即座に top 状態にして終了
    if (targetY <= TOP_THRESHOLD) {
      currentY = targetY; // 位置を同期
      if (currentDirection !== 'top') {
        currentDirection = 'top';
        window.dispatchEvent(new CustomEvent('scroll-state-change', { detail: { state: 'top' } }));
      }
      isLooping = false;
      return;
    }

    // 2. 通常エリアにいる場合は、じわっと追従計算
    currentY += (targetY - currentY) * EASING;
    const diff = targetY - currentY;
    const absDiff = Math.abs(diff);

    let nextDirection = currentDirection;

    // 3. 状態の割り出し（最上部エリアは上で抜けているので、純粋に動いているかどうかだけ）
    if (absDiff <= DEADZONE) {
      nextDirection = 'stop';
    } else {
      nextDirection = diff > 0 ? 'down' : 'up';
    }

    // 4. 状態が変わった瞬間だけ信号を飛ばす
    if (nextDirection !== currentDirection) {
      currentDirection = nextDirection;
      window.dispatchEvent(new CustomEvent('scroll-state-change', {
        detail: { state: currentDirection } // isFastは不要になったので削除
      }));
    }

    // 静止したらループを止めて省電力化
    if (currentDirection === 'stop') {
      currentY = targetY;
      isLooping = false;
      return;
    }

    requestAnimationFrame(updatePhysics);
  };

  window.addEventListener('scroll', () => {
    targetY = window.scrollY;

    if (!isLooping) {
      isLooping = true;
      requestAnimationFrame(updatePhysics);
    }
  }, { passive: true });
};

/*
export function scrollDirection() {
  let lastScrollY = window.scrollY;
  let isDown = false;
  let ticking = false;
  let isStopping = false;
  // 画面上部とみなす閾値（px）
  const TOP_THRESHOLD = 20;

  const target = document.querySelector(".back-to-top-text");
  target.classList.add('stop');

  const updateScrollDirection = () => {
    const currentScrollY = window.scrollY;
    const isAtTop = currentScrollY <= TOP_THRESHOLD;

    if (isAtTop) {
      target.classList.remove('down', 'up', 'stop');
      isDown = false;
      isStopping = false;
    } else {

      // 現在の下向きスクロール判定（Boolean）
      const movingDown = currentScrollY > lastScrollY;

      // 【ここが肝】前回の方向と変わった瞬間だけ処理を実行
      if (movingDown !== isDown) {
        isDown = movingDown;

        // toggleの第2引数にBooleanを渡すことで、add/removeをスマートに切り替え
        target.classList.toggle('down', isDown);
        target.classList.toggle('up', !isDown);
      }

      if (isStopping) {
        isStopping = false;
        target.classList.remove('stop');
      }
    }

    // 次回の比較用に現在の位置を保存
    lastScrollY = currentScrollY;
    ticking = false;
  };

  // スクロールイベントの間引き（Throttling）
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollDirection);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener('scrollend', () => {
    isStopping = true;

    if (window.scrollY <= TOP_THRESHOLD) {
      target.classList.remove('down', 'up', 'stop');
      isStopping = false;
    } else {
      isStopping = true;
      target.classList.add('stop');
      }
    // 方向クラス（is-scroll-down / up）は一切触らず、そのままキープ！
  });
}
*/
