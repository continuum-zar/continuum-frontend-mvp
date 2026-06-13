"use client";

import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router";

import { useAuthStore } from "@/store/authStore";
import { LegalTopNav } from "./LegalTopNav";

const LAST_UPDATED = "13 June 2026";
const CONTACT_EMAIL = "info@joincontinuum.co.za";

type Section = { id: string; title: string };

const SECTIONS: Section[] = [
  { id: "acceptance", title: "1. Acceptance of these Terms" },
  { id: "service", title: "2. The Continuum service" },
  { id: "accounts", title: "3. Accounts and registration" },
  { id: "acceptable-use", title: "4. Acceptable use" },
  { id: "content", title: "5. Your content and data" },
  { id: "roles", title: "6. Roles, access and permissions" },
  { id: "billing", title: "7. Subscriptions, billing and invoices" },
  { id: "ip", title: "8. Intellectual property" },
  { id: "third-party", title: "9. Third-party services and integrations" },
  { id: "availability", title: "10. Availability and changes to the service" },
  { id: "termination", title: "11. Suspension and termination" },
  { id: "disclaimers", title: "12. Disclaimers" },
  { id: "liability", title: "13. Limitation of liability" },
  { id: "indemnity", title: "14. Indemnity" },
  { id: "law", title: "15. Governing law" },
  { id: "changes", title: "16. Changes to these Terms" },
  { id: "contact", title: "17. Contact us" },
];

