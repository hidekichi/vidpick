---
title: Markdownテスト
description: だいたいわかると思いますが念の為書いておきます
date: 2026-03-01
tags:
  - manual
  - test
---

## 上記ヘッダーの構造

```njk
{% raw %}<section>
  <header class="post-header">
    <div class="post-meta-top">
      {% if tags %}
        <div class="post-tags">
          {% for tag in tags | excludeTag("posts") %}
            <span class="post-tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}
      <time class="post-date" datetime="{{ date | dateISO }}">
        {{ date | dateJP }}
      </time>
    </div>
    <h1 class="post-title">{{ title }}</h1>
    {% if description %}
      <p class="post-description">{{ description }}</p>
    {% endif %}
  </header>
</section>{% endraw %}
```

記事のフロントマターは、
```yaml
---
title: Markdownテスト
description: だいたいわかると思いますが念の為書いておきます
date: 2026-03-01
tags:
  - manual
  - test
---
```

になっています。nunjucksの`for`とか`if`の使い方が馴染みない人もいると思いますが、おおよそJavaScriptのような感じです。英語ですが本家の[ガイド・ドキュメント](https://mozilla.github.io/nunjucks/)を参考にするか、[日本語で解説されているサイト](https://developers.karte.io/docs/nunjucks)もありますので、便利に活用して下さい。
記事を書くだけであればフロントマターを先に覚えるほうが良いかも知れません。

## 見出し 各headerの表示

# h1 見出し
## h2 見出し
### h3 見出し
#### h4 見出し
##### h5 見出し
###### h6 見出し

## リスト

<div class="flex flex-wrap gap-[1rem] justify-around">

<div>

- list-item 1
- list-item 2
- list-item 3
- list-item 4
- list-item 5

</div>
<div>

1. list-item a
2. list-item b
3. list-item c
4. list-item d
5. list-item e
6. list-item f

</div>
<div>

1. list-item a
    - list-item 1
    - item-list 2
    - item-list 3
2. list-item b
3. list-item c

</div>

</div>

## コード

インラインコードは`src/assets/css/main.css`となります。

```js
document.querySelector("DOMContentLoaded", () => {
  // some codes
});
```

## リンクと引用

[Google検索](https://www.google.com/)
[Google検索 - title属性つきのリンク](https://www.google.com/ "titleつきリンク")

```njk
[Google検索](https://www.google.com/)
[Google検索 - title属性つきのリンク](https://www.google.com/ "titleつきリンク")
```

> Google検索は[こちら](https://www.google.com/)です。
>> 引用の引用

```njk
> Google検索は[こちら](https://www.google.com/)です。
>> 引用の引用
```

## テーブル

| Th     |    Th    |     Th |
| :----- | :------: | -----: |
| 左寄せ | 中央寄せ | 右寄せ |

## カラー

<span class="text-amber-300">何かしらのテキストでTailwindcssが使用できます</span>
<font color="red">普通のhtmlも使用できます</font>

```html
<span class="text-amber-300">何かしらのテキストでTailwindcssが使用できます</span>
<font color="red">普通のhtmlも使用できます</font>
```

## テキストの操作

**太字** は半角アスタリスク2つ
*斜体は* はアスタリスク1つ
~~打ち消し~~ はチルダ2つ
アンダーラインは無いので<u>htmlで書くことができます</u>。`<u></u>`
脚注は面倒くさいので半角カッコを2つで((囲めば自動的になるスクリプト添付))


```njk
**太字** は半角アスタリスク2つ
*斜体は* はアスタリスク1つ
~~打ち消し~~ はチルダ2つ
アンダーラインは無いので<u>htmlで書くことができます</u>。`<u></u>`
脚注は面倒くさいので半角カッコを2つで((囲めば自動的になるスクリプト添付))
```

## 画像の挿入

![BlazeChariot OGP](/assets/images/opengraph-cover.jpg)

```njk
![BlazeChariot OGP](/assets/images/opengraph-cover.jpg)
```

![Alt text][id]

[id]:/assets/images/opengraph-cover.jpg

```njk
![Alt text][id]

[id]:/assets/images/opengraph-cover.jpg
```

<プラグインを使用すれば>
識別する`<div class="<識別クラス>">`として書けばそれに`main.css`がスタイルを当てることもできます。これらも`div`などで囲んで`class`にtailwindcssを加えれば、`main.css`で書く必要もありません。
ただしそれをするためには属性を追加できるプラグインを使用する必要があります。という段落のテストも兼ねて。

参考： [markdown-it-attrs](https://www.npmjs.com/package/markdown-it-attrs)

```html
<div class="flex ...">
 
 ![image](/assets/images/opengraph-cover.jpg)
  
<div>

----

<div class="flex">
  <p>
    <img src="/assets/images/opengraph-cover.jpg"/>
  </p>
</div>
```
上記のように`---`の上と画像をhtmlで書けばいけそうですが、書いたとしても、下のように空行が`<p>`変換されるため色々な工夫が必要で、そのために属性を追加できるプラグインは便利です。
画像のアドレスが複雑でなければ最初から`html`で書くという手もありますし、11tyでは[eleventy-img](https://www.11ty.dev/docs/plugins/image/)というプラグインがあります。

しかし、このプラグインは**画像を**<u>11tyではなくプラグインが管理します</u>ので、そこにviteも絡んでくると**設定がとてもややこしくなります**。そのため本来は便利な機能なんでしょうがここは敢えて、使用しない方向で設定しました。
自動的に`<img`を`<picture`に変更して、更にjpgからavifやwebpを生成してjpgで記事を書けば自動的にavif(フォールバックでwebp、それも無理ならjpg)としてくれるプラグインの存在はデカイですが、それらは自身で用意してhtmlで書くという方向でひとまずは進めて、どうしても実装したいとなればAIに問い合わせてコードを書いてもらうなどが必要になるかと思います。

最悪、jpgをコンバートするのは自身でして、`<img`を`<picture`で出力するというのはJavaScriptで言うほど難しいことではないので、そういうコードを書いてもらっても良いかも知れません。これの流れとしては、
1. 画像は同じ名前で拡張子だけ、jpg、avif、wepb等でコンバートしたものを用意してこれまでと同様に記事を書く
2. JavaScriptは、ページが表示されてからDOMを書き換えるので既にページ内にある`<img`タグを見つけて`<picture`に書き換える処理をする

と言う具合です。
この際の懸念点として、ファーストビューにjpg本来の画像があって、サイトにアクセスしたらすぐに画像を表示するということだとせっかくの軽い画像(avifやwebp)が無駄にもなりかねません。そこで、実装方法としては、

- 一旦ページをcssで `body { visibility: hidden; }`として非表示にしておきます。`opacity`よりも`visibility`の方がレイアウトが崩れたりがないのではなかろうかと。
- jsで全てのDOM書き換え処理が完了してからbodyに何かしらのクラス(例では`.show`)をつけて全体を表示

```css
body {
  visibility: hidden;
  
  &.show {
    visibility: visible;
  }
}
```
とすれば表示されるわけで、jsのDOM書き換え処理は多少は時間がかかりますが、ファーストビューも既に書き換えられていて表示されるため、avifのjpgより(ダウンロードサイズが)軽いフォーマットで表示、できなければwebpで、それも無理ならjpgでとできると思います。
結局、表示にかかるダウンロードの時間が問題なので、できるだけ速く表示するにはこういう手法も考えられるかと。

`visibility`で非表示にしているというのは人間側だけで、htmlは既にあるのでGoogleのbotがどういう仕組でサイトの情報を取得しているのかは知りませんがまぁ何とかなるのではないかと。

こういうjsをAIに作ってもらえば良いかと思います。もちろん自身で作っても良し、それをリファクタリングしてもらっても良しです。
