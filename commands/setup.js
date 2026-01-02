//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require('discord.js');
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("ボタンのセットアップをします。")
    .addStringOption(option => 
      option
        .setName("message")
        .setDescription("送信するメッセージの内容（\\nで改行）")
        .setMaxLength(4000)
    )
    .addIntegerOption(option => 
      option
        .setName("times")
        .setDescription("1度のボタンクリックで送信するメッセージの回数（範囲は1～6、バージョン4以前は1～5のみ）")
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
    .addStringOption(option => 
      option
        .setName("version")
        .setDescription("コマンドのバージョン")
        .addChoices(
          { name: "バージョン1", value: "v1" },
          { name: "バージョン2", value: "v2" },
          { name: "バージョン3", value: "v3" },
          { name: "バージョン4", value: "v4" },
          { name: "ベータバージョン", value: "beta" }
        )
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    const version = interaction.options.getString("version") ?? "v4";
    let message = interaction.options.getString("message");
    if (!message) {
      const default_message_file = path.join(__maindir, ".data", "settings", interaction.user.id, "default_message");
      if (await fsExists(default_message_file)) {
        message = await fs.readFile(default_message_file, "utf-8");
      }
      else {
        message = default_message;
      }
    }

    if (version === "v4") {
      message = message.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n"));
    }
    
    if (message.length > 2000) {
      return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    if (!message.trim().length) {
      return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    const times = interaction.options.getInteger("times") ?? (version === "v4" ? 6 : 5);
    const delay = interaction.options.getInteger("delay");

    if (version !== "v4" && times === 6) {
      return interaction.reply({ content: "バージョンが4以前のものにメッセージ送信回数を6以上にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    
    switch (version) {
      case "v1" : {
        return create_button_v1(interaction, times, message, delay);
      }
      case "v2": {
        return create_button_v2(interaction, times, message, delay);
      }
      case "v3": {
        return create_button_v3(interaction, times, message, delay);
      }
      case "v4": {
        return create_button_v4(interaction, times, message, delay);
      }
      case "beta": {
        if (interaction.user.id !== "1225686714484527154") return interaction.reply({ content: "ベータ版にアクセスできないユーザーです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        return interaction.reply({ content: 'ベータバージョンに機能パッチがありません。', flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
    }
  }
}
