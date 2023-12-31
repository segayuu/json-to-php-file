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
await readFile("file.php", json2phpFile({a:1})); // "<?php return array('a'=>1);"
await readFile("file.php", json2phpFile({a:1}, { shortArraySyntax: true })); // "<?php return ['a'=>1];"
```
