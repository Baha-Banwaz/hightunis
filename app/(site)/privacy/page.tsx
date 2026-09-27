import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, Todo } from "@/app/components/LegalPage";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    
    "What HighTunis collects when you send an enquiry, where it is stored, who can read it and the rights you have over it. No cookies and no cross-site tracking.",
  // Draft. Remove once a lawyer has reviewed it and the TODOs are filled.
  robots: "noindex, nofollow",
};

const UPDATED = "20 September 2026";

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated={UPDATED}
      intro="This describes exactly what this website collects, which is very little, and what happens to it."
    >
      <Section heading="Who is responsible">
        <p>
          {SITE_CONFIG.name} operates this website from {SITE_CONFIG.headquarters.line1}, {SITE_CONFIG.headquarters.line2}, and decides how the
          information described below is used. In data protection law that makes us the
          controller.
        </p>
        <Todo>
          Registered legal entity name, legal form, and company or tax registration number.
        </Todo>
        <Todo>
          Full registered address and postcode in {SITE_CONFIG.headquarters.line1}.
        </Todo>
        <Todo>
          The email address that should receive privacy and data protection requests. The site
          currently publishes {SITE_CONFIG.emails.hello}, {SITE_CONFIG.emails.concierge},{" "}
          {SITE_CONFIG.emails.partners} and {SITE_CONFIG.emails.press}, and none of them is
          designated for this.
        </Todo>
      </Section>

      <Section heading="What we collect">
        <p>Only what you type into a form, plus one technical detail described below.</p>
        <p className="font-bold text-black">The enquiry form on the contact page collects:</p>
        <List
          items={[
            "Your name.",
            "Your email address.",
            "A subject line.",
            "Your message.",
          ]}
        />
        <p className="font-bold text-black">The booking request form on a property page collects:</p>
        <List
          items={[
            "Your name.",
            "Your email address.",
            "Your phone number.",
            "Which property you are asking about, and your check-in and check-out dates.",
            "An optional message.",
          ]}
        />
        <p className="font-bold text-black">Collected automatically:</p>
        <List
          items={[
            <>
              Your IP address, held in the server&apos;s memory for up to ten minutes so that the
              same address cannot flood the form. It is never written to our database and is
              discarded when the window passes.
            </>,
            <>
              Both forms contain a hidden field that people cannot see and automated spam tools
              usually fill in. Anything entered there causes the submission to be rejected. Its
              contents are never stored.
            </>,
          ]}
        />
        <Todo>
          How long our hosting provider retains its own request logs, which include IP addresses.
          This depends on the Vercel plan in use and needs confirming.
        </Todo>
      </Section>

      <Section heading="What we do not collect">
        <p>
          This is worth stating plainly, because most privacy policies describe things this site
          does not do.
        </p>
        <List
          items={[
            "No cookies are set when you browse this site. See the cookie policy.",
            "No advertising, no remarketing, no tracking pixels and no social media tracking.",
            "No profiling and no automated decision making.",
            "No visitor accounts, so no passwords and no login history.",
            "No newsletter list. We do not add you to a mailing list.",
            <>
              Your browser contacts no other company&apos;s servers. Images and fonts are served
              from this domain, and the audience measurement described below is collected through
              this domain too.
            </>,
          ]}
        />
      </Section>

      <Section heading="Audience measurement">
        <p>
          We use Vercel Web Analytics, run by Vercel, who also host this site. It counts page
          views so we can see which pages are read. It does not use cookies, and it stores nothing
          on your device: no cookie, no local storage, no identifier of any kind.
        </p>
        <p>
          It does not know who you are. Instead of an identifier that follows you, it derives a
          value from your request, and that value is discarded after 24 hours. It cannot be used
          to recognise you tomorrow, and it cannot follow you to any other website.
        </p>
        <p>According to Vercel, each page view records:</p>
        <List
          items={[
            "The time, the page address, and the page template that address matched.",
            "The address of the page that linked you here, if there was one, and campaign tags in the link.",
            "Your approximate location: country, region and city. Never a street address.",
            "Your device type, operating system and browser, each with a version number.",
          ]}
        />
        <p>
          Your IP address is not stored, and no data point is tied to one. Nothing here identifies
          you, and none of it is combined with an enquiry you send. The admin area is excluded
          entirely: the measurement script is never loaded there.
        </p>
        <Todo>
          Legal review of whether this needs consent. Our reading: it stores nothing on your device,
          which is what the ePrivacy rules on cookies and similar technologies attach to, so a
          banner should not be required, and Vercel states it is designed for that. This is a
          defensible reading rather than a settled one: regulators in different countries treat
          cookieless measurement differently, and a value derived from a request is still personal
          data under GDPR even when it is short-lived. Confirm before relying on it, and record
          which lawful basis is claimed for the processing.
        </Todo>
        <p>
          Vercel is the processor for this data. See the section on who else can see your
          information for what that means.
        </p>
      </Section>

      <Section heading="Why we are allowed to use it">
        <List
          items={[
            <>
              <strong className="text-black">To answer your enquiry or booking request.</strong>{" "}
              Taking steps at your request before entering into a contract, Article 6(1)(b) of the
              GDPR.
            </>,
            <>
              <strong className="text-black">To contact you about it.</strong> Your consent,
              Article 6(1)(a), given by ticking the box on the form. You can withdraw it at any
              time, which does not affect anything done before you withdrew it.
            </>,
            <>
              <strong className="text-black">To stop the forms being abused.</strong> Our
              legitimate interest in keeping the site working, Article 6(1)(f). This is the
              short-lived IP check described above.
            </>,
          ]}
        />
      </Section>

      <Section heading="Where it goes">
        <p>
          Your enquiry is stored in a Supabase database and read through a password-protected
          administration panel on this site. It is not forwarded to a mailing service, a CRM, an
          advertiser or a data broker.
        </p>
        <p>
          <strong className="text-black">It is sent to the property when you book.</strong> We
          arrange stays on your behalf rather than supplying them ourselves, so making a booking
          means giving the property what it needs to hold the reservation: normally your name, the
          dates, the number of guests and a contact detail. That happens when a booking is being
          made, not when you first enquire, and we send what the booking requires rather than your
          whole enquiry.
        </p>
        <p>
          The property decides for itself what it then does with those details, which makes it a
          separate controller rather than someone acting on our instructions. Its own privacy
          notice governs what it holds. Most of the properties we work with are in Tunisia, so this
          is also a transfer outside the European Economic Area; see below.
        </p>
        <Todo>
          What is actually sent to a property, field by field, and by what route. Also whether any
          written terms bind properties on what they may do with a guest&apos;s details, and
          whether an EEA guest&apos;s data reaching a Tunisian property is covered by standard
          contractual clauses or relies on the contract-performance derogation in Article 49(1)(b).
        </Todo>
        <p>These are the processors acting on our instructions:</p>
        <List
          items={[
            <>
              <strong className="text-black">Supabase</strong>, which hosts the database and the
              image storage.
            </>,
            <>
              <strong className="text-black">Vercel</strong>, which hosts and serves the website.
              The deployment region is US East, so pages are served from the United States.
            </>,
          ]}
        />
        <Todo>
          The region your Supabase project is hosted in. Visible in the Supabase dashboard under
          project settings. It determines which country the enquiries physically sit in.
        </Todo>
        <Todo>
          Whether data processing agreements are in place with Supabase and Vercel, and which
          transfer mechanism covers them.
        </Todo>
      </Section>

      <Section heading="Sending data outside the EU">
        <p>
          We are based in Tunisia, and the website is served from the United States. If you are in
          the European Economic Area, that means your information leaves it. Tunisia has not been
          found by the European Commission to provide an equivalent level of protection, so a
          safeguard such as standard contractual clauses is required.
        </p>
        <p>
          Booking adds a second route out. When we place a booking for you, the details the
          property needs go to that property, and the properties are in Tunisia. That is a separate
          transfer from the hosting described above, to a recipient that decides things for itself
          rather than acting on our instructions, and it needs its own answer.
        </p>
        <Todo>
          Confirmation from a lawyer of which transfer mechanism applies and what has been signed.
          This is the single most likely point of GDPR exposure for this site.
        </Todo>
      </Section>

      <Section heading="How long we keep it">
        <Todo>
          A retention period for enquiries. Nothing currently deletes them, so today they are kept
          indefinitely, which is not a defensible position. A common approach is to keep booking
          enquiries for the length of any contractual or tax obligation and delete unsuccessful
          enquiries after a fixed period such as twelve or twenty-four months.
        </Todo>
      </Section>

      <Section heading="Your rights">
        <p>
          If the GDPR applies to you, you can ask us to give you a copy of your information,
          correct it, delete it, restrict what we do with it, or send it to someone else. You can
          object to us using it, and you can withdraw consent at any time.
        </p>
        <p>
          You can also complain to a supervisory authority: in the European Economic Area, the one
          for the country you live in, and in Tunisia, the Instance Nationale de Protection des
          Données Personnelles.
        </p>
        <Todo>
          The address to send these requests to, and who is responsible for answering them within
          the one month the GDPR allows.
        </Todo>
      </Section>

      <Section heading="How it is protected">
        <p>These are measures actually in place, not aspirations:</p>
        <List
          items={[
            "The site is served only over HTTPS, and browsers are instructed to refuse an unencrypted connection.",
            "Your browser never talks to the database. Form submissions go to this site's own server, which writes them.",
            "The database key published in the browser has no permission to read enquiries at all. Enquiries are readable only by the server.",
            "The administration panel is password protected, with a signed session that expires after eight hours.",
            "A content security policy restricts what the pages are allowed to load.",
          ]}
        />
      </Section>

      <Section heading="Children">
        <p>
          This site is aimed at adults booking travel and is not directed at children. We do not
          knowingly collect information from anyone under 16.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          If this policy changes we will update the date at the top. The current version is dated{" "}
          {UPDATED}.
        </p>
        <p>
          Questions about anything here can go to{" "}
          <Link href="/contact" className="border-b border-black hover:opacity-50 transition-opacity">
            our contact page
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
