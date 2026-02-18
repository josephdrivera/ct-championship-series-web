"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-cream/10 bg-dark-green px-4 py-4 shadow-lg sm:px-6"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-cream/70">
              This site uses essential cookies for authentication. No tracking
              cookies are used.{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-2 text-cream/90 hover:text-gold"
              >
                Privacy Policy
              </Link>
            </p>
            <button
              onClick={dismiss}
              className="shrink-0 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-dark-green transition-colors hover:bg-gold-dark"
            >
              Got it
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
