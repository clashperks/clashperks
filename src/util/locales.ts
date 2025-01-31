export const common = {
  no_clans_found: 'No clans were found on this server for the specified input! \nUse {{command}} command to link a clan.',
  no_clans_linked: 'No clans are linked to this server. Why not link some? \nUse {{command}} command to link a clan.',
  clan_limit:
    'The maximum number of clans has reached. Please consider supporting us on our [Patreon](https://patreon.com/clashperk) to add more than two clans.\n\nAlready subscribed? Use {{command}} command.',
  patreon_only:
    'This command is only available on Patreon subscribed servers. Please consider supporting us on our [Patreon](https://patreon.com/clashperk) to use this command.\n\nAlready subscribed? Use {{command}} command.',
  clan_verification:
    'We need to ensure that you are a leader or co-leader of this clan. Please verify your player account with the API token.\nUse the {{command}} command to verify your player account. The API token is available in the Game settings.',
  no_option: 'Something went wrong while executing this command. (option not found)',
  no_data: 'No data is available at this moment. We are still collecting!',
  no_clan_data: 'No data is available for {{clan}}. We are still collecting!',
  no_clan_members: '\u200e{{clan}} does not have any clan members.',
  fetch_failed: 'Something went wrong while fetching data from the API.',
  component: {
    expired: 'This component is no longer active. Execute the command again.',
    unauthorized: 'You must execute the command to interact with the components.'
  },
  no_clan_tag_first_time: 'You must provide a clan tag to execute this command!',
  no_clan_tag:
    'You must provide a clan tag to execute this command! \nAlternatively, you can link a default clan to your profile using the {{command}} command.',
  no_player_tag:
    'You must provide a player tag to execute this command!, \nAlternatively, you can link some accounts to your profile using the {{command}} command.',
  clan_not_linked: 'No clan is linked to {{user}}. \nUse {{command}} to link a clan.',
  player_not_linked: 'No player is linked to {{user}}. Use {{command}} command to link a player.',
  guild_unauthorized: 'This server is not authorized for {{clan}}. Use {{command}} command to link a clan.',
  status_code: {
    '400': 'An unknown error occurred while handling the request (400)',
    '403': 'An unknown error occurred while handling the request (403)',
    '404': 'No matches were found for the specified tag.',
    '429': 'An unknown error occurred while handling the request (429)',
    '500': 'An unknown error occurred while handling the request (typically happens during the season reset in the game)',
    '503': 'Service is temporarily unavailable because of the maintenance break in the game.',
    '504': 'An unknown error occurred while handling the request (504)'
  },
  maintenance_start: 'The maintenance break has started!',
  maintenance_end: 'The maintenance break is ending soon! {{duration}}',
  something_went_wrong: 'Something went wrong while executing this command.',
  missing_access: 'The bot is missing {{permission}} in {{channel}} to execute this command.',
  missing_manager_role:
    'You are missing the **Manage Server** permission or the [Bot Manager](<https://docs.clashperk.com/others/bot-manager>) role to perform this action.',
  too_many_webhooks: 'Too many webhooks in {{channel}}',
  no_match_found: 'No matches were found with the tag {{tag}}',
  color_code: 'Color Code',
  options: {
    clan: {
      tag: {
        description: 'Clan tag or name or alias.'
      },
      user: {
        description: 'Clan by @user mention or ID.'
      }
    },
    player: {
      tag: {
        description: 'Player tag or name.'
      },
      user: {
        description: 'Player by @user mention or ID.'
      }
    },
    clans: {
      description: 'Clan tags or aliases to filter clans.'
    },
    season: {
      description: 'Retrieve data for the specified season.'
    },
    season_since: {
      description: 'Retrieve data since the specified season.'
    },
    week: {
      description: 'Retrieve data for the specified raid weekend.'
    }
  },
  choices: {
    yes: 'Yes',
    no: 'No',

    off: 'Off',

    enable: 'Enable',
    disable: 'Disable',

    desc: 'Descending',
    asc: 'Ascending',

    war: 'WAR',
    cwl: 'CWL',
    trophy: 'TROPHY',
    e_sports: 'E-SPORTS',

    regular: 'Regular',
    friendly: 'Friendly',

    regular_and_cwl: 'Regular and CWL',

    clan_games: 'Clan Games',
    league_reset: 'League Reset',
    season_end: 'Season End',
    raid_weekend: 'Raid Weekend',
    capital_raids: 'Capital Raids',
    clan_wars: 'Clan Wars',

    war_attacks: 'War Attacks',
    link_button: 'Link Button',
    flag_alert_log: 'Flag Alert Log',
    roster_change_log: 'Roster Change Log',
    maintenance_break_log: 'Maintenance Break Log',
    role_refresh_button: 'Role Refresh Button',

    clan_games_ending: 'Clan Games (Ending)',
    cwl_end: 'CWL (Ending)',
    cwl_signup_ending: 'CWL Signup (Ending)',
    raid_weekend_ending: 'Raid Weekend (Ending)',

    legend_leaderboard: 'Legend Trophies',
    builder_legend_leaderboard: 'Builder Trophies',

    events_schedular: 'Events Schedular',
    reminder_ping_exclusion: 'Reminder Ping Exclusion',

    roster: {
      add_players: 'Add Players',
      remove_players: 'Remove Players',
      change_roster: 'Change Roster',
      change_group: 'Change Group',

      ping_unregistered: "Unregistered (didn't signup, but in the clan)",
      ping_missing: 'Missing (opted-in, but not in the clan)',
      ping_everyone: 'Everyone (all opted-in members)'
    },

    flag: {
      ban: 'Ban',
      strike: 'Strike'
    },

    nickname: {
      default_account: 'Default Account',
      best_account: 'Best Account',
      default_or_best_account: 'Default or Best Account'
    },

    history: {
      capital_contribution: 'Capital Contribution',
      cwl_attacks: 'CWL Attacks',
      donations: 'Donations/Received',
      attacks: 'Attacks/Defenses',
      loot: 'Loot (Gold/Elixir/Dark)',
      join_leave: 'Join/Leave',
      legend_attacks: 'Legend Attacks',
      eos_trophies: 'Season end Trophies'
    },

    stats: {
      no_cwl: 'Regular and Friendly',
      all: 'Regular, CWL and Friendly',

      fresh: 'Fresh',
      cleanup: 'Cleanup'
    },

    setup: {
      server_link: 'Server Link',
      channel_link: 'Channel Link',
      delete_clan: 'Delete clan',
      logs_or_feed: 'Logs / Feed (New)',
      war_feed: 'War Feed',
      last_seen: 'Last Seen',
      legend_log: 'Legend Log',
      capital_log: 'Capital Log',
      clan_feed: 'Clan Feed',
      join_leave: 'Join/Leave Log',
      clan_embed: 'Clan Embed',
      donation_log: 'Donation Log'
    },

    autorole: {
      clan_roles: 'Clan Roles',
      town_hall: 'Town Hall Roles',
      leagues: 'Leagues Roles',
      builder_hall: 'Builder Hall Roles',
      builder_leagues: 'Builder Leagues Roles',
      wars: 'War Roles',
      eos_push: 'End of Season Push Role',
      family_leaders: 'Family Leaders Role',
      family: 'Family Roles',
      exclusive_family: 'Exclusive Family Role',
      guest: 'Guest Role',
      verified: 'Verified Role',
      account_linked: 'Account Linked Role'
    }
  },

  contact_support: 'Contact Support',
  select_an_option: 'Select an option',
  ending: 'Ending'
} as const;

