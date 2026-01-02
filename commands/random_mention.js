//@ts-check
/// <reference path="./../types.d.ts" />

const { MessageFlags, InteractionContextType, PermissionFlagsBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require("discord.js");
const path = require("path");
const fs = require("fs").promises;
const uuid = require("uuid");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("ランダムメンションを実行します。")
    .addStringOption(option =>
      option
        .setName("token")
        .setDescription("ユーザートークン")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("メッセージ（\\rでランダムメンション配置）")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("実行するモード")
        .addChoices(
          { name: "ボタンのセットアップ（デフォルト、トークンの暗号化なし）", value: "button" },
          { name: "そのまま実行", value: "execute" },
        )
    )
    .addStringOption(option =>
      option
        .setName("message_type")
        .setDescription("メッセージの送信方法")
        .addChoices(
          { name: app_config.application_name + "のスラッシュコマンドを経由（デフォルト）", value: "slash" },
          { name: "ユーザーでメッセージを送信", value: "user" },
        )
    )
    .addBooleanOption(option => 
      option
        .setName("all_channels")
        .setDescription("全てのチャンネルにメッセージを送信するかどうか")
    )
    .setContexts(InteractionContextType.Guild),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral });
    }
    /** @type {string} */
    let message = interaction.options.getString("message")?.replace(/(\\+?)n/g, (match) => (match.match(/\\/g)?.length ?? 0) % 2 === 0 ? match : match.replace("\\n", "\n")) ?? default_message + "\n\\r \\r \\r \\r \\r";
    const token = interaction.options.getString("token");
    if (token == null) {
      return interaction.reply({ content: "tokenがnullです。", flags: MessageFlags.Ephemeral });
    }
    if (/(\\.)|([\/.])?(?:(?:\:(\w+)(?:\(((?:\\.|[^\\()])+)\))?|\(((?:\\.|[^\\()])+)\))([+*?])?|(\*))/.test(token)) {
      return interaction.reply({ content: "暗号化済みトークンは使用できません。", flags: MessageFlags.Ephemeral });
    }
    if (!/[\w-_]{24,26}\.[\w-_]{6}\.[\w-_]{34,38}/.test(token)) {
      return interaction.reply({ content: "無効な形式のトークンです。", flags: MessageFlags.Ephemeral });
    }
    let user_id = Buffer.from(token.split(".")[0], "base64").toString();
    if (user_id !== interaction.user.id) {
      if (!/\d+/.test(user_id)) {
        return interaction.reply({ content: "無効な形式のトークンです。", flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({ content: "指定されたトークンはあなた自身のトークンではありません。", flags: MessageFlags.Ephemeral });
    }
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
      return interaction.reply({ content: "2000文字を超えると予想されるメッセージを指定することはできません。", flags: MessageFlags.Ephemeral });
    }
    /** @type {Object | null | undefined} */
    const members_raw = count ? await getGuildMembers(token, interaction.guildId)?.catch(() => null) : [{ user: { id: "@everyone" } }];
    if (members_raw == null) {
      return interaction.reply({ content: "サーバーメンバーを取得できませんでした。指定したユーザートークンが有効かどうかを確認してください。", flags: MessageFlags.Ephemeral });
    }
    /** @type {string[]} */
    //@ts-ignore
    const members = members_raw.map(user => user.user.id);
    if (!members.length) { // 普通ならありえないから特に実装しない
      return interaction.reply({ content: "サーバーメンバーリストが0です。", flags: MessageFlags.Ephemeral });
    }
    const uuid_str = await createMembersData(members);

    const all_channels = interaction.options.getBoolean("all_channels") ?? true;

    // user か slash
    const message_type = interaction.options.getString("message_type") ?? "slash";

    // execute か button
    const mode = interaction.options.getString("mode") ?? "button";
    /** @type {string | undefined} */
    let random_mention_uuid_str;
    /** @type {string | undefined} */
    let members_data_uuid_str;
    const dir = path.join(__maindir, ".data", "random_mention_data");
    if (mode === "execute") { // executeなら直接そのまま実行する
      await interaction.reply({ content: "OK\nUUID: " + uuid_str, flags: MessageFlags.Ephemeral });

      if (message_type === "slash") {
        for (let i = 0; i < 5; i++) {
          interaction.followUp({ content: applyRandomMention(message, members), allowedMentions: { parse: ["everyone", "roles", "users"] } });
        }
      }
      else if (message_type === "user") {
        // 権限チェック
        if (interaction.memberPermissions.has(PermissionFlagsBits.ViewChannel) && interaction.memberPermissions.has(PermissionFlagsBits.SendMessages)) {
          for (let i = 0; i < 10; i++) {
            sendMessage(token, message, interaction.channelId, members);
          }
        }
      }

    }
    else if (mode === "button") { // buttonなら一旦UUIDを生成とディレクトリ作成をしとく
      random_mention_uuid_str = uuid.v7();
      await fs.mkdir(dir, { recursive: true });
      if (message_type === "slash") {
        members_data_uuid_str = uuid.v7();
        await fs.writeFile(path.join(__maindir, ".data", "members_data", members_data_uuid_str), members.join(","));
      }
    }
    
    if (all_channels) { // 全チャンネルで実行する場合
      if (mode === "button" && message_type === "user") {
        interaction.deferReply({ flags: MessageFlags.Ephemeral });
      }
      /** @param {string} message */
      function error(message) {
        interaction.user.send(`</random_mention:${interaction.commandId}> コマンドの実行に一部失敗しました。\nエラーメッセージ: ${message}`);
      }

      const guilds_res = await fetch("https://discord.com/api/v9/users/@me/guilds", { headers: { authorization: token }, cache: "no-store" });
      if (!guilds_res.ok) {
        error("サーバー情報を取得できませんでした。");
        return;
      }
      //@ts-ignore
      const guild = (await guilds_res.json()).filter(guild_ => guild_.id === interaction.guildId)?.[0];
      if (!guild) {
        error("サーバーリストから現在のサーバーを取得できませんでした。");
        return;
      }

      const member_res = await fetch(`https://discord.com/api/v9/users/@me/guilds/${interaction.guildId}/member`, { headers: { authorization: token }, cache: "no-store" });
      if (!member_res.ok) {
        error("メンバー情報を取得できませんでした。");
        return;
      }
      /** @type {string[]} */
      const roles = (await member_res.json()).roles;

      const channels_res = await fetch(`https://discord.com/api/v9/guilds/${interaction.guildId}/channels`, { headers: { authorization: token }, cache: "no-store" });
      if (!channels_res.ok) {
        error("チャンネルリストを取得できませんでした。");
        return;
      }
      /** @type {string[]} */
      //@ts-ignore
      const channels = (await channels_res.json()).filter(channel => channel.type == 0 || channel.type == 2).map(channel => channel.id);
      if (!channels.length) {
        error("チャンネルリストの内容が空でした。");
        return;
      }

      /** @type {Object.<string, PermissionsBitField>} */
      let permissions = {};
      //@ts-ignore
      channels.forEach(channel => {
        // ここの処理はGeminiが作りましたわら

        let permissions_ = new PermissionsBitField(guild.permissions);
        if (permissions_.has(PermissionFlagsBits.Administrator)) {
          permissions[channel] = new PermissionsBitField(PermissionFlagsBits.Administrator);
          return;
        }
        
        let allow = new PermissionsBitField(0n);
        let deny = new PermissionsBitField(0n);

        // 2. @everyone の上書き適用
        //@ts-ignore
        const everyone_overwrite = channel.permission_overwrites?.find(ow => ow.id === interaction.guildId /* @everyoneのIDはギルドIDと同じ */);
        if (everyone_overwrite) {
          allow.add(BigInt(everyone_overwrite.allow));
          deny.add(BigInt(everyone_overwrite.deny));
        }

        // 3. ロールの上書き適用
        for (const role of roles) {
          //@ts-ignore
          const role_overwrite = channel.permission_overwrites?.find(ow => ow.id === role && ow.type === 0); // type 0: ROLE
          if (role_overwrite) {
            // denyはallowより優先
            deny.add(BigInt(role_overwrite.deny));
            allow.add(BigInt(role_overwrite.allow));
          }
        }

        // 4. ユーザー自身の上書き適用 (最も優先度が高い)
        //@ts-ignore
        const user_overwrite = channel.permission_overwrites?.find(ow => ow.id === interaction.user.id && ow.type === 1); // type 1: MEMBER
        if (user_overwrite) {
          // denyはallowより優先
          deny.add(BigInt(user_overwrite.deny));
          allow.add(BigInt(user_overwrite.allow));
        }

        // 5. 最終的なパーミッションの計算
        // ベースパーミッションに、上書きの許可ビットをOR演算で加える
        permissions_.add(allow);

        // 拒否ビットが立っているパーミッションをAND NOT演算で削除する
        permissions_.remove(deny);

        permissions[channel] = permissions_;
      });

      if (mode === "execute") { // 即時に全チャンネルで実行
        channels.sequentialForEachAsync(async channel => {
          // executeの場合、事前に実行済みなのでスキップ（110行付近）
          if (interaction.channelId === channel) {
            return;
          }
          if (permissions[channel].has(PermissionFlagsBits.ViewChannel) && permissions[channel].has(PermissionFlagsBits.SendMessages) && permissions[channel].has(PermissionFlagsBits.UseExternalApps)) {
            if (message_type === "slash") {
              await sendInteraction(token, message, uuid_str, interaction.applicationId, interaction.guildId, channel);
            }
            else if (message_type === "user") {
              for (let i = 0; i < 10; i++) {
                sendMessage(token, message, channel, members);
              }
            }
          }
        });
      }
      else if (mode === "button") { // ボタンをおしたら全チャンネルで実行
        if (!random_mention_uuid_str) {
          random_mention_uuid_str = uuid.v7();
        }
        await fs.writeFile(path.join(dir, random_mention_uuid_str), JSON.stringify({
          message: message,
          token: token,
          members: message_type === "user" ? members : members_data_uuid_str,
          all_channels: all_channels,
          permissions: Object.entries(permissions).reduce((acc, [key, value]) => ({ ...acc, [key]: value.bitfield.toString() }), {}),
          type: message_type
        }));
      }
    }
    else { // 全てのチャンネルで実行しない場合
      // executeの場合、実行済みなのでスキップ（110行付近）
      if (mode === "button") {
        if (!random_mention_uuid_str) {
          random_mention_uuid_str = uuid.v7();
        }
        await fs.writeFile(path.join(dir, random_mention_uuid_str), JSON.stringify({
          message: message,
          token: token,
          members: message_type === "user" ? members : members_data_uuid_str,
          all_channels: all_channels,
          type: message_type
        }));
      }
    }
    if (mode === "button") {
      console.log(random_mention_uuid_str)
      const message = button_message + (message_type === "slash" ? ((interaction.memberPermissions?.has(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps) ?? false) ? "" : `\n${button_warn_message}`) : "") + "\n\n-# **ユーザートークンはサーバー内に暗号化されずに保存されています。ユーザートークンを含むランダムメンションデータを削除する場合は「削除」ボタンを押してください。**\n-# 削除しなかった場合でも2週間経過後に自動で削除されます。";
      const components = [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`random_mention:${random_mention_uuid_str}`).setLabel("実行").setStyle(ButtonStyle.Primary)
        ).toJSON(),
        new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`random_mention_delete:${random_mention_uuid_str}`).setLabel("削除").setStyle(ButtonStyle.Danger)
        ).toJSON()
      ]
      if (interaction.deferred) {
        return interaction.editReply({ content: message, components: components });
      }
      else {
        return interaction.reply({ content: message, components: components, flags: MessageFlags.Ephemeral });
      }
    }
  }
}
