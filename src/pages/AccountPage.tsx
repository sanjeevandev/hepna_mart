import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Package, Heart, Building, Settings, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';

const AccountPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package, link: '/orders' },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, link: '/wishlist' },
    { id: 'bulk', label: 'Bulk Orders', icon: Building, link: '/wholesale' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="container-custom py-12">
      <h1 className="text-3xl font-heading font-bold text-primary mb-8">My Account</h1>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full md:w-1/4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 bg-primary text-white text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
                JD
              </div>
              <h2 className="font-bold text-lg">John Doe</h2>
              <p className="text-primary-light text-sm">john.doe@example.com</p>
            </div>
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                if (tab.link) {
                  return (
                    <Link
                      key={tab.id}
                      to={tab.link}
                      className="flex items-center gap-3 w-full p-3 text-left rounded-lg text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors mb-1"
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.label}</span>
                    </Link>
                  );
                }
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 w-full p-3 text-left rounded-lg transition-colors mb-1 ${
                      activeTab === tab.id 
                        ? 'bg-primary/5 text-primary font-medium' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-primary'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
              <div className="h-px bg-gray-100 my-2 mx-3"></div>
              <button className="flex items-center gap-3 w-full p-3 text-left rounded-lg text-danger hover:bg-danger/5 transition-colors">
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="w-full md:w-3/4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" className="input-field w-full" defaultValue="John Doe" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input type="email" className="input-field w-full" defaultValue="john.doe@example.com" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input type="tel" className="input-field w-full" defaultValue="+91 98765 43210" readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                    <input type="text" className="input-field w-full" defaultValue="BuildRight Constructions" readOnly />
                  </div>
                </div>
                <Button className="mt-8">Edit Profile</Button>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Saved Addresses</h2>
                  <Button variant="outline" size="sm">+ Add New</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-primary rounded-lg p-4 relative">
                    <span className="absolute top-4 right-4 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">Default</span>
                    <h3 className="font-bold text-lg mb-1">Site Office (Mumbai)</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Plot No 45, MIDC Industrial Area,<br />
                      Andheri East,<br />
                      Mumbai, Maharashtra 400093
                    </p>
                    <div className="flex gap-4">
                      <button className="text-primary text-sm font-medium hover:underline">Edit</button>
                      <button className="text-danger text-sm font-medium hover:underline">Delete</button>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-1">Warehouse</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Survey No 123, Pune-Bangalore Highway,<br />
                      Wakad,<br />
                      Pune, Maharashtra 411057
                    </p>
                    <div className="flex gap-4">
                      <button className="text-primary text-sm font-medium hover:underline">Edit</button>
                      <button className="text-danger text-sm font-medium hover:underline">Delete</button>
                      <button className="text-gray-500 text-sm font-medium hover:underline ml-auto">Set Default</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
                <div className="space-y-6 max-w-xl">
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-medium text-gray-900">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive order updates and promotional emails</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between py-4 border-b border-gray-100">
                    <div>
                      <h3 className="font-medium text-gray-900">SMS Alerts</h3>
                      <p className="text-sm text-gray-500">Get delivery tracking updates via SMS</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline" className="text-danger border-danger hover:bg-danger hover:text-white">
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountPage;
