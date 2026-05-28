---
title: リンクなどの仕組み
description: リンクをどうやって作るかの話
date: 2026-03-09
tags: 
  - tag link
  - Permalink
  - pagenation
---


## 11tyはコレクションというオブジェクトにたいてい全部入ってる

どこかで書いたかも知れませんが、全てのブログ記事には表示されませんが`posts`というタグが自動でつきます。それとは別で`tags: - something`と好きなタグを付けられます。

ここから、
```njk
{% raw %}<ul>
{%- for post in collections.posts -%}
  <li>{{ post.data.title }}</li>
{%- endfor %}
</ul>{% endraw %}
```

こういうふうに書くと、`for post in collections.posts`は、すべての記事にデフォルトで付いている`posts`とついてる**tag**の記事の集まりから一つずつ取り出して、それぞれを処理できます。
ひとつずつ取り出すというのは、`post[0]、post[1]、post[2]...`というように順番にということです。


すべての記事を一覧にしてみると
<div class="max-h-[500px] overflow-y-scroll">

<ul>
{%- for post in collections.posts -%}
  <li>{{ post.data.title }}</li>
{%- endfor -%}
</ul>

</div>

しかしこの記事のリストにはリンクがありません。この記事にリンクを付けるとすると、


```njk
{% raw %}<ul>
{%- for post in collections.posts -%}
  {%- set link = post.url -%}                 {# ここ #}
  <li>
      <a href="{{link}}" title="記事へのリンク"> {# ここ #}
      {{ post.data.title }}
      </a>                                    {# ここ #}
  </li>
{%- endfor -%}
</ul>{% endraw %}
```

<div class="max-h-[500px] overflow-y-scroll">

<ul>
{% for post in collections.posts %}
  {% set link = post.url %}
  <li>
      <a href="{{link}}" title="記事へのリンク">
      {{ post.data.title }}
      </a>
  </li>
{% endfor %}
</ul>

</div>

このようにして、`set link = post.url`で`link`を定義して、`link`に書く記事のアドレスが入るようにします。すると、`<a href="ここにlink">`とすればアドレスが入りリンクになるという寸法です。
しかし、これを見ると今見ているページのリンクも入っています。これは不要です。別のページに行くためのリンクなので。意図として<u>全てのページを表示するなら間違っていません</u>が他のページに行くためのリンクとした場合、今見ているページと違うものだけをリストアップしたいと考えます。
今見ているページのアドレスは、`page.url`で取得できます。そのため、

```njk
{% raw %}<ul>
{%- for post in collections.posts -%}
  {% set link = post.url %}
  {% set currentViewUrl = page.url %}         {# ここ #}
  
  {% if link != currentViewUrl %}             {# ここ #}
  
  <li>
      <a href="{{link}}" title="記事へのリンク">
      {{ post.data.title }}
      </a>
  </li>
  
  {% endif %}                                 {# ここ #}
{%- endfor -%}
</ul>{% endraw %}
```

<div class="max-h-[500px] overflow-y-scroll">
<ul>
{% for post in collections.posts %}
  {% set link = post.url %}
  {% set currentViewUrl = page.url %}
  
  {% if link != currentViewUrl %}
  
  <li>
      <a href="{{link}}" title="記事へのリンク">
      {{ post.data.title }}
      </a>
  </li>
  
  {% endif %}
{% endfor %}
</ul>
</div>

このようにして、見ているページのアドレスと違う記事だけを取り出すこともできます。同じなら除外するということです。
以下はそれぞれがどう違うかの実際の出力((htmlで手入力したものではなく、11tyが出力した物))の比較。

<div class="flex flex-wrap gap-[1rem] justify-center">
  <div class="block max-h-[500px] overflow-y-scroll">
    <h4>全部の記事</h4>
    <ul>
    {%- for post in collections.posts -%}
      {% set link = post.url %}
      <li>
          <a href="{{link}}" title="記事へのリンク">
          {{ post.data.title }}
          </a>
      </li>
    {%- endfor -%}
    </ul> 
  </div>
  <div class="block max-h-[500px] overflow-y-scroll">
  <h4>見ているページだけ除く</h4>
    <ul>
    {%- for post in collections.posts -%}
      {%- set link = post.url -%}
      {%- set currentViewUrl = page.url -%}
      {%- if link != currentViewUrl -%}
      <li>
          <a href="{{ link }}" title="記事へのリンク">{{ post.data.title }}</a>
      </li>
      {%- endif -%}
    {%- endfor -%}
    </ul>
  </div>
</div>

しかしこれをトップページでもこういう仕組みで記事リストを表示してありますが、記事の順番が違いますよね？これはフィルターを利用しているわけです。

```njk
{% raw %}<ul>
  {%- for post in collections.posts | reverse -%}  {# ここ #}
  {% set link = post.url %}
  <li>
      <a href="{{link}}" title="記事へのリンク">
      {{ post.data.title }}
      </a>
  </li>
{%- endfor -%}
</ul>{% endraw %}
```

これでトップページと同じ並びになります。これらは例えば関連記事を表示したいと言う場合に使えるかと思います。

1. どのタグをコレクションするか
2. 今見ているページを除く
3. 新しい記事から並べる

これらで実行できるかと思います。タグが同じものの中から新しい記事順に並べるだけですが。タグは関係なく、すべての記事の中からランダムに取り出すとか、日付で範囲を絞るとか色々できるかと思いますが、それらは何らかの方法をeleventy.config.jsで行い、コレクションを作る必要があるかと思います。

<ul>
{%- for post in collections.posts | reverse -%}
  {% set link = post.url %}
  <li>
      <a href="{{link}}" title="記事へのリンク">
      {{ post.data.title }}
      </a>
  </li>
{%- endfor -%}
</ul>

