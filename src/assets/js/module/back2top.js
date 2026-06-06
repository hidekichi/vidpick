export function back2top() {
  const headerInner = document.querySelector(".back-to-top-text");
  headerInner.addEventListener("click", () => {
		window.scroll({
			top: 0,
    });
	});
};

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
