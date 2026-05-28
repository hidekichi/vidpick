---
title: パーマリンク
date: 2025-03-02
permalink: "/special-page/"
---

フロントマターでPermalinkを設定すると、ファイル名は同じながら特別なアドレスが作れます。
このページは、`test35.md`なので、ローカルで見る場合は、`http://localhost:5173/posts/test35/`となりますが、

```yaml
---
title: パーマリンク
date: 2025-03-02
permalink: "/special-page/"
---
```

`permalink: `を上記のように変更してあると、ブラウザで見てもらえばわかりますが、`http://localhost:5173/special-page/`と変わっていると思います。
