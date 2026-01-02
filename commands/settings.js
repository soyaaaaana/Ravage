//@ts-check
/// <reference path="./../types.d.ts"/>

const path = require("path");
const fs = require("fs").promises;
const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription(`${app_config.application_name}の設定`)
    .addSubcommandGroup(subcommandgroup => 
      subcommandgroup
        .setName("set")
        .setDescription(`${app_config.application_name}の設定を変更します。`)
        .addSubcommand(subcommand =>
          subcommand
            .setName("default_message")
            .setDescription("setupコマンドなどでmessage引数が設定されなかったときのデフォルトメッセージを設定します。")
            .addStringOption(option =>
              option
                .setName("message")
                .setDescription("メッセージ（\\nで改行）")
                .setMaxLength(2000)
            )
        )
    )
    .addSubcommandGroup(subcommandgroup =>
      subcommandgroup
        .setName("get")
        .setDescription(`${app_config.application_name}の現在の設定を取得します。`)
        .addSubcommand(subcommand =>
          subcommand
            .setName("default_message")
            .setDescription("setupコマンドなどでmessage引数が設定されなかったときのデフォルトメッセージの設定を取得します。")
        )
    )
    
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    switch (interaction.options.getSubcommand(false)) {
      case "default_message": {
        const dir = path.join(__maindir, ".data", "settings", interaction.user.id);
        const file = path.join(dir, "default_message");
        switch (interaction.options.getSubcommandGroup(false)) {
          case "get": {
            if (await fsExists(file)) {
              return interaction.reply({ content: `\`\`\`\n${await fs.readFile(file, "utf-8")}\n\`\`\``, flags: MessageFlags.Ephemeral }).catch(_ => _);
            }
            else {
              return interaction.reply({ content: `未設定です`, flags: MessageFlags.Ephemeral }).catch(_ => _);
            }
          }
          case "set": {
            const message = interaction.options.getString("message");
            if (message) {
              await fs.mkdir(dir, { recursive: true });
              await fs.writeFile(file, message.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")), "utf-8");
              interaction.reply({ content: "設定を正常に変更しました", flags: MessageFlags.Ephemeral }).catch(_ => _);
            }
            else {
              if (await fsExists(file)) {
                await fs.unlink(file);
                return interaction.reply({ content: "設定を削除しました", flags: MessageFlags.Ephemeral }).catch(_ => _);
              }
              return interaction.reply({ content: "既に未設定です", flags: MessageFlags.Ephemeral }).catch(_ => _);
            }
          }
        }
      }
    }
  }
}
