import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | UNI-verse",
  description: "Privacy Policy for the UNI-verse manga reader application.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          Welcome to UNI-verse (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect,
          use, disclose, and safeguard your information when you use our manga reader web application and
          progressive web app (collectively, the &quot;Service&quot;). Please read this policy carefully. By using
          the Service, you agree to the collection and use of information in accordance with this policy.
        </p>

        <h2>1. Information We Collect</h2>

        <h3>1.1 Information You Provide</h3>
        <p>We collect information that you voluntarily provide when you:</p>
        <ul>
          <li>
            <strong>Create an account:</strong> email address, username, display name, and birth date.
            Your birth date is collected solely for age verification purposes related to content filtering.
          </li>
          <li>
            <strong>Use the Service:</strong> reading history, library selections, bookmarked chapters, folder
            organization, and reader preferences (theme, reading mode, scale type, background color, brightness,
            display settings).
          </li>
          <li>
            <strong>Contact us:</strong> any information you provide when reaching out to our support or
            compliance teams.
          </li>
        </ul>

        <h3>1.2 Information Collected Automatically</h3>
        <p>When you access the Service, we may automatically collect:</p>
        <ul>
          <li>Device type, browser type and version, operating system</li>
          <li>IP address (used for service delivery and abuse prevention)</li>
          <li>Pages viewed, features used, and interaction patterns within the Service</li>
          <li>Referring URL and exit pages</li>
          <li>Date and time of access</li>
        </ul>

        <h3>1.3 Information We Do Not Collect</h3>
        <p>We do not intentionally collect:</p>
        <ul>
          <li>Payment or financial information (the Service has no paid features)</li>
          <li>Precise geolocation data (GPS or similar)</li>
          <li>Biometric data</li>
          <li>Health or medical information</li>
          <li>Political opinions, religious beliefs, or other sensitive personal data beyond birth date</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul>
          <li>
            <strong>Service delivery:</strong> to provide, operate, maintain, and improve the Service,
            including features like reading progress sync, library management, and cross-device continuity.
          </li>
          <li>
            <strong>Account management:</strong> to create and manage your account, authenticate your identity,
            and provide customer support.
          </li>
          <li>
            <strong>Age verification:</strong> to enforce age restrictions for NSFW (Not Safe For Work)
            content providers, using the birth date provided during registration.
          </li>
          <li>
            <strong>Personalization:</strong> to remember your preferences, reader settings, and selected
            content provider across sessions.
          </li>
          <li>
            <strong>Security:</strong> to detect, prevent, and address fraud, abuse, unauthorized access,
            and other harmful activity.
          </li>
          <li>
            <strong>Communication:</strong> to respond to your inquiries, provide service updates, and notify
            you of material changes to the Service or this policy.
          </li>
          <li>
            <strong>Legal compliance:</strong> to comply with applicable laws, regulations, legal processes,
            and enforceable governmental requests.
          </li>
        </ul>

        <h2>3. Legal Basis for Processing (GDPR)</h2>
        <p>
          If you are located in the European Economic Area (EEA), the United Kingdom (UK), or Switzerland,
          we process your personal data under the following legal bases as defined by the General Data
          Protection Regulation (GDPR):
        </p>
        <ul>
          <li>
            <strong>Contract performance (Article 6(1)(b)):</strong> Processing is necessary to provide
            the Service you have requested, including account creation, reading history, and library features.
          </li>
          <li>
            <strong>Legitimate interests (Article 6(1)(f)):</strong> We process certain data (such as usage
            analytics and security logs) for our legitimate interest in operating, securing, and improving
            the Service, provided these interests are not overridden by your fundamental rights.
          </li>
          <li>
            <strong>Consent (Article 6(1)(a)):</strong> Where required by law, we obtain your explicit
            consent before processing certain data. You may withdraw consent at any time.
          </li>
          <li>
            <strong>Legal obligation (Article 6(1)(c)):</strong> We may process data to comply with
            applicable legal obligations, such as responding to lawful requests from authorities.
          </li>
        </ul>

        <h2>4. Information Sharing &amp; Disclosure</h2>
        <p>
          We do <strong>not</strong> sell your personal information. We share your information only in the
          following limited circumstances:
        </p>
        <ul>
          <li>
            <strong>Service providers:</strong> We share data with third-party service providers who perform
            services on our behalf, including:
            <ul>
              <li>
                <strong>Supabase</strong> &mdash; authentication and database hosting. Supabase processes
                your account credentials and stores your reading data. See{" "}
                <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer">
                  Supabase&apos;s Privacy Policy
                </a>.
              </li>
            </ul>
          </li>
          <li>
            <strong>Content providers:</strong> When you view manga, requests are made to third-party
            content sources (Asura Scans, MangaDex, Manhwa18). These requests may expose your IP address
            to those services. We do not control their data practices.
          </li>
          <li>
            <strong>Legal requirements:</strong> We may disclose information if required to do so by law
            or in response to valid requests by public authorities (e.g., a court order, subpoena, or
            government agency request).
          </li>
          <li>
            <strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets,
            your information may be transferred as part of that transaction. We will notify you of any
            change in ownership or use of your personal information.
          </li>
          <li>
            <strong>Protection of rights:</strong> We may disclose information to protect the rights,
            property, or safety of UNI-verse, our users, or the public, as required or permitted by law.
          </li>
        </ul>

        <h2>5. International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your country of
          residence. Supabase, our primary infrastructure provider, may store and process data in data
          centers located in the United States and other jurisdictions.
        </p>
        <p>
          For transfers of personal data from the EEA, UK, or Switzerland to countries that do not provide
          an adequate level of data protection, we rely on appropriate safeguards such as Standard
          Contractual Clauses (SCCs) or other legally recognized transfer mechanisms.
        </p>

        <h2>6. Your Rights Under GDPR</h2>
        <p>
          If you are located in the EEA, UK, or Switzerland, you have the following rights regarding your
          personal data:
        </p>
        <ul>
          <li>
            <strong>Right of access (Article 15):</strong> You may request a copy of the personal data we
            hold about you.
          </li>
          <li>
            <strong>Right to rectification (Article 16):</strong> You may request correction of inaccurate
            or incomplete personal data.
          </li>
          <li>
            <strong>Right to erasure (Article 17):</strong> You may request deletion of your personal data,
            subject to certain exceptions (e.g., legal obligations, dispute resolution).
          </li>
          <li>
            <strong>Right to data portability (Article 20):</strong> You may request a copy of your data
            in a structured, commonly used, machine-readable format.
          </li>
          <li>
            <strong>Right to object (Article 21):</strong> You may object to processing based on legitimate
            interests, including for direct marketing purposes.
          </li>
          <li>
            <strong>Right to restriction (Article 18):</strong> You may request restriction of processing
            in certain circumstances.
          </li>
          <li>
            <strong>Right to withdraw consent:</strong> Where processing is based on consent, you may
            withdraw it at any time without affecting the lawfulness of prior processing.
          </li>
          <li>
            <strong>Right to lodge a complaint:</strong> You have the right to file a complaint with your
            local data protection supervisory authority.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us at{" "}
          <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a>. We will respond to your
          request within 30 days.
        </p>

        <h2>7. Your Rights Under CCPA</h2>
        <p>
          If you are a California resident, the California Consumer Privacy Act (CCPA) and the California
          Privacy Rights Act (CPRA) grant you the following rights:
        </p>
        <ul>
          <li>
            <strong>Right to know:</strong> You may request that we disclose the categories and specific
            pieces of personal information we have collected about you, the sources of collection, the
            business purposes for collection, and the categories of third parties with whom we share it.
          </li>
          <li>
            <strong>Right to delete:</strong> You may request that we delete your personal information,
            subject to certain exceptions (e.g., to complete a transaction, detect security incidents,
            comply with legal obligations).
          </li>
          <li>
            <strong>Right to opt-out of sale:</strong> We do <strong>not</strong> sell your personal
            information as defined by the CCPA. No opt-out mechanism is necessary.
          </li>
          <li>
            <strong>Right to correct:</strong> You may request correction of inaccurate personal information.
          </li>
          <li>
            <strong>Right to limit use of sensitive personal information:</strong> We do not use sensitive
            personal information (as defined by the CCPA) for purposes other than those permitted by law.
          </li>
          <li>
            <strong>Non-discrimination:</strong> We will not discriminate against you for exercising any of
            your CCPA rights. You will not receive different pricing, quality of service, or be denied
            service for making a privacy request.
          </li>
          <li>
            <strong>Authorized agent:</strong> You may designate an authorized agent to make a request on
            your behalf. We may require verification of the agent&apos;s authority.
          </li>
        </ul>
        <p>
          To exercise your CCPA rights, contact us at{" "}
          <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a>. We will verify your
          identity before processing your request.
        </p>

        <h2>8. Children&apos;s Privacy (COPPA)</h2>
        <p>
          The Service is not directed to children under the age of 13, and we do not knowingly collect
          personal information from children under 13. If we become aware that we have collected personal
          information from a child under 13, we will take steps to delete that information promptly.
        </p>
        <p>
          Users must be at least 13 years old to create an account. Certain content providers that host
          mature or explicit material are restricted to users who are 18 years of age or older, as
          verified by the birth date provided during registration. We do not collect parental consent
          for users under 13 because we do not permit such users on the Service.
        </p>
        <p>
          If you are a parent or guardian and believe your child has provided personal information to us,
          please contact us at{" "}
          <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a> and we will delete it.
        </p>

        <h2>9. Data Security</h2>
        <p>
          We implement industry-standard technical and organizational measures to protect your personal
          information, including:
        </p>
        <ul>
          <li>Encryption of data in transit (TLS/HTTPS) and at rest</li>
          <li>HTTP-only, secure authentication cookies to prevent cross-site scripting (XSS) attacks</li>
          <li>Row-level security policies in our database to ensure user data isolation</li>
          <li>Regular security reviews and dependency updates</li>
          <li>Access controls limiting who can access user data</li>
        </ul>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure. While
          we strive to use commercially acceptable means to protect your personal information, we cannot
          guarantee its absolute security. In the event of a data breach that affects your personal data,
          we will notify you and the relevant supervisory authorities as required by applicable law.
        </p>

        <h2>10. Data Retention</h2>
        <p>We retain your personal information for the following periods:</p>
        <ul>
          <li>
            <strong>Account data</strong> (email, username, birth date): retained for as long as your
            account is active. Within 30 days of a deletion request, all account data is permanently
            removed from our systems.
          </li>
          <li>
            <strong>Reading data</strong> (history, library, bookmarks): retained while your account is
            active. You may delete individual history items or your entire reading history at any time
            through the Service.
          </li>
          <li>
            <strong>Reader preferences</strong> (localStorage): stored locally on your device only and
            never transmitted to our servers. Cleared when you clear your browser data or uninstall the PWA.
          </li>
          <li>
            <strong>Security logs:</strong> retained for up to 90 days for abuse detection and prevention,
            then permanently deleted.
          </li>
          <li>
            <strong>Legal hold:</strong> If required by law or ongoing legal proceedings, we may retain
            certain data beyond the periods above.
          </li>
        </ul>

        <h2>11. Third-Party Links &amp; Content</h2>
        <p>
          The Service aggregates content from and may contain links to third-party websites or services
          (including manga content providers). These third parties have their own privacy policies, and
          we do not control their data collection or usage practices. We encourage you to review the
          privacy policies of any third-party service you interact with through the Service.
        </p>
        <p>
          When you view manga content, your browser makes requests directly to third-party servers (Asura
          Scans, MangaDex, Manhwa18), which may log your IP address, browser type, and other standard
          access information. These requests are made by your device, not by our servers.
        </p>

        <h2>12. Do Not Track &amp; Global Privacy Control</h2>
        <p>
          Some browsers offer a &quot;Do Not Track&quot; (DNT) signal or Global Privacy Control (GPC) signal.
          Currently, there is no industry standard for how to respond to these signals. We are committed
          to protecting your privacy regardless of the signals your browser sends. If a standard is
          established and we adopt it, we will update this policy accordingly.
        </p>

        <h2>13. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. When we make material changes, we will
          update the &quot;Last updated&quot; date at the top of this page and, where appropriate, notify you
          through the Service or by email. Your continued use of the Service after changes are posted
          constitutes your acceptance of the updated policy.
        </p>

        <h2>14. Contact Us</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data
          practices, please contact us at:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a>
        </p>
        <p>
          For GDPR-related inquiries specifically, you may also contact our Data Protection Officer at{" "}
          <a href="mailto:dpo@universe-app.com">dpo@universe-app.com</a>.
        </p>
      </div>
    </div>
  );
}