上記で、最初の`for ～`の部分に`| reverse`ありますが、これがフィルタです。デフォルトで備わっているものもあれば自身が`eleventy.config.js`に追加してフィルターを作ることもできます。この最小構成の{{ site.name }}では5つ、便利そうなフィルターを用意してあります。
どういう時に使いかはアイデア次第ですが、トップページの日付を表示している部分にも既に使用されています。

```njk
{% raw %}<time datetime="{{ post.date | dateISO }}">{{ post.date | dateJP }}</time>{% endraw %}
```

同じ`post.date`ですが使用する場所で内容が変わっています。

```html
<time datetime="2026-03-01">2026年3月1日</time>
```

どういう形式がよいのかで自身で変更しても良いですし、フィルターを作ってパイプ(`|`)で繋げば良いだけです。フィルターはちょっとJavaScriptがわからないと作れないかも知れませんが、どういう事をしたいのかをAIに伝えれば作ってくれます。
その時には、どういう値がそこに入っていて、どういう形式にしたいのかを伝える必要もあるでしょう。

最初に`dateISO`フィルタ部分を外しておいて、同じtimeタグを見てみると、

```html
<time datetime="Sun Mar 01 2026 09:00:00 GMT+0900 (日本標準時)">2026年3月1日</time>
```
こういう値に表示されます。つまり、この値をフィルタの部分で違う値に書き換えるように設定してあるということです。この値を自分がこうしたいという値でAIに聞けばよいということです。
その時にAIはたいてい多くの人が利用できるレガシーな古い形式で返答するので、**モジュール形式のeleventy.config.jsを利用している**と付け加えて下さい。

更にこういったコードをシンタックスハイライトで色付するには、別途[11tyのプラグイン](https://www.11ty.dev/docs/plugins/syntaxhighlight/)を利用する必要があります。

こういったプラグインに関しても、AIに聞けばわざわざ英語のドキュメントを読まなくてもAIが対応してくれるでしょう。公式にはないけれどもnpmでありますよ、というAIの返事があればどのようにしてインストールし、どのようにして使うかを聞けば答えてくれます。
それを何回か繰り返せば、こういう時にはこうすれば良いと方法がわかるようになります。

最小構成で公開しているのは面倒ですがそれら方法を知ることでより深く学べると思うからです。

## ページネーションを使うには

記事が増えてくると、次のページ、前のページとしてページネーションをつける方が、縦に伸びていく一方のページがコンパクトになりわかりやすくなりますよね？そういう場合には、その名もそのままのナビゲーションを利用します。

`src/index.njk`のフロントマターに次のような項目を追加します。

元々のフロントマター、
```yaml
---
layout: base.njk
title: Home
---
```

変更したフロントマター
```yaml
---
layout: base.njk
title: Home
pagination:
  data: collections.posts
  size: 5
  alias: posts
  reverse: true
---
```

この時に問題になることが1つ。現在のトップページ(`src/index.njk`)では、`for ～ | reverse`とすでに新しい記事が一番上に来るようにしています。しかし、ページネーションを付ける場合、これは修正する必要があります。

```njk
{% raw %}<section class="post-list-section">
  <div class="post-list">
    {%- for post in collections.posts | reverse -%} {# ← ここ #}
      <article class="post-card">{% endraw %}
```

このフィルターをまず取り除いて、更にフロントマターで書いたページネーションで作成したエイリアスの`posts`に変更します。

```njk
{% raw %}<section class="post-list-section">
  <div class="post-list">
    {%- for post in posts -%} {# ← ここ #}
      <article class="post-card">{% endraw %}
```

こうしておきます。

`pagenation: `の項目は、

|項目|どういう働きか|
|---|---|
|`data`|どのコレクションを利用するか|
|`size`|1ページに何件出すか|
|`alias`|分割されたデータをなんと呼ぶか|
|`reverse`|新しい順にするか|

`alias`を`posts`とすることで、`collections.post`の代わりに、そのページに割り当てられた`size`で指定した件数を`posts`と言う名前で利用できるようになるわけです。

これで準備ができたので、次は、どういうアクションでこれらページを切り替えるかを作成します。これらをページネーションを入れたい場所に組み込みます。

```njk
{% raw %}<nav>
  {% if pagination.href.previous %}
    <a href="{{ pagination.href.previous }}">← 前のページ</a>
  {% endif %}

  {% if pagination.href.next %}
    <a href="{{ pagination.href.next }}">次のページ →</a>
  {% endif %}
</nav>{% endraw %}
```

これで 「前のページ」 「次のページ」 のリンクができるようになります。記事が少ない内はこれで良いですが、記事が増えてくるとページ数で実装したいということもあります。
11tyは`size`の値で分割したそれぞれのページのurlを最初から`pagenation.hrefs`に保持していて、これをnunjucksのforでループさせれば、ページ番号が作れます。

```njk
{% raw %}<nav class="pagination-nav">
  <ol class="pagination-list">
    {# 全ページのURL（hrefs）を1つずつ取り出す #}
    {%- for pageEntry in pagination.hrefs %}
      <li>
        <a href="{{ pageEntry }}" 
           class="pagination-link {% if page.url == pageEntry %}is-active{% endif %}"
           {% if page.url == pageEntry %}aria-current="page"{% endif %}>
          {{ loop.index }}
        </a>
      </li>
    {%- endfor %}
  </ol>
</nav>{% endraw %}
```

このままだと、数字がでてくるだけです。`.pagination-list`に対してスタイルを当てれば横並びにもなりますし、その中にある`li`にスタイルすればボタン風にもできるでしょう。
