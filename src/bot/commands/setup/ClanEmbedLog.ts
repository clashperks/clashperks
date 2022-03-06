import { Collections, Flags, Settings, EMBEDS } from '../../util/Constants';
import { Command, Flag } from 'discord-akairo';
import { EMOJIS, CWL_LEAGUES, TOWN_HALLS } from '../../util/Emojis';
import { ORANGE_NUMBERS } from '../../util/NumEmojis';
import { Util, Message, MessageActionRow, MessageButton, TextChannel, Modal, MessageEmbed } from 'discord.js';
import { Clan } from 'clashofclans.js';
import { UserInfo } from '../../types';

export default class ClanEmbedCommand extends Command {
	public constructor() {
		super('setup-clan-embed', {
			category: 'setup',
			channel: 'guild',
			description: {},
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['EMBED_LINKS'],
			optionFlags: ['--tag', '--color', '--channel']
		});
	}

	public *args(): unknown {
		const data = yield {
			flag: '--tag',
			match: 'option',
			type: async (msg: Message, args: string) => {
				if (!this.client.patrons.get(msg.guild!.id)) return this.bePatron(msg);
				return this.client.resolver.resolveClan(msg, args);
			}
		};

		const color = yield {
			'type': 'color',
			'flag': '--color',
			'match': 'option',
			'default': (msg: Message) => this.client.embed(msg)
		};

		const channel = yield {
			'type': 'textChannel',
			'flag': '--channel',
			'match': 'option',
			'default': (msg: Message) => msg.channel
		};

		return { data, color, channel };
	}

	private async getUser(clan: Clan): Promise<{ id: string; name: string; toString(): string; entries?: any[] } | null> {
		const leader = clan.memberList.find(m => m.role === 'leader');
		if (leader) {
			const user = await this.client.db.collection<UserInfo>(Collections.LINKED_PLAYERS)
				.findOne({ 'entries.tag': leader.tag });
			if (user) return { id: user.user, name: leader.name, toString: () => `<@${user.user}>`, ...user };
		}
		return null;
	}

