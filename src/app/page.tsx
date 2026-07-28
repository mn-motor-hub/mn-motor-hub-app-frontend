import { Suspense } from 'react';
import { Hero } from '@/components/features/landing/Hero/Hero';
import { FeaturedProducts } from '@/components/features/landing/FeaturedProducts/FeaturedProducts';
import { FeaturedProductsSkeleton } from '@/components/features/landing/FeaturedProducts/FeaturedProductsSkeleton';
import { WhyUs } from '@/components/features/landing/WhyUs/WhyUs';
import { CTABanner } from '@/components/features/landing/CTABanner/CTABanner';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <WhyUs />
      {/* Única sección que espera al backend: se aísla para que el resto de la
          landing, que es estática, no quede bloqueada por el fetch. */}
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
      <CTABanner />
    </main>
  );
}
