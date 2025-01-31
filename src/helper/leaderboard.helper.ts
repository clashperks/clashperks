import { Collections } from '@app/constants';
import { LegendAttacksEntity } from '@app/entities';
import { APIPlayerClan } from 'clashofclans.js';
import { EmbedBuilder, escapeMarkdown, Guild } from 'discord.js';
import moment from 'moment';
import { container } from 'tsyringe';
import { Client } from '../struct/client.js';
import { BLUE_NUMBERS } from '../util/emojis.js';
import { escapeBackTick, padStart } from '../util/helper.js';

export const getLegendRankingEmbedMaker = async ({
  clanTags,
  guild,
  sort_by,
  limit,
  offset,
  seasonId
}: {
  guild: Guild;
  clanTags?: string[];
  sort_by?: string;
  limit?: number;
  offset?: number;
  seasonId: string;
}) => {
  const client = container.resolve(Client);
  clanTags ??= (await client.storage.find(guild.id)).map((clan) => clan.tag);

  const _clans = await client.redis.getClans(clanTags);
  const memberTags = _clans.map((clan) => clan.memberList.map((member) => member.tag)).flat();
  const _players = await client.redis.getPlayers(memberTags);

  const playersMap = _players.reduce<Record<string, { townHallLevel: number; attackWins: number; clan?: APIPlayerClan; trophies: number }>>(
    (record, curr) => {
      record[curr.tag] = {
        townHallLevel: curr.townHallLevel,
        attackWins: curr.attackWins,
        clan: curr.clan,
        trophies: curr.trophies
      };
      return record;
    },
    {}
  );

  const legends = await client.db
    .collection<Omit<LegendAttacksEntity, 'logs'>>(Collections.LEGEND_ATTACKS)
    .find({ tag: { $in: _players.map(({ tag }) => tag) }, seasonId }, { projection: { logs: 0, defenseLogs: 0, attackLogs: 0 } })
    .toArray();

  let players = legends
    .map((legend) => {
      const player = playersMap[legend.tag];
      return {
        name: legend.name,
        tag: legend.tag,
        clan: player.clan,
        actualTrophies: player.trophies,
        trophies: legend.trophies,
        attackWins: player.attackWins,
        townHallLevel: player.townHallLevel
      };
    })
    .filter((legend) => legend.actualTrophies >= 4900);

  if (sort_by === 'town_hall_asc') {
    players.sort((a, b) => b.trophies - a.trophies);
    players.sort((a, b) => a.townHallLevel - b.townHallLevel);
  } else if (sort_by === 'town_hall_desc') {
    players.sort((a, b) => b.trophies - a.trophies);
    players.sort((a, b) => b.townHallLevel - a.townHallLevel);
  } else {
    players.sort((a, b) => b.trophies - a.trophies);
  }

  offset = offset || 0;
  limit = (limit || 50) + offset;
  players = players.slice(offset, limit);

  const embed = new EmbedBuilder();
  embed.setColor(client.embed(guild.id));
  embed.setAuthor({ name: `Legend Leaderboard (${moment(seasonId).format('MMM YYYY')})`, iconURL: guild.iconURL()! });
  embed.setFooter({ text: 'Synced' });
  embed.setTimestamp();

  if (players.length) {
    embed.setDescription(
      [
        '```',
        `\u200e #  TH TROPHY WON  NAME`,
        ...players.slice(0, 99).map((player, n) => {
          const trophies = player.trophies;
          const attacks = padStart(player.attackWins, 3);
          const name = escapeBackTick(player.name);
          const townHall = padStart(player.townHallLevel, 2);
          return `\u200e${padStart(offset + n + 1, 2)}  ${townHall}  ${trophies}  ${attacks}  ${name}`;
        }),
        '```'
      ].join('\n')
    );
  }

  if ((!sort_by || sort_by === 'trophies_only') && players.length) {
    embed.setDescription(
      players
        .slice(0, 50)
        .map((player, idx) => {
          const name = escapeMarkdown(`${player.name}${player.clan ? ` | ${player.clan.name}` : ''}`);
          return `${BLUE_NUMBERS[offset + idx + 1]} \`${player.trophies}\` \u200b \u200e${name}`;
        })
        .join('\n')
    );
  }

  return { embed, players };
};

export const getBbLegendRankingEmbedMaker = async ({
  clanTags,
  guild,
  limit,
  offset,
  seasonId
}: {
  guild: Guild;
  clanTags?: string[];
  sort_by?: string;
  limit?: number;
  offset?: number;
  seasonId: string;
}) => {
  const client = container.resolve(Client);
  clanTags ??= (await client.storage.find(guild.id)).map((clan) => clan.tag);

  const _clans = await client.redis.getClans(clanTags);
  const memberTags = _clans.map((clan) => clan.memberList.map((member) => member.tag)).flat();
  const _players = await client.redis.getPlayers(memberTags);

  const playersMap = _players.reduce<Record<string, { clan?: APIPlayerClan; attackWins: number; townHallLevel: number }>>((prev, curr) => {
    prev[curr.tag] = {
      clan: curr.clan,
      attackWins: curr.attackWins,
      townHallLevel: curr.townHallLevel
    };
    return prev;
  }, {});

  const result = await client.db
    .collection<{ name: string; tag: string; versusTrophies: { current: number }; builderHallLevel: number }>(Collections.PLAYER_SEASONS)
    .find(
      { season: seasonId, tag: { $in: _players.map(({ tag }) => tag) } },
      { projection: { name: 1, tag: 1, versusTrophies: 1, builderHallLevel: 1 } }
    )
    .toArray();

  let players = result.map((player) => {
    const _player = playersMap[player.tag];
    return {
      name: player.name,
      tag: player.tag,
      clan: _player.clan,
      attackWins: _player.attackWins,
      townHallLevel: _player.townHallLevel,
      trophies: player.versusTrophies.current ?? 0,
      builderHallLevel: player.builderHallLevel
    };
  });

  players = players.filter((player) => player.trophies >= 5000);
  players.sort((a, b) => b.trophies - a.trophies);

  offset = offset || 0;
  limit = (limit || 50) + offset;
  players = players.slice(offset, limit);

  const embed = new EmbedBuilder();
  embed.setColor(client.embed(guild.id));
  embed.setAuthor({
    name: `Builder Base Leaderboard (${moment(seasonId).format('MMM YYYY')})`,
    iconURL: guild.iconURL()!
  });
  embed.setFooter({ text: 'Synced' });
  embed.setTimestamp();

  if (players.length) {
    embed.setDescription(
      players
        .slice(0, 50)
        .map((player, idx) => {
          const name = escapeMarkdown(`${player.name}${player.clan ? ` | ${player.clan.name}` : ''}`);
          return `${BLUE_NUMBERS[offset + idx + 1]} \`${player.trophies}\` \u200b \u200e${name}`;
        })
        .join('\n')
    );
  }

  return { embed, players };
};
