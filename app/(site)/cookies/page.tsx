import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, Todo } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    
    "This site sets no cookies and shows no consent banner. Page views are counted without storing anything on your device, and nothing follows you to other sites.",
  // Draft. Remove once a lawyer has reviewed it and the TODOs are filled.
  robots: "noindex, nofollow",
};

const UPDATED = "20 September 2026";

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      updated={UPDATED}
      intro="Browsing this site sets no cookies at all. That is why you are not being asked to accept any."
    >
      <Section heading="The short version">
        <p>
          This site sets no cookies, and nothing here tracks you between visits or follows you to
          other websites. Two things are worth naming precisely, and both are described below: we
          count page views without storing anything on your device, and if you dismiss the enquiry
          bar on a phone we remember that for the rest of your visit.
        </p>
      </Section>

      <Section heading="What a cookie banner is actually for">
        <p>
          Under the EU ePrivacy rules, permission is needed before storing anything on your device
          that is not strictly necessary for a service you asked for. Analytics, advertising and
          social media cookies all need it. Cookies that only keep you logged in do not.
        </p>
        <p>
          The rule attaches to storing things on your device, not to counting visits. The audience
          measurement described below stores nothing at all on your device, so there is nothing for
          it to ask about. The one thing this site does store is the note that you closed the
          enquiry bar, which exists only because you asked for it by closing it.
        </p>
      </Section>

      <Section heading="The one cookie that exists">
        <p>
          There is a single cookie in the whole system, and a visitor never receives it. It is
          issued only to an administrator who has signed in at the private administration panel.
        </p>
        <List
          items={[
            <>
              <strong className="text-black">Name:</strong> ht_admin_session
            </>,
            <>
              <strong className="text-black">Purpose:</strong> keeps an administrator signed in to
              the panel used to read enquiries and edit content.
            </>,
            <>
              <strong className="text-black">Category:</strong> strictly necessary. It performs no
              analytics and tracks nothing.
            </>,
            <>
              <strong className="text-black">Lifetime:</strong> eight hours, then it expires.
            </>,
            <>
              <strong className="text-black">Settings:</strong> unreadable by JavaScript, sent only
              over HTTPS, and not sent on requests originating from other sites.
            </>,
          ]}
        />
        <p>
          Because it is strictly necessary and set only after a deliberate sign-in, it is exempt
          from the consent requirement.
        </p>
      </Section>

      <Section heading="Third parties">
        <p>
          No tag manager, no advertising network, no embedded video, no chat widget and no social
          media plugin on any page.
        </p>
        <p>
          Page views are counted by Vercel Web Analytics. Vercel already hosts this site, and the
          counting is served through this domain rather than from another company&apos;s address,
          so it does not put your browser in touch with anyone else. It sets no cookies and stores
          nothing on your device. The privacy policy lists exactly what each page view records.
        </p>
        <p>
          <strong className="text-black">There is one map, on the collection page.</strong> It
          loads nothing at all until you tap it: until then it is a still panel with a button.
          Tapping it fetches map images from CARTO, a mapping company, which is the only time
          anything on this site causes your browser to contact another organisation. Those
          requests set no cookies and store nothing on your device. What CARTO can see is set out
          in the privacy policy. OpenStreetMap is credited on the map because the map is drawn
          from their data, but your browser does not contact them.
        </p>
        <p>
          Photographs and fonts are served from this domain rather than from an external service,
          so loading a page does not tell anyone else that you visited. The links to Instagram,
          TikTok and LinkedIn in the footer are ordinary links: those companies learn nothing
          unless you choose to click one, at which point their own policies apply.
        </p>
      </Section>

      <Section heading="Other storage">
        <p>
          One item, and only on a phone. If you close the bar at the bottom of the screen offering
          to help plan a stay, that is noted in session storage so it does not reappear on the next
          page. It holds no identifier, it is readable only by this site, it is never sent
          anywhere, and your browser discards it when you close the tab.
        </p>
        <p>
          Nothing else is stored. No local storage, no browser database, and nothing that persists
          between visits.
        </p>
      </Section>

      <Section heading="Controlling cookies yourself">
        <p>
          Every major browser lets you view, block and delete cookies in its privacy settings.
          Nothing on this site depends on them, so blocking them will not stop a page working or
          an enquiry from sending.
        </p>
      </Section>

      <Section heading="If this changes">
        <p>
          Adding a conventional analytics product, such as Google Analytics, would change this,
          because those identify visitors with a cookie. A banner would then be required before it
          loaded, refusing would have to be as easy as accepting, and this page would list what it
          sets.
        </p>
        <Todo>
          Legal review of two things now in use: the audience measurement, and the map. Neither
          stores anything on a visitor&apos;s device, which is what the cookie rules attach to, so
          our reading is that no banner is required for either. That reading is defensible rather
          than settled. The map is the more awkward of the two, because it sends an IP address to
          CARTO, an organisation we have no contract with, though it only does so when the visitor
          asks it to. Confirm both, and record the lawful basis.
        </Todo>
      </Section>

      <Section heading="Related">
        <p>
          The{" "}
          <Link href="/privacy" className="border-b border-black hover:opacity-50 transition-opacity">
            privacy policy
          </Link>{" "}
          covers what happens to the information you type into a form, which is separate from
          anything stored on your device.
        </p>
      </Section>
    </LegalPage>
  );
}
