import { LangProvider } from "@/components/LangContext";
import CosmicCanvas from "@/components/CosmicCanvas";
import Loader from "@/components/Loader";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import S2 from "@/components/sections/S2_WhatIs";
import S3 from "@/components/sections/S3_Time";
import S4 from "@/components/sections/S4_Information";
import S5 from "@/components/sections/S5_Life";
import S6 from "@/components/sections/S6_BlackHole";
import S7 from "@/components/sections/S7_AI";
import S8 from "@/components/sections/S8_HeatDeath";
import Final from "@/components/Final";

export default function Page() {
  return (
    <LangProvider>
      <Loader />
      <CosmicCanvas />
      {/* contrast vignette: lifts text off the bright particle band without dulling the cosmos */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -5,
          background:
            "radial-gradient(125% 85% at 50% 50%, transparent 28%, rgba(3,3,10,0.5) 100%), linear-gradient(180deg, rgba(3,3,10,0.32), transparent 16%, transparent 84%, rgba(3,3,10,0.45))",
        }}
      />
      <Nav />
      <main className="relative text-bone overflow-x-hidden">
        <Hero />
        <S2 />
        <S3 />
        <S4 />
        <S5 />
        <S6 />
        <S7 />
        <S8 />
        <Final />
      </main>
    </LangProvider>
  );
}
