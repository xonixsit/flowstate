import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Compass, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { pathTemplates } from '../utils/pathTemplates';

const soundModes = [
  {
    id: 'focus',
    name: 'Focus',
    frequency: '40Hz (Gamma)',
    description: 'Best for problem-solving, high-level cognition, and intense mental processing.',
    color: 'from-blue-500/20 to-indigo-500/20 border-indigo-500/40 text-indigo-400'
  },
  {
    id: 'break',
    name: 'Break',
    frequency: '10Hz (Alpha)',
    description: 'Promotes light relaxation, stress reduction, and optimal creative thinking.',
    color: 'from-emerald-500/20 to-teal-500/20 border-teal-500/40 text-teal-400'
  },
  {
    id: 'meditate',
    name: 'Meditate',
    frequency: '6Hz (Theta)',
    description: 'Triggers deep meditation, memory retrieval, and dream-like states.',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400'
  },
  {
    id: 'detox',
    name: 'Detox',
    frequency: '2.5Hz (Delta)',
    description: 'Assists with deep restorative sleep, healing, and absolute relaxation.',
    color: 'from-rose-500/20 to-orange-500/20 border-rose-500/40 text-rose-400'
  },
  {
    id: 'awaken',
    name: 'Awaken',
    frequency: '15Hz (Beta)',
    description: 'Increases alert awareness, active brainstorming, and physical energy.',
    color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-400'
  }
];

const steps = [
  { id: 1, title: "Welcome" },
  { id: 2, title: "Profile" },
  { id: 3, title: "First Path" },
  { id: 4, title: "Launch" }
];

