//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("メッセージ送信をボタンなしで実行します（自動化用）")
    .addStringOption(option => 
      option
        .setName("message")
        .setDescription("送信するメッセージの内容（\\nで改行）")
        .setMaxLength(4000)
    )
    .addIntegerOption(option => 
      option
        .setName("times")
        .setDescription("1度のボタンクリックで送信するメッセージの回数（範囲は1～5）")
        .setMinValue(1)
        .setMaxValue(5)
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
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    const default_message_path = path.join(__maindir, ".data", "settings", interaction.user.id, "default_message");
    let message = interaction.options.getString("message")?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")) ?? (await fsExists(default_message_path) ? await fs.readFile(default_message_path, "utf-8") : default_message);

    if (message.length > 2000) {
      return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    if (!message.trim().length) {
      return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    const times = interaction.options.getInteger("times") ?? 5;
    const delay = interaction.options.getInteger("delay");

    if (interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)) {
      await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
      for (let i = 0; i < times; i++) {
        if (delay && i != 0) {
          await sleep(delay * 1000);
        }
        interaction.followUp({ content: message, allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
      }
    }
    else {
      return interaction.reply({ content: "このチャンネルでは外部のアプリを使用できないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
}
