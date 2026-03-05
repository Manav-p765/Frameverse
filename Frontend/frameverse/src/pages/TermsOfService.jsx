import React from "react";

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-text-primary">
      
      <h1 className="text-3xl font-bold mb-4">Frameverse Terms of Service</h1>
      <p className="text-sm text-text-secondary mb-10">
        Last Updated: March 2026
      </p>

      <section className="space-y-6">

        <div>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-text-secondary">
            Welcome to Frameverse. These Terms of Service govern your use of the
            Frameverse platform, including all features, services, and content
            available through the application.
          </p>
          <p className="text-text-secondary mt-2">
            By creating an account or using Frameverse, you agree to comply with
            these terms. If you do not agree, please discontinue use of the
            platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. Development Status</h2>
          <p className="text-text-secondary">
            Frameverse is currently an actively developed platform. Features may
            change, be updated, removed, or temporarily unavailable as the
            system evolves. Users understand that bugs, downtime, or unexpected
            behavior may occur during this stage.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. User Accounts</h2>
          <p className="text-text-secondary">
            To access certain features of Frameverse, users must create an
            account. You are responsible for maintaining the confidentiality of
            your login credentials and for any activity conducted under your
            account.
          </p>
          <p className="text-text-secondary mt-2">
            Providing false or misleading information during account creation
            may result in suspension or termination of the account.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. User Content</h2>
          <p className="text-text-secondary">
            Users may create, upload, or share content including posts,
            comments, images, and messages. You retain ownership of the content
            you create.
          </p>
          <p className="text-text-secondary mt-2">
            By submitting content to Frameverse, you grant the platform a
            non-exclusive license to store, display, and distribute that content
            within the service for the purpose of operating the platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Acceptable Use</h2>
          <p className="text-text-secondary">
            Users must not use Frameverse to upload or distribute content that
            is illegal, abusive, harmful, discriminatory, or violates the rights
            of others. This includes harassment, spam, malicious software, or
            attempts to exploit the platform.
          </p>
          <p className="text-text-secondary mt-2">
            Frameverse reserves the right to remove such content and take action
            against accounts that violate these guidelines.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Platform Availability</h2>
          <p className="text-text-secondary">
            While we aim to maintain a stable service, Frameverse may experience
            interruptions due to development updates, maintenance, or technical
            issues. The platform is provided "as is" during its development
            phase.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Account Suspension</h2>
          <p className="text-text-secondary">
            Frameverse may suspend or terminate user accounts that violate
            these terms, misuse the platform, or compromise the safety of other
            users.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Changes to Terms</h2>
          <p className="text-text-secondary">
            These Terms of Service may be updated periodically as Frameverse
            evolves. Continued use of the platform after changes are posted
            indicates acceptance of the updated terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
          <p className="text-text-secondary">
            If you have questions about these Terms of Service, please contact
            the Frameverse development team through the platform or official
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

export default Terms;