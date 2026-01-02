//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("このBOTのインストールリンクを表示します。")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    return interaction.reply({ content: `${app_config.application_name}のインストールリンクはこちらです。\nhttps://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&integration_type=1&scope=applications.commands${app_config.application_name === "Ravage" ? `\nまたは、こちらの固定リンクを使用することも可能です。\nhttps://ravage-api.soyaaaaana.com/install` : ""}`, flags: MessageFlags.Ephemeral }).catch(_ => _);
  }
}
