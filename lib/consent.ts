// The exact words shown beside the consent checkbox.
//
// This is a single constant because the wording has to be identical in three
// places: the label a person reads, the record stored with their submission,
// and any later demonstration that consent was given. GDPR Article 7(1) puts
// the burden of proof on the controller, and "they ticked a box" proves
// nothing if nobody can say what the box said.
//
// If this text ever changes, change the version too. Old records keep the
// wording that was actually shown to them.

export const CONTACT_CONSENT_VERSION = "2026-09-20";

export const CONTACT_CONSENT_TEXT =
  "I agree that HighTunis may use the details I have provided to contact me about this enquiry, and I have read the Privacy Policy.";

/** Stored verbatim on the enquiry, with the version so wording changes stay traceable. */
export function consentRecord(): {
  consent_given: true;
  consent_text: string;
  consented_at: string;
} {
  return {
    consent_given: true,
    consent_text: `v${CONTACT_CONSENT_VERSION}: ${CONTACT_CONSENT_TEXT}`,
    consented_at: new Date().toISOString(),
  };
}
