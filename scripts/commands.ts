import {
  BUILDER_BASE_LEAGUE_NAMES,
  BUILDER_HALL_LEVELS_FOR_ROLES,
  MAX_TOWN_HALL_LEVEL,
  PLAYER_LEAGUE_NAMES,
  TOWN_HALL_LEVELS_FOR_ROLES
} from '@app/constants';
import {
  APIApplicationCommandBasicOption,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  RESTPostAPIApplicationCommandsJSONBody
} from 'discord.js';
import i18next from 'i18next';
import moment from 'moment';
import { fileURLToPath } from 'node:url';
import { title } from 'radash';
import { MembersCommandOptions, RosterCommandSortOptions, RosterManageActions } from '../src/util/command.options.js';
import { Backend } from '../src/util/i18n.backend.js';
import { defaultOptions, fallbackLng } from '../src/util/i18n.config.js';
import { TranslationKey } from '../src/util/i18n.js';
import { command, common } from '../src/util/locales.js';
import { Season } from '../src/util/toolkit.js';

const locales = new URL('../locales/{{lng}}/{{ns}}.json', import.meta.url);
await i18next.use(Backend).init({
  ...defaultOptions,
  backend: { paths: [fileURLToPath(locales)] }
});

function getSeasonIds() {
  return Array(Math.min(18))
    .fill(0)
    .map((_, m) => {
      const now = new Date(Season.ID);
      now.setHours(0, 0, 0, 0);
      now.setMonth(now.getMonth() - (m - 1), 0);
      return now;
    })
    .filter((now) => now.getTime() >= new Date('2021-04').getTime())
    .map((now) => {
      return { name: moment(now).format('MMM YYYY'), value: moment(now).format('YYYY-MM') };
    });
}

const SEASON_SINCE_CHOICES = getSeasonIds().map((season) => ({ name: `Since ${season.name}`, value: season.value }));

function getWeekIds() {
  const weekIds: { name: string; value: string }[] = [];
  const friday = moment().endOf('month').day('Friday').startOf('day');
  while (weekIds.length < 6) {
    if (friday.toDate().getTime() < Date.now()) {
      weekIds.push({ name: friday.format('DD MMM, YYYY'), value: friday.format('YYYY-MM-DD') });
    }
    friday.subtract(7, 'd');
  }
  return weekIds;
}

const ChannelTypes: Exclude<ChannelType, ChannelType.DM | ChannelType.GroupDM>[] = [
  ChannelType.GuildText,
  ChannelType.GuildAnnouncement,
  ChannelType.AnnouncementThread,
  ChannelType.PublicThread,
  ChannelType.PrivateThread,
  ChannelType.GuildMedia
];

const IntegrationTypes = {
  GUILD_INSTALL: 0,
  USER_INSTALL: 1
} as const;

const ContextTypes = {
  GUILD: 0,
  BOT_DM: 1,
  PRIVATE_CHANNEL: 2
} as const;

const userInstallable = {
  integration_types: [IntegrationTypes.GUILD_INSTALL, IntegrationTypes.USER_INSTALL],
  contexts: [ContextTypes.GUILD, ContextTypes.BOT_DM, ContextTypes.PRIVATE_CHANNEL]
};

const translation = (text: TranslationKey): Record<string, string> => {
  return Object.keys(fallbackLng).reduce<Record<string, string>>((record, lang) => {
    record[lang] = i18next.t(text, { lng: lang, escapeValue: false });
    return record;
  }, {});
};

