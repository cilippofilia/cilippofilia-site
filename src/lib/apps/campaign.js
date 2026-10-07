// App Store campaign links. Apple counts App Store page views and downloads
// per campaign token in App Store Connect's App Analytics, so the site can
// tell which pages actually send people to the App Store without tracking
// anyone here: the parameters only mean something to Apple, and the privacy
// page stays true.
//
// pt is the App Store Connect provider ID, the same for every app on the
// account and public in any campaign link. ct is the campaign name, which
// Apple caps at 30 characters.

export const PROVIDER_TOKEN = "126416368";

// Adds pt and ct to an App Store URL, keeping whatever query it already has
// (Apple's trackViewUrl carries ?uo=4). Empty or unparseable URLs come back
// untouched, so an app without a store link still renders no button.
export function campaignUrl(url, campaign) {
  if (!url) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("pt", PROVIDER_TOKEN);
    u.searchParams.set("ct", campaign);
    return u.href;
  } catch {
    return url;
  }
}
