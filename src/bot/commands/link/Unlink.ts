import { Command, Argument, PrefixSupplier } from 'discord-akairo';
import { Message, TextChannel, MessageEmbed } from 'discord.js';
import { Collections } from '@clashperk/node';

export default class UnlinkCommand extends Command {
	public constructor() {
		super('link-remove', {
			aliases: ['unlink'],
			category: 'profile',
			channel: 'guild',
			clientPermissions: ['EMBED_LINKS'],
			description: {
				content: [
					'Unlinks a Player or Clan from a Discord account.',
					'',
					'• **Unlink Clan Tag**',
					'• `unlink #CLAN_TAG`',
					'',
					'• **Unlink Player Tag**',
					'• `unlink #PLAYER_TAG`'
				],
				usage: '<#tag>',
				examples: ['#8QU8J9LP', '#9Q92C8R20']
			},
			optionFlags: ['--tag']
		});
	}

	public *args(msg: Message): unknown {
		const parsed = yield {
			flag: '--tag',
			match: msg.hasOwnProperty('token') ? 'option' : 'phrase',
			type: Argument.union('textChannel', (msg, tag) => this.parseTag(tag))
		};

		return { parsed };
	}

	public async exec(message: Message, { parsed, parsed: tag }: { parsed?: TextChannel | string }) {
		if (!parsed) {
			const prefix = (this.handler.prefix as PrefixSupplier)(message) as string;
			const embed = new MessageEmbed()
				.setColor(this.client.embed(message))
				.setDescription([
					`\`${prefix}unlink ${this.description.usage as string}\``,
					'',
					this.description.content.join('\n'),
					'',
					'**Examples**',
					this.description.examples.map((en: string) => `\`${prefix}unlink ${en}\``).join('\n')
				]);

			return message.util!.send(
				'**You must provide a valid argument to run this command, check the examples and usage below.**',
				{ embed }
			);
		}

		if (parsed && parsed instanceof TextChannel) {
			if (!message.member!.permissions.has('MANAGE_GUILD')) {
				return message.util!.send('You are missing `Manage Server` permission to use this comamnd.');
			}

			const { value } = await this.client.storage.collection.findOneAndUpdate(
				{ channels: parsed.id }, { $pull: { channels: parsed.id } }, { returnOriginal: false }
			);

			if (value) {
				return message.util!.send(
					`Successfully deleted **${value.name} (${value.tag})** from <#${parsed.id}>`
				);
			}

			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			return message.util!.send(`Couldn\'t find any clan linked to ${parsed.toString()}`);
		}

		const deleted = await this.delete(message.author.id, tag as string);
		if (!deleted) {
			const clan = await this.client.db.collection(Collections.LINKED_CLANS)
				.findOneAndDelete({ user: message.author.id, tag });
			if (clan.value?.tag) return message.util!.send({ embed: { description: `Successfully deleted **${clan.value.tag as string}**` } });

			return message.util!.send({
				embed: {
					description: `Couldn\'t find this tag linked to **${message.author.tag}**!`
				}
			});
		}

		return message.util!.send({ embed: { description: `Successfully deleted **${deleted.tag}**` } });
	}

	private async delete(id: string, tag: string) {
		const dLink = await this.client.http.unlinkPlayerTag(tag);
		const data = await this.client.db.collection(Collections.LINKED_PLAYERS)
			.findOneAndUpdate({ user: id }, { $pull: { entries: { tag } } });
		return data.value?.entries?.includes(tag) ? { tag } : dLink ? { tag } : null;
	}

	private parseTag(tag?: string) {
		return tag ? `#${tag.toUpperCase().replace(/o|O/g, '0').replace(/^#/g, '')}` : null;
	}
}