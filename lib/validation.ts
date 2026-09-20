import { z } from "zod";
import { INQUIRY_STATUSES } from "./inquiry-status.ts";

// Every payload that reaches the database passes through one of these schemas.
// z.object() strips unknown keys, so a client cannot write a column it was
// never meant to touch (e.g. `status` on a public inquiry, or `id`).

/** Strips C0 control characters (tab and newline survive) and trims. */
const clean = (value: string) =>
  value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim();

const text = (max: number) => z.string().transform(clean).pipe(z.string().max(max));

const requiredText = (max: number, label: string) =>
  z
    .string()
    .transform(clean)
    .pipe(z.string().min(1, `${label} is required`).max(max, `${label} is too long`));

/** "" and null both mean "no value" in the admin forms. */
const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (v === null ? null : clean(v) || null))
    .pipe(z.string().max(max).nullable());

/** Absolute http(s) URL or a root-relative path. Blocks javascript: and data:. */
const imageUrl = (max = 2048) =>
  z
    .union([z.string(), z.null()])
    .transform((v) => (v === null ? null : clean(v) || null))
    .pipe(
      z
        .string()
        .max(max)
        .refine((v) => /^https?:\/\//i.test(v) || /^\/[^/]/.test(v), {
          message: "Must be an http(s) URL or a root-relative path",
        })
        .nullable()
    );

// 8-15 digits, optional leading +, punctuation allowed. Mirrors the client regex.
const phone = z
  .string()
  .transform(clean)
  .pipe(
    z.string().refine((v) => {
      if (!/^\+?[\d\s().-]{8,20}$/.test(v)) return false;
      const digits = v.replace(/\D/g, "").length;
      return digits >= 8 && digits <= 15;
    }, "Enter a valid phone number")
  );

const isoDate = z.iso.date();

const slug = z
  .string()
  .transform((v) => clean(v).toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Slug is required")
      .max(120)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug may contain lowercase letters, numbers and hyphens only"
      )
  );

const email = z
  .string()
  .transform(clean)
  .pipe(z.email("Enter a valid email address").max(254));

// ---------------------------------------------------------------------------
// Public (unauthenticated) input
// ---------------------------------------------------------------------------

/** Bots fill hidden fields; humans leave them empty. */
const honeypot = z
  .string()
  .max(0, "Rejected")
  .optional();

export const contactInquirySchema = z.object({
  kind: z.literal("contact"),
  name: requiredText(120, "Name"),
  email,
  type: requiredText(120, "Subject"),
  message: requiredText(5000, "Message"),
  company: honeypot,
});

export const bookingInquirySchema = z.object({
  kind: z.literal("booking"),
  name: requiredText(120, "Name"),
  email,
  phone,
  propertyId: z.uuid("Unknown property"),
  checkIn: isoDate,
  checkOut: isoDate,
  message: text(2000).optional(),
  company: honeypot,
});

export const publicInquirySchema = z.discriminatedUnion("kind", [
  contactInquirySchema,
  bookingInquirySchema,
]);

export type PublicInquiry = z.infer<typeof publicInquirySchema>;

/**
 * Inquiry list filters. These arrive from the URL query string, so the UI's
 * filter state survives a refresh and is shareable.
 *
 * dateField picks what the range means: when the enquiry arrived, or when the
 * stay happens. They answer different questions and are never both applied.
 */
export const inquiryFilterSchema = z
  .object({
    status: z.enum(INQUIRY_STATUSES).optional(),
    propertyId: z.uuid().optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    dateField: z.enum(["created", "stay"]).default("created"),
  })
  .refine((v) => !v.from || !v.to || v.to >= v.from, {
    message: "The end of the range must be on or after the start",
    path: ["to"],
  });

export type InquiryFilters = z.infer<typeof inquiryFilterSchema>;

export const availabilityQuerySchema = z.object({
  propertyId: z.uuid(),
});

// ---------------------------------------------------------------------------
// Admin input (authenticated, but still validated and column-scoped)
// ---------------------------------------------------------------------------

// Re-exported for the admin UI, which imports statuses and schemas together.
export { INQUIRY_STATUSES } from "./inquiry-status.ts";

const propertyBase = z.object({
  name: requiredText(200, "Name"),
  slug,
  category: requiredText(80, "Category"),
  location: requiredText(160, "Location"),
  price: requiredText(80, "Price"),
  description: requiredText(8000, "Description"),
  image_url: imageUrl().pipe(z.string({ error: "A main image is required" })),
  gallery: z.array(z.string().max(2048)).max(40).default([]),
  amenities: z
    .array(z.string().transform(clean).pipe(z.string().max(120)))
    .max(60)
    .default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  order: z.coerce.number().int().min(0).max(100000).default(0),
});

const serviceBase = z.object({
  title: requiredText(200, "Title"),
  description: requiredText(8000, "Description"),
  icon: optionalText(80).optional(),
  image_url: imageUrl().optional(),
  order: z.coerce.number().int().min(0).max(100000).default(0),
  published: z.boolean().default(true),
});

