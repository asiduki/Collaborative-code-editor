import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const fadeIn = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.2, duration: 0.6 },
  }),
};

function LandingPage() {
  return (
    <div className="w-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-gray-100 font-sans">
      {/* Navbar */}
      <motion.header
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        className="fixed top-0 w-full bg-black bg-opacity-40 backdrop-blur-md z-50 shadow-lg"
      >
        <nav className="max-w-7xl mx-auto flex justify-between items-center p-5">
          <div className="flex items-center space-x-3 cursor-pointer select-none">
            <div className="bg-pink-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-extrabold text-xl">
              DN
            </div>
            <span className="text-2xl font-bold tracking-wide">DevNest</span>
          </div>
          <ul className="hidden md:flex space-x-10 text-lg tracking-wide">
            {["home", "features", "docs"].map((item) => (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className="hover:text-pink-400 transition-colors duration-300 capitalize"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
          <Link to="/login">
            <button className="bg-pink-500 hover:bg-pink-600 px-5 py-2 rounded-full font-semibold shadow-lg transition-colors duration-300">
              Login / Register
            </button>
          </Link>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <main
        id="home"
        className="pt-32 pb-32 flex flex-col items-center text-center px-5 max-w-4xl mx-auto"
      >
        <motion.h1
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          Code Together,
          <br />
          Create Forever.
        </motion.h1>
        <motion.p
          className="text-xl md:text-2xl mb-8 text-pink-300 max-w-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Experience seamless, lightning-fast, real-time collaboration with
          DevNest — your ultimate online code editor.
        </motion.p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            to="/login"
            className="inline-block bg-pink-500 hover:bg-pink-600 px-8 py-3 rounded-full font-semibold text-lg shadow-lg transition-colors duration-300"
          >
            Get Started
          </Link>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 mt-14">
          {["javascript", "python", "java", "cpp", "html"].map((lang, i) => (
            <motion.div
              key={lang}
              className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300 cursor-pointer"
              title={lang.charAt(0).toUpperCase() + lang.slice(1)}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <img
                src={`/logos/${lang}.png`}
                alt={lang}
                className="w-10 h-10"
                draggable={false}
              />
            </motion.div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section
        id="features"
        className="mt-20 mb-20 bg-gradient-to-tr from-black/70 via-purple-900/90 to-pink-900/80 py-20 px-5 rounded-t-3xl shadow-2xl max-w-6xl mx-auto"
      >
        <h2 className="text-4xl font-extrabold text-center mb-14 tracking-widest text-pink-400 drop-shadow-lg">
          Features
        </h2>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Real-Time Collaboration",
              desc: "Code side-by-side with your team and watch live updates.",
              iconPath:
                "M12 20l9-7-9-7-9 7 9 7z",
            },
            {
              title: "Syntax Highlighting",
              desc: "Beautiful, language-specific highlighting for clean readability.",
              iconPath:
                "M12 6v6l4 2 M12 12a10 10 0 1 1 0-0.1z",
            },
            {
              title: "Customizable Themes",
              desc: "Choose your favorite theme — dark, light, or anything in between.",
              iconPath:
                "M12 3v1m0 16v1m8-8h1M3 12H2m15.364-6.364l.707.707M6.343 17.657l-.707.707m12.02 0l-.707.707M6.343 6.343l-.707-.707",
            },
            {
              title: "Session Persistence",
              desc: "Never lose your work—resume where you left off anytime.",
              iconPath:
                "M12 8v4l3 3 M12 12a10 10 0 1 1 0-0.1z",
            },
          ].map(({ title, desc, iconPath }, i) => (
            <motion.div
              custom={i}
              variants={cardVariant}
              initial="hidden"
              animate="visible"
              key={title}
              className="bg-gradient-to-br from-purple-900 to-pink-800 rounded-3xl p-8 shadow-xl hover:scale-[1.03] transition-transform duration-300 cursor-default"
            >
              <svg
                className="w-12 h-12 text-pink-400 mb-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={iconPath}
                />
              </svg>
              <h3 className="text-2xl font-semibold mb-3">{title}</h3>
              <p className="text-pink-200">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-screen relative py-2 bg-gradient-to-tr from-black to-purple-900 text-pink-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 px-6 pb-10">
          <div>
            <h3 className="font-bold text-xl mb-3">About DevNest</h3>
            <p className="text-sm opacity-80">
              We are redefining how developers collaborate by providing a
              powerful, easy-to-use, and visually stunning coding environment.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-3">Privacy Policy</h3>
            <p className="text-sm opacity-80">
              Your data is safe with us. We never share or sell your personal
              info.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-3">Terms of Service</h3>
            <p className="text-sm opacity-80">
              Please read and understand our terms to use DevNest responsibly.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-xl mb-3">Follow Us</h3>
            <div className="flex space-x-5 mt-3">
              {["facebook", "twitter", "linkedin"].map((platform) => (
                <a
                  key={platform}
                  href={`https://www.${platform}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-400 transition-colors duration-300"
                >
                  <img
                    src={`/logos/${platform}.png`}
                    alt={platform}
                    className="w-7 h-7"
                    draggable={false}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
