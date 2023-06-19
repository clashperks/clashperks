import { ActionRowBuilder, CommandInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction } from 'discord.js';
import { ObjectId } from 'mongodb';
import { Command } from '../../lib/index.js';
import { CreateGoogleSheet, updateGoogleSheet, createGoogleSheet } from '../../struct/Google.js';
import { IRosterCategory } from '../../struct/RosterManager.js';
import { EMOJIS } from '../../util/Emojis.js';
import { getExportComponents } from '../../util/Helper.js';
import { createInteractionCollector } from '../../util/Pagination.js';

export default class RosterEditCommand extends Command {
	public constructor() {
		super('roster-settings', {
			category: 'roster',
			channel: 'guild',
			description: {
				content: ['Create, delete, edit or view rosters.']
			},
			defer: true,
			ephemeral: true
		});
	}

	public async exec(
		interaction: CommandInteraction<'cached'>,
		args: {
			roster: string;
		}
	) {
		if (!ObjectId.isValid(args.roster)) return interaction.followUp({ content: 'Invalid roster ID.', ephemeral: true });

		const rosterId = new ObjectId(args.roster);
		const roster = await this.client.rosterManager.get(rosterId);
		if (!roster) return interaction.followUp({ content: 'Roster was deleted.', ephemeral: true });

		const customIds = {
			select: this.client.uuid(interaction.user.id)
		};

		const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			new StringSelectMenuBuilder()
				.setMinValues(1)
				.setPlaceholder('Select an option!')
				.setCustomId(customIds.select)
				.setOptions([
					{
						label: 'Roster Info',
						description: 'View roster info and settings.',
						value: 'info'
					},
					{
						label: 'Close Roster',
						description: 'Prevent new signups to the roster.',
						value: 'close'
					},
					{
						label: 'Open Roster',
						description: 'Allow new signups to the roster.',
						value: 'open'
					},
					{
						label: 'Clear Roster',
						description: 'Remove all members from the roster.',
						value: 'clear'
					},
					{
						label: 'Remove Buttons',
						description: 'Remove all buttons from the message.',
						value: 'archive'
					},
					{
						label: 'Export Roster',
						description: 'Export roster to a Google spreadsheet.',
						value: 'export'
					}
				])
		);

		const message = await interaction.followUp({
			components: [menuRow],
			ephemeral: true
		});
		const categories = await this.client.rosterManager.getCategories(interaction.guild.id);

		const closeRoster = async (action: StringSelectMenuInteraction<'cached'>) => {
			const updated = await this.client.rosterManager.close(rosterId);
			if (!updated) return action.reply({ content: 'Roster was deleted.', ephemeral: true });
			await action.update({ content: 'Roster closed!', components: [] });

			const embed = this.client.rosterManager.getRosterEmbed(updated, categories);
			const row = this.client.rosterManager.getRosterComponents({
				roster: updated
			});

			return interaction.editReply({ embeds: [embed], components: [row] });
		};

		const openRoster = async (action: StringSelectMenuInteraction<'cached'>) => {
			if (roster.endTime && new Date(roster.endTime) < new Date()) {
				return action.reply({ content: 'This roster cannot be opened as the closing time has passed.', ephemeral: true });
			}

			if (!roster.allowMultiSignup && roster.members.length > 0 && roster.closed) {
				const dup = await this.client.rosterManager.rosters.findOne(
					{
						'_id': { $ne: roster._id },
						'closed': false,
						'guildId': action.guild.id,
						'members.tag': { $in: roster.members.map((mem) => mem.tag) }
					},
					{ projection: { _id: 1 } }
				);

				if (dup)
					return action.update(
						`This roster has multiple members signed up for another roster **${roster.clan.name} - ${roster.name}**. Please remove them before opening this roster.`
					);
			}

			const updated = await this.client.rosterManager.open(rosterId);
			if (!updated) return action.reply({ content: 'Roster was deleted.', ephemeral: true });
			await action.update({ content: 'Roster opened!', components: [] });

			const embed = this.client.rosterManager.getRosterEmbed(updated, categories);
			const row = this.client.rosterManager.getRosterComponents({
				roster: updated
			});

			return interaction.editReply({ embeds: [embed], components: [row] });
		};

		const clearRoster = async (action: StringSelectMenuInteraction<'cached'>) => {
			const updated = await this.client.rosterManager.clear(rosterId);
			if (!updated) return action.reply({ content: 'Roster was deleted.', ephemeral: true });

			await action.update({ content: 'Roster cleared!', components: [] });

			const embed = this.client.rosterManager.getRosterEmbed(updated, categories);
			const row = this.client.rosterManager.getRosterComponents({
				roster: updated
			});

			return interaction.editReply({ embeds: [embed], components: [row] });
		};

