import { Message, MessageActionRow, MessageButton, MessageSelectMenu, TextChannel } from 'discord.js';
import { Collections } from '../../util/Constants';
import { Reminder } from '../../struct/RemindScheduler';
import { Command } from 'discord-akairo';
import ms from 'ms';
import { ClanStore } from '../../struct/StorageHandler';

export default class ReminderCreateCommand extends Command {
	public constructor() {
		super('reminder-create', {
			category: 'reminder',
			channel: 'guild',
			description: {},
			optionFlags: ['--duration', '--channel', '--message', '--clans'],
			userPermissions: ['MANAGE_GUILD'],
			clientPermissions: ['EMBED_LINKS']
		});
	}

	public *args(msg: Message): unknown {
		const duration = yield {
			flag: '--duration',
			match: msg.interaction ? 'option' : 'phrase',
			type: 'string'
		};

		const text = yield {
			flag: '--message',
			match: msg.interaction ? 'option' : 'rest',
			type: 'string'
		};

		const channel = yield {
			flag: '--channel',
			match: msg.interaction ? 'option' : 'phrase',
			type: 'textChannel'
		};

		const tags = yield {
			flag: '--clans',
			match: msg.interaction ? 'option' : 'phrase',
			type: (msg: Message, args?: string) => args ? args.split(/ +/g) : null
		};

		return { duration, text, channel, tags };
	}

	private async getClans(message: Message, aliases?: string[]) {
		if (!aliases?.length) return this.client.storage.findAll(message.guild!.id);
		const cursor = this.client.db.collection<ClanStore>(Collections.CLAN_STORES)
			.find({
				guild: message.guild!.id,
				$or: [
					{
						tag: { $in: aliases.map(tag => this.client.http.fixTag(tag)) }
					},
					{
						alias: { $in: aliases.map(alias => alias.toLowerCase()) }
					}
				]
			});

		const clans = await cursor.toArray();
		return clans.length ? clans : this.client.storage.findAll(message.guild!.id);
	}

	public async exec(message: Message, { duration, text, channel, tags }: { duration: string; text: string; channel?: TextChannel; tags?: string[] }) {
		const clans = await this.getClans(message, tags ?? []);
		if (!clans.length) return message.util!.send('**You server doesn\'t have any clans. Why not add some?**');

		const reminders = await this.client.db.collection<Reminder>(Collections.REMINDERS)
			.find({ guild: message.guild!.id })
			.count();

		if (reminders >= 25) return message.util!.send(`**You can only have 25 reminders.**`);
		if (!/\d+?\.?\d+?[hm]|\d[hm]/g.test(duration)) {
			return message.util!.send('**You must provide a valid duration. e.g 2h, 2.5h, 30m**');
		}

		const dur = duration.match(/\d+?\.?\d+?[hm]|\d[hm]/g)!.reduce((acc, cur) => acc + ms(cur), 0);
		if (!text) return message.util!.send('**You must provide a message for the reminder!**');

		if (dur < 15 * 60 * 1000) return message.util!.send('**Duration must be at least 15 minutes.**');
		if (dur > 45 * 60 * 60 * 1000) return message.util!.send('**Duration must be less than 45 hours.**');
		if (dur % (15 * 60 * 1000) !== 0) {
			return message.util!.send('**Duration must be a multiple of 15 minutes. e.g 15m, 30m, 45m, 1h, 1.25h, 1.5h, 1.75h**');
		}

		const customIds = {
			roles: this.client.uuid(message.author.id),
			townHalls: this.client.uuid(message.author.id),
			remaining: this.client.uuid(message.author.id),
			clans: this.client.uuid(message.author.id),
			save: this.client.uuid(message.author.id)
		};

		const state = {
			remaining: ['1', '2'],
			townHalls: Array(13).fill(0).map((_, i) => (i + 2).toString()),
			roles: ['leader', 'coLeader', 'admin', 'member'],
			clans: clans.map(clan => clan.tag)
		};

		const mutate = (disable = false) => {
			const row1 = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setPlaceholder('Select Attacks Remaining')
						.setMaxValues(2)
						.setCustomId(customIds.remaining)
						.setOptions([
							{
								'description': '1 Attack Remaining',
								'label': '1 Remaining',
								'value': '1',
								'default': state.remaining.includes('1')
							},
							{
								'description': '2 Attacks Remaining',
								'label': '2 Remaining',
								'value': '2',
								'default': state.remaining.includes('2')
							}
						])
						.setDisabled(disable)
				);
			const row2 = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setPlaceholder('Select Town Halls')
						.setCustomId(customIds.townHalls)
						.setMaxValues(13)
						.setOptions(
							Array(13)
								.fill(0)
								.map((_, i) => {
									const hall = (i + 2).toString();
									return {
										'value': hall,
										'label': hall,
										'description': `Town Hall ${hall}`,
										'default': state.townHalls.includes(hall)
									};
								})
						)
						.setDisabled(disable)
				);

