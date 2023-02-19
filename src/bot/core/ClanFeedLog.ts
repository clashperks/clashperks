import { Player } from 'clashofclans.js';
import { Collection, EmbedBuilder, parseEmoji, PermissionsString, WebhookClient, WebhookCreateMessageOptions } from 'discord.js';
import { ObjectId } from 'mongodb';
import { Client } from '../struct/Client.js';
import { ClanFeedLogModel } from '../types/index.js';
import { ClanFeedLogTypes, Collections, DeepLinkTypes } from '../util/Constants.js';
import { EMOJIS, SUPER_TROOPS, TOWN_HALLS } from '../util/Emojis.js';
import { Season, Util } from '../util/index.js';
import RAW_TROOPS_DATA from '../util/Troops.js';
import BaseLog from './BaseLog.js';

const OP: { [key: string]: number } = {
	NAME_CHANGE: 0xdf9666,
	TOWN_HALL_UPGRADE: 0x00dbf3,
	DONATION_RESET: 0xeffd5f,
	WAR_PREF_CHANGE: 0x00dbf3
};

const logTypes: Record<string, string> = {
	NAME_CHANGE: ClanFeedLogTypes.PlayerNameChange,
	TOWN_HALL_UPGRADE: ClanFeedLogTypes.TownHallUpgrade,
	DONATION_RESET: ClanFeedLogTypes.DonationReset,
	WAR_PREF_CHANGE: ClanFeedLogTypes.WarPreferenceChange
};

export default class ClanFeedLog extends BaseLog {
	public declare cached: Collection<string, Cache>;
	private readonly queued = new Set<string>();

	public constructor(client: Client) {
		super(client);
	}

	public override get permissions(): PermissionsString[] {
		return ['SendMessages', 'EmbedLinks', 'UseExternalEmojis', 'AddReactions', 'ReadMessageHistory', 'ViewChannel'];
	}

	public override get collection() {
		return this.client.db.collection(Collections.CLAN_FEED_LOGS);
	}

	public override async handleMessage(cache: Cache, webhook: WebhookClient, data: Feed) {
		const members = data.members.filter((mem) => Object.keys(OP).includes(mem.op));
		if (!members.length) return null;
		const delay = members.length >= 5 ? 2000 : 250;

		members.sort((a, b) => a.rand - b.rand);
		const messages = (await Promise.all(members.map((mem) => this.embed(cache, mem, data)))).filter((m) => m);

		for (const message of messages) {
			if (!message) continue;
			const msg = await this.send(cache, webhook, {
				embeds: [message.embed],
				threadId: cache.threadId
			});
			await this.updateMessageId(cache, msg);
			await Util.delay(delay);
		}

		return members.length;
	}

	private async send(cache: Cache, webhook: WebhookClient, payload: WebhookCreateMessageOptions) {
		try {
			return await super._send(cache, webhook, payload);
		} catch (error: any) {
			this.client.logger.error(`${error as string} {${cache.clanId.toString()}}`, { label: 'DonationLog' });
			return null;
		}
	}

	private async embed(cache: Cache, member: Member, data: Feed) {
		const player: Player = await this.client.http.player(member.tag);
		if (!player.ok) return null;

		// do not post if the logTypes are set and the logType is not included
		if (cache.logTypes && !cache.logTypes.includes(logTypes[member.op])) return null;

		let content: null | string = null;
		const embed = new EmbedBuilder().setColor(OP[member.op]).setTitle(`\u200e${player.name} (${player.tag})`);
		if (!cache.deepLink || cache.deepLink === DeepLinkTypes.OpenInCOS) {
			embed.setURL(`https://www.clashofstats.com/players/${player.tag.replace('#', '')}`);
		}
		if (cache.deepLink === DeepLinkTypes.OpenInGame) {
			embed.setURL(`https://link.clashofclans.com/?action=OpenPlayerProfile&tag=${encodeURIComponent(player.tag)}`);
		}

		if (member.op === 'NAME_CHANGE') {
			embed.setDescription(`Name changed from **${member.name}**`);
			embed.setFooter({ text: `${data.clan.name}`, iconURL: data.clan.badge });
		}
		if (member.op === 'DONATION_RESET') {
			embed.setFooter({ text: `${data.clan.name}`, iconURL: data.clan.badge });
			embed.setDescription(
				`Reset Donations/Receives **${member.donations}**${EMOJIS.UP_KEY} **${member.donationsReceived}**${EMOJIS.DOWN_KEY}`
			);
		}
		if (member.op === 'TOWN_HALL_UPGRADE') {
			if (cache.role) content = `<@&${cache.role}>`;
			const { id } = parseEmoji(TOWN_HALLS[player.townHallLevel])!;
			embed.setThumbnail(`https://cdn.discordapp.com/emojis/${id!}.png?v=1`);
			embed.setFooter({ text: `${data.clan.name}`, iconURL: data.clan.badge });
			embed.setDescription(
				`Town Hall was upgraded to ${player.townHallLevel} with ${this.remainingUpgrades(player)}% remaining troop upgrades.`
			);
		}
		if (member.op === 'WAR_PREF_CHANGE' && player.warPreference) {
			const { id } = parseEmoji(TOWN_HALLS[player.townHallLevel])!;
			embed.setThumbnail(`https://cdn.discordapp.com/emojis/${id!}.png?v=1`);
			embed.setFooter({ text: `${data.clan.name}`, iconURL: data.clan.badge });
			if (player.warPreference === 'in') {
				embed.setDescription(`**Opted in** to be included in clan wars.`);
				embed.setColor('#6dbc1e');
			}
			if (player.warPreference === 'out') {
				embed.setDescription(`**Opted out** to be left out of clan wars.`);
				embed.setColor('#d74c1d');
			}
		}
		embed.setTimestamp();
		return { embed, content };
	}

