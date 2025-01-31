import { Collections } from '@app/constants';
import {
  APIMessage,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection,
  ForumChannel,
  MediaChannel,
  NewsChannel,
  PermissionsString,
  Snowflake,
  SnowflakeUtil,
  TextChannel,
  WebhookClient,
  WebhookMessageCreateOptions
} from 'discord.js';
import { ObjectId } from 'mongodb';
import { getBbLegendRankingEmbedMaker, getLegendRankingEmbedMaker } from '../helper/leaderboard.helper.js';
import { Client } from '../struct/client.js';
import { EMOJIS } from '../util/emojis.js';
import { Season, Util } from '../util/toolkit.js';
import { Enqueuer } from './enqueuer.js';

export class AutoBoardLog {
  public cached: Collection<string, Cache> = new Collection();
  private readonly queued = new Set<string>();
  public refreshRate: number;
  private timeout!: NodeJS.Timeout | null;
  private client: Client;

  public constructor(enqueuer: Enqueuer) {
    this.client = enqueuer.client;
    this.refreshRate = 15 * 60 * 1000;
  }

  public get collection() {
    return this.client.db.collection(Collections.AUTO_BOARDS);
  }

  public get permissions(): PermissionsString[] {
    return ['ReadMessageHistory', 'SendMessages', 'EmbedLinks', 'UseExternalEmojis', 'ViewChannel'];
  }

  public async exec(_id: string, data: Record<string, unknown>) {
    const cache = this.cached.get(_id);
    if (data.channelId && cache && cache.channelId !== data.channelId) return;

    // double posting prevention for custom bots
    if (cache?.guildId && this.client.settings.hasCustomBot(cache.guildId) && !this.client.isCustom()) return;

    if (cache) await this.permissionsFor(cache);
  }

  public async permissionsFor(cache: Cache) {
    const channel = this.client.util.hasPermissions(cache.channelId, this.permissions);
    if (channel) {
      if (channel.isThread) cache.threadId = channel.channel.id;
      const webhook = await this.webhook(cache, channel.parent);
      if (webhook) return this.handleMessage(cache, webhook);
    }
  }

  private isEndOfSeason(endOfSeason: Date) {
    return endOfSeason.toISOString().slice(0, 7) !== new Date().toISOString().slice(0, 7);
  }

  public async handleMessage(cache: Cache, webhook: WebhookClient) {
    const endOfSeason = this.client.coc.util.getSeasonEnd(new Date());

    if (cache.messageId && this.isEndOfSeason(endOfSeason)) {
      const lastMessageTimestamp = this.client.coc.util
        .getSeasonEnd(new Date(Number(SnowflakeUtil.deconstruct(cache.messageId).timestamp)))
        .getTime();
      if (lastMessageTimestamp !== endOfSeason.getTime()) delete cache.messageId;
    }

    if (!cache.messageId) {
      const msg = await this.send(cache, webhook);
      return this.updateMessageId(cache, msg);
    }

    const msg = await this.edit(cache, webhook);
    return this.updateMessageId(cache, msg);
  }

  private _components(cache: Cache) {
    const btn = new ButtonBuilder()
      .setStyle(ButtonStyle.Secondary)
      .setCustomId(
        JSON.stringify({
          cmd: 'legend-leaderboard',
          is_bb: cache.boardType === 'bb-legend-leaderboard',
          limit: cache.limit,
          offset: cache.offset
        })
      )
      .setEmoji(EMOJIS.REFRESH);

    return new ActionRowBuilder<ButtonBuilder>().addComponents(btn);
  }

  public updateWebhook(cache: Cache, webhook: WebhookClient, channelId: string) {
    return this.collection.updateOne(
      { _id: new ObjectId(cache._id) },
      { $set: { channelId, webhook: { id: webhook.id, token: webhook.token } } }
    );
  }

  public deleteWebhook(cache: Cache) {
    cache.webhook = null;
    cache.deleted = true;

    return this.collection.updateOne({ _id: new ObjectId(cache._id) }, { $set: { webhook: null } });
  }

  public async updateMessageId(cache: Cache, msg: APIMessage | null) {
    if (msg) {
      await this.collection.updateOne(
        { _id: new ObjectId(cache._id) },
        {
          $set: {
            retries: 0,
            messageId: msg.id,
            channelId: msg.channel_id,
            updatedAt: new Date()
          }
        }
      );
      cache.messageId = msg.id;
      cache.channelId = msg.channel_id;
    } else {
      await this.collection.updateOne({ _id: new ObjectId(cache._id) }, { $inc: { retries: 1 } });
    }
    return msg;
  }

  public async _send(cache: Cache, webhook: WebhookClient, payload: WebhookMessageCreateOptions) {
    try {
      return await webhook.send(payload);
    } catch (error: any) {
      // Unknown Webhook / Unknown Channel
      if ([10015, 10003].includes(error.code)) {
        await this.deleteWebhook(cache);
      }
      throw error;
    }
  }

  public async _edit(cache: Cache, webhook: WebhookClient, payload: WebhookMessageCreateOptions) {
    try {
      return await webhook.editMessage(cache.messageId!, payload);
    } catch (error: any) {
      if (error.code === 10008) return this.disableLog(cache);

      // Unknown Webhook / Unknown Channel
      if ([10015, 10003].includes(error.code)) {
        await this.deleteWebhook(cache);
      }
      throw error;
    }
  }

