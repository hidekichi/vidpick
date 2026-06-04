export function embbedYoutubePlayer() {
	const makeData = (url) => {
		const iframeSrc = '//www.youtube.com/embed/';

		let dats = [];
		let pickupID;
		let convertIframe;
		let getThumb;

		// URL 形式を順に判定して ID を抽出する
		// 対応形式:
		//   youtu.be/XXXXX
		//   youtube.com/watch?v=XXXXX
		//   youtube.com/shorts/XXXXX
		//   youtube.com/embed/XXXXX
		if (url.includes('youtu.be/')) {
			pickupID = url.split('youtu.be/')[1];
		} else if (url.includes('v=')) {
			pickupID = url.split('v=')[1];
		} else if (url.includes('/shorts/')) {
			pickupID = url.split('/shorts/')[1];
		} else if (url.includes('/embed/')) {
			pickupID = url.split('/embed/')[1];
		}

		// ID が取得できなかった場合は処理を中断してエラーを防ぐ
		if (!pickupID) {
			console.warn('[embedYoutubePlayer] YouTube URL から ID を取得できませんでした:', url);
			return null;
		}

		// クエリパラメータやフラグメントを除去
		pickupID = pickupID.split('&')[0].split('?')[0].split('#')[0];

		const uId = randobet(6);
		// <iframe src="https://www.youtube.com/embed/7BAj3TiAJmU?si=bx0rtK_XIP8Q7TNi" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
		convertIframe = `<iframe id='${uId}' class='mv_hidden' data-src='${iframeSrc + pickupID}' frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;

		getThumb = `//i.ytimg.com/vi/${pickupID}/mqdefault.jpg`;

		dats = [convertIframe, getThumb, uId];

		return dats;
	}

	// http://blog.bornneet.com/Entry/143/ | costomized
	const randobet = (n, b = '') => {
		const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + b;
		const charactersArray = characters.split('');
		let randomString = '';

		for (let i = 0; i < n; i++) {
			randomString += charactersArray[Math.floor(Math.random() * charactersArray.length)];
		}

		return randomString;
	};

	const regex = /\[\@(.+?)\]/;
	const postElementP = document.querySelectorAll('.body-copy p');

	postElementP.forEach((p) => {
	let html = p.innerHTML;
	let matches;

	while ((matches = regex.exec(html)) !== null) {
		let youtubeAddress = matches[1];
		let className = 'ytp';

		if (youtubeAddress.includes('|')) {
			const [splitClass, address] = youtubeAddress.split('|');
			className = `ytp ${splitClass}`;
			youtubeAddress = address;
		}

		const divElement = document.createElement('div');
		divElement.className = className;
		divElement.textContent = youtubeAddress;

		html = html.replace(matches[0], divElement.outerHTML);
	}

	p.innerHTML = html;
	});

	const youtubePlayers = document.getElementsByClassName('ytp');

	Array.from(youtubePlayers).forEach((ytp) => {
		const youtubeAddress = ytp.textContent;
		ytp.textContent = '';

		const mvTitle = ytp.dataset.title;

		// data[convertIframe,getThumb,uId]
		const data = makeData(youtubeAddress);

		// URL が無効で ID を取得できなかった場合はスキップ
		if (!data) {
			console.warn('[embedYoutubePlayer] スキップ:', youtubeAddress);
			return;
		}

		// set wrapper & background-image
		const thumbnail = `background-image: url(${data[1]})`;
		const titleText = 'Click/tap to load video player';
		const playbackButton = `<button class='button play-button inner' data-target='${data[2]}' title='${titleText}'></button>`;
		let container = `<div class='container'>${playbackButton}${data[0]}</div>`;
		if (!mvTitle) {
			container = container;
		} else {
			container = `<span class="title">${mvTitle}</span>${container}`;
		}
		const wrapper = `<div class='wrapper' style='${thumbnail}'>${container}</div>`;

		ytp.innerHTML = wrapper;
	});

	document.addEventListener('click', (e) => {
		if (e.target.classList.contains('play-button')) {
			const target = e.target.getAttribute('data-target');
			const targetIframe = document.getElementById(target);
			targetIframe.setAttribute('src', targetIframe.getAttribute('data-src'));
			targetIframe.classList.replace('mv_hidden', 'inner');
			e.target.style.display = 'none';
		}
	});

}
