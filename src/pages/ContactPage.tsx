import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const ContactPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent successfully! We will get back to you soon.');
    (e.target as HTMLFormElement).reset();
  };

  const faqs = [
    { q: 'How long does delivery take?', a: 'Standard delivery takes 2-4 business days depending on your location. Bulk orders may require specific scheduling.' },
    { q: 'Do you offer site unloading?', a: 'Yes, unloading services can be arranged for bulk orders at an additional nominal charge. Please mention this during checkout.' },
    { q: 'Can I return unused materials?', a: 'We accept returns of sealed, undamaged products within 7 days of delivery. Custom-cut or mixed materials (like specific paint shades) cannot be returned.' },
    { q: 'Are your products GST compliant?', a: 'Yes, all our invoices are GST compliant. You can use them to claim input tax credit for your business.' },
    { q: 'Do you provide test certificates for cement/steel?', a: 'Absolutely. Manufacturer Test Certificates (MTC) are provided upon request for relevant structural materials.' }
  ];

  return (
    <div className="bg-surface pb-16">
      <div className="bg-primary py-12 text-white">
        <div className="container-custom text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">Contact & Support</h1>
          <p className="text-lg text-gray-200">We're here to help with your construction material needs.</p>
        </div>
      </div>

      <div className="container-custom py-12">
        <div className="flex flex-col lg:flex-row gap-12 mb-16">
          {/* Form */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input type="text" required className="input-field w-full" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" required className="input-field w-full" placeholder="john@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" required className="input-field w-full" placeholder="+91" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <select className="input-field w-full" required>
                      <option value="">Select a topic</option>
                      <option value="order">Order Inquiry</option>
                      <option value="bulk">Bulk Quote Request</option>
                      <option value="support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea required rows={5} className="input-field w-full resize-none" placeholder="How can we help you?"></textarea>
                </div>
                <Button type="submit" variant="primary" className="w-full md:w-auto px-8">
                  Send Message
                </Button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Phone size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Phone</h3>
                <p className="text-gray-600 text-sm mb-1">Toll-Free Support</p>
                <a href="tel:18001234567" className="text-primary font-medium">1800-123-4567</a>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Mail size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Email</h3>
                <p className="text-gray-600 text-sm mb-1">For quotes and support</p>
                <a href="mailto:support@hepnamart.com" className="text-primary font-medium">support@hepnamart.com</a>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <MapPin size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Head Office</h3>
                <p className="text-gray-600 text-sm">
                  123 Construction Hub, Sector 4,<br />
                  Andheri East, Mumbai<br />
                  Maharashtra 400059
                </p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Working Hours</h3>
                <p className="text-gray-600 text-sm">
                  Mon - Sat: 8:00 AM - 8:00 PM<br />
                  Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="bg-gray-200 w-full h-64 rounded-xl flex items-center justify-center mb-16">
          <span className="text-gray-500 font-medium">Map Coming Soon</span>
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="font-bold text-gray-900 mb-2 text-lg">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
