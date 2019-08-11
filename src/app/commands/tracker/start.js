const { Command } = require('discord-akairo');
const Clans = require('../../models/Clans');
const { MessageEmbed } = require('discord.js');

class StartCommand extends Command {
	constructor() {
		super('start', {
			aliases: ['start'],
			category: 'tracker',
			channel: 'guild',
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['ADD_REACTIONS', 'EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
			description: {
				content: 'Starts the donation tracker in a channel.',
				usage: '<clan tag> [channel/hexColor] [hexColor/channel]',
				examples: ['#8QU8J9LP', '#8QU8J9LP #tracker #5970C1', '#8QU8J9LP #5970C1 #tracker']
			}
		});
	}

	*args() {
		const data = yield {
			type: 'clan',
			unordered: false,
			prompt: {
				start: 'what clan do you want to track donations?',
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
			default: '#5970C1'
		};

		return { data, channel, color };
	}

	async exec(message, { data, channel, color }) {
		const clans = await Clans.findAll({ where: { guild: message.guild.id } });
		const limit = this.client.settings.get(message.guild, 'clanLimit', 3);
		if (clans.length >= limit) {
			return message.util.send([
				`You are already tracking ${clans.length} clans on this server!`,
				`If you need more, please contact **${this.client.users.get(this.client.ownerID).tag}**`
			]);
		}
		const clan = await Clans.findOne({
			where: {
				guild: message.guild.id, tag: data.tag
			}
		});

		if (clan) {
			await clan.update({
				channel: channel.id,
				color,
				user: message.author.tag
			});
		} else {
			await Clans.create({
				tag: data.tag,
				name: data.name,
				color,
				user: message.author.tag,
				channel: channel.id,
				guild: message.guild.id
			});
		}

		this.client.tracker.add(data.tag, message.guild.id, channel.id, color);

		const embed = new MessageEmbed()
			.setAuthor(`${data.name} ${data.tag}`, data.badgeUrls.small)
			.setDescription(`Started tracking in ${channel} (${channel.id})`)
			.setColor(color);
		return message.util.send({ embed });
	}
}

module.exports = StartCommand;
