import assert from "node:assert/strict";
import { startOfMinute } from "../../../src/startOfMinute/index.ts";

// Each entry is an exact local minute, including both occurrences of a repeated
// minute, the spring transition, and a normal day. Run each zone in a separate
// process so the native Date implementation uses that zone.
const minutesByTimeZone: Record<string, string[]> = {
  "Europe/Vienna": [
    "2023-10-29T00:06:00.000Z",
    "2023-10-29T01:06:00.000Z",
    "2023-10-29T01:00:00.000Z",
    "2023-03-26T01:00:00.000Z",
    "2023-10-30T01:06:00.000Z",
  ],
  "America/New_York": [
    "2023-11-05T05:06:00.000Z",
    "2023-11-05T06:06:00.000Z",
    "2023-11-05T06:00:00.000Z",
    "2023-03-12T07:00:00.000Z",
    "2023-11-06T06:06:00.000Z",
  ],
  "Australia/Lord_Howe": [
    "2023-04-01T14:45:00.000Z",
    "2023-04-01T15:15:00.000Z",
    "2023-04-01T15:00:00.000Z",
    "2023-09-30T15:30:00.000Z",
    "2023-04-02T15:15:00.000Z",
  ],
  // Historical offsets include seconds, so local minutes do not start at UTC
  // minute boundaries. Cover both positive and negative offsets before 1970.
  "Europe/Paris": ["1890-01-01T00:00:39.000Z"],
  "Africa/Monrovia": ["1890-01-01T00:00:08.000Z"],
};

const minutes = minutesByTimeZone[process.env.TZ || ""];
if (!minutes) throw new Error("The test must be run with a configured TZ");

for (const minute of minutes) {
  const expected = new Date(minute);
  assert.strictEqual(expected.getSeconds(), 0);

  for (const elapsed of [0, 1, 45_678, 59_999]) {
    const date = new Date(+expected + elapsed);
    const originalTime = +date;

    for (const input of [date, +date, date.toISOString()]) {
      const result = startOfMinute(input);
      assert.strictEqual(result.toISOString(), minute);
      assert.strictEqual(result.getSeconds(), 0);
      assert.strictEqual(result.getMilliseconds(), 0);
      assert.strictEqual(+startOfMinute(result), +result);
      assert.notStrictEqual(result, input);
    }

    assert.strictEqual(+date, originalTime);
  }
}

// Preserve the local setter's behavior when a historical offset change leaves
// only part of a minute. Its start can be in the old offset (Paris), or not
// exist at all and be shifted forward across the gap (Monrovia).
const partialMinutes: Record<string, [string, string]> = {
  "Europe/Paris": ["1911-03-10T23:50:45.678Z", "1911-03-10T23:40:39.000Z"],
  "Africa/Monrovia": ["1972-01-07T00:44:45.678Z", "1972-01-07T01:28:30.000Z"],
};
const partialMinute = partialMinutes[process.env.TZ || ""];
if (partialMinute) {
  const [input, expected] = partialMinute;
  const date = new Date(input);
  const result = startOfMinute(date);
  assert.strictEqual(result.toISOString(), expected);
  assert.strictEqual(date.toISOString(), input);
  if (process.env.TZ === "Europe/Paris") {
    assert.strictEqual(result.getSeconds(), 0);
    assert.strictEqual(+startOfMinute(result), +result);
  }
}
