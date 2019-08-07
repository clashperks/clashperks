const { Listener } = require('discord-akairo');
const Logger = require('../../util/logger');

class CommandBlockedListener extends Listener {
	constructor() {
		super('commandBlocked', {
			event: 'commandBlocked',
			emitter: 'commandHandler',
			category: 'commandHandler'
		});
	}

	exec(message, command, reason) {
		const text = {
			guild: () => 'you must be in a guild to use this command.',
			restrict: () => 'you can\'t use this command because you have been restricted.'
		}[reason];

		const level = message.guild ? `${message.guild.name}/${message.author.tag}` : `${message.author.tag}`;
		Logger.log(`=> ${command.id} ~ ${reason}`, { level });

		if (!text) return;
		if (message.guild ? message.channel.permissionsFor(this.client.user).has('SEND_MESSAGES') : true) {
			return message.reply(text());
		}
	}
}

module.exports = CommandBlockedListener;
