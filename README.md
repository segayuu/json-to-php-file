# 何のライブラリ？

jsonっぽいjavascriptのobjectを単独のphpのutf8形式のUint8Arrayに変換するだけの関数を提供します。ファイル出力まではしない。

# build

```shell
npm install
npm build
```

# use

```js
import json2phpFile from "json-to-php-file";
import { readFile } from "node:fs/promises";
await readFile("file.php", json2phpFile({ a: 1 })); // "<?php return array('a'=>1);"
await readFile("file.php", json2phpFile({ a: 1 }, { shortArraySyntax: true })); // "<?php return ['a'=>1];"
```

# 注意

このライブラリは`json.stringify()`の動作に原則的に準拠していますが、意図的に違う処理を行っております。

- toJSON()による変換は未対応です。このライブラリで扱う処理はJSON出力そのものではありません。
