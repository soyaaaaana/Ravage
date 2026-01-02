//@ts-check
/// <reference path="./../types.d.ts" />

const { ActionRowBuilder, ButtonBuilder, MessageFlags, PermissionFlagsBits, InteractionContextType, SlashCommandBuilder } = require('discord.js');

global.button_message = "「実行」ボタンを押してください。";
global.button_warn_message = "※このチャンネルでは外部のアプリを使用できない可能性があります。";

/**
 * @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction
 * @param {number} times
 * @param {string} message
 * @param {number | null | undefined} delay
 */
function create_button_v1(interaction, times, message, delay) {
  return interaction.reply({ content: button_message + ((interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps) ?? false) ? "" : `\n${button_warn_message}`), components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`start:v1,${times},${JSON.stringify(message)}${delay ? "," + delay : ""}`).setLabel('実行').setStyle(1)
    ).toJSON()
  ], flags: MessageFlags.Ephemeral });
}

/**
 * @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction
 * @param {number} times
 * @param {string} message
 * @param {number | null | undefined} delay
 */
function create_button_v2(interaction, times, message, delay) {
  return interaction.reply({ content: button_message + ((interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps) ?? false) ? "" : `\n${button_warn_message}`), components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`start:v2,${times},${message.replaceAll("\n", "\\n").replaceAll(",", "\\,")}${delay ? "," + delay : ""}`).setLabel('実行').setStyle(1)
    ).toJSON()
  ], flags: MessageFlags.Ephemeral });
}

const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto")

global.fsExists = async (path) => {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  }
  catch (error) {
    return false;
  }
}

function generateRandomString(length = 32, string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") {
  return Array.from(crypto.randomFillSync(new Uint8Array(length))).map((n) => string[n % string.length]).join('');
}

function generateFileName() {
  return new Date().getTime().toString() + "_" + generateRandomString(6, "0123456789");
}

/**
 * @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction
 * @param {number} times
 * @param {string} message
 * @param {number | null | undefined} delay
 */
async function create_button_v3(interaction, times, message, delay) {
  let filename = generateFileName();
  const dirpath = path.join(__maindir, ".data", "temp_message_data");
  const filepath = path.join(dirpath, filename);
  while (await fsExists(filepath)) {
    filename = generateFileName();
  }
  await fs.mkdir(dirpath, { recursive: true });
  await fs.writeFile(filepath, message, "utf-8");
  message_cache[filename] = message.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n"));
  return interaction.reply({ content: button_message + ((interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps) ?? false) ? "" : `\n${button_warn_message}`), components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`start:v3,${times},${filename}${delay ? "," + delay : ""}`).setLabel('実行').setStyle(1)
    ).toJSON()
  ], flags: MessageFlags.Ephemeral });
}

/**
 * @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType> | import("discord.js").ModalSubmitInteraction<import("discord.js").CacheType>} interaction
 * @param {number} times
 * @param {string} message
 * @param {number | null | undefined} delay
 */
async function create_button_v4(interaction, times, message, delay) {
  let filename = generateFileName();
  const dirpath = path.join(__maindir, ".data", "temp_message_data");
  const filepath = path.join(dirpath, filename);
  while (await fsExists(filepath)) {
    filename = generateFileName();
  }
  await fs.mkdir(dirpath, { recursive: true });
  await fs.writeFile(filepath, message, "utf-8");
  //@ts-ignore
  return interaction.reply({ content: button_message + ((interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps) ?? false) ? "" : `\n${button_warn_message}`), components: [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`start:v4,${times},${filename}${delay ? "," + delay : ""}`).setLabel('実行').setStyle(1)
    ).toJSON()
  ], flags: MessageFlags.Ephemeral });
}

const fsSync = require("fs");
const { dir } = require('console');

/**
 * @param {string} dir
 * @returns {string[]}
 */
function getFileNamesInDirectorySync(dir) {
  return fsSync.existsSync(dir) ? fsSync.readdirSync(dir, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name) : [];
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>}
 */
async function getFileNamesInDirectory(dir) {
  return await fsExists(dir) ? (await fs.readdir(dir, { withFileTypes: true }))
    .filter(dirent => dirent.isFile())
    .map(dirent => dirent.name) : [];
}

