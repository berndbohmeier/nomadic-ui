export interface ParsedExperiment {
  /** Full folder name. */
  id: string;
  /** Date from a leading `yyyy-mm-dd` prefix (`-` or `_` between parts and after), if valid. */
  date: Date | null;
  /** Name without the date prefix. */
  label: string;
}

const DATE_PREFIX = /^(\d{4})([-_])(\d{2})\2(\d{2})[-_](.+)$/;

export function parseExperimentName(name: string): ParsedExperiment {
  const match = DATE_PREFIX.exec(name);
  if (!match) return { id: name, date: null, label: name };
  const [, y, , m, d, rest] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  const valid =
    date.getUTCFullYear() === Number(y) &&
    date.getUTCMonth() === Number(m) - 1 &&
    date.getUTCDate() === Number(d);
  return valid
    ? { id: name, date, label: rest }
    : { id: name, date: null, label: name };
}
