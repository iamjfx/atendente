export function formatPhoneBR(value: string) {
  const clean = value.replace(/\D/g, "");
  if (clean.length <= 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  }
  return clean.slice(0, 11).replace(/^(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
}
