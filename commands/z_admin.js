//@ts-check
/// <reference path="./../types.d.ts" />

/**
 * @param {string} command 
 * @returns {{ fileName: string, args: string[] }}
 */
// Gemini(笑)
function parseCommand(command) {
  const args = [];
  let fileName = "";
  let inQuotes = false;
  let currentArg = "";
  let escaped = false;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (char === '\\' && inQuotes) {
      escaped = true;
      currentArg += char;
      continue;
    }

    if (char === '"' && !escaped) {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      if (fileName === "") {
        fileName = currentArg;
      } else if (currentArg !== "") {
        args.push(currentArg);
      }
      currentArg = "";
    } else {
      currentArg += char;
    }
    escaped = false;
  }

  if (currentArg !== "") {
    if (fileName === "") {
      fileName = currentArg;
    } else {
      args.push(currentArg);
    }
  }

  return { fileName: fileName, args: args };
}

// Gemini(笑)
/**
 * コマンドライン引数を解析する関数 (拡張版)
 * @param {string[]} args - parseCommand から返されるコマンドライン引数の配列
 * @param {Object.<string, { type: "string" | "boolean" | "number" | "array", long: boolean, short?: string | null }>} definitions - 引数の定義オブジェクト。
 * キーはロング引数名。
 * 値は以下のプロパティを持つオブジェクト:
 * - type: "string" | "boolean" | "number" | "array"
 * - long: boolean (trueの場合、キーがロング引数名として扱われる)
 * - short: string | null (ショート引数名。nullの場合、ショート引数は定義されない)
 * @returns {Object.<string, any>} 解析された引数と値のオブジェクト。
 * @throws {Error} 定義の重複、未定義の引数、引数の形式不正の場合にスローされます。
 */
function parseArgs(args, definitions) {
  /** @type {Object.<string, any>} */
  const parsed = {};
  /** @type {Object.<string, string>} */
  const shortToLongMap = {};
  const usedShortArgs = new Set();
  const usedLongArgs = new Set();

  // 定義の検証とマップの作成
  for (const longName in definitions) {
    if (definitions.hasOwnProperty(longName)) {
      const def = definitions[longName];

      if (typeof def.type !== 'string' || !['string', 'boolean', 'number', 'array'].includes(def.type)) {
        throw new Error(`Invalid type for argument '${longName}'. Must be 'string', 'boolean', 'number', or 'array'.`);
      }
      if (typeof def.long !== 'boolean') {
        throw new Error(`Invalid 'long' property for argument '${longName}'. Must be boolean.`);
      }
      if (def.short !== undefined && def.short !== null && typeof def.short !== 'string') {
        throw new Error(`Invalid 'short' property for argument '${longName}'. Must be string or null.`);
      }

      if (def.long) {
        if (usedLongArgs.has(longName)) {
          throw new Error(`Duplicate long argument definition: '--${longName}'`);
        }
        usedLongArgs.add(longName);
      }

      if (def.short) {
        if (usedShortArgs.has(def.short)) {
          throw new Error(`Duplicate short argument definition: '-${def.short}'`);
        }
        usedShortArgs.add(def.short);
        if (shortToLongMap[def.short]) {
          throw new Error(`Duplicate short argument mapping for '${def.short}'. Conflicts with '${shortToLongMap[def.short]}' and '${longName}'.`);
        }
        shortToLongMap[def.short] = longName;
      }

      // parsedオブジェクトの初期化
      if (def.type === 'boolean') {
        parsed[longName] = false;
      } else if (def.type === 'array') {
        parsed[longName] = [];
      } else {
        parsed[longName] = undefined;
      }
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    let currentLongName = null;
    let isLongArg = false;

    if (arg.startsWith('--')) {
      // ロング引数
      const argName = arg.slice(2);
      if (!definitions.hasOwnProperty(argName) || !definitions[argName].long) {
        throw new Error(`Undefined or invalid long argument: '${arg}'`);
      }
      currentLongName = argName;
      isLongArg = true;
    } else if (arg.startsWith('-')) {
      // ショート引数
      const argName = arg.slice(1);
      if (!shortToLongMap.hasOwnProperty(argName)) {
        throw new Error(`Undefined or invalid short argument: '${arg}'`);
      }
      currentLongName = shortToLongMap[argName];
      isLongArg = false; // ショート引数であることを示す
    } else {
      // ハイフンで始まらない引数はエラー
      throw new Error(`Invalid argument format: '${arg}'. Arguments must start with '-' or '--'.`);
    }

    const definition = definitions[currentLongName];
    const type = definition.type;

    switch (type) {
      case 'boolean':
        // 次の要素がハイフンで始まるか、または引数の終わりであればtrue
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          const value = args[i + 1].toLowerCase();
          parsed[currentLongName] = (value === 'true' || value === '1');
          i++; // 値を消費したのでインデックスを進める
        } else {
          parsed[currentLongName] = true;
        }
        break;
      case 'string':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsed[currentLongName] = args[i + 1];
          i++; // 値を消費したのでインデックスを進める
        } else {
          throw new Error(`Missing value for string argument: '${arg}'`);
        }
        break;
      case 'number':
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          const numValue = Number(args[i + 1]);
          if (isNaN(numValue)) {
            throw new Error(`Invalid number value for argument '${arg}': '${args[i + 1]}'`);
          }
          parsed[currentLongName] = numValue;
          i++; // 値を消費したのでインデックスを進める
        } else {
          throw new Error(`Missing value for number argument: '${arg}'`);
        }
        break;
      case 'array':
        // array型は初期化時に空配列が設定されていることを前提
        if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
          parsed[currentLongName].push(args[i + 1]);
          i++; // 値を消費したのでインデックスを進める
        } else {
          // 配列の場合、値がなくてもエラーとはしない（空の配列として扱われる）
          // ただし、値を期待するならエラーにするロジックも追加可能
        }
        break;
    }
  }

  return parsed;
}

