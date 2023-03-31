import { ClanWar, WarClan } from 'clashofclans.js';
import { Collection, Guild, GuildMember } from 'discord.js';
import Client from '../struct/Client.js';
import { Collections } from '../util/Constants.js';
import { PlayerLinks } from '../types/index.js';

interface Feed extends ClanWar {
	result: string;
	round: number;
	uid: string;
	id: number;
	warTag?: string;
	attacksPerMember: number;
	clan: WarClan & { changedRosters?: { added: string[]; removed: string[] } };
	opponent: WarClan;
}

export class WarRoleManager {
	public constructor(private readonly client: Client) {}

	public async exec(tag: string, data: Feed) {
		const result = await this.client.db
			.collection(Collections.CLAN_STORES)
			.aggregate<{ guild: string; warRole: string }>([
				{
					$match: {
						tag
					}
				},
				{
					$project: {
						guild: 1,
						warRole: 1
					}
				}
			])
			.toArray();
		const clans = result.filter((clan) => this.client.guilds.cache.has(clan.guild) && clan.warRole);
		if (!clans.length) return null;

		if (data.warTag) {
			return this.handleCWLWar(clans, data);
		}

		return this.handleRegularWar(clans, data);
	}

	public async handleRegularWar(clans: { guild: string; warRole: string }[], data: Feed) {
		const links = await this.client.db
			.collection<PlayerLinks>(Collections.PLAYER_LINKS)
			.find({ tag: { $in: data.clan.members.map((member) => member.tag) } })
			.toArray();

		for (const clan of clans) {
			const guild = this.client.guilds.cache.get(clan.guild);
			if (!guild) continue;

			const role = guild.roles.cache.get(clan.warRole);
			if (!role) continue;

			const members = await guild.members.fetch({ user: links.map((link) => link.userId) });
			if (!members.size) continue;

			for (const link of links) {
				const member = members.get(link.userId);
				if (!member) continue;

				if (data.state === 'warEnded') {
					await this.handleRoles({
						members,
						guildId: guild.id,
						userId: link.userId,
						roleIds: [],
						roles: [clan.warRole],
						reason: `Clan war ended (${data.clan.name} vs ${data.opponent.name})`
					});
				} else {
					await this.handleRoles({
						members,
						guildId: guild.id,
						userId: link.userId,
						roleIds: [clan.warRole],
						roles: [],
						reason: `In clan war (${data.clan.name} vs ${data.opponent.name})`
					});
				}
			}
		}
	}

	public async handleCWLWar(clans: { guild: string; warRole: string }[], data: Feed) {
		const removed = data.clan.changedRosters?.removed ?? [];

		const links = await this.client.db
			.collection<PlayerLinks>(Collections.PLAYER_LINKS)
			.find({ tag: { $in: [...data.clan.members.map((member) => member.tag), ...removed] } })
			.toArray();

		for (const clan of clans) {
			const guild = this.client.guilds.cache.get(clan.guild);
			if (!guild) continue;

			const role = guild.roles.cache.get(clan.warRole);
			if (!role) continue;

			const members = await guild.members.fetch({ user: links.map((link) => link.userId) });
			if (!members.size) continue;

			for (const link of links) {
				const member = members.get(link.userId);
				if (!member) continue;

				if (data.state === 'warEnded') {
					await this.handleRoles({
						members,
						guildId: guild.id,
						userId: link.userId,
						roleIds: [],
						roles: [clan.warRole],
						reason: `Clan war ended (${data.clan.name} vs ${data.opponent.name})`
					});
				}

				if (['preparation'].includes(data.state)) {
					const _removed = removed.includes(link.tag);
					const _others = links.filter(({ userId, tag }) => userId === link.userId && tag !== link.tag);
					const removable = _removed && !_others.length;

					if (removable) {
						await this.handleRoles({
							members,
							guildId: guild.id,
							userId: link.userId,
							roleIds: [],
							roles: [clan.warRole],
							reason: `Player removed from CWL #${data.round} (${data.clan.name} vs ${data.opponent.name})`
						});
					} else {
						await this.handleRoles({
							members,
							guildId: guild.id,
							userId: link.userId,
							roleIds: [clan.warRole],
							roles: [],
							reason: `In CWL #${data.round} (${data.clan.name} vs ${data.opponent.name})`
						});
					}
				}

				if (['inWar'].includes(data.state)) {
					await this.handleRoles({
						members,
						guildId: guild.id,
						userId: link.userId,
						roleIds: [clan.warRole],
						roles: [],
						reason: 'Clan war ended'
					});
				}
			}
		}
	}

	public async handleRoles({
		members,
		guildId,
		userId,
		roleIds,
		roles,
		reason
	}: {
		members: Collection<string, GuildMember>;
		guildId: string;
		userId: string;
		roleIds: string[]; // to be added
		roles: string[]; // all roles
		reason: string;
	}) {
		const guild = this.client.guilds.cache.get(guildId);

		if (!roleIds.length && !roles.length) return 0;
		if (!guild?.members.me?.permissions.has('ManageRoles')) return 0;

		if (!members.has(userId)) return 0;
		const member = members.get(userId)!;
		if (member.user.bot) return 0;

		// filter out the roles that should be removed
		const excluded = roles
			.filter((id) => !roleIds.includes(id))
			.filter((id) => this.checkRole(guild, guild.members.me!, id))
			.filter((id) => member.roles.cache.has(id));

		if (excluded.length) {
			await member.roles.remove(excluded, reason);
		}

		// filter out the roles that should be added
		const included = roleIds
			.filter((id) => guild.roles.cache.has(id))
			.filter((id) => guild.members.me!.roles.highest.position > guild.roles.cache.get(id)!.position)
			.filter((id) => !member.roles.cache.has(id));

		if (!included.length) return excluded.length;
		await member.roles.add(included, reason);
		return included.length;
	}

	private checkRole(guild: Guild, member: GuildMember, roleId: string) {
		const role = guild.roles.cache.get(roleId);
		return role && member.roles.highest.position > role.position;
	}
}