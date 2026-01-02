//@ts-check
/// <reference path="./../types.d.ts"/>

const path = require("path");
const fs = require("fs");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("自身と関連付けられているデータを全て削除します。")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    const dirs = [path.join(__maindir, ".data", "template", interaction.user.id), path.join(__maindir, ".data", "settings", interaction.user.id)];
    if (dirs.map(dir => fs.existsSync(dir)).filter(value => value).length) {
      interaction.reply({ content: "本当にデータを完全に削除しますか？\nこの操作を実行したら元に戻すことはできません。元に戻す予定があるならデータをメモしたり1つずつ丁寧にエクスポートしておきましょう。\n※あなた自身と関連付けられているデータのみ削除します。つまり設定とテンプレートのデータのみ削除します。\n※/setupコマンドや、/template loadコマンドなどでボタンを作成した場合などにサーバーに作成される一時ファイルはユーザーと関連付けされないためこのコマンドで削除されませんが、2週間経過すると自動的に削除されます。" + (app_config.logger ? "\n**※このBOTサーバーはログの保存が有効になっています。このデータは削除できませんが、共有されない限りBOT運営者以外に閲覧することはできません。**" : ""), components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("delete:confirm").setLabel("データを完全に削除").setStyle(ButtonStyle.Danger)).toJSON()], flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    else {
      interaction.reply({ content: "一生懸命データ探したんですけどそもそもありませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
}
