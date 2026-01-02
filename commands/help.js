//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("このBOTのコマンドの使い方を表示します。")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    const text = `
*===============* **${app_config.application_name} Help** *===============*
Tips: [ravage.soyaaaaana.com](<https://ravage.soyaaaaana.com>) を使用するとトークンを使用する${app_config.application_name}のコマンドでトークンを安全に使用できます。

\`/modal setup\` | モーダル形式でボタンを押してメッセージを送信するボタンのセットアップをします。

\`/modal template create\` | モーダル形式でボタンのセットアップを簡単にするテンプレートを作成します。

\`/mention_test\` | コマンドを実行したチャンネルでeveryoneメンションが利用可能かをテストします。

\`/setup\` | メッセージを送信するボタンのセットアップをします。
- \`message\`
  - ボタンを押したときに送信するメッセージを指定します。最大2000文字まで入力できます。
- \`times\`
  - 1度ボタンを押したときに送信するメッセージの数を指定します。1～6回の範囲で指定可能です。
- \`delay\`
  - メッセージ送信の間隔を設定します。レート制限で後半のメッセージ送信が遅くなりすぎるのを防止するためのオプションです。
- \`version\`
  - ボタンのバージョンを指定します。**互換性維持のための引数です。前のバージョンを使用することは推奨しません。**

\`/execute\` | メッセージ送信を即座に実行します。
- \`message\`、\`times\`、\`delay\`
  - \`/setup\` コマンドと同じです。

\`/template create\` | ボタンのセットアップを簡単にするテンプレートを作成します。
- \`name\`
  - テンプレートの名前を自由に指定します。最大255文字で、テンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。
- \`message\`、\`times\`、\`delay\`、\`version\`
  - \`/setup\` コマンドと同じです。

\`/template load\` | 保存済みのテンプレートを読み込んでボタンをセットアップします。
- \`name\`
  - 保存済みのテンプレートの名前を指定します。指定したテンプレートの名前で保存されているテンプレートデータを使用してボタンがセットアップされます。
- \`override_times\`
  - 読み込んだテンプレートのデータに関わらず、指定の回数で実行します。
- \`override_delay\`
  - 読み込んだテンプレートのデータに関わらず、指定の遅延を使用して実行します。

\`/template preview\` | 保存済みのテンプレートを読み込んでメッセージをプレビューします。
- \`name\`
  - 保存済みのテンプレートの名前を指定します。

\`/template list\` | 保存済みのテンプレートのリストを表示します。

\`/template export\` | 保存済みのテンプレートをJSON形式でエクスポートします。このJSONデータを使用してインポートするには \`template import\` コマンドを使用します。
- \`name\`
  - 保存済みのテンプレートの名前を指定します。指定したテンプレートの名前で保存されているテンプレートデータをJSON形式でエクスポートします。テンプレートデータにテンプレート名は含まれません。

\`/template import\` | JSON形式のテンプレートデータをインポートします。
- \`name\`
  - インポートするテンプレートデータの名前を自由に指定します。最大255文字で、テンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。
- \`json\`
  - JSON形式のテンプレートデータを指定します。

\`/official_template ...\` 系のコマンドは、\`/template\` コマンドの公式が用意しているテンプレートから読み込むものです。

\`/delete_data\` | ${app_config.application_name}サーバーからあなたと関連付けられているデータを完全に削除します。
`.trim();

// \`/template execute\` | 保存済みのテンプレートを読み込んでメッセージ送信を即座に実行します。
// - \`name\`
//   - 保存済みのテンプレートの名前を指定します。
// - \`override_times\`、\`override_delay\`
//   - \`/template load\` コマンドと同じです。
    return interaction.reply({ content: text, flags: MessageFlags.Ephemeral }).catch(_ => _);
  }
}
