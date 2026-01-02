//@ts-check
/// <reference path="./../types.d.ts"/>

const { SlashCommandBuilder, MessageFlags, InteractionContextType, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName(getFileName(__filename))
    .setDescription("モーダル形式で操作を行います。")
    .addSubcommand(subcommand => 
      subcommand
        .setName("setup")
        .setDescription("ボタンのセットアップをします。")
    )
    .addSubcommandGroup(subcommandgroup => 
      subcommandgroup
        .setName("template")
        .setDescription("セットアップのテンプレートを作成/読み込み/削除できます。")
        .addSubcommand(subcommand => 
          subcommand
            .setName("create")
            .setDescription("テンプレートを作成します。")
        )
    )
    // .addSubcommandGroup(subcommandgroup =>
    //   subcommandgroup
    //     .setName("random_mention")
    //     .setDescription("ランダムメンションを実行します。")
    // )
    .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel),

  /** @param {import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>} interaction */
  async execute(interaction) {
    const subcommandgroup = interaction.options.getSubcommandGroup(false);
    const subcommand = (subcommandgroup ? subcommandgroup + " " : "") + interaction.options.getSubcommand(false);
    let modal;
    switch (subcommand) {
      case "setup": {
        modal = new ModalBuilder().setCustomId("setup").setTitle("ボタンのセットアップ").addComponents(
          //@ts-ignore
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("message").setLabel("送信するメッセージ（省略可）").setStyle(TextInputStyle.Paragraph).setMaxLength(2000).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("times").setLabel("1回のボタンクリックで送信するメッセージの数（省略可、1～6回まで、デフォルトで6回）").setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("delay").setLabel("メッセージの送信間隔（省略可、0～60秒まで）").setStyle(TextInputStyle.Short).setMaxLength(2).setRequired(false)
          ),
        )
        break;
      }
      case "template create": {
        modal = new ModalBuilder().setCustomId("template_create").setTitle("テンプレートの作成").addComponents(
          //@ts-ignore
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("name").setLabel("テンプレート名").setStyle(TextInputStyle.Short).setMaxLength(255).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("message").setLabel("送信するメッセージ（省略可）").setStyle(TextInputStyle.Paragraph).setMaxLength(2000).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("times").setLabel("1回のボタンクリックで送信するメッセージの数（省略可、1～6回まで、デフォルトで6回）").setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("delay").setLabel("メッセージの送信間隔（省略可、0～60秒まで）").setStyle(TextInputStyle.Short).setMaxLength(2).setRequired(false)
          ),
        )
        break;
      }
      case "random_mention": {
        if (!interaction.inGuild()) {
          return interaction.reply({ content: "このコマンドはサーバー内でのみ使用できます。", flags: MessageFlags.Ephemeral }).catch(_ => _);
        }
        
        modal = new ModalBuilder().setCustomId("random_mention").setTitle("ランダムメンションのセットアップ").addComponents(
          //@ts-ignore
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("token").setLabel("ユーザートークン").setStyle(TextInputStyle.Short).setMaxLength(255).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("message").setLabel("送信するメッセージ（\\rでランダムメンション配置）").setStyle(TextInputStyle.Paragraph).setMaxLength(2000).setRequired(true)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("mode").setLabel("実行するモード（1 = ボタンのセットアップ、2 = そのまま実行）").setPlaceholder("1").setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("message_type").setLabel(`メッセージの送信方法（1 = ${app_config.application_name}のスラッシュコマンドを経由、2 = ユーザーでメッセージを送信）`).setPlaceholder("1").setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(false)
          ),
          new ActionRowBuilder().addComponents(
            new TextInputBuilder().setCustomId("all_channels").setLabel("全てのチャンネルにメッセージを送信するかどうか（y = はい、n = いいえ）").setPlaceholder("y").setStyle(TextInputStyle.Short).setMaxLength(1).setRequired(false)
          ),
        )
        break;
      }
    }
    if (modal) {
      await interaction.showModal(modal);
    }
    else {
      await interaction.reply({ content: "モーダルを正しく作成できませんでした。\nこの問題を開発者に報告してください。", flags: MessageFlags.Ephemeral }).catch(_ => _);
    }
  }
}