/**
 * @param {string} uuid
 * @returns {number}
 */
function getTimeByUUIDv7(uuid) {
  return parseInt(uuid.replaceAll("-", "").substring(0, 12), 16);
}

/**
 * @param {string} uuid
 * @returns {Date}
 */
function getDateByUUIDv7(uuid) {
  return new Date(getTimeByUUIDv7(uuid));
}

/**
 * @param {string} discord_token
 * @param {string} guild_id
 */
async function getGuildMembers(discord_token, guild_id) {
  if (typeof discord_token !== "string" || typeof guild_id !== "string") {
    throw new TypeError("discord_token または guild_id がstring型ではありません。");
  }

  const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
  const Opcodes = {
    DISPATCH: 0,
    HEARTBEAT: 1,
    IDENTIFY: 2,
    HELLO: 10,
    HEARTBEAT_ACK: 11,
    SEARCH_RECENT_MEMBERS: 35, // ユーザークライアントの非公開オペコード
    QOS_HEARTBEAT: 40, // QoS Heartbeat
  };
  const Events = {
    READY: 'READY',
    GUILD_MEMBERS_CHUNK: 'GUILD_MEMBERS_CHUNK',
  };

  class UserClient {
  /**
   * @param {string} token
   * @param {string} guildId
   */
    constructor(token, guildId) {
      this.token = token; // ユーザーアカウントのトークン
      this.guildId = guildId;
      this.ws = null;
      /** @type {Object[]} */
      this.allMembers = [];
      this.heartbeatInterval = null;
      this.sequence = null;
      this.nonceCounter = BigInt(0);
      this.searchCounter = 0;
      this.resolveMembers = null; // Promise解決用
    }

    /**
     * WebSocket接続を開始し、Identifyを送信する
     */
    connect() {
      return new Promise((resolve) => {
        this.resolveMembers = resolve;

        this.ws = new WebSocket(GATEWAY_URL);

        this.ws.onopen = () => {
          // console.log('✅ WebSocket接続完了');
        };

        this.ws.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          this.handleGatewayPayload(payload);
        };

        this.ws.onclose = (event) => {
          // console.log(`❌ WebSocket切断: コード ${event.code}`);
          // 必要に応じて再接続ロジックを実装
        };

        this.ws.onerror = (error) => {
          // console.error('🔥 WebSocketエラー:', error);
        };
      });
    }

    /**
     * ゲートウェイから受信したペイロードを処理する
     * @param {{
     *   op: number,
     *   d?: Object,
     *   s?: number,
     *   t?: string
     * }} payload 
     */
    handleGatewayPayload(payload) {
      const { op, d, s, t } = payload;

      // シーケンス番号を更新
      if (s) {
        this.sequence = s;
      }

      switch (op) {
        case Opcodes.HELLO:
          // HELLO (op: 10) 受信後、Heartbeatを開始し、Identifyを送信
          //@ts-ignore
          this.startHeartbeat(d.heartbeat_interval);
          this.sendIdentify();
          break;

        case Opcodes.HEARTBEAT_ACK:
          // Heartbeat ACK (op: 11) 受信
          // console.log('💓 Heartbeat ACK');
          break;

        case Opcodes.DISPATCH:
          // Dispatch (op: 0) イベントを処理
          //@ts-ignore
          this.handleDispatch(t, d);
          break;

        // その他のオペコード（Reconnect, Invalid Sessionなど）の処理は省略
      }
    }

    /**
     * Dispatchイベント (op: 0) を処理する
     * @param {string} eventName 
     * @param {object} data 
     */
    handleDispatch(eventName, data) {
      switch (eventName) {
        case Events.READY:
          // console.log(`🚀 READYイベント受信: ユーザーID ${data.user.id}`);
          // READY後、メンバー取得を開始
          this.requestAllGuildMembers();
          break;

        case Events.GUILD_MEMBERS_CHUNK:
          //@ts-ignore
          this.handleGuildMembersChunk(data);
          break;
      }
    }

    /**
     * Heartbeatを開始する
     * @param {number} interval 
     */
    startHeartbeat(interval) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, interval);
    }

    /**
     * QoS Heartbeat (op: 40) を送信する
     * @param {number} seq 現在のシーケンス番号
     */
    sendQosHeartbeat(seq) {
      // QoS Heartbeatのペイロードは、ユーザーアカウントのクライアントの挙動を模倣します。
      // 'seq' は最後に受信したイベントのシーケンス番号（または null）です。
      // 'qos' 内のデータは User Client の状態に基づいています。
      const payload = {
        op: Opcodes.QOS_HEARTBEAT,
        d: {
          seq: seq, // 最後に受信したシーケンス番号 (this.sequence)
          qos: {
            active: true, // クライアントがアクティブかどうか
            ver: 26,      // QoSバージョン (変更される可能性あり)
            // reasons: ウィンドウがアクティブ (foregrounded) か、RTC接続中 (rtc_connected) かなどの理由
            reasons: ['foregrounded']
          }
        }
      };
      this.ws?.send(JSON.stringify(payload));
      // console.log('💖 QoS Heartbeat (op: 40) 送信');
    }

    /**
     * Heartbeatを送信する (op: 40 を使用するように変更)
     */
    sendHeartbeat() {
      // op: 1 の代わりに op: 40 を使用
      this.sendQosHeartbeat(this.sequence ?? 0);
    }

    /**
     * Identify (op: 2) を送信する (ユーザークライアント用)
     */
    sendIdentify() {
      const payload = {
        op: Opcodes.IDENTIFY,
        d: {
          token: this.token,
          capabilities: 1734653,
          properties: {
            os: "Windows",
            browser: "Chrome",
            device: "",
            system_locale: "ja-JP",
            has_client_mods: false,
            browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
            browser_version: "141.0.0.0",
            os_version: "10",
            referrer: "",
            referring_domain: "",
            referrer_current: "",
            referring_domain_current: "",
            release_channel: "stable",
            client_build_number: 459631,
            client_event_source: null,
            client_launch_id: "2fe87ddd-6e28-4e80-8598-d64381742f5c",
            launch_signature: "f949672e-311a-44ed-9a5e-4e86e497509b",
            client_app_state: "unfocused",
            is_fast_connect: false,
            gateway_connect_reasons: "AppSkeleton"
          },
          presence: {
            status: "unknown",
            since: 0,
            activities: [],
            afk: false
          },
          compress: false,
          client_state: {
            guild_versions: {}
          }
        }
      };
      this.ws?.send(JSON.stringify(payload));
      // console.log('🔑 Identify送信');
    }

    /**
     * 全ギルドメンバーの取得を開始する
     */
    requestAllGuildMembers() {
      // 初回のリクエストは continuation_token なしで行う
      this.sendSearchMembers(null);
    }

    /**
     * @param {number | Date} timestamp 
     * @returns 
     */
    generateSnowflake(timestamp = Date.now()) {
      if (timestamp instanceof Date) timestamp = timestamp.getTime();
      if (typeof timestamp !== 'number' || isNaN(timestamp)) {
        throw new TypeError(
          `"timestamp" argument must be a number (received ${Number.isNaN(timestamp) ? 'NaN' : typeof timestamp})`,
        );
      }
      if (this.nonceCounter >= 4095n) this.nonceCounter = BigInt(0);

      const EPOCH = 1_420_070_400_000;

      // Assign WorkerId as 1 and ProcessId as 0:
      return ((BigInt(timestamp - EPOCH) << 22n) | (1n << 17n) | this.nonceCounter++).toString();
    }

    /**
     * SEARCH_RECENT_MEMBERS (op: 35) を送信する
     * @param {string | null} continuationToken 前回のレスポンスで受け取ったトークン
     */
    sendSearchMembers(continuationToken) {
      this.nonceCounter++;
      this.searchCounter++;
      const payload = {
        op: Opcodes.SEARCH_RECENT_MEMBERS,
        d: {
          guild_id: this.guildId,
          query: '', // 全メンバー取得のため空文字列
          // continuation_tokenが null の場合は送信しない
          continuation_token: continuationToken ?? null,
          nonce: this.generateSnowflake(), // ユニークな識別子
        },
      };

      this.ws?.send(JSON.stringify(payload));
      // console.log(`🔎 メンバー検索リクエスト送信 (continuation_token: ${continuationToken ? continuationToken : 'なし'})`);
    }

    /**
     * GUILD_MEMBERS_CHUNK イベントを処理し、再帰的にメンバーを取得する
     * @param {{
     *   guild_id: string,
     *   members: Object[],
     *   chunk_index: number,
     *   chunk_count: number,
     *   continuation_token: string | null
     * }} data 
     */
    handleGuildMembersChunk(data) {
      const { guild_id, members, chunk_index, chunk_count, continuation_token } = data;

      if (guild_id !== this.guildId) return; // 対象ギルドでない場合は無視

      this.allMembers.push(...members);
      // console.log(`📦 メンバーチャンク受信: ${this.allMembers.length} / ??? (現在のチャンクサイズ: ${members.length})`);

      // continuation_token が存在し、null でない場合は、次のチャンクをリクエスト
      if (this.allMembers.length === this.searchCounter * 1000) {
        //@ts-ignore
        let continuation_token_ = members[0].user.id;
        this.sendSearchMembers(continuation_token_);
      } else {
        // continuation_token が null またはメンバー数が 0 の場合、全メンバー取得完了
        // console.log(`🎉 全メンバー取得完了！合計: ${this.allMembers.length} 人`);

        // WebSocketをクリーンアップ
        //@ts-ignore
        clearInterval(this.heartbeatInterval);
        this.ws?.close();

        // Promiseを解決
        if (this.resolveMembers) {
          this.resolveMembers(this.allMembers);
        }
      }
    }
  }

  const client = new UserClient(discord_token, guild_id);

  try {
    return await client.connect();
  } catch (error) {
    return null;
  }
}

