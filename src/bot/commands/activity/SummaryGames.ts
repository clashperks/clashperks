import { ClanGames, Collections } from '@clashperk/node';
import { BLUE_NUMBERS } from '../../util/NumEmojis';
import { Message, Guild } from 'discord.js';
import { EMOJIS } from '../../util/Emojis';
import { Command } from 'discord-akairo';
import moment from 'moment';

interface Prop {
	count: number;
	name: string;
	tag: string;
	total: number;
	endedAt?: any;
}

export default class ClanGamesSummaryCommand extends Command {
	public constructor() {
		super('clan-games-summary', {
			category: 'activity',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
			description: {},
			args: [
				{
					'id': 'guild',
					'type': (msg, id) => this.client.guilds.cache.get(id) ?? null,
					'default': (message: Message) => message.guild
				}
			]
		});
	}

	public async exec(message: Message, { guild }: { guild: Guild }) {
		const tags = await this.client.db.collection(Collections.CLAN_STORES)
			.find({ guild: guild.id })
			.toArray();
		if (!tags.length) return message.util!.send(`**${message.guild!.name} does not have any clans. Why not add some?**`);

		const clans = await this.client.db.collection(Collections.CLAN_GAMES)
			.find({ tag: { $in: [...tags.map(d => d.tag)] } })
			.toArray();

		const patron = this.client.patrons.get(message.guild!.id);
		if ((clans.length < 3 && !patron) || clans.length < 2) {
			return message.util!.send(`**You must have minimum ${patron ? 2 : 3} clans in your server to use this command.**`);
		}

		const performances: Prop[] = clans.map(clan => ({
			count: clan.maxCount,
			name: clan.name,
			tag: clan.tag,
			total: clan.total,
			endedAt: clan.endedAt
		}));

		const embed = this.client.util.embed()
			.setColor(this.client.embed(message))
			.setAuthor('Clan Games Stats', message.guild!.iconURL()!)
			.setFooter(`${moment(clans[0].updatedAt).format('MMMM YYYY')}`, this.client.user!.displayAvatarURL())
			.setDescription([
				'**Scoreboard**',
				'Based on highest scores and completion times.',
				`${EMOJIS.HASH} **\`\u200e  ${'SCORE'.padEnd(6, ' ')} ${'CLAN'.padEnd(16, ' ')}\u200f\`**`,
				...performances
					.sort((a, b) => b.total - a.total).sort((a, b) => a.endedAt - b.endedAt)
					.map((clan, i) => `${BLUE_NUMBERS[++i]} \`\u200e ${(clan.total || 0).toString().padStart(6, ' ')}  ${clan.name.padEnd(16, ' ')}\u200f\``),
				'',
				'**Performance**',
				'Based on completing maximum points.',
				`${EMOJIS.HASH} **\`\u200e ${Math.floor(ClanGames.MAX_POINT / 1000)}K  ${'CLAN'.padEnd(20, ' ')}\u200f\`**`,
				...performances.sort((a, b) => b.count - a.count)
					.map((clan, i) => `${BLUE_NUMBERS[++i]} \`\u200e ${clan.count.toString().padStart(2, ' ')}  ${clan.name.padEnd(20, ' ')}\u200f\``)
			]);

		return message.util!.send({ embed });
	}
}