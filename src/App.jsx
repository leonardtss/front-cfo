import { useState, useEffect } from 'react';
import { TweaksCtx, TWEAK_DEFAULTS } from './context';
import { TDark } from './tokens';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Problem from './components/Problem';
import Pillars from './components/Pillars';
import AISection from './components/AISection';
import AssetClasses from './components/AssetClasses';
import Advisors from './components/Advisors';
import Privacy from './components/Privacy';
import WhoItsFor from './components/WhoItsFor';
import FAQ from './components/FAQ';
import AccessForm from './components/AccessForm';
import Footer from './components/Footer';

export default function App() {
  const [tweaks] = useState(TWEAK_DEFAULTS);

  // Landing page is always dark regardless of user theme preference
  useEffect(() => {
    document.body.style.background = TDark.bg0;
    document.body.style.color = TDark.fg0;
    return () => {
      document.body.style.background = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <TweaksCtx.Provider value={tweaks}>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Pillars />
        <AISection />
        <AssetClasses />
        <Advisors />
        <Privacy />
        <WhoItsFor />
        <FAQ />
        <AccessForm />
      </main>
      <Footer />
    </TweaksCtx.Provider>
  );
}