  public async disableLog(cache: Cache) {
    this.cached.delete(cache._id);
    await this.collection.updateOne({ _id: new ObjectId(cache._id) }, { $set: { disabled: true } });
    return null;
  }

  private async send(cache: Cache, webhook: WebhookClient) {
    const embed = await this.embed(cache);
    if (!embed) return null;

    try {
      return await this._send(cache, webhook, {
        embeds: [embed],
        threadId: cache.threadId,
        components: [this._components(cache)]
      });
    } catch (error: any) {
      this.client.logger.error(`${error as string} {${cache._id.toString()}}`, { label: 'AutoBoardLog' });
      return null;
    }
  }

  public async webhook(cache: Cache, channel: TextChannel | NewsChannel | ForumChannel | MediaChannel): Promise<WebhookClient | null> {
    if (cache.webhook) return cache.webhook;
    if (cache.deleted) return null;

    const webhook = await this.client.storage.getWebhook(channel).catch(() => null);
    if (webhook) {
      cache.webhook = new WebhookClient({ id: webhook.id, token: webhook.token! });
      await this.updateWebhook(cache, cache.webhook, cache.channelId);
      return cache.webhook;
    }

    cache.webhook = null;
    cache.deleted = true;
    return null;
  }

  private async edit(cache: Cache, webhook: WebhookClient) {
    const embed = await this.embed(cache);
    if (!embed) return null;

    try {
      return await this._edit(cache, webhook, {
        embeds: [embed],
        threadId: cache.threadId,
        components: [this._components(cache)]
      });
    } catch (error: any) {
      this.client.logger.error(`${error as string} {${cache.guildId.toString()}}`, { label: 'AutoBoardLog' });
      return null;
    }
  }

  private async embed(cache: Cache) {
    const guild = this.client.guilds.cache.get(cache.guildId);
    if (!guild) return null;

    if (cache.boardType === 'bb-legend-leaderboard') {
      const { embed, players } = await getBbLegendRankingEmbedMaker({ guild, limit: cache.limit, seasonId: Season.ID });
      if (!players.length) return null;

      return embed;
    }

    const { embed, players } = await getLegendRankingEmbedMaker({ guild, limit: cache.limit, seasonId: Season.ID });
    if (!players.length) return null;

    return embed;
  }

  public async init() {
    for await (const data of this.collection.find({ guildId: { $in: this.client.guilds.cache.map((guild) => guild.id) } })) {
      this.cached.set(data._id.toHexString(), {
        _id: data._id.toHexString(),
        guildId: data.guildId,
        boardType: data.boardType,
        color: data.color,
        limit: data.limit,
        offset: data.offset,
        channelId: data.channelId,
        messageId: data.messageId,
        updatedAt: data.updatedAt,
        webhook: data.webhook ? new WebhookClient(data.webhook) : null
      });
    }

    this._refresh();
  }

  public async add(_id: string) {
    const data = await this.collection.findOne({ _id: new ObjectId(_id) });
    if (!data) return null;

    this.cached.set(data._id.toHexString(), {
      _id: data._id.toHexString(),
      guildId: data.guildId,
      boardType: data.boardType,
      color: data.color,
      limit: data.limit,
      offset: data.offset,
      channelId: data.channelId,
      messageId: data.messageId,
      updatedAt: data.updatedAt,
      webhook: data.webhook ? new WebhookClient(data.webhook) : null
    });

    return this.exec(_id, { channelId: data.channelId });
  }

  public del(id: string) {
    return this.cached.delete(id);
  }

  private async _refresh() {
    if (this.timeout) clearTimeout(this.timeout);

    try {
      const guildIds = this.client.guilds.cache.map((guild) => guild.id);
      const cursor = this.client.db.collection(Collections.AUTO_BOARDS).aggregate([
        {
          $match: {
            guildId: { $in: guildIds },
            updatedAt: { $lte: new Date(Date.now() - this.refreshRate * 2) }
          }
        },
        {
          $lookup: {
            from: Collections.CLAN_STORES,
            localField: 'guildId',
            foreignField: 'guild',
            as: '_store',
            pipeline: [{ $match: { active: true, paused: false } }, { $project: { _id: 1 } }, { $limit: 1 }]
          }
        },
        { $unwind: { path: '$_store' } }
      ]);

      for await (const log of cursor) {
        if (!this.client.guilds.cache.has(log.guildId)) continue;
        if (log.disabled) continue;

        const logId = log._id.toHexString();
        if (this.queued.has(logId)) continue;

        this.queued.add(logId);
        await this.exec(logId, { channelId: log.channelId });
        this.queued.delete(logId);
        await Util.delay(3000);
      }
    } finally {
      this.timeout = setTimeout(this._refresh.bind(this), this.refreshRate).unref();
    }
  }
}

interface Cache {
  _id: string;
  guildId: Snowflake;
  boardType: string;
  channelId: Snowflake;
  messageId?: Snowflake;
  threadId?: string;
  color?: number | null;
  limit?: number;
  offset?: number;
  webhook: WebhookClient | null;
  updatedAt: Date;
  deleted?: boolean;
}