const { MessageFlags, InteractionContextType, SlashCommandBuilder } = require("discord.js");
const {  } = require('@discordjs/builders');
const fs = require("fs").promises;
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("開発者専用のコマンドです。")
    .addStringOption(option =>
      option
        .setName("command")
        .setDescription("コマンド")
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    if (!trusted_users.includes(interaction.user.id)) {
      return interaction.reply({ content: "このコマンドは信頼されたユーザー以外使用できません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
    const command = parseCommand(interaction.options.getString("command") ?? "");
    switch (command.fileName) {
      case "ban": {
        /** @type {{ "user-id": string, reason: string? }} */
        //@ts-ignore
        const args = parseArgs(command.args, { "user-id": { type: "string", long: true, short: "u" }, "reason": { type: "string", long: true, short: "r" } });
        if (args["user-id"] == null) {
          return interaction.reply({ content: "ユーザーIDが指定されていません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!/^\d+$/.test(args["user-id"])) {
          return interaction.reply({ content: "ユーザーIDの形式が間違っています。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (trusted_users.includes(args["user-id"])) {
          return interaction.reply({ content: "信頼されたユーザーに指定されているユーザーをBANすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if ((args.reason?.length ?? 0) > 1500) {
          return interaction.reply({ content: "BANの理由に1500文字を超える文字数を指定することはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const ban_dir = path.join(__maindir, ".data", "ban");
        await fs.mkdir(ban_dir, { recursive: true });
        banned_users.push(args["user-id"]);
        await fs.writeFile(path.join(ban_dir, args["user-id"]), args.reason ?? "");
        return interaction.reply({ content: `ユーザーID ${args["user-id"]} のユーザーをBANしました。\n理由: ${args.reason ? args.reason : "[理由が提供されていません]"}`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      case "unban": {
        /** @type {{ "user-id": string }} */
        //@ts-ignore
        const args = parseArgs(command.args, { "user-id": { type: "string", long: true, short: "u" } });
        if (args["user-id"] == null) {
          return interaction.reply({ content: "ユーザーIDが指定されていません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!/^\d+$/.test(args["user-id"])) {
          return interaction.reply({ content: "ユーザーIDの形式が間違っています。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (trusted_users.includes(args["user-id"])) {
          return interaction.reply({ content: "信頼されたユーザーに指定されているユーザーをBANすることはできません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const ban_path = path.join(__maindir, ".data", "ban", args["user-id"]);
        if (await fsExists(ban_path)) {
          banned_users = banned_users.filter(user => user !== args["user-id"]);
          await fs.unlink(ban_path);
          return interaction.reply({ content: `ユーザーID ${args["user-id"]} のユーザーのBANを解除しました。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        else {
          return interaction.reply({ content: `ユーザーID ${args["user-id"]} のユーザーはそもそもBANされていません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
      }
      case "add_trusted_user": {
        /** @type {{ "user-id": string }} */
        //@ts-ignore
        const args = parseArgs(command.args, { "user-id": { type: "string", long: true, short: "u" } });
        if (args["user-id"] == null) {
          return interaction.reply({ content: "ユーザーIDが指定されていません。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        if (!/^\d+$/.test(args["user-id"])) {
          return interaction.reply({ content: "ユーザーIDの形式が間違っています。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        const server_data_dir = path.join(__maindir, ".data", "server");
        await fs.mkdir(server_data_dir, { recursive: true });
        const trusted_users_path = path.join(server_data_dir, "trusted_users.json")
        trusted_users.push(args["user-id"]);
        await fs.writeFile(trusted_users_path, JSON.stringify(trusted_users));
        return interaction.reply({ content: `ユーザーID ${args["user-id"]} のユーザーを信頼されたユーザーに昇格しました。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
      default: {
        return interaction.reply({ content: command.fileName + " は存在しませんでした。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }
    }
  }
}
