'use client';

import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useMotionValue } from 'framer-motion';
import {
  Activity,
  Users,
  Calendar,
  CheckCircle2,
  Menu,
  X,
  Database,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  Zap,
  Layout,
  Lock,
  Network,
  UserPlus,
  Pill,
  FileText,
  Clock,
  Briefcase,
  DollarSign,
  Megaphone,
  Settings
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import LeadFormModal from '../components/LeadFormModal';
import HeroSlideshow from '../components/HeroSlideshow';

// --- Utility Components (Restored Glass Style) ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`backdrop-blur-md bg-white/70 border border-white/60 shadow-lg shadow-blue-900/5 rounded-2xl ${className}`}>
    {children}
  </div>
);

const MagneticButton = ({ children, onClick, className = "" }: { children: React.ReactNode, onClick?: () => void, className?: string }) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const { left, top, width, height } = rect;
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      x.set((e.clientX - centerX) * 0.1);
      y.set((e.clientY - centerY) * 0.1);
    }
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={`${className} cursor-pointer`}
    >
      {children}
    </motion.button>
  );
};

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef });

  // Navbar Transformations (Light Theme Logic)
  const navBackground = useTransform(scrollYProgress, [0, 0.1], ["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"]);
  const navBlur = useTransform(scrollYProgress, [0, 0.1], ["blur(0px)", "blur(12px)"]);
  const logoScale = useTransform(scrollYProgress, [0, 0.1], [1, 0.9]);

  // Text color transformation: White on transparent (video), Dark on white (scrolled)
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    return scrollYProgress.on("change", (latest) => {
      setIsScrolled(latest > 0.05);
    });
  }, [scrollYProgress]);

  return (
    <div ref={scrollRef} className="min-h-screen font-sans text-slate-800 selection:bg-blue-500/30 selection:text-blue-900 overflow-x-hidden relative bg-slate-50">

      {/* Navigation - Sticky & Adaptive */}
      <motion.nav
        style={{ backgroundColor: navBackground, backdropFilter: navBlur }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <motion.div style={{ scale: logoScale }} className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push('/')}>
              <div className="h-10 w-10 relative">
                <img src="/logo.png" alt="CareNex AI Logo" className="object-contain h-full w-full" />
              </div>
              {/* Dynamic Text Color based on scroll */}
              <span className={`text-xl font-bold tracking-tight transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}>
                CareNex<span className="text-blue-500">AI</span>
              </span>
            </motion.div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-1">
              {['Modules', 'Features'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isScrolled ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
                >
                  {item}
                </a>
              ))}
              <button
                onClick={() => setIsLeadModalOpen(true)}
                className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isScrolled ? 'text-slate-600 hover:text-blue-600 hover:bg-slate-100' : 'text-slate-200 hover:text-white hover:bg-white/10'}`}
              >
                Contact
              </button>
            </div>

            {/* CTA */}
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => router.push('/login')}
                className={`cursor-pointer px-4 py-2 text-sm font-semibold transition-colors duration-300 ${isScrolled ? 'text-slate-600 hover:text-blue-600' : 'text-white hover:text-blue-200'}`}
              >
                Login
              </button>
              <MagneticButton
                onClick={() => setIsLeadModalOpen(true)}
                className={`px-5 py-2.5 text-sm font-medium rounded-full transition-colors shadow-lg ${isScrolled ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-blue-900/20' : 'bg-white text-slate-900 hover:bg-blue-50'}`}
              >
                Get Started
              </MagneticButton>
            </div>

            {/* Mobile Toggle */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 transition-colors ${isScrolled ? 'text-slate-600' : 'text-white'}`}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - Video Background with FALLBACK */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden bg-slate-900">
        {/* Video Background */}
        <div className="absolute inset-0 z-0">
          {/* Main Fallback Gradient - Visible if video fails */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 z-0"></div>

          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60 relative z-10"
            poster="/assets/herosection/hero-ai-dashboard.png"
          >
            {/* Updated to use the NEW asset provided by user */}
            <source src="/assets/herosection/hero-background.mp4" type="video/mp4" />
            <source src="/assets/herosection/hero-background.mov" type="video/quicktime" />
          </video>

          {/* Overlay Gradient for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-slate-900/40 to-slate-900/90 z-20"></div>
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 bg-center z-20"></div>
        </div>

        <div className="relative z-30 max-w-7xl mx-auto px-6 lg:px-8 w-full pt-5">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6 text-blue-100"
              >
                <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wider uppercase">AI-Powered Hospital Management</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-5xl font-bold text-[#bb850e] leading-[1.1] mb-6 tracking-tight"
              >
                Modern Healthcare Management<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300"> Reimagined with AI</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-xl text-slate-300 mb-10 max-w-xl leading-relaxed font-light"
              >
                Seamlessly integrate clinical workflows, administrative tasks, and patient engagement into one unified, secure, and intelligent platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <MagneticButton onClick={() => router.push('/login')} className="px-8 py-3.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)]">
                  Access Dashboard
                </MagneticButton>
                <button onClick={() => setIsLeadModalOpen(true)} className="cursor-pointer px-8 py-3.5 bg-transparent border border-slate-600/50 text-slate-300 rounded-full font-semibold hover:bg-slate-800/50 hover:text-white hover:border-slate-500 transition-all flex items-center gap-3 active:scale-95">
                  Contact Support
                </button>
              </motion.div>


            </div>

            {/* Right Column - Hero Slideshow */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="hidden lg:block relative h-[500px]"
            >
              <HeroSlideshow />

              {/* Decorative Elements behind image */}
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -z-10"></div>
            </motion.div>
            {/* Module Capsules */}

          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-20 -mt-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Active Modules", value: "15+", icon: <Layout className="w-5 h-5 mb-2 text-blue-500" /> },
            { label: "Role Types", value: "8+", icon: <Users className="w-5 h-5 mb-2 text-indigo-500" /> },
            { label: "Hospitals", value: "50+", icon: <Building2 className="w-5 h-5 mb-2 text-violet-500" /> },
            { label: "Uptime", value: "99.9%", icon: <Zap className="w-5 h-5 mb-2 text-amber-500" /> },
          ].map((stat, i) => (
            <GlassCard key={i} className="p-6 text-center hover:-translate-y-1 transition-transform duration-300">
              <div className="flex justify-center">{stat.icon}</div>
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* Modules Grid - CATEGORIZED & COMPREHENSIVE */}
      <section id="modules" className="py-24 px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-base text-blue-600 font-bold tracking-wide uppercase mb-2">Platform Capabilities</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Comprehensive Module Suite</h3>
            <p className="text-lg text-slate-600">
              A complete ecosystem covering every aspect of hospital administration, clinical care, staff management, and business growth.
            </p>
          </div>

          <div className="space-y-20">


            {/* Clinical Modules */}
            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-8 border-l-4 border-emerald-600 pl-4">👨‍⚕️ Clinical Suite</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<UserPlus size={32} className="text-emerald-600" />}
                  title="Patient Management"
                  desc="Complete patient registration workflows and detailed profile histories."
                />
                <FeatureCard
                  icon={<Calendar size={32} className="text-teal-600" />}
                  title="Appointments"
                  desc="Smart scheduling and management system for OPD and specialist visits."
                />
                <FeatureCard
                  icon={<Activity size={32} className="text-green-600" />}
                  title="OPD Tracking"
                  desc="Real-time tracking of patient visits, queue status, and outcomes."
                />
                <FeatureCard
                  icon={<Stethoscope size={32} className="text-cyan-600" />}
                  title="Consultations"
                  desc="Digital doctor notes, diagnosis recording, and history tracking."
                />
                <FeatureCard
                  icon={<Pill size={32} className="text-blue-500" />}
                  title="E-Prescriptions"
                  desc="Digital prescription generation with medicine database integration."
                />
                <FeatureCard
                  icon={<FileText size={32} className="text-slate-500" />}
                  title="MLC (Medico-Legal)"
                  desc="Specialized tracking and documentation for Medico-Legal Cases."
                />
              </div>
            </div>

            {/* Staff & HR */}
            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-8 border-l-4 border-violet-600 pl-4">👥 Staff & HR</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<Users size={32} className="text-violet-600" />}
                  title="Staff Profiles"
                  desc="Comprehensive directory for Doctors, Nurses, Accountants, and Receptionists."
                />
                <FeatureCard
                  icon={<Clock size={32} className="text-purple-600" />}
                  title="Shift Management"
                  desc="Automated staff scheduling, rostering, and attendance tracking."
                />
              </div>
            </div>

            {/* Finance & Business */}
            <div>
              <h4 className="text-2xl font-bold text-slate-800 mb-8 border-l-4 border-amber-600 pl-4">💰 Finance & Business</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard
                  icon={<Briefcase size={32} className="text-amber-600" />}
                  title="Referral Network"
                  desc="Track patient referrals from external doctors and partners."
                />
                <FeatureCard
                  icon={<DollarSign size={32} className="text-orange-600" />}
                  title="Referral Payments"
                  desc="Automated commission calculation and payment tracking for referrals."
                />
                <FeatureCard
                  icon={<Megaphone size={32} className="text-red-500" />}
                  title="Marketing"
                  desc="Marketing campaigns and user management for growth initiatives."
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Original 'Why Choose Us' Value Props */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-slate-100">
                {/* Using the logo as the 'product shot' fallback */}
                <div className="aspect-[4/3] flex items-center justify-center">
                  <img src="/logo.png" alt="Platform Preview" className="w-32 h-32 opacity-80" />
                </div>
              </div>
              <div className="absolute -bottom-8 -right-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-xs hidden lg:block">
                <div className="flex items-center gap-4 mb-3">
                  <div className="bg-blue-100 p-3 rounded-full text-blue-600"><CheckCircle2 size={24} /></div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">System Status</p>
                    <p className="text-2xl font-bold text-slate-900">Active</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600">All systems operational across 5 regions.</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">Built for Scale</h2>
              <p className="text-lg text-slate-600 mb-8">
                Designed to handle the complex hierarchy of modern healthcare organizations. From the head office to the remote clinic.
              </p>

              <div className="space-y-6">
                <BenefitRow
                  title="Secure & Compliant"
                  desc="Data architecture designed with security and privacy as the core foundation."
                />
                <BenefitRow
                  title="Real-time Synchronization"
                  desc="Changes in branch settings reflect instantly across the entire network."
                />
                <BenefitRow
                  title="Easy Onboarding"
                  desc="Simple workflows to add new staff members and assign them to departments."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-20">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-6">
                <div className="h-8 w-8 relative opacity-90">
                  <img src="/logo.png" alt="CareNex AI" className="object-contain h-full w-full" />
                </div>
                <span className="text-xl font-bold text-slate-900">CareNex AI</span>
              </div>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed mb-6">
                Empowering healthcare administrators with next-generation management tools.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Admin</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition">Hospitals</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">Branches</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">Users</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-blue-600 transition">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">API Status</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-6">Contact</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li className="flex items-center gap-2"><Phone size={14} /> Support Line</li>
                <li className="flex items-center gap-2"><Mail size={14} /> admin@carenex.ai</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-8 flex justify-between items-center text-sm text-slate-500">
            <p>© 2026 CareNex AI.</p>
          </div>
        </div>
        <LeadFormModal isOpen={isLeadModalOpen} onClose={() => setIsLeadModalOpen(false)} />
      </footer>
    </div>
  );
}

// --- Sub Components ---

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
      <div className="mb-6 p-4 bg-slate-50 rounded-xl w-fit group-hover:bg-blue-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function BenefitRow({ title, desc }: { title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="mt-1">
        <CheckCircle2 className="text-blue-600 w-6 h-6" />
      </div>
      <div>
        <h4 className="font-bold text-slate-900 text-lg">{title}</h4>
        <p className="text-slate-600 text-sm mt-1">{desc}</p>
      </div>
    </div>
  )
}
