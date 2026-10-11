// The Work with me page's brief builder. The visitor's choices only ever
// shape a pre-filled email in their own mail app; nothing is sent to the
// site, which is why this is a mailto and not a form (the privacy policy
// promises no forms that send anything here).

import { estimate, formatRange, FEATURES } from "./estimate.js";

export { TIMELINES } from "./estimate.js";

export const EMAIL = "cilia.filippo.dev@gmail.com";
const SUBJECT = "Project enquiry";

export const DEVICES = ["iPhone", "iPad", "Mac", "Apple Watch", "Apple TV", "Vision Pro"];
export const BUDGETS = ["Under £5k", "£5k–£15k", "£15k+", "Not sure yet"];

// Every prompt stays in the body even when it's blank, so someone who skips
// the chips still gets the same template to fill in by hand.
export function buildEnquiry({ idea = "", devices = [], features = [], timeline = "", budget = "" } = {}) {
  // Sorted into the order they're offered, so tapping Mac then iPhone still
  // reads "iPhone, Mac". Features likewise.
  const chosen = DEVICES.filter((d) => devices.includes(d)).join(", ");
  const needs = FEATURES.filter((f) => features.includes(f)).join(", ");
  const line = (label, value) => (value ? `${label}: ${value}` : `${label}:`);
  // The estimate goes in only when there's a number, so the email shows
  // exactly what the visitor saw on the page.
  const range = estimate({ devices, features, timeline });

  const subject = chosen ? `${SUBJECT} · ${chosen}` : SUBJECT;
  const body = [
    "Hi Filippo,",
    "",
    `What I'd like to build:${idea.trim() ? `\n${idea.trim()}` : ""}`,
    "",
    line("Devices", chosen),
    "",
    line("It needs", needs),
    "",
    line("Timeline", timeline),
    "",
    line("Budget", budget),
    ...(range?.low ? ["", `The page estimated: ${formatRange(range)}`] : []),
  ].join("\n") + "\n";

  return { subject, body };
}

// URLSearchParams encodes spaces as "+", which mail apps show literally.
const query = (params) => new URLSearchParams(params).toString().replaceAll("+", "%20");

export const mailtoHref = ({ subject, body }) => `mailto:${EMAIL}?${query({ subject, body })}`;

// A mailto does nothing on a device with no mail app set up, which is
// common for people who only use Gmail in a browser, so Gmail's own
// compose page sits next to it with the same subject and body.
export const gmailHref = ({ subject, body }) =>
  `https://mail.google.com/mail/?${query({ view: "cm", fs: "1", to: EMAIL, su: subject, body })}`;