export function TermsOfService() {
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
              Terms of Service
            </h1>
            <p className="mt-3 max-w-[640px] text-[16px] leading-relaxed text-[#4a565c]">
              These Terms govern your access to and use of Continuum, a project
              and work-management platform. Please read them carefully, because
              by using Continuum you agree to be bound by them.
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
            <Section id="acceptance" title="1. Acceptance of these Terms">
              <p>
                These Terms of Service (the &ldquo;Terms&rdquo;) form a binding
                agreement between you and Continuum (&ldquo;Continuum&rdquo;,
                &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;). By
                creating an account, accessing or using the platform, the
                associated client portal, or any related services
                (collectively, the &ldquo;Service&rdquo;), you confirm that you
                have read, understood and agree to be bound by these Terms.
              </p>
              <p>
                If you are using the Service on behalf of an organisation, you
                represent that you are authorised to accept these Terms on its
                behalf, and references to &ldquo;you&rdquo; include that
                organisation. If you do not agree, you may not use the Service.
              </p>
            </Section>

            <Section id="service" title="2. The Continuum service">
              <p>
                Continuum provides tools for planning work, managing projects
                and tasks, tracking time, collaborating with team members, and
                handling billing and invoices. The Service is offered on a
                software-as-a-service basis and may evolve over time as we add,
                change or remove features.
              </p>
            </Section>

            <Section id="accounts" title="3. Accounts and registration">
              <p>
                To use most features you must register for an account. You agree
                to provide accurate and complete information and to keep it up to
                date. You are responsible for safeguarding your login
                credentials and for all activity that occurs under your account.
              </p>
              <p>
                Notify us promptly at <ContactLink /> if you suspect any
                unauthorised use of your account. We are not liable for any loss
                arising from your failure to keep your credentials secure.
              </p>
            </Section>

            <Section id="acceptable-use" title="4. Acceptable use">
              <p>You agree not to:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  use the Service in violation of any applicable law or
                  regulation;
                </li>
                <li>
                  upload or transmit malicious code, or attempt to gain
                  unauthorised access to the Service or its related systems;
                </li>
                <li>
                  interfere with or disrupt the integrity or performance of the
                  Service;
                </li>
                <li>
                  reverse engineer or copy any part of the Service except as
                  permitted by law; or
                </li>
                <li>
                  use the Service to store or transmit content that is
                  unlawful, infringing, or harmful to others.
                </li>
              </ul>
            </Section>

            <Section id="content" title="5. Your content and data">
              <p>
                You retain all rights in the projects, tasks, files, comments
                and other material you submit to the Service (&ldquo;Your
                Content&rdquo;). You grant us a limited licence to host, store,
                process and display Your Content solely to provide and improve
                the Service.
              </p>
              <p>
                You are responsible for Your Content and for ensuring you have
                the necessary rights to submit it. Our handling of personal
                information is described in our Privacy Policy.
              </p>
            </Section>

            <Section id="roles" title="6. Roles, access and permissions">
              <p>
                Access to projects and their data is governed by a role-based
                access control model. Project owners and administrators may
                assign roles to members, and those roles determine which
                sections and actions are available to each user. Access is
                always additive, so holding multiple roles grants the combined
                set of their permissions.
              </p>
              <p>
                You agree to use only the access granted to you and not to
                attempt to circumvent the permission controls applied to your
                account.
              </p>
            </Section>

            <Section id="billing" title="7. Subscriptions, billing and invoices">
              <p>
                Paid plans are billed in advance on the cadence shown at
                checkout. Fees are stated in the applicable currency (including
                South African Rand, ZAR) and are exclusive of taxes unless
                stated otherwise. Invoices generated within the Service are
                tools for your own billing workflows and do not constitute tax
                advice.
              </p>
              <p>
                Unless required by law, fees already paid are non-refundable.
                We may change pricing on reasonable notice, with changes taking
                effect from your next billing cycle.
              </p>
            </Section>

            <Section id="ip" title="8. Intellectual property">
              <p>
                The Service, including its software, design, branding and
                content (excluding Your Content), is owned by Continuum or its
                licensors and is protected by intellectual property laws. These
                Terms do not grant you any right to our trademarks or other
                brand features without our prior written consent.
              </p>
            </Section>

            <Section
              id="third-party"
              title="9. Third-party services and integrations"
            >
              <p>
                The Service may integrate with third-party products (for
                example, code repositories or email providers). Your use of
                those products is governed by their own terms and privacy
                practices. We are not responsible for third-party services and
                do not endorse them.
              </p>
            </Section>

            <Section
              id="availability"
              title="10. Availability and changes to the service"
            >
              <p>
                We aim to keep the Service available and reliable but do not
                guarantee uninterrupted access. We may modify, suspend or
                discontinue features, perform maintenance, or release updates.
                Where a change is material, we will use reasonable efforts to
                notify you.
              </p>
            </Section>

            <Section id="termination" title="11. Suspension and termination">
              <p>
                You may stop using the Service at any time. We may suspend or
                terminate your access if you breach these Terms, if required by
                law, or to protect the Service or other users. On termination,
                your right to use the Service ceases. We will make Your Content
                available for export for a reasonable period where practicable,
                after which it may be deleted.
              </p>
            </Section>

            <Section id="disclaimers" title="12. Disclaimers">
              <p>
                The Service is provided &ldquo;as is&rdquo; and &ldquo;as
                available&rdquo; without warranties of any kind, whether
                express or implied, to the fullest extent permitted by law. We
                do not warrant that the Service will be error-free or meet your
                specific requirements.
              </p>
            </Section>

            <Section id="liability" title="13. Limitation of liability">
              <p>
                To the maximum extent permitted by law, Continuum will not be
                liable for any indirect, incidental, special or consequential
                loss, or for loss of profits, data or goodwill, arising from
                your use of the Service. Our total liability for any claim under
                these Terms will not exceed the amount you paid us for the
                Service in the twelve months preceding the claim.
              </p>
            </Section>

            <Section id="indemnity" title="14. Indemnity">
              <p>
                You agree to indemnify and hold Continuum harmless from any
                claims, damages or costs arising from Your Content or your
                breach of these Terms, except to the extent caused by our own
                wrongful conduct.
              </p>
            </Section>

            <Section id="law" title="15. Governing law">
              <p>
                These Terms are governed by the laws of the Republic of South
                Africa, and you submit to the non-exclusive jurisdiction of the
                South African courts in respect of any dispute arising from
                them.
              </p>
            </Section>

            <Section id="changes" title="16. Changes to these Terms">
              <p>
                We may update these Terms from time to time. When we make
                material changes, we will update the &ldquo;Last updated&rdquo;
                date above and, where appropriate, provide additional notice.
                Your continued use of the Service after changes take effect
                constitutes acceptance of the revised Terms.
              </p>
            </Section>

            <Section id="contact" title="17. Contact us">
              <p>
                If you have any questions about these Terms, please contact us
                at <ContactLink />.
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
