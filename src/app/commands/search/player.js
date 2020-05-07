const { Command, Flag } = require('discord-akairo');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');
const { firestore } = require('../../struct/Database');
const Resolver = require('../../struct/Resolver');
const { fetcherror } = require('../../util/constants');
const { leagueId } = require('../../util/constants');
const { emoji, townHallEmoji, heroEmoji, leagueEmoji, starEmoji } = require('../../util/emojis');

class PlayerCommand extends Command {
	constructor() {
		super('player', {
			aliases: ['player'],
			category: 'search',
			clientPermissions: ['EMBED_LINKS', 'USE_EXTERNAL_EMOJIS'],
			description: {
				content: 'Shows info about your in-game profile.',
				usage: '<playerTag>',
				examples: ['#9Q92C8R20']
			}
		});
	}

	*args() {
		const data = yield {
			type: async (message, args) => {
				const resolved = await Resolver.resolve(message, args, true);
				if (resolved.status !== 200) {
					await message.util.send({ embed: resolved.embed });
					return Flag.cancel();
				}
				return resolved;
			}
		};

		return { data };
	}

	cooldown(message) {
		if (this.client.patron.isPatron(message.author, message.guild) || this.client.voteHandler.isVoter(message.author.id)) return 1000;
		return 3000;
	}

	async exec(message, { data }) {
		if (data.status !== 200) return message.util.send({ embed: fetcherror(data.status) });

		const embed = new MessageEmbed()
			.setColor(0x5970c1)
			.setAuthor(`${data.name} (${data.tag})`, data.league ? data.league.iconUrls.small : null)
			.setTitle('Open In-Game')
			.setURL(`https://link.clashofclans.com/?action=OpenPlayerProfile&tag=${data.tag.replace(/#/g, '')}`)
			.setThumbnail(`https://coc.guide/static/imgs/other/town-hall-${data.townHallLevel}.png`);

		embed.addField('Town Hall', `${townHallEmoji[data.townHallLevel]} ${data.townHallLevel}`, true);
		embed.addField('Current League', [
			`${leagueEmoji[data.league ? data.league.id : 29000000]} ${data.league ? data.league.name : 'Unranked'} (${data.trophies})`
		], true);
		embed.addField('XP Level', `${emoji.xp} ${data.expLevel}`, true);

		embed.addField('Best Trophies', `${leagueEmoji[leagueId(data.bestTrophies)]} **${data.bestTrophies}**`, true);

		embed.addField('War Stars', `${emoji.warstar} ${data.warStars}`, true);
		embed.addField('Attacks/Defenses', `${emoji.attacksword} ${data.attackWins} ${emoji.shield} ${data.defenseWins}`, true);

		embed.addField('Donations/Receives', [
			`${data.donations} / ${data.donationsReceived}`
		], true);

		data.achievements.forEach(achievement => {
			if (achievement.name === 'Friend in Need') {
				embed.addField('Friend in Need', `${starEmoji[achievement.stars]} ${achievement.value}`, true);
			}
			if (achievement.name === 'Games Champion') {
				embed.addField('Clan Games Points', `${starEmoji[achievement.stars]} ${achievement.value}`, true);
			}
			if (achievement.name === 'War League Legend') {
				embed.addField('CWL Stars', `${starEmoji[achievement.stars]} ${achievement.value}`, true);
			}
		});

		if (data.clan) {
			const role = data.role.replace(/admin/g, 'Elder')
				.replace(/coLeader/g, 'Co-Leader')
				.replace(/member/g, 'Member')
				.replace(/leader/g, 'Leader');
			embed.addField('Clan', [
				`${emoji.clan} ${role} of **${data.clan.name}** [${data.clan.tag}](https://link.clashofclans.com/?action=OpenClanProfile&tag=${data.clan.tag.replace(/#/g, '')})`
			]);
		}

		let heroLevels = '';
		data.heroes.forEach(hero => {
			if (hero.village === 'home') {
				if (hero.level === hero.maxLevel) {
					heroLevels += `${heroEmoji[hero.name]} **${hero.level}**\u2002\u2002`;
				} else {
					heroLevels += `${heroEmoji[hero.name]} ${hero.level}\u2002\u2002`;
				}
			}
		});
		if (heroLevels) embed.addField('Heroes', heroLevels);


		const body = await this.note(message, data.tag);
		if (body) {
			const user = this.client.users.cache.get(body.user);
			embed.addField('Note', [
				body.note,
				'',
				`**${user ? user.tag : body.user}** created on **${moment(body.createdAt).format('MMMM D, YYYY, hh:mm')}**`
			]);
		}

		return message.util.send({ embed });
	}

	async note(message, tag) {
		const data = await firestore.collection('player_notes')
			.doc(`${message.guild.id}${tag}`)
			.get()
			.then(snap => snap.data());
		return data;
	}
}

module.exports = PlayerCommand;
