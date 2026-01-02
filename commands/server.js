//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder, ContainerBuilder, ComponentType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("このBOTを運用しているサーバーの情報を表示します。")
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    // return interaction.reply({ content: `サーバー名: ${app_config.server_name ?? "情報が提供されていません。"}\nアプリ名: ${app_config.application_name}`, flags: MessageFlags.Ephemeral }).catch(_ => _);
    return interaction.reply({
      components: [
        new ContainerBuilder({
          components: [
            {
              content: "### サーバー情報",
              type: ComponentType.TextDisplay
            },
            {
              type: ComponentType.Separator
            },
            {
              content: "**アプリ名**\n" + app_config.application_name,
              type: ComponentType.TextDisplay
            },
            {
              content: "**サーバー名**\n" + app_config.server_name,
              type: ComponentType.TextDisplay
            },
          ]
        })
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
    })
  }
}
