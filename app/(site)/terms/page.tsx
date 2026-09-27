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
          This website is operated by {SITE_CONFIG.name} from {SITE_CONFIG.headquarters.line1}, {SITE_CONFIG.headquarters.line2}. Using the site
          means accepting these terms.
        </p>
        <p>
          <strong className="text-black">We are an intermediary, not the property.</strong> We take
          your enquiry, discuss it with you, and book with the property on your behalf. We do not
          own, operate or let the properties in the collection. When a stay is confirmed, the stay
          itself is supplied by the property, and its own terms apply to it.
        </p>
        <p>
          What that means in practice: you deal with us throughout, and we remain your point of
          contact. What the property must deliver, and on what conditions it may be cancelled, come
          from the property.
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
          Whether the price we quote is the property&apos;s price passed on, or the
          property&apos;s price plus our fee, and whether that fee is shown separately. A consumer
          is entitled to a total price before committing.
        </Todo>
      </Section>

      <Section heading="Cancellations and refunds">
        <p>
          Cancellation is governed by the terms of the individual property, because the property is
          what supplies the stay. We confirm those terms to you in writing before anything is
          booked, so the conditions are known to you before you commit to them.
        </p>
        <Todo>
          What we do ourselves when a booking is cancelled: whether any part of what you have paid
          us is retained, on what timetable, and whether an arrangement fee is refundable
          separately from the property&apos;s own charges. The property&apos;s terms do not answer
          this, and it is our side of the arrangement.
        </Todo>
        <Todo>
          How an EU consumer exercises a right of withdrawal, and whether it applies at all.
          Accommodation for a specific date is generally excluded from the fourteen day right, but
          that exclusion has conditions, and it may sit differently where the booking is arranged
          by an intermediary rather than sold by the provider.
        </Todo>
      </Section>

      <Section heading="Transfers, drivers and travel packages">
        <p>
          Airport transfers and a personal driver can be arranged alongside a stay. They are
          quoted separately and supplied by the operator providing them.
        </p>
        <Todo>
          Urgent, and the reason this section exists. Combining accommodation with transport for
          the same trip can turn an arrangement into a travel package, or a linked travel
          arrangement, under the EU Package Travel Directive 2015/2302 and its national
          implementations. That is not a labelling question. Where it applies, the organiser
          becomes responsible for the whole trip performing as promised, must give the traveller a
          prescribed information form before they commit, and must hold insolvency protection
          covering money paid and repatriation.
          <br />
          <br />
          This site offers exactly that combination: a stay, plus airport transfers both ways, plus
          a driver for the duration. Whether it crosses the threshold depends on how the two are
          sold, quoted and invoiced, and on which country&apos;s implementation applies to the
          traveller. Establish this before the next booking that includes a transfer, not after.
          Being an intermediary rather than the property does not by itself avoid it, because the
          Directive attaches to whoever combines the services.
        </Todo>
      </Section>

      <Section heading="Who is responsible for what">
        <p>
          We are responsible for arranging your booking with reasonable care and skill, for
          representing your requirements accurately to the property, and for confirming back to
          you in writing what has been agreed.
        </p>
        <p>
          The property is responsible for the stay itself, for the accommodation matching what was
          described, and for its condition and safety on arrival.
        </p>
        <Todo>
          A reviewed liability clause. This section describes the split but does not limit
          anything, deliberately: an intermediary cannot simply disclaim responsibility to a
          consumer, and a clause that tried to would risk being unenforceable as an unfair term
          while also being the clause a dispute turns on. Needs drafting with the consumer
          protection rules of the countries your guests come from in view, and it interacts with
          the package travel question above.
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
