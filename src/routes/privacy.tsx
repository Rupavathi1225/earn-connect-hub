import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — GlobalPrime" },
      { name: "description", content: "Read the GlobalPrime Privacy Policy." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#1a1c3a]">Privacy Policy</h1>
      <p className="mt-4 text-sm text-gray-600">
        GlobalPrime is committed to protecting your privacy and personal information.
      </p>
      <section className="mt-6 space-y-4 text-sm text-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">1. Information Collection</h2>
          <p className="mt-2">
            We collect information needed to provide services, improve functionality, and maintain security.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">2. Data Usage</h2>
          <p className="mt-2">
            Your information is used to support account operations, communications, and fraud prevention.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">3. Data Security</h2>
          <p className="mt-2">
            We implement reasonable safeguards to protect your personal information.
          </p>
        </div>
      </section>
    </div>
  );
}
