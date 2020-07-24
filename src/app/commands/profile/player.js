const { Command, Flag } = require('discord-akairo');
const { mongodb } = require('../../struct/Database');
const Resolver = require('../../struct/Resolver');

class LinkPlayerCommand extends Command {
	constructor() {
		super('link-player', {
			aliases: ['link-profile', 'save-profile', 'link-player'],
			category: 'hidden',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS'],
			description: {
				content: 'Saves a player to your discord account.',
				usage: '<tag> [member]',
				examples: ['#9Q92C8R20', '#9Q92C8R20 Suvajit']
			}
		});
	}

	*args() {
		const data = yield {
			type: async (message, args) => {
				const resolved = await Resolver.player(args);
				if (resolved.status !== 200) {
					await message.channel.send({ embed: resolved.embed });
					return Flag.cancel();
				}
				return resolved;
			},
			prompt: {
				start: 'What is your player tag?',
				retry: (msg, { failure }) => failure.value
			}
		};

		const member = yield {
			type: 'member',
			default: message => message.member
		};

		return { data, member };
	}

	cooldown(message) {
		if (this.client.patron.check(message.author, message.guild)) return 1000;
		return 3000;
	}

	async exec(message, { data, member }) {
		if (member.user.bot) return message.util.send('Bots can\'t link accounts.');
		const doc = await this.getPlayer(data.tag);
		if (doc && doc.user === member.id) {
			return message.util.send({
				embed: {
					description: `**${member.user.tag}** is already linked to **${data.name} (${data.tag})**`
				}
			});
		}

		if (doc && doc.user !== member.id) {
			return message.util.send({
				embed: {
					description: `**${data.name} (${data.tag})** is already linked to another Discord.`
				}
			});
		}

		if (doc && doc.tags.length >= 30) {
			return message.util.send({
				embed: {
					description: 'You can only link 25 accounts to your Discord.'
				}
			});
		}

		await mongodb.db('clashperk').collection('linkedusers')
			.updateOne({ user: member.id }, {
				$set: {
					user: member.id,
					hidden: false,
					default: false,
					createdAt: new Date()
				},
				$push: { tags: data.tag }
			}, { upsert: true });

		const prefix = this.handler.prefix(message);
		const embed = this.client.util.embed()
			.setColor(this.client.embed(message))
			.setDescription([
				`Linked **${member.user.tag}** to **${data.name}** (${data.tag})`,
				'',
				'If you don\'t provide the tag for other lookup comamnds, the bot will use the first one you linked.'
			]);
		return message.util.send({ embed });
	}

	async getPlayer(tag) {
		return mongodb.db('clashperk').collection('linkedusers').findOne({ tags: tag });
	}
}

module.exports = LinkPlayerCommand;
