import type { Metadata } from "next";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy note" };

export default function PrivacyPage() {
  return (
    <ProsePage eyebrow="Privacy" title="Privacy note" lead="We collect as little as possible, on purpose.">
      <ProseSection title="In the product">
        <ul className="list-disc space-y-2 pl-6">
          <li>No cameras, no microphones, and no wearables.</li>
          <li>The system never identifies who is in a room. Rooms are known by number only.</li>
          <li>It stores room status, alert times, the staff role that responded, and the outcome. No video, audio, or health information.</li>
          <li>The demo dashboard runs entirely on simulated sample data.</li>
        </ul>
      </ProseSection>
      <ProseSection title="On this website">
        <p>
          The pilot request form collects only your name, work email, facility name, role, number of rooms, and an
          optional message. We use it only to contact you about a pilot. Please don&apos;t include resident information.
        </p>
        <p>The demo sign-in is a mock: it stores a demo session in your browser&apos;s local storage and nothing else.</p>
        <p>
          To ask us to delete your submission, contact {site.contactEmail}.
        </p>
      </ProseSection>
      <p className="font-semibold">{site.medicalDisclaimer}</p>
    </ProsePage>
  );
}
