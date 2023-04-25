import { Player } from 'clashofclans.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, CommandInteraction, GuildMember } from 'discord.js';
import { sheets_v4 } from 'googleapis';
import { Command } from '../../lib/index.js';
import Workbook from '../../struct/Excel.js';
import Google from '../../struct/Google.js';
import { PlayerLinks } from '../../types/index.js';
import { Collections } from '../../util/Constants.js';
import { HERO_PETS, HOME_HEROES, SUPER_TROOPS } from '../../util/Emojis.js';
import RAW_TROOPS_DATA from '../../util/Troops.js';
import { Util } from '../../util/index.js';

const achievements = [
	'Gold Grab',
	'Elixir Escapade',
	'Heroic Heist',
	'Games Champion',
	'War League Legend',
	'Unbreakable',
	'Conqueror',
	'Siege Sharer',
	'Sharing is caring',
	'Friend in Need',
	'Aggressive Capitalism',
	'Most Valuable Clanmate'
];

const roleNames: Record<string, string> = {
	member: 'Mem',
	admin: 'Eld',
	coLeader: 'Co',
	leader: 'Lead'
};

const HERO_LIST = Object.keys(HOME_HEROES);
const PET_LIST = Object.keys(HERO_PETS);
const PETS = PET_LIST.reduce<Record<string, number>>((prev, curr, i) => {
	prev[curr] = i + 1;
	return prev;
}, {});

export default class ExportClanMembersCommand extends Command {
	public constructor() {
		super('export-members', {
			category: 'export',
			channel: 'guild',
			clientPermissions: ['EmbedLinks'],
			defer: true
		});
	}

