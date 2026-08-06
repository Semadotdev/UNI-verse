export function ageFromBirthDate(birthDate: Date | null): number | null {
  if (!birthDate) return null;
  return Math.floor(
    (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}

export function isAdult(birthDate: Date | null): boolean {
  const age = ageFromBirthDate(birthDate);
  return age !== null && age >= 18;
}
