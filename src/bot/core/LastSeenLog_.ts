import { MessageEmbed, Collection, TextChannel, PermissionString, Snowflake, Message } from 'discord.js';
import { Collections } from '../util/Constants';
import { Clan } from 'clashofclans.js';
import Client from '../struct/Client';
import { ObjectId } from 'mongodb';
import { Util } from '../util/Util';

interface Cache {
	tag: string;
	_id: ObjectId;
	color?: number;
	guild: Snowflake;
	channel: Snowflake;
	message?: Snowflake;
	updatedAt?: Date;
}

export default class LastSeenLog {
	public lastReq: Map<string, NodeJS.Timeout>;
	public cached = new Collection<string, Cache>();
	protected collection = this.client.db.collection(Collections.LAST_SEEN_LOGS);

	public constructor(private readonly client: Client) {
		this.lastReq = new Map();
	}

	public async exec(tag: string, clan: Clan, members = []) {
		const clans = this.cached.filter(cache => cache.tag === tag);
		for (const id of clans.keys()) {
			const cache = this.cached.get(id);
			if (cache) await this.permissionsFor(cache, clan, members);
		}

		return clans.clear();
	}

	private async throttle(id: string) {
		if (this.lastReq.has(id)) await Util.delay(1000);

		if (this.lastReq.has(id)) {
			clearTimeout(this.lastReq.get(id)!);
			this.lastReq.delete(id);
		}

		const timeoutId = setTimeout(() => {
			this.lastReq.delete(id);
			clearTimeout(timeoutId);
		}, 1000);
		this.lastReq.set(id, timeoutId);

		return Promise.resolve(0);
	}

	private async permissionsFor(cache: Cache, clan: Clan, members = []) {
		const permissions: PermissionString[] = [
			'READ_MESSAGE_HISTORY',
			'SEND_MESSAGES',
			'EMBED_LINKS',
			'USE_EXTERNAL_EMOJIS',
			'ADD_REACTIONS',
			'VIEW_CHANNEL'
		];

		if (this.client.channels.cache.has(cache.channel)) {
			const channel = this.client.channels.cache.get(cache.channel)! as TextChannel;
			if (channel.permissionsFor(channel.guild.me!)!.has(permissions, false)) {
				await this.throttle(channel.id);
				return this.handleMessage(cache, channel, clan, members);
			}
		}
	}

	private async handleMessage(cache: Cache, channel: TextChannel, clan: Clan, members = []) {
		if (!cache.message) {
			const msg = await this.send(cache, channel, clan, members);
			channel.messages.cache.delete(msg!.id);
			return this.mutate(cache, msg);
		}

		const msg = await this.edit(cache, channel, clan, members);
		channel.messages.cache.delete(msg!.id);
		return this.mutate(cache, msg);
	}

	private async send(cache: Cache, channel: TextChannel, clan: Clan, members = []) {
		const embed = this.embed(clan, cache, members);
		return channel.send({ embeds: [embed] }).catch(() => null);
	}

	private async edit(cache: Cache, channel: TextChannel, clan: Clan, members = []) {
		const embed = this.embed(clan, cache, members);

		return channel.messages.edit(cache.message!, { embeds: [embed] })
			.catch(error => {
				if (error.code === 10008) {
					delete cache.message;
					return this.send(cache, channel, clan, members);
				}
				return null;
			});
	}

	private async mutate(cache: Cache, msg: Message | null) {
		if (msg) {
			await this.collection.updateOne(
				{ clan_id: new ObjectId(cache._id) },
				{
					$set: {
						failed: 0,
						message: msg.id,
						updatedAt: new Date()
					}
				}
			);
			cache.message = msg.id;
		} else {
			await this.collection.updateOne(
				{ clan_id: new ObjectId(cache._id) }, { $inc: { failed: 1 } }
			);
		}
		return msg;
	}

	private embed(clan: Clan, cache: Cache, members: { name: string; count: number; lastSeen: number }[]) {
		const getTime = (ms?: number) => {
			if (!ms) return ''.padEnd(7, ' ');
			return Util.duration(ms + 1e3).padEnd(7, ' ');
		};

		const embed = new MessageEmbed();
		if (cache.color) embed.setColor(cache.color);
		embed.setAuthor(`${clan.name} (${clan.tag})`, clan.badgeUrls.medium);
		embed.setDescription([
			`**[Last seen and last 24h activity scores](https://clashperk.com/faq)**`,
			`\`\`\`\n\u200eLAST-ON 24H  NAME`,
			members.map(
				m => `${getTime(m.lastSeen)}  ${Math.min(99, m.count).toString().padStart(2, ' ')}  ${m.name}`
			).join('\n'),
			'\`\`\`'
		].join('\n'));
		embed.setFooter(`Synced [${members.length}/${clan.members}]`);
		embed.setTimestamp();

		return embed;
	}

	private start() {
		this.cached.filter(
			cache => {
				if (!cache.updatedAt) return true;
				return (Date.now() - (2 * 60 * 1000)) >= cache.updatedAt.getTime();
			}
		);
	}

	public async init() {
		await this.collection.find({ guild: { $in: this.client.guilds.cache.map(guild => guild.id) } })
			.forEach(data => {
				this.cached.set((data.clan_id as ObjectId).toHexString(), {
					_id: data.clan_id,
					guild: data.guild,
					color: data.color,
					tag: data.tag,
					channel: data.channel,
					message: data.message
				});
			});
	}

	public async add(_id: string) {
		const data = await this.collection.findOne({ clan_id: new ObjectId(_id) });

		if (!data) return null;
		return this.cached.set(_id, {
			_id: data.clan_id,
			guild: data.guild,
			color: data.color,
			tag: data.tag,
			channel: data.channel,
			message: data.message
		});
	}

	public delete(_id: string) {
		return this.cached.delete(_id);
	}
}