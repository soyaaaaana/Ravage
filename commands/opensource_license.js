//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder, ContainerBuilder, ComponentType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("オープンソースライセンスを表示します。")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    return interaction.reply({
      components: [
        new ContainerBuilder({
          components: [
            {
              content: "### オープンソース ライセンス",
              type: ComponentType.TextDisplay
            },
            {
              type: ComponentType.Separator
            },
            {
              content: "**作者**\nそやーな (1225686714484527154)",
              type: ComponentType.TextDisplay
            },
            {
              content: "**リポジトリ**\n<https://github.com/soyaaaaana/Ravage>",
              type: ComponentType.TextDisplay
            },
            {
              content: "**ライセンス**\nMITライセンス",
              type: ComponentType.TextDisplay
            },
            {
              content: "**ライセンスの簡単な説明**\n自由に使用、改変、再配布することができますが、著作権表示とライセンス文を保持する必要があります。\nライセンスに記述されている著作権者の名前は、GitHubの名前に合わせられています。",
              type: ComponentType.TextDisplay
            },
            {
              content: "**ライセンスの日本語訳**\n以下は、MITライセンスの日本語訳です。参考程度に使用してください。日本語訳のライセンスに誤りや、英語のライセンスとの相違があった場合、英語のライセンス（下部の「ライセンスの全文」）の方が優先されます。\n" + `
\`\`\`
Copyright (c) 2026 そゃーな

本ソフトウェアおよび関連する文書のファイル（以下「ソフトウェア」）の複製を取得した全ての人物に対し、以下の条件に従うことを前提に、ソフトウェアを無制限に扱うことを無償で許可します。これには、ソフトウェアの複製を使用、複製、改変、結合、公開、頒布、再許諾、および/または販売する権利、およびソフトウェアを提供する人物に同様の行為を許可する権利が含まれますが、これらに限定されません。

上記の著作権表示および本許諾表示を、ソフトウェアの全ての複製または実質的な部分に記載するものとします。

ソフトウェアは「現状有姿」で提供され、商品性、特定目的への適合性、および権利の非侵害性に関する保証を含むがこれらに限定されず、明示的であるか黙示的であるかを問わず、いかなる種類の保証も行われません。著作者または著作権者は、契約、不法行為、またはその他の行為であるかを問わず、ソフトウェアまたはソフトウェアの使用もしくはその他に取り扱いに起因または関連して生じるいかなる請求、損害賠償、その他の責任について、一切の責任を負いません。
\`\`\``.trim(),
              type: ComponentType.TextDisplay
            },
            {
              content: "**ライセンスの全文**\n" + `
\`\`\`
MIT License

Copyright (c) 2026 そゃーな

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
\`\`\``.trim(),
              type: ComponentType.TextDisplay
            },
          ]
        })
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
    })
  }
}
