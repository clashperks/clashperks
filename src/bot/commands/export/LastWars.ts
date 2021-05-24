import { COLLECTIONS } from '../../util/Constants';
import { Command } from 'discord-akairo';
import Excel from '../../struct/Excel';
import { Message } from 'discord.js';

// TODO: Fix TS
export default class LastWarsExport extends Command {
	public constructor() {
		super('export-last-wars', {
			category: 'activity',
			channel: 'guild',
			clientPermissions: ['ATTACH_FILES', 'EMBED_LINKS'],
			description: {}
		});
	}

	public async exec(message: Message) {
		if (!this.client.patrons.get(message)) {
			return message.channel.send(
				{ embed: { description: '[Become a Patron](https://www.patreon.com/clashperk) to use this command.' } }
			);
		}

		const clans = await this.client.db.collection(COLLECTIONS.CLAN_STORES)
			.find({ guild: message.guild!.id })
			.toArray();

		if (!clans.length) {
			return message.util!.send(`**No clans are linked to ${message.guild!.name}**`);
		}

		const clanList = (await Promise.all(clans.map(clan => this.client.http.clan(clan.tag)))).filter(res => res.ok);
		const memberList = clanList.map(clan => clan.memberList).flat();

		const workbook = new Excel();
		const sheet = workbook.addWorksheet('Last War Dates');
		const members = await this.client.db.collection(COLLECTIONS.CLAN_WAR_STORES)
			.aggregate([
				{
					$match: {
						'clan.tag': { $in: clanList.map(clan => clan.tag) },
						'state': 'warEnded'
					}
				}, {
					$project: {
						member: '$clan.members',
						date: '$endTime'
					}
				}, {
					$unwind: {
						path: '$member'
					}
				}, {
					$sort: {
						date: -1
					}
				}, {
					$group: {
						_id: '$member.tag',
						date: {
							$first: '$date'
						},
						name: {
							$first: '$member.name'
						},
						total: {
							$sum: 1
						}
					}
				}
			]).toArray();

		sheet.columns = [
			{ header: 'Name', width: 20 },
			{ header: 'Tag', width: 16 },
			{ header: 'Total Wars', width: 10 },
			{ header: 'Last War', width: 16 }
		] as any;

		sheet.getRow(1).font = { bold: true, size: 10 };
		sheet.getRow(1).height = 40;

		for (let i = 1; i <= sheet.columns.length; i++) {
			sheet.getColumn(i).alignment = { horizontal: 'center', wrapText: true, vertical: 'middle' };
		}

		sheet.addRows(
			members.filter(
				mem => memberList.find(m => m.tag === mem._id)
			).map(
				m => [m.name, m._id, m.total, m.date]
			).concat(
				memberList.filter(mem => !members.find(m => m._id === mem.tag)).map(mem => [mem.name, mem.tag, 0])
			)
		);

		const buffer = await workbook.xlsx.writeBuffer();
		return message.util!.send(`**Last Played Wars**`, {
			files: [{
				attachment: Buffer.from(buffer),
				name: 'last_played_wars.xlsx'
			}]
		});
	}
}

