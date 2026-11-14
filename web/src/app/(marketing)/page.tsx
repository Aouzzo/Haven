import { Hero } from "@/components/marketing/hero";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { PilotSection } from "@/components/marketing/pilot-section";
import { Privacy } from "@/components/marketing/privacy";
import { Problem } from "@/components/marketing/problem";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Problem />
      <HowItWorks />
      <Privacy />
      <PilotSection />
    </>
  );
}
