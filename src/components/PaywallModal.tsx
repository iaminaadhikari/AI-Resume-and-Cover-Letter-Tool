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
      <div className="relative w-full max-w-4xl overflow-hidden bg-white rounded-2xl shadow-2xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute p-2 text-slate-500 top-4 right-4 hover:text-slate-800 dark:hover:text-slate-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center sm:p-12">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            You've reached your free limit
          </h2>
          <p className="max-w-2xl mx-auto mb-12 text-lg text-slate-600 dark:text-slate-400">
            Upgrade to tailor unlimited resumes and get the perfect job match. Choose the plan that works for you.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Credit Pack */}
            <div className="flex flex-col p-8 text-left border-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Credit Pack</h3>
              <div className="mt-4 mb-8">
                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$15</span>
                <span className="text-slate-500 dark:text-slate-400"> / one-time</span>
              </div>
              <ul className="flex-1 space-y-4">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span>5 Tailoring Sessions</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-emerald-500" />
                  <span>Use anytime, no expiration</span>
                </li>
              </ul>
              <a
                href={creditsUrl}
                className="block w-full px-4 py-3 mt-8 font-medium text-center text-white transition-colors bg-slate-900 rounded-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Buy Credits
              </a>
            </div>

            {/* Unlimited Subscription */}
            <div className="flex flex-col p-8 text-left border-2 rounded-2xl border-teal-500 dark:border-teal-500 bg-teal-50 dark:bg-teal-900/20 relative">
              <div className="absolute top-0 px-3 py-1 text-xs font-semibold text-white uppercase transform -translate-y-1/2 bg-teal-500 rounded-full left-8 tracking-wider">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Unlimited Pro</h3>
              <div className="mt-4 mb-8">
                <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">$9</span>
                <span className="text-slate-500 dark:text-slate-400"> / month</span>
              </div>
              <ul className="flex-1 space-y-4">
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-teal-500" />
                  <span>Unlimited Tailoring Sessions</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-teal-500" />
                  <span>Cover Letter Generation</span>
                </li>
                <li className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  <Check className="w-5 h-5 text-teal-500" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <a
                href={monthlyUrl}
                className="block w-full px-4 py-3 mt-8 font-medium text-center text-white transition-colors bg-teal-600 rounded-lg hover:bg-teal-700 dark:hover:bg-teal-500"
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
