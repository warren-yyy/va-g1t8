import stats from '@/data/stats.json';

const tokens: Record<string, string> = stats.tokens;

/** Fills {tokens} from stats.json, and fails the build if a token is unknown. */
export function fill(text: string): string {
  return text.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = tokens[key];
    if (value === undefined) {
      throw new Error(`Unknown token ${match} in "${text}". Run npm run data, or fix the wording.`);
    }
    return value;
  });
}
