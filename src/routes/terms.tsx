import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — GlobalPrime" },
      { name: "description", content: "Read the GlobalPrime Terms & Conditions." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-[#1a1c3a]">Terms &amp; Conditions</h1>
      <p className="mt-4 text-sm text-gray-600">
        Welcome to GlobalPrime. By using our platform, you agree to the following terms and conditions.
      </p>
      <section className="mt-6 space-y-4 text-sm text-gray-700">
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">1. Acceptance of Terms</h2>
          <p className="mt-2">
            You agree to follow and be bound by these terms when using our services.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">2. Account Usage</h2>
          <p className="mt-2">
            You must provide accurate information and keep your account credentials secure.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#1a1c3a]">3. Rewards and Withdrawals</h2>
          <p className="mt-2">
            Rewards are subject to verification and may be altered or withheld if abuse is detected.
          </p>
        </div>
      </section>
    </div>
  );
}
