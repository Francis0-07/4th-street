import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter } from 'lucide-react';

// Custom TikTok Icon
const TikTok = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Footer = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('http://localhost:5000/settings');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        console.error(err.message);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center flex-col md:flex-row gap-6">
          <div>
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} {settings?.store_name || '4th-street'}. All rights reserved.
            </p>
          </div>
          <div className="flex space-x-6">
            {settings?.instagram_url && (
              <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Instagram</span>
                <Instagram size={24} />
              </a>
            )}
            {settings?.twitter_url && (
              <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">Twitter</span>
                <Twitter size={24} />
              </a>
            )}
            {settings?.tiktok_url && (
              <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
                <span className="sr-only">TikTok</span>
                <TikTok size={24} />
              </a>
            )}
          </div>
          <div className="flex space-x-6">
            <Link to="/about" className="text-gray-400 hover:text-gray-500">About</Link>
            <Link to="/contact" className="text-gray-400 hover:text-gray-500">Support</Link>
            <Link to="/faq" className="text-gray-400 hover:text-gray-500">FAQ</Link>
            <Link to="/terms" className="text-gray-400 hover:text-gray-500">Terms</Link>
            <Link to="/privacy" className="text-gray-400 hover:text-gray-500">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;