		const archiveRoster = async (action: StringSelectMenuInteraction<'cached'>) => {
			await action.update({ content: 'Roster buttons removed!', components: [] });
			const embed = this.client.rosterManager.getRosterEmbed(roster, categories);
			return interaction.editReply({ embeds: [embed], components: [] });
		};

		const getRosterInfo = async (action: StringSelectMenuInteraction<'cached'>) => {
			const embed = this.client.rosterManager.getRosterInfoEmbed(roster);
			return action.update({ embeds: [embed], components: [] });
		};

		const exportSheet = async (action: StringSelectMenuInteraction<'cached'>) => {
			if (!roster.members.length) return action.reply({ content: 'Roster is empty.', ephemeral: true });
			await action.update({ content: `Updating spreadsheet... ${EMOJIS.LOADING}`, components: [] });

			const clan = await this.client.http.clan(roster.clan.tag);
			if (!clan.ok) return action.reply({ content: `Failed to fetch the clan \u200e${roster.clan.name} (${roster.clan.tag})` });
			const clanMembers = await this.client.rosterManager.getClanMembers(clan.memberList);

			const signedUp = roster.members.map((member) => member.tag);
			clanMembers.sort((a) => (signedUp.includes(a.tag) ? -1 : 1));

			const categoriesMap = categories.reduce<Record<string, IRosterCategory>>(
				(prev, curr) => ({ ...prev, [curr._id.toHexString()]: curr }),
				{}
			);

			const sheets: CreateGoogleSheet[] = [
				{
					title: `${roster.name} - ${roster.clan.name}`,
					columns: [
						{ name: 'Name', align: 'LEFT', width: 160 },
						{ name: 'Tag', align: 'LEFT', width: 120 },
						{ name: 'Clan', align: 'LEFT', width: 160 },
						{ name: 'Clan Tag', align: 'LEFT', width: 120 },
						{ name: 'Discord', align: 'LEFT', width: 160 },
						{ name: 'War Preference', align: 'LEFT', width: 100 },
						{ name: 'Town Hall', align: 'RIGHT', width: 100 },
						{ name: 'Heroes', align: 'RIGHT', width: 100 },
						{ name: 'Group', align: 'LEFT', width: 160 },
						{ name: 'Signed up at', align: 'LEFT', width: 160 }
					],
					rows: roster.members.map((member) => {
						const key = member.categoryId?.toHexString();
						const category = key && key in categoriesMap ? categoriesMap[key].displayName : '';
						return [
							member.name,
							member.tag,
							member.clan?.name ?? '',
							member.clan?.tag ?? '',
							member.username ?? '',
							member.warPreference ?? '',
							member.townHallLevel,
							Object.values(member.heroes).reduce((acc, num) => acc + num, 0),
							category,
							member.createdAt
						];
					})
				},
				{
					title: `${clan.name} (${clan.tag})`,
					columns: [
						{ name: 'Name', align: 'LEFT', width: 160 },
						{ name: 'Tag', align: 'LEFT', width: 120 },
						{ name: 'Discord', align: 'LEFT', width: 160 },
						{ name: 'War Preference', align: 'LEFT', width: 100 },
						{ name: 'Town Hall', align: 'RIGHT', width: 100 },
						{ name: 'Heroes', align: 'RIGHT', width: 100 },
						{ name: 'Signed up?', align: 'LEFT', width: 100 }
					],
					rows: clanMembers.map((member) => {
						return [
							member.name,
							member.tag,
							member.username ?? '',
							member.warPreference ?? '',
							member.townHallLevel,
							Object.values(member.heroes).reduce((acc, num) => acc + num, 0),
							signedUp.includes(member.tag) ? 'Yes' : 'No'
						];
					})
				}
			];

			const sheet = roster.sheetId
				? await updateGoogleSheet(roster.sheetId, sheets, true)
				: await createGoogleSheet(`${interaction.guild.name} [Roster Export]`, sheets);
			if (!roster.sheetId) this.client.rosterManager.attachSheetId(rosterId, sheet.spreadsheetId);

			const components = getExportComponents(sheet);
			return action.editReply({ content: null, components: [...components] });
		};

		createInteractionCollector({
			interaction,
			customIds,
			message,
			onSelect: (action) => {
				const value = action.values.at(0)!;

				if (!this.client.util.isManager(action.member) && !['info', 'export'].includes(value)) {
					return action.reply({
						ephemeral: true,
						content: `You are missing the **Manage Server** permission or the **Bot Manager** role to perform this action.`
					});
				}

				switch (value) {
					case 'close':
						return closeRoster(action);
					case 'open':
						return openRoster(action);
					case 'clear':
						return clearRoster(action);
					case 'info':
						return getRosterInfo(action);
					case 'archive':
						return archiveRoster(action);
					case 'export':
						return exportSheet(action);
				}
			}
		});
	}
}