	private labRushed(data: Player) {
		const apiTroops = this.apiTroops(data);
		const rem = RAW_TROOPS_DATA.TROOPS.filter((unit) => !unit.seasonal && !(unit.name in SUPER_TROOPS)).reduce(
			(prev, unit) => {
				const apiTroop = apiTroops.find((u) => u.name === unit.name && u.village === unit.village && u.type === unit.category);
				if (unit.village === 'home') {
					prev.levels += Math.min(apiTroop?.level ?? 0, unit.levels[data.townHallLevel - 2]);
					prev.total += unit.levels[data.townHallLevel - 2];
				}
				return prev;
			},
			{ total: 0, levels: 0 }
		);
		if (rem.total === 0) return 0;
		return 100 - (rem.levels * 100) / rem.total;
	}

	private remainingUpgrades(data: Player) {
		const lab = this.labRushed(data);
		const heroes = this.heroRushed(data);
		return ((lab + heroes) / 2).toFixed(2);
	}

	private heroRushed(data: Player) {
		const apiTroops = this.apiTroops(data);
		const rem = RAW_TROOPS_DATA.TROOPS.filter((unit) => !unit.seasonal && !(unit.name in SUPER_TROOPS)).reduce(
			(prev, unit) => {
				const apiTroop = apiTroops.find((u) => u.name === unit.name && u.village === unit.village && u.type === unit.category);
				if (unit.category === 'hero' && unit.village === 'home') {
					prev.levels += Math.min(apiTroop?.level ?? 0, unit.levels[data.townHallLevel - 2]);
					prev.total += unit.levels[data.townHallLevel - 2];
				}
				return prev;
			},
			{ total: 0, levels: 0 }
		);
		if (rem.total === 0) return 0;
		return 100 - (rem.levels * 100) / rem.total;
	}

	private apiTroops(data: Player) {
		return [
			...data.troops.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'troop',
				village: u.village
			})),
			...data.heroes.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'hero',
				village: u.village
			})),
			...data.spells.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'spell',
				village: u.village
			}))
		];
	}

	public async init() {
		await this.collection.find({ guild: { $in: this.client.guilds.cache.map((guild) => guild.id) } }).forEach((data) => {
			this.cached.set((data.clanId as ObjectId).toHexString(), {
				clanId: data.clanId,
				guild: data.guild,
				channel: data.channel,
				tag: data.tag,
				deepLink: data.deepLink,
				logTypes: data.logTypes,
				role: data.role,
				retries: data.retries ?? 0,
				webhook: data.webhook?.id ? new WebhookClient(data.webhook) : null
			});
		});
	}

	public async add(id: string) {
		const data = await this.collection.findOne({ clanId: new ObjectId(id) });
		if (!data) return null;

		return this.cached.set(id, {
			clanId: data.clanId,
			guild: data.guild,
			channel: data.channel,
			tag: data.tag,
			role: data.role,
			deepLink: data.deepLink,
			logTypes: data.logTypes,
			retries: data.retries ?? 0,
			webhook: data.webhook?.id ? new WebhookClient(data.webhook) : null
		});
	}

	private async _refresh() {
		const logs = await this.client.db
			.collection(Collections.CLAN_FEED_LOGS)
			.aggregate<ClanFeedLogModel & { _id: ObjectId }>([
				{ $match: { lastPosted: { $lte: new Date(Season.endTimestamp) } } },
				{
					$lookup: {
						from: Collections.CLAN_STORES,
						localField: 'clanId',
						foreignField: '_id',
						as: '_store',
						pipeline: [{ $match: { active: true, paused: false } }, { $project: { _id: 1 } }]
					}
				},
				{ $unwind: { path: '$_store' } }
			])
			.toArray();

		for (const log of logs) {
			if (!this.client.guilds.cache.has(log.guild)) continue;
			if (this.queued.has(log._id.toHexString())) continue;

			this.queued.add(log._id.toHexString());
			await this.exec(log.tag, {});
			this.queued.delete(log._id.toHexString());
			await Util.delay(3000);
		}
	}
}

interface Member {
	op: string;
	tag: string;
	name: string;
	rand: number;
	role: string;
	donations: number;
	donationsReceived: number;
}

interface Feed {
	clan: {
		tag: string;
		name: string;
		badge: string;
	};
	members: Member[];
	memberList: {
		tag: string;
		role: string;
		clan: { tag: string };
	}[];
}

interface Cache {
	tag: string;
	clanId: ObjectId;
	webhook: WebhookClient | null;
	deleted?: boolean;
	channel: string;
	role?: string;
	guild: string;
	threadId?: string;
	logTypes?: string[];
	deepLink?: string;
	retries: number;
}
