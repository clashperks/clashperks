import { Collections } from '../../util/Constants';
import { Command } from 'discord-akairo';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import qs from 'querystring';

const rewards: { [key: string]: number } = {
	3705318: 3 * 100,
	4742718: 5 * 100,
	5352215: 10 * 100
};

export default class RedeemCommand extends Command {
	public constructor() {
		super('redeem', {
			aliases: ['redeem'],
			category: 'none',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: 'Redeems your patreon subscription.'
			}
		});
	}

	public async exec(message: Message) {
		const query = qs.stringify({
			'include': 'patron.null,reward.null',
			'page[count]': 100,
			'sort': 'created'
		});
		const res = await fetch(`https://www.patreon.com/api/oauth2/api/campaigns/2589569/pledges?${query}`, {
			headers: {
				authorization: `Bearer ${process.env.PATREON_API!}`
			},
			timeout: 5000
		}).catch(() => null);
		const data = await res?.json().catch(() => null);
		if (!data) {
			return message.util!.send('**Something went wrong, please contact us!**');
		}

		const patron = data.included.find((entry: any) => entry?.attributes?.social_connections?.discord?.user_id === message.author.id);
		if (!patron) {
			const embed = this.client.util.embed()
				.setColor(16345172)
				.setDescription([
					'I could not find any patreon account connected to your discord.',
					'',
					'Make sure that you are connected and subscribed to ClashPerk.',
					'Not subscribed yet? [Become a Patron](https://www.patreon.com/clashperk)'
				].join('\n'))
				.addField('How to connect?', 'https://www.patreon.com/settings/apps')
				.setImage('https://i.imgur.com/APME0CX.png');

			return message.util!.send({ embeds: [embed] });
		}

		if (this.client.patrons.get(message.guild!.id)) {
			return message.util!.send('This server already has an active subscription.');
		}

		const db = this.client.db.collection(Collections.PATRONS);
		const user = await db.findOne({ id: patron.id });

		const pledge = data.data.find((entry: any) => entry?.relationships?.patron?.data?.id === patron.id);
		if (pledge.attributes.declined_since) {
			return message.util!.send('**Something went wrong, please contact us!**');
		}

		const rewardId = pledge.relationships.reward?.data?.id;
		if (!user) {
			await db.updateOne(
				{ id: patron.id },
				{
					$set: {
						name: patron.attributes.full_name,
						id: patron.id, redeemed: true,
						rewardId: rewards[rewardId] ? rewardId : '000000',
						discord_id: message.author.id,
						discord_username: message.author.username,
						active: true, declined: false, cancelled: false,
						guilds: [{
							id: message.guild!.id,
							limit: (rewards[rewardId] || Math.ceil(pledge.attributes.amount_cents)) >= 300 ? 50 : 5
						}],
						entitled_amount: Math.ceil(pledge.attributes.amount_cents) / 100,
						createdAt: new Date(pledge.attributes.created_at)
					}
				},
				{ upsert: true }
			);

			await this.client.patrons.refresh();
			await this.sync(message.guild!.id);
			const embed = this.client.util.embed()
				.setColor(16345172)
				.setDescription([
					`Patron benefits applied to **${message.guild!.name}**`,
					`Thank you so much for the support ${message.author.toString()}`
				].join('\n'));
			return message.util!.send({ embeds: [embed] });
		}

		const redeemed = this.redeemed(Object.assign(user, { entitled_amount: Math.ceil(pledge.attributes.amount_cents) / 100 }));
		if (redeemed) {
			if (!this.isNew(user, message, patron)) await this.client.patrons.refresh();
			const embed = this.client.util.embed()
				.setColor(16345172)
				.setDescription([
					'You\'ve already claimed your patron benefits!',
					'If you think it\'s wrong, please [contact us](https://discord.gg/ppuppun)'
				].join('\n'));
			return message.util!.send({ embeds: [embed] });
		}

		// NOT Redeemed
		await db.updateOne(
			{ id: patron.id },
			{
				$set: {
					entitled_amount: Math.ceil(pledge.attributes.amount_cents) / 100,
					discord_id: message.author.id,
					discord_username: message.author.username,
					redeemed: true
				},
				$push: {
					guilds: {
						id: message.guild!.id,
						limit: (rewards[rewardId] || Math.ceil(pledge.attributes.amount_cents)) >= 300 ? 50 : 5
					}
				}
			}
		);

		await this.client.patrons.refresh();
		await this.sync(message.guild!.id);
		const embed = this.client.util.embed()
			.setColor(16345172)
			.setDescription([
				`Patron benefits applied to **${message.guild!.name}**`,
				`Thank you so much for the support ${message.author.toString()}`
			].join('\n'));
		return message.channel.send({ embeds: [embed] });
	}

	private isNew(user: any, message: Message, patron: any) {
		if (user && user.discord_id !== message.author.id) {
			this.client.db.collection(Collections.PATRONS)
				.updateOne(
					{ id: patron.id },
					{
						$set: {
							discord_id: message.author.id,
							discord_username: message.author.username
						}
					}
				);
			return true;
		}
		return false;
	}

	private async sync(guild: string) {
		await this.client.db.collection(Collections.CLAN_STORES)
			.updateMany({ guild }, { $set: { active: true, patron: true } });
		await this.client.db.collection(Collections.CLAN_STORES)
			.find({ guild })
			.forEach(data => {
				this.client.rpcHandler.add(data._id.toString(), { tag: data.tag, guild: data.guild, op: 0 });
			});
	}

	private redeemed(user: any) {
		if (user.entitled_amount === 10 && user.guilds && user.guilds.length >= 5) return true;
		else if (user.entitled_amount === 5 && user.guilds && user.guilds.length >= 3) return true;
		else if (user.entitled_amount === 3 && user.guilds && user.guilds.length >= 1) return true;
		else if (user.entitled_amount < 3 && user.redeemed) return true;
		return false;
	}
}
