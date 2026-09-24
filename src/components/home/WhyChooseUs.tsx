import React from 'react';
import { ShieldCheck, IndianRupee, Package, Truck, Lock, Headphones, Award, RotateCcw } from 'lucide-react';
import ScrollReveal from '@/components/ui/ScrollReveal';

const features = [
  { icon: ShieldCheck, title: 'Verified Products', desc: '100% genuine materials sourced directly from authorized manufacturers.' },
  { icon: IndianRupee, title: 'Transparent Pricing', desc: 'Real-time market rates with GST-compliant invoicing on every order.' },
  { icon: Package, title: 'Retail & Bulk Supplies', desc: 'Flexible quantities whether you need 5 bags or 50 truckloads.' },
  { icon: Truck, title: 'Direct Site Delivery', desc: 'Reliable crane & flatbed fleet drops right at your active work site.' },
  { icon: Lock, title: 'Secure Transactions', desc: 'Encrypted payment gateways, NEFT/RTGS, and contractor credit options.' },
  { icon: Headphones, title: 'Technical Support', desc: 'Dedicated civil engineers and product specialists on standby.' },
  { icon: Award, title: 'Lab Tested Quality', desc: 'Batch certificates and compressive strength reports available on request.' },
  { icon: RotateCcw, title: 'Hassle-Free Returns', desc: 'Smooth return process for undamaged surplus materials.' }
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="container-custom">
        <div className="text-center mb-12 md:mb-16 max-w-3xl mx-auto">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
            OUR COMMITMENT
          </span>
          <ScrollReveal
            baseOpacity={0.15}
            baseRotation={0}
            blurStrength={6}
            as="h2"
            containerClassName="mb-3"
            textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-primary-dark tracking-tight"
          >
            The HEPNA MART Standard
          </ScrollReveal>
          <p className="text-base sm:text-lg text-gray-500 mt-2 leading-relaxed">
            Engineered for reliability, transparent rates, and uncompromised structural integrity.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#FBFBFD] border border-gray-100 hover:border-accent/40 hover:bg-white hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:shadow-lg group-hover:shadow-accent/25 transition-all duration-300">
                <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-semibold text-base sm:text-lg text-primary-dark mb-1.5 group-hover:text-accent transition-colors">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
