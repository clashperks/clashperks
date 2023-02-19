import { CommandInteraction, EmbedBuilder } from 'discord.js';
import moment from 'moment';
import { Collections } from '../../util/Constants.js';
import { Command } from '../../lib/index.js';
import Google from '../../struct/Google.js';
import { UserInfoModel } from '../../types/index.js';
import { Util } from '../../util/index.js';

export default class TimezoneCommand extends Command {
	public constructor() {
		super('timezone', {
			category: 'none',
			clientPermissions: ['EmbedLinks'],
			channel: 'guild',
			description: {
				content: 'Sets your timezone offset.'
			},
			defer: true,
			ephemeral: true
		});
	}

	public async exec(interaction: CommandInteraction<'cached'>, args: { location: string }) {
		const raw = await Google.timezone(args.location);
		if (!raw) return interaction.editReply(this.i18n('command.timezone.no_result', { lng: interaction.locale }));

		const offset = Number(raw.timezone.rawOffset) + Number(raw.timezone.dstOffset);
		await this.client.db.collection<UserInfoModel>(Collections.USERS).updateOne(
			{ userId: interaction.user.id },
			{
				$set: {
					username: interaction.user.tag,
					timezone: {
						id: raw.timezone.timeZoneId,
						offset: Number(offset),
						name: raw.timezone.timeZoneName,
						location: raw.location.formatted_address
					}
				},
				$setOnInsert: {
					createdAt: new Date()
				}
			},
			{ upsert: true }
		);

		const embed = new EmbedBuilder()
			.setColor(this.client.embed(interaction))
			.setTitle(`${raw.location.formatted_address}`)
			.setDescription(
				[
					`**${raw.timezone.timeZoneName}**`,
					moment(new Date(Date.now() + offset * 1000)).format('MM/DD/YYYY hh:mm A'),
					'',
					'**Offset**',
					`${offset < 0 ? '-' : '+'}${Util.timezoneOffset(offset * 1000)}`
				].join('\n')
			)
			.setFooter({ text: `${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
		return interaction.editReply({ embeds: [embed] });
	}
}
