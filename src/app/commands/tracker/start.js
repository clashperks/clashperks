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
				usage: '<clan tag> [channel] [hex color]>',
				examples: ['#8QU8J9LP', '#8QU8J9LP #tracker #5970C1']
			},
			args: [
				{
					id: 'data',
					type: 'string',
					unordered: true,
					prompt: {
						start: 'what clan do you want to track donations?',
						retry: (msg, { failure }) => failure.value
					}
				},
				{
					id: 'channel',
					type: 'textChannel',
					unordered: true,
					default: message => message.channel
				},
				{
					id: 'color',
					type: 'color',
					unordered: true,
					default: '#5970C1'
				}
			]
		});
	}

	async exec(message, { data, channel, color }) {
		const clans = await Clans.findAll({ where: { guild: message.guild.id } });
		if (clans.length >= 10) {
			return message.util.send([
				'You are already tracking 10 clans on this server!',
				'If you need more, please contact **SUVAJIT#5580**'
			]);
		}
		const existingTag = await Clans.findOne({
			where: {
				guild: message.guild.id, tag: data.tag
			}
		});

		if (existingTag) {
			await existingTag.update({
				channel: channel.id,
				color,
				user: message.author.tag
			});

			this.client.tracker.add(data.tag, message.guild.id, channel.id, color);
			const embed = new MessageEmbed()
				.setAuthor(`${data.name} ${data.tag}`, data.badgeUrls.small)
				.setDescription(`Started tracking in ${channel} (${channel.id})`)
				.setColor(color);
			return message.util.send({ embed });
		}

		await Clans.create({
			tag: data.tag,
			name: data.name,
			color,
			user: message.author.tag,
			channel: channel.id,
			guild: message.guild.id
		});

		this.client.tracker.add(data.tag, message.guild.id, channel.id, color);

		const embed = new MessageEmbed()
			.setAuthor(`${data.name} ${data.tag}`, data.badgeUrls.small)
			.setDescription(`Started tracking in ${channel} (${channel.id})`)
			.setColor(color);
		return message.util.send({ embed });
	}
}

module.exports = StartCommand;
