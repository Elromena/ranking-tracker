import { format, parse } from "date-fns";

export function extractWeekday(range) {
  if (!range) return null;

  const start = range.split(" - ")[0];

  const parsed = parse(start, "yyyy-MM-dd", new Date());

  return format(parsed, "EEE");
}
