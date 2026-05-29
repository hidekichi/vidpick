export function back2top() {
  const headerInner = document.querySelector(".header-inner");
  headerInner.addEventListener("click", () => {
		window.scroll({
			top: 0,
		});
	});
};