export const command = {
  activity: {
    description: 'Shows a graph of hourly-active clan members.',
    title: 'Hourly-active Clan Members',
    options: {
      clans: {
        description: 'Clan tags or aliases (Maximum 3)'
      },
      days: {
        description: 'The number of days is displayed in the graph.'
      },
      limit: {
        description: 'Number of clans to show in the graph.'
      }
    }
  },
  clan_games: {
    description: 'Clan games scoreboard of clan members.',
    title: 'Clan Games Scoreboard',
    options: {
      season: {
        description: 'The season to show the scoreboard for.'
      }
    }
  },
  capital: {
    description: 'Shows clan capital contributions and raids.',
    contribution: {
      description: 'Shows clan capital contribution of clan members.',
      title: 'Clan Capital Contributions',
      options: {
        week: {
          description: 'The week to show contributions for.'
        },
        season: {
          description: 'The season to show contributions for.'
        }
      }
    },
    raids: {
      description: 'Shows raid weekend scores of clan members.',
      title: 'Clan Capital Raids',
      options: {
        season: {
          description: 'The season to show raids for.'
        }
      },
      no_data: 'No capital raids found for {{clan}} [{{weekId}}].'
    }
  },
  legend: {
    description: 'Shows legend logs for a player.',
    attacks: {
      description: 'Shows per-day legend attacks for a clan.',
      options: {
        day: {
          description: 'The league day.'
        }
      }
    },
    days: {
      description: 'Shows per-day legend attacks for a player.'
    },
    leaderboard: {
      description: 'Shows legend leaderboard.',
      options: {
        limit: {
          description: 'Limit the number of results.'
        },
        offset: {
          description: 'Offset the number of results.'
        },
        enable_auto_updating: {
          description: 'Enable auto updating (every 30-60 mins)'
        }
      }
    },
    stats: {
      description: 'Shows statistics of legend ranks and trophies.'
    }
  },
  leaderboard: {
    description: 'Leaderboard of the top clans and players.',
    options: {
      location: {
        description: 'Location of the leaderboard'
      }
    },
    clans: {
      description: 'Top clans leaderboard.'
    },
    players: {
      description: 'Top players leaderboard.'
    },
    capital: {
      description: 'Top capital leaderboard.'
    }
  },
  lastseen: {
    description: 'The last seen time and activities of clan members.',
    title_lastseen: 'Last seen and activity scores (last 24h)',
    title_activity: 'Clan member activities (last 30d)'
  },
  alias: {
    description: 'Create, delete or view clan aliases.',
    create: {
      description: 'Creates a clan alias (short code or abbreviation) or clan nickname.',
      options: {
        alias_name: {
          description: 'Name of the alias.'
        },
        clan_nickname: {
          description: 'Nickname of the clan (Experimental)'
        }
      },
      no_name: 'You must specify an alias name to execute this command.',
      no_hash: 'A clan alias must not start with a hash.',
      no_whitespace: 'A clan alias must not contain whitespace.',
      no_clan: 'You must specify a clan tag to execute this command.',
      exists: 'An alias with the name {{name}} already exists.',
      clan_not_linked: 'The clan must be linked to the server to create an alias.',
      success: 'Clan alias or nickname updated.'
    },
    delete: {
      description: 'Deletes a clan alias.',
      options: {
        name: {
          description: 'Tag of a clan or name of an alias'
        }
      },
      no_name: 'You must provide a clan tag or clan alias to execute this command.',
      no_result: 'No matches were found with the tag or alias {{name}}.',
      success: 'Successfully deleted the clan alias {{name}}.'
    },
    list: {
      description: 'List all clan aliases.',
      title: 'Clan Aliases'
    }
  },
  config: {
    description: 'Configure server settings.',
    options: {
      color_code: {
        description: 'Hex color code (e.g #ed4245)'
      },
      manager_role: {
        description: 'Role that can manage the bot.'
      },
      roster_manager_role: {
        description: 'Role that can manage the roster members.'
      },
      flags_manager_role: {
        description: 'Role that can manage the flags.'
      },
      links_manager_role: {
        description: 'Role that can manage the Discord links.'
      },
      webhook_limit: {
        description: 'The maximum number of webhooks that can be created in a channel.'
      }
    },
    no_text_channel: 'You must specify a text channel to enable this event log.',
    title: 'Server Settings'
  },
  debug: {
    description: 'Displays some basic debug information.'
  },
  cwl: {
    description: 'CWL season summary and overview.',
    still_searching: 'Your clan {{clan}} is still searching for the opponent.',
    not_in_season: 'Your clan {{clan}} is not in the CWL season.',
    no_rounds: 'No CWL rounds have been played yet, try again after some time.',
    no_season_data: 'No CWL stats are available for the season {{season}}.',
    attacks: {
      description: 'Shows an overview of attacks for different CWL rounds.'
    },
    lineup: {
      description: 'Shows CWL lineup for a round (sorted by town hall and heroes).'
    },
    members: {
      description: 'Shows a list of all CWL participants.'
    },
    history: {
      description: 'Shows CWL history of a player or user.'
    },
    roster: {
      description: 'CWL roster and town hall distribution.'
    },
    round: {
      description: 'CWL summary for the current round.',
      options: {
        round: {
          description: 'Round number to show.'
        },
        season: {
          description: 'CWL season'
        }
      }
    },
    stars: {
      description: 'Shows CWL member ranking by stars.'
    },
    stats: {
      description: 'Shows an overview of all CWL rounds and group standings.'
    }
  },
  roster: {
    description: 'Comprehensive roster management system',
    create: {
      description: 'Create a roster',
      options: {
        clan: {
          description: 'Clan of the roster'
        },
        name: {
          description: 'Name of the roster'
        },
        category: {
          description: 'Category of the roster'
        },
        import_members: {
          description: 'Whether to import members from the clan'
        },
        allow_unlinked: {
          description: 'Whether to allow unlinked members'
        },
        max_members: {
          description: 'Roster size'
        },
        max_accounts_per_user: {
          description: 'Max accounts per user'
        },
        min_town_hall: {
          description: 'Minimum Town Hall level'
        },
        max_town_hall: {
          description: 'Maximum Town Hall level'
        },
        min_hero_level: {
          description: 'Minimum combined Hero level'
        },
        roster_role: {
          description: 'Roster role'
        },
        sort_by: {
          description: 'Sorting order of the roster member list'
        },
        start_time: {
          description: 'Roster start time (YYYY-MM-DD HH:mm, in 24 hours format)'
        },
        end_time: {
          description: 'Roster end time (YYYY-MM-DD HH:mm, in 24 hours format)'
        },
        timezone: {
          description: 'Search timezone by city or country (e.g. London, Singapore, India, Sydney)'
        },
        allow_group_selection: {
          description: 'Whether to allow members to select group'
        },
        allow_multi_signup: {
          description: 'Whether to allow multiple roster signups'
        },
        use_clan_alias: {
          description: 'Whether to use clan alias in the roster (created by /alias command)'
        },
        roster_image_url: {
          description: 'Image to be used in the roster embed'
        },
        color_code: {
          description: 'Hex color code of the roster embed'
        }
      }
    },
    post: {
      description: 'Post a roster to signup or view members',
      options: {
        roster: {
          description: 'Select a roster to post'
        }
      }
    },
    clone: {
      description: 'Clone a roster to create a new one',
      options: {
        roster: {
          description: 'Select a roster to clone'
        },
        name: {
          description: 'Name of the cloned roster'
        }
      }
    },
    list: {
      description: 'Search rosters or list all rosters and groups',
      options: {
        name: {
          description: 'Search rosters by name'
        },
        user: {
          description: 'Search rosters by user'
        },
        player: {
          description: 'Search rosters by player'
        },
        clan: {
          description: 'Search rosters by clan'
        }
      }
    },
    edit: {
      description: 'Edit a roster',
      options: {
        roster: {
          description: 'Select a roster to edit'
        },
        detach_clan: {
          description: 'Detach clan from the roster'
        },
        delete_role: {
          description: 'Whether to delete the roster role'
        },
        log_channel: {
          description: 'Channel to log roster changes'
        }
      }
    },
    delete: {
      description: 'Permanently delete a roster.',
      options: {
        roster: {
          description: 'Select a roster to delete'
        }
      }
    },
    manage: {
      description: 'Add or remove users or change their group or roster',
      options: {
        roster: {
          description: 'Select a roster to manage'
        },
        action: {
          description: 'Select an action to perform'
        },
        player: {
          description: 'Select a player to manage'
        },
        from_clan: {
          description: 'Select a clan to add players from'
        },
        from_current_wars: {
          description: 'Select a clan to add players from the current wars'
        },
        user: {
          description: 'Select a user to manage'
        },
        target_group: {
          description: 'Group of the user to move to'
        },
        target_roster: {
          description: 'Roster of the user to move to'
        }
      }
    },
    groups: {
      description: 'Manage groups of the rosters',
      options: {
        selectable: {
          description: 'Whether to allow members to select this group'
        },
        name: {
          description: 'Name of the group'
        },
        group_role: {
          description: 'Role of the group'
        },
        group: {
          description: 'Select a group to modify'
        },
        order: {
          description: 'Order of the group'
        },
        delete_role: {
          description: 'Whether to delete the role of the group'
        },
        delete_group: {
          description: 'Whether to delete the group'
        }
      },
      create: {
        description: 'Create a group'
      },
      modify: {
        description: 'Modify or delete a group'
      }
    },
    ping: {
      description: 'Ping members in the roster',
      options: {
        roster: {
          description: 'Select a roster to ping'
        },
        message: {
          description: 'Message for the members'
        },
        ping_option: {
          description: 'Select a ping option'
        },
        group: {
          description: 'Select a group to ping (overwrites ping_option)'
        }
      }
    }
  },
  export: {
    description: 'Export war/season/clan stats to Excel.',
    options: {
      wars: {
        description: 'Number of wars (Default: 25)'
      }
    },
    cwl: {
      description: 'Export CWL stats to Excel.',
      options: {
        lineup_only: {
          description: 'Export only the lineup.'
        }
      }
    },
    last_wars: {
      description: 'Export participation history (last played wars)',
      options: {
        war_type: {
          description: 'Regular or CWL'
        }
      }
    },
    members: {
      description: 'Export a comprehensive version of clan member stats.'
    },
    clans: {
      description: 'Export all linked clans.'
    },
    missed: {
      description: 'Export missed attack history.'
    },
    season: {
      description: 'Export comprehensive seasonal stats of clan members.'
    },
    wars: {
      description: 'Export War stats to Excel.',
      options: {
        war_type: {
          description: 'Regular or friendly wars (defaults to Regular)'
        }
      }
    },
    user: {
      description: 'Export Discord members',
      options: {
        role: {
          description: 'Role to filter users.'
        }
      }
    },
    attack_log: {
      description: 'Export war attack history.',
      options: {
        war_type: {
          description: 'CWL or Regular wars (default to Regular and CWL)'
        }
      }
    },
    capital_raids: {
      description: '[Experimental] Export capital raid attack stats.'
    },
    capital: {
      description: 'Export clan capital weekends.'
    },
    rosters: {
      description: 'Export all rosters.',
      options: {
        category: {
          description: 'Roster category.'
        }
      }
    }
  },
  flag: {
    description: 'Create, delete or search player flags.',
    options: {
      flag_type: {
        description: 'The type of the flag (ban or strike)'
      }
    },
    create: {
      description: 'Create a player flag to mark the player as banned or flagged.',
      options: {
        tag: {
          description: 'The tag of a player to flag.'
        },
        reason: {
          description: 'Reason for the flag.'
        },
        flag_expiry_days: {
          description: 'Flag expiry days (auto deletes the flag)'
        },
        flag_impact: {
          description: 'Number of flags this should count as'
        }
      },
      no_reason: 'You must provide a reason for the flag.',
      reason_max_limit: 'The reason must be 1024 or fewer in length.',
      success: 'Successfully flagged {{count}} player(s). \n{{players}}'
    },
    delete: {
      description: 'Delete a player flag.',
      options: {
        tag: {
          description: 'The tag of a player to delete.'
        },
        flag_ref: {
          description: 'Flag reference of this player.'
        }
      },
      no_tag: 'You must provide a player tag to delete a flag.',
      success: 'Successfully deleted the flag with the tag {{tag}}.'
    },
    list: {
      description: 'List all player flags.',
      options: {
        player: {
          description: 'Show all flags against a player'
        },
        export: {
          description: 'Export all player flags to Excel.'
        }
      },
      no_flags: 'No flags have been created.'
    },
    search: {
      description: 'Search for a player flag.',
      options: {
        tag: {
          description: 'The tag of a player to search.'
        }
      }
    }
  },
  link: {
    description: 'Create, delete or list player links.',
    no_tag: 'You must specify a player/clan tag to execute this command.',
    create: {
      description: 'Links a player account/clan to a Discord account.',
      options: {
        user: {
          description: 'User account to link to the tag.'
        },
        is_default: {
          description: 'Whether to set this as the default account.'
        },
        player_tag: {
          description: 'The player tag to link.'
        },
        clan_tag: {
          description: 'The default clan tag to link.'
        }
      },
      no_bots: 'Bot accounts are not allowed to be linked.',
      fail: 'This player or clan tag is not valid.',
      prompt: 'What would you like to link? A Player or a Clan?',
      success: 'Successfully linked {{target}} to {{user}}.',
      link_exists: '{{player}} is already linked.',
      already_linked: '{{player}} is already linked to another user. If you own this account, please use the {{command}} command.',
      max_limit: 'The maximum account limit has been reached. (25 accounts/user)'
    },
    delete: {
      description: 'Deletes a player account/clan from a Discord account.',
      options: {
        player_tag: {
          description: 'The player tag to unlink.'
        },
        clan_tag: {
          description: 'The clan tag to unlink.'
        }
      },
      success: 'Successfully deleted the link with the tag {{tag}}.',
      no_access:
        'This player should be in your clan and you must be a "Verified" Co/Leader to perform this action. Use {{command}} to verify your account.'
    },
    list: {
      description: 'List all player links of a clan.'
    }
  },
  verify: {
    description: 'Verify and link a player account using an API token.',
    options: {
      tag: {
        description: 'Tag of the player to verify.'
      },
      token: {
        description: 'API token that can be found in the game settings.'
      }
    },
    success: 'Verification successful! {{info}}',
    invalid_token: 'You must provide a valid API Token that can be found in the game settings. \nhttps://i.imgur.com/8dsoUB8.jpg'
  },
  timezone: {
    description: 'Set your timezone offset for /activity command.',
    options: {
      location: {
        description: 'Search timezone by city or country. (e.g. London, New York, Singapore, India, Sydney)'
      }
    },
    set: 'Please set your timezone with the `/timezone` command. It enables you to view the graphs in your timezone.',
    no_result: 'Make your search more specific and try again.'
  },
  profile: {
    description: 'Shows linked accounts and clan of a user.',
    options: {
      user: {
        description: 'User ID or @user mention.'
      }
    }
  },
  nickname: {
    description: 'Manage automatic nickname settings.',
    config: {
      description: 'Configure automatic server nickname settings.',
      options: {
        family_nickname_format: {
          description: 'Set family nickname format (e.g. {CLAN} | {ALIAS} | {TH} | {ROLE} | {NAME})'
        },
        non_family_nickname_format: {
          description: 'Set non-family nickname format (e.g. {NAME} | {TH})'
        },
        change_nicknames: {
          description: 'Whether to update nicknames automatically.'
        },
        account_preference_for_naming: {
          description: 'Whether to use the default account or the best account in the family.'
        }
      }
    }
  },
  reminders: {
    description: 'Setup reminders for clan wars, capital raids.',
    options: {
      message: {
        description: 'Reminder message for the notification.'
      },
      reminder_id: {
        description: 'Reminder ID (use /reminders list to get the ID)'
      }
    },
    create: {
      description: 'Create reminders for clan wars, capital raids or clan games.',
      options: {
        type: {
          description: 'Type of the reminder.'
        },
        duration: {
          description: 'Remaining duration to mention members (e.g. 6h, 12h, 1d, 2d)'
        },
        exclude_participants: {
          description: 'Whether to exclude participant list and only include the message (clan wars only)'
        },
        channel: {
          description: 'Reminder channel for the notification.'
        }
      },
      max_limit: 'You can only have 25 reminders.',
      invalid_duration_format: 'The duration must be in a valid format. e.g. 2h, 2.5h, 30m',
      duration_limit: 'The duration must be greater than 15 minutes and less than 48 hours.',
      duration_order: 'Duration must be a multiple of 15 minutes. e.g. 15m, 30m, 45m, 1h, 1.25h, 1.5h, 1.75h',
      too_many_clans:
        "The clan selection menu is not available for more than 25 clans. {{clans}} clans were selected automatically!\nTo create a reminder for specific clans, pass clan tags or aliases through the 'clans' option while executing the command.",
      success: 'Successfully saved!'
    },
    edit: {
      description: 'Edit a reminder by ID (do /reminders list to get the ID)'
    },
    delete: {
      description: 'Delete a reminder by ID (do /reminders list to get the ID)',
      options: {
        clear: {
          description: 'Whether to clear all reminders.'
        }
      },
      cleared: 'Successfully cleared all reminders.',
      not_found: 'No reminder was found with the ID {{id}}.',
      success: 'Successfully deleted the reminder with the ID {{id}}.',
      too_many_reminders: 'If you have too many reminders, please provide a reminder ID.'
    },
    list: {
      description: 'List all war reminders for clan wars, capital raids or clan games.',
      options: {
        compact_list: {
          description: 'Show a compact list of the reminders and disable ephemeral.'
        },
        reminder_id: {
          description: 'List a reminder by ID (do /reminders list to get the ID)'
        }
      }
    },
    now: {
      description: 'Create an instant reminder to notify members.',
      no_match: 'There are no wars or no members that are matching with the selected options.'
    },
    config: {
      description: 'Configure reminder settings.',
      options: {
        reminder_ping_exclusion: {
          description: 'Set reminder ping exclusion settings.'
        }
      }
    },
    //
    no_reminders: 'You have no reminders.',
    no_message: 'You must specify a message to execute this command.'
  },
  history: {
    description: 'Clan Games, Capital Raids, Donations, and CWL attacks history.',
    options: {
      clans: {
        description: 'Select clans for the history.'
      },
      player: {
        description: 'Select a player for the history.'
      },
      user: {
        description: 'Select a user for the history.'
      }
    }
  },
  army: {
    description: 'Parse an army composition link.',
    no_link: 'You must provide a valid army composition link.',
    invalid_link: 'This army composition link is invalid.',
    possibly_invalid_link: 'This link is invalid and may not work.',
    options: {
      link: {
        description: 'Army composition link.'
      },
      name: {
        description: 'An optional name for this army.'
      },
      equipment: {
        description: 'Hero equipment (type anything)'
      },
      pets: {
        description: 'Hero pets (type anything)'
      },
      clan_castle: {
        description: 'Clan castle (type anything)'
      },
      tips: {
        description: 'Some tips (type anything)'
      }
    }
  },
  attacks: {
    description: 'Displays attack and defense info of clan members.',
    options: {
      season: {
        description: 'The season to show attacks for.'
      }
    }
  },
  defense: {
    options: {
      clan_only: {
        description: 'Only show defense stats for the clan.'
      }
    }
  },
  boosts: {
    description: 'Displays active super troops of clan members.',
    no_boosts: 'No members are boosting in this clan.',
    no_recent_boosts: 'No recently active members are boosting in this clan.',
    no_unit_boosts: 'No members are boosting {{unit}} in this clan.',
    no_recent_unit_boosts: 'No recently active members are boosting {{unit}} in this clan.'
  },
  clan: {
    description: 'Shows comprehensive overview of a clan.',
    options: {
      by_player_tag: {
        description: 'Get clan by a player tag.'
      }
    }
  },
  compo: {
    description: 'Shows Town Hall composition of a clan.'
  },
  donations: {
    description: 'Shows donations and donations received of clan members.',
    no_season_data: 'No data was found for the season {{season}}.',
    options: {
      season: {
        description: 'The season to show donations for.'
      },
      user: {
        description: 'Donation history of a linked user.'
      },
      player: {
        description: 'Donation history of a player.'
      },
      start_date: {
        description: 'Starting date (YYYY-MM-DD)'
      },
      end_date: {
        description: 'Ending date (YYYY-MM-DD)'
      }
    }
  },
  caller: {
    description: 'Manage the war base caller.',
    options: {
      defense_target: {
        description: 'The base target # of your opponent.'
      }
    },
    assign: {
      description: 'Set a target for a player in the current war.',
      options: {
        offense_target: {
          description: 'The base target # of your clan.'
        },
        notes: {
          description: 'Notes to add to the target.'
        },
        hours: {
          description: 'The number of hours to set the target for.'
        }
      }
    },
    clear: {
      description: 'Clear the target for a player in the current war.'
    }
  },
  lineup: {
    description: 'Displays war line-up of a clan.',
    not_in_war: 'The clan is not in a war.'
  },
  members: {
    description: 'Get a clan member list with heroes, trophies, war preferences and much more.',
    description_long: 'List clan members sorted by heroes, trophies, war preferences, discord links, clan roles, player tags, attacks, etc.'
  },
  player: {
    description: 'Player summary and overview.',
    description_long: 'Shows comprehensive overview of a player (including war attack history)'
  },
  remaining: {
    description: 'Shows remaining or missed war hits of a clan.',
    options: {
      type: {
        description: 'The type of remaining tasks to show.'
      },
      player: {
        description: 'Remaining attacks of a player.'
      },
      user: {
        description: 'Remaining attacks of a linked user.'
      }
    }
  },
  rushed: {
    description: 'Rushed units and rushed % of a player or clan members.',
    no_rushed: 'No rushed units for Town Hall {{townhall}}.',
    options: {
      clan: {
        description: 'Displays rushed units of a clan.'
      }
    }
  },
  search: {
    description: 'Search clans by name.',
    no_results: 'No results were found.',
    searching: "Clans with the name '{{name}}'.",
    options: {
      name: {
        description: 'Clan name (must be 3 characters long)'
      }
    }
  },
  stats: {
    description: 'Shows attack and defense stats of clan members.',
    no_stats: 'No stats are available for this filter or clan.',
    options: {
      roster: {
        description: 'Stats of a roster.'
      },
      compare: {
        description: 'Compare Town Halls (e.g. 14vs13, *vs15, all, equal)'
      },
      stars: {
        description: 'War stars earned. (Default: 3)'
      },
      type: {
        description: 'War Type [e.g. Regular, CWL, Friendly] (Default: Regular and CWL)'
      },
      attempt: {
        description: 'Fresh attacks or clean-up attacks. (Default: Both)'
      },
      days: {
        description: 'Number of days to include (last x days of wars)'
      },
      wars: {
        description: 'Number of last wars to include.'
      },
      filter_farm_hits: {
        description: 'Filter out farm hits (1 star and < 50% destruction)'
      },
      clan_only: {
        description: "Only include the specified clan's war attacks."
      }
    },
    attacks: {
      description: 'Shows attack success rates of clan members.'
    },
    defense: {
      description: 'Shows defense failure rates of clan members.'
    }
  },
  units: {
    description: 'Shows home village and builder base units of a player (with max/min levels)'
  },
  upgrades: {
    description: 'Remaining upgrades of a player with upgrading cost.'
  },
  war: {
    description: 'Shows war summary and overview of a clan.',
    no_war_id: 'No war was found for the specified war ID.',
    not_in_war: 'Clan is not in a war.',
    options: {
      war_id: {
        description: 'Search by war ID.'
      }
    }
  },
  warlog: {
    description: 'Shows the last 10 clan war logs.'
  },
  setup: {
    description: 'Enable/disable features on the server or add/remove clans.',
    enable: {
      description: 'Enable a feature on the server or add a clan.',
      description_long:
        'Enable a feature on the server (War Feed, Last Seen, Clan Games, Legend Log, Capital Log, Clan Feed, Join/Leave Log, Clan Embed, Donation Log) or add a clan or link a clan to a channel.',
      options: {
        channel: {
          description: 'Channel to send updates to (defaults to the current channel)'
        },
        color: {
          description: 'Hex color code (only for donation log, clan games, last seen and clan embed)'
        },
        role: {
          description: 'Role for the flag notification (only for clan feed)'
        },
        category: {
          description: 'Category of the clan. (select from the menu or type your own)'
        }
      },
      no_leader_link: 'Clan Leader must be linked to the bot to enable this feature.',
      server_link: {
        success: 'Successfully linked {{clan}} to {{guild}}.',
        already_linked: '{{clan}} is already linked to {{guild}}.'
      },
      channel_link: {
        description: 'Link a channel to a clan.',
        already_linked: '{{clan}} is already linked to {{channel}}.',
        success: 'Successfully linked {{clan}} to {{channel}}.'
      }
    },
    disable: {
      description: 'Disable a feature on the server or remove a clan.',
      options: {
        channel: {
          description: 'Channel to be removed.'
        }
      },
      channel_unlink: 'Successfully unlinked {{clan}} from {{channel}}.',
      channel_not_found: 'No clans were found that are linked to {{channel}}.',
      clan_not_linked: 'No clans were found on the server for the specified tag.',
      clan_deleted: 'Successfully deleted {{clan}}.',
      feature_disabled: 'Successfully disabled {{feature}} for {{clan}}.'
    },
    list: {
      description: 'List all enabled features and clans.',
      options: {
        clans: {
          description: 'Select the clans to list.'
        }
      }
    },
    utils: {
      description: '[DEPRECATED] Setup other utility features (link button, events schedular)',
      options: {
        disable: {
          description: 'Disable a scheduled event.'
        }
      }
    },
    buttons: {
      description: 'Setup buttons for the server.',
      options: {
        button_type: {
          description: 'Select the button type to setup'
        },
        embed_color: {
          description: 'Hex color code for the embed'
        }
      }
    },
    events: {
      description: 'Setup automatic events for the server.',
      options: {
        disable: {
          description: 'Disable the events schedular.'
        }
      }
    },
    server_logs: {
      description: 'Setup automatic logs for the server.',
      options: {
        log_type: {
          description: 'Select the log type to setup.'
        },
        disable: {
          description: 'Whether to disable the log.'
        }
      }
    },
    clan_logs: {
      description: 'Setup automatic logs for the clan.',
      options: {
        clan: {
          description: 'Select the clan to setup logs.'
        },
        action: {
          description: 'What logs to enable or disable.'
        }
      }
    }
  },
  category: {
    description: 'Manage clan categories or groups.',
    options: {
      category_name: {
        description: 'Name of the clan category.'
      },
      category: {
        description: 'Select a clan category.'
      }
    },
    create: {
      description: 'Create a new clan category.'
    },
    list: {
      description: 'List all clan categories.'
    },
    edit: {
      description: 'Edit a clan category.'
    },
    delete: {
      description: 'Delete a clan category.'
    }
  },
  autorole: {
    description: 'Enable automatic clan roles and Town Hall roles',
    no_roles: 'You must specify 4 roles to execute this command.',
    no_system_roles: 'System managed or bot roles are not allowed.',
    no_higher_roles: "Bot's highest role must be higher than the selected roles.",
    invalid_clan_tag: 'The specified clan tag is invalid.',
    roles_already_used:
      'Some roles have already been used for another clan. \nPlease consider supporting us on [Patreon](https://patreon.com/clashperk) to use the same roles for multiple clans.',
    clan_not_linked: 'The clan must be linked to the server to enable auto-role.',
    success_with_count: 'Successfully enabled auto-role for {{count}} clan(s). \n{{clans}}',
    clan_roles: {
      description: 'Manage automatic role management for clan roles.',
      options: {
        member: {
          description: 'The Member role (below Elder)'
        },
        elder: {
          description: 'The Elder role.'
        },
        co_lead: {
          description: 'The Co-Leader role.'
        },
        leader: {
          description: 'The Leader role.'
        },
        common_role: {
          description: 'Clan role for everyone in the clan.'
        },
        only_verified: {
          description: 'Roles will be given to the verified players only. (API token verification is required)'
        }
      }
    },
    leagues: {
      description: 'Manage automatic role management for leagues.'
    },
    builder_leagues: {
      description: 'Set builder base league roles.'
    },
    town_hall: {
      description: 'Manage automatic role management for town hall levels.',
      options: {
        allow_non_family_accounts: {
          description: 'Whether to give roles to the members that are not in the family clans.'
        }
      }
    },
    builder_hall: {
      description: 'Manage automatic Builder Hall roles.'
    },
    wars: {
      description: 'Set automatic war roles.',
      options: {
        role: {
          description: 'The war role.'
        },
        clan: {
          description: 'The clan for which to set the war role.'
        }
      }
    },
    eos_push: {
      description: 'Set end of season push roles.',
      options: {
        role: {
          description: 'The end of season push role.'
        },
        clans: {
          description: 'The clans for which to set the end of season push role.'
        }
      }
    },
    family: {
      description: 'Set family roles.',
      options: {
        family_leaders_role: {
          description: 'Family leaders role (Leaders and Co-Leaders)'
        },
        family_role: {
          description: 'Family role.'
        },
        exclusive_family_role: {
          description: 'Exclusive family role (all linked accounts are in the family)'
        },
        guest_role: {
          description: 'Guest role (not in the family)'
        },
        verified_role: {
          description: 'Verified role (API token verified)'
        },
        account_linked_role: {
          description: 'Account linked role (account linked but may not be verified)'
        }
      }
    },
    list: {
      description: 'List all auto roles and settings.'
    },
    disable: {
      description: 'Disable automatic clan roles.',
      description_long: 'Disable automatic role management for clan roles, town hall levels, or leagues.',
      options: {
        type: {
          description: 'Type of roles to disable.'
        },
        clear: {
          description: 'Clear all roles from all clans.'
        }
      },
      success_with_count: 'Auto-role has been disabled for {{count}} clan(s). \n{{clans}}'
    },
    refresh: {
      description: 'Refresh roles manually.',
      description_long: 'Refresh roles manually. (Use this command if the roles are not updated automatically)',
      options: {
        user_or_role: {
          description: 'Refresh an individual user or a role.'
        },
        is_test_run: {
          description: 'Test run to see the changes without applying.'
        },
        force_refresh: {
          description: 'Whether to bypass delays and force refresh roles.'
        }
      }
    },
    config: {
      description: 'Manage automatic roles settings.',
      options: {
        auto_update_roles: {
          description: 'Whether to update roles automatically.'
        },
        role_removal_delays: {
          description: 'Whether to delay the removal of roles.'
        },
        role_addition_delays: {
          description: 'Whether to delay the addition of roles.'
        },
        always_force_refresh_roles: {
          description: 'Whether to enforce role refresh for individual users by default.'
        },
        delay_exclusion_roles: {
          description: 'Roles that are excluded from delays.'
        },
        allow_not_linked: {
          description: 'Whether to allow not linked players to get roles.'
        },
        verified_only_clan_roles: {
          description: 'Whether to grant clans roles to verified players only.'
        }
      }
    }
  },
  summary: {
    description: 'Shows summary of the clan family.',
    best: {
      description: 'Shows a summary of best members.',
      options: {
        limit: {
          description: 'Number of members to show (Default: 5)'
        },
        order: {
          description: 'Order of the list.'
        }
      }
    },
    wars: {
      description: 'Shows a summary of current wars.'
    },
    compo: {
      description: 'Shows a summary of Town Hall composition.'
    },
    cwl_ranks: {
      description: 'Shows a summary of CWL ranks.'
    },
    cwl_status: {
      description: 'Shows a summary of CWL spin status.'
    },
    leagues: {
      description: 'Shows a summary of clan leagues.'
    },
    donations: {
      description: 'Shows a summary of donations.'
    },
    attacks: {
      description: 'Shows a summary of multiplayer attacks and defenses.'
    },
    trophies: {
      description: 'Shows a summary of trophies.',
      options: {
        limit: {
          description: 'Limit the number of members.'
        }
      }
    },
    war_results: {
      description: 'Shows a summary of seasonal war results.'
    },
    missed_wars: {
      description: 'Shows a summary of missed wars.'
    },
    capital_raids: {
      description: 'Shows information about capital raids.'
    },
    capital_contribution: {
      description: 'Shows a summary of capital contributions.',
      options: {
        week: {
          description: 'The week to show capital contributions for.'
        }
      }
    },
    activity: {
      description: 'Shows a summary of clan activity (last seen).'
    },
    clan_games: {
      description: 'Shows a summary of clan games scores.'
    },
    clans: {
      description: 'Shows a summary of family clans.'
    }
  },
  help: {
    description: 'Get a list of commands or info about a specific command.',
    options: {
      name: {
        description: 'Name of the command.'
      }
    }
  },
  invite: {
    description: 'Get the bot invite and support server link.'
  },
  redeem: {
    description: 'Redeem or manage a Patreon subscription. (if you wish to support us)',
    options: {
      disable: {
        description: 'Disable subscription for a server (if subscribed)'
      }
    }
  },
  events: {
    description: 'Shows the next in-game events.'
  },
  whitelist: {
    description: 'Whitelist a role or user to use specific commands.',
    options: {
      user_or_role: {
        description: 'User or role to whitelist.'
      },
      command: {
        description: 'Command to whitelist.'
      },
      clear: {
        description: 'Clear the whitelist.'
      },
      list: {
        description: 'List all whitelisted users and roles.'
      }
    }
  },
  clans: {
    description: 'Show all linked clans.'
  },
  layout: {
    description: 'Post a village layout.',
    options: {
      screenshot: {
        description: 'Screenshot of the layout.'
      },
      layout_link: {
        description: 'Shareable link of the layout.'
      },
      title: {
        description: 'Title of the layout.'
      }
    }
  },
  bot_personalizer: {
    description: 'Build your own Discord bot!',
    options: {
      opt_out: {
        description: 'Opt-out from the custom bot and delete related services.'
      }
    }
  }
} as const;

export default {
  common,
  command
} as const;
