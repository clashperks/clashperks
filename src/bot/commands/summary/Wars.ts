import { ClanWar, WarClan } from 'clashofclans.js';
import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Collections, Messages } from '../../util/Constants';
import { EMOJIS } from '../../util/Emojis';
import { Command } from '../../lib';
import moment from 'moment';
import { Util } from '../../util';

const states: Record<string, string> = {
	inWar: '**End Time~**',
	preparation: '**Start Time~**',
	warEnded: '**End Time~**'
};

export default class WarSummaryCommand extends Command {
	public constructor() {
		super('war-summary', {
			category: 'none',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
			defer: true
		});
	}

	public async exec(interaction: CommandInteraction) {
		const clans = await this.client.db.collection(Collections.CLAN_STORES).find({ guild: interaction.guild!.id }).toArray();
		if (!clans.length) return interaction.editReply(Messages.SERVER.NO_CLANS_LINKED);

		const embed = new MessageEmbed();
		for (const clan of clans) {
			const data = (await this.getWAR(clan.tag)) as ClanWar & { round?: number };
			if (!data.ok) continue;
			if (data.state === 'notInWar') continue;

			embed.addField(
				`${data.clan.name} ${EMOJIS.VS_BLUE} ${data.opponent.name} ${data.round ? `(CWL Round #${data.round})` : ''}`,
				[
					`${this.getLeaderBoard(data.clan, data.opponent)}`,
					`${states[data.state]} ${Util.getRelativeTime(moment(this._getTime(data)).toDate().getTime())}`,
					'\u200b'
				].join('\n')
			);
		}

		if (!embed.length) return interaction.editReply('**No clans are in war at this moment!**');
		const embeds = Array(Math.ceil(embed.fields.length / 15))
			.fill(0)
			.map(() => embed.fields.splice(0, 15))
			.map((fields) => new MessageEmbed({ color: this.client.embed(interaction), fields }));
		if (embeds.length === 1) return interaction.editReply({ embeds: [embeds.shift()!] });
		for (const embed of embeds) {
			await interaction.followUp({ embeds: [embed] });
		}
	}

	private get onGoingCWL() {
		return new Date().getDate() >= 1 && new Date().getDate() <= 10;
	}

	private getWAR(clanTag: string) {
		if (this.onGoingCWL) return this.getCWL(clanTag);
		return this.client.http.currentClanWar(clanTag);
	}

	private async getCWL(clanTag: string) {
		const res = await this.client.http.clanWarLeague(clanTag);
		if (res.statusCode === 504 || res.state === 'notInWar') return { statusCode: 504 };
		if (!res.ok) return this.client.http.currentClanWar(clanTag);
		const rounds = res.rounds.filter((d) => !d.warTags.includes('#0'));

		const chunks = [];
		for (const { warTags } of rounds.slice(-2)) {
			for (const warTag of warTags) {
				const data = await this.client.http.clanWarLeagueWar(warTag);
				if (!data.ok) continue;
				if (data.clan.tag === clanTag || data.opponent.tag === clanTag) {
					chunks.push({
						...data,
						round: res.rounds.findIndex((d) => d.warTags.includes(warTag)) + 1,
						clan: data.clan.tag === clanTag ? data.clan : data.opponent,
						opponent: data.clan.tag === clanTag ? data.opponent : data.clan
					});
					break;
				}
			}
		}

		if (!chunks.length) return { statusCode: 504 };
		return (
			chunks.find((en) => en.state === 'inWar') ??
			chunks.find((en) => en.state === 'preparation') ??
			chunks.find((en) => en.state === 'warEnded')
		);
	}

	private getLeaderBoard(clan: WarClan, opponent: WarClan) {
		return [
			`${EMOJIS.STAR} ${clan.stars}/${opponent.stars}`,
			`${EMOJIS.SWORD} ${clan.attacks}/${opponent.attacks}`,
			`${EMOJIS.FIRE} ${clan.destructionPercentage.toFixed(2)}%/${opponent.destructionPercentage.toFixed(2)}%`
		].join(' ');
	}

	private _getTime(data: ClanWar) {
		return data.state === 'preparation' ? data.startTime : data.endTime;
	}
}
