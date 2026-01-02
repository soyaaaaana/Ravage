//@ts-check
/// <reference path="./../types.d.ts"/>

const { EmbedBuilder, MessageFlags, InteractionContextType, AttachmentBuilder, PermissionFlagsBits, SlashCommandBuilder } = require('discord.js');
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("セットアップのテンプレートを作成/読み込み/削除できます。")
    .addSubcommand(subcommand => 
      subcommand
        .setName("create")
        .setDescription("テンプレートを作成します。")
        .addStringOption(option => 
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
        )
        .addStringOption(option => 
          option
            .setName("message")
            .setDescription("送信するメッセージの内容（\\nで改行）")
            .setMaxLength(4000)
            .setRequired(true)
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
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName("load")
        .setDescription("作成済みのテンプレートを読み込みます。")
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
        .setDescription("作成済みのテンプレートのリストを出力します。")
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName("export")
        .setDescription("作成済みのテンプレートをJSON形式でエクスポートします。")
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
        .setName("import")
        .setDescription("JSON形式のテンプレートをインポートします。")
        .addStringOption(option => 
          option
            .setName("name")
            .setDescription("テンプレート名")
            .setMaxLength(255)
            .setRequired(true)
        )
        .addStringOption(option => 
          option
            .setName("json")
            .setDescription("JSON形式のテンプレート")
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand => 
      subcommand
        .setName("delete")
        .setDescription("作成済みのテンプレートを削除します。")
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
        .setDescription("作成済みのテンプレートのプレビューを表示します。")
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
        .setDescription("作成済みのテンプレートを読み込みんで実行します（自動化用）")
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
    const version = interaction.options.getString("version") ?? "v4";
    let message = interaction.options.getString("message") ?? "";
    if (version === "v4") {
      message = message.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n"));
    }
    if (message.length > 2000) {
      return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const times = interaction.options.getInteger("times") ?? (version === "v4" ? 6 : 5);
    if (version !== "v4" && times === 6) {
      return interaction.reply({ content: "バージョンが4以前のものにメッセージ送信回数を6以上にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const delay = interaction.options.getInteger("delay") ?? undefined;
    const folder_path = path.join(__maindir, ".data", "template", interaction.user.id);
    const file_path = path.join(folder_path, template);
    switch (subcommand) {
      case "create": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        await fs.mkdir(folder_path, { recursive: true });
        if (await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は既に使われています。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        await fs.writeFile(file_path, JSON.stringify({ message: message, times: times, delay: delay, version: version }), "utf-8");
        return interaction.reply({ content: `テンプレート \`${template}\` を作成しました。\n</template load:${interaction.commandId}> コマンドで読み込めます。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "load": {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        //return interaction.reply({ content: "「実行」ボタンを押してください。", components: [ new MessageActionRow().addComponents(new MessageButton().setCustomId(`start:template_v1,${template}`).setLabel('実行').setStyle(1)) ], ephemeral: true });

        /**
         * @type {{ message: string, times: number, delay?: number, version: string }}
         */
        const template_data = JSON.parse(await fs.readFile(file_path, "utf-8"));
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
        const files = await fsExists(folder_path) ? await fs.readdir(folder_path) : [];
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
          return interaction.reply({ content: "作成済みのテンプレートがありません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
      }
      case "export": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        return interaction.reply({ embeds: [new EmbedBuilder().setColor("#2ecc71").setTitle("テンプレートのエクスポート").setDescription(`エクスポートに成功しました！\`\`\`\n${await fs.readFile(file_path, "utf-8")}\`\`\``)], flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "import": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は既に使われています。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        /**
         * @type {{ message?: string, times?: number, delay?: number, version?: string }}
         */
        let json_data = {};
        try {
          json_data = JSON.parse(interaction.options.getString("json") ?? "");
        }
        catch {
          return interaction.reply({ content: "指定されたJSONデータは正しいJSONではありませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        /**
         * @type {{ message?: string, times?: number, delay?: number, version?: string }}
         */
        let data = {};
        let error_interaction = {};
        Object.keys(json_data).forEach(key => {
          switch (key) {
            case "message": {
              if (String(json_data[key]).length) {
                data[key] = String(json_data[key]);
              }
              else {
                return error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\nJSONデータの \`${key}\` は1文字以上、2000文字以下の範囲でのみ指定できます。`, flags: MessageFlags.Ephemeral };
              }
              break;
            }
            case "times": {
              const data_times = Number(json_data[key]);
              if (!Number.isNaN(data_times) && data_times >= 1 && 6 >= data_times) {
                data[key] = json_data[key];
              }
              else {
                return error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\nJSONデータの \`${key}\` は、1から6までの整数のみ指定できます。`, flags: MessageFlags.Ephemeral };
              }
              break;
            }
            case "delay": {
              const data_delay = Number(json_data[key]);
              if (data_delay == null || (!Number.isNaN(data_delay) && data_delay >= 1 && 60 >= data_delay)) {
                data[key] = json_data[key];
              }
              else {
                return error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\nJSONデータの \`${key}\` は未設定、null、または0から60までの整数のみ指定できます。`, flags: MessageFlags.Ephemeral };
              }
              break;
            }
            case "version": {
              switch(json_data[key]) {
                case "v1":
                case "v2":
                case "v3":
                case "v4":
                case "beta": {
                  data[key] = json_data[key];
                  break;
                }
                default: {
                  return error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\nJSONデータの \`${key}\` は、「v1」、「v2」、「v3」、「v4」、「beta」のみ指定できます。`, flags: MessageFlags.Ephemeral };
                }
              }
              if (error_interaction) {
                return;
              }
              break;
            }
            default: {
              return error_interaction = { content: `指定されたJSONデータの \`${key}\` が不明です。`, flags: MessageFlags.Ephemeral };
            }
          }
        });
        if (data.version !== "v4" && data.times === 6) {
          error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\nJSONデータの \`version\` は、バージョンが4以前の場合1から5までの整数のみ指定できます。`, flags: MessageFlags.Ephemeral };
        }
        if (Object.keys(error_interaction).length) {
          return interaction.reply(error_interaction).catch(_ => _);
        }
        const require_keys = ["message", "times", "version"];
        const missing_keys = require_keys.filter(key => !Object.keys(data).includes(key));
        if (missing_keys.length) {
          error_interaction = { content: `指定されたJSONデータは正しい形式ではありません。\n${missing_keys.map(key => key.wrapWith("`").wrapWith(" ")).join("、").replace(" ", "").replaceAll("、 ", "、")}キーが不足しています。`, flags: MessageFlags.Ephemeral };
        }
        if (Object.keys(error_interaction).length) {
          return interaction.reply(error_interaction).catch(_ => _);
        }
        await fs.mkdir(folder_path, { recursive: true });
        await fs.writeFile(file_path, JSON.stringify(data), "utf-8");
        return interaction.reply({ content: `テンプレートを \`${template}\` として正常にインポートしました。\n</template load:${interaction.id}> コマンドで読み込めます。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "delete": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        await fs.unlink(file_path);
        return interaction.reply({ content: `テンプレート \`${template}\` を削除しました。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "preview": {
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        /**
         * @type {{ message: string, times: number, delay?: number, version: string }}
         */
        const template_data = JSON.parse(await fs.readFile(file_path, "utf-8"));
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

        if (!await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は存在しませんでした。`, ephemeral: true }).catch(_ => _);
        }
        
        if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)) {
          return interaction.reply({ content: "このチャンネルでは外部のアプリを使用できないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }

        /**
         * @type {{ message: string, times: number, delay?: number, version: string }}
         */
        const template_data = JSON.parse(await fs.readFile(file_path, "utf-8"));
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
    const folder_path = path.join(__maindir, ".data", "template", interaction.user.id);
    const files = await fsExists(folder_path) ? await fs.readdir(folder_path) : [];
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
