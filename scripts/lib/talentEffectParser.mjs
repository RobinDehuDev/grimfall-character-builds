/**
 * Parses WotLK talent description text into structured effect rows.
 */

export const SCHOOLS = [
  "shadow",
  "fire",
  "frost",
  "nature",
  "arcane",
  "holy",
  "physical",
];

const CLAUSE_SPLIT_LOOKAHEAD =
  /(?:increas(?:e|es|ed)|reduc(?:e|es|ed)|decreas(?:e|es|ed)|damage done|damage from|grants?|have a \d+% chance|\d+% chance to|also|your|the|all|gives?|allows?|enables?|causes?|you have|you will|generat|\d+%)/i;

const PROC_CC_VERBS =
  "daze|stun|fear|silence|root|disarm|charm|sleep|snare|entrap";

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeClause(clause) {
  return clause
    .trim()
    .replace(/\.$/, "")
    .replace(/^in addition,\s*/i, "")
    .replace(/^also,\s*/i, "");
}

function splitMultiValueClause(clause) {
  const normalized = normalizeClause(clause);
  if (!normalized) return [];

  const byPercent = [...normalized.matchAll(/\bby \d+(?:\.\d+)?%/gi)];
  if (byPercent.length > 1) {
    const firstEnd = byPercent[0].index + byPercent[0][0].length;
    const andIdx = normalized.indexOf(" and ", firstEnd);
    if (andIdx > 0) {
      const left = normalized.slice(0, andIdx).trim();
      const right = normalized.slice(andIdx + 5).trim();
      if (left && right) {
        return [left, ...splitMultiValueClause(right)];
      }
    }
  }

  return [normalized];
}

