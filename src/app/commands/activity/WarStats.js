const { Excel } = require('../../struct/ExcelHandler');
const { Command, Flag } = require('discord-akairo');
const Resolver = require('../../struct/Resolver');
const { MessageEmbed } = require('discord.js');

class WarStatsExport extends Command {
	constructor() {
		super('war-stats', {
			aliases: ['war-stats'],
			category: 'activity',
			clientPermissions: ['ATTACH_FILES', 'EMBED_LINKS'],
			description: {
				content: 'Export war attacks of clan members.',
				examples: ['#9Q92C8R20']
			}
		});
	}

	cooldown(message) {
		if (this.client.patron.check(message.author, message.guild)) return 1000;
		return 3000;
	}

	*args() {
		const data = yield {
			type: async (message, args) => {
				const resolved = await Resolver.resolve(message, args, true);
				if (resolved.status !== 200) {
					await message.channel.send({ embed: resolved.embed });
					return Flag.cancel();
				}
				return resolved;
			}
		};

		return { data };
	}

	async exec(message, { data }) {
		const patron = this.client.patron.check(message.author, message.guild);

		const chunks = [];
		const wars = await this.client.mongodb.collection('clanwarstores')
			.find({
				// $not: { isFreindly: true },
				$or: [{ 'clan.members.tag': data.tag }, { 'opponent.members.tag': data.tag }],
				state: { $in: ['inWar', 'warEnded'] }
			})
			.sort({ preparationStartTime: -1 })
			.toArray();

		const members = {};
		for (const war of wars) {
			const clan = war.clan.members.find(m => m.tag === data.tag) ? war.clan : war.opponent;

			for (const m of clan.members) {
				if (m.tag !== data.tag) continue;

				const mem = {
					stars: [],
					missed: 0,
					name: m.name,
					tag: m.tag,
					clan: clan.name,
					teamSize: war.teamSize,
					warType: war.groupWar ? 'CWL' : 'Regular',
					timestamp: new Date(war.preparationStartTime)
				};

				if (!m.attacks) {
					mem.stars = [0, 0, 0, 0];
					mem.missed = war.groupWar ? 1 : 2;
				}

				if (m.attacks?.length === 1) {
					mem.stars = m.attacks.map(m => [m.stars, m.destructionPercentage.toFixed(2)]).flat().concat(...[0, 0]);
					mem.missed = war.groupWar ? 0 : 1;
				}

				if (m.attacks?.length === 2) {
					mem.stars = m.attacks.map(m => [m.stars, m.destructionPercentage.toFixed(2)]).flat();
				}

				const member = members[m.tag]
					? members[m.tag]
					: members[m.tag] = {
						name: m.name,
						tag: m.tag,
						of: 0,
						attacks: 0,
						stars: 0,
						dest: 0,
						defStars: 0,
						defDestruction: 0,
						starTypes: [],
						defCount: 0
					};
				member.of += war.groupWar ? 1 : 2;

				if (m.attacks) {
					member.attacks += m.attacks.length;
					member.stars += m.attacks.reduce((prev, atk) => prev + atk.stars, 0);
					member.dest += m.attacks.reduce((prev, atk) => prev + atk.destructionPercentage, 0);
					member.starTypes.push(...m.attacks.map(atk => atk.stars));
				}

				if (m.bestOpponentAttack) {
					member.defStars += m.bestOpponentAttack.stars;
					member.defDestruction += m.bestOpponentAttack.destructionPercentage;
					member.defCount += 1;
				}

				chunks.push(mem);
			}
		}

		if (!chunks.length) return message.util.send('No data available at this moment!');

		const mem = Object.values(members)[0];
		const embed = new MessageEmbed()
			.setColor(this.client.embed(message))
			.setAuthor(
				`${data.name} (${data.tag})`,
				data.league?.iconUrls.small ?? `https://cdn.clashperk.com/assets/townhalls/${data.townHallLevel}.png`
			)
			.setDescription([
				'**Total Wars**',
				mem.of,
				'',
				'**Total Attacks**',
				mem.attacks,
				'',
				'**Total Stars**',
				mem.stars,
				'',
				'**Avg Destruction**',
				`${(mem.dest / mem.of || 0).toFixed(2)} %`,
				'',
				'**3 Stars**',
				this.starCount(mem.starTypes, 3),
				'',
				'**Missed**',
				mem.of - mem.attacks,
				'',
				'**Def Stars**',
				mem.defStars,
				'',
				'**Avg Def Destruction**',
				`${(mem.defDestruction / mem.defCount || 0).toFixed(2)} %`
			]);

		const msg = await message.util.send({ embed });
		await msg.react('📥');

		const collector = msg.createReactionCollector(
			(reaction, user) => ['📥'].includes(reaction.emoji.name) && user.id === message.author.id,
			{ time: 90000, max: 1 }
		);

		collector.on('collect', async reaction => {
			if (reaction.emoji.name === '📥') {
				if (!patron) {
					await message.channel.send({
						embed: {
							description: '[Become a Patron](https://www.patreon.com/clashperk) to export attack stats to Excel.'
						}
					});
				} else {
					const buffer = await this.excel(data, chunks);
					await message.util.send(`**${data.name} (${data.tag}) War Attack History**`, {
						files: [{
							attachment: Buffer.from(buffer), name: 'war_attack_history.xlsx'
						}]
					});
				}

				return collector.stop();
			}
		});

		collector.on('end', () => msg.reactions.removeAll().catch(() => null));
	}

	async excel(data, chunks) {
		const workbook = Excel();
		const sheet = workbook.addWorksheet(`${data.name} (${data.tag})`);
		sheet.columns = [
			// { header: 'Name', width: 16 },
			// { header: 'Tag', width: 16 },
			{ header: 'Clan', width: 16 },
			{ header: 'Date', width: 14 },
			{ header: 'War Type', width: 10 },
			{ header: 'Team Size', width: 10 },
			{ header: 'First Hit', width: 10 },
			{ header: 'Dest %', width: 10 },
			{ header: 'Second Hit', width: 10 },
			{ header: 'Dest %', width: 10 },
			{ header: 'Missed', width: 10 }
		];

		sheet.getRow(1).font = { bold: true, size: 10 };
		sheet.getRow(1).height = 40;

		for (let i = 1; i <= sheet.columns.length; i++) {
			sheet.getColumn(i).alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' };
		}

		sheet.addRows(chunks.reverse()
			.map(m => [
				// m.name,
				// m.tag,
				m.clan,
				m.timestamp,
				m.warType,
				m.teamSize,
				...m.stars,
				m.missed
			]));

		return workbook.xlsx.writeBuffer();
	}

	starCount(stars = [], count) {
		return stars.filter(star => star === count).length;
	}
}

module.exports = WarStatsExport;