import { Hero } from '@/components/features/landing/Hero/Hero';
import { FeaturedProducts } from '@/components/features/landing/FeaturedProducts/FeaturedProducts';
import { WhyUs } from '@/components/features/landing/WhyUs/WhyUs';
import { CTABanner } from '@/components/features/landing/CTABanner/CTABanner';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <WhyUs />
      <FeaturedProducts />
      <CTABanner />
    </main>
  );
}
