import { test, expect } from "bun:test";
import { buildEnquiry, mailtoHref, gmailHref, EMAIL } from "./enquiry.js";

const EMPTY = "Hi Filippo,\n\nWhat I'd like to build:\n\nDevices:\n\nIt needs:\n\nTimeline:\n\nBudget:\n";

test("an empty brief leaves every prompt blank", () => {
  expect(buildEnquiry()).toEqual({ subject: "Project enquiry", body: EMPTY });
  expect(buildEnquiry({ idea: "   ", devices: [], features: [], timeline: "", budget: "" })).toEqual({
    subject: "Project enquiry",
    body: EMPTY,
  });
});

test("a full brief fills each line and names the devices in the subject", () => {
  const { subject, body } = buildEnquiry({
    idea: "  A habit tracker for climbers  ",
    devices: ["iPhone", "Apple Watch"],
    features: ["Widgets"],
    timeline: "1–3 months",
    budget: "£5k–£15k",
  });
  expect(subject).toBe("Project enquiry · iPhone, Apple Watch");
  expect(body).toBe(
    "Hi Filippo,\n\nWhat I'd like to build:\nA habit tracker for climbers\n\nDevices: iPhone, Apple Watch\n\nIt needs: Widgets\n\nTimeline: 1–3 months\n\nBudget: £5k–£15k\n\nThe page estimated: £7,000–£10,500\n"
  );
});

test("devices come out in the order they're offered, not the order they were tapped", () => {
  expect(buildEnquiry({ devices: ["Mac", "iPhone"] }).subject).toBe("Project enquiry · iPhone, Mac");
});

test("a partial brief fills only what was chosen", () => {
  const { subject, body } = buildEnquiry({ budget: "Not sure yet" });
  expect(subject).toBe("Project enquiry");
  expect(body).toBe("Hi Filippo,\n\nWhat I'd like to build:\n\nDevices:\n\nIt needs:\n\nTimeline:\n\nBudget: Not sure yet\n");
});

test("the links encode spaces as %20 rather than +", () => {
  const enquiry = buildEnquiry({ devices: ["Vision Pro"], budget: "£15k+" });
  const mailto = mailtoHref(enquiry);
  expect(mailto.startsWith(`mailto:${EMAIL}?`)).toBe(true);
  expect(mailto).not.toContain("Vision+Pro");
  expect(mailto).toContain("Vision%20Pro");
  // A literal + in the copy still survives, encoded.
  expect(mailto).toContain("%C2%A315k%2B");

  const params = new URL(gmailHref(enquiry)).searchParams;
  expect(params.get("to")).toBe(EMAIL);
  expect(params.get("su")).toBe(enquiry.subject);
  expect(params.get("body")).toBe(enquiry.body);
});
