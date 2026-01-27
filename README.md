<div align="center" style="text-align:center">
  <h1>Ravage</h1>
  ユーザーの代わりにメッセージを送信するユーザーインストール用のDiscord BOT
</div>

## ファイルの初期設定のやり方

### .envファイル（非推奨）
```
# BOTトークン（config.jsonで指定する場合は不要）
DISCORD_TOKEN=MTQzODgyMDA4NzEyMDUyNzU0MA.GRvptq.7k5YfllXWhOagvOzIDVMKpS3AN_rsHhyy-T1ew

# これはBotが認証されたときや認証解除されたときのWebhookイベントを受け取りたい場合にのみ設定する
DISCORD_PUBLIC_KEY=8f87f2213656e5b78620c8a80e6d6a7b20414696f4805ef91b501a359f7f629d
```

### /.data/server/trusted_users.jsonファイル( `/z_admin` コマンドを使えるように)
```json
["あなたのユーザーID"]
```

### config.json
```jsonc
{
  "application_name": "Ravage", // Botの名前（デフォルト: Ravage）
  "name": "XServer VPS", // Botを実行しているサーバーの名前
  "logger": true, // ログを有効にするかどうか（デフォルト: false）
  "debug": true, // デバッグログを有効にするかどうか（デフォルト: false）
  "port": 3000, // HTTPサーバーをどのポートにリッスンするかの設定（デフォルト: 3000）

  // 管理用のAPIにアクセスするためのパスワード
  "api_password": "qSHvyQDQgqSx4OBfnIK06KxYSnrbD8rN",

  // セルフボットを使用して、BOTトークン/アカウントが無効になったときにお知らせする場合に使用する
  "selfbot_notify": {
    // ユーザーアカウントのトークン
    "token": "MTQxMTMzMDUxNDE2OTc2MTkyMg.GeGw30.69ese29QNVDusRcJLP6qmvwZzFpHas0BlQajb0",

    // 通知先のチャンネルのID
    "channel_id": "1234567890123456789"
  },

  // BOTトークン/アカウントが無効になった場合にここのトークンに切り替える（上から順にトークンが使われる）
  "spare_tokens": [
    {
      // BOTトークン
      "token": "MTQyMjUyNTA0ODUwOTU2NzA2OA.G5XZ6T.qltnfQIUxvR3Tsp4AhuCUvExrGBPoNMFqwyMjQ",
      // BOTの公開キー
      "public_key": "8b19e21f0b5d6d60642027bb05a4476d22926886959291f86c5017a3aafbb03c"
    },
    {
      "token": "MTQyODM2NTc2MDQ0MjQwMDc2OA.GQwzf0.kfabUGuC6PUCDizLVspTb7FIZQpS5ix_cz4ApU",
      "public_key": "a6ccef0fe4f416ea86d395dbe3848adbd591884fb2a439928b45752172da36cd"
    }
  ],

  // BOTトークン（.envで指定されている場合は不要、.envよりも優先される）
  "token": "MTQzODgyMDA4NzEyMDUyNzU0MA.GRvptq.7k5YfllXWhOagvOzIDVMKpS3AN_rsHhyy-T1ew",

  // 公開キー（.envで指定されている場合は不要、.envよりも優先される）
  "public_key": "8f87f2213656e5b78620c8a80e6d6a7b20414696f4805ef91b501a359f7f629d",

  // BOTログインに使用するHTTPプロキシ（CloudflareなどからIPアドレスがブロックされる場合におすすめ）
  "http_proxy": "http://162.43.9.148:3128/"
}
```
*注意: コード例では、わかりやすいように **JSONCフォーマット** を使用していますが、ファイル自体は **JSONフォーマット** です。実際のファイルにコメントアウトを書くことはできません。*
<br>
*また、APIや予備トークンからトークンが変更された場合はファイルのインデントが変更されます。*

Webhookイベントの受信を希望する場合は、エンドポイントのURLに、 `/discord/webhook-endpoint/<CLIENT_ID>` を指定してください。 `<CLIENT_ID>` には、BOTのアプリケーションIDを指定してください。
<br>
例: `https://ravage-api.soyaaaaana.com/discord/webhook-endpoint/1438820087120527540`

## 実行方法一覧
- npm start
- npm run s
- npm run start
- npm i && node main.js

### PM2を使用する場合
`ecosystem.config.js` で名前を設定できます。

- npm run sp
- npm run start-pm2
- npm i && npm i -g pm2 && pm2 start ecosystem.config.js

## ライセンス
MITライセンスです。自由に使用、改変、再配布することができますが、著作権表示とライセンス文を保持する必要があります。

詳細は `LICENSE` ファイルを参照してください。

以下は、MITライセンスの日本語訳です。参考程度に使用してください。日本語訳のライセンスに誤りや、英語のライセンスとの相違があった場合、英語のライセンス（`LISENCE`ファイル）の方が優先されます。

```
Copyright (c) 2026 そゃーな

本ソフトウェアおよび関連する文書のファイル（以下「ソフトウェア」）の複製を取得した全ての人物に対し、以下の条件に従うことを前提に、ソフトウェアを無制限に扱うことを無償で許可します。これには、ソフトウェアの複製を使用、複製、改変、結合、公開、頒布、再許諾、および/または販売する権利、およびソフトウェアを提供する人物に同様の行為を許可する権利が含まれますが、これらに限定されません。

上記の著作権表示および本許諾表示を、ソフトウェアの全ての複製または実質的な部分に記載するものとします。

ソフトウェアは「現状有姿」で提供され、商品性、特定目的への適合性、および権利の非侵害性に関する保証を含むがこれらに限定されず、明示的であるか黙示的であるかを問わず、いかなる種類の保証も行われません。著作者または著作権者は、契約、不法行為、またはその他の行為であるかを問わず、ソフトウェアまたはソフトウェアの使用もしくはその他に取り扱いに起因または関連して生じるいかなる請求、損害賠償、その他の責任について、一切の責任を負いません。
```