	public async exec(interaction: CommandInteraction<'cached'>, args: { clans?: string }) {
		const tags = await this.client.resolver.resolveArgs(args.clans);
		const clans = tags.length
			? await this.client.storage.search(interaction.guildId, tags)
			: await this.client.storage.find(interaction.guildId);

		if (!clans.length && tags.length)
			return interaction.editReply(
				this.i18n('common.no_clans_found', { lng: interaction.locale, command: this.client.commands.SETUP_ENABLE })
			);
		if (!clans.length) {
			return interaction.editReply(
				this.i18n('common.no_clans_linked', { lng: interaction.locale, command: this.client.commands.SETUP_ENABLE })
			);
		}

		const _clans = await Promise.all(clans.map((clan) => this.client.http.clan(clan.tag)));
		const members: any[] = [];
		for (const clan of _clans.filter((res) => res.ok)) {
			for (const mem of clan.memberList) {
				const m = await this.client.http.player(mem.tag);
				if (!m.ok) continue;
				members.push({
					name: m.name,
					tag: m.tag,
					clan: clan.name,
					role: roleNames[mem.role],
					clanRank: mem.clanRank,
					townHallLevel: m.townHallLevel,
					warPreference: m.warPreference,
					heroes: m.heroes.length ? m.heroes.filter((a) => a.village === 'home') : [],
					achievements: this.getAchievements(m),
					pets: m.troops.filter((troop) => troop.name in PETS).sort((a, b) => PETS[a.name] - PETS[b.name]),
					rushed: Number(this.rushedPercentage(m)),
					heroRem: Number(this.heroUpgrades(m)),
					labRem: Number(this.labUpgrades(m))
				});
			}
		}

		const memberTags = [];
		memberTags.push(...(await this.client.http.getDiscordLinks(members)));
		const dbMembers = await this.client.db
			.collection<PlayerLinks>(Collections.PLAYER_LINKS)
			.find({ tag: { $in: members.map((m) => m.tag) } })
			.toArray();
		if (dbMembers.length) this.updateUsers(interaction, dbMembers);
		for (const member of dbMembers) {
			if (!members.find((mem) => mem.tag === member.tag)) continue;
			if (memberTags.find((mem) => mem.tag === member.tag)) continue;
			memberTags.push({ tag: member.tag, user: member.userId });
		}
		let guildMembers = new Collection<string, GuildMember>();
		const fetchedMembers = await Promise.all(
			Util.chunk(memberTags, 100).map((members) => interaction.guild.members.fetch({ user: members.map((m) => m.user) }))
		);
		guildMembers = guildMembers.concat(...fetchedMembers);

		for (const mem of members) {
			const user = memberTags.find((user) => user.tag === mem.tag)?.user;
			// @ts-expect-error
			mem.user_tag = guildMembers.get(user)?.user.tag;
		}
		guildMembers.clear();

		members
			.sort(
				(a, b) =>
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					b.heroes.reduce((x: any, y: { level: any }) => x + y.level, 0) -
					// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
					a.heroes.reduce((x: any, y: { level: any }) => x + y.level, 0)
			)
			.sort((a, b) => b.townHallLevel - a.townHallLevel);

		const buffer = await this.excel(members);
		await interaction.editReply({
			content: `**${interaction.guild.name} Members**`,
			files: [{ attachment: Buffer.from(buffer), name: 'clan_members.xlsx' }]
		});

		const columns = [
			{ header: 'Clan Rank', width: 10 },
			{ header: 'NAME', width: 16 },
			{ header: 'TAG', width: 16 },
			{ header: 'Discord', width: 16 },
			{ header: 'CLAN', width: 16 },
			{ header: 'ROLE', width: 10 },
			{ header: 'Town-Hall', width: 10 },
			{ header: 'War Preference', width: 10 },
			{ header: 'Rushed %', width: 10 },
			{ header: 'Lab Upgrades Done', width: 10 },
			{ header: 'Hero Upgrades Done', width: 10 },
			...HERO_LIST.map((header) => ({ header, width: 10 })),
			...PET_LIST.map((header) => ({ header, width: 10 })),
			...achievements.map((header) => ({ header, width: 16 }))
		];

		const { spreadsheets } = Google.sheet();
		const drive = Google.drive();
		const spreadsheet = await spreadsheets.create({
			requestBody: {
				properties: {
					title: `${interaction.guild.name} [Clan Members]`
				},
				sheets: [1].map((_, i) => ({
					properties: {
						sheetId: i,
						index: i,
						title: Util.escapeSheetName(`Members`),
						gridProperties: {
							rowCount: Math.max(members.length + 1, 50),
							columnCount: Math.max(columns.length, 25),
							frozenRowCount: members.length ? 1 : 0
						}
					}
				}))
			},
			fields: 'spreadsheetId,spreadsheetUrl'
		});

		await Promise.all([
			drive.permissions.create({
				requestBody: {
					role: 'reader',
					type: 'anyone'
				},
				fileId: spreadsheet.data.spreadsheetId!
			}),
			drive.revisions.update({
				requestBody: {
					published: true,
					publishedOutsideDomain: true,
					publishAuto: true
				},
				fileId: spreadsheet.data.spreadsheetId!,
				revisionId: '1',
				fields: '*'
			})
		]);

		const requests: sheets_v4.Schema$Request[] = [1].map((_, i) => ({
			updateCells: {
				start: {
					sheetId: i,
					rowIndex: 0,
					columnIndex: 0
				},
				rows: [
					{
						values: columns.map((value) => ({
							userEnteredValue: {
								stringValue: value.header
							},
							userEnteredFormat: {
								wrapStrategy: 'WRAP'
							}
						}))
					},
					...members.map((m) => ({
						values: [
							m.clanRank,
							m.name,
							m.tag,
							m.user_tag,
							m.clan,
							m.role,
							m.townHallLevel,
							m.warPreference,
							m.rushed,
							m.labRem,
							m.heroRem,
							...m.heroes.map((h: any) => h.level).concat(Array(HERO_LIST.length - m.heroes.length).fill('')),
							...m.pets.map((h: any) => h.level).concat(Array(PET_LIST.length - m.pets.length).fill('')),
							...m.achievements.map((v: any) => v.value)
						].map((value) => ({
							userEnteredValue: typeof value === 'string' ? { stringValue: value.toString() } : { numberValue: value },
							userEnteredFormat: {
								textFormat:
									typeof value === 'number' && value <= 0 ? { foregroundColorStyle: { rgbColor: { red: 1 } } } : {}
							}
						}))
					}))
				],
				fields: '*'
			}
		}));

		const styleRequests: sheets_v4.Schema$Request[] = [1]
			.map((_, i) => [
				{
					repeatCell: {
						range: {
							sheetId: i,
							startRowIndex: 0,
							startColumnIndex: 0,
							endColumnIndex: 2
						},
						cell: {
							userEnteredFormat: {
								horizontalAlignment: 'LEFT'
							}
						},
						fields: 'userEnteredFormat(horizontalAlignment)'
					}
				},
				{
					repeatCell: {
						range: {
							sheetId: i,
							startRowIndex: 0,
							startColumnIndex: 2
						},
						cell: {
							userEnteredFormat: {
								horizontalAlignment: 'RIGHT'
							}
						},
						fields: 'userEnteredFormat(horizontalAlignment)'
					}
				},
				{
					repeatCell: {
						range: {
							sheetId: i,
							startRowIndex: 0,
							endRowIndex: 1,
							startColumnIndex: 0
						},
						cell: {
							userEnteredFormat: {
								textFormat: { bold: true },
								verticalAlignment: 'MIDDLE'
							}
						},
						fields: 'userEnteredFormat(textFormat,verticalAlignment)'
					}
				}
			])
			.flat();

		await spreadsheets.batchUpdate({
			spreadsheetId: spreadsheet.data.spreadsheetId!,
			requestBody: {
				requests: [...requests, ...styleRequests]
			}
		});

		const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel('Google Sheet').setURL(spreadsheet.data.spreadsheetUrl!),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Open in Web')
				.setURL(spreadsheet.data.spreadsheetUrl!.replace('edit', 'pubhtml'))
		);

