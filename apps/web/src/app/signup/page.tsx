"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Check, 
  Hotel, 
  User, 
  Settings, 
  ArrowRight, 
  ArrowLeft,
  Mail,
  Lock,
  Building2,
  MapPin,
  Map,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const FEATURES = [
  { 
    id: "FRONT_DESK", 
    name: "Front Desk & Reservations", 
    desc: "Manage bookings, guests, and room availability.", 
    subFeatures: ["Reservations", "Guests", "Rooms", "Room Types", "Front Desk"],
    required: false
  },
  { 
    id: "OPERATIONS", 
    name: "Operations", 
    desc: "Real-time task assignment and room status tracking.", 
    subFeatures: ["Housekeeping", "Maintenance"],
    required: false
  },
  { 
    id: "STAFF_MANAGEMENT", 
    name: "Staff & CRM", 
    desc: "Manage employees, roles, and corporate clients.", 
    subFeatures: ["Companies", "Staff"],
    required: false
  },
  { 
    id: "POS", 
    name: "Point of Sale (POS)", 
    desc: "Complete restaurant and bar management suite.", 
    subFeatures: ["Point of Sale", "Kitchen KDS", "Bar Drinks", "Waitstaff", "Returns & Discounts", "POS Cashier"],
    required: false
  },
  { 
    id: "EVENTS", 
    name: "Event & Ticketing", 
    desc: "Manage spaces, tours, and ticket sales.", 
    subFeatures: ["Tours & Packages", "Tickets", "Event Management"],
    required: false
  },
  { 
    id: "FINANCE", 
    name: "Finance & Accounting", 
    desc: "Automate daily closing, balancing, and managerial reports.", 
    subFeatures: ["Billing", "Expenses", "Night Audit", "Financials", "Reports", "Audit Tracking"],
    required: false
  },
  { 
    id: "INVENTORY", 
    name: "Inventory Management", 
    desc: "Track stock, automate purchase orders, and manage vendors.", 
    subFeatures: ["Real-time Inventory Tracking", "Purchase Orders", "Supplier Management"],
    required: false
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  
  const [formData, setFormData] = useState({
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    propertyName: "",
    propertyAddress: "",
    propertyCity: "",
    selectedFeatures: [] as string[],
  });

  const handleStep1Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!formData.adminName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.adminEmail.trim() || !emailRegex.test(formData.adminEmail.trim())) {
      setError("Please enter a valid work email address.");
      return;
    }

    if (!formData.adminPassword) {
      setError("Please create a password.");
      return;
    }

    if (formData.adminPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    // Password and details valid — advance to Step 2
    setError("");
    setStep(2);
  };

  const handleStep2Next = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    if (!formData.propertyName.trim()) {
      setError("Please enter your property name.");
      return;
    }

    if (!formData.propertyCity.trim()) {
      setError("Please enter the city where your property is located.");
      return;
    }

    if (!formData.propertyAddress.trim()) {
      setError("Please enter the full address of your property.");
      return;
    }

    setError("");
    setStep(3);
  };

  const handleFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter(id => id !== featureId)
        : [...prev.selectedFeatures, featureId]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register-property`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = Array.isArray(data.message) 
          ? data.message.join(", ") 
          : (data.message || "Registration failed");
        throw new Error(errorMsg);
      }
      
      // Auto-login after registration
      const loginRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.adminEmail, password: formData.adminPassword }),
      });
      
      if (loginRes.ok) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      const msg = err.message || "An unexpected error occurred.";
      setError(msg);
      setLoading(false);

      // If the error pertains to Step 1 fields, return to Step 1 immediately
      if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("email") || msg.toLowerCase().includes("name")) {
        setStep(1);
      } else if (msg.toLowerCase().includes("property") || msg.toLowerCase().includes("city") || msg.toLowerCase().includes("address")) {
        setStep(2);
      }
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((num) => (
          <React.Fragment key={num}>
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                step === num 
                  ? "w-8 bg-gradient-to-r from-[#DFB776] to-[#CA9851]" 
                  : step > num 
                    ? "w-2.5 bg-[#CA9851]" 
                    : "w-2.5 bg-white/10"
              }`}
            />
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-[#050B14] font-sans text-gray-100">
      
      {/* Left Panel - Premium Branding */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-[#070F1E] border-r border-[#CA9851]/15 overflow-hidden flex-col justify-between p-12 xl:p-16">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0B1D33]/40 via-[#070F1E] to-[#050B14]" />
        <div className="absolute -top-[30%] -right-[20%] w-[80%] h-[80%] bg-[#CA9851]/10 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-[#0B1D33]/60 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 text-white group w-fit">
            <img 
              src="/kwalee-logo.png" 
              alt="Kwalee Beach Resort" 
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>
        </div>

        <div className="relative z-10 text-white max-w-lg mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#CA9851]/10 border border-[#CA9851]/30 text-xs font-semibold text-[#DFB776] mb-6 backdrop-blur-md">
            <Sparkles size={14} className="text-[#CA9851]" />
            <span>Smarter Hotel Management</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-6 leading-[1.15] text-white">
            The operating system for modern <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E9C78C] via-[#CA9851] to-[#B3823E]">hospitality.</span>
          </h1>
          <p className="text-gray-400 text-lg leading-relaxed font-normal">
            Join forward-thinking hotels scaling their operations, boosting revenue, and delivering unforgettable guest experiences globally.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 relative overflow-y-auto bg-[#050B14]">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden flex items-center justify-between mb-12">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/kwalee-logo.png" 
              alt="Kwalee Beach Resort" 
              className="h-9 w-auto object-contain"
            />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-[#DFB776] hover:text-[#E9C78C] transition-colors">Log in</Link>
        </div>

        <div className="lg:absolute top-8 right-12 hidden lg:block">
          <span className="text-sm text-gray-400 font-medium">Already have an account? </span>
          <Link href="/login" className="text-sm font-bold text-[#DFB776] hover:text-[#E9C78C] transition-colors">Log in</Link>
        </div>

        <div className="mx-auto w-full max-w-[440px]">
          {renderStepIndicator()}
          
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              {step === 1 ? "Create your account" : step === 2 ? "Property details" : "Select modules"}
            </h2>
            <p className="text-gray-400 text-sm">
              {step === 1 ? "Start your 14-day free trial. No credit card required." : 
               step === 2 ? "Tell us a bit about your property to customize your experience." : 
               "Choose only the modules and features you need for your property."}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-500/10 text-red-400 rounded-xl text-sm font-medium border border-red-500/20 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              </div>
              <p>{error}</p>
            </div>
          )}

          {/* Step 1: Admin User */}
          {step === 1 && (
            <form onSubmit={handleStep1Next} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500" noValidate>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Full Name"
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#070F1E] border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#CA9851] focus:ring-1 focus:ring-[#CA9851] sm:text-sm sm:leading-6 transition-all shadow-sm"
                    value={formData.adminName} 
                    onChange={e => {
                      setFormData({...formData, adminName: e.target.value});
                      if (error && error.toLowerCase().includes("name")) setError("");
                    }} 
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required 
                    placeholder="Work Email"
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#070F1E] border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#CA9851] focus:ring-1 focus:ring-[#CA9851] sm:text-sm sm:leading-6 transition-all shadow-sm"
                    value={formData.adminEmail} 
                    onChange={e => {
                      setFormData({...formData, adminEmail: e.target.value});
                      if (error && error.toLowerCase().includes("email")) setError("");
                    }} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required 
                      placeholder="Create Password"
                      className={`block w-full pl-11 pr-12 py-3.5 bg-[#070F1E] border rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 sm:text-sm sm:leading-6 transition-all shadow-sm ${
                        formData.adminPassword && formData.adminPassword.length < 8
                          ? "border-amber-500/50 focus:border-amber-500 focus:ring-amber-500"
                          : formData.adminPassword.length >= 8
                            ? "border-[#CA9851]/60 focus:border-[#CA9851] focus:ring-[#CA9851]"
                            : "border-white/10 focus:border-[#CA9851] focus:ring-[#CA9851]"
                      }`}
                      value={formData.adminPassword} 
                      onChange={e => {
                        setFormData({...formData, adminPassword: e.target.value});
                        if (error && error.toLowerCase().includes("password")) setError("");
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#DFB776] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Real-time Password Requirement Guidance */}
                  <div className="flex items-center justify-between text-xs px-1">
                    <div className="flex items-center gap-1.5">
                      {formData.adminPassword.length >= 8 ? (
                        <CheckCircle2 size={14} className="text-[#DFB776] flex-shrink-0" />
                      ) : (
                        <div className={`w-2 h-2 rounded-full transition-colors ${
                          formData.adminPassword.length > 0 ? 'bg-amber-400' : 'bg-gray-500'
                        }`} />
                      )}
                      <span className={formData.adminPassword.length >= 8 ? "text-[#DFB776] font-medium" : "text-gray-400"}>
                        Must be at least 8 characters
                      </span>
                    </div>
                    {formData.adminPassword.length > 0 && (
                      <span className={`text-[11px] font-mono ${
                        formData.adminPassword.length >= 8 ? 'text-[#DFB776]' : 'text-amber-400'
                      }`}>
                        {formData.adminPassword.length}/8
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-[#070F1E] bg-gradient-to-r from-[#DFB776] via-[#CA9851] to-[#B3823E] hover:from-[#E9C78C] hover:to-[#DFB776] transition-all shadow-[0_0_25px_rgba(202,152,81,0.35)] mt-8"
              >
                Continue <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Step 2: Property */}
          {step === 2 && (
            <form onSubmit={handleStep2Next} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500" noValidate>
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="Property Name"
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#070F1E] border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#CA9851] focus:ring-1 focus:ring-[#CA9851] sm:text-sm sm:leading-6 transition-all shadow-sm"
                    value={formData.propertyName} 
                    onChange={e => {
                      setFormData({...formData, propertyName: e.target.value});
                      if (error && error.toLowerCase().includes("property")) setError("");
                    }} 
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required 
                    placeholder="City"
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#070F1E] border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#CA9851] focus:ring-1 focus:ring-[#CA9851] sm:text-sm sm:leading-6 transition-all shadow-sm"
                    value={formData.propertyCity} 
                    onChange={e => {
                      setFormData({...formData, propertyCity: e.target.value});
                      if (error && error.toLowerCase().includes("city")) setError("");
                    }} 
                  />
                </div>
                
                <div className="relative group">
                  <div className="absolute top-4 left-0 pl-4 flex items-start pointer-events-none">
                    <Map className="h-5 w-5 text-gray-500 group-focus-within:text-[#DFB776] transition-colors" />
                  </div>
                  <textarea 
                    required 
                    rows={2} 
                    placeholder="Full Address"
                    className="block w-full pl-11 pr-4 py-3.5 bg-[#070F1E] border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#CA9851] focus:ring-1 focus:ring-[#CA9851] sm:text-sm sm:leading-6 transition-all shadow-sm resize-none"
                    value={formData.propertyAddress} 
                    onChange={e => {
                      setFormData({...formData, propertyAddress: e.target.value});
                      if (error && error.toLowerCase().includes("address")) setError("");
                    }} 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  type="button"
                  onClick={() => {
                    setError("");
                    setStep(1);
                  }} 
                  className="flex-[0.25] flex items-center justify-center py-4 px-4 border border-white/10 hover:border-[#CA9851]/40 rounded-2xl text-sm font-bold text-gray-300 hover:text-white bg-[#070F1E] transition-all shadow-sm"
                  aria-label="Back to step 1"
                >
                  <ArrowLeft size={18} />
                </button>
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-[#070F1E] bg-gradient-to-r from-[#DFB776] via-[#CA9851] to-[#B3823E] hover:from-[#E9C78C] hover:to-[#DFB776] transition-all shadow-[0_0_25px_rgba(202,152,81,0.35)]"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Modules (Carousel) */}
          {step === 3 && currentFeatureIndex < FEATURES.length && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <button 
                  onClick={() => {
                    if (currentFeatureIndex > 0) setCurrentFeatureIndex(prev => prev - 1);
                    else setStep(2);
                  }} 
                  className="text-sm font-medium text-gray-400 hover:text-[#DFB776] flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <span className="text-xs font-bold text-[#DFB776] bg-[#CA9851]/10 border border-[#CA9851]/30 px-3 py-1 rounded-full">
                  Module {currentFeatureIndex + 1} of {FEATURES.length}
                </span>
              </div>

              {(() => {
                const feature = FEATURES[currentFeatureIndex];
                const isSelected = formData.selectedFeatures.includes(feature.id);
                return (
                  <div className="p-8 border border-[#CA9851]/25 rounded-3xl bg-[#070F1E] shadow-2xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#CA9851]/10 blur-[50px] rounded-full pointer-events-none" />
                    <div className="w-16 h-16 bg-[#CA9851]/15 border border-[#CA9851]/30 text-[#DFB776] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(202,152,81,0.2)]">
                      <Sparkles size={30} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.name}</h3>
                    <p className="text-gray-400 mb-8 leading-relaxed text-sm">{feature.desc}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                      {feature.subFeatures.map(sub => (
                        <span key={sub} className="px-3 py-1.5 bg-white/5 text-gray-300 border border-white/10 text-xs font-medium rounded-xl">
                          {sub}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev, 
                            selectedFeatures: prev.selectedFeatures.filter(id => id !== feature.id)
                          }));
                          setCurrentFeatureIndex(prev => prev + 1);
                        }}
                        className="flex-1 py-4 px-4 rounded-2xl text-sm font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:text-white"
                      >
                        Skip
                      </button>
                      <button 
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev, 
                            selectedFeatures: prev.selectedFeatures.includes(feature.id) 
                               ? prev.selectedFeatures 
                               : [...prev.selectedFeatures, feature.id]
                          }));
                          setCurrentFeatureIndex(prev => prev + 1);
                        }}
                        className="flex-1 py-4 px-4 rounded-2xl text-sm font-bold text-[#070F1E] bg-gradient-to-r from-[#DFB776] via-[#CA9851] to-[#B3823E] hover:from-[#E9C78C] hover:to-[#DFB776] shadow-[0_0_20px_rgba(202,152,81,0.3)] transition-all"
                      >
                        {isSelected ? 'Keep Module' : 'Add Module'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Final Review */}
          {step === 3 && currentFeatureIndex >= FEATURES.length && (
            <div className="space-y-6 animate-in zoom-in-95 duration-500">
               <div className="text-center mb-8">
                 <div className="w-20 h-20 bg-[#CA9851]/15 border border-[#CA9851]/30 text-[#DFB776] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_25px_rgba(202,152,81,0.25)]">
                   <Check size={40} strokeWidth={3} />
                 </div>
                 <h3 className="text-3xl font-extrabold text-white mb-3">You're all set!</h3>
                 <p className="text-gray-400 text-sm">You've selected {formData.selectedFeatures.length} modules for your property.</p>
               </div>

               <div className="bg-[#070F1E] rounded-3xl p-6 border border-white/10 mb-8 min-h-[120px] flex items-center justify-center">
                 <div className="flex flex-wrap gap-2 justify-center">
                   {formData.selectedFeatures.length === 0 ? (
                     <span className="text-sm text-gray-400 font-medium">No additional modules selected. Dashboard and Settings are always included.</span>
                   ) : (
                     formData.selectedFeatures.map(id => {
                       const f = FEATURES.find(x => x.id === id);
                       return f ? (
                         <span key={id} className="px-3 py-1.5 bg-[#CA9851]/15 text-[#DFB776] border border-[#CA9851]/30 text-sm font-semibold rounded-xl">
                           {f.name}
                         </span>
                       ) : null;
                     })
                   )}
                 </div>
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setCurrentFeatureIndex(FEATURES.length - 1)} 
                   className="flex-[0.25] flex items-center justify-center py-4 px-4 border border-white/10 hover:border-[#CA9851]/40 rounded-2xl text-sm font-bold text-gray-300 hover:text-white bg-[#070F1E] transition-all shadow-sm">
                   <ArrowLeft size={18} />
                 </button>
                 <button 
                   onClick={handleSubmit} 
                   disabled={loading} 
                   className="flex-1 flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-sm font-bold text-[#070F1E] bg-gradient-to-r from-[#DFB776] via-[#CA9851] to-[#B3823E] hover:from-[#E9C78C] hover:to-[#DFB776] disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(202,152,81,0.35)]"
                 >
                   {loading ? (
                     <span className="flex items-center gap-2">
                       <svg className="animate-spin h-5 w-5 text-[#070F1E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Creating account...
                     </span>
                   ) : (
                     <>Complete Setup <Check size={18} /></>
                   )}
                 </button>
               </div>
               <p className="text-xs text-center text-gray-500 mt-6 font-medium">
                 By completing setup, you agree to our Terms of Service and Privacy Policy.
               </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
