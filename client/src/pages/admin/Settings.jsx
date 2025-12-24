import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Save, Store, CreditCard, Truck, Receipt, Bell, Search, LogOut, ChevronRight, Mail, Phone, Globe, MapPin, DollarSign, Clock, Hash, Share2 } from 'lucide-react';

const Settings = () => {
  const [formData, setFormData] = useState({
    store_name: '',
    contact_email: '',
    currency: '',
    tax_rate: '',
    shipping_fee: '',
    tiktok_url: '',
    instagram_url: '',
    twitter_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:5000/admin/settings', {
          headers: { token: localStorage.token }
        });
        const data = await response.json();
        setFormData(data);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          token: localStorage.token
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setFormData(updatedData);
        alert('Settings updated successfully!');
      } else {
        alert('Failed to update settings.');
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#0e121b] font-sans flex overflow-hidden">
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f6f6f8] relative">
        {/* Header Sticky */}
        <header className="bg-[#f6f6f8] z-10 px-8 pt-8 pb-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Link to="/admin" className="text-gray-500 hover:text-indigo-600 font-medium transition-colors">Dashboard</Link>
            <ChevronRight size={16} className="text-gray-400" />
            <Link to="/admin/settings" className="text-gray-500 hover:text-indigo-600 font-medium transition-colors">Settings</Link>
            <ChevronRight size={16} className="text-gray-400" />
            <span className="text-[#0e121b] font-semibold">General</span>
          </div>
          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0e121b]">General Settings</h2>
              <p className="text-[#506795] mt-1">Manage your store details, regional preferences, and contact information.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                Discard
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2">
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-20">
          <div className="max-w-4xl space-y-6">
            
            {/* Section 1: Store Details */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-[#0e121b]">Store Profile</h3>
                  <p className="text-xs text-gray-500">Visible on invoices and customer emails.</p>
                </div>
                <Store className="text-gray-400" size={20} />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Store Name */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="store_name">Store Name</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="store_name" name="store_name" required value={formData.store_name} onChange={handleChange} type="text" />
                  </div>
                  {/* Contact Email */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="contact_email">Contact Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-2.5 text-gray-400" size={20} />
                      <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 pl-10 pr-4 py-2.5 text-sm transition-all outline-none" id="contact_email" name="contact_email" required value={formData.contact_email || ''} onChange={handleChange} type="email" placeholder="support@store.com" />
                    </div>
                  </div>
                  {/* Phone Number */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="phone" placeholder="+1 (555) 000-0000" type="tel" />
                  </div>
                  {/* Industry */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="industry">Industry</label>
                    <select className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="industry">
                      <option>Fashion & Apparel</option>
                      <option>Home & Garden</option>
                      <option>Electronics</option>
                      <option>Beauty & Cosmetics</option>
                    </select>
                  </div>
                </div>
                {/* Description */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="store_desc">Store Description</label>
                  <textarea className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-3 text-sm transition-all resize-none outline-none" id="store_desc" placeholder="Briefly describe your store for SEO purposes..." rows="3"></textarea>
                  <p className="text-xs text-gray-500 text-right">0/300 characters</p>
                </div>
              </div>
            </section>

            {/* Section 2: Location */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-[#0e121b]">Business Address</h3>
                  <p className="text-xs text-gray-500">Used for shipping calculations and taxes.</p>
                </div>
                <MapPin className="text-gray-400" size={20} />
              </div>
              <div className="p-6 space-y-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-700" htmlFor="address">Street Address</label>
                  <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="address" placeholder="123 Main St" type="text" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="city">City</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="city" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="zip">Zip / Postal Code</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="zip" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="country">Country/Region</label>
                    <select className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="country">
                      <option>United States</option>
                      <option>United Kingdom</option>
                      <option>Canada</option>
                      <option>Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Social Media */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-[#0e121b]">Social Media</h3>
                  <p className="text-xs text-gray-500">Links to your social profiles.</p>
                </div>
                <Share2 className="text-gray-400" size={20} />
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="tiktok_url">TikTok URL</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="tiktok_url" name="tiktok_url" value={formData.tiktok_url || ''} onChange={handleChange} type="url" placeholder="https://tiktok.com/@..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="instagram_url">Instagram URL</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="instagram_url" name="instagram_url" value={formData.instagram_url || ''} onChange={handleChange} type="url" placeholder="https://instagram.com/..." />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="twitter_url">Twitter / X URL</label>
                    <input className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" id="twitter_url" name="twitter_url" value={formData.twitter_url || ''} onChange={handleChange} type="url" placeholder="https://twitter.com/..." />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Standards & Formats */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold text-[#0e121b]">Standards & Formats</h3>
                  <p className="text-xs text-gray-500">Set your local currency and time preferences.</p>
                </div>
                <SettingsIcon className="text-gray-400" size={20} />
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Currency */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="text-gray-400" size={20} />
                    <label className="text-sm font-medium text-gray-700" htmlFor="currency">Store Currency</label>
                  </div>
                  <input type="text" name="currency" id="currency" required value={formData.currency} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" />
                  <p className="text-xs text-gray-500">This is the currency your products are sold in.</p>
                </div>
                {/* Tax Rate */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="text-gray-400" size={20} />
                    <label className="text-sm font-medium text-gray-700" htmlFor="tax_rate">Tax Rate (%)</label>
                  </div>
                  <input type="number" name="tax_rate" id="tax_rate" step="0.01" required value={formData.tax_rate} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" />
                </div>
                {/* Shipping Fee */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Truck className="text-gray-400" size={20} />
                    <label className="text-sm font-medium text-gray-700" htmlFor="shipping_fee">Standard Shipping Fee</label>
                  </div>
                  <input type="number" name="shipping_fee" id="shipping_fee" step="0.01" required value={formData.shipping_fee} onChange={handleChange} className="w-full rounded-lg border border-gray-200 bg-gray-50 text-[#0e121b] focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 px-4 py-2.5 text-sm transition-all outline-none" />
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;

// Helper component for the icon
const SettingsIcon = ({ size, className }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;