JSON.tryParse = (text, reviver) => {
  try {
    return JSON.parse(text, reviver);
  }
  catch {
    return null;
  }
}

JSON.isParsable = (text) => {
  try {
    JSON.parse(text);
    return true;
  }
  catch {
    return false;
  }
}

/**
 * @param {string} wrapper
 */
String.prototype.wrapWith = function (wrapper) {
  return `${wrapper}${this}${wrapper}`;
};

/**
 * @param {import("discord.js").Interaction<import("discord.js").CacheType> | import("discord.js").ButtonInteraction<import("discord.js").CacheType>} interaction
 * @returns {Promise<import("discord.js").InteractionResponse<boolean> | false>}
 */
async function banCheck(interaction) {
  if (!interaction.isAutocomplete()) {
    const ban_dir = path.join(__maindir, ".data", "ban");
    if (banned_users.includes(interaction.user.id)) {
      const ban_path = path.join(ban_dir, interaction.user.id);
      let reason = "[理由が提供されていません]";
      if (await fsExists(ban_path)) {
        const raw_reason = await fs.readFile(ban_path, "utf-8");
        if (raw_reason) {
          reason = raw_reason;
        }
      }
      return interaction.reply({ content: `あなたは${app_config.application_name}の利用を制限されています。\n理由: ${reason}`, flags: MessageFlags.Ephemeral });
    }
  }
  return false;
}

