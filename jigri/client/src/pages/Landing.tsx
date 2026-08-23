import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, BookOpen, Zap, Globe, Lock, Terminal } from 'lucide-react';
import { languages, getLanguageGroups } from '../lib/languageRegistry';

const features = [
  {
    icon: <Terminal className="w-6 h-6 text-indigo-400" />,
    title: 'Online Compiler',
    desc: 'Write, compile and run code directly in the browser. No installation. No setup. Just code.',
  },
  {
    icon: <BookOpen className="w-6 h-6 text-purple-400" />,
    title: 'Python Notebook',
    desc: 'A Colab-inspired notebook environment with persistent runtime, variable state, and rich output.',
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: 'Instant Execution',
    desc: 'Code runs in isolated Docker containers on remote servers. Results delivered in seconds.',
  },
  {
    icon: <Lock className="w-6 h-6 text-green-400" />,
    title: 'Secure Sandboxing',
    desc: 'Every execution is fully isolated with memory, CPU, and network restrictions enforced.',
  },
  {
    icon: <Globe className="w-6 h-6 text-blue-400" />,
    title: 'Web Preview',
    desc: 'HTML/CSS/JS renders live in a sandboxed preview iframe. Markdown renders beautifully.',
  },
  {
    icon: <Code2 className="w-6 h-6 text-rose-400" />,
    title: 'Monaco Editor',
    desc: 'Syntax highlighting, intellisense, bracket matching, and code folding — powered by VS Code.',
  },
];

const steps = [
  { step: '01', title: 'Choose a Language', desc: 'Pick from 12+ languages including Python, C++, Java, Go, Rust, Ruby and more.' },
  { step: '02', title: 'Write Your Code', desc: 'Use the Monaco editor with syntax highlighting, auto-complete and bracket matching.' },
  { step: '03', title: 'Click Run', desc: 'Your code is sent to a remote Docker container, executed securely, and results appear instantly.' },
];

const groups = getLanguageGroups();

export default function Landing() {
  return (
    <div className="min-h-full overflow-y-auto bg-dark-bg text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-100 text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5 text-brand-500" />
            Cloud-powered code execution. No install required.
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-tight mb-6">
            Code Online.{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              No Setup Required.
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            JIGRI is a cloud-based online compiler, interpreter, and Python notebook
            platform. Write and run code in 12+ languages directly from your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compiler"
              className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40"
            >
              <Terminal className="w-5 h-5" />
              Open Compiler
            </Link>
            <Link
              to="/notebook"
              className="inline-flex items-center gap-2 bg-dark-card hover:bg-dark-hover border border-dark-border text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-all"
            >
              <BookOpen className="w-5 h-5" />
              Open Python Notebook
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Everything you need to code</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            A complete cloud development environment that runs in your browser.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-brand-500/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-dark-hover flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-dark-card/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="text-5xl font-black text-brand-500/20 mb-4">{s.step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Languages */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Supported Languages</h2>
          <p className="text-gray-400 text-center mb-12">
            {languages.length} languages available with more being added regularly.
          </p>
          <div className="space-y-8">
            {Object.entries(groups).map(([group, langs]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-4">
                  {group}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {langs.map((lang) => (
                    <Link
                      key={lang.id}
                      to={`/compiler?lang=${lang.id}`}
                      className="flex items-center gap-2 bg-dark-card border border-dark-border hover:border-brand-500/40 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-all"
                    >
                      <span>{lang.emoji}</span>
                      <span>{lang.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Start coding now</h2>
          <p className="text-gray-400 mb-8">
            No account required. Open the compiler and start writing code immediately.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/compiler"
              className="bg-brand-500 hover:bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold transition-all"
            >
              Start Coding →
            </Link>
            <Link
              to="/notebook"
              className="bg-dark-card border border-dark-border hover:bg-dark-hover text-white px-8 py-3 rounded-xl font-semibold transition-all"
            >
              Open Notebook
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-dark-border py-8 text-center text-gray-600 text-sm">
        JIGRI — Cloud Compiler & Python Notebook Platform
      </footer>
    </div>
  );
}