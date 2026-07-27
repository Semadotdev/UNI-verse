import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | UNI-verse",
  description: "Terms of Service for the UNI-verse manga reader application.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          Welcome to UNI-verse. These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement
          between you (&quot;you,&quot; &quot;your,&quot; or &quot;User&quot;) and UNI-verse (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;)
          governing your use of the UNI-verse manga reader application and related services
          (collectively, the &quot;Service&quot;). By accessing or using the Service, you agree to be bound
          by these Terms.
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By creating an account, accessing, or using the Service in any way, you acknowledge that you
          have read, understood, and agree to be bound by these Terms and our{" "}
          <a href="/legal/privacy">Privacy Policy</a>, which is incorporated herein by reference. If you
          do not agree to these Terms, you must not access or use the Service.
        </p>
        <p>
          You represent that you have the legal capacity to enter into these Terms. If you are using the
          Service on behalf of an organization, you represent that you have the authority to bind that
          organization to these Terms.
        </p>

        <h2>2. Eligibility</h2>
        <p>To use the Service, you must meet the following requirements:</p>
        <ul>
          <li>
            You must be at least <strong>13 years of age</strong> to create an account and use the
            Service. By creating an account, you represent and warrant that you are at least 13 years old.
          </li>
          <li>
            Access to content providers that contain mature, explicit, or not-safe-for-work (NSFW)
            material is restricted to users who are <strong>18 years of age or older</strong>. By
            providing your birth date during registration, you confirm that you meet the applicable age
            requirement.
          </li>
          <li>
            You must provide accurate, truthful, and complete registration information. You may not use a
            false identity or impersonate another person.
          </li>
        </ul>
        <p>
          If you are under the age of 18, you must have the consent of a parent or legal guardian to use
          the Service. By using the Service, you represent that any such consent has been obtained.
        </p>

        <h2>3. Account Registration &amp; Security</h2>
        <p>
          To access certain features, you must create an account. You agree to:
        </p>
        <ul>
          <li>Provide accurate, current, and complete information during registration</li>
          <li>Maintain and promptly update your account information to keep it accurate and complete</li>
          <li>Maintain the security and confidentiality of your login credentials</li>
          <li>Not share your account credentials with any third party</li>
          <li>Not create more than one account per person</li>
          <li>Not create an account using automated means or under false pretenses</li>
          <li>Notify us immediately at{" "}
            <a href="mailto:support@universe-app.com">support@universe-app.com</a>{" "}
            if you suspect unauthorized use of your account
          </li>
        </ul>
        <p>
          You are solely responsible for all activities that occur under your account. We are not liable
          for any loss or damage arising from your failure to maintain the security of your account.
          We reserve the right to suspend or terminate accounts that we reasonably believe have been
          compromised.
        </p>

        <h2>4. Acceptable Use Policy</h2>
        <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
        <ul>
          <li>Violate any applicable local, state, national, or international law or regulation</li>
          <li>Infringe upon or violate the intellectual property rights or any other rights of any third party</li>
          <li>Use the Service to distribute, transmit, or store harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable material</li>
          <li>Attempt to gain unauthorized access to the Service, other user accounts, or any computer systems or networks connected to the Service</li>
          <li>Interfere with, disrupt, or create an undue burden on the Service or the networks or services connected to the Service</li>
          <li>Use automated systems, bots, scrapers, spiders, or other automated means to access or collect data from the Service without our express written permission</li>
          <li>Circumvent, disable, or otherwise interfere with security-related features of the Service, including features that prevent or restrict the use or copying of any content</li>
          <li>Circumvent or bypass age verification mechanisms or content restrictions</li>
          <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, algorithms, or underlying structure of the Service</li>
          <li>Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service for commercial purposes without our express written consent</li>
          <li>Impersonate or misrepresent your affiliation with any person or entity</li>
          <li>Use the Service to send unsolicited communications, advertisements, or spam</li>
          <li>Collect, harvest, or store personal information of other users without their consent</li>
        </ul>

        <h2>5. Intellectual Property</h2>

        <h3>5.1 UNI-verse Intellectual Property</h3>
        <p>
          The Service, including its design, user interface, code, algorithms, logos, trademarks, brand
          elements, and all related intellectual property, is owned by UNI-verse and protected by
          copyright, trademark, and other intellectual property laws. You are granted a limited,
          non-exclusive, non-transferable, revocable license to use the Service for personal,
          non-commercial purposes in accordance with these Terms.
        </p>

        <h3>5.2 Third-Party Content</h3>
        <p>
          All manga content displayed through the Service — including but not limited to cover images,
          chapter pages, titles, descriptions, genres, and metadata — is the intellectual property of its
          respective owners, creators, authors, artists, publishers, and licensors. UNI-verse does not
          claim ownership of any third-party content.
        </p>
        <p>
          Your use of manga content through the Service is subject to the intellectual property rights of
          the respective content owners. You may not reproduce, distribute, publicly display, or create
          derivative works from any manga content accessed through the Service, except as permitted by the
          content owner or applicable law.
        </p>

        <h2>6. Content Sources &amp; Aggregation Model</h2>
        <p>
          UNI-verse operates as a content aggregator that retrieves and displays manga content from
          third-party sources. We do not host, upload, cache, or store any manga content on our servers.
          All content is retrieved in real-time from the following third-party providers:
        </p>
        <ul>
          <li><strong>Asura Scans</strong> &mdash; asurascans.com</li>
          <li><strong>MangaDex</strong> &mdash; mangadex.org</li>
          <li><strong>Manhwa18</strong> &mdash; manhwa18.cc</li>
        </ul>
        <p>
          Each content provider is solely responsible for the content it hosts, including its legality,
          accuracy, and compliance with applicable laws. UNI-verse does not endorse, verify, or assume
          responsibility for any content from third-party providers.
        </p>
        <p>
          If you believe that content displayed through the Service infringes your copyright, please follow
          the process outlined in our{" "}
          <a href="/legal/dmca">DMCA / Content Removal Request</a> page.
        </p>

        <h2>7. User-Generated Content</h2>
        <p>
          The Service may currently or in the future allow you to create, submit, or share content such as
          reviews, comments, ratings, or library organization. If you submit any content through the
          Service:
        </p>
        <ul>
          <li>
            You retain ownership of your content. You grant UNI-verse a worldwide, non-exclusive,
            royalty-free license to use, display, reproduce, and distribute your content in connection
            with operating the Service.
          </li>
          <li>
            You represent and warrant that your content does not infringe any third-party rights,
            including intellectual property, privacy, or publicity rights.
          </li>
          <li>
            You agree not to submit content that is unlawful, defamatory, obscene, harmful, threatening,
            harassing, or otherwise objectionable.
          </li>
          <li>
            We reserve the right to remove any user-generated content at our sole discretion, without
            prior notice, for any reason.
          </li>
        </ul>

        <h2>8. Age Requirements &amp; NSFW Content</h2>
        <p>
          You must be at least 13 years old to use the Service. Access to content providers that contain
          mature or explicit material (including but not limited to content tagged as Hentai, Ecchi,
          Mature, Smut, or similar categories) is restricted to users who are 18 years of age or older.
        </p>
        <p>
          Age verification is performed based on the birth date you provide during registration. You
          represent that this information is truthful and accurate. We reserve the right to restrict,
          suspend, or terminate accounts that provide false age information.
        </p>
        <p>
          We implement age-gating measures but cannot guarantee that all inappropriate content will be
          filtered. Users access NSFW content at their own discretion and risk.
        </p>

        <h2>9. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY
          KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ACCURACY.
        </p>
        <p>
          Without limiting the foregoing, we do not warrant that:
        </p>
        <ul>
          <li>The Service will be uninterrupted, timely, secure, or error-free</li>
          <li>The results obtained from the use of the Service will be accurate or reliable</li>
          <li>The quality of any content, services, or information obtained through the Service will meet your expectations</li>
          <li>Any errors in the Service will be corrected</li>
          <li>The Service is free of viruses or other harmful components</li>
        </ul>
        <p>
          The Service does not provide professional advice of any kind. Any reliance you place on
          information provided through the Service is strictly at your own risk.
        </p>

        <h2>10. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL UNI-VERSE, ITS OPERATORS,
          AFFILIATES, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, USE, GOODWILL,
          OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH:
        </p>
        <ul>
          <li>Your access to, use of, or inability to use the Service</li>
          <li>Any content or materials obtained through the Service</li>
          <li>Any unauthorized access to or alteration of your data</li>
          <li>Any third-party conduct or content on or through the Service</li>
          <li>Any errors, omissions, or inaccuracies in the Service</li>
        </ul>
        <p>
          In no event shall our aggregate liability exceed the greater of (a) the amount you paid to us
          in the twelve (12) months preceding the claim, or (b) one hundred dollars ($100.00). This
          limitation applies regardless of the legal theory on which the claim is based.
        </p>

        <h2>11. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless UNI-verse and its operators, affiliates,
          directors, employees, and agents from and against any claims, liabilities, damages, losses,
          costs, or expenses (including reasonable attorneys&apos; fees) arising out of or in connection
          with:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any rights of a third party, including intellectual property rights</li>
          <li>Any content you submit, post, or transmit through the Service</li>
        </ul>

        <h2>12. Termination</h2>

        <h3>12.1 Termination by You</h3>
        <p>
          You may stop using the Service at any time. To delete your account and associated data, please
          contact us at{" "}
          <a href="mailto:support@universe-app.com">support@universe-app.com</a>. Account deletion is
          processed within 30 days.
        </p>

        <h3>12.2 Termination by UNI-verse</h3>
        <p>
          We reserve the right to suspend or terminate your account and access to the Service at our sole
          discretion, with or without prior notice, for any reason, including but not limited to:
        </p>
        <ul>
          <li>Violation of these Terms or any applicable law</li>
          <li>Conduct that we believe is harmful to other users, us, or third parties</li>
          <li>Fraudulent, abusive, or illegal activity</li>
          <li>Extended periods of inactivity</li>
          <li>Requests by law enforcement or government agencies</li>
        </ul>

        <h3>12.3 Effect of Termination</h3>
        <p>
          Upon termination, your right to use the Service ceases immediately. We may retain your data
          for a period of up to 30 days following termination to facilitate account deletion, after which
          your personal data will be permanently deleted in accordance with our{" "}
          <a href="/legal/privacy">Privacy Policy</a>.
        </p>

        <h2>13. Dispute Resolution</h2>

        <h3>13.1 Governing Law</h3>
        <p>
          These Terms shall be governed by and construed in accordance with applicable laws, without
          regard to conflict of law principles.
        </p>

        <h3>13.2 Informal Resolution</h3>
        <p>
          Before filing any formal legal action, you agree to first contact us at{" "}
          <a href="mailto:legal@universe-app.com">legal@universe-app.com</a> and attempt to resolve any
          dispute informally for a period of at least thirty (30) days. Most concerns can be resolved
          quickly and amicably through direct communication.
        </p>

        <h3>13.3 Formal Proceedings</h3>
        <p>
          If a dispute cannot be resolved informally, either party may initiate formal proceedings in the
          courts of competent jurisdiction. Each party waives any objection to such proceedings, including
          objection based on inconvenient forum.
        </p>

        <h3>13.4 Class Action Waiver</h3>
        <p>
          TO THE EXTENT PERMITTED BY LAW, YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE
          CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE
          ACTION. IF FOR ANY REASON A CLAIM PROCEEDS IN COURT, YOU AND UNI-VERSE EACH WAIVE ANY RIGHT
          TO A JURY TRIAL.
        </p>

        <h2>14. Modifications to the Service</h2>
        <p>
          We reserve the right to modify, suspend, or discontinue any part of the Service at any time,
          with or without notice. We will make reasonable efforts to notify you of material changes,
          including through the Service interface or by email. We are not liable for any modification,
          suspension, or discontinuation of the Service.
        </p>

        <h2>15. Modifications to These Terms</h2>
        <p>
          We reserve the right to modify these Terms at any time. When we make material changes, we will
          update the &quot;Last updated&quot; date at the top of this page and, where appropriate, notify you
          through the Service or by email. Your continued use of the Service after changes are posted
          constitutes your acceptance of the updated Terms.
        </p>

        <h2>16. Severability</h2>
        <p>
          If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of
          competent jurisdiction, such provision shall be modified to the minimum extent necessary to make
          it valid and enforceable, and the remaining provisions shall continue in full force and effect.
        </p>

        <h2>17. Entire Agreement</h2>
        <p>
          These Terms, together with the{" "}
          <a href="/legal/privacy">Privacy Policy</a> and any other legal notices or policies published
          by us on the Service, constitute the entire agreement between you and UNI-verse regarding the
          Service and supersede all prior and contemporaneous understandings, agreements, representations,
          and warranties.
        </p>

        <h2>18. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at{" "}
          <a href="mailto:legal@universe-app.com">legal@universe-app.com</a>.
        </p>
      </div>
    </div>
  );
}
