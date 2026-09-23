import React, { useEffect, useState } from 'react';
import { Building, TrendingDown, Clock, ShieldCheck, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import ScrollReveal from '@/components/ui/ScrollReveal';
import toast from 'react-hot-toast';

const WholesalePage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [items, setItems] = useState([{ id: 1, product: '', quantity: '' }]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), product: '', quantity: '' }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Bulk quote request submitted successfully! Our team will contact you shortly.');
    setItems([{ id: 1, product: '', quantity: '' }]);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="bg-surface pb-16">
      {/* Hero Section */}
      <div className="bg-primary text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1541888086225-ee5995818d1a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
        <div className="container-custom relative z-10 text-center max-w-3xl mx-auto">
          <ScrollReveal
            baseOpacity={0.2}
            baseRotation={2}
            blurStrength={6}
            as="h1"
            containerClassName="mb-6"
            textClassName="text-4xl md:text-5xl font-heading font-bold text-white"
          >
            Wholesale & Bulk Orders
          </ScrollReveal>
          <p className="text-lg md:text-xl text-gray-200 mb-8">
            Special pricing for contractors, builders, and large-scale construction projects. Get customized quotes within 24 hours.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Form Section */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
              <ScrollReveal
                baseOpacity={0.2}
                baseRotation={2}
                blurStrength={4}
                as="h2"
                containerClassName="mb-6"
                textClassName="text-2xl font-bold text-gray-900"
              >
                Request a Bulk Quote
              </ScrollReveal>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input type="text" required className="input-field w-full" placeholder="Enter company name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input type="text" required className="input-field w-full" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" required className="input-field w-full" placeholder="email@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" required className="input-field w-full" placeholder="+91" />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Product Requirements</h3>
                  
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex gap-4 items-end">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {index === 0 && "Product Name / SKU"}
                          </label>
                          <input type="text" required className="input-field w-full" placeholder="e.g. UltraTech Cement 50kg" />
                        </div>
                        <div className="w-1/3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {index === 0 && "Quantity"}
                          </label>
                          <input type="text" required className="input-field w-full" placeholder="e.g. 500 bags" />
                        </div>
                        {items.length > 1 && (
                          <button 
                            type="button" 
                            onClick={() => removeItem(item.id)}
                            className="p-3 text-danger hover:bg-danger/10 rounded-md transition-colors mb-[2px]"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={addItem}
                    className="flex items-center gap-2 text-primary font-medium mt-4 hover:underline"
                  >
                    <Plus size={16} />
                    Add Another Product
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Location (City/PIN)</label>
                    <input type="text" required className="input-field w-full" placeholder="e.g. Mumbai 400001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                    <input type="date" required className="input-field w-full" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requirements</label>
                    <textarea rows={4} className="input-field w-full resize-none" placeholder="Any specific requirements, unloading details, or notes..."></textarea>
                  </div>
                </div>

                <Button type="submit" variant="primary" className="w-full text-lg py-4">
                  Submit Quote Request
                </Button>
              </form>
            </div>
          </div>

          {/* Info Section */}
          <div className="w-full lg:w-2/5 space-y-8">
            <div>
              <ScrollReveal
                baseOpacity={0.2}
                baseRotation={2}
                blurStrength={4}
                as="h3"
                containerClassName="mb-6"
                textClassName="text-2xl font-bold text-gray-900"
              >
                Benefits of Bulk Ordering
              </ScrollReveal>
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Tiered Discounting</h4>
                    <p className="text-gray-600 text-sm">Get up to 25% off standard retail prices on high-volume orders.</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Priority Logistics</h4>
                    <p className="text-gray-600 text-sm">Dedicated fleet allocation ensuring on-time delivery for your project schedules.</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <Building size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Account Management</h4>
                    <p className="text-gray-600 text-sm">A dedicated account manager for direct communication and hassle-free reordering.</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 flex gap-4 items-start">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Credit Facilities</h4>
                    <p className="text-gray-600 text-sm">Flexible payment terms and credit lines available for registered businesses.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
              <h3 className="font-bold text-lg text-primary mb-4">Sample Savings</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Cement (1000+ Bags)</span>
                  <span className="font-bold text-success">Save 12%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">TMT Steel (10+ Tonnes)</span>
                  <span className="font-bold text-success">Save 8%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Paints (500+ Liters)</span>
                  <span className="font-bold text-success">Save 18%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesalePage;
