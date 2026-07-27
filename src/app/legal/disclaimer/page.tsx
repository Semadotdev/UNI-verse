import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | UNI-verse",
  description: "Legal disclaimer for the UNI-verse manga reader application.",
};

export default function DisclaimerPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Disclaimer</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          The information provided through UNI-verse (the &quot;Service&quot;) is for general informational
          purposes only. All content and services are provided on an &quot;as is&quot; and &quot;as
          available&quot; basis without any warranties of any kind, either express or implied. Please read
          this disclaimer carefully before using the Service.
        </p>

        <h2>1. External Content Disclaimer</h2>
        <p>
          UNI-verse aggregates and displays manga content from third-party sources. We do not create,
          produce, host, publish, or distribute any of the manga content displayed through the Service.
          All content — including artwork, text, translations, and metadata — is attributed to its
          respective creators, authors, translators, publishers, and content providers.
        </p>
        <p>
          The views, opinions, and content expressed in any manga displayed through the Service are those
          of the original authors and creators and do not necessarily reflect the views or opinions of
          UNI-verse.
        </p>
        <p>
          We do not endorse, warrant, or assume responsibility for the accuracy, completeness, legality,
          or appropriateness of any content displayed through the Service. Content may contain errors,
          inaccuracies, or material that you find objectionable.
        </p>

        <h2>2. No Warranties</h2>
        <p>
          To the fullest extent permitted by applicable law, UNI-verse disclaims all warranties,
          express or implied, including but not limited to:
        </p>
        <ul>
          <li>
            <strong>Warranties of merchantability:</strong> that the Service is merchantable and fit for
            a particular purpose.
          </li>
          <li>
            <strong>Warranties of non-infringement:</strong> that the Service does not infringe any
            third-party intellectual property rights.
          </li>
          <li>
            <strong>Warranties of accuracy:</strong> that the content, information, or materials displayed
            through the Service are accurate, complete, reliable, or current.
          </li>
          <li>
            <strong>Warranties of availability:</strong> that the Service will be available, uninterrupted,
            timely, secure, or error-free.
          </li>
          <li>
            <strong>Warranties of safety:</strong> that the Service or its servers are free of viruses,
            malware, or other harmful components.
          </li>
        </ul>

        <h2>3. Third-Party Links &amp; Services</h2>
        <p>
          The Service may contain links, references, or embedded content from third-party websites and
          services that are not owned or controlled by UNI-verse, including but not limited to:
        </p>
        <ul>
          <li>Manga content providers (Asura Scans, MangaDex, Manhwa18)</li>
          <li>External websites linked in manga descriptions or metadata</li>
          <li>Third-party authentication providers (Supabase)</li>
        </ul>
        <p>
          We have no control over and assume no responsibility for the content, privacy policies,
          practices, terms of service, or availability of any third-party sites or services. The
          inclusion of any link does not imply endorsement, recommendation, or affiliation by UNI-verse.
        </p>
        <p>
          You acknowledge and agree that UNI-verse shall not be responsible or liable, directly or
          indirectly, for any damage or loss caused or alleged to be caused by or in connection with the
          use of or reliance on any content, goods, or services available on or through any third-party
          site or service.
        </p>

        <h2>4. NSFW Content Warning</h2>
        <p>
          The Service provides access to content providers that may contain mature, explicit, violent,
          sexual, or otherwise not-safe-for-work (NSFW) material. This content may include but is not
          limited to nudity, sexual content, graphic violence, and other material that some individuals
          may find offensive or objectionable.
        </p>
        <p>
          While we implement age verification measures (requiring a birth date indicating age 18 or
          older) to restrict access to NSFW content providers, these measures have inherent limitations:
        </p>
        <ul>
          <li>Age verification is based on self-reported birth date and cannot be independently verified</li>
          <li>Age-gating may not prevent access to all mature content across all providers</li>
          <li>Content classifications may vary between providers and may not be comprehensive</li>
        </ul>
        <p>
          Users access NSFW content at their own discretion and risk. UNI-verse is not responsible for
          any content encountered through third-party providers. Parents and guardians should be aware
          that the Service contains age-restricted content and should use parental controls if
          appropriate.
        </p>

        <h2>5. No Professional Advice</h2>
        <p>
          The Service does not provide professional advice of any kind, including but not limited to:
        </p>
        <ul>
          <li>Legal advice</li>
          <li>Medical or health advice</li>
          <li>Financial or investment advice</li>
          <li>Psychological or therapeutic advice</li>
          <li>Educational or academic certification</li>
        </ul>
        <p>
          Any reliance you place on information provided through the Service is strictly at your own risk.
          Manga content is fictional and artistic in nature and should not be relied upon as a source of
          factual information.
        </p>

        <h2>6. Service Availability</h2>
        <p>
          We strive to keep the Service available and operational at all times. However, we do not
          guarantee uninterrupted or error-free access. The Service may be temporarily unavailable due
          to:
        </p>
        <ul>
          <li>Scheduled maintenance or updates</li>
          <li>Server failures or technical issues</li>
          <li>Third-party service outages (Supabase, content providers)</li>
          <li>Internet connectivity issues</li>
          <li>Force majeure events (natural disasters, acts of war, government actions, etc.)</li>
        </ul>
        <p>
          We are not liable for any loss or damage resulting from the unavailability of the Service,
          including loss of reading progress, library data, or other information, to the extent permitted
          by applicable law.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL UNI-VERSE, ITS OPERATORS,
          AFFILIATES, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY:
        </p>
        <ul>
          <li>
            <strong>Indirect, incidental, special, consequential, or punitive damages</strong> arising
            out of or relating to your use of or inability to use the Service.
          </li>
          <li>
            <strong>Loss of data, revenue, profits, or business opportunities</strong> resulting from
            any content, services, or materials obtained through the Service.
          </li>
          <li>
            <strong>Unauthorized access to or alteration of your data</strong> or transmissions.
          </li>
          <li>
            <strong>Conduct or content of any third party</strong> on or through the Service.
          </li>
        </ul>
        <p>
          Our total aggregate liability for all claims arising out of or relating to these Terms or the
          Service shall not exceed the greater of (a) the amount you paid to us in the twelve (12) months
          preceding the claim, or (b) one hundred dollars ($100.00).
        </p>

        <h2>8. Jurisdiction-Specific Disclaimers</h2>
        <p>
          Some jurisdictions do not allow certain exclusions or limitations of warranties or liability.
          In such jurisdictions, the exclusions and limitations in this disclaimer apply to the maximum
          extent permitted by applicable law. Specifically:
        </p>
        <ul>
          <li>
            If you are a resident of the European Economic Area (EEA), nothing in this disclaimer is
            intended to exclude or limit your statutory consumer rights under applicable EU law.
          </li>
          <li>
            If you are a resident of the United Kingdom, nothing in this disclaimer is intended to
            exclude or limit your rights under the Consumer Rights Act 2015.
          </li>
          <li>
            If you are a resident of Australia, nothing in this disclaimer is intended to exclude or
            limit guarantees implied by the Australian Consumer Law.
          </li>
        </ul>

        <h2>9. Indemnification</h2>
        <p>
          To the extent permitted by applicable law, you agree to indemnify, defend, and hold harmless
          UNI-verse and its operators from and against any claims, liabilities, damages, losses, costs,
          or expenses (including reasonable attorneys&apos; fees) arising out of or relating to your use
          of the Service, your violation of these Terms, or your violation of any rights of a third
          party.
        </p>

        <h2>10. Contact</h2>
        <p>
          If you have any questions about this Disclaimer, please contact us at{" "}
          <a href="mailto:legal@universe-app.com">legal@universe-app.com</a>.
        </p>
      </div>
    </div>
  );
}
