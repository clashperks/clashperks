import { Listener, Command } from 'discord-akairo';
import { Message } from 'discord.js';

export default class CommandCancelledListener extends Listener {
	public constructor() {
		super('commandCancelled', {
			event: 'commandCancelled',
			emitter: 'commandHandler',
			category: 'commandHandler'
		});
	}

	public exec(message: Message, command: Command) {
		const label = message.guild ? `${message.guild.name}/${message.author.tag} ${message.interaction ? '/' : ''}` : `${message.author.tag}`;
		this.client.logger.debug(`${command.id} ~ commandCancelled`, { label });

		// Counters
		return this.counter(message, command);
	}

	private counter(message: Message, command: Command) {
		if ('token' in message) this.client.stats.interactions(message as any, command.id);
		if (command.category.id === 'owner') return;
		if (this.client.isOwner(message.author.id)) return;
		this.client.stats.users(message.author);
		this.client.stats.commands(command.id);
		if (message.guild) this.client.stats.guilds(message.guild);
	}
}
