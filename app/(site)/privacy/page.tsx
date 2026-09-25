import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, Todo } from "@/app/components/LegalPage";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    
    "What HighTunis collects when you send an enquiry, where it is stored, who can read it and the rights you have over it. No cookies, no analytics, no tracking.",
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
          {SITE_CONFIG.name} operates this website from Mahdia, Tunisia, and decides how the
          information described below is used. In data protection law that makes us the
          controller.
        </p>
        <Todo>
          Registered legal entity name, legal form, and company or tax registration number.
        </Todo>
        <Todo>Full registered address in Mahdia.</Todo>
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
            "No analytics of any kind. There is no Google Analytics, no tag manager, no visitor counter and no heatmap.",
            "No advertising, no remarketing, no tracking pixels and no social media tracking.",
            "No profiling and no automated decision making.",
            "No visitor accounts, so no passwords and no login history.",
            "No newsletter list. We do not add you to a mailing list.",
            <>
              No third party receives your browser&apos;s requests. Images and fonts are served
              from this domain, so external services are not contacted while you browse.
            </>,
          ]}
        />
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
          Your enquiry is stored in a Supabase database. It is read through a password-protected
          administration panel on this site. Enquiries are not forwarded to a mailing service, a
          CRM, or any other third party.
        </p>
        <p>These are the only processors involved:</p>
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
