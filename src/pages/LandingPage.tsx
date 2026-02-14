import { UpdateNoticeModal } from "@/components/UpdateNoticeModal";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingAdvantages } from "@/components/landing/LandingAdvantages";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LandingPage() {
  return (
    <div className="h-screen overflow-y-auto bg-background text-foreground">
      <UpdateNoticeModal />
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingAdvantages />
      <LandingPricing />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
