import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

const Register = ({ setAuth }) => {
  const navigate = useNavigate();
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const { email, password, confirmPassword, name, phone } = inputs;

  const onChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
    }

    try {
      const body = { email, password, name, phone };
      const response = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const parseRes = await response.json();

      if (parseRes.token) {
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

        alert("Registration successful! Please log in.");
        window.dispatchEvent(new Event("cartUpdated"));
        navigate("/login");
      } else {
        setAuth(false);
        alert(parseRes); // Simple error handling
      }
    } catch (err) {
      console.error(err.message);
      alert("Registration failed. Please check your connection.");
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
            navigate("/dashboard");
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
        alert('Google sign-up failed. Please try again.');
    },
  });

  return (
    <div className="bg-[#f6f6f8] min-h-screen text-[#111317] font-sans">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        {/* Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f4] bg-white px-6 lg:px-10 py-3 sticky top-0 z-50">
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-1 rounded">
              <ShoppingBag size={20} />
            </div>
            <span className="font-serif text-2xl font-bold tracking-wide text-gray-900">4th-street</span>
          </Link>
          <div className="flex flex-1 justify-end gap-8 hidden md:flex">
            <div className="flex items-center gap-9">
              <Link className="text-[#111317] text-sm font-medium leading-normal hover:text-[#194cb3] transition-colors" to="/shop">Shop</Link>
              <Link className="text-[#111317] text-sm font-medium leading-normal hover:text-[#194cb3] transition-colors" to="/about">About</Link>
            </div>
            <div className="flex gap-2">
              <Link className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#194cb3] text-white text-sm font-bold leading-normal tracking-[0.015em] hover:bg-blue-800 transition-colors" to="/login">
                <span className="truncate">Log In</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex h-full grow flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-[1100px] bg-white rounded-xl shadow-sm border border-[#e5e7eb] overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Side: Editorial Image */}
              <div className="w-full lg:w-1/2 relative min-h-[300px] lg:min-h-[700px] bg-[#111621]">
                <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?q=80&w=2187&auto=format&fit=crop")' }}>
                </div>
                <div className="absolute inset-0 bg-black/20 mix-blend-multiply"></div>
                <div className="absolute bottom-0 left-0 p-8 lg:p-12 text-white z-10">
                  <h3 className="text-2xl font-bold mb-2">Refined Style.</h3>
                  <p className="text-white/90 text-sm font-medium leading-relaxed max-w-sm">
                    "Fashion fades, style is eternal." <br/>— Yves Saint Laurent
                  </p>
                </div>
              </div>

              {/* Right Side: Registration Form */}
              <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                <div className="max-w-[480px] mx-auto w-full">
                  <div className="mb-8">
                    <h1 className="text-[#111317] text-3xl font-black leading-tight tracking-[-0.033em] mb-2">
                      Join the Club
                    </h1>
                    <p className="text-[#646f87] text-sm font-normal leading-normal">
                      Create an account to experience tailored service, exclusive offers, and faster checkout.
                    </p>
                  </div>
                  
                  <form className="flex flex-col gap-5" onSubmit={onSubmitForm}>
                    {/* Name Field */}
                    <label className="flex flex-col">
                      <p className="text-[#111317] text-sm font-medium leading-normal pb-2">Full Name</p>
                      <input 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#194cb3] h-12 placeholder:text-[#646f87] px-4 text-base font-normal leading-normal transition-colors" 
                        placeholder="John Doe" 
                        type="text"
                        name="name"
                        value={name}
                        onChange={onChange}
                        required
                      />
                    </label>

                    {/* Email Field */}
                    <label className="flex flex-col">
                      <p className="text-[#111317] text-sm font-medium leading-normal pb-2">Email Address</p>
                      <input 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#194cb3] h-12 placeholder:text-[#646f87] px-4 text-base font-normal leading-normal transition-colors" 
                        placeholder="john.doe@example.com" 
                        type="email"
                        name="email"
                        value={email}
                        onChange={onChange}
                        required
                      />
                    </label>

                    {/* Phone Field (Optional) */}
                    <label className="flex flex-col">
                      <p className="text-[#111317] text-sm font-medium leading-normal pb-2">Phone Number (Optional)</p>
                      <input 
                        className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#194cb3] h-12 placeholder:text-[#646f87] px-4 text-base font-normal leading-normal transition-colors" 
                        placeholder="+1 (555) 000-0000" 
                        type="tel"
                        name="phone"
                        value={phone}
                        onChange={onChange}
                      />
                    </label>

                    {/* Password Fields */}
                    <div className="flex flex-col gap-5">
                      <label className="flex flex-col">
                        <p className="text-[#111317] text-sm font-medium leading-normal pb-2">Password</p>
                        <div className="relative">
                          <input 
                            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#194cb3] h-12 placeholder:text-[#646f87] px-4 text-base font-normal leading-normal transition-colors" 
                            placeholder="Min 8 characters" 
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                          />
                          <button 
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#646f87] hover:text-[#111317]" 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </label>
                      <label className="flex flex-col">
                        <p className="text-[#111317] text-sm font-medium leading-normal pb-2">Confirm Password</p>
                        <input 
                            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111317] focus:outline-0 focus:ring-0 border border-[#dcdfe5] bg-white focus:border-[#194cb3] h-12 placeholder:text-[#646f87] px-4 text-base font-normal leading-normal transition-colors" 
                            placeholder="Re-enter password" 
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={onChange}
                            required
                        />
                      </label>
                    </div>

                    {/* Checkbox */}
                    <div className="py-1">
                      <label className="flex gap-x-3 items-start cursor-pointer group">
                        <input className="mt-1 h-5 w-5 rounded border-[#dcdfe5] border-2 bg-transparent text-[#194cb3] focus:ring-0 focus:ring-offset-0 focus:border-[#194cb3] focus:outline-none transition-all cursor-pointer" type="checkbox"/>
                        <span className="text-[#111317] text-sm font-normal leading-normal select-none group-hover:text-[#194cb3] transition-colors">Subscribe to our newsletter for style advice and exclusive offers</span>
                      </label>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-4 pt-2">
                      <button type="submit" className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#194cb3] hover:bg-blue-800 transition-colors text-white text-base font-bold leading-normal tracking-[0.015em] shadow-sm">
                        <span className="truncate">Create Account</span>
                      </button>
                      
                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-[#e5e7eb]"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wider font-medium">Or</span>
                        <div className="flex-grow border-t border-[#e5e7eb]"></div>
                      </div>
                      
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); handleGoogleLogin(); }}
                        className="flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-white border border-[#dcdfe5] hover:bg-gray-50 transition-colors text-[#111317] text-base font-medium leading-normal tracking-[0.015em]"
                      >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.813.96 6.493 2.507l2.533-2.547C19.053 1.36 16.133 0 12.48 0 5.6 0 0 5.6 0 12.48S5.6 24.96 12.48 24.96c3.6 0 6.613-1.187 8.88-3.28 2.32-2.147 3-5.307 3-7.973 0-.787-.067-1.48-.187-2.133H12.48z"/></svg>
                        <span className="truncate">Sign up with Google</span>
                      </button>
                    </div>
                  </form>

                  {/* Footer Link */}
                  <div className="mt-8 text-center">
                    <p className="text-[#646f87] text-sm">
                      Already have an account? 
                      <Link className="text-[#194cb3] font-bold hover:underline ml-1" to="/login">Log in</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Legal */}
          <div className="mt-8 text-center max-w-lg mx-auto">
            <p className="text-xs text-[#9ca3af]">
              By creating an account, you agree to our <Link className="underline hover:text-[#194cb3]" to="/terms">Terms of Service</Link> and <Link className="underline hover:text-[#194cb3]" to="/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
