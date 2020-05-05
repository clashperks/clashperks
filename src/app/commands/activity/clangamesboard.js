const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const { mongodb } = require('../../struct/Database');
const { MODES } = require('../../util/constants');

class ClanGamesBoardCommand extends Command {
	constructor() {
		super('clangamesboard', {
			aliases: ['clangamesboard', 'cgboard', 'clangameboard'],
			category: 'activity',
			channel: 'guild',
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['ADD_REACTIONS', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
			description: {
				content: 'Setup a live updating clan-games board.',
				usage: '<clanTag> [channel/color] [color/channel]',
				examples: ['#8QU8J9LP', '#8QU8J9LP #clan-games #5970C1', '#8QU8J9LP #5970C1 #clan-games']
			}
		});
	}

	*args() {
		const data = yield {
			type: 'clan',
			unordered: false,
			prompt: {
				start: 'What clan do you want to track clan games?',
				retry: (msg, { failure }) => failure.value
			}
		};

		const channel = yield {
			type: 'textChannel',
			unordered: [1, 2],
			default: message => message.channel
		};

		const color = yield {
			type: 'color',
			unordered: [1, 2],
			default: 5861569
		};

		return { data, channel, color };
	}

	cooldown(message) {
		if (this.client.patron.get(message.guild.id, 'guild', false) || this.client.patron.get(message.author.id, 'user', false) || this.client.voter.isVoter(message.author.id)) return 3000;
		return 20000;
	}

	async exec(message, { data, channel, color }) {
		const clans = await this.clans(message);
		const max = this.client.patron.get(message.guild.id, 'limit', 2);
		if (clans.length >= max && !clans.map(clan => clan.tag).includes(data.tag)) {
			const embed = this.client.util.embed()
				.setDescription([
					'You can only claim 2 clans per guild!',
					'',
					'**Want more than that?**',
					'Consider subscribing to one of our premium plans on Patreon',
					'',
					'[Become a Patron](https://www.patreon.com/bePatron?u=14584309)'
				])
				.setColor(5861569);
			return message.util.send({ embed });
		}

		const isPatron = this.client.patron.get(message.guild.id, 'guild', false) || this.client.patron.get(message.author.id, 'user', false);
		const isVoter = this.client.voter.isVoter(message.author.id);
		if (clans.length >= 1 && !clans.map(clan => clan.tag).includes(data.tag) && !(isVoter || isPatron)) {
			const embed = this.client.util.embed()
				.setDescription([
					'**Not Voted!**',
					'',
					'Want to claim one more clan? Please consider voting us on Discord Bot List',
					'',
					'[Vote ClashPerk](https://top.gg/bot/526971716711350273/vote)'
				])
				.setColor(5861569);
			return message.util.send({ embed });
		}

		const clan = clans.find(clan => clan.tag === data.tag) || { verified: false };
		if (!clan.verified && !data.description.toLowerCase().includes('cp')) {
			const embed = this.client.util.embed()
				.setAuthor(`${data.name} - Clan Games Board Setup`, data.badgeUrls.small)
				.setDescription([
					'**Clan Description**',
					`${data.description}`,
					'',
					'**Verify Your Clan**',
					'Add the word `CP` at the end of the clan description.',
					'You can remove it after verification.',
					'This is a security feature to ensure you have proper leadership of the clan.'
				]);
			return message.util.send({ embed });
		}

		const permissions = ['ADD_REACTIONS', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY', 'VIEW_CHANNEL'];
		if (!channel.permissionsFor(channel.guild.me).has(permissions, false)) {
			return message.util.send(`I\'m missing ${this.missingPermissions(channel, this.client.user, permissions)} to run that command.`);
		}

		const msg = await channel.send({
			embed: {
				description: 'Placeholder for Clan Games Board.'
			}
		});

		const id = await this.client.storage.register({
			mode: MODES[5],
			guild: message.guild.id,
			channel: channel.id,
			patron: this.client.patron.get(message.guild.id, 'guild', false),
			message: msg.id,
			name: data.name,
			tag: data.name,
			color
		});

		await this.client.cacheHandler.add(id, {
			mode: MODES[5],
			tag: data.tag,
			guild: message.guild.id
		});

		const embed = new MessageEmbed()
			.setAuthor(`${data.name} ${data.tag}`, data.badgeUrls.small)
			.setDescription(`Started clan games board in ${channel} (${channel.id})`)
			.setColor(color);
		if (message.channel.id !== channel.id) return message.util.send({ embed });
		return message;
	}

	async clans(message) {
		const collection = await mongodb.db('clashperk')
			.collection('clanstores')
			.find({ guild: message.guild.id })
			.toArray();
		return collection;
	}

	missingPermissions(channel, user, permissions) {
		const missingPerms = channel.permissionsFor(user).missing(permissions)
			.map(str => {
				if (str === 'VIEW_CHANNEL') return '`Read Messages`';
				return `\`${str.replace(/_/g, ' ').toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}\``;
			});

		return missingPerms.length > 1
			? `${missingPerms.slice(0, -1).join(', ')} and ${missingPerms.slice(-1)[0]}`
			: missingPerms[0];
	}
}

module.exports = ClanGamesBoardCommand;
