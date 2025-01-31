import { APIPlayerClan } from 'clashofclans.js';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  MessageType,
  StringSelectMenuBuilder
} from 'discord.js';
import { getBbLegendRankingEmbedMaker, getLegendRankingEmbedMaker } from '../../helper/leaderboard.helper.js';
import { Command } from '../../lib/handlers.js';
import { CreateGoogleSheet, createGoogleSheet } from '../../struct/google.js';
import { EMOJIS } from '../../util/emojis.js';
import { getExportComponents } from '../../util/helper.js';
import { Season } from '../../util/toolkit.js';

export default class LegendLeaderboardCommand extends Command {
  public constructor() {
    super('legend-leaderboard', {
      category: 'search',
      channel: 'guild',
      clientPermissions: ['EmbedLinks', 'UseExternalEmojis'],
      defer: true
    });
  }

  public async exec(
    interaction: CommandInteraction<'cached'> | ButtonInteraction<'cached'>,
    args: {
      clans?: string;
      season?: string;
      sort_by?: string;
      export?: boolean;
      limit?: number;
      offset?: number;
      export_disabled?: boolean;
      is_bb?: boolean;
      enable_auto_updating?: string;
    }
  ) {
    const { clans, resolvedArgs } = await this.client.storage.handleSearch(interaction, { args: args.clans });
    if (!clans) return;

    let seasonId = args.season ?? Season.ID;

    const isDefaultMessage = interaction.isMessageComponent() && interaction.message.type === MessageType.Default;
    if (isDefaultMessage) {
      const currentSeasonEnd = this.client.coc.util.getSeasonEnd(new Date()).toISOString();
      const messageSentAt = this.client.coc.util.getSeasonEnd(interaction.message.createdAt).toISOString();
      if (currentSeasonEnd !== messageSentAt) seasonId = messageSentAt.slice(0, 7);
    }

    const { embed, players } = args.is_bb
      ? await getBbLegendRankingEmbedMaker({
          guild: interaction.guild,
          sort_by: args.sort_by,
          limit: args.limit,
          offset: args.offset,
          seasonId,
          clanTags: clans.map((clan) => clan.tag)
        })
      : await getLegendRankingEmbedMaker({
          guild: interaction.guild,
          sort_by: args.sort_by,
          limit: args.limit,
          offset: args.offset,
          seasonId,
          clanTags: clans.map((clan) => clan.tag)
        });

    if (!players.length) {
      embed.setDescription(`No players are in the ${args.is_bb ? 'Legend League' : 'Leaderboard'}`);
    }

    if (players.length && args.enable_auto_updating && this.client.util.isManager(interaction.member)) {
      await this.client.storage.makeAutoBoard({
        channelId: interaction.channelId,
        boardType: args.enable_auto_updating,
        guild: interaction.guild,
        props: { limit: args.limit, offset: args.offset }
      });
      return interaction.editReply('Successfully enabled auto updating Leaderboard.');
    }

    const payload = {
      cmd: this.id,
      clans: resolvedArgs,
      sort_by: args.sort_by,
      limit: args.limit,
      offset: args.offset,
      is_bb: args.is_bb,
      season: args.season && args.season !== Season.ID ? args.season : null,
      export_disabled: args.export_disabled
    };

    const customIds = {
      toggle: this.createId({ ...payload, is_bb: !args.is_bb }),
      refresh: this.createId({ ...payload, export_disabled: false }),
      sortBy: this.createId({ ...payload, string_key: 'sort_by' }),
      export: this.createId({ ...payload, defer: false, export: true, export_disabled: true })
    };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setEmoji(EMOJIS.REFRESH).setStyle(ButtonStyle.Secondary).setCustomId(customIds.refresh)
    );
    if (!args.is_bb) {
      row.addComponents(
        new ButtonBuilder()
          .setEmoji(EMOJIS.EXPORT)
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(customIds.export)
          .setDisabled(Boolean(args.export_disabled))
      );
    }

    if (!isDefaultMessage) {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(args.is_bb ? 'Legend League' : 'Builder Base League')
          .setStyle(ButtonStyle.Secondary)
          .setCustomId(customIds.toggle)
          .setDisabled(Boolean(args.export_disabled))
      );
    }

    const sortingRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(customIds.sortBy)
        .setPlaceholder('Sort by')
        .addOptions(
          {
            label: 'Town Hall Ascending',
            description: 'Lowest Town Hall with highest Trophies',
            value: 'town_hall_asc',
            default: args.sort_by === 'town_hall_asc'
          },
          {
            label: 'Town Hall Descending',
            description: 'Highest Town Hall with highest Trophies',
            value: 'town_hall_desc',
            default: args.sort_by === 'town_hall_desc'
          },
          {
            label: 'Trophies Only',
            description: 'Highest Trophies Only',
            value: 'trophies_only',
            default: args.sort_by === 'trophies_only'
          }
        )
    );

    if (seasonId !== Season.ID && !args.season) {
      return interaction.editReply({ embeds: [embed], components: [] });
    }

    if (args.export && interaction.isButton()) {
      await interaction.editReply({ embeds: [embed], components: [row, sortingRow], message: interaction.message.id });
      await this.export(interaction, players, clans);
    } else {
      await interaction.editReply({ embeds: [embed], components: args.is_bb || isDefaultMessage ? [row] : [row, sortingRow] });
    }
  }

  private async export(
    interaction: CommandInteraction<'cached'> | ButtonInteraction<'cached'>,
    players: { name: string; tag: string; clan?: APIPlayerClan; townHallLevel: number; trophies: number; attackWins: number }[],
    clans: { name: string }[]
  ) {
    const sheets: CreateGoogleSheet[] = [
      {
        title: `Leaderboard`,
        columns: [
          { name: 'NAME', align: 'LEFT', width: 160 },
          { name: 'TAG', align: 'LEFT', width: 160 },
          { name: 'CLAN', align: 'LEFT', width: 160 },
          { name: 'CLAN TAG', align: 'LEFT', width: 160 },
          { name: 'TOWN HALL', align: 'RIGHT', width: 100 },
          { name: 'TROPHIES', align: 'RIGHT', width: 100 },
          { name: 'ATTACKS WON', align: 'RIGHT', width: 100 }
        ],
        rows: players.map((player) => [
          player.name,
          player.tag,
          player.clan?.name,
          player.clan?.tag,
          player.townHallLevel,
          player.trophies,
          player.attackWins
        ])
      }
    ];

    const spreadsheet = await createGoogleSheet(`${interaction.guild.name} [Legend Ranking]`, sheets);
    return interaction.followUp({
      content: `**Legend Leaderboard** (${clans.map((clan) => clan.name).join(', ')})`,
      components: getExportComponents(spreadsheet)
    });
  }
}
