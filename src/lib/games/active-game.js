// The home page has two keyboard games, and both listen on window for the
// arrow keys. While a game needs them all to itself (the runner, during a
// live run) it claims them, and the other game ignores keys until it lets
// go. A claim only lasts as long as the run, so going back to a maze that
// was left mid-round still works.

let claimant = null;

export function claimKeys(name) {
  claimant = name;
}

export function releaseKeys(name) {
  if (claimant === name) claimant = null;
}

export function keysClaimedByOther(name) {
  return claimant !== null && claimant !== name;
}
