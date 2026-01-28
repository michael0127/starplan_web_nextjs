import {
  Header,
  Hero,
  TrustedBy,
  WhyStarPlan,
  HowItWorks,
  ProductValue,
  Stats,
  Features,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
  SectionDivider,
} from '@/components/landing';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustedBy />
        <SectionDivider variant="stars" />
        <WhyStarPlan />
        <SectionDivider variant="wave" fromColor="white" toColor="#FAFAFA" />
        <HowItWorks />
        <SectionDivider variant="curve" toColor="white" flip />
        <Stats />
        <SectionDivider variant="curve" toColor="white" />
        <ProductValue />
        <SectionDivider variant="dots" />
        <Features />
        <SectionDivider variant="wave" fromColor="white" toColor="#FAFAFA" />
        <Pricing />
        <SectionDivider variant="stars" />
        <FAQ />
        <SectionDivider variant="gradient" fromColor="white" toColor="#4F67FF" />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
