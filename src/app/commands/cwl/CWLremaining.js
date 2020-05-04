const { Command, Argument, Flag } = require('discord-akairo');
const fetch = require('node-fetch');
const moment = require('moment');
const { MessageEmbed } = require('discord.js');
const { fetcherror } = require('../../util/constants');
const Resolver = require('../../struct/Resolver');
const { emoji } = require('../../util/emojis');
const { Util } = require('discord.js');

class CwlMissingComamnd extends Command {
	constructor() {
		super('cwl-missing', {
			aliases: ['cwl-remaining', 'cwl-missing'],
			category: 'cwl',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
			description: {
				content: 'Shows remaining attacks of current cwl.',
				usage: '<tag>',
				examples: ['#8QU8J9LP'],
				fields: [
					{
						name: 'Flags',
						value: [
							'`--round <num>` or `-r <num>` to see specific round.'
						]
					}
				]
			},
			optionFlags: ['--round', '-r']
		});
	}

	cooldown(message) {
		if (this.client.patron.get(message.guild.id, 'guild', false) || this.client.patron.get(message.author.id, 'user', false) || this.client.voter.isVoter(message.author.id)) return 2000;
		return 15000;
	}

	*args() {
		const round = yield {
			match: 'option',
			flag: ['--round', '-r'],
			type: Argument.range('integer', 1, Infinity, true)
		};

		const data = yield {
			type: async (message, args) => {
				const resolved = await Resolver.resolve(message, args);
				if (resolved.status !== 200) {
					await message.util.send({ embed: resolved.embed });
					return Flag.cancel();
				}
				return resolved;
			}
		};

		return { data, round };
	}

	async exec(message, { data, round }) {
		await message.util.send(`**Fetching data... ${emoji.loading}**`);
		const uri = `https://api.clashofclans.com/v1/clans/${encodeURIComponent(data.tag)}/currentwar/leaguegroup`;
		const res = await fetch(uri, {
			method: 'GET', timeout: 3000,
			headers: { accept: 'application/json', authorization: `Bearer ${process.env.CLASH_API}` }
		}).catch(() => null);

		if (!res) {
			return message.util.send({ embed: fetcherror(504) });
		}

		const body = await res.json();

		const embed = this.client.util.embed()
			.setColor(0x5970c1);

		if (!(body.state || res.ok)) {
			embed.setAuthor(`${data.name} (${data.tag})`, data.badgeUrls.medium, `https://link.clashofclans.com/?action=OpenClanProfile&tag=${data.tag}`)
				.setThumbnail(data.badgeUrls.medium)
				.setDescription('Clan is not in CWL');
			return message.util.send({ embed });
		}

		return this.rounds(message, body, data, round);
	}

