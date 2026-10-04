import { TZDate, tz } from "@date-fns/tz";
import { UTCDate } from "@date-fns/utc";
import { describe, expect, it } from "vitest";
import { assertType } from "../_lib/test/index.ts";
import { startOfMinute } from "./index.ts";

describe("startOfMinute", () => {
  const repeatedMinutes = [
    ["Europe/Vienna", "2023-10-29T01:06:45.678Z", "2023-10-29T01:06:00.000Z"],
    [
      "America/New_York",
      "2023-11-05T06:06:45.678Z",
      "2023-11-05T06:06:00.000Z",
    ],
    [
      "Australia/Lord_Howe",
      "2023-04-01T15:15:45.678Z",
      "2023-04-01T15:15:00.000Z",
    ],
  ];

  it("returns the date with the time set to the first millisecond of a minute", () => {
    const date = new Date(2014, 11 /* Dec */, 1, 22, 15, 45, 400);
    const result = startOfMinute(date);
    expect(result).toEqual(new Date(2014, 11 /* Dec */, 1, 22, 15));
  });

  it("accepts a timestamp", () => {
    const date = new Date(2014, 11 /* Dec */, 1, 22, 15).getTime();
    const result = startOfMinute(date);
    expect(result).toEqual(new Date(2014, 11 /* Dec */, 1, 22, 15));
  });

  it("does not mutate the original date", () => {
    const date = new Date(2014, 11 /* Dec */, 1, 22, 15, 45, 400);
    startOfMinute(date);
    expect(date).toEqual(new Date(2014, 11 /* Dec */, 1, 22, 15, 45, 400));
  });

  it("returns `Invalid Date` if the given date is invalid", () => {
    const result = startOfMinute(new Date(NaN));
    expect(result instanceof Date && isNaN(result.getTime())).toBe(true);
  });

  it("resolves the date type by default", () => {
    const result = startOfMinute(Date.now());
    expect(result).toBeInstanceOf(Date);
    assertType<assertType.Equal<Date, typeof result>>(true);
  });

  it("resolves the argument type if a date extension is passed", () => {
    const result = startOfMinute(new UTCDate());
    expect(result).toBeInstanceOf(UTCDate);
    assertType<assertType.Equal<UTCDate, typeof result>>(true);
  });

  it("rounds a UTCDate using its UTC seconds", () => {
    const date = new UTCDate("1890-01-01T00:00:45.678Z");
    const result = startOfMinute(date);
    expect(result).toBeInstanceOf(UTCDate);
    expect(result.toISOString()).toBe("1890-01-01T00:00:00.000Z");
    expect(date.toISOString()).toBe("1890-01-01T00:00:45.678Z");
  });

  it.each(repeatedMinutes)(
    "preserves the repeated minute of a TZDate in %s",
    (timeZone, input, expected) => {
      const date = new TZDate(input, timeZone);
      const result = startOfMinute(date);
      expect(result).toBeInstanceOf(TZDate);
      expect(result.timeZone).toBe(timeZone);
      expect(+result).toBe(+new Date(expected));
      expect(+startOfMinute(result)).toBe(+result);
      expect(+date).toBe(+new Date(input));
      assertType<assertType.Equal<TZDate, typeof result>>(true);
    },
  );

  describe("context", () => {
    it.each(repeatedMinutes)(
      "preserves the repeated minute in the %s context",
      (timeZone, input, expected) => {
        const result = startOfMinute(input, { in: tz(timeZone) });
        expect(result).toBeInstanceOf(TZDate);
        expect(result.timeZone).toBe(timeZone);
        expect(+result).toBe(+new Date(expected));
      },
    );

    it("allows to specify the context", () => {
      expect(
        startOfMinute("2024-04-10T07:12:34.567Z", {
          in: tz("Asia/Singapore"),
        }).toISOString(),
      ).toBe("2024-04-10T15:12:00.000+08:00");
      expect(
        startOfMinute("2024-04-10T07:12:34.567Z", {
          in: tz("America/New_York"),
        }).toISOString(),
      ).toBe("2024-04-10T03:12:00.000-04:00");
    });

    it("resolves the context date type", () => {
      const date = new Date("2014-09-01T00:00:00Z");
      const result = startOfMinute(date, {
        in: tz("Asia/Tokyo"),
      });
      expect(result).toBeInstanceOf(TZDate);
      assertType<assertType.Equal<TZDate, typeof result>>(true);
    });
  });
});
