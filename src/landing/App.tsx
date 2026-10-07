import { useCallback, useState } from "react";
import type { Plano } from "../shared/leads";
import { Contact } from "./components/Contact";
import { Faq } from "./components/Faq";
import { Footer, WhatsAppFloat } from "./components/Footer";
import { Hero } from "./components/Hero";
import type { PlanPrefill } from "./components/LeadForm";
import { Navbar } from "./components/Navbar";
import { Offer } from "./components/Offer";
import { Portfolio } from "./components/Portfolio";
import { Process } from "./components/Process";
import { Services } from "./components/Services";

export function App() {
  const [prefill, setPrefill] = useState<PlanPrefill | null>(null);
  const choosePlan = useCallback((plano: Plano) => setPrefill((p) => ({ plano, seq: (p?.seq ?? 0) + 1 })), []);

  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" className="stack">
        <Hero />
        <Services onChoosePlan={choosePlan} />
        <Offer onChoosePlan={choosePlan} />
        <Process />
        <Portfolio />
        <Faq />
        <Contact prefill={prefill} />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
