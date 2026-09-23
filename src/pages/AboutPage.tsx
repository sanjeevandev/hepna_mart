import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, Globe, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';

const AboutPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-surface pb-16">
      {/* Hero */}
      <div className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
        <div className="container-custom relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Building India's Future</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Your trusted partner in construction materials, delivering quality and reliability to every site.
          </p>
        </div>
      </div>

      <div className="container-custom py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-heading font-bold text-primary mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <p>
                Founded in 2020, HEPNA MART began with a simple mission: to streamline the fragmented construction material supply chain in India. We noticed that contractors and builders spent too much time sourcing materials and negotiating prices across multiple vendors.
              </p>
              <p>
                By bringing top brands under one digital roof, we've created a seamless procurement experience. From foundation cement to finishing touches, we ensure that high-quality materials reach your site on time, every time.
              </p>
              <p>
                Today, HEPNA MART is proud to be a pivotal part of thousands of construction projects, driving efficiency and transparency in the industry.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1541888086225-ee5995818d1a?ixlib=rb-4.0.3&w=600&q=80" alt="Construction site" className="rounded-xl object-cover h-64 w-full" />
            <img src="https://images.unsplash.com/photo-1504307651254-35680f356f27?ixlib=rb-4.0.3&w=600&q=80" alt="Engineers" className="rounded-xl object-cover h-64 w-full mt-8" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Products', value: '10,000+' },
            { label: 'Happy Customers', value: '5,000+' },
            { label: 'Partner Brands', value: '500+' },
            { label: 'Cities Covered', value: '100+' }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow-sm text-center border border-gray-100">
              <div className="text-3xl font-bold text-accent mb-2">{stat.value}</div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Values */}
        <div className="mb-20">
          <h2 className="text-3xl font-heading font-bold text-center text-primary mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: CheckCircle, title: 'Quality Assurance', desc: 'We strictly source from authorized manufacturers ensuring 100% genuine products.' },
              { icon: Shield, title: 'Trust & Transparency', desc: 'No hidden costs. Honest pricing and clear communication at every step.' },
              { icon: Globe, title: 'Innovation', desc: 'Leveraging technology to make material procurement faster and smarter.' },
              { icon: Users, title: 'Customer First', desc: 'Dedicated support teams to assist you from order placement to site delivery.' }
            ].map((val, i) => {
              const Icon = val.icon;
              return (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
                    <Icon size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{val.title}</h3>
                  <p className="text-gray-600">{val.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-primary-dark rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to build with us?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of contractors who trust HEPNA MART for their daily material needs.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="lg">Start Shopping Now</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
