const TITLES = ["kuya", "ate", "tito", "tita", "ninong", "ninang", "lolo", "lola", "tito", "tita"];

// "Ninong John Miguel Diones" -> "Ninong John Miguel"
// "Ninang Keith"              -> "Ninang Keith"
export function shortName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  const hasTitle = TITLES.includes(parts[0].toLowerCase().replace(/[.,]$/, ""));
  const title = hasTitle ? parts[0] : null;
  let rest = hasTitle ? parts.slice(1) : parts;
  if (rest.length >= 2) rest = rest.slice(0, -1); // drop the last word (the surname)
  return [title, ...rest.slice(0, 2)].filter(Boolean).join(" ");
}