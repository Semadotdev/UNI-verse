import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA / Content Removal Request | UNI-verse",
  description: "How to submit a DMCA takedown request or content removal request to UNI-verse.",
};

export default function DmcaPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">DMCA / Content Removal Request</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          UNI-verse respects the intellectual property rights of others and complies with the Digital
          Millennium Copyright Act (&quot;DMCA&quot;), 17 U.S.C. &sect; 512. If you believe that content
          displayed through our Service infringes your copyright, you may submit a takedown request as
          described below.
        </p>

        <h2>1. Designated Copyright Agent</h2>
        <p>
          Our designated copyright agent for receiving DMCA notices is:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:dmca@universe-app.com">dmca@universe-app.com</a>
        </p>
        <p>
          Please send all DMCA takedown requests and counter-notifications to this email address.
        </p>

        <h2>2. How to File a DMCA Takedown Notice</h2>
        <p>
          To submit a valid DMCA takedown request, follow these steps:
        </p>
        <ol>
          <li>
            <strong>Gather your information:</strong> Identify the copyrighted work you claim has been
            infringed and the specific content on the Service that infringes it.
          </li>
          <li>
            <strong>Draft your notice:</strong> Write a formal DMCA notice that includes all six required
            elements listed in Section 3 below.
          </li>
          <li>
            <strong>Send your notice:</strong> Email your completed notice to{" "}
            <a href="mailto:dmca@universe-app.com">dmca@universe-app.com</a> with the subject line
            &quot;DMCA Takedown Request.&quot;
          </li>
          <li>
            <strong>Acknowledgment:</strong> We will acknowledge receipt of your notice within two (2)
            business days.
          </li>
          <li>
            <strong>Review &amp; action:</strong> We will review your notice and, if it is valid, remove
            or disable access to the infringing material within a reasonable time, typically within
            ten (10) business days.
          </li>
        </ol>

        <h2>3. Required Elements of a DMCA Notice</h2>
        <p>
          To be considered valid under the DMCA (17 U.S.C. &sect; 512(c)(3)), your written notice must
          include <strong>all</strong> of the following:
        </p>
        <ol>
          <li>
            <strong>Identification of the copyrighted work</strong> &mdash; A reasonably sufficient
            description of the original copyrighted work you claim has been infringed. If multiple works
            are covered by a single notice, provide a representative list of those works.
          </li>
          <li>
            <strong>Identification of the infringing material</strong> &mdash; A reasonably sufficient
            description of the specific content on the Service that you believe infringes your copyright.
            Please include the URL(s) or page location(s) where the material can be found. For manga
            content, the chapter URL from the third-party source is particularly helpful.
          </li>
          <li>
            <strong>Your contact information</strong> &mdash; Your full legal name, mailing address,
            telephone number, and email address.
          </li>
          <li>
            <strong>Good faith statement</strong> &mdash; A statement that you have a good faith belief
            that the use of the material in the manner complained of is not authorized by the copyright
            owner, its agent, or the law. Example: &quot;I have a good faith belief that the use of the
            copyrighted materials described above is not authorized by the copyright owner, its agent, or
            the law.&quot;
          </li>
          <li>
            <strong>Accuracy statement under penalty of perjury</strong> &mdash; A statement, made under
            penalty of perjury, that the information in your notice is accurate and that you are the
            copyright owner or are authorized to act on behalf of the copyright owner. Example: &quot;I
            declare, under penalty of perjury, that the information in this notification is accurate and
            that I am the copyright owner or authorized to act on behalf of the owner of an exclusive
            right that is allegedly infringed.&quot;
          </li>
          <li>
            <strong>Physical or electronic signature</strong> &mdash; Your physical signature or a valid
            electronic signature. For email submissions, typing your full legal name at the end of the
            message constitutes a sufficient electronic signature.
          </li>
        </ol>
        <p>
          <strong>Important:</strong> Under Section 512(f) of the DMCA, any person who knowingly
          materially misrepresents that material or activity is infringing may be liable for damages.
          Please ensure your notice is accurate and made in good faith.
        </p>

        <h2>4. What Happens After You File</h2>
        <p>
          After we receive your DMCA notice, the following process will occur:
        </p>
        <ol>
          <li>
            <strong>Acknowledgment (within 2 business days):</strong> We will confirm receipt of your
            notice via email.
          </li>
          <li>
            <strong>Review (within 5 business days):</strong> Our team will review your notice to verify
            that it contains all required elements and is facially valid.
          </li>
          <li>
            <strong>Removal or disablement (within 10 business days):</strong> If your notice is valid,
            we will remove or disable access to the identified material. Because UNI-verse does not host
            content directly, this may involve removing the material from our search index and metadata
            displays. You may also want to contact the third-party content provider directly.
          </li>
          <li>
            <strong>Notification to the user:</strong> We will forward your notice (or a redacted version)
            to the user who uploaded or is associated with the material, informing them of the takedown.
          </li>
          <li>
            <strong>Counter-notification window:</strong> The affected user may file a counter-notification
            within ten (10) to fourteen (14) business days. If a valid counter-notification is received,
            we will provide it to you.
          </li>
        </ol>

        <h2>5. Counter-Notification</h2>
        <p>
          If your content was removed (or access to it was disabled) and you believe the removal was the
          result of mistake or misidentification, you may file a counter-notification. Your
          counter-notification must include all of the following:
        </p>
        <ol>
          <li>
            Your full legal name, mailing address, telephone number, and email address.
          </li>
          <li>
            Identification of the material that was removed and the location where it appeared before
            removal. Include the URL(s) or page location(s) if known.
          </li>
          <li>
            A statement under penalty of perjury that you have a good faith belief that the material was
            removed or disabled as a result of mistake or misidentification. Example: &quot;I declare,
            under penalty of perjury, that I have a good faith belief that the material was removed or
            disabled as a result of a mistake or misidentification of the material to be removed or
            disabled.&quot;
          </li>
          <li>
            Your physical or electronic signature.
          </li>
        </ol>
        <p>
          Send your counter-notification to{" "}
          <a href="mailto:dmca@universe-app.com">dmca@universe-app.com</a> with the subject line
          &quot;DMCA Counter-Notification.&quot;
        </p>
        <p>
          Upon receipt of a valid counter-notification, we will forward it to the original complainant and
          inform them that we may restore the removed material within ten (10) to fourteen (14) business
          days unless the original complainant files a court action seeking to restrain the allegedly
          infringing activity.
        </p>

        <h2>6. Repeat Infringer Policy</h2>
        <p>
          UNI-verse maintains a policy of terminating, in appropriate circumstances, the accounts of
          users who are determined to be repeat infringers. A user may be considered a repeat infringer
          if they are the subject of two or more valid DMCA notices. We reserve the right to review the
          circumstances of each case and to determine, in our sole discretion, whether termination is
          appropriate.
        </p>

        <h2>7. Misrepresentation &amp; Penalties</h2>
        <p>
          Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that
          material or activity is infringing, or that material or activity was removed or disabled by
          mistake or misidentification, may be held liable for damages, including costs and attorneys&apos;
          fees.
        </p>
        <p>
          We reserve the right to seek damages against any person who files a knowingly false or bad
          faith DMCA notice or counter-notification.
        </p>

        <h2>8. Other Types of Reports</h2>
        <p>
          The DMCA process described above is specifically for reporting copyright infringement. For
          other types of concerns, please use the appropriate channel:
        </p>
        <ul>
          <li>
            <strong>Trademark infringement:</strong>{" "}
            <a href="mailto:legal@universe-app.com">legal@universe-app.com</a>
          </li>
          <li>
            <strong>Defamation or harassment:</strong>{" "}
            <a href="mailto:legal@universe-app.com">legal@universe-app.com</a>
          </li>
          <li>
            <strong>Privacy concerns:</strong>{" "}
            <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a>
          </li>
          <li>
            <strong>General inquiries:</strong>{" "}
            <a href="mailto:support@universe-app.com">support@universe-app.com</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
