import { CommandInteraction, User } from 'discord.js';
import { Command } from '../../lib/index.js';
import { CreateGoogleSheet, createGoogleSheet } from '../../struct/Google.js';
import { LegendAttacks } from '../../types/index.js';
import { Collections } from '../../util/Constants.js';
import { getExportComponents } from '../../util/Helper.js';
import { Season, Util } from '../../util/index.js';

export default class LegendAttacksHistoryCommand extends Command {
	public constructor() {
		super('history-legend-attacks', {
			category: 'search',
			channel: 'guild',
			clientPermissions: ['EmbedLinks', 'UseExternalEmojis'],
			defer: true
		});
	}

	public async exec(interaction: CommandInteraction<'cached'>, args: { clans?: string; player_tag?: string; user?: User }) {
		if (args.user) {
			const playerTags = await this.client.resolver.getLinkedPlayerTags(args.user.id);
			const { result } = await this.getHistory(interaction, playerTags);
			if (!result.length) {
				return interaction.editReply(this.i18n('common.no_data', { lng: interaction.locale }));
			}

			return this.export(interaction, result);
		}

		if (args.player_tag) {
			const player = await this.client.resolver.resolvePlayer(interaction, args.player_tag);
			if (!player) return null;
			const playerTags = [player.tag];
			const { result } = await this.getHistory(interaction, playerTags);

			if (!result.length) {
				return interaction.editReply(this.i18n('common.no_data', { lng: interaction.locale }));
			}

			return this.export(interaction, result);
		}

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

		const _clans = await this.client.redis.getClans(clans.map((clan) => clan.tag));
		const playerTags = _clans.flatMap((clan) => clan.memberList.map((member) => member.tag));
		const { result } = await this.getHistory(interaction, playerTags);

		if (!result.length) {
			return interaction.editReply(this.i18n('common.no_data', { lng: interaction.locale }));
		}

		return this.export(interaction, result);
	}

	private async getHistory(interaction: CommandInteraction<'cached'>, playerTags: string[]) {
		const seasonId = Season.ID;
		const players = await this.client.db
			.collection<LegendAttacks>(Collections.LEGEND_ATTACKS)
			.find({
				tag: { $in: playerTags },
				seasonId
			})
			.toArray();

		const result: AggregatedResult[] = [];
		for (const { logs, name, tag } of players) {
			const days = Util.getLegendDays();
			const perDayLogs = days.reduce<PerDayLog[]>((prev, { startTime, endTime }, i) => {
				const mixedLogs = logs.filter((atk) => atk.timestamp >= startTime && atk.timestamp <= endTime);
				const attacks = mixedLogs.filter((en) => en.inc > 0);
				const defenses = mixedLogs.filter((en) => en.inc <= 0);

				const attackCount = attacks.length;
				const defenseCount = defenses.length;
				const final = mixedLogs.slice(-1).at(0);
				const initial = mixedLogs.at(0);

				const gain = attacks.reduce((acc, cur) => acc + cur.inc, 0);
				const loss = defenses.reduce((acc, cur) => acc + cur.inc, 0);

				// eslint-disable-next-line
				prev.push({
					attackCount,
					defenseCount,
					gain,
					loss,
					final: final?.end ?? '-',
					initial: initial?.start ?? '-',
					day: i + 1,
					netGain: gain + loss
				});
				return prev;
			}, []);

			result.push({ name, tag, logs: perDayLogs });
		}

		return { embeds: [], result };
	}

	private async export(interaction: CommandInteraction<'cached'>, result: AggregatedResult[]) {
		const chunks = result
			.map((r) => {
				const records = r.logs.reduce<Record<string, PerDayLog>>((prev, acc) => {
					prev[acc.day] ??= acc; // eslint-disable-line
					return prev;
				}, {});
				return { name: r.name, tag: r.tag, records };
			})
			.flat();

		const days = Util.getLegendDays();
		const sheets: CreateGoogleSheet[] = [
			{
				title: `Attacks`,
				columns: [
					{ name: 'NAME', align: 'LEFT', width: 160 },
					{ name: 'TAG', align: 'LEFT', width: 160 },
					...days.map((_, n) => ({ name: `Day ${n + 1}`, align: 'RIGHT', width: 100 }))
				],
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				rows: chunks.map((r) => [r.name, r.tag, ...days.map((_, i) => r.records[i + 1]?.attackCount ?? 0)])
			},
			{
				title: `Defense`,
				columns: [
					{ name: 'NAME', align: 'LEFT', width: 160 },
					{ name: 'TAG', align: 'LEFT', width: 160 },
					...days.map((_, n) => ({ name: `Day ${n + 1}`, align: 'RIGHT', width: 100 }))
				],
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				rows: chunks.map((r) => [r.name, r.tag, ...days.map((_, i) => r.records[i + 1]?.defenseCount ?? 0)])
			},
			{
				title: `Gain`,
				columns: [
					{ name: 'NAME', align: 'LEFT', width: 160 },
					{ name: 'TAG', align: 'LEFT', width: 160 },
					...days.map((_, n) => ({ name: `Day ${n + 1}`, align: 'RIGHT', width: 100 }))
				],
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				rows: chunks.map((r) => [r.name, r.tag, ...days.map((_, i) => r.records[i + 1]?.gain ?? 0)])
			},
			{
				title: `Loss`,
				columns: [
					{ name: 'NAME', align: 'LEFT', width: 160 },
					{ name: 'TAG', align: 'LEFT', width: 160 },
					...days.map((_, n) => ({ name: `Day ${n + 1}`, align: 'RIGHT', width: 100 }))
				],
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				rows: chunks.map((r) => [r.name, r.tag, ...days.map((_, i) => r.records[i + 1]?.loss ?? 0)])
			},
			{
				title: `Net Gain`,
				columns: [
					{ name: 'NAME', align: 'LEFT', width: 160 },
					{ name: 'TAG', align: 'LEFT', width: 160 },
					...days.map((_, n) => ({ name: `Day ${n + 1}`, align: 'RIGHT', width: 100 }))
				],
				// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
				rows: chunks.map((r) => [r.name, r.tag, ...days.map((_, i) => r.records[i + 1]?.netGain ?? 0)])
			}
		];

		const spreadsheet = await createGoogleSheet(`${interaction.guild.name} [Legend Attacks History]`, sheets);
		return interaction.editReply({ components: getExportComponents(spreadsheet) });
	}
}

interface PerDayLog {
	attackCount: number;
	defenseCount: number;
	gain: number;
	loss: number;
	final: number | string;
	initial: number | string;
	day: number;
	netGain: number;
}

interface AggregatedResult {
	name: string;
	tag: string;
	logs: PerDayLog[];
}
