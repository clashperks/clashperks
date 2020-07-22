class WarHitrate {
	static hitrate(clan, opponent, STAR = 3) {
		const data = {
			clan: { hitrate: [] },
			opponent: { hitrate: [] }
		};

		for (const member of opponent.members) {
			if (member.bestOpponentAttack && member.bestOpponentAttack.stars === STAR) {
				const attackerTag = member.bestOpponentAttack.attackerTag;
				const attacker = clan.members.find(m => m.tag === attackerTag);

				if (attacker) {
					const entry = data.clan.hitrate.find(a => a.th === member.townhallLevel && a.vs === attacker.townhallLevel);
					if (entry) {
						entry.star += 1;
					} else {
						data.clan.hitrate.push({
							th: member.townhallLevel,
							vs: attacker.townhallLevel,
							attacks: 0,
							star: 1
						});
					}
				}
			}
		}

		for (const member of clan.members) {
			if (member.attacks) {
				for (const attack of member.attacks) {
					const attackerTag = attack.defenderTag;
					const defender = opponent.members.find(m => m.tag === attackerTag);
					if (defender) {
						const entry = data.clan.hitrate.find(a => a.th === defender.townhallLevel && a.vs === member.townhallLevel);
						if (entry) {
							entry.attacks += 1;
						} else {

						}
					}
				}
			}
		}

		for (const member of clan.members) {
			if (member.bestOpponentAttack && member.bestOpponentAttack.stars === STAR) {
				const attackerTag = member.bestOpponentAttack.attackerTag;
				const attacker = opponent.members.find(m => m.tag === attackerTag);
				if (attacker) {
					const entry = data.opponent.hitrate.find(a => a.th === member.townhallLevel && a.vs === attacker.townhallLevel);
					if (entry) {
						entry.star += 1;
					} else {
						data.opponent.hitrate.push({
							th: member.townhallLevel,
							vs: attacker.townhallLevel,
							attacks: 1,
							star: 0
						});
					}
				}
			}
		}

		for (const member of opponent.members) {
			if (member.attacks) {
				for (const attack of member.attacks) {
					const attacker = attack.defenderTag;
					const defender = clan.members.find(m => m.tag === attacker);
					if (defender) {
						const entry = data.opponent.hitrate.find(a => a.th === defender.townhallLevel && a.vs === member.townhallLevel);
						if (entry) {
							entry.attacks += 1;
						} else {

						}
					}
				}
			}
		}


		for (const hit of data.clan.hitrate) {
			if (hit.attacks > 0) data.clan.hitrate.find(a => a.th === hit.th && a.vs === hit.vs).hitrate = ((hit.star / hit.attacks) * 100).toFixed();
		}

		for (const hit of data.opponent.hitrate) {
			if (hit.attacks > 0) data.opponent.hitrate.find(a => a.th === hit.th && a.vs === hit.vs).hitrate = ((hit.star / hit.attacks) * 100).toFixed();
		}

		data.clan.hitrate.sort((a, b) => b.vs - a.vs).sort((a, b) => b.th - a.th);
		data.opponent.hitrate.sort((a, b) => b.vs - a.vs).sort((a, b) => b.th - a.th);
		return data;
	}
}

module.exports = WarHitrate;
