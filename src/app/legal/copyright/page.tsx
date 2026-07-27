import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copyright Policy | UNI-verse",
  description: "Copyright Policy for the UNI-verse manga reader application.",
};

export default function CopyrightPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Copyright Policy</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          UNI-verse respects the intellectual property rights of creators, publishers, and copyright
          holders. This Copyright Policy explains how we handle copyrighted material in connection with
          our manga reader application (the &quot;Service&quot;).
        </p>

        <h2>1. Ownership of Content</h2>
        <p>
          All manga content displayed through the Service — including but not limited to artwork,
          illustrations, cover images, chapter pages, titles, descriptions, character names, and
          metadata — is the intellectual property of its respective creators, authors, artists,
          publishers, licensors, and distribution partners.
        </p>
        <p>
          UNI-verse does <strong>not</strong> claim ownership of any third-party manga content. No
          ownership rights are transferred to UNI-verse through the display, aggregation, or indexing of
          such content.
        </p>

        <h2>2. Our Aggregation Model</h2>
        <p>
          UNI-verse operates as a content aggregator and reader interface. Our technical architecture is
          designed as follows:
        </p>
        <ul>
          <li>
            <strong>No hosting or storage:</strong> We do not host, upload, cache, or store any manga
            content on our servers. All content remains on the servers of the respective content providers.
          </li>
          <li>
            <strong>Real-time retrieval:</strong> When you view a manga chapter, your device fetches the
            content directly from the third-party provider&apos;s servers. UNI-verse acts as an interface
            that facilitates this retrieval.
          </li>
          <li>
            <strong>Metadata only:</strong> The only content-related data that passes through our servers
            is metadata (titles, descriptions, genres, chapter lists) used to power search, browse, and
            library features. This metadata is publicly available on the source websites.
          </li>
          <li>
            <strong>Image proxy:</strong> We operate an image proxy to handle cross-origin resource
            sharing (CORS) and hotlinking restrictions. The proxy retrieves images from provider servers
            and serves them to your browser. Images are cached for up to 24 hours to reduce redundant
            requests and are not permanently stored.
          </li>
        </ul>

        <h2>3. Content Providers</h2>
        <p>
          The Service currently aggregates content from the following third-party sources:
        </p>
        <ul>
          <li>
            <strong>Asura Scans</strong> &mdash; asurascans.com &mdash; Provides licensed and fan-translated
            manga and manhwa content.
          </li>
          <li>
            <strong>MangaDex</strong> &mdash; mangadex.org &mdash; A community-driven manga hosting platform
            with user-uploaded translations.
          </li>
          <li>
            <strong>Manhwa18</strong> &mdash; manhwa18.cc &mdash; Provides adult manhwa content. This source
            is age-restricted to users 18 and older.
          </li>
        </ul>
        <p>
          Each provider is solely responsible for ensuring that the content it hosts is properly licensed,
          authorized, and compliant with applicable copyright laws. UNI-verse does not verify the
          licensing status of content hosted by third-party providers.
        </p>

        <h2>4. Fair Use &amp; Limitations</h2>
        <p>
          UNI-verse does not claim that the display or aggregation of third-party manga content
          constitutes fair use, fair dealing, or any other statutory exception to copyright infringement
          under applicable law. Our Service is designed to provide a unified reading interface for content
          that is publicly available through third-party providers.
        </p>
        <p>
          The applicability of fair use or similar defenses depends on the specific circumstances of each
          use, including the jurisdiction, the nature of the work, the amount used, and the effect on the
          market for the original work. We do not provide legal advice regarding the copyright status of
          any content displayed through the Service.
        </p>

        <h2>5. Copyright Holder Inquiries</h2>
        <p>
          If you are a copyright holder, publisher, or authorized representative and believe that your
          copyrighted work is being used through the Service in a way that constitutes copyright
          infringement, we encourage you to contact us. We take copyright complaints seriously and will
          investigate all legitimate claims promptly.
        </p>
        <p>
          To report copyright infringement, please follow the procedures outlined in our{" "}
          <a href="/legal/dmca">DMCA / Content Removal Request</a> page, which provides detailed
          instructions for submitting a valid takedown notice under the Digital Millennium Copyright Act.
        </p>

        <h2>6. Repeat Infringer Policy</h2>
        <p>
          In accordance with the DMCA and other applicable copyright laws, UNI-verse maintains a policy
          of terminating, in appropriate circumstances, the accounts of users who are determined to be
          repeat infringers. A repeat infringer is a user who has been notified of infringing activity
          more than twice and/or has had content removed from the Service more than twice.
        </p>
        <p>
          We reserve the right to review the circumstances of each case and to determine, in our sole
          discretion, whether a user&apos;s conduct constitutes repeat infringement. Account termination may
          occur without prior notice in egregious cases.
        </p>

        <h2>7. Counter-Notifications</h2>
        <p>
          If you believe that your content was removed from the Service as a result of mistake or
          misidentification, you may file a counter-notification. For full details on the
          counter-notification process, including the required elements and submission instructions,
          please visit our{" "}
          <a href="/legal/dmca">DMCA / Content Removal Request</a> page.
        </p>

        <h2>8. Transparency</h2>
        <p>
          We are committed to being transparent about how we handle copyright matters. We will:
        </p>
        <ul>
          <li>Acknowledge receipt of valid DMCA notices promptly</li>
          <li>Process takedown requests in a timely manner</li>
          <li>Notify affected users of takedown actions and provide counter-notification rights</li>
          <li>Respond to valid counter-notifications in accordance with the DMCA</li>
          <li>Maintain records of takedown and counter-notification activity</li>
        </ul>

        <h2>9. Contact</h2>
        <p>
          For all copyright-related inquiries, please contact us at{" "}
          <a href="mailto:copyright@universe-app.com">copyright@universe-app.com</a>.
        </p>
        <p>
          For DMCA takedown requests specifically, please use{" "}
          <a href="mailto:dmca@universe-app.com">dmca@universe-app.com</a> to ensure proper routing and
          timely processing.
        </p>
      </div>
    </div>
  );
}
