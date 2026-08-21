const layout = document.querySelector(".layout");

function setFeaturedGenre(targetId) {
  document.querySelector('.layout > div.is-featured')?.classList.remove('is-featured');

  if (!targetId) {
    layout.scrollIntoView();
    return;
  }

  document.getElementById(targetId)?.classList.add('is-featured');

  const featured = layout.querySelector("div.is-featured");
  featured?.scrollTo({ top: 0 });

  layout.scrollIntoView();
}

export function set_isFeatured() {

  const activeGenres = Array.from(
    document.querySelectorAll('.layout > div[id]:has(p)'),
    div => ({
      id: div.id,
      name: div.dataset.name || div.id
    })
  );

  document.getElementById('genre-menu').innerHTML = `<li data-target="" class="is-active">デフォルト</li>` +
    activeGenres
    .map(g => `<li data-target="${g.id}" title="${g.name}を先頭に表示">${g.name}</li>`)
    .join('');


  const genreMenu = document.querySelectorAll("#genre-menu > li");

  genreMenu.forEach((menu) => {

    menu.addEventListener("click", (e) => {
      const targetValue = e.currentTarget.dataset.target;
      //const targetElement = document.getElementById(targetValue);
      setFeaturedGenre(targetValue);
    });

  });

};
