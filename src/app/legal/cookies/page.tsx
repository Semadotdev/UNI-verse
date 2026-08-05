import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | UNI-verse",
  description: "Cookie Policy for the UNI-verse manga reader application.",
};

export default function CookiesPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8">
      <h1 className="text-2xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-sm text-muted mb-8">Last updated: July 27, 2026</p>

      <div className="prose-dark max-w-3xl">
        <p>
          This Cookie Policy explains how UNI-verse uses cookies, localStorage, service workers, and
          similar technologies when you use our manga reader web application and progressive web app
          (collectively, the &quot;Service&quot;). We are committed to being transparent about the technologies
          we use and providing you with meaningful choices.
        </p>

        <h2>1. What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or smartphone)
          when you visit a website. They are widely used to make websites work efficiently and to provide
          information to website owners.
        </p>
        <p>
          Similar technologies include:
        </p>
        <ul>
          <li>
            <strong>localStorage:</strong> A web storage mechanism that allows websites to store key-value
            pairs in your browser, persisting across sessions until explicitly cleared.
          </li>
          <li>
            <strong>Service Workers:</strong> Scripts that run in the background of your browser,
            enabling features like offline caching and push notifications.
          </li>
        </ul>

        <h2>2. Cookies &amp; Storage We Use</h2>
        <p>
          We use the following types of cookies and storage technologies. All of them are strictly
          necessary for the Service to function — we do not use any optional or tracking cookies.
        </p>

        <h3>2.1 Authentication Cookies (Essential)</h3>
        <p>
          We use HTTP-only, secure cookies managed by Supabase for user authentication and session
          management. These cookies:
        </p>
        <ul>
          <li>
            <strong>Purpose:</strong> Maintain your login session, verify your identity, and secure
            access to your account and personal data.
          </li>
          <li>
            <strong>Type:</strong> HTTP-only, Secure, SameSite cookies set by Supabase.
          </li>
          <li>
            <strong>Duration:</strong> Session-based. Expire when you log out or when the session times
            out. Supabase refresh tokens may persist longer to enable seamless re-authentication.
          </li>
          <li>
            <strong>Can be disabled?</strong> No. These cookies are essential for the Service to function.
            Disabling them will prevent you from logging in and using the Service.
          </li>
        </ul>
        <p>
          For more information about how Supabase handles authentication cookies, see{" "}
          <a href="https://supabase.com/docs/guides/auth/cookies" target="_blank" rel="noopener noreferrer">
            Supabase&apos;s Cookie Documentation
          </a>.
        </p>

        <h3>2.2 Local Storage (Essential)</h3>
        <p>
          We use your browser&apos;s localStorage API to store certain preferences locally on your device.
          This data is stored entirely on your device and is never transmitted to our servers:
        </p>
        <ul>
          <li>
            <strong>uni-verse-settings</strong> &mdash; Stores your reader preferences, including:
            <ul>
              <li>Theme (dark, light, or system)</li>
              <li>Reading mode (paged or long-strip)</li>
              <li>Scale type (fit width, fit height, etc.)</li>
              <li>Background color</li>
              <li>Brightness level</li>
              <li>Padding and border crop settings</li>
            </ul>
          </li>
          <li>
            <strong>uni-verse-selected-provider</strong> &mdash; Stores your currently selected manga
            content provider (e.g., Asura Scans, MangaDex, Manhwa18) so it persists across sessions.
          </li>
          <li>
            <strong>uni-verse-notifications-read</strong> &mdash; Stores which feature announcements you
            have seen so the notification badge only appears for unread updates.
          </li>
        </ul>
        <p>
          <strong>Note:</strong> localStorage data is specific to each browser and device. It is not
          shared across devices or browsers and is not accessible to our servers.
        </p>

        <h3>2.3 Service Worker</h3>
        <p>
          The Service uses a Service Worker (registered as <code>sw.js</code>) to cache static assets
          such as icons, stylesheets, and scripts. This enables:
        </p>
        <ul>
          <li>Faster page loads through local caching of static resources</li>
          <li>Basic offline functionality for previously visited pages</li>
          <li>Progressive Web App (PWA) installation capability</li>
        </ul>
        <p>
          The Service Worker does <strong>not</strong> track you, collect personal information, cache
          manga content, or store browsing history. It only caches the application shell (static files)
          needed for the Service to load and display correctly.
        </p>

        <h2>3. Third-Party Cookies</h2>
        <p>
          We do <strong>not</strong> use any third-party cookies for analytics, advertising, marketing,
          or tracking purposes. We do not use:
        </p>
        <ul>
          <li>Google Analytics</li>
          <li>Facebook Pixel or Meta tracking</li>
          <li>TikTok Pixel</li>
          <li>Any advertising or remarketing tags</li>
          <li>Social media tracking widgets</li>
        </ul>
        <p>
          However, when you view manga content, your browser makes requests directly to third-party
          content providers (Asura Scans, MangaDex, Manhwa18). These providers may set their own cookies
          in your browser as part of serving that content. We do not control, have access to, or receive
          information from cookies set by third-party services.
        </p>

        <h2>4. Your Cookie Choices</h2>
        <p>
          Although we only use essential cookies and storage, you maintain full control over your browser
          settings. Here is how to manage cookies and site data in common browsers:
        </p>

        <h3>Desktop Browsers</h3>
        <ul>
          <li>
            <strong>Google Chrome:</strong> Settings &gt; Privacy and security &gt; Cookies and other
            site data. See{" "}
            <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">
              Chrome Cookie Help
            </a>.
          </li>
          <li>
            <strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site
            Data. See{" "}
            <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">
              Firefox Cookie Help
            </a>.
          </li>
          <li>
            <strong>Apple Safari:</strong> Settings &gt; Privacy &gt; Manage Website Data. See{" "}
            <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471" target="_blank" rel="noopener noreferrer">
              Safari Cookie Help
            </a>.
          </li>
          <li>
            <strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions &gt; Cookies and
            site data. See{" "}
            <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer">
              Edge Cookie Help
            </a>.
          </li>
        </ul>

        <h3>Mobile Browsers</h3>
        <p>
          Mobile browsers typically allow you to manage cookies through the browser settings menu. Note
          that the mobile versions of Chrome, Safari, and Firefox differ from their desktop counterparts.
          Consult your browser&apos;s help documentation for specific instructions.
        </p>

        <h3>PWA Storage</h3>
        <p>
          If you have installed UNI-verse as a Progressive Web App, you can clear its stored data
          (including cookies and localStorage) through your device&apos;s application settings or by
          uninstalling the PWA.
        </p>

        <h2>5. Impact of Disabling Cookies &amp; Storage</h2>
        <p>
          Because we only use essential cookies and storage, disabling them will significantly impact
          your ability to use the Service:
        </p>
        <ul>
          <li>
            <strong>Disabling cookies:</strong> You will not be able to log in or maintain an active
            session. All authenticated features (library, history, preferences) will be unavailable.
          </li>
          <li>
            <strong>Clearing localStorage:</strong> Your reader preferences and selected provider will be
            reset to defaults. You will need to reconfigure them.
          </li>
          <li>
            <strong>Blocking Service Workers:</strong> Offline functionality and PWA installation will be
            unavailable. Online functionality will not be affected.
          </li>
        </ul>

        <h2>6. Do Not Track &amp; Global Privacy Control</h2>
        <p>
          Some browsers offer a &quot;Do Not Track&quot; (DNT) signal or Global Privacy Control (GPC) signal
          that tells websites not to track your browsing activity. We fully respect these signals.
        </p>
        <p>
          Because we do not perform any tracking, advertising, or analytics, DNT and GPC signals have no
          practical effect on your experience with the Service — we already limit data collection to only
          what is strictly necessary for the Service to function.
        </p>
        <p>
          If a widely accepted standard for responding to DNT or GPC signals is established in the
          future, we will adopt it and update this policy accordingly.
        </p>

        <h2>7. Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in the technologies we
          use or for other operational, legal, or regulatory reasons. When we make material changes, we
          will update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this
          policy periodically.
        </p>

        <h2>8. Contact</h2>
        <p>
          If you have any questions about our use of cookies, localStorage, or other technologies, please
          contact us at{" "}
          <a href="mailto:privacy@universe-app.com">privacy@universe-app.com</a>.
        </p>
      </div>
    </div>
  );
}
