import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Search, ChevronDown, ChevronUp, MessageCircle, Mail } from 'lucide-react';

const faqs = [
  { 
    category: "Orders & Shipping",
    items: [
      { question: "How can I track my order?", answer: "Once your order has shipped, you will receive an email containing your tracking number. You can also track your order status by logging into your account and visiting the Order History page. Please allow up to 24 hours for the tracking information to update." },
      { question: "Do you ship internationally?", answer: "Yes, we ship to over 100 countries worldwide via DHL Express. International shipping costs are calculated at checkout based on the destination and package weight. Please note that duties and taxes may be due upon delivery depending on your country's regulations." },
      { question: "Can I change or cancel my order?", answer: "We process orders quickly to ensure fast delivery. If you need to make a change, please contact our support team within 1 hour of placing your order. After this window, we may not be able to modify the shipment, but you can always return items for free once they arrive." }
    ]
  },
  {
    category: "Returns & Refunds",
    items: [
      { question: "What is your return policy?", answer: "We accept returns of unworn, unwashed items with original tags attached within 30 days of delivery. Returns are free for all domestic orders. Start your return via our Returns Portal." },
      { question: "How long do refunds take to process?", answer: "Once your return is received and inspected at our warehouse (usually within 3-5 business days of receipt), we will initiate the refund. Please allow an additional 5-10 business days for your bank to post the refund to your account." }
    ]
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState("0-0"); // Default open first item
  const navigate = useNavigate();

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleMobileNav = (e) => {
    const value = e.target.value;
    if (value.startsWith('/dashboard')) {
      const tab = value.split('-')[1];
      navigate('/dashboard', { state: { activeTab: tab } });
    } else if (value) {
      navigate(value);
    }
  };

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#111317] font-sans antialiased">
      <main className="flex flex-1 flex-col items-center px-6 lg:px-10 py-8 lg:py-12 w-full max-w-[1280px] mx-auto min-h-screen">
        {/* Breadcrumbs */}
        <div className="w-full mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            <Link to="/" className="text-[#646f87] text-sm font-medium leading-normal hover:underline">Home</Link>
            <ChevronRight size={14} className="text-[#646f87]" />
            <Link to="/contact" className="text-[#646f87] text-sm font-medium leading-normal hover:underline">Support</Link>
            <ChevronRight size={14} className="text-[#646f87]" />
            <span className="text-[#111317] text-sm font-semibold leading-normal">FAQ</span>
          </div>
        </div>

        {/* Hero Heading & Search */}
        <div className="w-full flex flex-col items-center text-center mb-16 gap-6 max-w-2xl">
          <h1 className="text-[#111317] text-4xl lg:text-5xl font-black leading-tight tracking-tight">How can we help?</h1>
          <p className="text-[#646f87] text-lg font-normal leading-relaxed max-w-lg">
            Find answers to your questions about orders, shipping, returns, and more.
          </p>
          <div className="w-full mt-4">
            <label className="flex flex-col h-14 w-full shadow-sm">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#dcdfe5] bg-white transition-shadow focus-within:shadow-md focus-within:border-indigo-600">
                <div className="text-[#646f87] flex border-none items-center justify-center pl-5">
                  <Search size={24} />
                </div>
                <input className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-none focus:ring-0 border-none bg-transparent h-full placeholder:text-[#646f87] px-4 pl-3 text-base font-normal leading-normal" placeholder="Search for answers (e.g. 'return label')" />
              </div>
            </label>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-28">
            <h3 className="text-[#646f87] text-xs font-bold uppercase tracking-wider mb-4 px-3">Help Topics</h3>
            <nav className="flex flex-col gap-1">
              <a className="flex items-center justify-between rounded-lg bg-indigo-50 px-4 py-3 text-indigo-600 font-medium transition-colors" href="#">
                <span>Orders & Shipping</span>
                <ChevronRight size={14} />
              </a>
              <a className="flex items-center justify-between rounded-lg hover:bg-[#f0f2f4] px-4 py-3 text-[#111317] font-medium transition-colors" href="#">
                <span>Returns & Refunds</span>
              </a>
              <Link to="/shop" className="flex items-center justify-between rounded-lg hover:bg-[#f0f2f4] px-4 py-3 text-[#111317] font-medium transition-colors">
                <span>Products & Sizing</span>
              </Link>
              <Link to="/dashboard" state={{ activeTab: 'payments' }} className="flex items-center justify-between rounded-lg hover:bg-[#f0f2f4] px-4 py-3 text-[#111317] font-medium transition-colors">
                <span>Payments & Promos</span>
              </Link>
              <Link to="/dashboard" state={{ activeTab: 'settings' }} className="flex items-center justify-between rounded-lg hover:bg-[#f0f2f4] px-4 py-3 text-[#111317] font-medium transition-colors">
                <span>Account Management</span>
              </Link>
            </nav>
          </aside>

          {/* Mobile Category Dropdown */}
          <div className="lg:hidden col-span-1 w-full">
            <label className="block text-sm font-medium text-[#111317] mb-2">Select a topic</label>
            <div className="relative">
              <select onChange={handleMobileNav} className="block w-full rounded-lg border-[#dcdfe5] bg-white py-3 pl-4 pr-10 text-base focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 sm:text-sm">
                <option>Orders & Shipping</option>
                <option>Returns & Refunds</option>
                <option value="/shop">Products & Sizing</option>
                <option value="/dashboard-payments">Payments & Promos</option>
                <option value="/dashboard-settings">Account Management</option>
              </select>
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="col-span-1 lg:col-span-9 flex flex-col gap-8">
            {faqs.map((section, sectionIdx) => (
              <div key={sectionIdx} className="flex flex-col gap-4">
                <div className="border-b border-[#f0f2f4] pb-2 mb-2">
                  <h2 className="text-2xl font-bold text-[#111317]">{section.category}</h2>
                </div>
                {section.items.map((item, itemIdx) => {
                  const uniqueId = `${sectionIdx}-`;
                  const isOpen = openIndex === uniqueId;
                  return (
                    <div key={itemIdx} className="group bg-white border border-[#e5e7eb] rounded-lg overflow-hidden transition-all duration-300">
                      <button 
                        onClick={() => toggleFAQ(uniqueId)}
                        className="flex w-full cursor-pointer list-none items-center justify-between p-6 focus:outline-none"
                      >
                        <span className="text-base font-semibold text-[#111317] text-left">{item.question}</span>
                        {isOpen ? <ChevronUp className="text-[#646f87]" /> : <ChevronDown className="text-[#646f87]" />}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6 pt-0 text-[#4b5563] leading-relaxed animate-fadeIn">
                          <p>{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* "Still Need Help" Footer Banner */}
        <div className="w-full mt-20">
          <div className="bg-white border border-[#dcdfe5] rounded-xl p-8 lg:p-12 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-50"></div>
            <h3 className="text-2xl font-bold text-[#111317] mb-3">Still need help?</h3>
            <p className="text-[#646f87] mb-8 max-w-lg mx-auto">Our Concierge Team is available Monday through Friday, 9am - 6pm EST to assist with fit advice, styling, or order inquiries.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg transition-colors">
                <MessageCircle size={20} />
                <span>Start Live Chat</span>
              </button>
              <Link to="/contact" className="flex items-center justify-center gap-2 bg-white border border-[#dcdfe5] text-[#111317] hover:bg-gray-50 font-medium px-6 py-3 rounded-lg transition-colors">
                <Mail size={20} />
                <span>Email Support</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FAQ;
