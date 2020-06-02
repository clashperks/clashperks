const { Command, Flag } = require('discord-akairo');
const Resolver = require('../../struct/Resolver');
const { Util } = require('discord.js');

class TrophyBoardCommand extends Command {
	constructor() {
		super('trophies', {
			aliases: ['trophies', 'trophyboard', 'tb'],
			category: 'activity',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
			description: {
				content: 'List of clan members with trophies.',
				usage: '<clanTag>',
				examples: ['#2Q98URCGY', '2Q98URCGY']
			}
		});
	}

	*args() {
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

		return { data };
	}

	cooldown(message) {
		if (this.client.patron.isPatron(message.author, message.guild) || this.client.voteHandler.isVoter(message.author.id)) return 1000;
		return 3000;
	}

	async exec(message, { data }) {
		const embed = this.client.util.embed()
			.setColor(0x5970c1)
			.setAuthor(`${data.name} (${data.tag}) ~ ${data.members}/50`, data.badgeUrls.medium);

		const header = `**\`# TROPHY  ${'NAME'.padEnd(20, ' ')}\`**`;
		const pages = [
			this.paginate(data.memberList, 0, 25)
				.items.map((member, index) => {
					const trophies = `${member.trophies.toString().padStart(5, ' ')}`;
					return `\`\u200e${(index + 1).toString().padStart(2, '0')} ${trophies}  ${this.padEnd(member.name)}\``;
				}),
			this.paginate(data.memberList, 25, 50)
				.items.map((member, index) => {
					const trophies = `${member.trophies.toString().padStart(5, ' ')}`;
					return `\`\u200e${(index + 26).toString().padStart(2, '0')} ${trophies}  ${this.padEnd(member.name)}\``;
				})
		];

		if (!pages[1].length) {
			return message.util.send({
				embed: embed.setDescription([
					header,
					pages[0].join('\n')
				])
			});
		}

		const msg = await message.util.send({
			embed: embed.setDescription([
				header,
				pages[0].join('\n')
			]).setFooter('Page 1/2')
		});

		for (const emoji of ['⬅️', '➡️']) {
			await msg.react(emoji);
			await this.delay(250);
		}

		const collector = msg.createReactionCollector(
			(reaction, user) => ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id,
			{ time: 45000, max: 10 }
		);

		collector.on('collect', async reaction => {
			if (reaction.emoji.name === '➡️') {
				await msg.edit({
					embed: embed.setDescription([
						header,
						pages[1].join('\n')
					]).setFooter('Page 2/2')
				});
				await this.delay(250);
				await reaction.users.remove(message.author.id);
				return message;
			}
			if (reaction.emoji.name === '⬅️') {
				await msg.edit({
					embed: embed.setDescription([
						header,
						pages[0].join('\n')
					]).setFooter('Page 1/2')
				});
				await this.delay(250);
				await reaction.users.remove(message.author.id);
				return message;
			}
		});

		collector.on('end', async () => {
			await msg.reactions.removeAll().catch(() => null);
			return message;
		});
		return message;
	}

	padEnd(data) {
		return Util.escapeInlineCode(data).padEnd(20, ' ');
	}

	donation(data) {
		return data.toString().padStart(5, ' ');
	}

	async delay(ms) {
		return new Promise(res => setTimeout(res, ms));
	}

	paginate(items, start, end) {
		return { items: items.slice(start, end) };
	}
}

module.exports = TrophyBoardCommand;
