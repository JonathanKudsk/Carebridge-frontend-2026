import { decode } from "@toon-format/toon";

export default class ToonObjectMapper {
  static parse(raw) {
    if (raw == null) return null;
    if (typeof raw !== "string") return raw;

    const source = raw.trim();
    if (!source) return null;

    return decode(source);
  }

  static parseArray(raw) {
    const parsed = ToonObjectMapper.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed == null) return [];
    return [parsed];
  }
}
