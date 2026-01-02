//@ts-check
/// <reference path="./types.d.ts" />

// i love TypeScript check

process.chdir(__dirname);
global.__maindir = __dirname;

const fs = require("fs").promises;
const path = require("path");

const fsSync = require("fs");

const config_filepath = path.join(__maindir, "config.json");
const config_json = fsSync.existsSync(config_filepath) ? JSON.parse(fsSync.readFileSync(config_filepath, "utf-8")) : {};
global.app_config = {
  application_name: config_json.application_name ?? "Ravage",
  server_name: config_json.server_name ?? null,
  logger: config_json.logger ?? false,
  debug: config_json.debug ?? false,
  port: config_json.port ?? 3000,
  api_password: config_json.api_password ?? null,
  selfbot_notify: config_json.selfbot_notify,
}

// メッセージがなにも指定されていない場合に使用されるサーバー側で定義されたメッセージ
global.default_message = `# Raid by ${app_config.application_name}!!\n# Raid by ${app_config.application_name}!!\n# Raid by ${app_config.application_name}!!\n@everyone`;

const vulnerable_password = /^.{0}$|^.{0,15}$|^([a-z0-9])\1{0,50}$|^\d{0,8}$|^admin(istrator)?$|^(p(a|@)(s|5){2}w(o|0)rd){2}$/i;

if (app_config.api_password != null && vulnerable_password.test(app_config.api_password)) {
  app_config.api_password = null;
  console.warn("APIパスワードが脆弱なため、APIパスワードは無効になっています。");
}

global.message_cache = {};

// モジュールのインポート（存在する前提）
require(path.join(__maindir, "modules"));

const trusted_users_path = path.join(__maindir, ".data", "server", "trusted_users.json");
global.trusted_users = fsSync.existsSync(trusted_users_path) ? JSON.tryParse(fsSync.readFileSync(trusted_users_path, "utf-8")) ?? [] : [];

const ban_dir = path.join(__maindir, ".data", "ban");
global.banned_users = getFileNamesInDirectorySync(ban_dir);

require('dotenv').config({
  quiet: true,
});

if (config_json.token) {
  process.env.DISCORD_TOKEN = config_json.token;
}
else {
  if (!process.env.DISCORD_TOKEN) {
    console.error(".env に DISCORD_TOKEN が存在しません。");
    process.exit(1);
  }
  // else {
  //   console.error("アプリケーション構成ファイルにDiscordトークンの値が存在しません。");
  //   process.exit(1);
  // }
}

process.env.DISCORD_CLIENT_ID = Buffer.from(process.env.DISCORD_TOKEN.split(".")[0], "base64").toString();
if (!process.env.DISCORD_CLIENT_ID) {
  console.error("アプリケーション構成ファイルのDiscordトークンの値の形式が間違っています。");
  process.exit(1);
}

/** @param {string} message */
async function sendSelfbotNotify(message) {
  if (app_config.selfbot_notify && app_config.selfbot_notify.token && app_config.selfbot_notify.channel_id) {
    const res = await fetch(`https://discord.com/api/v9/channels/${app_config.selfbot_notify?.channel_id}/messages`, {
      headers: {
        authorization: String(app_config.selfbot_notify?.token),
        "content-type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        mobile_network_type: "unknown",
        content: message,
        tts: false,
        flags: 0
      }),
    });

    const message_content = "\nメッセージ内容:\n" + message.replaceAll("\r", "").split("\n").map(text => "  " + text.trim()).join("\n");
    if (res.ok) {
      log("セルフボットで通知を送信しました。" + message_content);
    }
    else {
      log(`セルフボットで通知を送信できませんでした。\nHTTPステータスコード: ${res.status}${message_content}`);
    }
  }
}

if (app_config.selfbot_notify && app_config.selfbot_notify.token && app_config.selfbot_notify.channel_id) {
  if (/^\d+$/.test(app_config.selfbot_notify.channel_id)) {
    console.log("セルフボットを使用した通知は有効です。（トークンの検証はしていません）");
    if (app_config.selfbot_notify.notified_token && process.env.DISCORD_TOKEN.split(".")[0] !== app_config.selfbot_notify.notified_token) {
      let json = config_json;
      app_config.selfbot_notify.notified_token = process.env.DISCORD_TOKEN.split(".")[0];
      json.selfbot_notify.notified_token = app_config.selfbot_notify.notified_token;
      fsSync.writeFileSync(config_filepath, JSON.stringify(json, null, 2), "utf-8");

      sendSelfbotNotify(`${app_config.application_name}が復活したよ！\nhttps://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&integration_type=1&scope=applications.commands`);
    }
  }
  else {
    app_config.selfbot_notify = null;
    console.log("config.json の selfbot_notify.channel_id の形式が無効なため、セルフボットを使用した通知は無効です。");
  }
}

if (config_json.public_key) {
  process.env.DISCORD_PUBLIC_KEY = config_json.public_key;
}
else {
  if (!process.env.DISCORD_PUBLIC_KEY) {
    process.env.DISCORD_PUBLIC_KEY = null;
  }
}

const { Client, Collection, GatewayIntentBits, MessageFlags, Events, PermissionsBitField, PermissionFlagsBits } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

/**
 * @type {{
 *  intents: import("discord.js").GatewayIntentBits[],
 *  rest?: {
 *   agent: import("undici").ProxyAgent,
 *  }
 * }}
 */
