import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../lib/index.js';
import { BLUE_NUMBERS, EMOJIS } from '../../util/_emojis.js';
import { Collections } from '../../util/constants.js';
import { Season, Util } from '../../util/index.js';

// TODO: Per season activity
export default class SummaryCommand extends Command {
  public constructor() {
    super('summary-activity', {
      category: 'none',
      channel: 'guild',
      clientPermissions: ['EmbedLinks'],
      defer: true
    });
  }

  public async exec(
    interaction: CommandInteraction<'cached'>,
    args: { clans?: string; season?: string; clans_only?: boolean; asc_order?: boolean }
  ) {
    const season = args.season ?? Season.ID;
    const { clans, resolvedArgs } = await this.client.storage.handleSearch(interaction, { args: args.clans });
    if (!clans) return;

    const embed = args.clans_only
      ? await this.getClansEmbed(interaction, clans)
      : await this.getMembersEmbed(interaction, clans, season, Boolean(args.asc_order));

    const payload = {
      cmd: this.id,
      clans_only: args.clans_only,
      season: args.season,
      clans: resolvedArgs,
      asc_order: args.asc_order
    };

    const customIds = {
      refresh: this.createId(payload),
      toggle: this.createId({ ...payload, clans_only: !args.clans_only }),
      asc_order: this.createId({ ...payload, asc_order: !args.asc_order })
    };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setEmoji(EMOJIS.REFRESH).setStyle(ButtonStyle.Secondary).setCustomId(customIds.refresh),
      new ButtonBuilder()
        .setLabel(args.clans_only ? 'Players Summary' : 'Clans Summary')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(customIds.toggle),
      new ButtonBuilder()
        .setLabel(args.asc_order ? 'Most Active' : 'Least Active')
        .setStyle(ButtonStyle.Secondary)
        .setCustomId(customIds.asc_order)
    );

    return interaction.editReply({ embeds: [embed], components: [row] });
  }

  private async getActivity(clanTag: string): Promise<{ avgDailyActivity: number; avgDailyOnline: number } | null> {
    const body = await this.client.elastic.search<unknown, AggregationsAggregate>({
      index: 'player_activities',
      query: {
        bool: {
          filter: [
            {
              term: {
                clanTag: {
                  value: clanTag
                }
              }
            },
            {
              range: {
                timestamp: {
                  gte: 'now-30d/d'
                }
              }
            }
          ]
        }
      },
      size: 0,
      aggs: {
        daily_stats: {
          date_histogram: {
            field: 'timestamp',
            calendar_interval: 'day'
          },
          aggs: {
            online_members_count: {
              cardinality: {
                field: 'tag'
              }
            }
          }
        },
        avg_daily_members: {
          avg_bucket: {
            buckets_path: 'daily_stats>online_members_count'
          }
        },
        avg_daily_activity: {
          avg_bucket: {
            buckets_path: 'daily_stats>_count'
          }
        }
      }
    });
    return {
      avgDailyOnline: body.aggregations?.avg_daily_members.value ?? 0,
      avgDailyActivity: body.aggregations?.avg_daily_activity.value ?? 0
    };
  }

  private async aggregationQuery(playerTags: string[], season: string, ascOrder: boolean) {
    const db = this.client.db.collection(Collections.PLAYERS);
    const result = await db
      .aggregate<{ name: string; tag: string; lastSeen?: Date; score?: number }>([
        {
          $match: {
            tag: {
              $in: playerTags
            }
          }
        },
        {
          $sort: {
            [`seasons.${season}`]: ascOrder ? 1 : -1
          }
        },
        {
          $project: {
            tag: '$tag',
            name: '$name',
            lastSeen: '$lastSeen',
            score: `$seasons.${season}`
          }
        },
        {
          $match: {
            score: {
              $exists: true
            },
            lastSeen: {
              $exists: true
            }
          }
        },
        {
          $limit: 100
        }
      ])
      .toArray();

    return result.filter((r) => r.score && r.lastSeen);
  }

  private async getClansEmbed(interaction: CommandInteraction<'cached'>, clans: any[]) {
    const collection: { online: number; total: number; name: string; tag: string }[] = [];
    for (const clan of clans) {
      const action = await this.getActivity(clan.tag);
      collection.push({
        online: action?.avgDailyOnline ?? 0,
        total: action?.avgDailyActivity ?? 0,
        name: clan.name,
        tag: clan.tag
      });
      if (!action) continue;
    }

    collection.sort((a, b) => b.total - a.total);
    const embed = new EmbedBuilder();
    embed.setAuthor({ name: 'Clan Activity Summary', iconURL: interaction.guild.iconURL()! });
    embed.setDescription(
      [
        'Daily average active members (AVG)',

        `\u200e${EMOJIS.HASH}  \`AVG\`  \`SCORE\`  \` ${'CLAN NAME'.padEnd(15, ' ')}\``,
        ...collection.map((clan, i) => {
          const online = clan.online.toFixed(0).padStart(3, ' ');
          const total = clan.total.toFixed(0).padStart(5, ' ');
          return `\u200e${BLUE_NUMBERS[i + 1]}  \`${online}\`  \`${total}\`  \` ${clan.name.padEnd(15, ' ')}\``;
        })
      ].join('\n')
    );
    embed.setFooter({ text: ['Based on the last 30 days of activities'].join('\n') });
    return embed;
  }

  private async getMembersEmbed(interaction: CommandInteraction<'cached'>, clans: any[], season: string, ascOrder: boolean) {
    const embed = new EmbedBuilder();
    embed.setAuthor({ name: `${interaction.guild.name} Most Active Members` });

    const clanList = await this.client.redis.getClans(clans.map((clan) => clan.tag));
    const clanMemberTags = clanList.flatMap((clan) => clan.memberList).map((m) => m.tag);
    const members = await this.aggregationQuery(clanMemberTags, season, ascOrder);

    embed.setDescription(
      [
        `\`\`\`\n\u200eLAST-ON SCORE  NAME\n${members
          .map((m) => `${this.getTime(m.lastSeen!.getTime())}  ${m.score!.toString().padStart(4, ' ')}  ${m.name}`)
          .join('\n')}`,
        '```'
      ].join('\n')
    );
    embed.setFooter({ text: `Season ${season} ` });
    return embed;
  }

  private getTime(ms: number) {
    ms = Date.now() - ms;
    if (!ms) return ''.padEnd(7, ' ');
    return Util.duration(ms + 1e3).padEnd(7, ' ');
  }
}

// TODO: REMOVE DUPLICATE
interface AggregationsAggregate {
  daily_stats: {
    buckets: {
      key_as_string: string;
      key: number;
      doc_count: number;
      online_members_count: {
        value: number;
      };
    }[];
  };
  avg_daily_members: {
    value: number | null;
  };
  avg_daily_activity: {
    value: number | null;
  };
}
