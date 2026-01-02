declare global {
  var __maindir: string;
  var default_message: string;
  var sleep: (time: number) => Promise<void>;
  var trusted_users: string[];
  var banned_users: string[];
  var app_config: {
    application_name: string,
    server_name?: string?,
    logger: boolean,
    debug: boolean,
    port: number,
    api_password?: string?,
    selfbot_notify?: {
      token: string,
      channel_id: string,
      notified_token?: string?
    }?,
  };
  var message_cache: {
    [key: string]: string;
  };
  var random_mention_auto_cache: any;
  // var Tea: typeof TeaClass;
  // declare class TeaClass {
  //   static encrypt(plaintext: string, password: string): string;
  //   static decrypt(ciphertext: string, password: string): string;
  //   static encode(v: number[], k: number[]): number[];
  //   static decode(v: number[], k: number[]): number[];
  //   private static strToLongs(s: any): any[];
  //   private static longsToStr(l: any): string;
  //   static utf8Encode(str: any): string;
  //   static utf8Decode(utf8Str: any): any;
  //   static base64Encode(str: any): string;
  //   static base64Decode(b64Str: any): string | undefined;
  // };
  var Tea = class Tea {
    static encrypt(plaintext: string, password: string): string;
    static decrypt(ciphertext: string, password: string): string;
    static encode(v: number[], k: number[]): number[];
    static decode(v: number[], k: number[]): number[];
    private static strToLongs(s: any): any[];
    private static longsToStr(l: any): string;
    static utf8Encode(str: any): string;
    static utf8Decode(utf8Str: any): any;
    static base64Encode(str: any): string;
    static base64Decode(b64Str: any): string | undefined;
  };
  var generateRandomString: (length: number, string: string) => string;
  var create_button_v1: (interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>, times: number, message: string, delay?: number | null) => Promise<import("discord.js").InteractionResponse<boolean>>;
  var create_button_v2: (interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>, times: number, message: string, delay?: number | null) => Promise<import("discord.js").InteractionResponse<boolean>>;
  var create_button_v3: (interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>, times: number, message: string, delay?: number | null) => Promise<import("discord.js").InteractionResponse<boolean>>;
  var create_button_v4: (interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>, times: number, message: string, delay?: number | null) => Promise<import("discord.js").InteractionResponse<boolean>>;
  var getFileNamesInDirectorySync: (dir: string) => string[];
  var getFileNamesInDirectory: (dir: string) => Promise<string[]>;
  var getTimeByUUIDv7: (uuid: string) => number;
  var getDateByUUIDv7: (uuid: string) => Date;
  var createMembersData: (members: string[]) => Promise<string>;
  function getGuildMembers(discord_token: string, guild_id: string): Promise<string[]> | null;
  function banCheck(interaction: import("discord.js").Interaction<import("discord.js").CacheType>): Promise<import("discord.js").InteractionResponse<boolean> | false>;
  function log(message: string): Promise<void>;
  var fsExists: (path: import("fs").PathLike) => Promise<boolean>;
  function applyRandomMention(message: string, members: string[]): string;
  var generateSnowflake: (timestamp?: number | Date | undefined) => string;
  function sendMessage(discord_token: string, message: string, channel: string, members: string[], retry_count?: number): Promise<void>;
  function sendInteraction(discord_token: string, message: string, uuid: string, application_id: string, guild: string | null | undefined, channel: string, retry_count?: number): Promise<void>;
  var button_message: string;
  var button_warn_message: string;
  function sendCommandBuilder(slot_mode: boolean, filename: string, name?: string | null | undefined, description?: string | null | undefined): {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>): Promise<any>;
  }
  function slotCommandBuilder(slot: number): {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>): Promise<any>;
  }
  function templateCommandBuilder(template_name: string, name: string, description: string): {
    data: SlashCommandOptionsOnlyBuilder;
    execute(interaction: import("discord.js").ChatInputCommandInteraction<import("discord.js").CacheType>): Promise<any>;
  }
  function sendData(message: string): void;
  var ratelimit_time: number;
  var ratelimit_waitcount: number;
  var ratelimit_waittime: number;
  var ratelimit_maxlimit: number;
  function ratelimitCount(user_id: string): { allowed: false, reason: string, count: number, retry_after: number } | { allowed: true, count: number };
  function ratelimitResetCalc(): void;
  function getFileName(filename: string): string;

  interface JSON {
    tryParse: (text: string, reviver?: ((this: any, key: string, value: any) => any) | undefined) => any | null;
    isParsable: (text: string) => boolean;
  }

  declare namespace NodeJS {
    interface ProcessEnv {
      DISCORD_TOKEN: string;
      DISCORD_CLIENT_ID: string;
      DISCORD_PUBLIC_KEY: string | null;
    }
  }

  interface String {
    wrapWith(wrapper: string): string;
  }

  interface Array<T> {
    sequentialForEachAsync(callbackfn: (value: T, index: number, array: T[]) => void | Promise<void>, thisArg?: any): Promise<void>;
  }
}

export { };