function protectDualBeneficiaryPhrases(segment) {
  const protectedPhrases = [];
  let working = segment;
  const patterns = [/to you and your pet/gi, /you and your pet will/gi, /you and your pet's/gi];
  for (const pattern of patterns) {
    working = working.replace(pattern, (match) => {
      const token = `__PROTECTED_${protectedPhrases.length}__`;
      protectedPhrases.push(match);
      return token;
    });
  }
  return { working, protectedPhrases };
}

function restoreProtectedPhrases(text, protectedPhrases) {
  let restored = text;
  for (let i = 0; i < protectedPhrases.length; i++) {
    restored = restored.replace(`__PROTECTED_${i}__`, protectedPhrases[i]);
  }
  return restored;
}

function splitSegmentOnAnd(segment) {
  const { working, protectedPhrases } = protectDualBeneficiaryPhrases(segment);
  const parts = working.split(
    new RegExp(`\\s+and\\s+(?=${CLAUSE_SPLIT_LOOKAHEAD.source})`, "i"),
  );
  return parts.map((part) => restoreProtectedPhrases(part, protectedPhrases));
}

export function expandDualBeneficiaryClauses(clause) {
  const regenMatch = clause.match(
    /you and your pet will regenerate (\d+(?:\.\d+)?%[^,]*)/i,
  );
  if (regenMatch) {
    const tail = regenMatch[1];
    return [
      `you will regenerate ${tail}`,
      `your pet will regenerate ${tail}`,
    ];
  }

  const healMatch = clause.match(
    /increases healing done to you and your pet( by \d+(?:\.\d+)?%.*)/i,
  );
  if (healMatch) {
    return [
      `increases healing done to you${healMatch[1]}`,
      `increases healing done to your pet${healMatch[1]}`,
    ];
  }

  const moveMatch = clause.match(
    /^(.*your pet's damage by \d+(?:\.\d+)?%)\s+and\s+you and your pet's movement speed( by \d+(?:\.\d+)?%.*)$/i,
  );
  if (moveMatch) {
    const moveTail = moveMatch[2];
    return [
      moveMatch[1],
      `your movement speed${moveTail}`,
      `your pet's movement speed${moveTail}`,
    ];
  }

  const sharedMoveMatch = clause.match(/you and your pet's movement speed( by \d+(?:\.\d+)?%.*)/i);
  if (sharedMoveMatch) {
    const tail = sharedMoveMatch[1];
    return [`your movement speed${tail}`, `your pet's movement speed${tail}`];
  }

  return [clause];
}

export function splitDescription(description) {
  const clauses = [];
  const segments = description.split(/(?<=[.;])\s+/);

  for (let segment of segments) {
    segment = segment.trim();
    if (!segment) continue;

    const parts = splitSegmentOnAnd(segment);

    for (const part of parts) {
      for (const sub of splitMultiValueClause(part)) {
        if (sub.length > 0) clauses.push(sub);
      }
    }
  }

  return clauses;
}

export function extractCondition(text) {
  const triggerEnd =
    /\s+(there is|you (?:cause|gain|generate|have|will|also)|increas(?:e|es|ed)|reduc(?:e|es|ed)|decreas(?:e|es|ed)|gives?|grants?)/i;
  const patterns = [
    /^(Whenever you[^,.]+)/i,
    /^(When you[^,.]+)/i,
    /^(After you[^,.]+)/i,
    /^(While [^,.]+)/i,
    /^(You have a \d+% chance[^,.]+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      let cond = m[1].trim();
      const endMatch = cond.match(triggerEnd);
      if (endMatch && endMatch.index > 0) {
        cond = cond.slice(0, endMatch.index).trim();
      }
      if (
        cond.length > 5 &&
        !/increas(?:e|es|ed)|reduc(?:e|es|ed)|decreas(?:e|es|ed)$/i.test(cond)
      ) {
        return cond;
      }
    }
  }
  const whileMatch = text.match(/\bwhile (?:in |[^,.]+)/i);
  if (whileMatch) {
    const idx = text.toLowerCase().indexOf("while ");
    if (idx >= 0) {
      const rest = text.slice(idx);
      const end = rest.search(/,|\.| increases| reduces| have a \d+% chance/i);
      if (end > 0) return rest.slice(0, end).trim();
    }
  }
  return null;
}

export function extractSpellNames(text) {
  const names = new Set();

  const ofMatch = text.match(
    /(?:of|for) (?:your )?([A-Z][^.]*?)(?: by |,|\.| and increases| and reduces| and decreases)/,
  );
  if (ofMatch) {
    for (const part of ofMatch[1].split(/,|\s+and\s+/)) {
      const name = part.trim().replace(/^(the |your )/i, "");
      if (name.length > 2 && /^[A-Z]/.test(name)) names.add(name);
    }
  }

  const listAfterOf = text.match(
    /(?:chance|damage|healing|range|critical strike chance) of ([A-Z][^.]*?) by /i,
  );
  if (listAfterOf) {
    for (const part of listAfterOf[1].split(/,|\s+and\s+/)) {
      const name = part.trim();
      if (name.length > 2) names.add(name);
    }
  }

  const yourSpell = text.matchAll(
    /your ([A-Z][a-z]+(?: [A-Z][a-z]+)*) (?:spell|ability|abilities|effect)/gi,
  );
  for (const m of yourSpell) names.add(m[1]);

  const increasesDamage = text.matchAll(
    /(?:damage|healing|range|duration|critical strike chance) of (?:your )?([A-Z][^.]*?)(?: by |,| and)/gi,
  );
  for (const m of increasesDamage) {
    for (const part of m[1].split(/,|\s+and\s+/)) {
      const name = part.trim();
      if (name.length > 2) names.add(name);
    }
  }

  const damageFromYour = text.match(
    /damage from your ([^.]+?)(?: increased| increas)/i,
  );
  if (damageFromYour) {
    for (const part of damageFromYour[1].split(/,|\s+and\s+/)) {
      const name = part.trim();
      if (name.length > 2) names.add(name);
    }
  }

  const damageDoneBy = text.match(
    /damage done by your ([^.]+?)(?: increased| increas)/i,
  );
  if (damageDoneBy) {
    for (const part of damageDoneBy[1].split(/,|\s+and\s+/)) {
      const name = part.trim();
      if (name.length > 2) names.add(name);
    }
  }

  return names.size > 0 ? [...names] : null;
}

export function extractValue(text) {
  const procChance = text.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)% chance to (?:${PROC_CC_VERBS})`, "i"),
  );
  if (procChance) {
    return { typeOfEffect: "percentage", value: parseFloat(procChance[1]) };
  }

  const lessPercent = text.match(/(\d+(?:\.\d+)?)% less/i);
  if (lessPercent) {
    return { typeOfEffect: "percentage", value: parseFloat(lessPercent[1]) };
  }

  const percentMatch = text.match(/by (\d+(?:\.\d+)?)%/i);
  if (percentMatch) {
    return { typeOfEffect: "percentage", value: parseFloat(percentMatch[1]) };
  }

  const additionalPercent = text.match(/by an additional (\d+(?:\.\d+)?)%/i);
  if (additionalPercent) {
    return { typeOfEffect: "percentage", value: parseFloat(additionalPercent[1]) };
  }

  const yardMatch = text.match(/by (\d+(?:\.\d+)?) yards?/i);
  if (yardMatch) {
    return { typeOfEffect: "distance", value: parseFloat(yardMatch[1]) };
  }

  const secMatch = text.match(/(?:for |lasts |up to )(\d+(?:\.\d+)?) sec/i);
  if (secMatch && !/by \d+%/i.test(text)) {
    return { typeOfEffect: "duration", value: parseFloat(secMatch[1]) };
  }

  const flatMatch = text.match(
    /(?:by |up to |generate[s]? |gain[s]? |award[s]? |decreases? the swing time of your [^ ]+ ability by )(\d+(?:\.\d+)?)(?!%)/i,
  );
  if (flatMatch) {
    const isSwing = /swing time/i.test(text);
    return {
      typeOfEffect: isSwing ? "duration" : "flat",
      value: parseFloat(flatMatch[1]),
    };
  }

  if (/no longer|cannot be|can no longer|allows you|enables you|gives your/i.test(text)) {
    return { typeOfEffect: "boolean", value: undefined };
  }

  return { typeOfEffect: null, value: undefined };
}

export function detectSchool(text) {
  const lower = text.toLowerCase();
  for (const school of SCHOOLS) {
    if (new RegExp(`\\b${school}\\b`).test(lower)) return school;
  }
  return null;
}

export function extractScope(text) {
  const lower = text.toLowerCase();
  const scope = {};

  if (/melee critical|melee attack|melee damage|melee hit|melee weapon|in melee/i.test(lower)) {
    scope.attackType = "melee";
  } else if (/ranged critical|ranged attack|ranged damage|ranged weapon/i.test(lower)) {
    scope.attackType = "ranged";
  } else if (
    /\bspell\b|spells and abilities|with spells|your spells|fireball|frostbolt|shadow bolt/i.test(
      lower,
    ) &&
    !/weapon/i.test(lower)
  ) {
    scope.attackType = "spell";
  } else if (/with weapons|weapon swing|weapon damage/i.test(lower) && !/\bspell\b/i.test(lower)) {
    scope.attackType = "melee";
  }

  const school = detectSchool(text);
  if (school && /\bspell\b|damage|critical|resist|school/i.test(lower)) {
    scope.school = school;
  }

  return Object.keys(scope).length > 0 ? scope : undefined;
}

function extractRecurrence(text) {
  const match = text.match(/per (\d+(?:\.\d+)?) sec/i);
  if (!match) return {};
  return {
    recurrence: true,
    recurrenceInSeconds: parseFloat(match[1]),
  };
}

function normalizeStatForScope(stat, scope) {
  if (!scope?.school) return stat;
  if (stat.startsWith("schoolDamage_")) return "damageDone";
  if (stat.startsWith("schoolResist_")) return "damageTaken";
  return stat;
}

function isExplicitReduction(text) {
  return /reduc(?:e|es|ed)|decreas(?:e|es|ed)|less |lower /i.test(text);
}

function isOffensiveDamageAmp(text) {
  const lower = text.toLowerCase();
  if (isPetTargetedClause(text)) return false;
  if (/damage from your/.test(lower) && /increas/i.test(lower)) return true;
  if (/damage done by your/.test(lower) && /increas/i.test(lower)) return true;
  if (/damage caused by/.test(lower) && /increas/i.test(lower)) return true;
  if (/your damage from/.test(lower) && /increas/i.test(lower)) return true;
  if (/increas(?:e|es|ed).*(?:damage done|damage caused)/i.test(lower)) return true;
  if (/periodic damage from your/.test(lower) && /grant|increas/i.test(lower)) return true;
  if (/grants the periodic damage from your/.test(lower)) return true;
  return false;
}

function isDebuffDamageAmp(text) {
  const lower = text.toLowerCase();
  if (/increas(?:e|es|ed).*(?:more damage)/i.test(lower) && /target|enemies|enemy|all sources/i.test(lower)) {
    return true;
  }
  if (/increas(?:e|es|ed).*(?:damage taken by the target|damage taken by your target)/i.test(lower)) {
    return true;
  }
  // "increases spell/disease/magic damage taken by N%" on debuff application
  if (
    /increas(?:e|es|ed).+(?:spell |magic |physical |disease )?damage taken by \d/i.test(lower) &&
    !/taken from|you take|your damage taken from|reduces? your damage taken/i.test(lower)
  ) {
    return true;
  }
  return false;
}

function isPlayerBeneficiaryExplicit(lower) {
  if (/damage caused by you\b|damage done by you\b|all damage caused by you\b/i.test(lower)) {
    return true;
  }
  if (/all damage you deal/i.test(lower)) return true;
  if (/you take|you cause|damage you take|your damage taken from/i.test(lower)) {
    return true;
  }
  if (/your armor contribution from items/i.test(lower)) return true;
  if (/mana cost of your (?:mend pet|revive pet)/i.test(lower)) return true;
  if (/(?:revive pet|mend pet).*(?:mana cost|casting time|cast time)/i.test(lower)) {
    return true;
  }
  if (/revive pet's casting time/i.test(lower)) return true;
  if (/casting time of your .*(?:summoning spells|summon)/i.test(lower)) return true;
  if (/cooldown of your (?:demonic empowerment|metamorphosis|fel domination)/i.test(lower)) {
    return true;
  }
  if (/increases your (?:fire|shadow|frost|arcane|nature|holy|physical) damage/i.test(lower)) {
    return true;
  }
  if (/increase your spell critical/i.test(lower)) return true;
  if (/reduces? the cooldown on (?:raise dead|army of the dead)/i.test(lower)) {
    return true;
  }
  if (/increases healing done to you\b/i.test(lower)) return true;
  if (/^you will regenerate/i.test(lower)) return true;
  return false;
}

function isPetTargetedClause(text) {
  const lower = text.toLowerCase();
  if (isPlayerBeneficiaryExplicit(lower)) return false;

  if (
    /health transferred|amount of health transferred/i.test(lower) &&
    /health funnel|funnel/i.test(lower)
  ) {
    return true;
  }
  if (
    /damage done by your (?:pet|pets|treant|treants|ghoul|ghouls|demon|felguard|minion|imp)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /(?:your )?(?:pet|pets|summoned demon|ghoul|felguard|minion|treants?|voidwalker|succubus)\s+takes?\s+.*less damage/i.test(
      lower,
    ) ||
    /\bimp\s+takes?\s+.*less damage/i.test(lower)
  ) {
    return true;
  }
  if (/(?:health|armor) of your (?:pet|pets)/i.test(lower)) return true;
  if (/increases the health of your pet/i.test(lower)) return true;
  if (/your pet(?:'s)?\s+special abilities/i.test(lower)) return true;
  if (
    /your pet's (?:chance to dodge|melee attack speed|movement speed|attack power|ranged attack power)/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (/cause your pet(?:'s)?(?: next \d+)? special attacks to critically hit/i.test(lower)) {
    return true;
  }
  if (/your pet to generate/i.test(lower)) return true;
  if (/heal your pet/i.test(lower)) return true;
  if (/increases healing done to your pet/i.test(lower)) return true;
  if (/your ghouls get/i.test(lower)) return true;
  if (/reduces? all damage your summoned demon takes/i.test(lower)) return true;
  if (/your summoned demon's critical/i.test(lower)) return true;
  if (/\byour (?:imp|voidwalker|succubus|felhunter|felguard|fel guard)'s\b/i.test(lower)) {
    return true;
  }
  if (/your felhunter regains/i.test(lower)) return true;
  if (/effect of your (?:imp|felhunter)'s/i.test(lower)) return true;
  if (/stamina and intellect of your (?:imp|voidwalker|succubus|felhunter|felguard)/i.test(lower)) {
    return true;
  }
  if (/^(?:voidwalker|felhunter|felguard|fel guard)\s*-\s*reduces?/i.test(lower.trim())) {
    return true;
  }
  if (/from the pet each tick/i.test(lower) || /cleansing .* from the pet/i.test(lower)) {
    return true;
  }
  if (/summoned demon gains/i.test(lower)) return true;
  if (/your summoned demon equal to .* maximum mana/i.test(lower)) return true;
  if (
    /reduces? the (?:cooldown|casting time) of your (?:imp|succubus|felhunter)'s/i.test(lower)
  ) {
    return true;
  }
  if (/attack power bonus on your felguard/i.test(lower)) return true;
  if (/effectiveness of your (?:voidwalker|felguard|imp|succubus|pet)/i.test(lower)) {
    return true;
  }
  if (/your pet returns with/i.test(lower)) return true;
  if (/your pet will regenerate/i.test(lower)) return true;
  if (/damage your pet takes/i.test(lower)) return true;
  if (/pet takes .* less damage/i.test(lower)) return true;
  if (
    /\byour pets?\b(?:'s)?\s+(?!is\b)/i.test(lower) &&
    /increas|reduc|less damage|health|armor|regenerat|heal|damage done|damage takes|movement speed|dodge|generate/i.test(
      lower,
    )
  ) {
    return true;
  }
  if (
    /\b(?:summoned demon|your demon|ghoul|felguard|treants?)\b/i.test(lower) &&
    /takes?.*less damage|health|armor|damage done|damage takes/i.test(lower)
  ) {
    return true;
  }
  return false;
}

function classifyPetSubcategory(lower) {
  if (
    /movement speed|cleansing|from the pet each tick|seduction|lash of pain|firebolt spell|summoned demon gains|regains .* mana|your summoned demon equal to/i.test(
      lower,
    )
  ) {
    return "utility";
  }
  if (
    /damage done|damage caused|damage from your treant|effectiveness of your|effect of your (?:imp|felhunter)'s|your pet's damage/i.test(
      lower,
    )
  ) {
    return "damageIncrease";
  }
  if (
    /attack power|crit|haste|hit|expertise|special abilities|dodge|ghouls get|stamina and intellect|attack speed/i.test(
      lower,
    )
  ) {
    return "statIncrease";
  }
  if (
    /health|armor|damage taken|less damage|healing|transferred|regenerat|returns with|summoned demon takes|demon takes/i.test(
      lower,
    )
  ) {
    return "defense";
  }
  return "utility";
}

function classifyPetStat(lower, subcategory) {
  if (subcategory === "damageIncrease") return "petDamage";
  if (subcategory === "statIncrease") {
    if (/dodge/i.test(lower)) return "dodgeChance";
    if (/crit/i.test(lower)) return "critChance";
    if (/haste|attack speed/i.test(lower)) return "haste";
    return "petAttackPower";
  }
  if (subcategory === "defense") {
    if (/armor/i.test(lower)) return "petArmor";
    if (/damage taken|less damage|damage takes|demon takes|summoned demon takes/i.test(lower)) {
      return "petDamageTaken";
    }
    return "petHealth";
  }
  if (/movement speed/i.test(lower)) return "movementSpeed";
  return "petUtility";
}

function isPetBeneficiaryMisclassified(phrase, category) {
  if (category === "pet") return false;
  const lower = phrase.toLowerCase();
  if (isPlayerBeneficiaryExplicit(lower)) return false;
  if (
    /damage caused by you\b.*while your pet is active/i.test(phrase) ||
    /increases your (?:fire|shadow|frost|arcane|nature|holy|physical) damage/i.test(phrase) ||
    /increase your spell critical/i.test(phrase) ||
    /revive pet's casting time/i.test(phrase) ||
    /casting time of your .*(?:summoning spells|summon)/i.test(phrase) ||
    /cooldown of your (?:demonic empowerment|metamorphosis|fel domination)/i.test(phrase) ||
    /mana cost of your mend pet/i.test(phrase)
  ) {
    return false;
  }
  return isPetTargetedClause(phrase);
}

function isSelfDamageReduction(text) {
  const lower = text.toLowerCase();
  if (isPetTargetedClause(text)) return false;
  if (isOffensiveDamageAmp(text) || isDebuffDamageAmp(text)) return false;
  if (/damage from your/.test(lower) && !/taken/i.test(lower)) return false;

  return (
    /(?:you |your )?(?:take|takes|taking).*(?:less|reduced|fewer).*(?:damage|magic|physical)/i.test(
      text,
    ) ||
    /reduces? (?:your )?(?:damage|magic damage|physical damage|all damage) taken(?: from)?/i.test(
      lower,
    ) ||
    /reduces? (?:the )?(?:damage|magic damage|physical damage) (?:you )?take/i.test(lower) ||
    /less damage taken/i.test(lower) ||
    /you take \d+% less damage/i.test(lower) ||
    /(?:all )?(?:spell |magic )?damage taken by \d+%/i.test(lower)
  );
}

function isTargetDamageReduction(text) {
  return /reduces? (?:your )?target'?s? .*damage taken/i.test(text);
}

function isProcCc(text) {
  return new RegExp(`\\d+(?:\\.\\d+)?% chance to (?:${PROC_CC_VERBS})`, "i").test(
    text,
  );
}

function applyReductionSign(valueInfo, isReduction) {
  if (
    isReduction &&
    valueInfo.value !== undefined &&
    valueInfo.typeOfEffect === "percentage"
  ) {
    valueInfo.value = -Math.abs(valueInfo.value);
  }
}

export function classifyClause(text) {
  const lower = text.toLowerCase();
  const school = detectSchool(text);
  const valueInfo = extractValue(text);
  const spellNames = extractSpellNames(text);
  let condition = extractCondition(text);

  const isReduction = isExplicitReduction(text);
  const isProc = /chance|whenever|when you|after you|gain the|grants? you the|launch a free/i.test(
    lower,
  );

  let category;
  let subcategory;
  let stat;
  let confidence = "high";

  if (isProcCc(text)) {
    category = "utility";
    subcategory = "crowdControl";
    const ccMatch = lower.match(new RegExp(`chance to (${PROC_CC_VERBS})`));
    stat = ccMatch ? ccMatch[1] : "procChance";
    if (!valueInfo.typeOfEffect) {
      valueInfo.typeOfEffect = "percentage";
    }
    const dazeDuration = text.match(/for (\d+(?:\.\d+)?) sec/i);
    if (dazeDuration && !text.match(/by \d+%/)) {
      // keep proc chance as primary value; duration stored if no percent in clause
    }
  } else if (isPetTargetedClause(text)) {
    category = "pet";
    subcategory = classifyPetSubcategory(lower);
    stat = classifyPetStat(lower, subcategory);
    if (
      subcategory === "defense" &&
      (isReduction || /less damage|damage taken|damage takes|demon takes/i.test(lower))
    ) {
      applyReductionSign(valueInfo, true);
    }
  } else if (
    /healing done to you|healing you receive|healing received|increases healing done to you/i.test(
      lower,
    )
  ) {
    category = "heal";
    subcategory = "healingReceived";
    stat = "healingReceived";
  } else if (
    /\bhealing\b|amount healed|heals\b|health restored|amount of health restored/i.test(lower) &&
    !/damage/i.test(lower) &&
    !/% of your total health/i.test(lower)
  ) {
    category = "heal";
    if (/over time|periodic heal/i.test(lower)) {
      subcategory = "hot";
      stat = "hotHealing";
    } else if (/received|absorb/i.test(lower)) {
      subcategory = "healingReceived";
      stat = /absorb/i.test(lower) ? "absorbAmount" : "healingReceived";
    } else if (/mana cost/i.test(lower)) {
      subcategory = "manaEfficiency";
      stat = "manaCost";
    } else {
      subcategory = "healingDone";
      stat = /amount healed/i.test(lower) ? "amountHealed" : "healingDone";
    }
  } else if (/bleed effects?/i.test(lower) && /effectiveness/i.test(lower)) {
    category = "damage";
    subcategory = "dotPeriodic";
    stat = "bleedDamage";
  } else if (/critical strike damage|crit damage/i.test(lower)) {
    category = "damage";
    subcategory = "critDamage";
    stat = "critDamageBonus";
  } else if (
    /critical strike chance|critically hit|chance to crit|critical effect chance|spell critical effect chance/i.test(
      lower,
    )
  ) {
    category = "damage";
    subcategory = "critChance";
    stat = "critChance";
  } else if (isDebuffDamageAmp(text)) {
    category = "damage";
    subcategory = "directDamage";
    stat = /disease/i.test(lower)
      ? "dotDamage"
      : /spell/i.test(lower)
        ? "spellDamage"
        : "damageDone";
  } else if (isOffensiveDamageAmp(text)) {
    category = "damage";
    subcategory = "directDamage";
    if (/melee critical|melee crit/i.test(lower)) {
      stat = "meleeDamage";
    } else if (/periodic|dot/i.test(lower)) {
      stat = "dotDamage";
    } else {
      stat = "damageDone";
    }
  } else if (isTargetDamageReduction(text)) {
    category = "defense";
    subcategory = "damageReduction";
    stat = /physical/i.test(lower) ? "physicalDamageTaken" : "damageTaken";
    applyReductionSign(valueInfo, true);
  } else if (isSelfDamageReduction(text)) {
    category = "defense";
    subcategory = "damageReduction";
    stat = school
      ? `schoolResist_${school}`
      : /magic|spell/i.test(lower)
        ? "magicDamageTaken"
        : /physical/i.test(lower)
          ? "physicalDamageTaken"
          : "damageTaken";
    const shouldNegate =
      isReduction || /reduces?|less |decreas/i.test(lower);
    applyReductionSign(valueInfo, shouldNegate);
  } else if (/\barmor\b|armor value|armor contribution|armor bonus/i.test(lower)) {
    category = "defense";
    subcategory = "armor";
    stat = /bear form|dire bear/i.test(lower)
      ? "bearFormArmor"
      : /devotion aura/i.test(lower)
        ? "devotionAuraArmor"
        : "armor";
  } else if (/dodge/i.test(lower)) {
    category = "defense";
    subcategory = "avoidance";
    stat = "dodgeChance";
  } else if (/parry/i.test(lower)) {
    category = "defense";
    subcategory = "avoidance";
    stat = "parryChance";
  } else if (/block/i.test(lower)) {
    category = "defense";
    subcategory = "avoidance";
    stat = /block value/i.test(lower) ? "blockValue" : "blockChance";
  } else if (/resist/i.test(lower)) {
    category = "defense";
    subcategory = "resist";
    stat = school ? `schoolResist_${school}` : "allResistances";
  } else if (/shield|absorb.*damage|anti-magic shell/i.test(lower)) {
    category = "defense";
    subcategory = "shield";
    stat = /anti-magic/i.test(lower) ? "antiMagicShell" : "shieldAbsorb";
  } else if (
    /\bhealth\b|\bstamina\b|total health/i.test(lower) &&
    !/\bheal(?:ing|s)\b/i.test(lower) &&
    !/health cost/i.test(lower)
  ) {
    category = "defense";
    subcategory = "health";
    stat = /stamina/i.test(lower) ? "stamina" : "health";
  } else if (/runic power/i.test(lower)) {
    category = "resource";
    subcategory = "runicPower";
    stat = /generat/i.test(lower) ? "runicPowerGenerated" : "runicPower";
  } else if (/\brage\b/i.test(lower)) {
    category = "resource";
    subcategory = "rage";
    stat = /generat/i.test(lower) ? "rageGenerated" : "rage";
  } else if (/\benergy\b/i.test(lower)) {
    category = "resource";
    subcategory = "energy";
    stat = "energy";
  } else if (/\bfocus\b/i.test(lower)) {
    category = "resource";
    subcategory = "focus";
    stat = "focus";
  } else if (/cooldown/i.test(lower)) {
    category = "resource";
    subcategory = "cooldown";
    stat = "cooldownReduction";
    applyReductionSign(valueInfo, isReduction);
  } else if (/mana cost|health cost|cost of your|cost to/i.test(lower)) {
    category = "resource";
    subcategory = "cost";
    stat = /health cost/i.test(lower) ? "abilityCost" : "manaCost";
    applyReductionSign(valueInfo, isReduction);
  } else if (/\bmana\b/i.test(lower)) {
    category = "resource";
    subcategory = /regenerat|recover/i.test(lower) ? "regen" : "mana";
    stat = /regenerat|recover/i.test(lower) ? "manaRegen" : "mana";
  } else if (/threat/i.test(lower)) {
    category = "utility";
    subcategory = "threat";
    stat = "threatGenerated";
    applyReductionSign(valueInfo, isReduction);
  } else if (/movement speed|movement slowing|slowed|snared/i.test(lower)) {
    category = "utility";
    subcategory = /slow|snare/i.test(lower) ? "crowdControl" : "movement";
    stat = /slow|snare/i.test(lower) ? "snare" : "movementSpeed";
    applyReductionSign(valueInfo, isReduction);
  } else if (/cast(?:ing)? time|channel/i.test(lower)) {
    category = "utility";
    subcategory = "castTime";
    stat = /channel/i.test(lower) ? "channelTime" : "castTime";
    applyReductionSign(valueInfo, isReduction);
  } else if (/duration/i.test(lower)) {
    category = "utility";
    subcategory = "duration";
    stat = /debuff|disarm|stun|fear/i.test(lower) ? "debuffDuration" : "effectDuration";
  } else if (/\brange\b/i.test(lower)) {
    category = "damage";
    subcategory = "range";
    stat = "range";
  } else if (/stun|fear|silence|root|disarm|charm|sleep/i.test(lower)) {
    category = "utility";
    subcategory = "crowdControl";
    stat = /stun/i.test(lower)
      ? "stun"
      : /fear/i.test(lower)
        ? "fear"
        : /silence/i.test(lower)
          ? "silence"
          : /disarm/i.test(lower)
            ? "disarm"
            : "snare";
  } else if (/dispel/i.test(lower)) {
    category = "utility";
    subcategory = "dispel";
    stat = /no longer be dispelled|cannot be dispelled/i.test(lower)
      ? "dispelResistance"
      : "dispelChance";
    if (/no longer|cannot/i.test(lower)) {
      valueInfo.typeOfEffect = "boolean";
    }
  } else if (/attack power/i.test(lower)) {
    category = "damage";
    subcategory = "attackPower";
    stat = /armor/i.test(lower) ? "attackPowerFromArmor" : "attackPower";
  } else if (/spell power|bonus damage effects/i.test(lower)) {
    category = "damage";
    subcategory = "spellPower";
    stat = /spirit/i.test(lower) ? "spellPowerFromSpirit" : "spellPower";
  } else if (
    /two-handed|one-handed|dual wield|mace|axe|sword|dagger|polearm|fist weapon/i.test(lower)
  ) {
    category = "damage";
    subcategory = "weaponSpecialization";
    stat = /two-handed/i.test(lower) ? "twoHandWeaponDamage" : "weaponDamage";
  } else if (/periodic|over time/i.test(lower) && /damage/i.test(lower)) {
    category = "damage";
    subcategory = "dotPeriodic";
    stat = "dotDamage";
  } else if (/expertise/i.test(lower)) {
    category = "damage";
    subcategory = "expertise";
    stat = "expertise";
  } else if (/haste|attack speed/i.test(lower)) {
    category = "damage";
    subcategory = "haste";
    stat = /attack speed/i.test(lower) ? "attackSpeed" : "haste";
  } else if (/hit chance|chance.*hit you|chance to hit/i.test(lower)) {
    category = "damage";
    subcategory = "hit";
    stat = "hitChance";
  } else if (
    /total strength|total agility|total stamina|total intellect|total spirit|all attributes|your agility by|your intellect by|your strength by|your stamina by|your spirit by/i.test(
      lower,
    )
  ) {
    category = /stamina/i.test(lower) ? "defense" : /intellect|spirit/i.test(lower) ? "resource" : "damage";
    subcategory = /stamina/i.test(lower)
      ? "health"
      : /intellect|spirit/i.test(lower)
        ? "mana"
        : "attackPower";
    stat = /strength/i.test(lower)
      ? "strength"
      : /agility/i.test(lower)
        ? "agility"
        : /stamina/i.test(lower)
          ? "stamina"
          : /intellect/i.test(lower)
            ? "intellect"
            : /spirit/i.test(lower)
              ? "spirit"
              : "allAttributes";
  } else if (/increases the effect of your|increases the effects of your/i.test(lower)) {
    category = /heal|rejuvenation|renew|wisdom/i.test(lower)
      ? "heal"
      : /armor|inner fire|mark of the wild/i.test(lower)
        ? "defense"
        : "utility";
    subcategory = /heal|rejuvenation|renew/i.test(lower)
      ? "healingDone"
      : /wisdom|mana/i.test(lower)
        ? "manaEfficiency"
        : "procMechanic";
    stat = /rejuvenation|renew/i.test(lower)
      ? "hotHealing"
      : /wisdom/i.test(lower)
        ? "manaRegen"
        : /inner fire|mark of the wild/i.test(lower)
          ? "armor"
          : "grantsBuff";
  } else if (/pushback/i.test(lower)) {
    category = "utility";
    subcategory = "castTime";
    stat = "channelTime";
    confidence = "medium";
  } else if (/allows one-hand|allows you to equip|enables you to equip/i.test(lower)) {
    category = "utility";
    subcategory = "procMechanic";
    stat = "grantsBuff";
    valueInfo.typeOfEffect = "boolean";
  } else if (/now usable while|usable while in combat/i.test(lower)) {
    category = "utility";
    subcategory = "procMechanic";
    stat = "grantsBuff";
    valueInfo.typeOfEffect = "boolean";
  } else if (/remove all movement impairing|movement impairing effects/i.test(lower)) {
    category = "utility";
    subcategory = "movement";
    stat = "movementSpeed";
    valueInfo.typeOfEffect = "boolean";
  } else if (/becomes a death rune|become death runes|becomes an? death rune/i.test(lower)) {
    category = "utility";
    subcategory = "procMechanic";
    stat = "procChance";
    valueInfo.typeOfEffect = "percentage";
    if (/100% chance/.test(lower)) valueInfo.value = 100;
    condition = condition || extractCondition(text);
  } else if (/entrap|preventing them from moving/i.test(lower)) {
    category = "utility";
    subcategory = "crowdControl";
    stat = "root";
    valueInfo.typeOfEffect = "boolean";
  } else if (/amount drained|drain life|drain soul/i.test(lower)) {
    category = "damage";
    subcategory = "dotPeriodic";
    stat = "dotDamage";
  } else if (/combat ratings gained/i.test(lower)) {
    category = "damage";
    subcategory = "hit";
    stat = "hitChance";
    confidence = "medium";
  } else if (/swing time/i.test(lower)) {
    category = "damage";
    subcategory = "haste";
    stat = "attackSpeed";
    if (isReduction && valueInfo.value && valueInfo.typeOfEffect === "duration") {
      valueInfo.value = -Math.abs(valueInfo.value);
    }
  } else if (/number of charges/i.test(lower)) {
    category = "utility";
    subcategory = "procMechanic";
    stat = "grantsBuff";
  } else if (/you cause damage equal to/i.test(lower)) {
    category = "utility";
    subcategory = "procMechanic";
    stat = "procChance";
    confidence = "medium";
  } else if (
    /generat.*\d+ rage|will generate \d+ rage|\d+ rage/i.test(lower) &&
    !/% of your total health/i.test(lower)
  ) {
    category = "resource";
    subcategory = "rage";
    stat = "rageGenerated";
    confidence = "medium";
  } else if (/% of your total health/i.test(lower)) {
    category = "defense";
    subcategory = "health";
    stat = "healthRegen";
    valueInfo.typeOfEffect = "percentage";
  } else if (/damage|spell damage|weapon damage|bleed damage|bonus damage/i.test(lower)) {
    category = "damage";
    if (school) {
      subcategory = "schoolDamage";
      stat = `schoolDamage_${school}`;
    } else if (/bleed/i.test(lower)) {
      subcategory = "directDamage";
      stat = "bleedDamage";
    } else if (/spell damage/i.test(lower)) {
      subcategory = /caused by/i.test(lower) ? "spellPower" : "directDamage";
      stat = /caused by/i.test(lower) ? "spellDamage" : "damageDone";
    } else if (/weapon|melee|ranged/i.test(lower)) {
      subcategory = "weaponSpecialization";
      stat = /ranged/i.test(lower) ? "rangedDamage" : "weaponDamage";
    } else {
      subcategory = "directDamage";
      stat = "damageDone";
    }
  } else if (isProc) {
    category = "utility";
    subcategory = "procMechanic";
    stat = /free /i.test(lower)
      ? "freeCast"
      : /gain the|grants? you/i.test(lower)
        ? "grantsBuff"
        : "procChance";
    confidence = valueInfo.typeOfEffect ? "medium" : "low";
  } else {
    return null;
  }

  if (!valueInfo.typeOfEffect) {
    confidence = confidence === "high" ? "medium" : confidence;
  }

  if (isProc && !condition) {
    condition = extractCondition(text);
  }

  const scope = extractScope(text);
  stat = normalizeStatForScope(stat, scope);
  const recurrenceInfo = extractRecurrence(text);

  const effect = {
    category,
    subcategory,
    stat,
    typeOfEffect: valueInfo.typeOfEffect ?? "boolean",
    condition: condition || null,
    spellNames,
    spellIds: null,
    confidence,
    sourcePhrase: text.length > 160 ? text.slice(0, 157) + "…" : text,
    ...recurrenceInfo,
  };

  if (scope) {
    effect.scope = scope;
  }

  if (valueInfo.value !== undefined) {
    effect.value = valueInfo.value;
  }

  return effect;
}

export function toStorableEffect(effect) {
  const stored = {
    category: effect.category,
    subcategory: effect.subcategory,
    stat: effect.stat,
    typeOfEffect: effect.typeOfEffect,
  };
  if (effect.value !== undefined) stored.value = effect.value;
  if (effect.condition != null) stored.condition = effect.condition;
  if (effect.recurrence) stored.recurrence = effect.recurrence;
  if (effect.recurrenceInSeconds !== undefined) {
    stored.recurrenceInSeconds = effect.recurrenceInSeconds;
  }
  if (effect.scope) stored.scope = effect.scope;
  if (effect.spellNames?.length) stored.spellNames = effect.spellNames;
  if (effect.spellIds?.length) stored.spellIds = effect.spellIds;
  return stored;
}

export function parseTalent(talent) {
  const description = talent.description || "";
  const clauses = splitDescription(description).flatMap(expandDualBeneficiaryClauses);
  const effects = [];
  let pendingCondition = null;

  for (const clause of clauses) {
    let workingClause = clause;
    const leadingCondition = extractCondition(clause);
    if (
      leadingCondition &&
      leadingCondition.length > 8 &&
      !/increas(?:e|es|ed)|reduc(?:e|es|ed)|decreas(?:e|es|ed)|gives?|grants?|you have a \d+% chance to|you will regenerate/i.test(
        leadingCondition,
      )
    ) {
      pendingCondition = leadingCondition;
      workingClause = clause
        .replace(leadingCondition, "")
        .trim()
        .replace(/^,/, "")
        .trim();
    }

    const effect = classifyClause(workingClause);
    if (effect) {
      if (pendingCondition && !effect.condition) {
        effect.condition = pendingCondition;
      }
      if (!effect.condition) {
        const whileIn = workingClause.match(/\bwhile (?:in )?[^,]+(?=\s+by\s)/i);
        if (whileIn) effect.condition = whileIn[0].trim();
      }
      const whileBarkskin = workingClause.match(
        /while you have [^,]+(?=\s+have a \d+% chance)/i,
      );
      if (whileBarkskin) effect.condition = whileBarkskin[0].trim();
      effects.push(effect);
      pendingCondition = null;
    } else if (/whenever|when you|after you|while |you have a \d+% chance/i.test(clause)) {
      pendingCondition = clause.replace(/\.$/, "");
    }
  }

  const reviewFlags = [];
  if (effects.length === 0) reviewFlags.push("no_effects_parsed");
  if (effects.length > 1) reviewFlags.push("multi_effect");
  const types = new Set(effects.map((e) => e.typeOfEffect));
  if (types.size > 1) reviewFlags.push("mixed_value_types");
  if (effects.some((e) => e.confidence === "low")) reviewFlags.push("low_confidence");
  if (effects.some((e) => e.confidence === "medium")) reviewFlags.push("medium_confidence");
  if (description.length < 50 && effects.length <= 1) reviewFlags.push("short_description");

  return {
    externalId: talent.externalId,
    name: talent.name,
    wotlkClass: talent.wotlkClass,
    treeName: talent.treeName,
    description,
    effects,
    reviewFlags,
    clauseCount: clauses.length,
  };
}

export function buildReviewReport(parsed, previousSeed = null) {
  const suspicious = [];

  for (const talent of parsed) {
    const talentIssues = [];

    if (talent.clauseCount !== talent.effects.length) {
      talentIssues.push({
        type: "clause_effect_mismatch",
        clauseCount: talent.clauseCount,
        effectCount: talent.effects.length,
      });
    }

    for (const effect of talent.effects) {
      const phrase = effect.sourcePhrase || "";
      if (
        /increas/i.test(phrase) &&
        effect.category === "defense" &&
        effect.subcategory === "damageReduction"
      ) {
        talentIssues.push({
          type: "increased_classified_as_reduction",
          sourcePhrase: phrase,
          effect: {
            category: effect.category,
            subcategory: effect.subcategory,
            stat: effect.stat,
            value: effect.value,
          },
        });
      }
      if (
        effect.category === "defense" &&
        effect.subcategory === "damageReduction" &&
        effect.value > 0 &&
        !/less|reduc|decreas/i.test(phrase) &&
        !/(?:spell |magic |all )?damage taken by \d+%/i.test(phrase)
      ) {
        talentIssues.push({
          type: "positive_reduction_without_less",
          sourcePhrase: phrase,
          value: effect.value,
        });
      }
      if (
        /chance to (?:daze|stun|fear|silence|root|disarm)/i.test(phrase) &&
        effect.category === "defense"
      ) {
        talentIssues.push({
          type: "proc_cc_as_defense",
          sourcePhrase: phrase,
        });
      }
      if (isPetBeneficiaryMisclassified(phrase, effect.category)) {
        talentIssues.push({
          type: "pet_misclassified",
          sourcePhrase: phrase,
          effect: {
            category: effect.category,
            subcategory: effect.subcategory,
            stat: effect.stat,
          },
        });
      }
      if (effect.confidence !== "high") {
        talentIssues.push({
          type: "low_confidence",
          confidence: effect.confidence,
          sourcePhrase: phrase,
        });
      }
    }

    if (talentIssues.length > 0) {
      suspicious.push({
        externalId: talent.externalId,
        name: talent.name,
        issues: talentIssues,
      });
    }
  }

  const diff = [];
  if (previousSeed?.effectsByExternalId) {
    for (const talent of parsed) {
      const prev = previousSeed.effectsByExternalId[talent.externalId];
      if (!prev) continue;
      const next = talent.effects.map(toStorableEffect);
      const prevSig = JSON.stringify(prev);
      const nextSig = JSON.stringify(next);
      if (prevSig !== nextSig) {
        diff.push({
          externalId: talent.externalId,
          name: talent.name,
          before: prev,
          after: next,
        });
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    talentCount: parsed.length,
    suspiciousCount: suspicious.length,
    suspicious,
    diffCount: diff.length,
    diff,
    summary: {
      effectsParsed: parsed.reduce((n, t) => n + t.effects.length, 0),
      highConfidence: parsed.reduce(
        (n, t) => n + t.effects.filter((e) => e.confidence === "high").length,
        0,
      ),
      mediumConfidence: parsed.reduce(
        (n, t) => n + t.effects.filter((e) => e.confidence === "medium").length,
        0,
      ),
      lowConfidence: parsed.reduce(
        (n, t) => n + t.effects.filter((e) => e.confidence === "low").length,
        0,
      ),
      increasedAsReduction: suspicious.filter((s) =>
        s.issues.some((i) => i.type === "increased_classified_as_reduction"),
      ).length,
      procCcAsDefense: suspicious.filter((s) =>
        s.issues.some((i) => i.type === "proc_cc_as_defense"),
      ).length,
      clauseMismatches: suspicious.filter((s) =>
        s.issues.some((i) => i.type === "clause_effect_mismatch"),
      ).length,
      petMisclassified: suspicious.filter((s) =>
        s.issues.some((i) => i.type === "pet_misclassified"),
      ).length,
    },
  };
}
