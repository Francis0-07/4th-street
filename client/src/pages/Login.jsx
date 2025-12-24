import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, ShoppingBag, Menu } from 'lucide-react';

const Login = ({ setAuth }) => {
  const [inputs, setInputs] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const { email, password } = inputs;

  const onChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    try {
      const body = { email, password };
      const response = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const parseRes = await response.json();

      if (parseRes.token) {
        localStorage.setItem("token", parseRes.token);
        
        // Sync Guest Cart
        const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
        if (guestCart.length > 0) {
            try {
                await Promise.all(guestCart.map(item => 
                    fetch("http://localhost:5000/cart", {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            token: parseRes.token 
                        },
                        body: JSON.stringify({ 
                            product_id: item.product_id, 
                            quantity: item.quantity, 
                            size: item.size 
                        })
                    })
                ));
                localStorage.removeItem('guestCart');
            } catch (error) { console.error("Error syncing cart:", error); }
        }

        setAuth(true);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setAuth(false);
        alert(parseRes);
      }
    } catch (err) {
      console.error(err.message);
      alert("Login failed. Please check your connection.");
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch("http://localhost:5000/auth/google-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ access_token: tokenResponse.access_token })
        });

        const parseRes = await response.json();

        if (parseRes.token) {
            localStorage.setItem("token", parseRes.token);
            
            // Sync Guest Cart
            const guestCart = JSON.parse(localStorage.getItem('guestCart') || '[]');
            if (guestCart.length > 0) {
                try {
                    await Promise.all(guestCart.map(item => 
                        fetch("http://localhost:5000/cart", {
                            method: "POST",
                            headers: { 
                                "Content-Type": "application/json",
                                token: parseRes.token 
                            },
                            body: JSON.stringify({ 
                                product_id: item.product_id, 
                                quantity: item.quantity, 
                                size: item.size 
                            })
                        })
                    ));
                    localStorage.removeItem('guestCart');
                } catch (error) { console.error("Error syncing cart:", error); }
            }

            setAuth(true);
            window.dispatchEvent(new Event("cartUpdated"));
        } else {
            setAuth(false);
            alert(parseRes);
        }

      } catch (err) {
        console.error("Google login failed", err);
        alert("Google login failed. Please check your connection.");
      }
    },
    onError: () => {
        console.log('Login Failed');
        alert('Google login failed. Please try again.');
    },
  });

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#111317] font-sans antialiased transition-colors duration-200">
      <div className="relative flex min-h-screen flex-col">
        {/* TopNavBar */}
        <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-200 bg-white/95 backdrop-blur px-6 py-4 lg:px-12">
          <div className="flex items-center gap-4">
            <Link className="group flex items-center gap-3" to="/">
              <div className="flex size-8 items-center justify-center rounded bg-[#194cb3] text-white">
                <ShoppingBag size={20} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#111317] uppercase">4th-street</h2>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link className="text-sm font-medium text-slate-600 hover:text-[#194cb3] transition-colors" to="/">Return to Store</Link>
          </div>
          {/* Mobile Menu Icon (Visible on small screens) */}
          <div className="flex md:hidden">
            <button className="text-[#111317]">
              <Menu size={24} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col justify-center py-10 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-[480px]">
            {/* Card Container */}
            <div className="bg-white px-6 py-10 shadow-xl ring-1 ring-gray-900/5 sm:rounded-xl sm:px-10 border border-gray-100">
              {/* SectionHeader */}
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-[#111317] uppercase">Welcome Back</h2>
                {/* BodyText */}
                <p className="mt-2 text-sm text-slate-500">Please enter your details to sign in.</p>
              </div>
              <form className="space-y-6" onSubmit={onSubmitForm}>
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium leading-6 text-[#111317]" htmlFor="email">Email address</label>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="text-gray-400" size={20} />
                    </div>
                    <input 
                        autoComplete="email" 
                        className="block w-full rounded-lg border-0 py-3 pl-10 text-[#111317] shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#194cb3] sm:text-sm sm:leading-6 transition-all" 
                        id="email" 
                        name="email" 
                        placeholder="you@example.com" 
                        required 
                        type="email"
                        value={email}
                        onChange={onChange}
                    />
                  </div>
                </div>
                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium leading-6 text-[#111317]" htmlFor="password">Password</label>
                    <div className="text-sm">
                      <Link className="font-semibold text-[#194cb3] hover:text-[#143d91] hover:underline transition-colors" to="/forgot-password">Forgot password?</Link>
                    </div>
                  </div>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="text-gray-400" size={20} />
                    </div>
                    <input 
                        autoComplete="current-password" 
                        className="block w-full rounded-lg border-0 py-3 pl-10 pr-10 text-[#111317] shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#194cb3] sm:text-sm sm:leading-6 transition-all" 
                        id="password" 
                        name="password" 
                        placeholder="••••••••" 
                        required 
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={onChange}
                    />
                    <div 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer group"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="text-gray-400 group-hover:text-gray-600" size={20} /> : <Eye className="text-gray-400 group-hover:text-gray-600" size={20} />}
                    </div>
                  </div>
                </div>
                {/* Login Button */}
                <div>
                  <button className="flex w-full justify-center rounded-lg bg-[#194cb3] px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#143d91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194cb3] transition-all duration-200 uppercase tracking-wide" type="submit">
                    Secure Login
                  </button>
                </div>
              </form>
              {/* Divider */}
              <div className="relative mt-8">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-white px-6 text-slate-500">Or continue with</span>
                </div>
              </div>
              {/* Social Login */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <a 
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#111317] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent transition-colors" 
                    href="#" // href is needed for styling but we prevent default
                    onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z" fill="white" fillOpacity="0.01"></path>
                    <path d="M20.1005 12.0001c0-.65-.05-1.2834-.1584-1.8917h-7.9418v3.5834h4.5418c-.2 1.05-.7917 1.9417-1.6917 2.5417v2.1083h2.7417c1.6083-1.4833 2.5333-3.6667 2.5333-6.1417l-.025-2.2Z" fill="#4285F4"></path>
                    <path d="M12.0005 20.4501c2.275 0 4.1833-.7584 5.575-2.0417l-2.7167-2.1083c-.7583.5083-1.725.8083-2.8583.8083-2.1917 0-4.05-1.4833-4.7083-3.475h-2.8417v2.2c1.4084 2.8 4.2917 4.6167 7.55 4.6167Z" fill="#34A853"></path>
                    <path d="M7.29202 13.6334c-.16667-.5-.25834-1.0334-.25834-1.5834s.09167-1.0834.25834-1.5834v-2.2h-2.84167c-.575.8667-.90833 1.9-.90833 3.0001s.33333 2.1333.90833 3.0001l2.84167-1.6334Z" fill="#FBBC05"></path>
                    <path d="M12.0005 6.98338c1.2416 0 2.35.425 3.225 1.25833l2.425-2.425C16.1838 4.45005 14.2755 3.55005 12.0005 3.55005c-3.2583 0-6.1416 1.81667-7.55 4.61667l2.8417 2.2c.6583-1.99167 2.5166-3.38334 4.7083-3.38334Z" fill="#EA4335"></path>
                  </svg>
                  <span className="text-sm font-medium leading-6">Google</span>
                </a>
                <a 
                    className="flex w-full items-center justify-center gap-3 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#111317] shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:ring-transparent transition-colors" 
                    href="#"
                    onClick={(e) => { e.preventDefault(); alert("Apple Sign-In integration requires an Apple Developer Account."); }}
                >
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M13.2 2.76666C13.2 2.76666 16.0667 2.8 16.0667 5.66666C16.0667 5.66666 16.0667 8.53333 13.2 8.53333C10.3334 8.53333 10.3334 5.66666 10.3334 5.66666C10.3334 2.8 13.2 2.76666 13.2 2.76666ZM12 11.2C12 11.2 14.8667 11.2333 14.8667 14.1C14.8667 14.1 14.8667 16.9667 12 16.9667C9.13335 16.9667 9.13335 14.1 9.13335 14.1C9.13335 11.2333 12 11.2 12 11.2ZM19.2334 11.2C19.2334 11.2 22.1 11.2333 22.1 14.1C22.1 14.1 22.1 16.9667 19.2334 16.9667C16.3667 16.9667 16.3667 14.1 16.3667 14.1C16.3667 11.2333 19.2334 11.2 19.2334 11.2ZM4.76669 11.2C4.76669 11.2 7.63335 11.2333 7.63335 14.1C7.63335 14.1 7.63335 16.9667 4.76669 16.9667C1.90002 16.9667 1.90002 14.1 1.90002 14.1C1.90002 11.2333 4.76669 11.2 4.76669 11.2Z"></path>
                  </svg>
                  <span className="text-sm font-medium leading-6">Apple</span>
                </a>
              </div>
            </div>
            {/* Footer Sign Up Prompt */}
            <p className="mt-10 text-center text-sm text-slate-500">
              Don't have an account?
              <Link className="font-semibold leading-6 text-[#194cb3] hover:text-[#143d91] transition-colors ml-1" to="/register">Sign up for free</Link>
            </p>
          </div>
          {/* Optional Editorial Image/Banner Section (Mobile Hidden, Desktop Subtle) */}
          <div className="mt-16 hidden lg:block mx-auto max-w-[960px] w-full px-8">
            <div className="relative overflow-hidden rounded-xl bg-gray-900 h-64 shadow-lg group">
              <img 
                alt="Close up of high quality folded men's shirts and suit jackets textures" 
                className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105" 
                src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?q=80&w=2070&auto=format&fit=crop" 
              />
              <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/40 to-transparent"></div>
              <div className="relative h-full flex flex-col justify-center px-10 max-w-lg">
                <h3 className="text-2xl font-bold text-white mb-2">New Arrivals for the Season</h3>
                <p className="text-gray-300">Discover the latest collection of premium menswear designed for the modern gentleman.</p>
                <div className="mt-4">
                  <Link className="text-sm font-medium text-white underline underline-offset-4 hover:text-gray-200" to="/shop">Explore collection →</Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Login;
