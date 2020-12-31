import { Listener, Command } from 'discord-akairo';
import { TextChannel, Message } from 'discord.js';

interface Text {
	[key: string]: string | null;
}

const texts: Text = {
	guild: 'You must be in a guild to use this command.',
	restrict: 'You can\'t use this command because you have been restricted.'
};

export default class CommandBlockedListener extends Listener {
	public constructor() {
		super('commandBlocked', {
			event: 'commandBlocked',
			emitter: 'commandHandler',
			category: 'commandHandler'
		});
	}

	public exec(message: Message, command: Command, reason: string) {
		const msg = texts[reason];

		const label = message.guild ? `${message.guild.name}/${message.author.tag}` : `${message.author.tag}`;
		this.client.logger.debug(`${command.id} ~ ${reason}`, { label });

		if (!msg) return;
		if (message.guild ? (message.channel as TextChannel).permissionsFor(this.client.user!)?.has('SEND_MESSAGES') : true) {
			return message.channel.send(msg);
		}
	}
}
