const { Command, Flag, Argument } = require('discord-akairo');
const Fetch = require('../../struct/Fetch');
const fetch = require('node-fetch');
const { firestore } = require('../../struct/Database');
const { geterror, fetcherror } = require('../../util/constants');

const TownHallEmoji = {
	2: '<:townhall2:534745498561806357>',
	3: '<:townhall3:534745539510534144>',
	4: '<:townhall4:534745571798286346>',
	5: '<:townhall5:534745574251954176>',
	6: '<:townhall6:534745574738624524>',
	7: '<:townhall7:534745575732805670>',
	8: '<:townhall8:534745576802353152>',
	9: '<:townhall9:534745577033039882>',
	10: '<:townhall10:534745575757709332>',
	11: '<:townhall11:534745577599270923>',
	12: '<:townhall12:534745574981894154>'
};

const leagueStrings = {
	29000000: '<:no_league:524912313531367424>',
	29000001: '<:bronze3:524912314332348416>',
	29000002: '<:bronze2:524912314500251651>',
	29000003: '<:bronze1:524912313535561731>',
	29000004: '<:silver3:524912314680475659>',
	29000005: '<:silver2:524104101043372033>',
	29000006: '<:silver1:524102934871670786>',
	29000007: '<:gold3:524102875505229835>',
	29000008: '<:gold2:524102825589080065>',
	29000009: '<:gold1:524102616125276160>',
	29000010: '<:crystal3:525624971456937984>',
	29000011: '<:crystal2:524096411927576596>',
	29000012: '<:crystal1:524094240658292746>',
	29000013: '<:master3:524096647366705152>',
	29000014: '<:master2:524096587224580115>',
	29000015: '<:master1:524096526499446794>',
	29000016: '<:champion3:524093027099344907>',
	29000017: '<:champion2:524091846226345984>',
	29000018: '<:champion1:524091132498411520>',
	29000019: '<:titan3:524084656790962186>',
	29000020: '<:titan2:524089454206386199>',
	29000021: '<:titan1:524087152183607329>',
	29000022: '<:legend:524089797023760388>',
	29000023: '<:legend:524089797023760388>',
	29000024: '<:legend:524089797023760388>',
	29000025: '<:legend:524089797023760388>'
};

