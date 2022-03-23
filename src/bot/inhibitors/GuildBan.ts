import { Settings } from '../util/Constants';
import { Inhibitor } from '../lib';
import { Interaction } from 'discord.js';

export default class GuildBanInhibitor extends Inhibitor {
	public constructor() {
		super('guild-blacklist', {
			reason: 'blacklist',
			priority: 2
		});
	}

	public exec(interaction: Interaction) {
		if (this.client.isOwner(interaction.user.id)) return false;
		if (!interaction.guild) return false;
		const blacklist = this.client.settings.get<string[]>('global', Settings.GUILD_BLACKLIST, []);
		return blacklist.includes(interaction.guild.id);
	}
}
