import React from "react";
import { X, Check } from "lucide-react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
  if (!isOpen) return null;

  const monthlyUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_MONTHLY_URL || "#";
  const creditsUrl = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CREDITS_URL || "#";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl overflow-hidden bg-white dark:bg-[#20242D] rounded-2xl shadow-2xl border border-gray-200 dark:border-[#333945]">
        <button
          onClick={onClose}
          className="absolute p-2 text-gray-500 dark:text-gray-400 top-4 right-4 hover:text-gray-800 dark:hover:text-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center sm:p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            You've reached your free limit
          </h2>
          <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-600 dark:text-gray-400">
            Upgrade to tailor unlimited CVs and get the perfect job match. Choose the plan that works for you.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Credit Pack */}
            <div className="flex flex-col p-8 text-left border border-gray-200 dark:border-[#333945] rounded-2xl bg-[#F5F5FA] dark:bg-[#13151A]/50">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Credit Pack</h3>
              <div className="mt-4 mb-8">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">$15</span>
                <span className="text-gray-500 dark:text-gray-400"> / one-time</span>
              </div>
              <ul className="flex-1 space-y-4">
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Check className="w-5 h-5 text-indigo-500" />
                  <span>5 Tailoring Sessions</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Check className="w-5 h-5 text-indigo-500" />
                  <span>Use anytime, no expiration</span>
                </li>
              </ul>
              <a
                href={creditsUrl}
                className="block w-full px-4 py-3 mt-8 font-medium text-center text-gray-700 dark:text-gray-300 transition-colors bg-white dark:bg-[#20242D] border border-gray-200 dark:border-[#333945] rounded-full hover:bg-gray-50 dark:hover:bg-[#2A2E37] shadow-sm"
              >
                Buy Credits
              </a>
            </div>

            {/* Unlimited Subscription */}
            <div className="flex flex-col p-8 text-left border-2 rounded-2xl border-indigo-600 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 relative shadow-sm">
              <div className="absolute top-0 px-3 py-1 text-xs font-semibold text-white uppercase transform -translate-y-1/2 bg-indigo-600 dark:bg-indigo-500 rounded-full left-8 tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Unlimited Pro</h3>
              <div className="mt-4 mb-8">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">$9</span>
                <span className="text-gray-500 dark:text-gray-400"> / month</span>
              </div>
              <ul className="flex-1 space-y-4">
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Unlimited Tailoring Sessions</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cover Letter Generation</span>
                </li>
                <li className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                  <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <a
                href={monthlyUrl}
                className="block w-full px-4 py-3 mt-8 font-medium text-center text-white transition-colors bg-indigo-600 rounded-full hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 shadow-md shadow-indigo-600/20"
              >
                Subscribe Now
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
