import { Metadata } from "next";
import HelpContent from "./HelpContent";

export const metadata: Metadata = {
  title: "Help & Guides — CT Championship Series",
  description: "Learn how to submit scores, set your handicap, manage events, and more.",
};

export default function HelpPage() {
  return <HelpContent />;
}
