import { ContentTodo } from "./ContentTodo";

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Written by the owner, September 2026. Their words, lightly punctuated;
 * nothing here is invented, and nothing should be added that is not.
 *
 * These are load-bearing beyond the page. The booking answer states that
 * HighTunis books with the property on the client's behalf rather than being
 * the contracting party, and the cancellation answer states that the
 * property's own terms govern. The terms and privacy pages have to keep
 * saying the same thing.
 *
 * If these change, FAQPage structured data becomes worth adding in
 * lib/structured-data.tsx. Only mark up questions that are actually visible
 * on the page.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does booking work?",
    answer:
      "You send us an enquiry with the dates and the property you're interested in. We talk it through with you, then book directly with the property on your behalf and come back to confirm. You deal with us throughout, not the property.",
  },
  {
    question: "What's included in a stay?",
    answer:
      "The stay itself is what's listed. Airport transfers both ways and a personal driver for the duration are available as add-ons, priced separately depending on the property and length of stay. Tell us what you need when you enquire and we'll quote it.",
  },
  {
    question: "Can I cancel?",
    answer:
      "Yes. Cancellations are subject to the individual property's terms, which we confirm with you in writing before anything is booked, so you always know where you stand.",
  },
  {
    question: "How far in advance should I book?",
    answer:
      "At least two days before arrival, so we have time to call and confirm everything with you and with the property. Longer for peak dates or specific properties.",
  },
  {
    question: "Do you work with properties outside your collection?",
    answer:
      "Yes. The collection is what we present publicly, but if you have somewhere in mind or a type of stay you're looking for, ask us.",
  },
];

export function Faq({
  items = FAQ_ITEMS,
  heading = "Questions",
}: {
  items?: FaqItem[];
  heading?: string;
}) {
  if (items.length === 0) {
    return (
      <ContentTodo>
        FAQ section is built and wired up, waiting on five questions and answers.
        Fill FAQ_ITEMS in app/components/Faq.tsx and this section appears. It is
        hidden on the live site until then.
      </ContentTodo>
    );
  }

  return (
    <section className="bg-white text-black py-24 md:py-32 border-t-2 border-black">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-16">
          {heading}
        </h2>

        {/*
          <details>/<summary> rather than a JS accordion: it opens with Enter
          and Space, it is announced correctly, it works with JavaScript off,
          and it is findable by the browser's own in-page search even while
          collapsed.
        */}
        <div className="border-t-2 border-black">
          {items.map((item) => (
            <details key={item.question} className="group border-b-2 border-black">
              <summary className="flex items-start justify-between gap-8 cursor-pointer list-none py-8 [&::-webkit-details-marker]:hidden">
                <h3 className="text-xl md:text-3xl font-black uppercase tracking-tighter leading-tight">
                  {item.question}
                </h3>
                {/*
                  A plus that becomes a minus. Drawn with borders, not an icon
                  font and not an emoji, and hidden from screen readers because
                  <details> already announces its own open state.
                */}
                <span
                  aria-hidden="true"
                  className="relative mt-2 w-5 h-5 shrink-0 before:absolute before:inset-x-0 before:top-1/2 before:h-0.5 before:-translate-y-1/2 before:bg-black after:absolute after:inset-y-0 after:left-1/2 after:w-0.5 after:-translate-x-1/2 after:bg-black after:transition-opacity group-open:after:opacity-0"
                />
              </summary>
              <div className="pb-10 pr-8 md:pr-24 text-base md:text-xl font-medium leading-[1.6] text-black/80">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
