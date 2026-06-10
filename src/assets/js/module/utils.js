//add load lazy
export function insertLoadlazy() {
	const images = document.querySelectorAll("img");
	images.forEach((img) => {
		if (!img.getAttribute("loading")) {
			img.setAttribute("loading", "lazy");
		}
	});
}

// SVGアイコン生成を共通化
function createSvgIcon(iconId, className) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttributeNS(null, 'href', iconId);
    svg.setAttributeNS(null, 'role', 'img');
    svg.setAttributeNS(null, 'width', '13.35px');
    svg.setAttributeNS(null, 'height', '13.35px');
    svg.classList.add(className);
    svg.appendChild(use);
    return svg;
}

// サイト固有の設定をデータとして定義
const SITE_CONFIGS = [
    {
        test: (href) => href.includes('amzn.to/'),
        iconId: '#icon-amazon',
        className: 'amazon',
        title: 'Amazonへのリンクです',
    },
    {
        test: (href) => href.includes('github'),
        iconId: '#icon-github',
        className: 'github',
        title: 'GitHubへのリンクです',
    },
];

export function isExternalLink(url) {
    if (!/^https?:\/\//.test(url)) return false;
    return !url.startsWith(window.location.origin);
}

export function externalLink() {
    const links = document.querySelectorAll('.reading-main a');
    if (!links.length) return;

    links.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href || !isExternalLink(href)) return;

        link.setAttribute('target', '_blank');

        // Setを使うことで重複を簡潔に防ぐ
        const relValues = new Set((link.getAttribute('rel') || '').split(' ').filter(Boolean));
        relValues.add('noopener');
        relValues.add('noreferrer');
        link.setAttribute('rel', [...relValues].join(' '));

        const wrapper = document.createElement('span');
        wrapper.className = 'external-link-wrapper';
        wrapper.style.position = 'relative';
        link.parentNode.insertBefore(wrapper, link);
        wrapper.appendChild(link);

        // サイト固有アイコン（一致した最初の設定のみ適用）
        const siteConfig = SITE_CONFIGS.find((config) => config.test(href));
        if (siteConfig) {
            link.setAttribute('title', siteConfig.title);
            link.appendChild(createSvgIcon(siteConfig.iconId, siteConfig.className));
        }

        // 外部リンクアイコンは常に追加
        wrapper.appendChild(createSvgIcon('#icon_external-link', 'icon_external-link'));
    });
}
