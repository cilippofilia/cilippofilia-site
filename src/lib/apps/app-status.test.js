import { test, expect } from "bun:test";
import { badgeClass, sortByStatus, statusRank } from "./app-status.js";

test("apps sort Live, Beta, In development, Planning, Discovery", () => {
  const apps = ["Discovery", "Planning", "In development", "Beta", "Live"].map((status) => ({ status }));
  expect(sortByStatus(apps).map((a) => a.status)).toEqual(["Live", "Beta", "In development", "Planning", "Discovery"]);
});

test("apps with the same status keep their original order", () => {
  const apps = [
    { name: "b", status: "Beta" },
    { name: "x", status: "Live" },
    { name: "a", status: "Beta" },
    { name: "y", status: "Live" },
  ];
  expect(sortByStatus(apps).map((a) => a.name)).toEqual(["x", "y", "b", "a"]);
});

test("status matching ignores case and surrounding spaces", () => {
  expect(statusRank(" in Development ")).toBe(statusRank("In development"));
  expect(badgeClass("BETA")).toBe("beta");
});

test("an unknown status sorts with Discovery but keeps a neutral badge", () => {
  expect(statusRank("Concept")).toBe(statusRank("Discovery"));
  expect(statusRank(undefined)).toBe(statusRank("Discovery"));
  expect(badgeClass("Concept")).toBe("example");
});

test("each known status has its own badge colour", () => {
  expect(["Live", "Beta", "In development", "Planning", "Discovery"].map(badgeClass)).toEqual([
    "live",
    "beta",
    "dev",
    "planning",
    "discovery",
  ]);
});

test("sorting doesn't mutate the input", () => {
  const apps = [{ status: "Planning" }, { status: "Live" }];
  sortByStatus(apps);
  expect(apps[0].status).toBe("Planning");
});
