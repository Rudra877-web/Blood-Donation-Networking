import { env } from '../config/env';

export interface EligibilityInput {
  lastDonationDate: Date | null;
  weightKg: number | null;
}

/** Donor eligibility: minimum gap since last donation (+ minimum weight when known). */
export function checkEligibility(d: EligibilityInput, now = new Date()) {
  const reasons: string[] = [];
  let nextEligibleDate: Date | null = null;
  if (d.lastDonationDate) {
    nextEligibleDate = new Date(d.lastDonationDate.getTime() + env.rules.minDonationGapDays * 86400000);
    if (nextEligibleDate > now) {
      reasons.push(`Next eligible donation date is ${nextEligibleDate.toISOString().slice(0, 10)}`);
    }
  }
  if (d.weightKg != null && d.weightKg < env.rules.minDonorWeightKg) {
    reasons.push(`Minimum weight is ${env.rules.minDonorWeightKg} kg`);
  }
  return { eligible: reasons.length === 0, reasons, nextEligibleDate };
}
