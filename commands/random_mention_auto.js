//@ts-check
/// <reference path="./../types.d.ts" />

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");
const uuid = require("uuid");
const path = require("path");
const fs = require("fs").promises;

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("ランダムメンションを実行します。ravage.soyaaaaana.com を使用してください。")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("メッセージ")
        .setRequired(true)
    )
    .addStringOption(option => 
      option
        .setName("uuid")
        .setDescription(`${app_config.application_name}サーバーに保存されたメンバーリストの内部ID`)
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    const warn = "\n\nこのコマンドは[ravage.soyaaaaana.com](<https://ravage.soyaaaaana.com>)用に作成されたコマンドです。通常利用向けに作成されたコマンドではありません。";
    const uuid_str = interaction.options.getString("uuid");
    if (uuid_str == null) {
      return interaction.reply({ content: "uuidがnullです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    if (!uuid.validate(uuid_str)) {
      return interaction.reply({ content: "指定された内部IDは有効な形式ではありません。" + warn, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const file_path = path.join(global.__maindir, ".data", "members_data", uuid_str);
    if (!await fsExists(file_path)) {
      return interaction.reply({ content: "指定された内部IDに関連付けられたデータはサーバーに存在しませんでした。" + warn, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const members = (await fs.readFile(file_path, "utf-8")).split(",");
    /** @type string */
    let message = interaction.options.getString("message")?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")) ?? default_message;
    let escape_count = 0;
    let count = 0;
    Array.from(message.match(/(\\+?)r/g) ?? []).forEach((match) => {
      escape_count += match.length - match.replaceAll("\\\\", "\\").length;
      if ((match.match(/\\/g) ?? []).length % 2 !== 0) {
        count++;
      }
    });
    const max_length = 2000 + (escape_count) - (count * 20);
    if (message.length > max_length) {
      return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。" + warn, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
    function generateRandomMention() {
      return `<@${members[Math.floor(Math.random() * members.length)]}>`;
    }
    for (let i = 0; i < 5; i++) {
      await interaction.followUp({ content: message.replace(/(\\+?)r/g, (match) => (match.match(/\\/g) ?? []).length % 2 === 0 ? match.replaceAll("\\\\", "\\") : match.replaceAll("\\\\", "\\").replace("\\r", generateRandomMention())), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
    }
  }
}