export const COMMANDS: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: 'player',
    description: command.player.description,
    dm_permission: false,
    description_localizations: translation('command.player.description'),
    options: [
      {
        name: 'tag',
        description: common.options.player.tag.description,
        description_localizations: translation('common.options.player.tag.description'),
        required: false,
        autocomplete: true,
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'user',
        description: common.options.player.user.description,
        description_localizations: translation('common.options.player.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ],
    ...userInstallable
  },
  {
    name: 'units',
    description: command.units.description,
    dm_permission: false,
    description_localizations: translation('command.units.description'),
    options: [
      {
        name: 'player',
        description: common.options.player.tag.description,
        description_localizations: translation('common.options.player.tag.description'),
        required: false,
        autocomplete: true,
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'user',
        description: common.options.player.user.description,
        description_localizations: translation('common.options.player.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ],
    ...userInstallable
  },
  {
    name: 'upgrades',
    description: command.upgrades.description,
    dm_permission: false,
    description_localizations: translation('command.upgrades.description'),
    options: [
      {
        name: 'player',
        description: common.options.player.tag.description,
        description_localizations: translation('common.options.player.tag.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true
      },
      {
        name: 'user',
        description: common.options.player.user.description,
        description_localizations: translation('common.options.player.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ],
    ...userInstallable
  },
  {
    name: 'rushed',
    description: command.rushed.description,
    dm_permission: false,
    description_localizations: translation('command.rushed.description'),
    options: [
      {
        name: 'player',
        description: common.options.player.tag.description,
        description_localizations: translation('common.options.player.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.player.user.description,
        description_localizations: translation('common.options.player.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'clan',
        description: command.rushed.options.clan.description,
        description_localizations: translation('command.rushed.options.clan.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true
      }
    ],
    ...userInstallable
  },
  {
    name: 'profile',
    description: command.profile.description,
    dm_permission: false,
    description_localizations: translation('command.profile.description'),
    options: [
      {
        name: 'user',
        description: command.profile.options.user.description,
        description_localizations: translation('command.profile.options.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'player',
        description: common.options.player.tag.description,
        description_localizations: translation('common.options.player.tag.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      }
    ]
  },
  {
    name: 'verify',
    description: command.verify.description,
    dm_permission: false,
    description_localizations: translation('command.verify.description'),
    options: [
      {
        name: 'player',
        required: true,
        autocomplete: true,
        description: command.verify.options.tag.description,
        description_localizations: translation('command.verify.options.tag.description'),
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'token',
        required: true,
        description: command.verify.options.token.description,
        description_localizations: translation('command.verify.options.token.description'),
        type: ApplicationCommandOptionType.String
      }
    ]
  },

  // ----------- CLAN BASED -----------
  {
    name: 'clan',
    description: command.clan.description,
    dm_permission: false,
    description_localizations: translation('command.clan.description'),
    options: [
      {
        name: 'tag',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'by_player_tag',
        description: command.clan.options.by_player_tag.description,
        description_localizations: translation('command.clan.options.by_player_tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      }
    ],
    ...userInstallable
  },
  {
    name: 'compo',
    description: command.compo.description,
    dm_permission: false,
    description_localizations: translation('command.compo.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ]
  },
  {
    name: 'boosts',
    description: command.boosts.description,
    dm_permission: false,
    description_localizations: translation('command.boosts.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      }
    ]
  },
  {
    name: 'lastseen',
    description: command.lastseen.description,
    dm_permission: false,
    description_localizations: translation('command.lastseen.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ]
  },
  {
    name: 'activity',
    description: command.activity.description,
    dm_permission: false,
    description_localizations: translation('command.activity.description'),
    options: [
      {
        name: 'clans',
        required: false,
        description: command.activity.options.clans.description,
        description_localizations: translation('command.activity.options.clans.description'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'days',
        required: false,
        description: command.activity.options.days.description,
        description_localizations: translation('command.activity.options.days.description'),
        type: ApplicationCommandOptionType.Integer,
        choices: [
          {
            name: '1',
            value: 1
          },
          {
            name: '3',
            value: 3
          },
          {
            name: '7',
            value: 7
          },
          {
            name: '15',
            value: 15
          },
          {
            name: '30',
            value: 30
          }
        ]
      },
      {
        name: 'limit',
        required: false,
        description: command.activity.options.limit.description,
        description_localizations: translation('command.activity.options.limit.description'),
        type: ApplicationCommandOptionType.Integer,
        max_value: 20,
        min_value: 1
      },
      {
        name: 'timezone',
        required: false,
        autocomplete: true,
        description: command.timezone.options.location.description,
        description_localizations: translation('command.timezone.options.location.description'),
        type: ApplicationCommandOptionType.String
      }
    ]
  },
  {
    name: 'clan-games',
    description: command.clan_games.description,
    dm_permission: false,
    description_localizations: translation('command.clan_games.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'season',
        description: command.clan_games.options.season.description,
        description_localizations: translation('command.clan_games.options.season.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: getSeasonIds()
      }
    ]
  },
  {
    name: 'capital',
    description: command.capital.description,
    dm_permission: false,
    description_localizations: translation('command.capital.description'),
    options: [
      {
        name: 'raids',
        description: command.capital.raids.description,
        description_localizations: translation('command.capital.raids.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: false
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'week',
            description: common.options.week.description,
            description_localizations: translation('common.options.week.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: getWeekIds()
          }
        ]
      },
      {
        name: 'contribution',
        description: command.capital.contribution.description,
        description_localizations: translation('command.capital.contribution.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: false
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'week',
            description: command.capital.contribution.options.week.description,
            description_localizations: translation('command.capital.contribution.options.week.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: getWeekIds()
          }
        ]
      }
    ]
  },
  {
    name: 'attacks',
    description: command.attacks.description,
    dm_permission: false,
    description_localizations: translation('command.attacks.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'season',
        description: command.attacks.options.season.description,
        description_localizations: translation('command.attacks.options.season.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: getSeasonIds()
      }
    ]
  },
  {
    name: 'members',
    description: command.members.description,
    dm_permission: false,
    description_localizations: translation('command.members.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'option',
        description: common.select_an_option,
        description_localizations: translation('common.select_an_option'),
        type: ApplicationCommandOptionType.String,
        choices: [...Object.values(MembersCommandOptions).map((choice) => ({ name: choice.label, value: choice.id }))]
      }
    ]
  },
  {
    name: 'stats',
    description: command.stats.description,
    dm_permission: false,
    description_localizations: translation('command.stats.description'),
    options: [
      {
        name: 'attacks',
        description: command.stats.attacks.description,
        description_localizations: translation('command.stats.attacks.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'roster',
            description: command.stats.options.roster.description,
            description_localizations: translation('command.stats.options.roster.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: false
          },
          {
            name: 'compare',
            description: command.stats.options.compare.description,
            description_localizations: translation('command.stats.options.compare.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'stars',
            description: command.stats.options.stars.description,
            description_localizations: translation('command.stats.options.stars.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: '3',
                value: '==3'
              },
              {
                name: '2',
                value: '==2'
              },
              {
                name: '>= 2',
                value: '>=2'
              },
              {
                name: '1',
                value: '==1'
              },
              {
                name: '>= 1',
                value: '>=1'
              }
            ]
          },
          {
            name: 'type',
            description: command.stats.options.type.description,
            description_localizations: translation('command.stats.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              },
              {
                name: common.choices.regular_and_cwl,
                name_localizations: translation('common.choices.regular_and_cwl'),
                value: 'noFriendly'
              },
              {
                name: common.choices.stats.no_cwl,
                name_localizations: translation('common.choices.stats.no_cwl'),
                value: 'noCWL'
              },
              {
                name: common.choices.stats.all,
                name_localizations: translation('common.choices.stats.all'),
                value: 'all'
              }
            ]
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: SEASON_SINCE_CHOICES
          },
          {
            name: 'days',
            description: command.stats.options.days.description,
            description_localizations: translation('command.stats.options.days.description'),
            type: ApplicationCommandOptionType.Integer,
            min_value: 1,
            max_value: 180
          },
          {
            name: 'wars',
            description: command.stats.options.wars.description,
            description_localizations: translation('command.stats.options.wars.description'),
            type: ApplicationCommandOptionType.Integer,
            min_value: 10,
            max_value: 300
          },
          {
            name: 'attempt',
            description: command.stats.options.attempt.description,
            description_localizations: translation('command.stats.options.attempt.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.stats.fresh,
                name_localizations: translation('common.choices.stats.fresh'),
                value: 'fresh'
              },
              {
                name: common.choices.stats.cleanup,
                name_localizations: translation('common.choices.stats.cleanup'),
                value: 'cleanup'
              }
            ]
          },
          {
            name: 'filter_farm_hits',
            description: command.stats.options.filter_farm_hits.description,
            description_localizations: translation('command.stats.options.filter_farm_hits.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'clan_only',
            description: command.stats.options.clan_only.description,
            description_localizations: translation('command.stats.options.clan_only.description'),
            type: ApplicationCommandOptionType.Boolean,
            required: false
          }
        ]
      },
      {
        name: 'defense',
        name_localizations: {
          'en-GB': 'defence'
        },
        description: command.stats.defense.description,
        description_localizations: translation('command.stats.defense.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'roster',
            description: command.stats.options.roster.description,
            description_localizations: translation('command.stats.options.roster.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: false
          },
          {
            name: 'compare',
            description: command.stats.options.compare.description,
            description_localizations: translation('command.stats.options.compare.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'stars',
            description: command.stats.options.stars.description,
            description_localizations: translation('command.stats.options.stars.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: '3',
                value: '==3'
              },
              {
                name: '2',
                value: '==2'
              },
              {
                name: '>= 2',
                value: '>=2'
              },
              {
                name: '1',
                value: '==1'
              },
              {
                name: '>= 1',
                value: '>=1'
              }
            ]
          },
          {
            name: 'type',
            description: command.stats.options.type.description,
            description_localizations: translation('command.stats.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              },
              {
                name: common.choices.regular_and_cwl,
                name_localizations: translation('common.choices.regular_and_cwl'),
                value: 'noFriendly'
              },
              {
                name: common.choices.stats.no_cwl,
                name_localizations: translation('common.choices.stats.no_cwl'),
                value: 'noCWL'
              },
              {
                name: common.choices.stats.all,
                name_localizations: translation('common.choices.stats.all'),
                value: 'all'
              }
            ]
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: SEASON_SINCE_CHOICES
          },
          {
            name: 'attempt',
            description: command.stats.options.attempt.description,
            description_localizations: translation('command.stats.options.attempt.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.stats.fresh,
                name_localizations: translation('common.choices.stats.fresh'),
                value: 'fresh'
              },
              {
                name: common.choices.stats.cleanup,
                name_localizations: translation('common.choices.stats.cleanup'),
                value: 'cleanup'
              }
            ]
          },
          {
            name: 'clan_only',
            description: command.defense.options.clan_only.description,
            description_localizations: translation('command.defense.options.clan_only.description'),
            type: ApplicationCommandOptionType.Boolean,
            required: false
          }
        ]
      }
    ]
  },
  {
    name: 'donations',
    description: command.donations.description,
    dm_permission: false,
    description_localizations: translation('command.donations.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: command.donations.options.user.description,
        description_localizations: translation('command.donations.options.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'season',
        description: command.donations.options.season.description,
        description_localizations: translation('command.donations.options.season.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        choices: getSeasonIds()
      },
      {
        name: 'start_date',
        description: command.donations.options.start_date.description,
        description_localizations: translation('command.donations.options.start_date.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      },
      {
        name: 'end_date',
        description: command.donations.options.end_date.description,
        description_localizations: translation('command.donations.options.end_date.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      }
    ]
  },
  {
    name: 'war',
    description: command.war.description,
    dm_permission: false,
    description_localizations: translation('command.war.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'war_id',
        description: command.war.options.war_id.description,
        description_localizations: translation('command.war.options.war_id.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      }
    ]
  },
  {
    name: 'caller',
    description: command.caller.description,
    description_localizations: translation('command.caller.description'),
    dm_permission: false,
    options: [
      {
        name: 'assign',
        description: command.caller.assign.description,
        description_localizations: translation('command.caller.assign.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'defense_target',
            description: command.caller.options.defense_target.description,
            description_localizations: translation('command.caller.options.defense_target.description'),
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 50
          },
          {
            name: 'offense_target',
            description: command.caller.assign.options.offense_target.description,
            description_localizations: translation('command.caller.assign.options.offense_target.description'),
            type: ApplicationCommandOptionType.Integer,
            required: true,
            min_value: 1,
            max_value: 50
          },
          {
            name: 'notes',
            description: command.caller.assign.options.notes.description,
            description_localizations: translation('command.caller.assign.options.notes.description'),
            type: ApplicationCommandOptionType.String,
            required: false
          },
          {
            name: 'hours',
            description: command.caller.assign.options.hours.description,
            description_localizations: translation('command.caller.assign.options.hours.description'),
            type: ApplicationCommandOptionType.Number,
            required: false
          }
        ]
      },
      {
        name: 'clear',
        description: command.caller.clear.description,
        description_localizations: translation('command.caller.clear.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'defense_target',
            description: command.caller.options.defense_target.description,
            description_localizations: translation('command.caller.options.defense_target.description'),
            type: ApplicationCommandOptionType.Number,
            required: true,
            min_value: 1,
            max_value: 50
          }
        ]
      }
    ]
  },
  {
    name: 'remaining',
    description: command.remaining.description,
    dm_permission: false,
    description_localizations: translation('command.remaining.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'type',
        description: command.remaining.options.type.description,
        description_localizations: translation('command.remaining.options.type.description'),
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: common.choices.war_attacks,
            name_localizations: translation('common.choices.war_attacks'),
            value: 'war-attacks'
          },
          {
            name: common.choices.clan_games,
            name_localizations: translation('common.choices.clan_games'),
            value: 'clan-games'
          },
          {
            name: common.choices.capital_raids,
            name_localizations: translation('common.choices.capital_raids'),
            value: 'capital-raids'
          }
        ]
      },
      {
        name: 'player',
        description: command.remaining.options.player.description,
        description_localizations: translation('command.remaining.options.player.description'),
        type: ApplicationCommandOptionType.String,
        required: false,
        autocomplete: true
      },
      {
        name: 'user',
        description: command.remaining.options.user.description,
        description_localizations: translation('command.remaining.options.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      },
      {
        name: 'war_id',
        description: command.war.options.war_id.description,
        description_localizations: translation('command.war.options.war_id.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      }
    ]
  },
  {
    name: 'lineup',
    description: command.lineup.description,
    dm_permission: false,
    description_localizations: translation('command.lineup.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true,
        required: false
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ]
  },
  {
    name: 'warlog',
    description: command.warlog.description,
    dm_permission: false,
    description_localizations: translation('command.warlog.description'),
    options: [
      {
        name: 'clan',
        description: common.options.clan.tag.description,
        description_localizations: translation('common.options.clan.tag.description'),
        autocomplete: true,
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'user',
        description: common.options.clan.user.description,
        description_localizations: translation('common.options.clan.user.description'),
        type: ApplicationCommandOptionType.User,
        required: false
      }
    ]
  },
  {
    name: 'history',
    description: command.history.description,
    description_localizations: translation('command.history.description'),
    dm_permission: false,
    options: [
      {
        name: 'option',
        required: true,
        description: common.select_an_option,
        description_localizations: translation('common.select_an_option'),
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: common.choices.clan_games,
            name_localizations: translation('common.choices.clan_games'),
            value: 'clan-games'
          },
          {
            name: common.choices.capital_raids,
            name_localizations: translation('common.choices.capital_raids'),
            value: 'capital-raids'
          },
          {
            name: common.choices.history.capital_contribution,
            name_localizations: translation('common.choices.history.capital_contribution'),
            value: 'capital-contribution'
          },
          {
            name: common.choices.history.cwl_attacks,
            name_localizations: translation('common.choices.history.cwl_attacks'),
            value: 'cwl-attacks'
          },
          {
            name: common.choices.war_attacks,
            name_localizations: translation('common.choices.war_attacks'),
            value: 'war-attacks'
          },
          {
            name: common.choices.history.donations,
            name_localizations: translation('common.choices.history.donations'),
            value: 'donations'
          },
          {
            name: common.choices.history.attacks,
            name_localizations: translation('common.choices.history.attacks'),
            value: 'attacks'
          },
          {
            name: common.choices.history.loot,
            name_localizations: translation('common.choices.history.loot'),
            value: 'loot'
          },
          {
            name: common.choices.history.join_leave,
            name_localizations: translation('common.choices.history.join_leave'),
            value: 'join-leave'
          },
          {
            name: common.choices.history.legend_attacks,
            name_localizations: translation('common.choices.history.legend_attacks'),
            value: 'legend-attacks'
          },
          {
            name: common.choices.history.eos_trophies,
            name_localizations: translation('common.choices.history.eos_trophies'),
            value: 'eos-trophies'
          }
        ]
      },
      {
        name: 'clans',
        autocomplete: true,
        description: command.history.options.clans.description,
        description_localizations: translation('command.history.options.clans.description'),
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'player',
        autocomplete: true,
        description: command.history.options.player.description,
        description_localizations: translation('command.history.options.player.description'),
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'user',
        description: command.history.options.user.description,
        description_localizations: translation('command.history.options.user.description'),
        type: ApplicationCommandOptionType.User
      }
    ]
  },
  {
    name: 'cwl',
    description: command.cwl.description,
    dm_permission: false,
    description_localizations: translation('command.cwl.description'),
    options: [
      {
        name: 'roster',
        description: command.cwl.roster.description,
        description_localizations: translation('command.cwl.roster.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'round',
        description: command.cwl.round.description,
        description_localizations: translation('command.cwl.round.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: command.cwl.round.options.season.description,
            description_localizations: translation('command.cwl.round.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'lineup',
        description: command.cwl.lineup.description,
        description_localizations: translation('command.cwl.lineup.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'stars',
        description: command.cwl.stars.description,
        description_localizations: translation('command.cwl.stars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: command.cwl.round.options.season.description,
            description_localizations: translation('command.cwl.round.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'attacks',
        description: command.cwl.attacks.description,
        description_localizations: translation('command.cwl.attacks.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: command.cwl.round.options.season.description,
            description_localizations: translation('command.cwl.round.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'stats',
        description: command.cwl.stats.description,
        description_localizations: translation('command.cwl.stats.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: command.cwl.round.options.season.description,
            description_localizations: translation('command.cwl.round.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      },
      {
        name: 'members',
        description: command.cwl.members.description,
        description_localizations: translation('command.cwl.members.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          }
        ]
      }
    ]
  },

  // -------------- SETUP BASED--------------
  {
    name: 'link',
    description: command.link.description,
    dm_permission: false,
    description_localizations: translation('command.link.description'),
    options: [
      {
        name: 'create',
        description: command.link.create.description,
        description_localizations: translation('command.link.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'player_tag',
            description: command.link.create.options.player_tag.description,
            description_localizations: translation('command.link.create.options.player_tag.description'),
            required: false,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'clan_tag',
            description: command.link.create.options.clan_tag.description,
            description_localizations: translation('command.link.create.options.clan_tag.description'),
            required: false,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: command.link.create.options.user.description,
            description_localizations: translation('command.link.create.options.user.description'),
            type: ApplicationCommandOptionType.User
          },
          {
            name: 'is_default',
            description: command.link.create.options.is_default.description,
            description_localizations: translation('command.link.create.options.is_default.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: 'Yes',
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: 'No',
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      {
        name: 'list',
        description: command.link.list.description,
        description_localizations: translation('command.link.list.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          }
        ]
      },
      {
        name: 'delete',
        description: command.link.delete.description,
        description_localizations: translation('command.link.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'player_tag',
            description: command.link.delete.options.player_tag.description,
            description_localizations: translation('command.link.delete.options.player_tag.description'),
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'clan_tag',
            description: command.link.delete.options.clan_tag.description,
            description_localizations: translation('command.link.delete.options.clan_tag.description'),
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      }
    ]
  },
  {
    name: 'timezone',
    description: command.timezone.description,
    description_localizations: translation('command.timezone.description'),
    dm_permission: false,
    options: [
      {
        name: 'location',
        description: command.timezone.options.location.description,
        description_localizations: translation('command.timezone.options.location.description'),
        type: ApplicationCommandOptionType.String,
        // autocomplete: true,
        required: true
      }
    ]
  },
  {
    name: 'flag',
    description: command.flag.description,
    dm_permission: false,
    description_localizations: translation('command.flag.description'),
    options: [
      {
        name: 'create',
        description: command.flag.create.description,
        description_localizations: translation('command.flag.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'flag_type',
            description: command.flag.options.flag_type.description,
            description_localizations: translation('command.flag.options.flag_type.description'),
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.flag.ban,
                name_localizations: translation('common.choices.flag.ban'),
                value: 'ban'
              },
              {
                name: common.choices.flag.strike,
                name_localizations: translation('common.choices.flag.strike'),
                value: 'strike'
              }
            ]
          },
          {
            name: 'player',
            description: command.flag.create.options.tag.description,
            description_localizations: translation('command.flag.create.options.tag.description'),
            required: true,
            max_length: 256,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'reason',
            description: command.flag.create.options.reason.description,
            description_localizations: translation('command.flag.create.options.reason.description'),
            required: true,
            max_length: 256,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'flag_expiry_days',
            description: command.flag.create.options.flag_expiry_days.description,
            description_localizations: translation('command.flag.create.options.flag_expiry_days.description'),
            type: ApplicationCommandOptionType.Integer,
            max_value: 100 * 365,
            min_value: 1
          },
          {
            name: 'flag_impact',
            description: command.flag.create.options.flag_impact.description,
            description_localizations: translation('command.flag.create.options.flag_impact.description'),
            type: ApplicationCommandOptionType.Integer,
            max_value: 100,
            min_value: 1
          }
        ]
      },
      {
        name: 'list',
        description: command.flag.list.description,
        description_localizations: translation('command.flag.list.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'flag_type',
            description: command.flag.options.flag_type.description,
            description_localizations: translation('command.flag.options.flag_type.description'),
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: common.choices.flag.ban,
                name_localizations: translation('common.choices.flag.ban'),
                value: 'ban'
              },
              {
                name: common.choices.flag.strike,
                name_localizations: translation('common.choices.flag.strike'),
                value: 'strike'
              }
            ]
          },
          {
            name: 'player',
            description: command.flag.list.options.player.description,
            description_localizations: translation('command.flag.list.options.player.description'),
            autocomplete: true,
            max_length: 100,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'clans',
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'delete',
        description: command.flag.delete.description,
        description_localizations: translation('command.flag.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'flag_type',
            description: command.flag.options.flag_type.description,
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: common.choices.flag.ban,
                name_localizations: translation('common.choices.flag.ban'),
                value: 'ban'
              },
              {
                name: common.choices.flag.strike,
                name_localizations: translation('common.choices.flag.strike'),
                value: 'strike'
              }
            ]
          },
          {
            name: 'player',
            description: command.flag.delete.options.tag.description,
            description_localizations: translation('command.flag.delete.options.tag.description'),
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
          },
          {
            name: 'flag_ref',
            description: command.flag.delete.options.flag_ref.description,
            description_localizations: translation('command.flag.delete.options.flag_ref.description'),
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
          },
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          }
        ]
      }
    ]
  },
  {
    name: 'setup',
    description: command.setup.description,
    description_localizations: translation('command.setup.description'),
    dm_permission: false,
    options: [
      // enable
      {
        name: 'enable',
        description: command.setup.enable.description,
        description_localizations: translation('command.setup.enable.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            description: common.select_an_option,
            description_localizations: translation('common.select_an_option'),
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
              {
                name: common.choices.setup.server_link,
                name_localizations: translation('common.choices.setup.server_link'),
                value: 'link-clan'
              },
              {
                name: common.choices.setup.channel_link,
                name_localizations: translation('common.choices.setup.channel_link'),
                value: 'link-channel'
              },
              {
                name: common.choices.setup.logs_or_feed,
                name_localizations: translation('common.choices.setup.logs_or_feed'),
                value: 'enable-logs'
              },
              {
                name: common.choices.setup.war_feed,
                name_localizations: translation('common.choices.setup.war_feed'),
                value: 'war-feed'
              },
              {
                name: common.choices.setup.last_seen,
                name_localizations: translation('common.choices.setup.last_seen'),
                value: 'last-seen'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              },
              {
                name: common.choices.setup.legend_log,
                name_localizations: translation('common.choices.setup.legend_log'),
                value: 'legend-log'
              },
              {
                name: common.choices.setup.capital_log,
                name_localizations: translation('common.choices.setup.capital_log'),
                value: 'capital-log'
              },
              {
                name: common.choices.setup.clan_feed,
                name_localizations: translation('common.choices.setup.clan_feed'),
                value: 'clan-feed'
              },
              {
                name: common.choices.setup.join_leave,
                name_localizations: translation('common.choices.setup.join_leave'),
                value: 'join-leave'
              },
              {
                name: common.choices.setup.clan_embed,
                name_localizations: translation('common.choices.setup.clan_embed'),
                value: 'clan-embed'
              },
              {
                name: common.choices.setup.donation_log,
                name_localizations: translation('common.choices.setup.donation_log'),
                value: 'donation-log'
              }
            ]
          },
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'category',
            description: command.setup.enable.options.category.description,
            description_localizations: translation('command.setup.enable.options.category.description'),
            type: ApplicationCommandOptionType.String,
            max_length: 36,
            autocomplete: true
          },
          {
            name: 'channel',
            description: command.setup.enable.options.channel.description,
            description_localizations: translation('command.setup.enable.options.channel.description'),
            type: ApplicationCommandOptionType.Channel,
            channel_types: ChannelTypes
          },
          {
            name: 'color',
            name_localizations: {
              'en-GB': 'colour'
            },
            description: command.setup.enable.options.color.description,
            description_localizations: translation('command.setup.enable.options.color.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'ping_role',
            description: '[DEPRECATED] Ping this role in the logs (only for town hall upgrade log)',
            type: ApplicationCommandOptionType.Role
          }
        ]
      },
      // list
      {
        name: 'list',
        description: command.setup.list.description,
        description_localizations: translation('command.setup.list.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: command.setup.list.options.clans.description,
            description_localizations: translation('command.setup.list.options.clans.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          }
        ]
      },
      // utility
      {
        name: 'utility',
        description: command.setup.utils.description,
        description_localizations: translation('command.setup.utils.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'option',
            required: true,
            description: common.select_an_option,
            description_localizations: translation('common.select_an_option'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.link_button,
                name_localizations: translation('common.choices.link_button'),
                value: 'link-button'
              },
              {
                name: common.choices.role_refresh_button,
                name_localizations: translation('common.choices.role_refresh_button'),
                value: 'role-refresh-button'
              },
              {
                name: common.choices.events_schedular,
                name_localizations: translation('common.choices.events_schedular'),
                value: 'events-schedular'
              },
              {
                name: common.choices.flag_alert_log,
                name_localizations: translation('common.choices.flag_alert_log'),
                value: 'flag-alert-log'
              },
              {
                name: common.choices.roster_change_log,
                name_localizations: translation('common.choices.roster_change_log'),
                value: 'roster-changelog'
              },
              {
                name: common.choices.reminder_ping_exclusion,
                name_localizations: translation('common.choices.reminder_ping_exclusion'),
                value: 'reminder-ping-exclusion'
              },
              {
                name: common.choices.maintenance_break_log,
                name_localizations: translation('common.choices.maintenance_break_log'),
                value: 'maintenance-break-log'
              }
            ]
          },
          {
            name: 'disable',
            description: command.setup.utils.options.disable.description,
            description_localizations: translation('command.setup.utils.options.disable.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      // buttons
      {
        name: 'buttons',
        description: command.setup.buttons.description,
        description_localizations: translation('command.setup.buttons.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'button_type',
            required: true,
            description: command.setup.buttons.options.button_type.description,
            description_localizations: translation('command.setup.buttons.options.button_type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.link_button,
                name_localizations: translation('common.choices.link_button'),
                value: 'link-button'
              },
              {
                name: common.choices.role_refresh_button,
                name_localizations: translation('common.choices.role_refresh_button'),
                value: 'role-refresh-button'
              }
            ]
          },
          {
            name: 'embed_color',
            description: command.setup.buttons.options.embed_color.description,
            description_localizations: translation('command.setup.buttons.options.embed_color.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      // events
      {
        name: 'events',
        description: command.setup.events.description,
        description_localizations: translation('command.setup.events.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'disable',
            description: command.setup.events.options.disable.description,
            description_localizations: translation('command.setup.events.options.disable.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      // server-logs
      {
        name: 'server-logs',
        description: command.setup.server_logs.description,
        description_localizations: translation('command.setup.server_logs.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'log_type',
            required: true,
            description: command.setup.server_logs.options.log_type.description,
            description_localizations: translation('command.setup.server_logs.options.log_type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.flag_alert_log,
                name_localizations: translation('common.choices.flag_alert_log'),
                value: 'flag-alert-log'
              },
              {
                name: common.choices.roster_change_log,
                name_localizations: translation('common.choices.roster_change_log'),
                value: 'roster-changelog'
              },
              {
                name: common.choices.maintenance_break_log,
                name_localizations: translation('common.choices.maintenance_break_log'),
                value: 'maintenance-break-log'
              }
            ]
          },
          {
            name: 'disable',
            description: command.setup.server_logs.options.disable.description,
            description_localizations: translation('command.setup.server_logs.options.disable.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      // clan-logs
      {
        name: 'clan-logs',
        description: command.setup.clan_logs.description,
        description_localizations: translation('command.setup.clan_logs.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: command.setup.clan_logs.options.clan.description,
            description_localizations: translation('command.setup.clan_logs.options.clan.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'action',
            description: command.setup.clan_logs.options.action.description,
            description_localizations: translation('command.setup.clan_logs.options.action.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
              {
                name: common.choices.enable,
                name_localizations: translation('common.choices.enable'),
                value: 'enable-logs'
              },
              {
                name: common.choices.disable,
                name_localizations: translation('common.choices.disable'),
                value: 'disable-logs'
              }
            ]
          },
          {
            name: 'channel',
            description: command.setup.enable.options.channel.description,
            description_localizations: translation('command.setup.enable.options.channel.description'),
            type: ApplicationCommandOptionType.Channel,
            channel_types: ChannelTypes
          },
          {
            name: 'color',
            name_localizations: {
              'en-GB': 'colour'
            },
            description: command.setup.enable.options.color.description,
            description_localizations: translation('command.setup.enable.options.color.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'ping_role',
            description: '[DEPRECATED] Ping this role in the logs (only for town hall upgrade log)',
            type: ApplicationCommandOptionType.Role
          }
        ]
      },
      // disable
      {
        name: 'disable',
        description: command.setup.disable.description,
        description_localizations: translation('command.setup.disable.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'action',
            required: true,
            description: common.select_an_option,
            description_localizations: translation('common.select_an_option'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.setup.channel_link,
                name_localizations: translation('common.choices.setup.channel_link'),
                value: 'unlink-channel'
              },
              {
                name: common.choices.setup.delete_clan,
                name_localizations: translation('common.choices.setup.delete_clan'),
                value: 'delete-clan'
              },
              {
                name: common.choices.setup.logs_or_feed,
                name_localizations: translation('common.choices.setup.logs_or_feed'),
                value: 'disable-logs'
              },
              {
                name: common.choices.setup.war_feed,
                name_localizations: translation('common.choices.setup.war_feed'),
                value: 'war-feed'
              },
              {
                name: common.choices.setup.last_seen,
                name_localizations: translation('common.choices.setup.last_seen'),
                value: 'last-seen'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              },
              {
                name: common.choices.setup.legend_log,
                name_localizations: translation('common.choices.setup.legend_log'),
                value: 'legend-log'
              },
              {
                name: common.choices.setup.capital_log,
                name_localizations: translation('common.choices.setup.capital_log'),
                value: 'capital-log'
              },
              {
                name: common.choices.setup.clan_feed,
                name_localizations: translation('common.choices.setup.clan_feed'),
                value: 'clan-feed'
              },
              {
                name: common.choices.setup.join_leave,
                name_localizations: translation('common.choices.setup.join_leave'),
                value: 'join-leave'
              },
              {
                name: common.choices.setup.clan_embed,
                name_localizations: translation('common.choices.setup.clan_embed'),
                value: 'clan-embed'
              },
              {
                name: common.choices.setup.donation_log,
                name_localizations: translation('common.choices.setup.donation_log'),
                value: 'donation-log'
              }
            ]
          },
          {
            name: 'clan',
            autocomplete: true,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: 'channel',
            description: command.setup.disable.options.channel.description,
            channel_types: ChannelTypes,
            description_localizations: translation('command.setup.disable.options.channel.description'),
            type: ApplicationCommandOptionType.Channel
          }
        ]
      }
    ]
  },
  {
    name: 'alias',
    description: command.alias.description,
    dm_permission: false,
    description_localizations: translation('command.alias.description'),
    options: [
      {
        name: 'create',
        description: command.alias.create.description,
        description_localizations: translation('command.alias.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'alias_name',
            required: false,
            max_length: 15,
            description: command.alias.create.options.alias_name.description,
            description_localizations: translation('command.alias.create.options.alias_name.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'clan_nickname',
            required: false,
            max_length: 15,
            description: command.alias.create.options.clan_nickname.description,
            description_localizations: translation('command.alias.create.options.clan_nickname.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'list',
        description: command.alias.list.description,
        description_localizations: translation('command.alias.list.description'),
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'delete',
        description: command.alias.delete.description,
        description_localizations: translation('command.alias.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'alias',
            description: command.alias.delete.options.name.description,
            description_localizations: translation('command.alias.delete.options.name.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      }
    ]
  },
  {
    name: 'category',
    description: command.category.description,
    description_localizations: translation('command.category.description'),
    dm_permission: false,
    options: [
      {
        name: 'create',
        description: command.category.create.description,
        description_localizations: translation('command.category.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'category_name',
            max_length: 36,
            description: command.category.options.category_name.description,
            description_localizations: translation('command.category.options.category_name.description'),
            required: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'list',
        description: command.category.list.description,
        description_localizations: translation('command.category.list.description'),
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'edit',
        description: command.category.edit.description,
        description_localizations: translation('command.category.edit.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'category',
            description: command.category.options.category.description,
            description_localizations: translation('command.category.options.category.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'category_name',
            max_length: 36,
            description: command.category.options.category_name.description,
            description_localizations: translation('command.category.options.category_name.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'delete',
        description: command.category.delete.description,
        description_localizations: translation('command.category.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'category',
            description: command.category.options.category.description,
            description_localizations: translation('command.category.options.category.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      }
    ]
  },
  {
    name: 'roster',
    description: command.roster.description,
    description_localizations: translation('command.roster.description'),
    dm_permission: false,
    options: [
      {
        name: 'create',
        description: command.roster.create.description,
        description_localizations: translation('command.roster.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clan',
            description: command.roster.create.options.clan.description,
            description_localizations: translation('command.roster.create.options.clan.description'),
            autocomplete: true,
            required: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'name',
            description: command.roster.create.options.name.description,
            description_localizations: translation('command.roster.create.options.name.description'),
            required: true,
            max_length: 30,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'category',
            description: command.roster.create.options.category.description,
            description_localizations: translation('command.roster.create.options.category.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'CWL'
              },
              {
                name: common.choices.war,
                name_localizations: translation('common.choices.war'),
                value: 'WAR'
              },
              {
                name: common.choices.e_sports,
                name_localizations: translation('common.choices.e_sports'),
                value: 'ESPORTS'
              },
              {
                name: common.choices.trophy,
                name_localizations: translation('common.choices.trophy'),
                value: 'TROPHY'
              }
            ]
          },
          {
            name: 'import_members',
            description: command.roster.create.options.import_members.description,
            description_localizations: translation('command.roster.create.options.import_members.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'allow_unlinked',
            description: command.roster.create.options.allow_unlinked.description,
            description_localizations: translation('command.roster.create.options.allow_unlinked.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'max_members',
            min_value: 5,
            max_value: 500,
            description: command.roster.create.options.max_members.description,
            description_localizations: translation('command.roster.create.options.max_members.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'max_accounts_per_user',
            min_value: 1,
            max_value: 75,
            description: command.roster.create.options.max_accounts_per_user.description,
            description_localizations: translation('command.roster.create.options.max_accounts_per_user.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'min_town_hall',
            description: command.roster.create.options.min_town_hall.description,
            description_localizations: translation('command.roster.create.options.min_town_hall.description'),
            type: ApplicationCommandOptionType.Integer,
            min_value: 2,
            max_value: MAX_TOWN_HALL_LEVEL
          },
          {
            name: 'max_town_hall',
            description: command.roster.create.options.max_town_hall.description,
            description_localizations: translation('command.roster.create.options.max_town_hall.description'),
            type: ApplicationCommandOptionType.Integer,
            min_value: 2,
            max_value: MAX_TOWN_HALL_LEVEL
          },
          {
            name: 'min_hero_level',
            min_value: 0,
            description: command.roster.create.options.min_hero_level.description,
            description_localizations: translation('command.roster.create.options.min_hero_level.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'roster_role',
            description: command.roster.create.options.roster_role.description,
            description_localizations: translation('command.roster.create.options.roster_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'sort_by',
            description: command.roster.create.options.sort_by.description,
            description_localizations: translation('command.roster.create.options.sort_by.description'),
            type: ApplicationCommandOptionType.String,
            choices: [...RosterCommandSortOptions]
          },
          {
            name: 'start_time',
            description: command.roster.create.options.start_time.description,
            description_localizations: translation('command.roster.create.options.start_time.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'end_time',
            description: command.roster.create.options.end_time.description,
            description_localizations: translation('command.roster.create.options.end_time.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'timezone',
            autocomplete: true,
            description: command.roster.create.options.timezone.description,
            description_localizations: translation('command.roster.create.options.timezone.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'allow_group_selection',
            description: command.roster.create.options.allow_group_selection.description,
            description_localizations: translation('command.roster.create.options.allow_group_selection.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'allow_multi_signup',
            description: command.roster.create.options.allow_multi_signup.description,
            description_localizations: translation('command.roster.create.options.allow_multi_signup.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'use_clan_alias',
            description: command.roster.create.options.use_clan_alias.description,
            description_localizations: translation('command.roster.create.options.use_clan_alias.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'roster_image_url',
            description: command.roster.create.options.roster_image_url.description,
            description_localizations: translation('command.roster.create.options.roster_image_url.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'color_code',
            description: command.roster.create.options.color_code.description,
            description_localizations: translation('command.roster.create.options.color_code.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'post',
        description: command.roster.post.description,
        description_localizations: translation('command.roster.post.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            autocomplete: true,
            required: true,
            description: command.roster.post.options.roster.description,
            description_localizations: translation('command.roster.post.options.roster.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'clone',
        description: command.roster.clone.description,
        description_localizations: translation('command.roster.clone.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            autocomplete: true,
            required: true,
            description: command.roster.clone.options.roster.description,
            description_localizations: translation('command.roster.clone.options.roster.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'name',
            description: command.roster.clone.options.name.description,
            description_localizations: translation('command.roster.clone.options.name.description'),
            max_length: 30,
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'list',
        description: command.roster.list.description,
        description_localizations: translation('command.roster.list.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: command.roster.list.options.name.description,
            description_localizations: translation('command.roster.list.options.name.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: command.roster.list.options.user.description,
            description_localizations: translation('command.roster.list.options.user.description'),
            type: ApplicationCommandOptionType.User
          },
          {
            name: 'player',
            description: command.roster.list.options.player.description,
            description_localizations: translation('command.roster.list.options.player.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          },
          {
            name: 'clan',
            description: command.roster.list.options.clan.description,
            description_localizations: translation('command.roster.list.options.clan.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          }
        ]
      },
      {
        name: 'edit',
        description: command.roster.edit.description,
        description_localizations: translation('command.roster.edit.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            description: command.roster.edit.options.roster.description,
            description_localizations: translation('command.roster.edit.options.roster.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'name',
            description: command.roster.create.options.name.description,
            description_localizations: translation('command.roster.create.options.name.description'),
            max_length: 30,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'category',
            description: command.roster.create.options.category.description,
            description_localizations: translation('command.roster.create.options.category.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'CWL'
              },
              {
                name: common.choices.war,
                name_localizations: translation('common.choices.war'),
                value: 'WAR'
              },
              {
                name: common.choices.e_sports,
                name_localizations: translation('common.choices.e_sports'),
                value: 'ESPORTS'
              },
              {
                name: common.choices.trophy,
                name_localizations: translation('common.choices.trophy'),
                value: 'TROPHY'
              }
            ]
          },
          {
            name: 'clan',
            description: command.roster.create.options.clan.description,
            description_localizations: translation('command.roster.create.options.clan.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'detach_clan',
            description: command.roster.edit.options.detach_clan.description,
            description_localizations: translation('command.roster.edit.options.detach_clan.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'allow_unlinked',
            description: command.roster.create.options.allow_unlinked.description,
            description_localizations: translation('command.roster.create.options.allow_unlinked.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'max_members',
            description: command.roster.create.options.max_members.description,
            description_localizations: translation('command.roster.create.options.max_members.description'),
            min_value: 5,
            max_value: 500,
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'max_accounts_per_user',
            min_value: 1,
            max_value: 75,
            description: command.roster.create.options.max_accounts_per_user.description,
            description_localizations: translation('command.roster.create.options.max_accounts_per_user.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'min_town_hall',
            max_value: MAX_TOWN_HALL_LEVEL,
            min_value: 2,
            description: command.roster.create.options.min_town_hall.description,
            description_localizations: translation('command.roster.create.options.min_town_hall.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'max_town_hall',
            description: command.roster.create.options.max_town_hall.description,
            description_localizations: translation('command.roster.create.options.max_town_hall.description'),
            type: ApplicationCommandOptionType.Integer,
            min_value: 2,
            max_value: MAX_TOWN_HALL_LEVEL
          },
          {
            name: 'min_hero_level',
            min_value: 0,
            description: command.roster.create.options.min_hero_level.description,
            description_localizations: translation('command.roster.create.options.min_hero_level.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'roster_role',
            description: command.roster.create.options.roster_role.description,
            description_localizations: translation('command.roster.create.options.roster_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'sort_by',
            description: command.roster.create.options.sort_by.description,
            description_localizations: translation('command.roster.create.options.sort_by.description'),
            type: ApplicationCommandOptionType.String,
            choices: [...RosterCommandSortOptions]
          },
          {
            name: 'delete_role',
            description: command.roster.edit.options.delete_role.description,
            description_localizations: translation('command.roster.edit.options.delete_role.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'start_time',
            description: command.roster.create.options.start_time.description,
            description_localizations: translation('command.roster.create.options.start_time.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'end_time',
            description: command.roster.create.options.end_time.description,
            description_localizations: translation('command.roster.create.options.end_time.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'timezone',
            autocomplete: true,
            description: command.roster.create.options.timezone.description,
            description_localizations: translation('command.roster.create.options.timezone.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'allow_group_selection',
            description: command.roster.create.options.allow_group_selection.description,
            description_localizations: translation('command.roster.create.options.allow_group_selection.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'allow_multi_signup',
            description: command.roster.create.options.allow_multi_signup.description,
            description_localizations: translation('command.roster.create.options.allow_multi_signup.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'use_clan_alias',
            description: command.roster.create.options.use_clan_alias.description,
            description_localizations: translation('command.roster.create.options.use_clan_alias.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'roster_image_url',
            description: command.roster.create.options.roster_image_url.description,
            description_localizations: translation('command.roster.create.options.roster_image_url.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'color_code',
            description: command.roster.create.options.color_code.description,
            description_localizations: translation('command.roster.create.options.color_code.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'log_channel',
            description: command.roster.edit.options.log_channel.description,
            description_localizations: translation('command.roster.edit.options.log_channel.description'),
            type: ApplicationCommandOptionType.Channel,
            channel_types: ChannelTypes
          }
        ]
      },
      {
        name: 'delete',
        description: command.roster.delete.description,
        description_localizations: translation('command.roster.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            description: command.roster.delete.options.roster.description,
            description_localizations: translation('command.roster.delete.options.roster.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'manage',
        description: command.roster.manage.description,
        description_localizations: translation('command.roster.manage.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            description: command.roster.manage.options.roster.description,
            description_localizations: translation('command.roster.manage.options.roster.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'action',
            description: command.roster.manage.options.action.description,
            description_localizations: translation('command.roster.manage.options.action.description'),
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.roster.add_players,
                name_localizations: translation('common.choices.roster.add_players'),
                value: RosterManageActions.ADD_USER
              },
              {
                name: common.choices.roster.remove_players,
                name_localizations: translation('common.choices.roster.remove_players'),
                value: RosterManageActions.DEL_USER
              },
              {
                name: common.choices.roster.change_roster,
                name_localizations: translation('common.choices.roster.change_roster'),
                value: RosterManageActions.CHANGE_ROSTER
              },
              {
                name: common.choices.roster.change_group,
                name_localizations: translation('common.choices.roster.change_group'),
                value: RosterManageActions.CHANGE_CATEGORY
              }
            ]
          },
          {
            name: 'player',
            autocomplete: true,
            description: command.roster.manage.options.player.description,
            description_localizations: translation('command.roster.manage.options.player.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'user',
            description: command.roster.manage.options.user.description,
            description_localizations: translation('command.roster.manage.options.user.description'),
            type: ApplicationCommandOptionType.User
          },
          {
            name: 'from_clan',
            autocomplete: true,
            description: command.roster.manage.options.from_clan.description,
            description_localizations: translation('command.roster.manage.options.from_clan.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'from_current_wars',
            autocomplete: true,
            description: command.roster.manage.options.from_current_wars.description,
            description_localizations: translation('command.roster.manage.options.from_current_wars.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'target_group',
            autocomplete: true,
            description: command.roster.manage.options.target_group.description,
            description_localizations: translation('command.roster.manage.options.target_group.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'target_roster',
            autocomplete: true,
            description: command.roster.manage.options.target_roster.description,
            description_localizations: translation('command.roster.manage.options.target_roster.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'groups',
        description: command.roster.groups.description,
        description_localizations: translation('command.roster.groups.description'),
        type: ApplicationCommandOptionType.SubcommandGroup,
        options: [
          {
            name: 'create',
            description: command.roster.groups.create.description,
            description_localizations: translation('command.roster.groups.create.description'),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'name',
                description: command.roster.groups.options.name.description,
                description_localizations: translation('command.roster.groups.options.name.description'),
                required: true,
                max_length: 30,
                type: ApplicationCommandOptionType.String
              },
              {
                name: 'group_role',
                description: command.roster.groups.options.group_role.description,
                description_localizations: translation('command.roster.groups.options.group_role.description'),
                type: ApplicationCommandOptionType.Role
              },
              {
                name: 'selectable',
                description: command.roster.groups.options.selectable.description,
                description_localizations: translation('command.roster.groups.options.selectable.description'),
                type: ApplicationCommandOptionType.Boolean
              }
            ]
          },
          {
            name: 'modify',
            description: command.roster.groups.modify.description,
            description_localizations: translation('command.roster.groups.modify.description'),
            type: ApplicationCommandOptionType.Subcommand,
            options: [
              {
                name: 'group',
                autocomplete: true,
                required: true,
                description: command.roster.groups.options.group.description,
                description_localizations: translation('command.roster.groups.options.group.description'),
                type: ApplicationCommandOptionType.String
              },
              {
                name: 'name',
                description: command.roster.groups.options.name.description,
                description_localizations: translation('command.roster.groups.options.name.description'),
                max_length: 30,
                type: ApplicationCommandOptionType.String
              },
              {
                name: 'order',
                description: command.roster.groups.options.order.description,
                description_localizations: translation('command.roster.groups.options.order.description'),
                type: ApplicationCommandOptionType.Integer,
                max_value: 1000,
                min_value: 1
              },
              {
                name: 'group_role',
                description: command.roster.groups.options.group_role.description,
                description_localizations: translation('command.roster.groups.options.group_role.description'),
                type: ApplicationCommandOptionType.Role
              },
              {
                name: 'selectable',
                description: command.roster.groups.options.selectable.description,
                description_localizations: translation('command.roster.groups.options.selectable.description'),
                type: ApplicationCommandOptionType.Boolean
              },
              {
                name: 'delete_role',
                description: command.roster.groups.options.delete_role.description,
                description_localizations: translation('command.roster.groups.options.delete_role.description'),
                type: ApplicationCommandOptionType.Boolean
              },
              {
                name: 'delete_group',
                description: command.roster.groups.options.delete_group.description,
                description_localizations: translation('command.roster.groups.options.delete_group.description'),
                type: ApplicationCommandOptionType.Boolean
              }
            ]
          }
        ]
      },
      {
        name: 'ping',
        description: command.roster.ping.description,
        description_localizations: translation('command.roster.ping.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'roster',
            description: command.roster.ping.options.roster.description,
            description_localizations: translation('command.roster.ping.options.roster.description'),
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'message',
            description: command.roster.ping.options.message.description,
            description_localizations: translation('command.roster.ping.options.message.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'ping_option',
            description: command.roster.ping.options.ping_option.description,
            description_localizations: translation('command.roster.ping.options.ping_option.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.roster.ping_unregistered,
                name_localizations: translation('common.choices.roster.ping_unregistered'),
                value: 'unregistered'
              },
              {
                name: common.choices.roster.ping_missing,
                name_localizations: translation('common.choices.roster.ping_missing'),
                value: 'missing'
              },
              {
                name: common.choices.roster.ping_everyone,
                name_localizations: translation('common.choices.roster.ping_everyone'),
                value: 'everyone'
              }
            ]
          },
          {
            name: 'group',
            description: command.roster.ping.options.group.description,
            description_localizations: translation('command.roster.ping.options.group.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      }
    ]
  },
  {
    name: 'autorole',
    description: command.autorole.description,
    description_localizations: translation('command.autorole.description'),
    dm_permission: false,
    options: [
      {
        name: 'clan-roles',
        description: command.autorole.clan_roles.description,
        description_localizations: translation('command.autorole.clan_roles.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: true,
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'leader_role',
            required: false,
            description: command.autorole.clan_roles.options.leader.description,
            description_localizations: translation('command.autorole.clan_roles.options.leader.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'co_leader_role',
            required: false,
            description: command.autorole.clan_roles.options.co_lead.description,
            description_localizations: translation('command.autorole.clan_roles.options.co_lead.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'elder_role',
            required: false,
            description: command.autorole.clan_roles.options.elder.description,
            description_localizations: translation('command.autorole.clan_roles.options.elder.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'member_role',
            required: false,
            description: command.autorole.clan_roles.options.member.description,
            description_localizations: translation('command.autorole.clan_roles.options.member.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'everyone_role',
            required: false,
            description: command.autorole.clan_roles.options.common_role.description,
            description_localizations: translation('command.autorole.clan_roles.options.common_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'only_verified',
            required: false,
            description: command.autorole.clan_roles.options.only_verified.description,
            description_localizations: translation('command.autorole.clan_roles.options.only_verified.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      {
        name: 'town-hall',
        description: command.autorole.town_hall.description,
        description_localizations: translation('command.autorole.town_hall.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          ...TOWN_HALL_LEVELS_FOR_ROLES.map(
            (hall) =>
              ({
                name: `th_${hall}`,
                description: `Town Hall ${hall} role.`,
                type: ApplicationCommandOptionType.Role
              }) satisfies APIApplicationCommandBasicOption
          ),
          {
            name: 'allow_non_family_accounts',
            description: command.autorole.town_hall.options.allow_non_family_accounts.description,
            description_localizations: translation('command.autorole.town_hall.options.allow_non_family_accounts.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      {
        name: 'builder-hall',
        description: command.autorole.builder_hall.description,
        description_localizations: translation('command.autorole.builder_hall.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          ...BUILDER_HALL_LEVELS_FOR_ROLES.map(
            (hall) =>
              ({
                name: `bh_${hall}`,
                description: `Builder Hall ${hall} role.`,
                type: ApplicationCommandOptionType.Role
              }) satisfies APIApplicationCommandBasicOption
          )
        ]
      },
      {
        name: 'leagues',
        description: command.autorole.leagues.description,
        description_localizations: translation('command.autorole.leagues.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          ...PLAYER_LEAGUE_NAMES.map(
            (league) =>
              ({
                name: league,
                description: `${title(league)} league role.`,
                type: ApplicationCommandOptionType.Role
              }) satisfies APIApplicationCommandBasicOption
          ),
          {
            name: 'allow_non_family_accounts',
            description: command.autorole.town_hall.options.allow_non_family_accounts.description,
            description_localizations: translation('command.autorole.town_hall.options.allow_non_family_accounts.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      },
      {
        name: 'builder-leagues',
        description: command.autorole.builder_leagues.description,
        description_localizations: translation('command.autorole.builder_leagues.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          ...BUILDER_BASE_LEAGUE_NAMES.map(
            (league) =>
              ({
                name: league,
                description: `${title(league)} league role.`,
                type: ApplicationCommandOptionType.Role
              }) satisfies APIApplicationCommandBasicOption
          )
        ]
      },
      {
        name: 'wars',
        description: command.autorole.wars.description,
        description_localizations: translation('command.autorole.wars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            required: true,
            description: command.autorole.wars.options.role.description,
            description_localizations: translation('command.autorole.wars.options.role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'clan',
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: command.autorole.wars.options.clan.description,
            description_localizations: translation('command.autorole.wars.options.clan.description')
          }
        ]
      },
      {
        name: 'eos-push',
        description: command.autorole.eos_push.description,
        description_localizations: translation('command.autorole.eos_push.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            required: true,
            description: command.autorole.eos_push.options.role.description,
            description_localizations: translation('command.autorole.eos_push.options.role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'clans',
            required: true,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: command.autorole.eos_push.options.clans.description,
            description_localizations: translation('command.autorole.eos_push.options.clans.description')
          }
        ]
      },
      {
        name: 'family',
        description: command.autorole.family.description,
        description_localizations: translation('command.autorole.family.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'family_leaders_role',
            description: command.autorole.family.options.family_leaders_role.description,
            description_localizations: translation('command.autorole.family.options.family_leaders_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'family_role',
            description: command.autorole.family.options.family_role.description,
            description_localizations: translation('command.autorole.family.options.family_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'exclusive_family_role',
            description: command.autorole.family.options.exclusive_family_role.description,
            description_localizations: translation('command.autorole.family.options.exclusive_family_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'guest_role',
            description: command.autorole.family.options.guest_role.description,
            description_localizations: translation('command.autorole.family.options.guest_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'verified_role',
            description: command.autorole.family.options.verified_role.description,
            description_localizations: translation('command.autorole.family.options.verified_role.description'),
            type: ApplicationCommandOptionType.Role
          },
          {
            name: 'account_linked_role',
            description: command.autorole.family.options.account_linked_role.description,
            description_localizations: translation('command.autorole.family.options.account_linked_role.description'),
            type: ApplicationCommandOptionType.Role
          }
        ]
      },
      {
        name: 'list',
        description: command.autorole.list.description,
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'disable',
        description: command.autorole.disable.description,
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: 'Type of roles to disable.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.autorole.clan_roles,
                name_localizations: translation('common.choices.autorole.clan_roles'),
                value: 'clan-roles'
              },
              {
                name: common.choices.autorole.town_hall,
                name_localizations: translation('common.choices.autorole.town_hall'),
                value: 'town-hall'
              },
              {
                name: common.choices.autorole.leagues,
                name_localizations: translation('common.choices.autorole.leagues'),
                value: 'leagues'
              },
              {
                name: common.choices.autorole.builder_hall,
                name_localizations: translation('common.choices.autorole.builder_hall'),
                value: 'builder-hall'
              },
              {
                name: common.choices.autorole.builder_leagues,
                name_localizations: translation('common.choices.autorole.builder_leagues'),
                value: 'builder-leagues'
              },
              {
                name: common.choices.autorole.wars,
                name_localizations: translation('common.choices.autorole.wars'),
                value: 'wars'
              },
              {
                name: common.choices.autorole.eos_push,
                name_localizations: translation('common.choices.autorole.eos_push'),
                value: 'eos-push'
              },
              {
                name: common.choices.autorole.family_leaders,
                name_localizations: translation('common.choices.autorole.family_leaders'),
                value: 'family-leaders'
              },
              {
                name: common.choices.autorole.family,
                name_localizations: translation('common.choices.autorole.family'),
                value: 'family'
              },
              {
                name: common.choices.autorole.exclusive_family,
                name_localizations: translation('common.choices.autorole.exclusive_family'),
                value: 'exclusive-family'
              },
              {
                name: common.choices.autorole.guest,
                name_localizations: translation('common.choices.autorole.guest'),
                value: 'guest'
              },
              {
                name: common.choices.autorole.verified,
                name_localizations: translation('common.choices.autorole.verified'),
                value: 'verified'
              },
              {
                name: common.choices.autorole.account_linked,
                name_localizations: translation('common.choices.autorole.account_linked'),
                value: 'account-linked'
              }
            ]
          },
          {
            name: 'clans',
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'refresh',
        description: command.autorole.refresh.description,
        description_localizations: translation('command.autorole.refresh.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'user_or_role',
            description: command.autorole.refresh.options.user_or_role.description,
            description_localizations: translation('command.autorole.refresh.options.user_or_role.description'),
            type: ApplicationCommandOptionType.Mentionable
          },
          {
            name: 'is_test_run',
            description: command.autorole.refresh.options.is_test_run.description,
            description_localizations: translation('command.autorole.refresh.options.is_test_run.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'force_refresh',
            description: command.autorole.refresh.options.force_refresh.description,
            description_localizations: translation('command.autorole.refresh.options.force_refresh.description'),
            type: ApplicationCommandOptionType.Boolean
          }
        ]
      },
      {
        name: 'config',
        description: command.autorole.config.description,
        description_localizations: translation('command.autorole.config.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'auto_update_roles',
            description: command.autorole.config.options.auto_update_roles.description,
            description_localizations: translation('command.autorole.config.options.auto_update_roles.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          },
          {
            name: 'role_removal_delays',
            description: command.autorole.config.options.role_removal_delays.description,
            description_localizations: translation('command.autorole.config.options.role_removal_delays.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.off,
                name_localizations: translation('common.choices.off'),
                value: '0'
              },
              {
                name: '1h',
                value: '1h'
              },
              {
                name: '2h',
                value: '2h'
              },
              {
                name: '4h',
                value: '4h'
              },
              {
                name: '6h',
                value: '6h'
              },
              {
                name: '8h',
                value: '8h'
              },
              {
                name: '12h',
                value: '12h'
              },
              {
                name: '18h',
                value: '18h'
              },
              {
                name: '24h',
                value: '24h'
              },
              {
                name: '36h',
                value: '36h'
              },
              {
                name: '48h',
                value: '48h'
              },
              {
                name: '72h',
                value: '72h'
              },
              {
                name: '7d',
                value: '7d'
              },
              {
                name: '12d',
                value: '12d'
              }
            ]
          },
          {
            name: 'role_addition_delays',
            description: command.autorole.config.options.role_addition_delays.description,
            description_localizations: translation('command.autorole.config.options.role_addition_delays.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.off,
                name_localizations: translation('common.choices.off'),
                value: '0'
              },
              {
                name: '1h',
                value: '1h'
              },
              {
                name: '2h',
                value: '2h'
              },
              {
                name: '4h',
                value: '4h'
              },
              {
                name: '6h',
                value: '6h'
              },
              {
                name: '8h',
                value: '8h'
              },
              {
                name: '12h',
                value: '12h'
              },
              {
                name: '18h',
                value: '18h'
              },
              {
                name: '24h',
                value: '24h'
              }
            ]
          },
          {
            name: 'delay_exclusion_roles',
            description: command.autorole.config.options.delay_exclusion_roles.description,
            description_localizations: translation('command.autorole.config.options.delay_exclusion_roles.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: 'Town Hall Roles',
                value: 'town-hall-roles'
              },
              {
                name: 'Builder Hall Roles',
                value: 'builder-hall-roles'
              },
              {
                name: 'League Roles',
                value: 'league-roles'
              },
              {
                name: 'Builder League Roles',
                value: 'builder-league-roles'
              }
            ]
          },
          {
            name: 'always_force_refresh_roles',
            description: command.autorole.config.options.always_force_refresh_roles.description,
            description_localizations: translation('command.autorole.config.options.always_force_refresh_roles.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'allow_not_linked',
            description: command.autorole.config.options.allow_not_linked.description,
            description_localizations: translation('command.autorole.config.options.allow_not_linked.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'verified_only_clan_roles',
            description: command.autorole.config.options.verified_only_clan_roles.description,
            description_localizations: translation('command.autorole.config.options.verified_only_clan_roles.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'reminders',
    description: command.reminders.description,
    dm_permission: false,
    description_localizations: translation('command.reminders.description'),
    options: [
      {
        name: 'create',
        description: command.reminders.create.description,
        description_localizations: translation('command.reminders.create.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: command.reminders.create.options.type.description,
            description_localizations: translation('command.reminders.create.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.clan_wars,
                name_localizations: translation('common.choices.clan_wars'),
                value: 'clan-wars'
              },
              {
                name: common.choices.capital_raids,
                name_localizations: translation('common.choices.capital_raids'),
                value: 'capital-raids'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              }
            ],
            required: true
          },
          {
            name: 'duration',
            description: command.reminders.create.options.duration.description,
            description_localizations: translation('command.reminders.create.options.duration.description'),
            type: ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
          },
          {
            name: 'clans',
            required: true,
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'message',
            description: command.reminders.options.message.description,
            description_localizations: translation('command.reminders.options.message.description'),
            type: ApplicationCommandOptionType.String,
            max_length: 1800,
            required: true
          },
          {
            name: 'exclude_participant_list',
            description: command.reminders.create.options.exclude_participants.description,
            description_localizations: translation('command.reminders.create.options.exclude_participants.description'),
            type: ApplicationCommandOptionType.Boolean,
            required: false
          },
          {
            name: 'channel',
            description: command.reminders.create.options.channel.description,
            description_localizations: translation('command.reminders.create.options.channel.description'),
            type: ApplicationCommandOptionType.Channel,
            channel_types: ChannelTypes
          }
        ]
      },
      {
        name: 'edit',
        description: command.reminders.edit.description,
        description_localizations: translation('command.reminders.edit.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: command.reminders.create.options.type.description,
            description_localizations: translation('command.reminders.create.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.clan_wars,
                name_localizations: translation('common.choices.clan_wars'),
                value: 'clan-wars'
              },
              {
                name: common.choices.capital_raids,
                name_localizations: translation('common.choices.capital_raids'),
                value: 'capital-raids'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              }
            ],
            required: true
          },
          {
            name: 'id',
            required: true,
            description: command.reminders.options.reminder_id.description,
            description_localizations: translation('command.reminders.options.reminder_id.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'duration',
            description: 'Remaining duration to mention members (e.g. 6h, 12h, 1d, 2d)',
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          }
        ]
      },
      {
        name: 'list',
        description: command.reminders.list.description,
        description_localizations: translation('command.reminders.list.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            required: true,
            description: command.reminders.create.options.type.description,
            description_localizations: translation('command.reminders.create.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.clan_wars,
                name_localizations: translation('common.choices.clan_wars'),
                value: 'clan-wars'
              },
              {
                name: common.choices.capital_raids,
                name_localizations: translation('common.choices.capital_raids'),
                value: 'capital-raids'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              }
            ]
          },
          {
            name: 'compact_list',
            description: command.reminders.list.options.compact_list.description,
            description_localizations: translation('command.reminders.list.options.compact_list.description'),
            type: ApplicationCommandOptionType.Boolean
          },
          {
            name: 'clans',
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'channel',
            description: command.reminders.create.options.channel.description,
            description_localizations: translation('command.reminders.create.options.channel.description'),
            type: ApplicationCommandOptionType.Channel,
            channel_types: ChannelTypes
          },
          {
            name: 'reminder_id',
            description: command.reminders.list.options.reminder_id.description,
            description_localizations: translation('command.reminders.list.options.reminder_id.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'delete',
        description: command.reminders.delete.description,
        description_localizations: translation('command.reminders.delete.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: command.reminders.create.options.type.description,
            description_localizations: translation('command.reminders.create.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.clan_wars,
                name_localizations: translation('common.choices.clan_wars'),
                value: 'clan-wars'
              },
              {
                name: common.choices.capital_raids,
                name_localizations: translation('common.choices.capital_raids'),
                value: 'capital-raids'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              }
            ],
            required: true
          },
          {
            name: 'id',
            description: command.reminders.options.reminder_id.description,
            description_localizations: translation('command.reminders.options.reminder_id.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'now',
        description: command.reminders.now.description,
        description_localizations: translation('command.reminders.now.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'type',
            description: command.reminders.create.options.type.description,
            description_localizations: translation('command.reminders.create.options.type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.clan_wars,
                name_localizations: translation('common.choices.clan_wars'),
                value: 'clan-wars'
              },
              {
                name: common.choices.capital_raids,
                name_localizations: translation('common.choices.capital_raids'),
                value: 'capital-raids'
              },
              {
                name: common.choices.clan_games,
                name_localizations: translation('common.choices.clan_games'),
                value: 'clan-games'
              }
            ],
            required: true
          },
          {
            name: 'message',
            description: command.reminders.options.message.description,
            description_localizations: translation('command.reminders.options.message.description'),
            type: ApplicationCommandOptionType.String,
            required: true
          },
          {
            name: 'clans',
            required: true,
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'config',
        description: command.reminders.now.description,
        description_localizations: translation('command.reminders.now.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'reminder_ping_exclusion',
            description: command.reminders.config.options.reminder_ping_exclusion.description,
            description_localizations: translation('command.reminders.config.options.reminder_ping_exclusion.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.enable,
                name_localizations: translation('common.choices.enable'),
                value: 'enable'
              },
              {
                name: common.choices.disable,
                name_localizations: translation('common.choices.disable'),
                value: 'disable'
              }
            ]
          }
        ]
      }
    ]
  },

  // -------- OTHER COMMANDS--------
  {
    name: 'legend',
    dm_permission: false,
    description: command.legend.description,
    description_localizations: translation('command.legend.description'),
    options: [
      {
        name: 'attacks',
        description: command.legend.attacks.description,
        description_localizations: translation('command.legend.attacks.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
          },
          {
            name: 'user',
            description: common.options.player.user.description,
            description_localizations: translation('common.options.player.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'day',
            description: command.legend.attacks.options.day.description,
            description_localizations: translation('command.legend.attacks.options.day.description'),
            type: ApplicationCommandOptionType.Number,
            max_value: 35,
            min_value: 1,
            required: false
          }
        ]
      },
      {
        name: 'days',
        description: command.legend.days.description,
        description_localizations: translation('command.legend.days.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'player',
            description: common.options.player.user.description,
            description_localizations: translation('common.options.player.user.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            autocomplete: true
          },
          {
            name: 'user',
            description: common.options.clan.user.description,
            description_localizations: translation('common.options.clan.user.description'),
            type: ApplicationCommandOptionType.User,
            required: false
          },
          {
            name: 'day',
            description: command.legend.attacks.options.day.description,
            description_localizations: translation('command.legend.attacks.options.day.description'),
            type: ApplicationCommandOptionType.Number,
            max_value: 35,
            min_value: 1,
            required: false
          }
        ]
      },
      {
        name: 'leaderboard',
        description: command.legend.leaderboard.description,
        description_localizations: translation('command.legend.leaderboard.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            autocomplete: true,
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            type: ApplicationCommandOptionType.String,
            required: false
          },
          {
            name: 'limit',
            description: command.legend.leaderboard.options.limit.description,
            description_localizations: translation('command.legend.leaderboard.options.limit.description'),
            type: ApplicationCommandOptionType.Number,
            max_value: 100,
            min_value: 3
          },
          {
            name: 'offset',
            description: command.legend.leaderboard.options.offset.description,
            description_localizations: translation('command.legend.leaderboard.options.offset.description'),
            type: ApplicationCommandOptionType.Number,
            max_value: 100,
            min_value: 3
          },
          {
            name: 'season',
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          },
          {
            name: 'enable_auto_updating',
            description: command.legend.leaderboard.options.enable_auto_updating.description,
            description_localizations: translation('command.legend.leaderboard.options.enable_auto_updating.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.legend_leaderboard,
                name_localizations: translation('common.choices.legend_leaderboard'),
                value: 'legend-leaderboard'
              },
              {
                name: common.choices.builder_legend_leaderboard,
                name_localizations: translation('common.choices.builder_legend_leaderboard'),
                value: 'bb-legend-leaderboard'
              }
            ]
          }
        ]
      },
      {
        name: 'stats',
        description: command.legend.stats.description,
        description_localizations: translation('command.legend.stats.description'),
        type: ApplicationCommandOptionType.Subcommand
      }
    ]
  },
  {
    name: 'leaderboard',
    description: command.leaderboard.description,
    description_localizations: translation('command.leaderboard.description'),
    dm_permission: false,
    options: [
      {
        name: 'clans',
        description: command.leaderboard.clans.description,
        description_localizations: translation('command.leaderboard.clans.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: command.leaderboard.options.location.description,
            description_localizations: translation('command.leaderboard.options.location.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          },
          {
            name: 'season',
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'players',
        description: command.leaderboard.players.description,
        description_localizations: translation('command.leaderboard.players.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: command.leaderboard.options.location.description,
            description_localizations: translation('command.leaderboard.options.location.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          },
          {
            name: 'season',
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'capital',
        description: command.leaderboard.capital.description,
        description_localizations: translation('command.leaderboard.capital.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'location',
            description: command.leaderboard.options.location.description,
            description_localizations: translation('command.leaderboard.options.location.description'),
            type: ApplicationCommandOptionType.String,
            autocomplete: true
          },
          {
            name: 'season',
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          }
        ]
      }
    ]
  },
  {
    name: 'summary',
    description: command.summary.description,
    description_localizations: translation('command.summary.description'),
    dm_permission: false,
    options: [
      {
        name: 'best',
        description: command.summary.best.description,
        description_localizations: translation('command.summary.best.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'limit',
            required: false,
            type: ApplicationCommandOptionType.Integer,
            description: command.summary.best.options.limit.description,
            description_localizations: translation('command.summary.best.options.limit.description'),
            min_value: 3,
            max_value: 10
          },
          {
            name: 'order',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: command.summary.best.options.order.description,
            description_localizations: translation('command.summary.best.options.order.description'),
            choices: [
              {
                name: common.choices.desc,
                name_localizations: translation('common.choices.desc'),
                value: 'desc'
              },
              {
                name: common.choices.asc,
                name_localizations: translation('common.choices.asc'),
                value: 'asc'
              }
            ]
          }
        ]
      },
      {
        name: 'wars',
        description: command.summary.wars.description,
        description_localizations: translation('command.summary.wars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'compo',
        description: command.summary.compo.description,
        description_localizations: translation('command.summary.compo.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'cwl-ranks',
        description: command.summary.cwl_ranks.description,
        description_localizations: translation('command.summary.cwl_ranks.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'cwl-status',
        description: command.summary.cwl_status.description,
        description_localizations: translation('command.summary.cwl_status.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'leagues',
        description: command.summary.leagues.description,
        description_localizations: translation('command.summary.leagues.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'donations',
        description: command.summary.donations.description,
        description_localizations: translation('command.summary.donations.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'clans',
        description: command.summary.clans.description,
        description_localizations: translation('command.summary.clans.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      },
      {
        name: 'attacks',
        description: command.summary.attacks.description,
        description_localizations: translation('command.summary.attacks.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'trophies',
        description: command.summary.trophies.description,
        description_localizations: translation('command.summary.trophies.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'limit',
            required: false,
            type: ApplicationCommandOptionType.Integer,
            description: command.summary.trophies.options.limit.description,
            description_localizations: translation('command.summary.trophies.options.limit.description')
          }
        ]
      },
      {
        name: 'war-results',
        description: command.summary.war_results.description,
        description_localizations: translation('command.summary.war_results.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'missed-wars',
        description: command.summary.missed_wars.description,
        description_localizations: translation('command.summary.missed_wars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'war_type',
            description: 'Regular, CWL or Friendly Wars (defaults to Regular)',
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              },
              {
                name: common.choices.regular_and_cwl,
                name_localizations: translation('common.choices.regular_and_cwl'),
                value: 'regular-and-cwl'
              }
            ]
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            choices: SEASON_SINCE_CHOICES
          }
        ]
      },
      {
        name: 'capital-raids',
        description: command.summary.capital_raids.description,
        description_localizations: translation('command.summary.capital_raids.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'week',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.week.description,
            description_localizations: translation('common.options.week.description'),
            choices: getWeekIds()
          }
        ]
      },
      {
        name: 'capital-contribution',
        description: command.summary.capital_contribution.description,
        description_localizations: translation('command.summary.capital_contribution.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'week',
            description: command.summary.capital_contribution.options.week.description,
            description_localizations: translation('command.summary.capital_contribution.options.week.description'),
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: getWeekIds()
          }
        ]
      },
      {
        name: 'activity',
        description: command.summary.activity.description,
        description_localizations: translation('command.summary.activity.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          },
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'clan-games',
        description: command.summary.clan_games.description,
        description_localizations: translation('command.summary.clan_games.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'season',
            required: false,
            type: ApplicationCommandOptionType.String,
            description: common.options.season.description,
            description_localizations: translation('common.options.season.description'),
            choices: getSeasonIds()
          },
          {
            name: 'clans',
            required: false,
            autocomplete: true,
            type: ApplicationCommandOptionType.String,
            description: common.options.clan.tag.description,
            description_localizations: translation('common.options.clan.tag.description')
          }
        ]
      }
    ]
  },
  {
    name: 'export',
    description: command.export.description,
    dm_permission: false,
    description_localizations: translation('command.export.description'),
    options: [
      {
        name: 'wars',
        description: command.export.wars.description,
        description_localizations: translation('command.export.options.wars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'war_type',
            description: 'Regular, CWL or Friendly Wars (defaults to Regular)',
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              },
              {
                name: common.choices.regular_and_cwl,
                name_localizations: translation('common.choices.regular_and_cwl'),
                value: 'regular-and-cwl'
              }
            ]
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          },
          {
            name: 'limit',
            min_value: 1,
            max_value: 100,
            description: command.export.options.wars.description,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          }
        ]
      },
      {
        name: 'cwl',
        description: command.export.cwl.description,
        description_localizations: translation('command.export.cwl.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          },
          {
            name: 'wars',
            min_value: 1,
            max_value: 100,
            description: command.export.options.wars.description,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          },
          {
            name: 'lineup_only',
            description: command.export.cwl.options.lineup_only.description,
            description_localizations: translation('command.export.cwl.options.lineup_only.description'),
            type: ApplicationCommandOptionType.Boolean
          }
        ]
      },
      {
        name: 'season',
        description: command.export.season.description,
        description_localizations: translation('command.export.season.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'members',
        description: command.export.members.description,
        description_localizations: translation('command.export.members.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          }
        ]
      },
      {
        name: 'clans',
        description: command.export.clans.description,
        description_localizations: translation('command.export.clans.description'),
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'users',
        description: command.export.user.description,
        description_localizations: translation('command.export.user.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'role',
            description: command.export.user.options.role.description,
            description_localizations: translation('command.export.user.options.role.description'),
            type: ApplicationCommandOptionType.Role
          }
        ]
      },
      {
        name: 'attack-log',
        description: command.export.attack_log.description,
        description_localizations: translation('command.export.attack_log.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'war_type',
            description: command.export.wars.options.war_type.description,
            description_localizations: translation('command.export.wars.options.war_type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              }
            ]
          },
          {
            name: 'limit',
            min_value: 1,
            max_value: 100,
            description: command.export.options.wars.description,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          }
        ]
      },
      {
        name: 'missed',
        description: command.export.missed.description,
        description_localizations: translation('command.export.missed.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'war_type',
            description: 'Regular, CWL or Friendly Wars (defaults to Regular)',
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              },
              {
                name: common.choices.friendly,
                name_localizations: translation('common.choices.friendly'),
                value: 'friendly'
              },
              {
                name: common.choices.regular_and_cwl,
                name_localizations: translation('common.choices.regular_and_cwl'),
                value: 'regular-and-cwl'
              }
            ]
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: SEASON_SINCE_CHOICES
          },
          {
            name: 'limit',
            min_value: 1,
            max_value: 100,
            description: command.export.options.wars.description,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          }
        ]
      },
      {
        name: 'capital-raids',
        description: command.export.capital_raids.description,
        description_localizations: translation('command.export.capital_raids.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          },
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'limit',
            description: command.export.options.wars.description,
            max_value: 100,
            min_value: 1,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          }
        ]
      },
      {
        name: 'last-wars',
        description: command.export.last_wars.description,
        description_localizations: translation('command.export.last_wars.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'war_type',
            description: command.export.last_wars.options.war_type.description,
            description_localizations: translation('command.export.last_wars.options.war_type.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.regular,
                name_localizations: translation('common.choices.regular'),
                value: 'regular'
              },
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'cwl'
              }
            ]
          },
          {
            name: 'season',
            description: common.options.season_since.description,
            description_localizations: translation('common.options.season_since.description'),
            type: ApplicationCommandOptionType.String,
            choices: getSeasonIds()
          },
          {
            name: 'limit',
            description: command.export.options.wars.description,
            description_localizations: translation('command.export.options.wars.description'),
            type: ApplicationCommandOptionType.Integer
          }
        ]
      },
      {
        name: 'capital',
        description: command.export.capital.description,
        description_localizations: translation('command.export.capital.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'clans',
            description: common.options.clans.description,
            description_localizations: translation('common.options.clans.description'),
            autocomplete: true,
            type: ApplicationCommandOptionType.String
          }
        ]
      },
      {
        name: 'rosters',
        description: command.export.rosters.description,
        description_localizations: translation('command.export.rosters.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'category',
            description: command.export.rosters.options.category.description,
            description_localizations: translation('command.export.rosters.options.category.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.cwl,
                name_localizations: translation('common.choices.cwl'),
                value: 'CWL'
              },
              {
                name: common.choices.war,
                name_localizations: translation('common.choices.war'),
                value: 'WAR'
              },
              {
                name: common.choices.e_sports,
                name_localizations: translation('common.choices.e_sports'),
                value: 'ESPORTS'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'search',
    description: command.search.description,
    dm_permission: false,
    description_localizations: translation('command.search.description'),
    options: [
      {
        name: 'name',
        description: command.search.options.name.description,
        description_localizations: translation('command.search.options.name.description'),
        type: ApplicationCommandOptionType.String
      }
    ]
  },
  {
    name: 'army',
    description: command.army.description,
    dm_permission: false,
    description_localizations: translation('command.army.description'),
    options: [
      {
        name: 'link',
        description: command.army.options.link.description,
        description_localizations: translation('command.army.options.link.description'),
        type: ApplicationCommandOptionType.String,
        required: true
      },
      {
        name: 'army_name',
        description: command.army.options.name.description,
        description_localizations: translation('command.army.options.name.description'),
        type: ApplicationCommandOptionType.String,
        required: false
      },
      {
        name: 'equipment',
        description: command.army.options.equipment.description,
        description_localizations: translation('command.army.options.equipment.description'),
        type: ApplicationCommandOptionType.String,
        max_length: 600,
        required: false
      },
      {
        name: 'pets',
        description: command.army.options.pets.description,
        description_localizations: translation('command.army.options.pets.description'),
        type: ApplicationCommandOptionType.String,
        max_length: 600,
        required: false
      },
      {
        name: 'clan_castle',
        description: command.army.options.clan_castle.description,
        description_localizations: translation('command.army.options.clan_castle.description'),
        type: ApplicationCommandOptionType.String,
        max_length: 600,
        required: false
      },
      {
        name: 'tips',
        description: command.army.options.tips.description,
        description_localizations: translation('command.army.options.tips.description'),
        type: ApplicationCommandOptionType.String,
        max_length: 600,
        required: false
      }
    ]
  },
  {
    name: 'nickname',
    description: command.nickname.description,
    description_localizations: translation('command.nickname.description'),
    dm_permission: false,
    options: [
      {
        name: 'config',
        description: command.nickname.config.description,
        description_localizations: translation('command.nickname.config.description'),
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'family_nickname_format',
            description: command.nickname.config.options.family_nickname_format.description,
            description_localizations: translation('command.nickname.config.options.family_nickname_format.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'non_family_nickname_format',
            description: command.nickname.config.options.non_family_nickname_format.description,
            description_localizations: translation('command.nickname.config.options.non_family_nickname_format.description'),
            type: ApplicationCommandOptionType.String
          },
          {
            name: 'change_nicknames',
            description: command.nickname.config.options.change_nicknames.description,
            description_localizations: translation('command.nickname.config.options.change_nicknames.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.yes,
                name_localizations: translation('common.choices.yes'),
                value: 'true'
              },
              {
                name: common.choices.no,
                name_localizations: translation('common.choices.no'),
                value: 'false'
              }
            ]
          },
          {
            name: 'account_preference_for_naming',
            description: command.nickname.config.options.account_preference_for_naming.description,
            description_localizations: translation('command.nickname.config.options.account_preference_for_naming.description'),
            type: ApplicationCommandOptionType.String,
            choices: [
              {
                name: common.choices.nickname.default_account,
                name_localizations: translation('common.choices.nickname.default_account'),
                value: 'default-account'
              },
              {
                name: common.choices.nickname.best_account,
                name_localizations: translation('common.choices.nickname.best_account'),
                value: 'best-account'
              },
              {
                name: common.choices.nickname.default_or_best_account,
                name_localizations: translation('common.choices.nickname.default_or_best_account'),
                value: 'default-or-best-account'
              }
            ]
          }
        ]
      }
    ]
  },
  {
    name: 'events',
    description: command.events.description,
    description_localizations: translation('command.events.description'),
    dm_permission: true
  },

  // ------------- UTIL COMMANDS -------------
  {
    name: 'help',
    description: command.help.description,
    dm_permission: false,
    description_localizations: translation('command.help.description'),
    options: [
      {
        name: 'command',
        description: command.help.options.name.description,
        description_localizations: translation('command.help.options.name.description'),
        type: ApplicationCommandOptionType.String
      }
    ],
    ...userInstallable
  },
  {
    name: 'redeem',
    description: command.redeem.description,
    description_localizations: translation('command.redeem.description'),
    dm_permission: false,
    options: [
      {
        name: 'disable',
        description: command.redeem.options.disable.description,
        description_localizations: translation('command.redeem.options.disable.description'),
        type: ApplicationCommandOptionType.String,
        choices: [
          {
            name: common.choices.yes,
            name_localizations: translation('common.choices.yes'),
            value: 'true'
          },
          {
            name: common.choices.no,
            name_localizations: translation('common.choices.no'),
            value: 'false'
          }
        ]
      }
    ]
  },
  {
    name: 'invite',
    description: command.invite.description,
    dm_permission: true,
    description_localizations: translation('command.invite.description'),
    ...userInstallable
  },
  {
    name: 'debug',
    description: command.debug.description,
    dm_permission: false,
    description_localizations: translation('command.debug.description')
  },
  {
    name: 'config',
    description: command.config.description,
    dm_permission: false,
    description_localizations: translation('command.config.description'),
    options: [
      {
        name: 'bot_manager_role',
        description: command.config.options.manager_role.description,
        description_localizations: translation('command.config.options.manager_role.description'),
        type: ApplicationCommandOptionType.Role
      },
      {
        name: 'roster_manager_role',
        description: command.config.options.roster_manager_role.description,
        description_localizations: translation('command.config.options.roster_manager_role.description'),
        type: ApplicationCommandOptionType.Role
      },
      {
        name: 'flags_manager_role',
        description: command.config.options.flags_manager_role.description,
        description_localizations: translation('command.config.options.flags_manager_role.description'),
        type: ApplicationCommandOptionType.Role
      },
      {
        name: 'links_manager_role',
        description: command.config.options.links_manager_role.description,
        description_localizations: translation('command.config.options.links_manager_role.description'),
        type: ApplicationCommandOptionType.Role
      },
      {
        name: 'color_code',
        name_localizations: {
          'en-GB': 'colour_code'
        },
        description: command.config.options.color_code.description,
        description_localizations: translation('command.config.options.color_code.description'),
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'webhook_limit',
        description: command.config.options.webhook_limit.description,
        description_localizations: translation('command.config.options.webhook_limit.description'),
        type: ApplicationCommandOptionType.Integer,
        max_value: 8,
        min_value: 3
      }
    ]
  },
  {
    name: 'whitelist',
    description: command.whitelist.description,
    description_localizations: translation('command.whitelist.description'),
    dm_permission: false,
    options: [
      {
        name: 'user_or_role',
        description: command.whitelist.options.user_or_role.description,
        description_localizations: translation('command.whitelist.options.user_or_role.description'),
        type: ApplicationCommandOptionType.Mentionable
      },
      {
        name: 'command',
        description: command.whitelist.options.command.description,
        description_localizations: translation('command.whitelist.options.command.description'),
        type: ApplicationCommandOptionType.String,
        autocomplete: true
      },
      {
        name: 'clear',
        description: command.whitelist.options.clear.description,
        description_localizations: translation('command.whitelist.options.clear.description'),
        type: ApplicationCommandOptionType.Boolean
      },
      {
        name: 'list',
        description: command.whitelist.options.list.description,
        description_localizations: translation('command.whitelist.options.list.description'),
        type: ApplicationCommandOptionType.Boolean
      }
    ]
  },
  {
    name: 'clans',
    description: command.clans.description,
    description_localizations: translation('command.clans.description'),
    dm_permission: false
  },
  {
    name: 'layout',
    description: command.layout.description,
    description_localizations: translation('command.layout.description'),
    dm_permission: false,
    options: [
      {
        name: 'screenshot',
        description: command.layout.options.screenshot.description,
        description_localizations: translation('command.layout.options.screenshot.description'),
        required: true,
        type: ApplicationCommandOptionType.Attachment
      },
      {
        name: 'layout_link',
        description: command.layout.options.layout_link.description,
        description_localizations: translation('command.layout.options.layout_link.description'),
        required: true,
        max_length: 200,
        type: ApplicationCommandOptionType.String
      },
      {
        name: 'title',
        description: command.layout.options.title.description,
        description_localizations: translation('command.layout.options.title.description'),
        max_length: 2000,
        type: ApplicationCommandOptionType.String
      }
    ]
  },

  // -------- CONTEXT MENU COMMANDS--------

  {
    name: 'whois',
    type: ApplicationCommandType.User,
    dm_permission: false
  },
  {
    name: 'translate',
    type: ApplicationCommandType.Message,
    dm_permission: false,
    ...userInstallable
  }
];

export const MAIN_BOT_ONLY_COMMANDS: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: 'bot-personalizer',
    dm_permission: false,
    description: command.bot_personalizer.description,
    description_localizations: translation('command.bot_personalizer.description'),
    options: [
      {
        name: 'opt_out',
        description: command.bot_personalizer.options.opt_out.description,
        description_localizations: translation('command.bot_personalizer.options.opt_out.description'),
        type: ApplicationCommandOptionType.Boolean
      }
    ]
  }
];

export const PRIVATE_COMMANDS: RESTPostAPIApplicationCommandsJSONBody[] = [
  {
    name: 'status',
    description: "Shows information about the bot's status.",
    dm_permission: true
  },
  {
    name: 'patreon',
    description: "Shows information about the bot's Patreon.",
    dm_permission: true
  },
  {
    name: 'usage',
    description: "You can't use it anyway, so why explain?",
    dm_permission: true,
    default_member_permissions: '0',
    options: [
      {
        name: 'chart',
        description: 'It does something, yeah?',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      },
      {
        name: 'limit',
        description: 'It does something, yeah?',
        type: ApplicationCommandOptionType.Integer,
        required: false
      }
    ]
  },
  {
    name: 'eval',
    description: "You can't use it anyway, so why explain?",
    dm_permission: true,
    default_member_permissions: '0',
    options: [
      {
        name: 'code',
        description: 'Code to evaluate.',
        type: ApplicationCommandOptionType.String,
        required: true
      },
      {
        name: 'shard',
        description: 'Whether to run the code on all shards or just the current one.',
        type: ApplicationCommandOptionType.Boolean,
        required: false
      },
      {
        name: 'depth',
        description: 'Depth of the returned object.',
        type: ApplicationCommandOptionType.Number,
        required: false
      }
    ]
  }
];

export const HIDDEN_COMMANDS: RESTPostAPIApplicationCommandsJSONBody[] = [];