const blogPostBase = z.object({
  title: requiredText(250, "Title"),
  slug,
  content: requiredText(100000, "Content"),
  cover_image: imageUrl().optional(),
  excerpt: optionalText(500).optional(),
  published: z.boolean().default(false),
  published_at: z.union([z.iso.datetime({ offset: true }), z.null()]).default(null),
});

const teamBase = z.object({
  name: requiredText(120, "Name"),
  role: requiredText(120, "Role"),
  photo_url: imageUrl().optional(),
  bio: optionalText(2000).optional(),
  order: z.coerce.number().int().min(0).max(100000).default(0),
});

const testimonialBase = z.object({
  author: requiredText(120, "Author"),
  role: optionalText(120).optional(),
  quote: requiredText(2000, "Quote"),
  photo_url: imageUrl().optional(),
  published: z.boolean().default(true),
});

// The public form creates inquiries; the admin only ever edits them.
const inquiryBase = z.object({
  name: requiredText(120, "Name"),
  email,
  phone: z.union([phone, z.null(), z.literal("")]).transform((v) => v || null),
  type: requiredText(200, "Type"),
  message: text(8000),
  status: z.enum(INQUIRY_STATUSES),
  property_id: z.union([z.uuid(), z.null(), z.literal("")]).transform((v) => v || null),
  check_in: z.union([isoDate, z.null()]).default(null),
  check_out: z.union([isoDate, z.null()]).default(null),
  // Minor units. int4 caps at EUR 21,474,836 - ample for a stay.
  // null/"" FIRST: z.coerce.number() turns null into 0, and a union takes the
  // first branch that matches - so clearing an amount would have written a
  // real zero, which counts as revenue and hides the missing-amount flag.
  amount_cents: z
    .union([z.null(), z.literal(""), z.coerce.number().int().min(0).max(2147483647)])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  currency: z
    .string()
    .transform(clean)
    .pipe(z.string().regex(/^[A-Z]{3}$/, "Currency must be a 3-letter code"))
    .optional(),
  // confirmed_at and cancelled_at are intentionally not here. The server sets
  // them from the transition; a client must never be able to backdate revenue.
});

const propertyBookingBase = z.object({
  property_id: z.uuid(),
  start_date: isoDate,
  end_date: isoDate,
  source: z.enum(["manual", "inquiry"]).default("manual"),
  inquiry_id: z.union([z.uuid(), z.null()]).default(null),
  note: optionalText(500).optional(),
  guest_name: optionalText(120).optional(),
  guest_email: z.union([email, z.null(), z.literal("")]).transform((v) => v || null).optional(),
  guest_phone: z.union([phone, z.null(), z.literal("")]).transform((v) => v || null).optional(),
});

const endAfterStart = <T extends { start_date: string; end_date: string }>(v: T) =>
  v.end_date > v.start_date;

/**
 * Table name -> { create, update }.
 * `update` is partial: the admin UI sends single-field payloads for its
 * publish/feature toggles and for inline status changes.
 */
export const ADMIN_SCHEMAS: Record<
  string,
  { create: z.ZodType; update: z.ZodType }
> = {
  properties: { create: propertyBase, update: propertyBase.partial() },
  services: { create: serviceBase, update: serviceBase.partial() },
  blog_posts: { create: blogPostBase, update: blogPostBase.partial() },
  team: { create: teamBase, update: teamBase.partial() },
  testimonials: { create: testimonialBase, update: testimonialBase.partial() },
  inquiries: { create: inquiryBase, update: inquiryBase.partial() },
  property_bookings: {
    create: propertyBookingBase.refine(endAfterStart, {
      message: "End date must be after the start date",
      path: ["end_date"],
    }),
    update: propertyBookingBase.partial(),
  },
};

/** Turns a ZodError into one readable sentence for the UI. */
export function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((i) => (i.path.length ? `${i.path.join(".")}: ${i.message}` : i.message))
    .join("; ");
}

export type ParseResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Validates an admin payload for one collection.
 *
 * The update path exists because of a real data-loss bug. `.partial()` makes
 * each field optional but does NOT remove `.default()`, so an absent key still
 * resolves to its default: `{status:"booked"}` parsed to
 * `{status:"booked", check_in:null, check_out:null}`. Supabase writes every key
 * it is given, so those defaults overwrote real columns - a Featured toggle on
 * a property was writing gallery=[] and amenities=[] as well.
 *
 * So an update result is intersected with the keys the client actually sent.
 * Absent means untouched, whatever the schema defaults say. This holds for any
 * collection and survives someone adding a `.default()` later.
 */
export function parseAdminPayload(
  collection: string,
  mode: "create" | "update",
  body: unknown
): ParseResult {
  const schema = ADMIN_SCHEMAS[collection]?.[mode];
  if (!schema) return { ok: false, error: "Invalid collection" };

  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, error: formatZodError(parsed.error) };

  const data = { ...(parsed.data as Record<string, unknown>) };

  if (mode === "update") {
    // safeParse above only succeeds for a plain object, so this is safe.
    const sent = new Set(Object.keys(body as Record<string, unknown>));
    for (const key of Object.keys(data)) {
      if (!sent.has(key)) delete data[key];
    }
    if (Object.keys(data).length === 0) {
      return { ok: false, error: "Nothing to update" };
    }
  }

  return { ok: true, data };
}