const API = [
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImIzYTdkMDcxLTM0M2UtNDA2Yy04MDQ0LWFmNDk0NmQ1OGVhNSIsImlhdCI6MTU2ODMwNjEwNSwic3ViIjoiZGV2ZWxvcGVyLzNiZTY0NzFkLWM1ODAtNjIyMy0xOWNhLTRkY2ZmNzhiMDBiNCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.OWvKCU1bdNx0to3d316jsH2xwfZ8mKfnZypNetsBakbhrwOiiWojkAWiKd2iM0Bdqx7cIXTlJgZptpx-YKyWgw',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImRjYzA1ZWU0LWFjZWMtNGY5My1hZWNiLWJjOTU1YThiYmUxMiIsImlhdCI6MTU2ODMwNjExMywic3ViIjoiZGV2ZWxvcGVyLzNiZTY0NzFkLWM1ODAtNjIyMy0xOWNhLTRkY2ZmNzhiMDBiNCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.N75KyVEJSwOPLoKtXjkhQ1v38LQMIhj8LA6hQqMLHT2ctTHN5ipI73s01Yzibhg59jeipMDLC6fLlH4x155lTA',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjI0NmFlYzU1LTgxZWYtNDNlOS05MzkxLThlNGVhYTlkOTAyZSIsImlhdCI6MTU2ODMwNjEyMiwic3ViIjoiZGV2ZWxvcGVyLzNiZTY0NzFkLWM1ODAtNjIyMy0xOWNhLTRkY2ZmNzhiMDBiNCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.xr2AStr1a1n9R56BFA1TAn8qgEYGraX23ZmOxV3xJKb2zVZyGT4fSeVrKWDIie682dO_MnYQE8rlTXPmepgYIg',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjM1ZTE3OWU2LWViZWEtNGMxYS05NzlkLTQ4MjM3NTkzNzcwMyIsImlhdCI6MTU2ODMwNjEzMywic3ViIjoiZGV2ZWxvcGVyLzNiZTY0NzFkLWM1ODAtNjIyMy0xOWNhLTRkY2ZmNzhiMDBiNCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.jNDGf9xsDjKZYHMIGAMU4APdMm1WtX3FjoxCT6Mpc2RoxqICDyeBjrZyWGgeZ1woif4yUxAl0ZK9njhdLD9h_w',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjRkM2EyMWQ1LWNmODYtNDVkOS04OWFhLWRjYTI1MDliODc1YSIsImlhdCI6MTU2ODMwNjE0MSwic3ViIjoiZGV2ZWxvcGVyLzNiZTY0NzFkLWM1ODAtNjIyMy0xOWNhLTRkY2ZmNzhiMDBiNCIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.O3gLGXp8p3br0JGEHl_DGUZM0DVWF2FOH81unCZ79FvjW8catobY8JbPV8bD0X8TzrgsQX-8UexCMSXtVV8miw',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjQ0NGFjMDdmLWY0NmYtNDBiYS1iYjllLTRkNmFlYjQ5MzYwNCIsImlhdCI6MTU2ODM0Njc2Mywic3ViIjoiZGV2ZWxvcGVyL2ZiMjgwMWUyLTA5ZGUtYjU0OC05ZWEwLTkzMDExYzY1YmUyYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.SeHrl1cNjeXj7YNFRydDYH8waM7H1ZJP4kVtkAe9fsomhZLWaDAQMuS4Dr8_WFFFsqYNlUVG-BP9gnQMrqJ8Hw',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjM0NDhlNThmLTc4ODYtNGE0Yy1hYTM3LWNiZWFjNzc0MDkzYiIsImlhdCI6MTU2ODM0Njc3MCwic3ViIjoiZGV2ZWxvcGVyL2ZiMjgwMWUyLTA5ZGUtYjU0OC05ZWEwLTkzMDExYzY1YmUyYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.5cGkrmcG5op7bpmvqBNjXl7eQAbdjgxtEEqEvto2eXgniIgWXdkRqJUGDP4UVyclR7fIfrH1fNTUtQvoYv-VaQ',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjZiNTk0MTJlLTViNTUtNDQwNS04ZjUxLTUxNTczYjE0ZDBjNiIsImlhdCI6MTU2ODM0Njc4MCwic3ViIjoiZGV2ZWxvcGVyL2ZiMjgwMWUyLTA5ZGUtYjU0OC05ZWEwLTkzMDExYzY1YmUyYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.uBYFzBZ77aPlVtQlRoAwRFW4SOBPEdu39yg8qsQtHnwBacMbMjEQK1QwzB96vgX5sgses67P6J6MABu8MUXbzw',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjY4ZWJmYTBjLWMxOWYtNGI2MC05ZTJhLWVhMGYxYzVjZjBkMyIsImlhdCI6MTU2ODM0Njc5NCwic3ViIjoiZGV2ZWxvcGVyL2ZiMjgwMWUyLTA5ZGUtYjU0OC05ZWEwLTkzMDExYzY1YmUyYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.-PLch4MzuPXEfWItC91ar3hq8ke_wqvTQfeYRvBsAJpVUuh0jxtO5_RUdx9SF9yShCwItpuRI0fC3jnvbQUL6g',
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6ImVkMjQ0NDJhLTA3OGUtNGJiMC1iMWE0LTIyZTc3YmZkOWIyMiIsImlhdCI6MTU2ODM0NjgwMSwic3ViIjoiZGV2ZWxvcGVyL2ZiMjgwMWUyLTA5ZGUtYjU0OC05ZWEwLTkzMDExYzY1YmUyYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjM0LjY3LjI0Mi40NSJdLCJ0eXBlIjoiY2xpZW50In1dfQ.46CiAxuj2qBclTPeh3s54TfhRIIQy4IOdVO96VH6fU0ng3XAFLC1sqPQPnGeX3tj_4O9gwooYUB1KMEXheBaFA'
];

class MembersCommand extends Command {
	constructor() {
		super('members', {
			aliases: ['members'],
			category: 'lookup',
			description: {
				content: 'List of clan members (--th to view th levels).',
				usage: '<tag> [th] [th level]',
				examples: [
					'#8QU8J9LP',
					'#8QU8J9LP --th',
					'#8QU8J9LP -th 10',
					'#8QU8J9LP -th 9'
				]
			},
			flags: ['--th', '-th', 'th']
		});
	}

	*args() {
		const flag = yield {
			match: 'flag',
			flag: ['--th', '-th', 'th']
		};

		const args = yield (
			// eslint-disable-next-line multiline-ternary
			flag ? {
				match: 'rest',
				type: 'string',
				default: ''
			} : {
				match: 'content',
				type: 'rest',
				default: ''
			}
		);

		return { args, flag };
	}

	exec(message, { args, flag }) {
		if (flag) {
			args = args.split(' ')
				.filter(arg => arg.length)
				.reverse()
				.join(' ');
			return this.handler.handleDirectCommand(message, args, this.handler.modules.get('members-th'), false);
		}
		return this.handler.handleDirectCommand(message, args, this.handler.modules.get('members-league'), false);
	}
}

module.exports = MembersCommand;
