//@ts-check
/// <reference path="./../types.d.ts"/>

const { MessageFlags, InteractionContextType, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription(`コマンドを実行したチャンネルでどの権限が使用できるかを確認します。`)
    .addStringOption(option =>
      option
        .setName("mode")
        .setDescription("確認モード")
        .setChoices([
          {
            name: app_config.application_name + "に必要な権限のみ",
            value: "bot"
          },
          {
            name: "すべての権限",
            value: "all"
          }
        ])
    )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    if (!interaction.inGuild()) {
      return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }

    /** @param {BigInt} permission */
    function permissionText(permission) {
      return (interaction.memberPermissions?.has(permission) ?? false) ? ":white_check_mark:" : ":x:";
    }

    const mode = interaction.options.getString("mode") ?? "bot";
    if (mode === "all") {
      return interaction.reply({ content: `
        招待の作成: ${permissionText(PermissionFlagsBits.CreateInstantInvite)}
        メンバーのキック、承認、拒否: ${permissionText(PermissionFlagsBits.KickMembers)}
        メンバーをBAN: ${permissionText(PermissionFlagsBits.BanMembers)}
        管理者: ${permissionText(PermissionFlagsBits.Administrator)}
        チャンネルの管理: ${permissionText(PermissionFlagsBits.ManageChannels)}
        サーバー管理: ${permissionText(PermissionFlagsBits.ManageGuild)}
        リアクションの追加: ${permissionText(PermissionFlagsBits.AddReactions)}
        監査ログを表示: ${permissionText(PermissionFlagsBits.ViewAuditLog)}
        優先スピーカー: ${permissionText(PermissionFlagsBits.PrioritySpeaker)}
        WEB カメラ: ${permissionText(PermissionFlagsBits.Stream)}
        チャンネルを見る: ${permissionText(PermissionFlagsBits.ViewChannel)}
        メッセージの送信と投稿の作成: ${permissionText(PermissionFlagsBits.SendMessages)}
        テキスト読み上げメッセージを送信する: ${permissionText(PermissionFlagsBits.SendTTSMessages)}
        メッセージの管理: ${permissionText(PermissionFlagsBits.ManageMessages)}
        埋め込みリンク: ${permissionText(PermissionFlagsBits.EmbedLinks)}
        ファイルを添付: ${permissionText(PermissionFlagsBits.AttachFiles)}
        メッセージ履歴を読む: ${permissionText(PermissionFlagsBits.ReadMessageHistory)}
        @everyone、@here、全てのロールにメンション: ${permissionText(PermissionFlagsBits.MentionEveryone)}
        外部の絵文字を使用する: ${permissionText(PermissionFlagsBits.UseExternalEmojis)}
        サーバーインサイトを見る: ${permissionText(PermissionFlagsBits.ViewGuildInsights)}
        接続: ${permissionText(PermissionFlagsBits.Connect)}
        発言: ${permissionText(PermissionFlagsBits.Speak)}
        メンバーをミュート: ${permissionText(PermissionFlagsBits.MuteMembers)}
        メンバーのスピーカーをミュート: ${permissionText(PermissionFlagsBits.DeafenMembers)}
        メンバーを移動: ${permissionText(PermissionFlagsBits.MoveMembers)}
        音声検出を使用: ${permissionText(PermissionFlagsBits.UseVAD)}
        ニックネームを変更: ${permissionText(PermissionFlagsBits.ChangeNickname)}
        ロールの管理: ${permissionText(PermissionFlagsBits.ManageRoles)}
        ウェブフックの管理: ${permissionText(PermissionFlagsBits.ManageWebhooks)}
        絵文字の管理: ${permissionText(PermissionFlagsBits.ManageGuildExpressions)}
        アプリコマンドを使う: ${permissionText(PermissionFlagsBits.UseApplicationCommands)}
        スピーカー参加をリクエスト: ${permissionText(PermissionFlagsBits.RequestToSpeak)}
        イベントの管理: ${permissionText(PermissionFlagsBits.ManageEvents)}
        スレッドと投稿の管理: ${permissionText(PermissionFlagsBits.ManageThreads)}
        公開スレッドの作成: ${permissionText(PermissionFlagsBits.CreatePublicThreads)}
        プライベートスレッドの作成: ${permissionText(PermissionFlagsBits.CreatePrivateThreads)}
        外部のスタンプを使用する: ${permissionText(PermissionFlagsBits.UseExternalStickers)}
        スレッドと投稿でメッセージを送信: ${permissionText(PermissionFlagsBits.SendMessagesInThreads)}
        ユーザーアクティビティ: ${permissionText(PermissionFlagsBits.UseEmbeddedActivities)}
        メンバーをタイムアウト: ${permissionText(PermissionFlagsBits.ModerateMembers)}
        サーバーサブスクリプション・インサイトを見る: ${permissionText(PermissionFlagsBits.ViewCreatorMonetizationAnalytics)}
        サウンドボードを使用: ${permissionText(PermissionFlagsBits.UseSoundboard)}
        エクスプレッションを作成: ${permissionText(PermissionFlagsBits.CreateGuildExpressions)}
        イベントを作成: ${permissionText(PermissionFlagsBits.CreateEvents)}
        外部のサウンドの使用: ${permissionText(PermissionFlagsBits.UseExternalSounds)}
        ボイスメッセージを送信: ${permissionText(PermissionFlagsBits.SendVoiceMessages)}
        投票の作成: ${permissionText(PermissionFlagsBits.SendPolls)}
        外部のアプリを使用: ${permissionText(PermissionFlagsBits.UseExternalApps)}
        メッセージをピン留め: ${permissionText(PermissionFlagsBits.PinMessages)}
        低速モードを回避: ${permissionText(PermissionFlagsBits.BypassSlowmode)}

        パーミッション: ${interaction.memberPermissions.bitfield.toString()}
        `.trim().replaceAll("\r", "").split("\n").map(text => text.trim()).join("\n"), flags: MessageFlags.Ephemeral }).catch(_ => _);
      //低速モードを回避: ${permissionText(/*PermissionFlagsBits.BypassSlowmode*/ 52n)}
    }
    else {
      return interaction.reply({ content: `外部アプリの権限: ${permissionText(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.UseExternalApps)}\neveryoneメンションの権限: ${permissionText(PermissionFlagsBits.MentionEveryone)}`, flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
}