/**
 * @param {string} message 
 */
async function log(message) {
  if (app_config.logger) {
    console.log(message);
    const date = new Date();
    const date_str = `${date.getFullYear().toString().padStart(4, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
    const time_str = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date.getSeconds().toString().padStart(2, "0")}.${date.getMilliseconds().toString().padStart(3, "0")}`;
    if (typeof sendData === "function") {
      sendData(JSON.stringify({
        date: `${date_str} ${time_str}`,
        message: message
      }));
    }
    const dir = path.join(__maindir, ".data", "logs");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, `${date_str.replaceAll("/", "-")}_out.log`), `[${date_str} ${time_str}] ${message}\n`);
  }
}

/**
 * @param {string} message 
 */
function debugLog(message) {
  if (app_config.debug) {
    console.log(message);
  }
}

/**
 * @param {Function} callbackfn
 * @param {any} thisArg
 */
Array.prototype.sequentialForEachAsync = async function (callbackfn, thisArg) {
  for (let index = 0; index < this.length; index++) {
    await callbackfn.call(thisArg, this[index], index, this);
  }
};

/**
 * @param {string} message 
 * @param {string[]} members 
 */
function applyRandomMention(message, members) {
  return message.replace(/(\\+?)r/g, (match) => (match.match(/\\/g) ?? []).length % 2 === 0 ? match.replaceAll("\\\\", "\\") : match.replaceAll("\\\\", "\\").replace("\\r", `<@${members[Math.floor(Math.random() * members.length)]}>`));
}

