import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const BulkOrderBanner: React.FC = () => {
  return (
    <section className="py-16">
      <div className="container-custom">
        <div className="relative rounded-3xl overflow-hidden bg-primary-dark flex flex-col md:flex-row items-center justify-between p-8 md:p-16 shadow-2xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent rounded-full blur-3xl opacity-20 translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-light rounded-full blur-3xl opacity-20 -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10 max-w-2xl text-center md:text-left mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-white mb-4">
              Buying for a Construction Project?
            </h2>
            <p className="text-lg text-gray-300 mb-2">
              Get better pricing on bulk quantities. Request a custom quote today for your site requirements.
            </p>
            <p className="text-sm text-accent-light font-medium flex items-center justify-center md:justify-start gap-2 mt-4">
              <span className="w-2 h-2 rounded-full bg-accent-light"></span>
              Trusted by 500+ contractors and builders
            </p>
          </div>
          
          <div className="relative z-10 w-full md:w-auto flex-shrink-0">
            <Link to="/wholesale">
              <Button variant="primary" size="lg" className="w-full md:w-auto text-lg px-8 py-4 shadow-xl shadow-accent/20">
                Request Bulk Quote
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BulkOrderBanner;
