import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, SelectMenuBuilder } from 'discord.js';
import { Command } from '../../lib/index.js';
import { EMOJIS } from '../../util/Emojis.js';
import { Util } from '../../util/index.js';

export default class ReminderNowCommand extends Command {
	public constructor() {
		super('reminder-now', {
			category: 'reminder',
			channel: 'guild',
			userPermissions: ['ManageGuild'],
			clientPermissions: ['EmbedLinks'],
			defer: true
		});
	}

	public async exec(interaction: CommandInteraction<'cached'>, args: { message: string; clans?: string }) {
		if (!args.message) return interaction.editReply(this.i18n('command.reminder.now.no_message', { lng: interaction.locale }));

		const tags = args.clans === '*' ? [] : this.client.resolver.resolveArgs(args.clans);
		const clans =
			args.clans === '*'
				? await this.client.storage.find(interaction.guildId)
				: await this.client.storage.search(interaction.guildId, tags);

		if (!clans.length && tags.length) return interaction.editReply(this.i18n('common.no_clans_found', { lng: interaction.locale }));
		if (!clans.length) {
			return interaction.editReply(this.i18n('common.no_clans_linked', { lng: interaction.locale }));
		}

		const CUSTOM_ID = {
			ROLES: this.client.uuid(interaction.user.id),
			TOWN_HALLS: this.client.uuid(interaction.user.id),
			REMAINING: this.client.uuid(interaction.user.id),
			CLANS: this.client.uuid(interaction.user.id),
			SAVE: this.client.uuid(interaction.user.id),
			WAR_TYPE: this.client.uuid(interaction.user.id)
		};

		const state = {
			remaining: ['1', '2'],
			townHalls: Array(13)
				.fill(0)
				.map((_, i) => (i + 2).toString()),
			roles: ['leader', 'coLeader', 'admin', 'member'],
			warTypes: ['cwl', 'normal', 'friendly'],
			clans: clans.map((clan) => clan.tag)
		};

		const mutate = (disable = false) => {
			const row0 = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
				new SelectMenuBuilder()
					.setPlaceholder('Select War Types')
					.setMaxValues(3)
					.setCustomId(CUSTOM_ID.WAR_TYPE)
					.setOptions([
						{
							label: 'Normal',
							value: 'normal',
							default: state.warTypes.includes('normal')
						},
						{
							label: 'Friendly',
							value: 'friendly',
							default: state.warTypes.includes('friendly')
						},
						{
							label: 'CWL',
							value: 'cwl',
							default: state.warTypes.includes('cwl')
						}
					])
					.setDisabled(disable)
			);

			const row1 = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
				new SelectMenuBuilder()
					.setPlaceholder('Select Attacks Remaining')
					.setMaxValues(2)
					.setCustomId(CUSTOM_ID.REMAINING)
					.setOptions([
						{
							description: '1 Attack Remaining',
							label: '1 Remaining',
							value: '1',
							default: state.remaining.includes('1')
						},
						{
							description: '2 Attacks Remaining',
							label: '2 Remaining',
							value: '2',
							default: state.remaining.includes('2')
						}
					])
					.setDisabled(disable)
			);
			const row2 = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
				new SelectMenuBuilder()
					.setPlaceholder('Select Town Halls')
					.setCustomId(CUSTOM_ID.TOWN_HALLS)
					.setMaxValues(13)
					.setOptions(
						Array(13)
							.fill(0)
							.map((_, i) => {
								const hall = (i + 2).toString();
								return {
									value: hall,
									label: hall,
									description: `Town Hall ${hall}`,
									default: state.townHalls.includes(hall)
								};
							})
					)
					.setDisabled(disable)
			);

			const row3 = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
				new SelectMenuBuilder()
					.setPlaceholder('Select Clan Roles')
					.setCustomId(CUSTOM_ID.ROLES)
					.setMaxValues(4)
					.setOptions([
						{
							label: 'Leader',
							value: 'leader',
							default: state.roles.includes('leader')
						},
						{
							label: 'Co-Leader',
							value: 'coLeader',
							default: state.roles.includes('coLeader')
						},
						{
							label: 'Elder',
							value: 'admin',
							default: state.roles.includes('admin')
						},
						{
							label: 'Member',
							value: 'member',
							default: state.roles.includes('member')
						}
					])
					.setDisabled(disable)
			);

			const row4 = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(CUSTOM_ID.SAVE)
					.setLabel('Remind Now')
					.setEmoji('🔔')
					.setStyle(ButtonStyle.Primary)
					.setDisabled(disable)
			);

			return [row0, row1, row2, row3, row4];
		};

		const msg = await interaction.editReply({ components: mutate(), content: '**Instant Reminder Options**' });
		const collector = msg.createMessageComponentCollector({
			filter: (action) => Object.values(CUSTOM_ID).includes(action.customId) && action.user.id === interaction.user.id,
			time: 5 * 60 * 1000
		});

		collector.on('collect', async (action) => {
			if (action.customId === CUSTOM_ID.WAR_TYPE && action.isSelectMenu()) {
				state.warTypes = action.values;
				await action.update({ components: mutate() });
			}

			if (action.customId === CUSTOM_ID.REMAINING && action.isSelectMenu()) {
				state.remaining = action.values;
				await action.update({ components: mutate() });
			}

			if (action.customId === CUSTOM_ID.TOWN_HALLS && action.isSelectMenu()) {
				state.townHalls = action.values;
				await action.update({ components: mutate() });
			}

			if (action.customId === CUSTOM_ID.ROLES && action.isSelectMenu()) {
				state.roles = action.values;
				await action.update({ components: mutate() });
			}

			if (action.customId === CUSTOM_ID.CLANS && action.isSelectMenu()) {
				state.clans = action.values;
				await action.update({ components: mutate() });
			}

			if (action.customId === CUSTOM_ID.SAVE && action.isButton()) {
				await action.update({ components: [], content: `**Fetching wars...** ${EMOJIS.LOADING}` });

				const texts = await this.getWars(action, {
					remaining: state.remaining.map((num) => Number(num)),
					townHalls: state.townHalls.map((num) => Number(num)),
					roles: state.roles,
					clans: state.clans,
					message: args.message,
					warTypes: state.warTypes
				});

				if (texts.length) {
					await action.editReply({ content: `\u200e🔔 ${args.message}` });
				} else {
					await action.editReply({ content: this.i18n('command.reminder.now.no_match', { lng: interaction.locale }) });
				}

				await this.send(action, texts);
			}
		});

		collector.on('end', async (_, reason) => {
			for (const id of Object.values(CUSTOM_ID)) this.client.components.delete(id);
			if (!/delete/i.test(reason)) await interaction.editReply({ components: mutate(true) });
		});
	}

	public async getWars(
		interaction: ButtonInteraction<'cached'>,
		reminder: {
			roles: string[];
			townHalls: number[];
			remaining: number[];
			clans: string[];
			message: string;
			warTypes: string[];
		}
	) {
		const texts: string[] = [];
		for (const tag of reminder.clans) {
			const currentWars = await this.client.http.getCurrentWars(tag);
			for (const data of currentWars) {
				if (!data.ok) continue;
				if (['notInWar', 'warEnded'].includes(data.state)) continue;

				const warType = data.warTag ? 'cwl' : data.isFriendly ? 'friendly' : 'normal';
				if (!reminder.warTypes.includes(warType)) continue;

				const text = await this.client.remindScheduler.getReminderText(
					{ ...reminder, guild: interaction.guild.id },
					{ tag: data.clan.tag, warTag: data.warTag },
					data,
					interaction.guild
				);

				if (text) texts.push(text);
			}
		}
		return texts;
	}

	private async send(interaction: ButtonInteraction<'cached'>, texts: string[]) {
		for (const text of texts) {
			for (const content of Util.splitMessage(text, { maxLength: 2000 })) {
				await interaction.followUp({ content, allowedMentions: { parse: ['users'] } });
			}
			await Util.delay(1000);
		}
	}
}
