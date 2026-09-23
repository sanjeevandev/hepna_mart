import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Linkedin, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary text-gray-300">
      <div className="container-custom pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-heading font-bold text-2xl tracking-tight text-white">
                HEPNA <span className="text-accent">MART</span>
              </span>
            </Link>
            <p className="text-accent-light font-medium text-sm">Everything You Need to Build.</p>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Premium construction materials, tools, and supplies delivered directly to your site. Quality products for professional builders and homeowners.
            </p>
            
            <div className="pt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 text-accent flex-shrink-0" />
                <span>123 Industrial Area, Phase 1, New Delhi, India 110020</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <span>support@hepnamart.com</span>
              </div>
            </div>

            <div className="flex space-x-4 pt-2">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Column 2 - Shop */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Shop</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/category/cement" className="hover:text-accent transition-colors">Cement & Mixes</Link></li>
              <li><Link to="/category/bricks-blocks" className="hover:text-accent transition-colors">Bricks & Blocks</Link></li>
              <li><Link to="/category/roofing" className="hover:text-accent transition-colors">Roofing Materials</Link></li>
              <li><Link to="/category/plumbing" className="hover:text-accent transition-colors">Plumbing & Pipes</Link></li>
              <li><Link to="/category/electrical" className="hover:text-accent transition-colors">Electrical</Link></li>
              <li><Link to="/category/flooring" className="hover:text-accent transition-colors">Flooring & Tiles</Link></li>
              <li><Link to="/category/tools" className="hover:text-accent transition-colors">Tools & Equipment</Link></li>
            </ul>
          </div>

          {/* Column 3 - Customer Service */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Customer Service</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="#" className="hover:text-accent transition-colors">Shipping Policy</Link></li>
              <li><Link to="#" className="hover:text-accent transition-colors">Returns & Refunds</Link></li>
              <li><Link to="#" className="hover:text-accent transition-colors">Payment Methods</Link></li>
              <li><Link to="/orders" className="hover:text-accent transition-colors">Order Tracking</Link></li>
              <li><Link to="/wholesale" className="hover:text-accent transition-colors">Bulk Orders</Link></li>
              <li><Link to="#" className="hover:text-accent transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 4 - Business */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Business</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/wholesale" className="hover:text-accent transition-colors">Wholesale Program</Link></li>
              <li><Link to="#" className="hover:text-accent transition-colors">Supplier Registration</Link></li>
              <li><Link to="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link to="#" className="hover:text-accent transition-colors">Careers</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-light flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} HEPNA MART. All Rights Reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
