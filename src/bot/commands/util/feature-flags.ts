import { Message } from 'discord.js';
import { inspect } from 'util';
import { Command } from '../../lib/index.js';
import { FeatureFlags } from '../../util/_constants.js';

export default class FeatureFlagsCommand extends Command {
  public constructor() {
    super('feature-flags', {
      category: 'none',
      defer: false,
      ownerOnly: true
    });
  }

  public async run(message: Message<true>) {
    const result = await Promise.all(
      Object.values(FeatureFlags).map(async (flag) => ({
        [flag]: await this.client.isFeatureEnabled(flag, message.guild.id)
      }))
    );

    const inspected = inspect(result, { depth: 1 }).replace(new RegExp('!!NL!!', 'g'), '\n');
    return message.channel.send(`\`\`\`${inspected}\`\`\``);
  }
}
