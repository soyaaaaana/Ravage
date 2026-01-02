//@ts-check
/// <reference path="./../types.d.ts" />

const { EmbedBuilder, MessageFlags, InteractionContextType, AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require("fs").promises;
const path = require("path");

const official_template_dir = path.join(__maindir, ".data", "official_template");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("セットアップの公式テンプレートを読み込みます。")
    .addSubcommand(subcommand =>
      subcommand
        .setName("load")
        .setDescription("公式が作成したテンプレートを読み込みます。")
        .addStringOption(option =>
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(option =>
          option
            .setName("override_times")
            .setDescription("1度のボタンクリックで送信するメッセージの回数のオーバーライド（範囲は1～6、バージョン4以前は1～5のみ）")
            .setMinValue(1)
            .setMaxValue(6)
        )
        .addIntegerOption(option =>
          option
            .setName("override_delay")
            .setDescription("メッセージの送信間隔のオーバーライド（秒）")
            .setMinValue(0)
            .setMaxValue(60)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("list")
        .setDescription("公式が作成したテンプレートのリストを出力します。")
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("export")
        .setDescription("公式が作成したテンプレートをJSON形式でエクスポートします。")
        .addStringOption(option =>
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("preview")
        .setDescription("公式が作成したテンプレートをプレビューします。")
        .addStringOption(option =>
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName("execute")
        .setDescription("公式が作成したテンプレートを読み込みんで実行します（自動化用）")
        .addStringOption(option =>
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
            .setAutocomplete(true)
        )
        .addIntegerOption(option =>
          option
            .setName("override_times")
            .setDescription("1度のボタンクリックで送信するメッセージの回数のオーバーライド（範囲は1～6、バージョン4以前は1～5のみ）")
            .setMinValue(1)
            .setMaxValue(6)
        )
        .addIntegerOption(option =>
          option
            .setName("override_delay")
            .setDescription("メッセージの送信間隔のオーバーライド（秒）")
            .setMinValue(0)
            .setMaxValue(60)
        )
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    // get command id
    // (await interaction.client.application.commands.fetch()).find(command => command.name === "template")?.id
    const subcommandgroup = interaction.options.getSubcommandGroup(false);
    const subcommand = (subcommandgroup ? subcommandgroup + " " : "") + interaction.options.getSubcommand(false);
    const template = interaction.options.getString("name") ?? "";
    const official_template_file = path.join(official_template_dir, template);
    switch (subcommand) {
      case "load": {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(official_template_file)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        /**
         * @type {{ message: string, times: number, delay?: number, version: string }}
         */
        const template_data = JSON.parse(await fs.readFile(official_template_file, "utf-8"));
        const times = interaction.options.getInteger("override_times") ?? template_data.times ?? (template_data.version === "v4" ? 6 : 5);
        if (template_data.version !== "v4" && times === 6) {
          return interaction.reply({ content: "バージョンが4以前のものにメッセージ送信回数を6以上にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const delay = interaction.options.getInteger("override_delay") ?? template_data.delay;
        switch (template_data.version) {
          case "v1": {
            return create_button_v1(interaction, times, template_data.message, delay);
          }
          case "v2": {
            return create_button_v2(interaction, times, template_data.message, delay);
          }
          case "v3": {
            return create_button_v3(interaction, times, template_data.message, delay);
          }
          case "v4": {
            return create_button_v4(interaction, times, template_data.message, delay);
          }
          default: {
            return interaction.reply({ content: "テンプレートに設定されているバージョンは存在しませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
        }
      }
      case "list": {
        const files = await fsExists(official_template_dir) ? await fs.readdir(official_template_dir) : [];
        if (files.length) {
          const content = files.map(file => `\`${file}\``).join("\n");
          const content2 = files.join("\n");
          const reply = "テンプレートのリスト\n"
          
          if ((reply + content).length <= 2000) {
            return interaction.reply({ content: reply + content, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          else if ((reply + content2).length <= 2000) {
            return interaction.reply({ content: reply + content2, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          else {
            return interaction.reply({ content: reply.trim(), files: [new AttachmentBuilder(Buffer.from(content2, "utf-8"), { name: "template-list.txt" })], flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
        }
        else {
          return interaction.reply({ content: "公式が作成したテンプレートはまだないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
      }
      case "export": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (!await fsExists(official_template_file)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        return interaction.reply({ embeds: [
          new EmbedBuilder()
            .setColor("#2ecc71")
            .setTitle("テンプレートのエクスポート")
            .setDescription(`エクスポートに成功しました！\`\`\`\n${await fs.readFile(official_template_file, "utf-8")}\`\`\``)
        ], flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "preview": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(official_template_file)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        /**
         * @type {{ message?: string, times?: number, delay?: number, version?: string }}
         */
        const template_data = JSON.parse(await fs.readFile(official_template_file, "utf-8"));
        switch (template_data.version) {
          case "v1": {
            return interaction.reply({ content: JSON.parse(template_data?.message ?? default_message), allowedMentions: { parse: ["everyone", "roles", "users"] }, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          case "v2": {
            return interaction.reply({ content: template_data?.message?.replaceAll("\\n", "\n")?.replaceAll("\\n", "\n"), allowedMentions: { parse: ["everyone", "roles", "users"] }, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          case "v3": {
            return interaction.reply({ content: template_data?.message?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")), allowedMentions: { parse: ["everyone", "roles", "users"] }, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          case "v4": {
            return interaction.reply({ content: template_data?.message, allowedMentions: { parse: ["everyone", "roles", "users"] }, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          default: {
            return interaction.reply({ content: "テンプレートに設定されているバージョンは存在しませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
        }
      }
      case "execute": {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (!await fsExists(official_template_file)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)) {
          return interaction.reply({ content: "このチャンネルでは外部のアプリを使用できないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        /**
         * @type {{ message?: string, times?: number, delay?: number, version?: string }}
         */
        const template_data = JSON.parse(await fs.readFile(official_template_file, "utf-8"));
        const times = interaction.options.getInteger("override_times") ?? template_data.times ?? (template_data.version === "v4" ? 6 : 5);
        const delay = interaction.options.getInteger("override_delay") ?? template_data.delay;

        if (template_data.version !== "v4" && times === 6) {
          return interaction.reply({ content: "バージョンが4以前のものにメッセージ送信回数を6以上にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        
        switch (template_data.version) {
          case "v1": {
            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            for (let i = 0; i < (times ?? 5); i++) {
              if (delay && i != 0) {
                await sleep(delay * 1000);
              }
              interaction.followUp({ content: JSON.parse(template_data?.message ?? default_message), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
            break;
          }
          case "v2": {
            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            for (let i = 0; i < (times ?? 5); i++) {
              if (delay && i != 0) {
                await sleep(delay * 1000);
              }
              interaction.followUp({ content: template_data?.message?.replaceAll("\\n", "\n")?.replaceAll("\\n", "\n"), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
            break;
          }
          case "v3": {
            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            for (let i = 0; i < (times ?? 5); i++) {
              if (delay && i != 0) {
                await sleep(delay * 1000);
              }
              interaction.followUp({ content: template_data?.message?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
            break;
          }
          case "v4": {
            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            for (let i = 0; i < ((times ?? 5) == 6 ? 5 : times ?? 5); i++) {
              if (delay && i != 0) {
                await sleep(delay * 1000);
              }
              interaction.followUp({ content: template_data?.message, allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
            break;
          }
          default: {
            return interaction.reply({ content: "テンプレートに設定されているバージョンは存在しませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
        }
      }
    }
  },
  /** @param {import("discord.js").AutocompleteInteraction<import("discord.js").CacheType>} interaction */
  async autocomplete(interaction) {
    const files = await fsExists(official_template_dir) ? await fs.readdir(official_template_dir) : [];
    const focused = interaction.options.getFocused(true);
    /** @type {string[]} */
    let choices = [];
    if (focused.name === 'name') {
      choices = files;
    }
    const filtered = choices.filter((choice) => choice.length <= 100 && choice.startsWith(focused.value)).slice(0, 25);
    await interaction.respond(filtered.map((choice) => ({ name: choice, value: choice })));
  }
}
