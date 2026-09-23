import React from 'react';
import { ShieldCheck, IndianRupee, Package, Truck, Lock, Headphones, Award, RotateCcw } from 'lucide-react';

const features = [
  { icon: ShieldCheck, title: 'Verified Products', desc: '100% genuine materials from top brands' },
  { icon: IndianRupee, title: 'Transparent Pricing', desc: 'No hidden charges, clear GST invoices' },
  { icon: Package, title: 'Retail & Bulk Orders', desc: 'Buy single units or wholesale quantities' },
  { icon: Truck, title: 'Site Delivery', desc: 'Direct delivery to your construction site' },
  { icon: Lock, title: 'Secure Payments', desc: 'Safe online transactions & multiple options' },
  { icon: Headphones, title: 'Reliable Support', desc: 'Dedicated help for your project needs' },
  { icon: Award, title: 'Quality Materials', desc: 'Stringent quality checks on all items' },
  { icon: RotateCcw, title: 'Easy Returns', desc: 'Hassle-free return policy for unused items' }
];

const WhyChooseUs: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="section-title text-primary-dark">Why Choose HEPNA MART?</h2>
          <p className="section-subtitle mt-4 text-lg">Your trusted partner for all construction material requirements</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {features.map((feature, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-surface-dark transition-colors duration-300 group">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:shadow-lg group-hover:shadow-accent/30 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-accent group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-primary-dark mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