	public async exec(message: Message, { data, description, color, accepts, channel }: { data: Clan; description?: string; color?: number; accepts?: string; channel: TextChannel }) {
		const clans = await this.client.storage.findAll(message.guild!.id);

		const max = this.client.settings.get<number>(message.guild!.id, Settings.CLAN_LIMIT, 2);
		if (clans.length >= max && !clans.filter(clan => clan.active).map(clan => clan.tag).includes(data.tag) && !this.client.isOwner(message.author.id)) {
			return message.util!.send({ embeds: [EMBEDS.CLAN_LIMIT()] });
		}

		const user = await this.getUser(data);
		if (!user) return message.util!.send('**Clan leader is not linked to the bot!**');

		const code = ['CP', message.guild!.id.substr(-2)].join('');
		const clan = clans.find(clan => clan.tag === data.tag) ?? { verified: false };
		if (!clan.verified && !this.verifyClan(code, data, user.entries ?? []) && !this.client.isOwner(message.author.id)) {
			const embed = EMBEDS.VERIFY_CLAN(data, code);
			return message.util!.send({ embeds: [embed] });
		}

		const __customIds = {
			a: this.client.uuid(message.author.id),
			b: this.client.uuid(message.author.id),
			c: this.client.uuid(message.author.id)
		};

		const m = await message.util!.send({
			embeds: [
				new MessageEmbed()
					.setAuthor({ name: `${data.name} | Clan Embed`, iconURL: data.badgeUrls.medium })
					.setDescription([
						data.description,
						'',
						'**Leader**',
						// eslint-disable-next-line
						`${user.name} (${user.toString()})`
					].join('\n'))
			],
			components: [
				new MessageActionRow()
					.addComponents(
						new MessageButton()
							.setLabel('Customize')
							.setStyle('SECONDARY')
							.setCustomId(__customIds.a)
					)
					.addComponents(
						new MessageButton()
							.setLabel('Save')
							.setStyle('SECONDARY')
							.setCustomId(__customIds.b)
					)
			]
		});

		try {
			await m.awaitMessageComponent({
				filter: ({ customId }) => Object.values(__customIds).includes(customId),
				time: 5 * 60 * 1000
			}).then(async interaction => {
				const modal = new Modal({
					customId: __customIds.c,
					title: `${data.name} | Clan Embed`,
					components: [
						{
							type: 'ACTION_ROW',
							components: [
								{
									type: 'TEXT_INPUT',
									style: 'PARAGRAPH',
									customId: 'description',
									label: 'Clan Description',
									placeholder: 'Write anything or `auto` to sync with clan description.',
									maxLength: 300
								}
							]
						},
						{
							type: 'ACTION_ROW',
							components: [
								{
									type: 'TEXT_INPUT',
									style: 'PARAGRAPH',
									customId: 'accepts',
									label: 'Requirements',
									placeholder: 'Write anything as a requirement message (e.g TH 10+)',
									maxLength: 100
								}
							]
						}
					]
				});

				if (interaction.customId === __customIds.b) {
					await interaction.update({ components: [] });
				} else {
					await interaction.showModal(modal);
					await interaction.editReply({ components: [] });
					try {
						await interaction.awaitModalSubmit({
							time: 5 * 60 * 1000,
							filter: interaction => interaction.customId === __customIds.c
						}).then(async action => {
							description = action.fields.getField('description').value;
							accepts = action.fields.getField('accepts').value;
							await action.deferUpdate();
						});
					} catch {
						return interaction.update({ components: [] });
					}
				}
			});
		} catch {
			return;
		}

		accepts = accepts?.trim() || data.requiredTownhallLevel ? `TH ${data.requiredTownhallLevel!}+` : 'Any';
		const fetched = await this.client.http.detailedClanMembers(data.memberList);
		const reduced = fetched.filter(res => res.ok).reduce((count, member) => {
			const townHall = member.townHallLevel;
			count[townHall] = (count[townHall] || 0) + 1;
			return count;
		}, {} as { [key: string]: number });

		const townHalls = Object.entries(reduced)
			.map(arr => ({ level: Number(arr[0]), total: arr[1] }))
			.sort((a, b) => b.level - a.level);

		const location = data.location
			? data.location.isCountry
				? `:flag_${data.location.countryCode.toLowerCase()}: ${data.location.name}`
				: `🌐 ${data.location.name}`
			: `${EMOJIS.WRONG} None`;

		const embed = this.client.util.embed()
			.setTitle(`${data.name} (${data.tag})`)
			.setURL(`https://link.clashofclans.com/en?action=OpenClanProfile&tag=${encodeURIComponent(data.tag)}`)
			.setThumbnail(data.badgeUrls.medium)
			.setDescription([
				`${EMOJIS.CLAN} **${data.clanLevel}** ${EMOJIS.USERS} **${data.members}** ${EMOJIS.TROPHY} **${data.clanPoints}** ${EMOJIS.VERSUS_TROPHY} **${data.clanVersusPoints}**`,
				'',
				description?.toLowerCase() === 'auto'
					? data.description
					: description?.toLowerCase() === 'none'
						? ''
						: Util.cleanContent(description ?? '', message.channel)
			].join('\n'));
		if (color) embed.setColor(color);

		embed.addField('Clan Leader', [
			`${EMOJIS.OWNER} ${user.toString()} (${data.memberList.filter(m => m.role === 'leader').map(m => `${m.name}`)[0] || 'None'})`
		].join('\n'));

		embed.addField('Requirements', [
			`${EMOJIS.TOWNHALL} ${accepts}`,
			'**Trophies Required**',
			`${EMOJIS.TROPHY} ${data.requiredTrophies}`,
			`**Location** \n${location}`
		].join('\n'));

		embed.addField('War Performance', [
			`${EMOJIS.OK} ${data.warWins} Won ${data.isWarLogPublic ? `${EMOJIS.WRONG} ${data.warLosses!} Lost ${EMOJIS.EMPTY} ${data.warTies!} Tied` : ''}`,
			'**War Frequency & Streak**',
			`${data.warFrequency.toLowerCase() === 'morethanonceperweek'
				? '🎟️ More Than Once Per Week'
				: `🎟️ ${data.warFrequency.toLowerCase().replace(/\b(\w)/g, char => char.toUpperCase())}`} ${'🏅'} ${data.warWinStreak}`,
			'**War League**', `${CWL_LEAGUES[data.warLeague?.name ?? ''] || EMOJIS.EMPTY} ${data.warLeague?.name ?? 'Unranked'}`
		].join('\n'));

		embed.addField('Town Halls', [
			townHalls.slice(0, 7).map(th => `${TOWN_HALLS[th.level]} ${ORANGE_NUMBERS[th.total]}\u200b`).join(' ')
		].join('\n'));

		embed.setFooter({ text: 'Synced', iconURL: this.client.user!.displayAvatarURL({ format: 'png' }) });
		embed.setTimestamp();

		description = description?.toLowerCase() === 'auto'
			? 'auto'
			: description?.toLowerCase() === 'none'
				? ''
				: description ?? '';

		const mutate = async (messageId: string, channelId: string) => {
			const id = await this.client.storage.register(message, {
				op: Flags.CLAN_EMBED_LOG,
				guild: message.guild!.id,
				channel: channelId,
				tag: data.tag, color,
				name: data.name,
				message: messageId,
				embed: {
					accepts,
					userId: user.id,
					description: Util.cleanContent(description ?? '', message.channel)
				}
			});

			this.client.rpcHandler.add(id, {
				op: Flags.CLAN_EMBED_LOG,
				guild: message.guild!.id,
				tag: data.tag
			});
		};

		const existing = await this.client.db.collection(Collections.CLAN_EMBED_LOGS)
			.findOne({ tag: data.tag, guild: message.guild!.id });
		if (!existing) {
			const msg = await message.channel.send({ embeds: [embed] });
			return mutate(msg.id, channel.id);
		}

		const customIds = {
			edit: this.client.uuid(message.author.id),
			create: this.client.uuid(message.author.id)
		};
		const row = new MessageActionRow()
			.addComponents(
				new MessageButton()
					.setCustomId(customIds.edit)
					.setStyle('SECONDARY')
					.setLabel('Edit Existing Embed')
			)
			.addComponents(
				new MessageButton()
					.setCustomId(customIds.create)
					.setStyle('PRIMARY')
					.setLabel('Create New Embed')
			);

		const messageURL = this.getMessageURL(message.guild!.id, existing.channel, existing.message);
		const msg = await message.util!.send({
			content: [
				`**This clan already has an active Clan Embed. [Jump ↗️](<${messageURL}>)**`
			].join('\n'),
			components: [row]
		});
		const collector = msg.createMessageComponentCollector({
			filter: action => Object.values(customIds).includes(action.customId) && action.user.id === message.author.id,
			time: 5 * 60 * 1000
		});

		collector.on('collect', async action => {
			if (action.customId === customIds.edit) {
				try {
					const channel = message.guild!.channels.cache.get(existing.channel);
					await (channel as TextChannel)!.messages.edit(existing.message, { embeds: [embed] });
				} catch {
					row.components[0].setDisabled(true);
					return action.update({
						content: '**Failed to update the existing embed!**',
						components: [row]
					});
				}

				await action.update({
					components: [],
					content: `**Successfully updated the existing embed. [Jump ↗️](<${messageURL}>)**`
				});
				return mutate(existing.message, existing.channel);
			}

			if (action.customId === customIds.create) {
				await action.update({ content: '**Successfully created a new embed.**', components: [] });
				const msg = await message.channel.send({ embeds: [embed] });
				return mutate(msg.id, channel.id);
			}
		});

		collector.on('end', () => {
			this.client.components.delete(customIds.edit);
			this.client.components.delete(customIds.create);
		});
	}

	private async bePatron(message: Message) {
		const embed = this.client.util.embed()
			.setDescription([
				'**Patron Only Feature**',
				'This feature is only available on Patron servers.',
				'Visit https://patreon.com/clashperk for more details.',
				'',
				'**Demo Clan Embed**'
			].join('\n'))
			.setImage('https://i.imgur.com/txkD6q7.png');
		return message.util!.send({ embeds: [embed] }).then(() => Flag.cancel()).catch(() => Flag.cancel());
	}

	private verifyClan(code: string, clan: Clan, tags: { tag: string; verified: boolean }[]) {
		const verifiedTags = tags.filter(en => en.verified).map(en => en.tag);
		return clan.memberList.filter(m => ['coLeader', 'leader'].includes(m.role))
			.some(m => verifiedTags.includes(m.tag)) || clan.description.toUpperCase().includes(code);
	}

	private getMessageURL(guildId: string, channelId: string, messageId: string) {
		return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
	}
}