		const downloadRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Download')
				.setURL(`https://docs.google.com/spreadsheets/export?id=${spreadsheet.data.spreadsheetId!}&exportFormat=xlsx`),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setLabel('Download PDF')
				.setURL(`https://docs.google.com/spreadsheets/export?id=${spreadsheet.data.spreadsheetId!}&exportFormat=pdf`)
		);
		return interaction.editReply({ components: [row, downloadRow] });
	}

	private excel(members: any[]) {
		const workbook = new Workbook();
		const sheet = workbook.addWorksheet('Member List');
		sheet.columns = [
			{ header: 'Clan Rank', width: 10 },
			{ header: 'NAME', width: 16 },
			{ header: 'TAG', width: 16 },
			{ header: 'Discord', width: 16 },
			{ header: 'CLAN', width: 16 },
			{ header: 'ROLE', width: 10 },
			{ header: 'Town-Hall', width: 10 },
			{ header: 'War Preference', width: 10 },
			{ header: 'Rushed %', width: 10 },
			{ header: 'Lab Upgrades Done', width: 10 },
			{ header: 'Hero Upgrades Done', width: 10 },
			...HERO_LIST.map((header) => ({ header, width: 10 })),
			...PET_LIST.map((header) => ({ header, width: 10 })),
			...achievements.map((header) => ({ header, width: 16 }))
		];

		sheet.getRow(1).font = { bold: true, size: 10 };
		for (let i = 1; i <= sheet.columns.length; i++) {
			sheet.getColumn(i).alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' };
		}

		sheet.addRows(
			members.map((m) => [
				m.clanRank,
				m.name,
				m.tag,
				m.user_tag,
				m.clan,
				m.role,
				m.townHallLevel,
				m.warPreference,
				m.rushed,
				m.labRem,
				m.heroRem,
				...m.heroes.map((h: any) => h.level).concat(Array(HERO_LIST.length - m.heroes.length).fill('')),
				...m.pets.map((h: any) => h.level).concat(Array(PET_LIST.length - m.pets.length).fill('')),
				...m.achievements.map((v: any) => v.value)
			])
		);

		return workbook.xlsx.writeBuffer();
	}

	private getAchievements(data: Player) {
		return achievements.map((name) => ({ name, value: data.achievements.find((en) => en.name === name)?.value ?? 0 }));
	}

	private updateUsers(interaction: CommandInteraction, members: PlayerLinks[]) {
		for (const data of members) {
			const member = interaction.guild!.members.cache.get(data.userId);
			if (member && data.username !== member.user.tag) {
				this.client.resolver.updateUserTag(interaction.guild!, data.userId);
			}
		}
	}

	private rushedPercentage(data: Player) {
		const apiTroops = this.apiTroops(data);
		const rem = RAW_TROOPS_DATA.TROOPS.filter((unit) => !unit.seasonal && !(unit.name in SUPER_TROOPS)).reduce(
			(prev, unit) => {
				const apiTroop = apiTroops.find((u) => u.name === unit.name && u.village === unit.village && u.type === unit.category);
				if (unit.village === 'home') {
					prev.levels += Math.min(apiTroop?.level ?? 0, unit.levels[data.townHallLevel - 2]);
					prev.total += unit.levels[data.townHallLevel - 2];
				}
				return prev;
			},
			{ total: 0, levels: 0 }
		);
		if (rem.total === 0) return 0;
		return (100 - (rem.levels * 100) / rem.total).toFixed(2);
	}

	private labUpgrades(data: Player) {
		const apiTroops = this.apiTroops(data);
		const rem = RAW_TROOPS_DATA.TROOPS.filter((unit) => !unit.seasonal && !(unit.name in SUPER_TROOPS)).reduce(
			(prev, unit) => {
				const apiTroop = apiTroops.find((u) => u.name === unit.name && u.village === unit.village && u.type === unit.category);
				if (unit.category !== 'hero' && unit.village === 'home') {
					prev.levels += apiTroop?.level ?? 0;
					prev.total += unit.levels[data.townHallLevel - 1];
				}
				return prev;
			},
			{ total: 0, levels: 0 }
		);
		if (rem.total === 0) return 0;
		return ((rem.levels * 100) / rem.total).toFixed(2);
	}

	private heroUpgrades(data: Player) {
		const apiTroops = this.apiTroops(data);
		const rem = RAW_TROOPS_DATA.TROOPS.filter((unit) => !unit.seasonal && !(unit.name in SUPER_TROOPS)).reduce(
			(prev, unit) => {
				const apiTroop = apiTroops.find((u) => u.name === unit.name && u.village === unit.village && u.type === unit.category);
				if (unit.category === 'hero' && unit.village === 'home') {
					prev.levels += apiTroop?.level ?? 0;
					prev.total += unit.levels[data.townHallLevel - 1];
				}
				return prev;
			},
			{ total: 0, levels: 0 }
		);
		if (rem.total === 0) return 0;
		return ((rem.levels * 100) / rem.total).toFixed(2);
	}

	private apiTroops(data: Player) {
		return [
			...data.troops.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'troop',
				village: u.village
			})),
			...data.heroes.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'hero',
				village: u.village
			})),
			...data.spells.map((u) => ({
				name: u.name,
				level: u.level,
				maxLevel: u.maxLevel,
				type: 'spell',
				village: u.village
			}))
		];
	}
}
