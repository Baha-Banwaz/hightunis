import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, Todo } from "@/app/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "This site sets no cookies when you browse it, and shows no cookie banner because it does not need one.",
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
          Visiting any page on this website, reading a property, or sending an enquiry places
          nothing on your device. No cookies, no local storage, no tracking identifiers. There is
          no banner because there is nothing to consent to.
        </p>
      </Section>

      <Section heading="What a cookie banner is actually for">
        <p>
          Under the EU ePrivacy rules, permission is needed before storing anything on your device
          that is not strictly necessary for a service you asked for. Analytics, advertising and
          social media cookies all need it. Cookies that only keep you logged in do not.
        </p>
        <p>
          Since this site stores nothing in the first category, asking for permission would be
          asking about something that does not happen.
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
          None. There is no analytics service, no tag manager, no advertising network, no embedded
          video, no map, no chat widget and no social media plugin on any page.
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
          The site does not use local storage, session storage or any browser database. Nothing
          persists between visits.
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
          Adding anything that measures visitors, such as Google Analytics, would change this.
          Then a consent banner would be required before it loaded, refusing would have to be as
          easy as accepting, and this page would be updated to list what it sets.
        </p>
        <Todo>
          Decide whether analytics are wanted. If so, the banner and the consent-gated loading have
          to be built before the analytics go in, not after.
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