export default function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pathName, setPathName] = useState('My Daily Flow');
  const [selectedMode, setSelectedMode] = useState('focus');
  const [duration, setDuration] = useState(15);
  const [errors, setErrors] = useState({});

  // Animations configuration
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        x: { duration: 0.2 },
        opacity: { duration: 0.2 }
      }
    })
  };

  const handleNext = () => {
    if (currentStep === 2) {
      // Step 2 validations
      const newErrors = {};
      if (!username.trim()) newErrors.username = "Username is required";
      if (!email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    }

    if (currentStep === 3) {
      // Step 3 validations
      const newErrors = {};
      if (!pathName.trim()) newErrors.pathName = "Path name is required";
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
      
      // Step 4: Loading & launching
      setCurrentStep(4);
      setTimeout(() => {
        onComplete(username, email, pathName, selectedMode, duration);
      }, 2000);
      return;
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const applyTemplate = (template) => {
    setPathName(template.name);
    setSelectedMode(template.mode);
    setDuration(template.duration);
    setErrors(prev => ({ ...prev, pathName: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md overflow-y-auto px-4 py-8">
      {/* Background Animated Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[30%] -left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute -bottom-[30%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="relative z-10 w-full max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl flex flex-col justify-between"
        style={{ minHeight: '520px' }}
      >
        {/* Header and Steps */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              FlowState
            </h1>
            <div className="flex space-x-1.5">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={`h-1.5 w-6 rounded-full transition-all duration-300 ${
                    s.id === currentStep
                      ? 'bg-indigo-500 w-8'
                      : s.id < currentStep
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content Slides */}
        <div className="flex-grow flex items-center justify-center mb-8 overflow-visible relative">
          <AnimatePresence mode="wait" custom={currentStep}>
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full text-center space-y-4"
              >
                <div className="flex justify-center mb-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
                    className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full"
                  >
                    <Compass className="w-12 h-12 text-indigo-400" />
                  </motion.div>
                </div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Welcome to Your <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Flow State</span>
                </h2>
                <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed">
                  Unlock high-performance cognition, creative surges, and deep rest through advanced binaural beats and structured Kaizen habit loops.
                </p>
                <div className="pt-2 text-xs text-slate-500 italic">
                  Powered by SQLite Native Storage for ultimate data reliability.
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full space-y-5"
              >
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold text-white">Create Your Profile</h2>
                  <p className="text-slate-400 text-xs mt-1">Set up your local offline profile to sync your stats and progress.</p>
                </div>

                <div className="space-y-4">
                  {/* Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <User className="w-3.5 h-3.5 mr-1 text-indigo-400" /> Display Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Alex Mercer"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={`w-full bg-slate-950/50 border ${
                          errors.username ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500'
                        } rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none transition-all`}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-red-400 text-xs mt-0.5">{errors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="e.g. alex@flowstate.app"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full bg-slate-950/50 border ${
                          errors.email ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-emerald-500'
                        } rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none transition-all`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-0.5">{errors.email}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full space-y-4"
              >
                <div className="text-center mb-1">
                  <h2 className="text-xl font-bold text-white">Define Your Training Path</h2>
                  <p className="text-slate-400 text-xs mt-0.5">Let's create your first focused training habit target.</p>
                </div>

                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {/* Path Templates */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Start From A Template
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pathTemplates.map((template) => {
                        const isSelected = pathName === template.name && selectedMode === template.mode && duration === template.duration;
                        return (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => applyTemplate(template)}
                            className={`text-left border rounded-xl p-3 transition-all ${
                              isSelected
                                ? 'bg-indigo-500/15 border-indigo-400/60 text-white shadow-md'
                                : 'bg-slate-950/25 border-slate-800/80 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex justify-between gap-2">
                              <span className="text-xs font-extrabold">{template.name}</span>
                              <span className="text-[10px] font-bold text-slate-400">{template.duration}m</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                              {template.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Path Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      Path Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Work Focus, Morning Meditate"
                      value={pathName}
                      onChange={(e) => setPathName(e.target.value)}
                      className={`w-full bg-slate-950/40 border ${
                        errors.pathName ? 'border-red-500/50 focus:border-red-500' : 'border-slate-800 focus:border-indigo-500/80'
                      } rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none transition-all`}
                    />
                  </div>

                  {/* Mode Card Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Initial Sound Mode & Binaural Frequency
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {soundModes.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => setSelectedMode(m.id)}
                          className={`cursor-pointer border rounded-xl p-3 flex justify-between items-center transition-all bg-gradient-to-br ${
                            selectedMode === m.id
                              ? `${m.color} scale-[1.01] shadow-md`
                              : 'bg-slate-950/20 border-slate-900 hover:border-slate-800 text-slate-500'
                          }`}
                        >
                          <div className="text-left">
                            <span className={`text-xs font-bold ${selectedMode === m.id ? 'text-white' : 'text-slate-300'}`}>
                              {m.name}
                            </span>
                            <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-950/60 rounded text-slate-400">
                              {m.frequency}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed max-w-xs md:max-w-sm">
                              {m.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Goal Duration Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-emerald-400" /> Daily Target Goal
                      </label>
                      <span className="text-xs font-extrabold text-white bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800">
                        {duration} Minutes
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="120"
                      step="5"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-950/60 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                custom={1}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full text-center space-y-5"
              >
                <div className="flex justify-center mb-2">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full"
                  >
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                  </motion.div>
                </div>
                <h2 className="text-2xl font-bold text-white">Initializing SQLite Engine</h2>
                <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                  Setting up native tables, applying key-value configurations, and preparing your binaural sound banks.
                </p>
                {/* Loader */}
                <div className="w-48 h-1.5 bg-slate-950/80 rounded-full mx-auto overflow-hidden">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                    className="w-1/2 h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-900">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-800 transition-all ${
                currentStep === 1
                  ? 'text-slate-600 border-slate-900 pointer-events-none opacity-50'
                  : 'text-slate-300 hover:bg-slate-800/40 hover:text-white'
              }`}
            >
              Back
            </button>

            <button
              onClick={handleNext}
              className="group flex items-center space-x-1.5 text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all"
            >
              <span>{currentStep === 3 ? "Complete" : "Continue"}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