			const row3 = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setPlaceholder('Select Clan Roles')
						.setCustomId(customIds.roles)
						.setMaxValues(4)
						.setOptions([
							{
								'label': 'Leader',
								'value': 'leader',
								'default': state.roles.includes('leader')
							},
							{
								'label': 'Co-Leader',
								'value': 'coLeader',
								'default': state.roles.includes('coLeader')
							},
							{
								'label': 'Elder',
								'value': 'admin',
								'default': state.roles.includes('admin')
							},
							{
								'label': 'Member',
								'value': 'member',
								'default': state.roles.includes('member')
							}
						])
						.setDisabled(disable)
				);

			const row4 = new MessageActionRow()
				.addComponents(
					new MessageSelectMenu()
						.setPlaceholder('Select Clans')
						.setCustomId(customIds.clans)
						.setMaxValues(clans.length)
						.setOptions(
							clans.slice(0, 25).map(
								clan => ({
									'label': clan.name,
									'value': clan.tag,
									'description': `${clan.name} (${clan.tag})`,
									'default': state.clans.includes(clan.tag)
								})
							)
						)
						.setDisabled(disable || clans.length > 25)
				);

			const row5 = new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setCustomId(customIds.save)
						.setLabel('Save')
						.setStyle('PRIMARY')
						.setDisabled(disable)
				);

			return [row1, row2, row3, row4, row5];
		};

		const msg = await message.util!.send({
			components: mutate(),
			content: [
				'**War Reminder Setup**',
				...(clans.length > 25
					? [
						'',
						`*Clan selection menu is not available for more than 25 clans. ${clans.length} clans were selected automatically!*`,
						`*To create a reminder for specific clans, pass clan tags or aliases through 'clans' option while executing the command.*`
					]
					: [])
			].join('\n')
		});
		const collector = msg.createMessageComponentCollector({
			filter: action => Object.values(customIds).includes(action.customId) && action.user.id === message.author.id,
			time: 5 * 60 * 1000
		});

		collector.on('collect', async action => {
			if (action.customId === customIds.remaining && action.isSelectMenu()) {
				state.remaining = action.values;
				return action.update({ components: mutate() });
			}

			if (action.customId === customIds.townHalls && action.isSelectMenu()) {
				state.townHalls = action.values;
				return action.update({ components: mutate() });
			}

			if (action.customId === customIds.roles && action.isSelectMenu()) {
				state.roles = action.values;
				return action.update({ components: mutate() });
			}

			if (action.customId === customIds.clans && action.isSelectMenu()) {
				state.clans = action.values;
				return action.update({ components: mutate() });
			}

			if (action.customId === customIds.save && action.isButton()) {
				await action.deferUpdate();
				const reminder = {
					guild: message.guild!.id,
					channel: channel?.id ?? message.channel.id,
					remaining: state.remaining.map(num => Number(num)),
					townHalls: state.townHalls.map(num => Number(num)),
					roles: state.roles,
					clans: state.clans,
					message: text.trim(),
					duration: dur,
					createdAt: new Date()
				};

				const { insertedId } = await this.client.db.collection<Reminder>(Collections.REMINDERS).insertOne(reminder);
				this.client.remindScheduler.create({ ...reminder, _id: insertedId });
				await action.editReply({ components: mutate(true), content: '**Successfully saved!**' });
			}
		});

		collector.on('end', async (_, reason) => {
			for (const id of Object.values(customIds)) {
				this.client.components.delete(id);
			}
			if (!/delete/i.test(reason)) await msg.edit({ components: mutate(true) });
		});
	}
}
