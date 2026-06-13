"use client";

import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

import { useAuthStore } from "@/store/authStore";
import { LegalTopNav } from "./LegalTopNav";

const LAST_UPDATED = "13 June 2026";
const CONTACT_EMAIL = "info@joincontinuum.co.za";

type Section = { id: string; title: string };

const SECTIONS: Section[] = [
  { id: "intro", title: "1. Introduction" },
  { id: "responsible-party", title: "2. Who is responsible for your data" },
  { id: "what-we-collect", title: "3. Information we collect" },
  { id: "how-we-use", title: "4. How we use your information" },
  { id: "lawful-basis", title: "5. Lawful basis for processing" },
  { id: "sharing", title: "6. Sharing and disclosure" },
  { id: "security", title: "7. How we protect your information" },
  { id: "retention", title: "8. How long we keep your information" },
  { id: "your-rights", title: "9. Your rights under POPIA" },
  { id: "cross-border", title: "10. Cross-border transfers" },
  { id: "cookies", title: "11. Cookies and analytics" },
  { id: "children", title: "12. Children's information" },
  { id: "complaints", title: "13. Complaints and the Regulator" },
  { id: "changes", title: "14. Changes to this policy" },
  { id: "contact", title: "15. Contact us" },
];

export function PrivacyPolicy() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <div className="min-h-screen bg-[#fafbfc] font-['Satoshi',sans-serif]">
      {!isAuthenticated && <LegalTopNav />}
      <div className="mx-auto max-w-[820px] px-5 py-10 sm:py-14">
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-8 inline-flex items-center gap-1 rounded-[8px] border border-[#ebedee] bg-white px-3 py-2 text-[14px] font-medium text-[#0b191f] outline-none ring-offset-2 transition-colors hover:bg-[#f9f9f9] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
            Back
          </button>
        )}

        <main>
          <header className="mb-10 border-b border-[#ebedee] pb-8">
            <h1 className="text-[32px] font-semibold leading-tight text-[#0b191f]">
              Privacy Policy
            </h1>
            <p className="mt-3 max-w-[660px] text-[16px] leading-relaxed text-[#4a565c]">
              This policy explains how Continuum collects, uses, shares and
              protects your personal information, and the rights you have under
              the Protection of Personal Information Act, 2013 (POPIA) of South
              Africa.
            </p>
            <p className="mt-4 text-[13px] font-medium uppercase tracking-wide text-[#8a949a]">
              Last updated: {LAST_UPDATED}
            </p>
          </header>

          <nav aria-label="On this page" className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#8a949a]">
              On this page
            </h2>
            <ol className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[14px] text-[#4a565c] underline-offset-2 outline-none hover:text-[#0b191f] hover:underline focus-visible:underline"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10 text-[15px] leading-7 text-[#3a464c]">
            <Section id="intro" title="1. Introduction">
              <p>
                Continuum (&ldquo;Continuum&rdquo;, &ldquo;we&rdquo;,
                &ldquo;us&rdquo; or &ldquo;our&rdquo;) is committed to protecting
                your privacy and processing your personal information lawfully,
                fairly and transparently. This policy applies to the Continuum
                platform, the client portal and related services (the
                &ldquo;Service&rdquo;).
              </p>
              <p>
                In this policy, &ldquo;personal information&rdquo; has the
                meaning given to it in POPIA, broadly, information that relates
                to an identifiable, living natural person and, where applicable,
                an identifiable existing juristic person.
              </p>
            </Section>

            <Section
              id="responsible-party"
              title="2. Who is responsible for your data"
            >
              <p>
                For the purposes of POPIA, Continuum is the &ldquo;responsible
                party&rdquo; that determines the purpose of and means for
                processing your personal information. Where we process personal
                information on behalf of a customer (for example, data your
                organisation enters about its own clients), the customer is the
                responsible party and we act as an &ldquo;operator&rdquo; on
                their behalf.
              </p>
              <p>
                Our Information Officer can be reached at <ContactLink /> for any
                privacy-related queries.
              </p>
            </Section>

            <Section id="what-we-collect" title="3. Information we collect">
              <p>We collect the following categories of personal information:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-[#0b191f]">
                    Account information
                  </span>
                  , such as your name, email address, password (stored in hashed
                  form), role and profile details.
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    Workspace content
                  </span>
                  , such as projects, tasks, comments, time entries, invoices
                  and files you or your team create within the Service.
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    Usage and device data
                  </span>
                  , such as log data, IP address, browser type, and how you
                  interact with the Service, used to keep it secure and reliable.
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    Billing information
                  </span>
                  , such as the details necessary to process subscriptions and
                  payments.
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    Communications
                  </span>
                  , such as messages you send us, including support requests and
                  feedback.
                </li>
              </ul>
            </Section>

            <Section id="how-we-use" title="4. How we use your information">
              <p>We process personal information to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>provide, operate and maintain the Service;</li>
                <li>
                  authenticate users and apply role-based access controls;
                </li>
                <li>process payments and generate invoices;</li>
                <li>
                  respond to your requests and provide customer support;
                </li>
                <li>
                  secure the Service, prevent fraud and troubleshoot issues;
                </li>
                <li>
                  improve and develop features and understand how the Service is
                  used; and
                </li>
                <li>comply with our legal and regulatory obligations.</li>
              </ul>
              <p>
                We do not sell your personal information, and we do not use it
                for purposes incompatible with those described above.
              </p>
            </Section>

            <Section id="lawful-basis" title="5. Lawful basis for processing">
              <p>
                We process personal information only where POPIA permits it,
                including where:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  processing is necessary to perform our contract with you (to
                  provide the Service);
                </li>
                <li>you have given your consent;</li>
                <li>
                  processing is necessary to comply with a legal obligation; or
                </li>
                <li>
                  processing is necessary for our legitimate interests, balanced
                  against your rights and interests.
                </li>
              </ul>
              <p>
                Where we rely on consent, you may withdraw it at any time,
                without affecting processing carried out before withdrawal.
              </p>
            </Section>

            <Section id="sharing" title="6. Sharing and disclosure">
              <p>
                We share personal information only as necessary and never sell
                it. We may share it with:
              </p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <span className="font-medium text-[#0b191f]">operators</span>,
                  such as trusted service providers (including hosting, payment
                  and email providers) who process data on our behalf under
                  written agreements and appropriate safeguards;
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    members of your workspace
                  </span>
                  , where content is visible to other users in line with the
                  permissions assigned to them;
                </li>
                <li>
                  <span className="font-medium text-[#0b191f]">
                    authorities
                  </span>
                  , where required by law or to protect rights, safety or the
                  integrity of the Service.
                </li>
              </ul>
            </Section>

            <Section id="security" title="7. How we protect your information">
              <p>
                We maintain appropriate, reasonable technical and organisational
                measures to protect personal information against loss, damage,
                and unauthorised access or processing, as required by POPIA.
                These include encryption in transit, access controls and secure
                infrastructure. If a security compromise affecting your personal
                information occurs, we will notify you and the Information
                Regulator as required by law.
              </p>
            </Section>

            <Section
              id="retention"
              title="8. How long we keep your information"
            >
              <p>
                We retain personal information only for as long as necessary to
                fulfil the purposes described in this policy, to comply with our
                legal obligations, resolve disputes and enforce our agreements.
                When personal information is no longer required, we will delete
                or de-identify it.
              </p>
            </Section>

            <Section id="your-rights" title="9. Your rights under POPIA">
              <p>Subject to applicable law, you have the right to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  be told whether we hold personal information about you and to
                  request access to it;
                </li>
                <li>
                  request that we correct or delete personal information that is
                  inaccurate, irrelevant, excessive, out of date or unlawfully
                  obtained;
                </li>
                <li>
                  object, on reasonable grounds, to the processing of your
                  personal information;
                </li>
                <li>withdraw consent where we rely on it; and</li>
                <li>
                  lodge a complaint with the Information Regulator.
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us at <ContactLink />.
                We may need to verify your identity before responding.
              </p>
            </Section>

            <Section id="cross-border" title="10. Cross-border transfers">
              <p>
                Some of our service providers may process personal information
                outside South Africa. Where this happens, we take steps to
                ensure that the recipient is subject to laws, binding rules or
                agreements that provide an adequate level of protection
                consistent with POPIA.
              </p>
            </Section>

            <Section id="cookies" title="11. Cookies and analytics">
              <p>
                We use cookies and similar technologies to keep you signed in,
                remember your preferences, and understand how the Service is
                used so we can improve it. You can control cookies through your
                browser settings, although disabling them may affect how the
                Service works.
              </p>
            </Section>

            <Section id="children" title="12. Children's information">
              <p>
                The Service is intended for use by businesses and their
                authorised users and is not directed at children. We do not
                knowingly collect personal information from children without the
                consent of a competent person as required by POPIA.
              </p>
            </Section>

            <Section id="complaints" title="13. Complaints and the Regulator">
              <p>
                If you believe we have not handled your personal information in
                accordance with POPIA, please contact us first so we can address
                your concern. You also have the right to lodge a complaint with
                the Information Regulator of South Africa, by email at
                inforeg@inforegulator.org.za or via inforegulator.org.za.
              </p>
            </Section>

            <Section id="changes" title="14. Changes to this policy">
              <p>
                We may update this Privacy Policy from time to time. When we make
                material changes, we will update the &ldquo;Last updated&rdquo;
                date above and, where appropriate, provide additional notice.
                Please review this policy periodically.
              </p>
            </Section>

            <Section id="contact" title="15. Contact us">
              <p>
                For any questions about this policy or how we handle your
                personal information, or to exercise your POPIA rights, contact
                our Information Officer at <ContactLink />.
              </p>
            </Section>
          </div>
        </main>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6 space-y-3">
      <h2
        id={`${id}-heading`}
        className="text-[18px] font-semibold text-[#0b191f]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactLink() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="font-medium text-[#2563eb] underline underline-offset-2 outline-none hover:text-[#1d4ed8] focus-visible:ring-2 focus-visible:ring-ring"
    >
      {CONTACT_EMAIL}
    </a>
  );
}