let nonce_counter = 0n;

/** @param {number | Date | undefined} timestamp */
const generateSnowflake = (timestamp = Date.now()) => {
  if (timestamp instanceof Date) timestamp = timestamp.getTime();
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    throw new TypeError(
      `"timestamp" argument must be a number (received ${Number.isNaN(timestamp) ? 'NaN' : typeof timestamp})`,
    );
  }
  if (nonce_counter >= 4095n) this.nonceCounter = 0n;

  const EPOCH = 1_420_070_400_000;

  // Assign WorkerId as 1 and ProcessId as 0:
  return ((BigInt(timestamp - EPOCH) << 22n) | (1n << 17n) | nonce_counter++).toString();
}

/**
 * @param {string} discord_token
 * @param {string} message
 * @param {string} channel
 * @param {string[]} members
 */
async function sendMessage(discord_token, message, channel, members, retry_count = 0) {
  const message_res = await fetch(`https://discord.com/api/v9/channels/${channel}/messages`, {
    method: "POST", headers: { Authorization: discord_token, "Content-Type": "application/json" }, body: JSON.stringify({
      mobile_network_type: "unknown",
      content: applyRandomMention(message, members),
      nonce: generateSnowflake(),
      tts: false,
      flags: 0,
    }), cache: "no-store"
  });
  if (message_res.status === 429) {
    let data = {};
    try {
      data = JSON.parse(await message_res.text());
    }
    catch {
      data = { retry_after: 0.4 };
    }
    //@ts-ignore
    await sleep((data.retry_after ?? 0.4) * 1000);
    if (retry_count < 50) {
      await sendMessage(discord_token, message, channel, members, retry_count + 1);
    }
  }
}

/**
 * @param {string} discord_token
 * @param {string} message
 * @param {string} uuid
 * @param {string} application_id
 * @param {string | null | undefined} guild
 * @param {string} channel
 */
async function sendInteraction(discord_token, message, uuid, application_id, guild, channel, retry_count = 0) {
  const data = new FormData();
  data.append("payload_json", JSON.stringify({
    type: 2,
    application_id: application_id,
    guild_id: guild != null ? guild : undefined,
    channel_id: channel,
    session_id: generateRandomString(32, "abcdef0123456789"),
    data: {
      version: random_mention_auto_cache.version,
      id: random_mention_auto_cache.id,
      name: random_mention_auto_cache.name,
      type: random_mention_auto_cache.type,
      options: [
        {
          type: 3,
          name: "message",
          value: message
        }, {
          type: 3,
          name: "uuid",
          value: uuid
        }
      ],
      application_command: random_mention_auto_cache,
      attachments: []
    },
    nonce: generateSnowflake(),
    analytics_location: "slash_ui"
  }));
  //@ts-ignore
  const interaction_res = await fetch("https://discord.com/api/v9/interactions", { method: "POST", headers: { authorization: discord_token }, body: data, cache: "no-store" });
  if (interaction_res.status === 429) {
    let data = {};
    try {
      data = JSON.parse(await interaction_res.text());
    }
    catch {
      data = { retry_after: 1 };
    }
    //@ts-ignore
    await sleep((data.retry_after ?? 1) * 1000);
    if (retry_count < 20) {
      await sendInteraction(discord_token, message, uuid, application_id, guild, channel, retry_count + 1);
    }
  }
}

/**
 * @param {boolean} slot_mode
 * @param {string} filename
 * @param {string | null | undefined} name
 * @param {string | null | undefined} description
 */
