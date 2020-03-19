const { Command } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');
const { firestore } = require('../../struct/Database');
const { TownHallEmoji, HeroEmojis } = require('../../util/constants');

class ProfileCommand extends Command {
	constructor() {
		super('profile', {
			aliases: ['profile', 'whois'],
			category: 'profile',
			channel: 'guild',
			clientPermissions: ['USE_EXTERNAL_EMOJIS', 'ADD_REACTIONS', 'EMBED_LINKS'],
			description: {
				content: 'Shows information about your profile.',
				usage: '<member>',
				examples: ['', 'Suvajit', 'Reza', '@gop']
			},
			args: [
				{
					id: 'member',
					type: 'guildMember',
					default: message => message.member
				}
			]
		});
	}

	cooldown(message) {
		if (this.client.patron.users.get(message.author, 'patron', false) || this.client.voter.isVoter(message.author.id)) return 1000;
		return 3000;
	}

	async exec(message, { member }) {
		const snap = await this.getProfile(member.id);
		if (!snap) {
			return message.util.send({
				embed: {
					color: 3093046,
					description: `Couldn\'t find a player linked to **${member.user.tag}**!`
				}
			});
		}

		const embed = new MessageEmbed()
			.setColor(0x5970c1)
			.setAuthor(`${member.user.tag}`, member.user.displayAvatarURL())
			.setThumbnail(member.user.displayAvatarURL());

		if (!snap.tags.length) {
			embed.setTitle('No Accounts are Linked');
		}

		if (snap.tags.length) embed.setFooter(`Accounts: ${snap.tags.length}`);

		let accounts = 0;
		for (const tag of snap.tags) {
			const res = await fetch(`https://api.clashofclans.com/v1/players/${encodeURIComponent(tag)}`, {
				method: 'GET',
				headers: { Accept: 'application/json', authorization: `Bearer ${process.env.CLASH_API}` }
			});
			if (!res.ok) continue;
			const data = await res.json();

			embed.addField(`${++accounts}. ${TownHallEmoji[data.townHallLevel]} ${data.name}`, [
				this.heroes(data),
				this.clanName(data)
			]);

			if (accounts === 25) break;
		}

		return message.util.send({ embed });
	}

	clanName(data) {
                const clanEmoji = this.client.emojis.cache.get('534765878118449152');
		if (!data.clan) return `{clanEmoji} No Clan`;
		const clanRole = data.role.replace(/admin/g, 'Elder')
			.replace(/coLeader/g, 'Co-Leader')
			.replace(/member/g, 'Member')
			.replace(/leader/g, 'Leader');
		
		return `${clanEmoji} ${clanRole} of ${data.clan.name}`;
	}

	heroes(data) {
		if (!data.heroes) return '';
		return data.heroes.filter(hero => hero.village === 'home')
			.map(hero => `${HeroEmojis[hero.name]} ${hero.level}`).join(' ');
	}

	async getProfile(id) {
		const data = await firestore.collection('linked_accounts')
			.doc(id)
			.get()
			.then(snap => snap.data());
		return data;
	}
}

module.exports = ProfileCommand;
