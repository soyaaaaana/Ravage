//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("\/exec1~5にメッセージを登録します。")
    .addStringOption(option =>
      option
        .setName("slot")
        .setDescription("登録先のスロット")
        .addChoices(
          { name: "スロット1", value: "1" },
          { name: "スロット2", value: "2" },
          { name: "スロット3", value: "3" },
          { name: "スロット4", value: "4" },
          { name: "スロット5", value: "5" }
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("送信するメッセージの内容（\\nで改行）")
        .setMaxLength(4000)
    )
    .addIntegerOption(option =>
      option
        .setName("times")
        .setDescription("1度のボタンクリックで送信するメッセージの回数（範囲は1～6）")
        .setMinValue(1)
        .setMaxValue(6)
    )
    .addIntegerOption(option =>
      option
        .setName("delay")
        .setDescription("メッセージの送信間隔（秒）")
        .setMinValue(0)
        .setMaxValue(60)
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    const slot = interaction.options.getString("slot") ?? "1";
    const slot_num = Number(slot);
    if (Number.isNaN(slot_num) || (slot_num < 1 && 5 < slot_num)) {
      return interaction.reply({ content: "スロットは1～5のみ利用可能です。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const dir = path.join(__maindir, ".data", "registered_messages", interaction.user.id);
    const file = path.join(dir, slot);
    if (interaction.options.getString("message") != null) {
      await fs.mkdir(dir, { recursive: true });
      const message = interaction.options.getString("message")?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")) ?? "";
      if (message.length > 2000) {
        return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      if (!message.trim().length) {
        return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      const times = interaction.options.getInteger("times") ?? 6;
      const delay = interaction.options.getInteger("delay") ?? undefined;
      await fs.writeFile(file, JSON.stringify({ message: message, times: times, delay: delay, version: "v4" }), "utf-8");
      return interaction.reply({ content: `スロット${slot}にメッセージを保存しました。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    else {
      if (await fsExists(file)) {
        await fs.unlink(file);
      }
      return interaction.reply({ content: `スロット${slot}からメッセージを削除しました。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
}
