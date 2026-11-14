import { Audiences } from "@/components/marketing/audiences";
import { Comparison } from "@/components/marketing/comparison";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Faq } from "@/components/marketing/faq";
import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PilotSection } from "@/components/marketing/pilot-section";
import { Pricing } from "@/components/marketing/pricing";
import { Privacy } from "@/components/marketing/privacy";
import { Problem } from "@/components/marketing/problem";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Privacy />
      <DashboardPreview />
      <Audiences />
      <Comparison />
      <Pricing />
      <Faq />
      <PilotSection />
    </>
  );
}
