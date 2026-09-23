export const STAT_IDS = {
  uncloak: "DBD_UncloakAttack",
  chest: "DBD_DLC7_Camper_Stat1",
  lockOn: "DBD_Chapter27_Slasher_Stat1",
  skillChecks: "DBD_SkillCheckSuccess",
  generators: "DBD_GeneratorPct_float",
  healed: "DBD_HealPct_float",
  sacrifices: "DBD_SacrificedCampers",
  bloodpoints: "DBD_BloodwebPoints",
  lacerations: "DBD_Chapter19_Slasher_Stat1",
} as const;

export const STATS = [
  [STAT_IDS.uncloak, "Uncloak attacks"],
  [STAT_IDS.bloodpoints, "Bloodpoints earned"],
  [STAT_IDS.chest, "Chest searched"],
  [STAT_IDS.skillChecks, "Skill checks"],
  [STAT_IDS.generators, "Generators repaired"],
  [STAT_IDS.healed, "Survivors healed"],
  [STAT_IDS.sacrifices, "Survivor sacrifice"],
  [STAT_IDS.lockOn, "Lock-on mechanic"],
  [STAT_IDS.lacerations, "Max lacerations"],
] as const;
