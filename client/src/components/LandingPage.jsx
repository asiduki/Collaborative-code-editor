import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = ["home", "features", "docs"];
const languageLogos = ["javascript", "python", "java", "cpp", "html"];
const features = [
  { title: "Real-Time Collaboration", desc: "Code side-by-side with your team and watch live updates.", iconPath: "M12 20l9-7-9-7-9 7 9 7z" },
  { title: "Syntax Highlighting", desc: "Beautiful, language-specific highlighting for clean readability.", iconPath: "M10 20l4-16m4 16l4-16M1 12h22" },
  { title: "Customizable Themes", desc: "Choose your favorite theme — dark, light, or anything in between.", iconPath: "M12 3v1m0 16v1m8-8h1M3 12H2m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.02 0l-.707.707M6.343 6.343l-.707-.707" },
  { title: "Session Persistence", desc: "Never lose your work—resume where you left off anytime.", iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const fadeIn = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};
const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.2, duration: 0.5, ease: "easeOut" } }),
};

function LandingPage() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 text-gray-200 font-sans">
      
      <motion.header variants={fadeIn} initial="hidden" animate="visible" className="fixed top-0 w-full bg-slate-900/70 backdrop-blur-lg z-50 shadow-lg">
        <nav className="max-w-7xl mx-auto flex justify-between items-center p-5">
          <div className="flex items-center space-x-3 cursor-pointer select-none">
            <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center text-white font-extrabold text-xl shadow-blue-500/50 shadow-md">
              DN
            </div>
            <span className="text-2xl font-bold tracking-wide text-white">DevNest</span>
          </div>
          <ul className="hidden md:flex space-x-10 text-lg tracking-wide">
            {navLinks.map((item) => (
              <li key={item}>
                <a href={`#${item}`} className="hover:text-blue-400 transition-colors duration-300 capitalize">
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/login" className="hidden md:block">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-semibold shadow-lg hover:shadow-blue-500/40 transition-all duration-300">
              Login / Register
            </button>
          </Link>
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)} className="text-white focus:outline-none">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"} /></svg>
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-slate-800/80">
              <ul className="flex flex-col items-center space-y-6 py-8">
                {navLinks.map((item) => (
                  <li key={item}>
                    <a href={`#${item}`} onClick={() => setMobileMenuOpen(false)} className="text-xl hover:text-blue-400 transition-colors duration-300 capitalize">
                      {item}
                    </a>
                  </li>
                ))}
                <li>
                  <Link to="/login">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold shadow-lg transition-colors duration-300">
                      Login / Register
                    </button>
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <main id="home" className="pt-40 pb-32 flex flex-col items-center text-center px-5 max-w-4xl mx-auto">
        <motion.h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }}>
          Code Together, <br /> Create Forever.
        </motion.h1>
        <motion.p className="text-xl md:text-2xl mb-8 text-gray-400 max-w-2xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          Experience seamless, lightning-fast, real-time collaboration with DevNest — your ultimate online code editor.
        </motion.p>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
          <Link to="/login" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:shadow-blue-500/40 transition-all duration-300 transform hover:scale-105">
            Get Started
          </Link>
        </motion.div>
        
        <div className="flex flex-wrap justify-center gap-6 mt-16">
          {languageLogos.map((lang, i) => (
            <motion.div key={lang} className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300 cursor-pointer" title={lang.charAt(0).toUpperCase() + lang.slice(1)} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.1 }}>
              <img src={`/logos/${lang}.png`} alt={`${lang} logo`} className="w-10 h-10" draggable={false} />
            </motion.div>
          ))}
        </div>
      </main>

      <section id="features" className="bg-slate-900/50 py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-14 tracking-wider text-blue-400 drop-shadow-lg">
            Core Features
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <motion.div custom={i} variants={cardVariant} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} key={feature.title} className="bg-slate-800/60 rounded-2xl p-8 shadow-lg hover:shadow-blue-500/20 transition-all duration-300 cursor-default border border-slate-700">
                <svg className="w-12 h-12 text-blue-400 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={feature.iconPath} />
                </svg>
                <h3 className="text-2xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
        <br />
        <br />
      </section>

      <footer className="w-full text-center py-8 bg-slate-900/80 text-gray-400">
        <p>&copy; {new Date().getFullYear()} DevNest. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;