function sendCommandBuilder(slot_mode, filename, name = undefined, description = undefined) {
  return {
    data: new SlashCommandBuilder()
      .setName(slot_mode ? `slot${filename}` : name ? name : filename)
      .setDescription(slot_mode ? `スロット${filename}に登録されているメッセージを送信します。` : description ? description : `公式テンプレート${filename}を実行します。`)
      // まちがえた
      // .addStringOption(option =>
      //   option
      //     .setName("slot")
      //     .setDescription("使用する登録済みのスロット")
      //     .addChoices(
      //       { name: "スロット1", value: "1" },
      //       { name: "スロット2", value: "2" },
      //       { name: "スロット3", value: "3" },
      //       { name: "スロット4", value: "4" },
      //       { name: "スロット5", value: "5" }
      //     )
      //     .setRequired(true)
      // )
      .addStringOption(option =>
        option
          .setName("mode")
          .setDescription("実行するモード")
          .addChoices(
            { name: "ボタンのセットアップ", value: "button" },
            { name: "そのまま実行", value: "execute" },
            { name: "プレビュー", value: "preview" },
          )
      )
      .addIntegerOption(option =>
        option
          .setName("override_times")
          .setDescription("1度のボタンクリックで送信するメッセージの回数のオーバーライド（範囲は1～6）")
          .setMinValue(1)
          .setMaxValue(5)
      )
      .addIntegerOption(option =>
        option
          .setName("override_delay")
          .setDescription("メッセージの送信間隔のオーバーライド（秒）")
          .setMinValue(0)
          .setMaxValue(60)
      )
      .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

    /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
    async execute(interaction) {
      if (!interaction.inGuild()) {
        return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
      }

      const file_path = slot_mode ? path.join(__maindir, ".data", "registered_messages", interaction.user.id, filename) : path.join(__maindir, ".data", "official_template", filename);
      if (await fsExists(file_path)) {

        /**
         * @type {{ message: string, times: number, delay?: number, version: string }}
         */
        const message_data = JSON.parse(await fs.readFile(file_path, "utf-8"));
        const message = message_data.message;
        const times = interaction.options.getInteger("override_times") ?? message_data.times;
        const delay = interaction.options.getInteger("override_delay") ?? message_data.delay ?? undefined;
        const mode = interaction.options.getString("mode") ?? "button";

        switch (mode) {
          case "button": {
            create_button_v4(interaction, times, message, delay);
            break;
          }
          case "execute": {
            if (!interaction.memberPermissions.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)) {
              return interaction.reply({ content: "このチャンネルでは外部のアプリを使用できないようです。", flags: MessageFlags.Ephemeral }).catch(_ => _);
            }

            await interaction.reply({ content: "OK", flags: MessageFlags.Ephemeral }).catch(_ => _);
            for (let i = 0; i < (times == 6 ? 5 : times); i++) {
              if (delay && i != 0) {
                await sleep(delay * 1000);
              }
              interaction.followUp({ content: message, allowedMentions: { parse: ["everyone", "roles", "users"] } }).catch(_ => _);
            }
            break;
          }
          case "preview": {
            interaction.reply({ content: message, allowedMentions: { parse: ["everyone", "roles", "users"] }, flags: MessageFlags.Ephemeral }).catch(_ => _);
            break;
          }
        }
      }
      else {
        if (slot_mode) {
          return interaction.reply({ content: `スロット${filename}にメッセージが登録されていません。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        else {
          return interaction.reply({ content: `公式テンプレート \`${filename}\` が存在しませんでした。\nあなたができること:\n- \`/official_template load name:${filename}\` を使用してコマンドを実行する。\n- このバグを開発者に知らせてください。`, flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
      }
    }
  }
}

/**
 * @param {number} slot
 */
function slotCommandBuilder(slot) {
  return sendCommandBuilder(true, slot.toString());
}

/**
 * @param {string} template_name
 * @param {string} name
 * @param {string} description
 */
function templateCommandBuilder(template_name, name, description) {
  return sendCommandBuilder(false, template_name, name, description);
}


// /** @type {Object<string, number[]>} */
// const ratelimit = {};

// const ratelimit_time = 10 * 60 * 1000;

// /**
//  * @param {string} user_id
//  * @param {number | null | undefined} time
//  */
// function ratelimitResetCalc(user_id, time) {
//   const now_time = time ? time : new Date().getTime();

//   if (ratelimit[user_id]) {
//     ratelimit[user_id].every((ratetime, index) => {
//       if (now_time - ratetime >= ratelimit_time) {
//         console.log("delete: " + index);
//         ratelimit[user_id].splice(index, 1);
//         return true;
//       }
//       return false;
//     });
//   }
// }

// /** @param {string} user_id */
// function ratelimitCount(user_id) {
//   const now = new Date().getTime();

//   ratelimitResetCalc(user_id, now);
//   if (ratelimit[user_id] && ratelimit[user_id].length < 2000) {
//     return {
//       time: now,
//       retry_after: (ratelimit[user_id][0] + ratelimit_time - now) / 1000,
//     };
//   }
//   return false;
// }

/** @type {Object<string, number[]>} */
const ratelimit = {};
global.ratelimit_time = 10 * 60 * 1000;
global.ratelimit_waitcount = 2001;
global.ratelimit_waittime = 10 * 1000;
global.ratelimit_maxlimit = 3001;

/**
 * @param {string} user_id
 * @returns {{
 *  allowed: false,
 *  reason: string,
 *  count: number,
 *  retry_after: number,
 * } | {
 *  allowed: true,
 *  count: number,
 * }}
 */
function ratelimitCount(user_id) {
  const now = Date.now();

  if (!ratelimit[user_id]) {
    ratelimit[user_id] = [];
  }

  ratelimit[user_id] = ratelimit[user_id].filter(timestamp => (now - timestamp) < ratelimit_time);

  const currentCount = ratelimit[user_id].length;

  if (currentCount >= ratelimit_maxlimit) {
    return {
      allowed: false,
      reason: "limit_exceeded",
      count: currentCount,
      retry_after: (ratelimit_time - (now - ratelimit[user_id][0])) / 1000
    };
  }

  if (currentCount >= ratelimit_waitcount) {
    const lastAccess = ratelimit[user_id][currentCount - 1];
    if (now - lastAccess < ratelimit_waittime) {
      return {
        allowed: false,
        reason: "wait_required",
        count: currentCount,
        retry_after: (ratelimit_waittime - (now - lastAccess)) / 1000
      };
    }
  }

  ratelimit[user_id].push(now);
  return {
    allowed: true,
    count: ratelimit[user_id].length
  };
}

function ratelimitResetCalc() {
  const now = new Date().getTime();
  Object.keys(ratelimit).forEach(user_id => {
    ratelimit[user_id] = ratelimit[user_id].filter(timestamp => (now - timestamp) < ratelimit_time);

    if (!ratelimit[user_id].length) {
      delete ratelimit[user_id];
    }
  });
}


/**
 * @param {string} filename `global.__filename`
 */
function getFileName(filename) {
  return path.parse(filename).name;
}

global.Tea = require(path.join(__maindir, "modules", "tea.js"));
global.sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));
global.generateRandomString = generateRandomString;
global.create_button_v1 = create_button_v1;
global.create_button_v2 = create_button_v2;
global.create_button_v3 = create_button_v3;
global.create_button_v4 = create_button_v4;
global.getFileNamesInDirectorySync = getFileNamesInDirectorySync;
global.getFileNamesInDirectory = getFileNamesInDirectory;
global.getTimeByUUIDv7 = getTimeByUUIDv7;
global.getDateByUUIDv7 = getDateByUUIDv7;
global.getGuildMembers = getGuildMembers;
global.banCheck = banCheck;
global.log = log;
global.applyRandomMention = applyRandomMention;
global.generateSnowflake = generateSnowflake;
global.sendMessage = sendMessage;
global.sendInteraction = sendInteraction;
global.sendCommandBuilder = sendCommandBuilder;
global.slotCommandBuilder = slotCommandBuilder;
global.templateCommandBuilder = templateCommandBuilder;
global.ratelimitCount = ratelimitCount;
global.ratelimitResetCalc = ratelimitResetCalc;
global.getFileName = getFileName;