	async rounds(message, body, clan, round) {
		const embed = new MessageEmbed()
			.setColor(0x5970c1);
		const availableRounds = body.rounds.filter(r => !r.warTags.includes('#0')).length;
		if (round && round > availableRounds) {
			embed.setAuthor(`${clan.name} (${clan.tag})`, clan.badgeUrls.medium, `https://link.clashofclans.com/?action=OpenClanProfile&tag=${clan.tag}`)
				.setDescription([
					'This round is not available yet!',
					'',
					'**Available Rounds**',
					'',
					new Array(availableRounds)
						.fill(0)
						.map((x, i) => `**\`${i + 1}\`** ${emoji.ok}`)
						.join('\n'),
					new Array(body.rounds.length - availableRounds)
						.fill(0)
						.map((x, i) => `**\`${i + availableRounds + 1}\`** ${emoji.wrong}`)
						.join('\n')
				]);
			return message.util.send({ embed });
		}
		const rounds = round
			? body.rounds[round - 1].warTags
			: body.rounds.filter(d => !d.warTags.includes('#0'))
				.slice(-2)
				.reverse()
				.pop()
				.warTags;

		for (const tag of rounds) {
			const res = await fetch(`https://api.clashofclans.com/v1/clanwarleagues/wars/${encodeURIComponent(tag)}`, {
				method: 'GET',
				headers: { accept: 'application/json', authorization: `Bearer ${process.env.CLASH_API}` }
			});
			const data = await res.json();
			if ((data.clan && data.clan.tag === clan.tag) || (data.opponent && data.opponent.tag === clan.tag)) {
				const myclan = data.clan.tag === clan.tag ? data.clan : data.opponent;
				const oppclan = data.clan.tag === clan.tag ? data.opponent : data.clan;
				embed.setAuthor(`${myclan.name} (${myclan.tag})`, myclan.badgeUrls.medium);
				if (data.state === 'warEnded') {
					let missing = '';
					let index = 0;
					for (const member of this.sort(myclan.members)) {
						if (member.attacks && member.attacks.length === 1) {
							++index;
							continue;
						}
						missing += `\`${this.index(++index)} ${this.padEnd(member.name)}\`\n`;
					}

					embed.setDescription([
						'**War Against**',
						`${oppclan.name} (${oppclan.tag})`,
						'',
						'**State**',
						'War Ended',
						'',
						`**Missed Attacks** - ${myclan.members.filter(m => !m.attacks).length}/${data.teamSize}`,
						missing || 'All Players Attacked'
					]);
					const end = new Date(moment(data.endTime).toDate()).getTime();
					embed.addField('War Ended', `${moment.duration(Date.now() - end).format('D [days], H [hours] m [mins]', { trim: 'both mid' })} ago`)
						.addField('Stats', [
							`**${data.clan.name}**`,
							`${emoji.star} ${data.clan.stars} ${emoji.fire} ${data.clan.destructionPercentage.toFixed(2)}% ${emoji.attacksword} ${data.clan.attacks}`,
							'',
							`**${data.opponent.name}**`,
							`${emoji.star} ${data.opponent.stars} ${emoji.fire} ${data.opponent.destructionPercentage.toFixed(2)}% ${emoji.attacksword} ${data.opponent.attacks}`
						]);
				}
				if (data.state === 'inWar') {
					const started = new Date(moment(data.startTime).toDate()).getTime();
					let missing = '';
					let index = 0;
					for (const member of this.sort(myclan.members)) {
						if (member.attacks && member.attacks.length === 1) {
							++index;
							continue;
						}
						missing += `\`${this.index(++index)} ${this.padEnd(member.name)}\`\n`;
					}

					embed.setDescription([
						'**War Against**',
						`${oppclan.name} (${oppclan.tag})`,
						'',
						'**State**',
						'In War',
						'',
						`**Missing Attacks** - ${myclan.members.filter(m => !m.attacks).length}/${data.teamSize}`,
						missing || 'All Players Attacked'
					]);
					embed.addField('Started', `${moment.duration(Date.now() - started).format('D [days], H [hours] m [mins]', { trim: 'both mid' })} ago`)
						.addField('Stats', [
							`**${data.clan.name}**`,
							`${emoji.star} ${data.clan.stars} ${emoji.fire} ${data.clan.destructionPercentage.toFixed(2)}% ${emoji.attacksword} ${data.clan.attacks}`,
							'',
							`**${data.opponent.name}**`,
							`${emoji.star} ${data.opponent.stars} ${emoji.fire} ${data.opponent.destructionPercentage.toFixed(2)}% ${emoji.attacksword} ${data.opponent.attacks}`
						]);
				}
				if (data.state === 'preparation') {
					embed.addField('War Against', `${oppclan.name} (${oppclan.tag})`);
					const start = new Date(moment(data.startTime).toDate()).getTime();
					embed.addField('State', 'Preparation Day')
						.addField('Starting In', `${moment.duration(start - Date.now()).format('D [days], H [hours] m [mins]', { trim: 'both mid' })}`);
				}

				embed.setFooter(`Round #${round || body.rounds.findIndex(round => round.warTags === rounds) + 1}`);
			}
		}
		return message.util.send({ embed });
	}

	sort(items) {
		return items.sort((a, b) => a.mapPosition - b.mapPosition);
	}

	index(num) {
		return num.toString().padStart(2, '0');
	}

	padEnd(data) {
		return Util.escapeInlineCode(data).padEnd(20, ' ');
	}
}

module.exports = CwlMissingComamnd;