const client_options = {
  intents: [GatewayIntentBits.DirectMessages],
};

if (config_json.http_proxy) {
  if (URL.canParse(config_json.http_proxy)) {
    client_options.rest = {
      agent: new (require('undici')).ProxyAgent(config_json.http_proxy),
    }
  }
  else {
    console.error("config.json の http_proxy が無効な形式のため、HTTPプロキシは使用されません。");
  }
}

//@ts-ignore
const client = new Client(client_options);

client.once(Events.ClientReady, async () => {
  client.user?.setStatus("online");
  console.log(`${client.user?.tag} がログインしました。`);
  //@ts-ignore
  global.random_mention_auto_cache = (await client.application.commands.fetch())?.find(command => command.name === "random_mention_auto")?.toJSON();
  Object.keys(random_mention_auto_cache).forEach(key => {
    if (random_mention_auto_cache[key] === null) delete random_mention_auto_cache[key];
  });
});

const command_collection = new Collection();

const commands = [];
const commandFiles = fsSync.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
  command_collection.set(command.data.name, command);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands })
    .then(async() => console.log('スラッシュコマンドを更新しました。'))
    .catch(console.error);

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    //@ts-ignore
    if (await banCheck(interaction)) {
      return;
    }

    if (app_config.logger) {
      const subcommandgroup = interaction.options.getSubcommandGroup(false) ?? "";
      const subcommand = (subcommandgroup ? subcommandgroup + " " : "") + (interaction.options.getSubcommand(false) ?? "");

      

      log(`${interaction.user.username}(${interaction.user.id}) => Executed chat input command(${interaction.guildId}): /${interaction.commandName + (subcommand ? " " + subcommand : "")}`);
      
    }

    const command = command_collection.get(interaction.commandName);
    
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: 'コマンド実行時にエラーが発生しました', flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
  else if (interaction.isButton()) {
    log(`${interaction.user.username}(${interaction.user.id}) => Executed button interaction: customId = '${interaction.customId}'`);

    if (interaction.customId.startsWith("start:")) {
      //@ts-ignore
      if (await banCheck(interaction)) {
        return;
      }
      
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      
      if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)) {
        return interaction.reply({ content: "このチャンネルでは外部のアプリを使用できないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      
      let data = interaction.customId.replace("start:", "").split(/(?<![\\]),/);
      let version = data[0];
      let times = Number(data[1]);
      let message = data[2];
      let file_path = data[2];
      let delay = data.length === 4 ? Number(data[3]) : undefined;
      const default_message_path = path.join(__maindir, ".data", "settings", interaction.user.id, "default_message");
      /** 
       * @param {number} times
       * @param {string} message
       */
      async function execute_v1(times, message) {
        if (!JSON.parse(message).trim().length) {
          //@ts-ignore
          return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        try {
          //@ts-ignore
          await interaction.reply({ content: 'OK', flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        catch(e) {
          console.error(e);
        }
        for (let i = 0; i < times; i++) {
          try {
            if (delay && !Number.isNaN(delay) && i != 0) {
              await sleep(delay * 1000)
            }
            //@ts-ignore
            interaction.followUp({ content: JSON.parse(message), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
          }
          catch (e) {
            console.error(e);
          }
        }
      }
      /**
       * @param {number} times
       * @param {string} message
       */
      async function execute_v2(times, message) {
        if (!message.replaceAll("\\n", "\n").replaceAll("\\n", "\n").trim().length) {
          //@ts-ignore
          return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        try {
          //@ts-ignore
          await interaction.reply({ content: 'OK', flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        catch(e) {
          console.error(e);
        }
        for (let i = 0; i < times; i++) {
          try {
            if (delay && !Number.isNaN(delay) && i != 0) {
              await sleep(delay * 1000)
            }
            //@ts-ignore
            interaction.followUp({ content: message.replaceAll("\\n", "\n").replaceAll("\\n", "\n"), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
          }
          catch(e) {
            console.error(e);
          }
        }
      }
      /**
       * @param {number} times
       * @param {string} file_path
       */
      async function execute_v3(times, file_path) {
        let content;
        if (message_cache[file_path] == null) {
          content = await fsExists(path.join(__maindir, ".data", "temp_message_data", file_path)) ? (await fs.readFile(path.join(__maindir, ".data", "temp_message_data", file_path), "utf-8")).replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")) : (await fsExists(default_message_path) ? await fs.readFile(default_message_path, "utf-8") : default_message);
          message_cache[file_path] = content;
        }
        else {
          content = message_cache[file_path];
        }
        if (!content.trim().length) {
          //@ts-ignore
          return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        try {
          //@ts-ignore
          await interaction.reply({ content: 'OK', flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        catch (e) {
          console.error(e);
        }
        for (let i = 0; i < times; i++) {
          try {
            if (delay && !Number.isNaN(delay) && i != 0) {
              await sleep(delay * 1000)
            }
            // .replace(/(\\+?)n/g, (match) => match.match(/\\/g).length % 2 === 0 ? match.replaceAll("\\\\", "\\") : match.replaceAll("\\\\", "\\").replace("\\n", "\n"))
            //@ts-ignore
            interaction.followUp({ content: content, allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
          }
          catch(e) {
            console.error(e);
          }
        }
      }
      /**
       * @param {number} times
       * @param {string} file_path
       */
      async function execute_v4(times, file_path) {
        let content;
        if (message_cache[file_path] == null) {
          content = await fsExists(path.join(__maindir, ".data", "temp_message_data", file_path)) ? await fs.readFile(path.join(__maindir, ".data", "temp_message_data", file_path), "utf-8") : (await fsExists(default_message_path) ? await fs.readFile(default_message_path, "utf-8") : default_message);
          message_cache[file_path] = content;
        }
        else {
          content = message_cache[file_path];
        }
        if (!content.trim().length) {
          //@ts-ignore
          return interaction.reply({ content: "メッセージの内容を0文字にすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const reply_data = { content: content, allowedMentions: { parse: ["everyone", "roles", "users"] } };
        for (let i = 0; i < times; i++) {
          try {
            //@ts-ignore
            if (!interaction.replied) {
              //@ts-ignore
              await interaction.reply(reply_data);
            }
            else {
              if (delay && !Number.isNaN(delay) && i != 0) {
                await sleep(delay * 1000)
              }
              //@ts-ignore
              interaction.followUp(reply_data).catch(_ => _);
            }
          }
          catch (e) {
            console.error(e);
          }
        }
      }
      async function execute() {
        switch (version) {
          case "v1": {
            execute_v1(times, message);
            break;
          }
          case "v2": {
            execute_v2(times, message);
            break;
          }
          case "v3": {
            execute_v3(times, file_path);
            break;
          }
          case "v4": {
            execute_v4(times, file_path);
            break;
          }
          case "beta": {
            //@ts-ignore
            await interaction.reply({ content: 'ベータバージョンに機能パッチがありません。', flags: MessageFlags.Ephemeral }).catch(_ => _);
            break;
          }
          default: {
            //@ts-ignore
            await interaction.reply({ content: "存在しないバージョンです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
        }
      }
      // data[0] ... バージョン
      // data[1] ... 回数
      // data[2] ... メッセージ
      switch (data[0]) {
        case "template_v1": {
          // data[1] ... テンプレート名
          const folder_path = path.join(__maindir, ".data", "template", interaction.user.id);
          const file_path = path.join(folder_path, data[1]);
          let message = default_message;
          if (await fsExists(file_path)) {
            const json_data = JSON.parse(await fs.readFile(file_path, "utf-8"));
            version = json_data.version;
            times = json_data.times;
            message = json_data.message;
          }
          else {
            await interaction.reply({ content: `テンプレート \`${data[1]}\` が存在しませんでした。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
          }
          execute();
          break;
        }
        default: {
          execute();
          break;
        }
      }
    }
    else if (interaction.customId === "delete:confirm") {
      const dirs = [path.join(__maindir, ".data", "template", interaction.user.id), path.join(__maindir, ".data", "settings", interaction.user.id)];
      if (dirs.map(async dir => await fsExists(dir)).filter(value => value).length) {
        dirs.forEach(async dir => await fs.rm(dir, { recursive: true, force: true }));
        interaction.reply({ content: `${app_config.application_name}サーバーに保存されているあなたのデータは正常に削除されました。\nいままでありがとう、あなたのデータ。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      else {
        interaction.reply({ content: "もうデータがないよ！！", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
    }
    else if (interaction.customId.startsWith("random_mention:")) {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral });
      }
      let uuid_str = interaction.customId.replace("random_mention:", "");
      const filepath = path.join(__maindir, ".data", "random_mention_data", uuid_str);
      if (await fsExists(filepath)) {
        /**
         * @type {{
         *   message: string,
         *   token: string,
         *   type: "user",
         *   members: string[],
         *   all_channels: true,
         *   permissions: {
         *     [x: string]: string;
         *   }
         * } | {
         *   message: string,
         *   token: string,
         *   type: "user",
         *   members: string[],
         *   all_channels: false
         * } | {
         *   message: string,
         *   token: string,
         *   type: "slash",
         *   members: string,
         *   all_channels: true,
         *   permissions: {
         *     [x: string]: string;
         *   }
         * } | {
         *   message: string,
         *   token: string,
         *   type: "slash",
         *   members: string,
         *   all_channels: false
         * }}
         */
        const data = JSON.parse(await fs.readFile(filepath, "utf-8"));
        if (data.type === "slash") {
          // if (interaction.memberPermissions.has(PermissionFlagsBits.ViewChannel) && interaction.memberPermissions.has(PermissionFlagsBits.SendMessages) && interaction.memberPermissions.has(PermissionFlagsBits.UseExternalApps)) {
            const members_data_path = path.join(__maindir, ".data", "members_data", data.members);
            const members = await fsExists(members_data_path) ? (await fs.readFile(members_data_path, "utf-8")).split(",") : ["@everyone"];
            await interaction.reply({ content: applyRandomMention(data.message, members), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            for (let i = 0; i < 5; i++) {
              interaction.followUp({ content: applyRandomMention(data.message, members), allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
          // }
          // else {
          //   await interaction.reply({ content: "このチャンネルで外部のアプリは使用できません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
          // }
        }
        if (data.all_channels) {
          Object.keys(data.permissions).forEach(async channel => {
            if (data.type === "slash" && interaction.channelId === channel) {
              return;
            }
            const permission = new PermissionsBitField(BigInt(data.permissions[channel]));
            if (data.type === "slash") {
              if (permission.has(PermissionFlagsBits.ViewChannel) && permission.has(PermissionFlagsBits.SendMessages) && permission.has(PermissionFlagsBits.UseExternalApps)) {
                await sendInteraction(data.token, data.message, data.members, interaction.applicationId, interaction.guildId, channel);
              }
            }
            else if (data.type === "user") {
              interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
              if (permission.has(PermissionFlagsBits.ViewChannel) && permission.has(PermissionFlagsBits.SendMessages)) {
                for (let i = 0; i < 10; i++) {
                  sendMessage(data.token, data.message, channel, data.members);
                }
              }
            }
          });
        }
        else {
          if (data.type === "user") {
            interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            if (interaction.memberPermissions.has(PermissionFlagsBits.ViewChannel) && interaction.memberPermissions.has(PermissionFlagsBits.SendMessages)) {
              for (let i = 0; i < 10; i++) {
                sendMessage(data.token, data.message, interaction.channelId, data.members);
              }
            }
          }
        }
      }
      else {
        return interaction.reply({ content: "ランダムメンションデータを読み込めませんでした。削除した？", flags: MessageFlags.Ephemeral });
      }
    }
    else if (interaction.customId.startsWith("random_mention_delete:")) {
      let uuid_str = interaction.customId.replace("random_mention_delete:", "");
      const filepath = path.join(__maindir, ".data", "random_mention_data", uuid_str);
      if (await fsExists(filepath)) {
        await fs.unlink(filepath);
        return interaction.reply({ content: "ランダムメンションデータは正常に削除されました。", flags: MessageFlags.Ephemeral });
      }
      else {
        return interaction.reply({ content: "デ　ー　タ　な　ん　か　ね　え　よ||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||||​||https://www.youtube.com/watch?v=HMQsaeFb1IM", flags: MessageFlags.Ephemeral });
      }
    }
  }
  else if (interaction.isModalSubmit()) {
    log(`${interaction.user.username}(${interaction.user.id}) => Modal submitted: customId = '${interaction.customId}'`);

    switch (interaction.customId) {
      case "setup": {
        let message = interaction.fields.getTextInputValue("message");
        if (!message) {
          const default_message_file = path.join(__maindir, ".data", "settings", interaction.user.id, "default_message");
          if (await fsExists(default_message_file)) {
            message = await fs.readFile(default_message_file, "utf-8");
          }
          else {
            message = default_message;
          }
        }
        message = message.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n"));
        if (message.length > 2000) {
          return interaction.reply({ content: "2000文字を超えるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const times_str = interaction.fields.getTextInputValue("times")
        const times = times_str ? Number.parseInt(times_str) : 6;
        if (Number.isNaN(times) || !(times >= 1 && times <= 6)) {
          return interaction.reply({ content: "1回のボタンクリックで送信するメッセージの数は1～6までの範囲の数のみ指定できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        //@ts-ignore
        return create_button_v4(interaction, times, message);
      }
      case "template_create": {
        const times_str = interaction.fields.getTextInputValue("times")
        const times = times_str ? Number.parseInt(times_str) : 6;
        if (Number.isNaN(times) || !(times >= 1 && times <= 6)) {
          return interaction.reply({ content: "1回のボタンクリックで送信するメッセージの数は1～6までの範囲の数のみ指定できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const delay_str = interaction.fields.getTextInputValue("delay")
        const delay = delay_str ? Number.parseInt(delay_str) : undefined;
        if ((delay != null && !(delay >= 1 && 60 >= delay))) {
          return interaction.reply({ content: "メッセージの送信間隔は1～60までの範囲の数のみ指定できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const folder_path = path.join(__maindir, ".data", "template", interaction.user.id);
        const template = interaction.fields.getTextInputValue("name");
        const file_path = path.join(folder_path, template);
        const message = interaction.fields.getTextInputValue("message") ?? "";
        if (template == "." || template == ".." || template.includes("\x00") || template.includes("/")) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` に使用できない文字が含まれています。\nテンプレート名に \`.\` 、\`..\` のみを指定することはできず、NULL文字、\`/\` を含めることはできません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        await fs.mkdir(folder_path, { recursive: true });
        if (await fsExists(file_path)) {
          return interaction.reply({ content: `指定されたテンプレート名 \`${template}\` は既に使われています。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        await fs.writeFile(file_path, JSON.stringify({ message: message, times: times, delay: delay, version: "v4" }), "utf-8");
        return interaction.reply({ content: `テンプレート \`${template}\` を作成しました。\n</template load:${interaction.id}> コマンドで読み込めます。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
    }
  }
  else if (interaction.isAutocomplete()) {
    if (app_config.logger) {
      const subcommandgroup = interaction.options.getSubcommandGroup(false) ?? "";
      const subcommand = (subcommandgroup ? subcommandgroup + " " : "") + (interaction.options.getSubcommand(false) ?? "");
      const focused = interaction.options.getFocused(true);
      log(`${interaction.user.username}(${interaction.user.id}) => Use auto complete: /${interaction.commandName + (subcommand ? " " + subcommand : "")}: ${focused.name} = '${focused.value}'`);
    }

    const command = command_collection.get(interaction.commandName);

    if (!command) return;
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(error);
    }
  }
});

// OAuth2でメンバーを取得できると勘違いしてた頃の残骸
// const token_dir = path.join(__dirname, ".data", "tokens");

// globalThis.isValidToken = (user_id) => {
//   // const filepath = path.join(token_dir, user_id, "token.json");
//   // if (fs.existsSync(filepath)) {
//   //   /** @type {{ access_token: String, refresh_token: String, token_type: String, refresh_date: String, expiry_date: String }} */
//   //   const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));
//   //   const now = new Date().getTime()
//   //   if (now >= new Date(data.expiry_date).getTime()) {
//   //     return false;
//   //   }
//   //   // if (now >= new Date(data.refresh_date).getTime()) {
//   //   //
//   //   // }
//   //   return true;
//   // }
//   // return false;
//   return getAccessToken(user_id) != null;
// };

// globalThis.getAccessToken = (user_id) => {
//   const filepath = path.join(token_dir, user_id, "token.json");
//   if (fs.existsSync(filepath)) {
//     /** @type {{ access_token: String, refresh_token: String, token_type: String, refresh_date: String, expiry_date: String }} */
//     const data = JSON.parse(fs.readFileSync(filepath, "utf-8"));
//     const now = new Date().getTime()
//     if (now >= new Date(data.expiry_date).getTime()) {
//       return null;
//     }
//     return { access_token: data.access_token, token_type: data.token_type };  
//   }
//   return null;
// };

function pm2_process() {
  if (process.env.pm_id) {
    return true;
  }
  return false;
}

function pm2_restart() {
  if (process.env.pm_id) {
    execSync("pm2 restart " + process.env.pm_id);
  }
}

/** @type {Object<number, string>} */
const closeEventCode = {
  4000: "unknownError",
  4001: "unknownOpcode",
  4002: "decodeError",
  4003: "notAuthenticated",
  4004: "authenticationFailed",
  4005: "alreadyAuthenticated",
  4007: "invalidSequence",
  4008: "rateLimited",
  4009: "sessionTimedOut",
  4010: "invalidShard",
  4011: "shardingRequired",
  4012: "invalidAPIVersion",
  4013: "invalidIntents",
  4014: "disallowedIntents",
}

/**
 * @type {{
 *  UnknownError: "unknownError",
 *  UnknownOpcode: "unknownOpcode",
 *  DecodeError: "decodeError",
 *  NotAuthenticated: "notAuthenticated",
 *  AuthenticationFailed: "authenticationFailed",
 *  AlreadyAuthenticated: "alreadyAuthenticated",
 *  InvalidSequence: "invalidSequence",
 *  RateLimited: "rateLimited",
 *  SessionTimedOut: "sessionTimedOut",
 *  InvalidShard: "invalidShard",
 *  ShardingRequired: "shardingRequired",
 *  InvalidAPIVersion: "invalidAPIVersion",
 *  InvalidIntents: "invalidIntents",
 *  DisallowedIntents: "disallowedIntents",
 * }}
 */
const closeEvent = Object.fromEntries(
  Object.entries(closeEventCode).map(([_, value]) => [value.charAt(0).toUpperCase() + value.slice(1), value])
);

client.on(Events.ShardDisconnect, async disconnect => {
  if (closeEventCode[disconnect.code] === closeEvent.AuthenticationFailed) {
    const json = await fsExists(config_filepath) ? JSON.parse(await fs.readFile(config_filepath, "utf-8")) : {};

    if (json.spare_tokens && Array.isArray(json.spare_tokens) && json.spare_tokens.length) {
      await sendSelfbotNotify(app_config.application_name + "は飛びました。。。\nでも安心してください。スペアトークンがあります。切り替えますね。");
      const token = json.spare_tokens.shift();
      json.token = token.token;
      if (token.public_key) {
        json.public_key = token.public_key;
      }
      await fs.writeFile(config_filepath, JSON.stringify(json, null, 2), "utf-8");
      log("BOTトークンを自動で変更しました。" + pm2_process() ? "再起動します。" : "サーバーがPM2を使用していないため、手動で再起動する必要があります。");
      pm2_restart();
    }
    else {
      await sendSelfbotNotify(app_config.application_name + "は飛びました。。。");
      log("BOTトークンが無効になりました。スペアトークンがないため、自動でBOTトークンを変更できませんでした。");
    }
  }
});

if (app_config.debug) {
  client.on("debug", (debug) => {
    console.log(debug);
  });
}

client.login(process.env.DISCORD_TOKEN).catch(error => {
  if (Object(error).code === "TokenInvalid") {
    console.error("BOTトークンが無効です。");
  }
});

require('node-cron').schedule("0 0 * * *", async () => {
  await (await getFileNamesInDirectory(path.join(__maindir, ".data", "temp_message_data"))).sequentialForEachAsync(async filename => {
    if (/^\d+_\d{6}$/.test(filename)) {
      const date_num = Number(filename.split("_")[0]);
      if (!Number.isNaN(date_num)) {
        // 2週間経過したかどうか
        if (new Date().getTime() - date_num >= 14 * 24 * 60 * 60 * 1000) {
          await fs.unlink(path.join(__maindir, ".data", "temp_message_data", filename));
        }
      }
    }
  });

  const members_data_dir = path.join(__maindir, ".data", "members_data");
  await (await getFileNamesInDirectory(members_data_dir)).sequentialForEachAsync(async filename => {
    if (new Date().getTime() - getTimeByUUIDv7(filename) >= 14 * 24 * 60 * 1000) {
      await fs.unlink(path.join(members_data_dir, filename));
    }
  });

  const random_mention_data_dir = path.join(__maindir, ".data", "random_mention_data");
  await (await getFileNamesInDirectory(random_mention_data_dir)).sequentialForEachAsync(async filename => {
    if (new Date().getTime() - getTimeByUUIDv7(filename) >= 14 * 24 * 60 * 1000) {
      await fs.unlink(path.join(random_mention_data_dir, filename));
    }
  });
});

const fastify = require("fastify")({
  logger: false,
});

// fastify.get("/", async (request, reply) => {
//   const code = Object(request.query).code;
//   if (code != null) {
//     const response = await fetch("https://discordapp.com/api/oauth2/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: `client_id=${process.env.DISCORD_CLIENT_ID}&client_secret=${process.env.DISCORD_CLIENT_SECRET}&grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(String(process.env.DISCORD_CLIENT_REDIRECT_URI))}` });
//     if (!response.ok) {
//       console.error(`Fetch error: ${response.status}: ${await response.text()}`);
//       return reply.type("text/plain;charset=utf-8").send("codeを処理しているときにエラーが発生しました。もう一度OAuth2認証をしてください。");
//     }
//     /** @type {{ access_token: String, expires_in: Number, refresh_token: String, scope: String, token_type: String }} */
//     const data = await response.json();
//     const date = new Date(response.headers.get("date") ?? new Date().getTime());
//     const expiry_date = new Date(date.getTime() + data.expires_in * 1000);
//     const refresh_date = new Date(expiry_date.getTime() - 24 * 60 * 60 * 1000);
//     const user_response = await fetch("https://discordapp.com/api/users/@me", { headers: { "authorization": `${data.token_type} ${data.access_token}` } });
//     if (!user_response.ok) {
//       return reply.type("text/plain;charset=utf-8").send("ユーザー情報を取得しているときにエラーが発生しました。もう一度OAuth2認証をしてください。");
//     }
//     const user = await user_response.json();
//     const dir = path.join(__dirname, ".data", "tokens", user.id);
//     fs.mkdirSync(dir, { recursive: true });
//     fs.writeFileSync(path.join(dir, "token.json"), JSON.stringify({
//       access_token: data.access_token,
//       refresh_token: data.refresh_token,
//       token_type: data.token_type,
//       expiry_date: expiry_date,
//       refresh_date: refresh_date,
//     }), "utf-8");
//     return reply.type("text/plain;charset=utf-8").send("認証しました！このタブを安全に閉じることができます。");
//   }
//   else {
//     return reply.type("text/plain;charset=utf-8").send("code が設定されていません。");
//   }
// });

const uuid = require("uuid");

fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, function (req, body, done) {
  //@ts-ignore
  req.rawBody = body.toString(); // raw bodyをstringとして保存
  //@ts-ignore
  const json = JSON.parse(req.rawBody); // JSONとしてパース
  done(null, json);
});

/** @type {Object<string, Array<number>>} */
const ratelimit = {};

fastify.addHook('onRequest', async (request, reply) => {
  reply.header("access-control-allow-origin", request.headers.origin ? request.headers.origin : "*").header("access-control-allow-headers", "content-type,authorization");
  if (request.method === "POST" && request.url == "/members") {
    const ip = getIpAddress(request);
    if (!ip || typeof ip !== "string") {
      return reply.code(403).send();
    }

    const ratelimit_time = 15 * 1000;
    const now_time = new Date().getTime();

    if (!ratelimit[ip]) {
      ratelimit[ip] = [];
    }

    ratelimit[ip] = ratelimit[ip].filter(time => now_time - time < ratelimit_time);
    if (ratelimit[ip].length >= 3) {
      return reply.code(429).send({
        message: "Rate Limit",
        retry_after: (ratelimit[ip][0] + ratelimit_time - now_time) / 1000,
      });
    }
    else {
      ratelimit[ip].push(now_time);
    }
  }
});

global.createMembersData = async (members) => {
  const dir = path.join(__maindir, ".data", "members_data");
  // UUIDの衝突は確率的にほぼほぼないからファイルのチェックはしない（ただファイルチェックの実装がめんどくさかっただけ）
  const uuid_str = uuid.v7();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, uuid_str), members.join(","), "utf-8");
  return uuid_str;
}

fastify.options("/id", async (request, reply) => {
  return reply.send();
});

fastify.get("/id", async (request, reply) => {
  return reply.type("text/plain;charset=utf-8").send(process.env.DISCORD_CLIENT_ID);
});

fastify.get("/install", async (request, reply) => {
  return reply.type("text/html;charset=utf-8").send(`
<head>
  <meta property="og:title" content="${app_config.application_name}をインストール"/>
  <meta property="og:description" content="リンクをクリックしてあなたのDiscordアカウントに${app_config.application_name}を追加しましょう✨️"/>
</head>
<meta http-equiv="refresh" content="0;URL=https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}"/>`.trim());
});

fastify.get("/botinstall", async (request, reply) => {
  return reply.redirect("https://discord.com/oauth2/authorize?client_id=" + process.env.DISCORD_CLIENT_ID).send();
});

fastify.options("/members", async (request, reply) => {
  return reply.send();
});

fastify.post("/members", async (request, reply) => {
  if (typeof request.body === "object" && Array.isArray(request.body)) {
    const members = request.body.filter(member => /^\d+$/.test(member));
    if (members.length == request.body.length) {
      if (members.length !== 0) {
        return reply.type("application/json;charset=utf-8").send({ "status": true, "uuid": await createMembersData(members) });
      }
      else {
        return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "ユーザーIDが指定されていません。" });
      }
    }
    else {
      return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "無効なユーザーIDが存在します。" });
    }
  }
  else {
    return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "フォームボディが無効な形式です。" });
  }
});

fastify.options("/admin/changeToken", async (request, reply) => {
  return reply.send();
});

fastify.post("/admin/changeToken", async (request, reply) => {
  if (typeof request.body === "object") {
    if (Object(request.body).token == null) {
      return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "フォームボディが無効な形式です。" });
    }

    if (!app_config.api_password) {
      return reply.code(501).type("application/json;charset=utf-8").send({ "status": false, "message": "サーバーがAPIパスワードを設定していません。" });
    }

    if (request.headers["authorization"] !== app_config.api_password) {
      return reply.code(403).type("application/json;charset=utf-8").send({ "status": false, "message": "APIパスワードが間違っています。" });
    }
    
    const json = await fsExists(config_filepath) ? JSON.parse(await fs.readFile(config_filepath, "utf-8")) : {};
    json.token = Object(request.body).token;

    await fs.writeFile(config_filepath, JSON.stringify(json, null, 2), "utf-8");

    return reply.code(200).type("application/json;charset=utf-8").send({ "status": true });
  }
  else {
    return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "フォームボディが無効な形式です。" });
  }
});

fastify.options("/admin/changePublicKey", async (request, reply) => {
  return reply.send();
});

fastify.post("/admin/changePublicKey", async (request, reply) => {
  if (typeof request.body === "object") {
    if (Object(request.body).public_key == null) {
      return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "フォームボディが無効な形式です。" });
    }

    if (!app_config.api_password) {
      return reply.code(501).type("application/json;charset=utf-8").send({ "status": false, "message": "サーバーがAPIパスワードを設定していません。" });
    }

    if (request.headers["authorization"] !== app_config.api_password) {
      return reply.code(403).type("application/json;charset=utf-8").send({ "status": false, "message": "APIパスワードが間違っています。" });
    }

    const json = await fsExists(config_filepath) ? JSON.parse(await fs.readFile(config_filepath, "utf-8")) : {};
    json.public_key = Object(request.body).public_key;

    await fs.writeFile(config_filepath, JSON.stringify(json), "utf-8");

    return reply.code(200).type("application/json;charset=utf-8").send({ "status": true });
  }
  else {
    return reply.code(400).type("application/json;charset=utf-8").send({ "status": false, "message": "フォームボディが無効な形式です。" });
  }
});

const { execSync } = require('child_process');

fastify.options("/admin/restart", async (request, reply) => {
  return reply.send();
});

fastify.post("/admin/restart", async (request, reply) => {
  if (!app_config.api_password) {
    return reply.code(501).type("application/json;charset=utf-8").send({ "status": false, "message": "サーバーがAPIパスワードを設定していません。" });
  }

  if (request.headers["authorization"] !== app_config.api_password) {
    return reply.code(403).type("application/json;charset=utf-8").send({ "status": false, "message": "APIパスワードが間違っています。" });
  }

  if (pm2_process()) {
    await reply.code(200).type("application/json;charset=utf-8").send({ "status": true });
    pm2_restart();
  }
  else {
    return reply.code(501).type("application/json;charset=utf-8").send({ "status": false, "message": "サーバーがPM2を使用していないため、再起動できません。" });
  }
});

fastify.register(require('@fastify/websocket'), {
  options: { server: fastify.server, maxPayload: 1048576 }
});

fastify.register(function (fastify) {
  fastify.get("/ws", { websocket: true }, (socket, request) => {
    socket.send(JSON.stringify({ "status": 200, "message": "connect" }));
    if (!app_config.api_password) {
      socket.send(JSON.stringify({ "status": 501, "message": "サーバーがAPIパスワードを設定していません。" }));
      socket.close();
    }

    if (!app_config.logger) {
      socket.send(JSON.stringify({ "status": 501, "message": "サーバーがログ機能を有効にしていません。" }));
      socket.close();
    }

    if (Object(request.query).password !== app_config.api_password) {
      socket.send(JSON.stringify({ "status": 403, "message": "APIパスワードが間違っています。" }));
      socket.close();
    }

    socket.send(JSON.stringify({ "status": 200 }));
  });
});

/** @param {string} message */
global.sendData = function sendData(message) {
  fastify.websocketServer.clients.forEach(client => {
    if (client.readyState === client.OPEN)
      client.send(message);
  });
}

/**
 * @param {import("fastify").FastifyRequest<import("fastify").RouteGenericInterface, import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("fastify").FastifySchema, import("fastify").FastifyTypeProviderDefault, unknown, import("fastify").FastifyBaseLogger, import("fastify/types/type-provider").ResolveFastifyRequestType<import("fastify").FastifyTypeProviderDefault, import("fastify").FastifySchema, import("fastify").RouteGenericInterface>>} request
 */
function getIpAddress(request) {
  let x_forwarded_for = request.headers['x-forwarded-for'];
  
  if (typeof x_forwarded_for === "string") {
    x_forwarded_for = x_forwarded_for.split(",");
  }

  return ((x_forwarded_for != null ? x_forwarded_for[x_forwarded_for.length - 1] : null) || request.socket.remoteAddress) ?? null;
}

const ipaddr = require("ipaddr.js");
const nacl = require("tweetnacl");
const JSONC = require("jsonc-parser");

/** @type {{ ipv4?: string[], ipv6?: string[] }} */
const allowed_cidrs = JSONC.parse(
  fsSync.existsSync(path.join(__maindir, "allowed_cidrs.json")) ? (
    fsSync.readFileSync(path.join(__maindir, "allowed_cidrs.json"), "utf-8")
  )
  : (
    fsSync.existsSync(path.join(__maindir, "allowed_cidrs.jsonc")) ? (
      fsSync.readFileSync(path.join(__maindir, "allowed_cidrs.jsonc"), "utf-8")
    )
    : "{}"
  )
);

/** @type {string[]} */
const allowed_ipv4_cidrs = allowed_cidrs.ipv4 ?? [];

/** @type {string[]} */
const allowed_ipv6_cidrs = allowed_cidrs.ipv6 ?? [];

fastify.post("/discord/webhook-endpoint/:client_id", async (request, reply) => {
  if (!process.env.DISCORD_PUBLIC_KEY) {
    return reply.code(501).send({
      message: "Webhooks endpoints are not supported and will not be available."
    });
  }

  const client_id = Object(request.params).client_id

  if (!client_id) {
    return reply.code(400).send({
      message: "client_id is required."
    });
  }

  let public_key = process.env.DISCORD_PUBLIC_KEY;

  if (client_id !== process.env.DISCORD_CLIENT_ID) {
    public_key = "";

    config_json.spare_tokens?.some(/** @param {{ token: string, public_key: string }} spare_token */ spare_token => {
      if (Buffer.from(spare_token.token.split(".")[0], "base64").toString() === client_id) {
        public_key = spare_token.public_key;
        return true;
      }
      return false;
    });
  }

  if (!public_key) {
    return reply.code(501).send({
      message: "No suitable public_key was found."
    });
  }

  const signature = String(request.headers["x-signature-ed25519"] ?? "");
  const timestamp = String(request.headers["x-signature-timestamp"] ?? "");
  
  const isVerified = (() => {
    if (signature && timestamp) {
      try {
        return nacl.sign.detached.verify(
          //@ts-ignore
          Buffer.from(timestamp + request.rawBody),
          Buffer.from(signature, "hex"),
          Buffer.from(public_key, "hex")
        );
      }
      catch {
        return false;
      }
    }
    return false;
  })();
  
  if (!isVerified) {
    return reply.code(401).send({
      message: "invalid request signature"
    });
  }

  const body = Object(request.body);
  if (body.type === 0) {
    return reply.code(204).send();
  }

  const ip = getIpAddress(request);
  if (ip != null && ipaddr.isValid(ip)) {
    if (ipaddr.IPv4.isIPv4(ip)) {
      const parsed_ip = ipaddr.IPv4.parse(ip);
      if (!allowed_ipv4_cidrs.some(cidr => ipaddr.IPv4.isValidCIDR(cidr) ? parsed_ip.match(ipaddr.IPv4.parseCIDR(cidr)) : false)) {
        return reply.code(403).send({
          message: "This IP address is not allowed.",
        });
      }
    }
    else if (ipaddr.IPv6.isIPv6(ip)) {
      const parsed_ip = ipaddr.IPv6.parse(ip);
      if (!allowed_ipv6_cidrs.some(cidr => ipaddr.IPv6.isValidCIDR(cidr) ? parsed_ip.match(ipaddr.IPv6.parseCIDR(cidr)) : false)) {
        return reply.code(403).send({
          message: "This IP address is not allowed.",
        });
      }
    }
    else {
      return reply.code(500).send({
        message: "IP address check failed.",
      });
    }
  }
  else {
    return reply.code(500).send({
      message: "IP address check failed.\nIP address is in an invalid format.",
    });
  }

  // https://discord.com/developers/docs/events/webhook-events#preparing-for-events
  if (body.application_id === process.env.DISCORD_CLIENT_ID && body.type === 1) {
    if (body.event.type === "APPLICATION_AUTHORIZED") {
      const user = body.event.data.user;
      if (app_config.logger) {
        log("APPLICATION_AUTHORIZED: " + user.id);
      }
    }
    else if (body.event.type === "APPLICATION_DEAUTHORIZED") {
      const user = body.event.data.user;
      if (app_config.logger) {
        log("APPLICATION_DEAUTHORIZED: " + user.id);
      }
    }
  }

  return reply.code(204).send();
});

fastify.setNotFoundHandler(async (request, reply) => {
  return reply.status(404).type("application/json;charset=utf-8").send({ "status": false, "message": "404 Not Found" });
});

fastify.listen({ port: app_config.port, host: "0.0.0.0" }, (err, address) => {
  if (err) throw err;
  console.log("Server address: " + address);
});
