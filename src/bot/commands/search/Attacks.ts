import { CommandInteraction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle, User, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../lib/index.js';
import { EMOJIS } from '../../util/Emojis.js';
import { MembersCommandOptions } from '../../util/CommandOptions.js';

export default class ClanAttacksCommand extends Command {
	public constructor() {
		super('attacks', {
			category: 'search',
			channel: 'guild',
			clientPermissions: ['EmbedLinks'],
			description: {
				content: 'Shows attacks and defense of all members.'
			},
			defer: true
		});
	}

	public async exec(
		interaction: CommandInteraction<'cached'>,
		args: { tag?: string; user?: User; sort_by_defense?: boolean; with_options?: boolean }
	) {
		const clan = await this.client.resolver.resolveClan(interaction, args.tag ?? args.user?.id);
		if (!clan) return;

		if (clan.members < 1) {
			return interaction.editReply(this.i18n('common.no_clan_members', { lng: interaction.locale, clan: clan.name }));
		}

		const fetched = await this.client.http.detailedClanMembers(clan.memberList);
		const members = fetched
			.filter((res) => res.ok)
			.map((m) => ({
				name: m.name,
				tag: m.tag,
				attackWins: m.attackWins,
				defenseWins: m.defenseWins
			}));

		if (args.sort_by_defense) {
			members.sort((a, b) => b.defenseWins - a.defenseWins);
		} else {
			members.sort((a, b) => b.attackWins - a.attackWins);
		}

		const embed = new EmbedBuilder()
			.setColor(this.client.embed(interaction))
			.setAuthor({ name: `${clan.name} (${clan.tag})`, iconURL: clan.badgeUrls.medium })
			.setDescription(
				[
					'```',
					`\u200e ${'#'}  ${'ATK'}  ${'DEF'}  ${'NAME'.padEnd(15, ' ')}`,
					members
						.map((member, i) => {
							const name = `${member.name.replace(/\`/g, '\\').padEnd(15, ' ')}`;
							const attackWins = `${member.attackWins.toString().padStart(3, ' ')}`;
							const defenseWins = `${member.defenseWins.toString().padStart(3, ' ')}`;
							return `${(i + 1).toString().padStart(2, ' ')}  ${attackWins}  ${defenseWins}  \u200e${name}`;
						})
						.join('\n'),
					'```'
				].join('\n')
			);

		const payload = {
			cmd: this.id,
			tag: clan.tag,
			sort_by_defense: args.sort_by_defense,
			with_options: args.with_options
		};
		const customIds = {
			refresh: this.createId(payload),
			option: this.createId({ ...payload, cmd: 'members', string_key: 'option' }),
			sort_by: this.createId({ ...payload, sort_by_defense: !args.sort_by_defense })
		};

		const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setEmoji(EMOJIS.REFRESH).setCustomId(customIds.refresh).setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(customIds.sort_by)
				.setStyle(ButtonStyle.Secondary)
				.setLabel(args.sort_by_defense ? `Sort by Attacks` : `Sort by Defense`)
		);

		const menu = new StringSelectMenuBuilder()
			.setPlaceholder('Select an option!')
			.setCustomId(customIds.option)
			.addOptions(
				Object.values(MembersCommandOptions).map((option) => ({
					label: option.label,
					value: option.id,
					description: option.description,
					default: option.id === MembersCommandOptions.attacks.id
				}))
			);
		const menuRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

		await interaction.editReply({ embeds: [embed], components: args.with_options ? [buttonRow, menuRow] : [buttonRow] });
		return this.clearId(interaction);
	}
}
