import React from "react";

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-text-primary">

      <h1 className="text-3xl font-bold mb-4">Frameverse Privacy Policy</h1>
      <p className="text-sm text-text-secondary mb-10">
        Last Updated: March 2026
      </p>

      <section className="space-y-6">

        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-text-secondary">
            This Privacy Policy explains how Frameverse collects, uses, and
            protects information when you use the Frameverse platform.
          </p>
          <p className="text-text-secondary mt-2">
            By using Frameverse, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Information We Collect</h2>
          <p className="text-text-secondary">
            When you use Frameverse, we may collect certain information
            including:
          </p>

          <ul className="list-disc ml-6 mt-2 text-text-secondary space-y-1">
            <li>Account information such as username, email, and profile details</li>
            <li>Content you create including posts, comments, and messages</li>
            <li>Usage information such as interactions with features</li>
            <li>Technical information like device type, browser, and IP address</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. How We Use Information</h2>
          <p className="text-text-secondary">
            The information we collect helps us operate and improve the
            platform. This may include:
          </p>

          <ul className="list-disc ml-6 mt-2 text-text-secondary space-y-1">
            <li>Providing and maintaining the Frameverse service</li>
            <li>Improving features and user experience</li>
            <li>Ensuring platform security</li>
            <li>Preventing abuse or misuse of the platform</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. User Content</h2>
          <p className="text-text-secondary">
            Content shared on Frameverse such as posts or comments may be
            visible to other users depending on your privacy settings.
          </p>
          <p className="text-text-secondary mt-2">
            Users are responsible for the information they choose to share
            publicly on the platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Data Storage and Security</h2>
          <p className="text-text-secondary">
            Frameverse takes reasonable measures to protect user information.
            However, no system is completely secure, and we cannot guarantee
            absolute protection of data transmitted over the internet.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Third-Party Services</h2>
          <p className="text-text-secondary">
            Frameverse may use third-party services such as hosting providers,
            analytics tools, or authentication services that help operate the
            platform. These services may collect limited information necessary
            for their functionality.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Cookies and Tracking</h2>
          <p className="text-text-secondary">
            Frameverse may use cookies or similar technologies to maintain
            sessions, improve user experience, and understand platform usage.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Changes to This Policy</h2>
          <p className="text-text-secondary">
            This Privacy Policy may be updated as the platform evolves.
            Continued use of Frameverse after updates indicates acceptance of
            the revised policy.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
          <p className="text-text-secondary">
            If you have questions about this Privacy Policy, you may contact the
            Frameverse development team through the platform or official
            project channels.
          </p>
        </div>

      </section>

      <div className="mt-12 text-xs text-text-secondary">
        Frameverse is an independent software project currently under active
        development.
      </div>

    </div>
  );
};

export default Privacy;