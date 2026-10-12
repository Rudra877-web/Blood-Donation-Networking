import { BloodGroup } from '@prisma/client';

/**
 * Centralised blood compatibility configuration (red blood cell transfusion).
 * Key = RECIPIENT blood group, value = DONOR blood groups that may give to it.
 * Edit this single table to change compatibility rules for the whole system.
 */
export const DONOR_GROUPS_FOR_RECIPIENT: Record<BloodGroup, BloodGroup[]> = {
  O_NEG: ['O_NEG'],
  O_POS: ['O_POS', 'O_NEG'],
  A_NEG: ['A_NEG', 'O_NEG'],
  A_POS: ['A_POS', 'A_NEG', 'O_POS', 'O_NEG'],
  B_NEG: ['B_NEG', 'O_NEG'],
  B_POS: ['B_POS', 'B_NEG', 'O_POS', 'O_NEG'],
  AB_NEG: ['AB_NEG', 'A_NEG', 'B_NEG', 'O_NEG'],
  AB_POS: ['AB_POS', 'AB_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'O_POS', 'O_NEG'],
};

export const ALL_BLOOD_GROUPS = Object.keys(DONOR_GROUPS_FOR_RECIPIENT) as BloodGroup[];

export const compatibleDonorGroups = (recipient: BloodGroup): BloodGroup[] =>
  DONOR_GROUPS_FOR_RECIPIENT[recipient];

export const canDonate = (donor: BloodGroup, recipient: BloodGroup): boolean =>
  DONOR_GROUPS_FOR_RECIPIENT[recipient].includes(donor);

export const bloodLabel = (g: BloodGroup) => g.replace('_POS', '+').replace('_NEG', '-');
