import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, Todo } from "@/app/components/LegalPage";
import { SITE_CONFIG } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    
    "The terms for using this site and sending a booking request. Submitting a request is not a confirmed booking, and no payment is ever taken on this website.",
  // Draft. Remove once a lawyer has reviewed it and the TODOs are filled.
  robots: "noindex, nofollow",
};

const UPDATED = "20 September 2026";

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      updated={UPDATED}
      intro="What this website is, what sending a request does and does not commit you to, and the limits of what is published here."
    >
      <Section heading="Who you are dealing with">
        <p>
          This website is operated by {SITE_CONFIG.name} from Mahdia, Tunisia. Using the site means
          accepting these terms.
        </p>
        <Todo>Registered legal entity name, legal form, and registration number.</Todo>
        <Todo>Full registered address, and a contact email for legal notices.</Todo>
      </Section>

      <Section heading="What this website does">
        <p>
          It presents properties, yachts, hotels and restaurants, and lets you send an enquiry or a
          booking request about one of them. That is the whole of it.
        </p>
        <List
          items={[
            <>
              <strong className="text-black">Sending a request does not book anything.</strong> It
              is an expression of interest. A booking exists only once we have confirmed it to you
              separately and in writing.
            </>,
            <>
              <strong className="text-black">No payment is taken on this website.</strong> There is
              no checkout, no card form and no payment processor. Anyone asking you to pay through
              this site is not us.
            </>,
            <>
              <strong className="text-black">Availability shown is indicative.</strong> The
              calendar reflects what we have recorded. Dates can be taken between your looking and
              our replying.
            </>,
          ]}
        />
      </Section>

      <Section heading="Prices">
        <p>
          Prices are shown as a starting point, for example &quot;From 1,700 EUR per night&quot;.
          They are indicative, can change, and are confirmed only in a written quotation.
        </p>
        <Todo>
          Whether displayed prices include Tunisian VAT, tourist or municipal taxes, service
          charges and cleaning fees, and what a guest should expect to pay on top.
        </Todo>
        <Todo>
          Whether you are contracting directly with the guest, or acting as an intermediary for the
          property owner. This determines who owes the guest what, and it changes the rest of this
          document substantially.
        </Todo>
      </Section>

      <Section heading="Cancellations and refunds">
        <Todo>
          A cancellation and refund policy. There is none at present, and no payment mechanism for
          one to attach to. If you take deposits by bank transfer outside this website, the terms
          governing those need to be written down, including deadlines, amounts retained, and how
          EU consumers exercise any right of withdrawal. Note that accommodation booked for a
          specific date is generally excluded from the standard fourteen day withdrawal right, but
          that exclusion has conditions.
        </Todo>
      </Section>

      <Section heading="Accuracy of what is published">
        <p>
          We take care with descriptions, photographs, amenities and prices, but they are supplied
          to us and can fall out of date. Nothing here is a warranty about the condition or
          suitability of a property.
        </p>
        <Todo>
          Confirmation that every property listed is one you are authorised to market, and who
          supplies the descriptions and photographs.
        </Todo>
      </Section>

      <Section heading="Third-party names">
        <p>
          Some listings refer to establishments and manufacturers by their own names. Those names
          and marks belong to their owners. Their appearance here does not by itself imply a
          partnership, sponsorship or endorsement.
        </p>
        <Todo>
          Written permission to use each third-party business name, trading name and trademark that
          appears on the site, and to publish prices against them. Several listings name real,
          independently operated businesses.
        </Todo>
      </Section>

      <Section heading="Our content">
        <p>
          The design, text, layout and photographs on this site belong to us or to our licensors
          and may not be copied or republished without permission.
        </p>
        <Todo>
          Licence documentation for every photograph in use, including the homepage hero image, the
          logo files and all property imagery.
        </Todo>
      </Section>

      <Section heading="Using the site properly">
        <List
          items={[
            "Do not send false information through the forms, or submit on someone else's behalf without their knowledge.",
            "Do not attempt to gain access to the administration area or to the database behind it.",
            "Do not scrape, copy or republish the listings.",
            "Do not use the forms to send advertising.",
          ]}
        />
        <p>Automated or abusive submissions are blocked, and requests are rate limited.</p>
      </Section>

      <Section heading="Availability of the site">
        <p>
          We do not promise the site will always be reachable or error free. It can be taken down
          for maintenance or changed at any time.
        </p>
      </Section>

      <Section heading="Liability">
        <Todo>
          A liability clause drafted by a lawyer. It must not attempt to exclude liability that
          cannot lawfully be excluded, and for consumers in the European Economic Area it cannot
          remove rights their own national law gives them.
        </Todo>
      </Section>

      <Section heading="Governing law and disputes">
        <Todo>
          Governing law and jurisdiction. Note that a consumer in the EEA generally keeps the
          protection of the mandatory rules of their own country regardless of what this says, so a
          plain choice of Tunisian law will not be the whole answer.
        </Todo>
        <Todo>
          Whether the EU online dispute resolution platform or an alternative dispute resolution
          body needs referencing for EU consumers.
        </Todo>
      </Section>

      <Section heading="Your information">
        <p>
          What happens to anything you send through a form is described in the{" "}
          <Link href="/privacy" className="border-b border-black hover:opacity-50 transition-opacity">
            privacy policy
          </Link>
          , and what is stored on your device, which is nothing, in the{" "}
          <Link href="/cookies" className="border-b border-black hover:opacity-50 transition-opacity">
            cookie policy
          </Link>
          .
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          These terms can change. The version that applies is the one published when you use the
          site. This one is dated {UPDATED}.
        </p>
      </Section>
    </LegalPage>
  );
}
