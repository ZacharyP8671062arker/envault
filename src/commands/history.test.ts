import { getKeyHistory, formatHistoryEntry, runHistory, HistoryEntry } from "./history";
import * as audit from "./audit";

jest.mock("./audit");

const mockEntries: HistoryEntry[] = [
  { timestamp: "2024-01-01T10:00:00Z", action: "push", key: "API_KEY", user: "alice" },
  { timestamp: "2024-01-02T11:00:00Z", action: "pull", key: "DB_PASS", user: "bob" },
  { timestamp: "2024-01-03T12:00:00Z", action: "rotate", key: "API_KEY", user: "alice", details: "rotated API_KEY" },
  { timestamp: "2024-01-04T13:00:00Z", action: "share", user: "carol", details: "shared vault" },
];

beforeEach(() => {
  jest.clearAllMocks();
  (audit.readAuditLog as jest.Mock).mockReturnValue(mockEntries);
});

describe("getKeyHistory", () => {
  it("filters entries by key name", () => {
    const result = getKeyHistory("/vault", "API_KEY");
    expect(result).toHaveLength(2);
    expect(result[0].action).toBe("push");
    expect(result[1].action).toBe("rotate");
  });

  it("returns empty array if no entries match", () => {
    const result = getKeyHistory("/vault", "NONEXISTENT");
    expect(result).toHaveLength(0);
  });

  it("matches entries via details field", () => {
    const result = getKeyHistory("/vault", "rotated API_KEY");
    expect(result.some((e) => e.action === "rotate")).toBe(true);
  });
});

describe("formatHistoryEntry", () => {
  it("formats entry with all fields", () => {
    const entry: HistoryEntry = { timestamp: "2024-01-01T10:00:00Z", action: "push", key: "API_KEY", user: "alice", details: "ok" };
    const result = formatHistoryEntry(entry);
    expect(result).toContain("push");
    expect(result).toContain("key=API_KEY");
    expect(result).toContain("user=alice");
  });

  it("formats entry with only required fields", () => {
    const entry: HistoryEntry = { timestamp: "2024-01-01T10:00:00Z", action: "pull" };
    const result = formatHistoryEntry(entry);
    expect(result).toBe("2024-01-01T10:00:00Z | pull");
  });
});

describe("runHistory", () => {
  it("prints all entries when no key specified", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runHistory("/vault");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("respects limit option", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runHistory("/vault", undefined, { limit: 2 });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("outputs JSON when json option is true", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runHistory("/vault", undefined, { json: true });
    const output = spy.mock.calls[0][0];
    expect(() => JSON.parse(output)).not.toThrow();
    spy.mockRestore();
  });

  it("prints no history message when empty", () => {
    (audit.readAuditLog as jest.Mock).mockReturnValue([]);
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});
    runHistory("/vault");
    expect(spy).toHaveBeenCalledWith("No history found.");
    spy.mockRestore();
  });
});
