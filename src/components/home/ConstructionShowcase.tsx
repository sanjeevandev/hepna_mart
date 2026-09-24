import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';
import { Building, Layers, Droplets, Sparkles, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const stages = [
  {
    id: 1,
    number: '01',
    stage: 'Foundation',
    summary: 'Cement • Concrete • Bricks',
    description: 'High-compressive OPC 53 & PPC cement, ready-mix concrete formulations, and kiln-fired red bricks engineered for deep structural stability.',
    items: ['UltraTech OPC 53 Cement', 'ACC Ready Mix Concrete', 'First Class Red Bricks', 'EcoBuild Fly Ash Bricks', 'Birla White Cement'],
    categorySlug: 'cement-concrete',
    image: 'https://images.unsplash.com/photo-1590937195954-5a0410d68622?q=80&w=1000&auto=format&fit=crop',
    icon: Building,
  },
  {
    id: 2,
    number: '02',
    stage: 'Structure',
    summary: 'Blocks • Roofing • Steel',
    description: 'Galvanized metal roofing sheets, engineered steel trusses, precision AAC blocks, and heavy concrete masonry for load-bearing walls.',
    items: ['Tata Galvanized Sheets', 'Jindal Steel Roof Trusses', 'Magicrete AAC Blocks', 'Dr. Fixit Waterproof Membrane', 'BlockTech Solid Blocks'],
    categorySlug: 'roofing',
    image: 'https://images.unsplash.com/photo-1632759145351-1d58253ac564?q=80&w=1000&auto=format&fit=crop',
    icon: Layers,
  },
  {
    id: 3,
    number: '03',
    stage: 'Utilities',
    summary: 'Plumbing • Electrical',
    description: 'High-pressure PVC and CPVC pipes, fire-resistant multi-strand copper cables, circuit protection breakers, and heavy-duty conduits.',
    items: ['Astral PVC Pipes', 'Ashirvad CPVC 1"', 'Havells 2.5mm Wire Coils', 'Legrand Modular Switches', 'Schneider DB Panels'],
    categorySlug: 'plumbing',
    image: 'https://images.unsplash.com/photo-1607472586893-edb57cb3b4e1?q=80&w=1000&auto=format&fit=crop',
    icon: Droplets,
  },
  {
    id: 4,
    number: '04',
    stage: 'Finishing',
    summary: 'Tiles • Paint • Doors & Windows',
    description: 'Vitrified porcelain floor tiles, premium low-VOC architectural coatings, teak veneer wood doors, and smart digital locking hardware.',
    items: ['Kajaria Vitrified Tiles', 'Asian Paints Royale Luxury', 'StoneArt Italian Marble', 'Fenesta Aluminium Windows', 'Yale Digital Locks'],
    categorySlug: 'flooring',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop',
    icon: Sparkles,
  },
  {
    id: 5,
    number: '05',
    stage: 'Tools & Safety',
    summary: 'Construction Tools • Safety Equipment',
    description: 'Industrial impact drills, professional spirit levels, certified fall-protection gear, impact-resistant helmets, and puncture-proof boots.',
    items: ['Bosch 13mm Impact Drill', 'Stanley 24" Spirit Level', 'Karam Certified Safety Helmet', 'Bata Heavy-Duty Safety Shoes', '3M Anti-Dust Goggles'],
    categorySlug: 'tools',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1000&auto=format&fit=crop',
    icon: ShieldCheck,
  },
];

const ConstructionShowcase: React.FC = () => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const currentStage = stages[activeStageIndex];
  const Icon = currentStage.icon;

  const handlePrev = () => {
    setActiveStageIndex((prev) => (prev === 0 ? stages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveStageIndex((prev) => (prev === stages.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-16 md:py-24 bg-[#071D31] text-white relative overflow-hidden">
      {/* Subtle blueprint accent decoration */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #E87A2D 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-12 gap-6">
          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-accent mb-2 block">
              CONSTRUCTION JOURNEY
            </span>
            <ScrollReveal
              baseOpacity={0.15}
              baseRotation={0}
              blurStrength={6}
              as="h2"
              containerClassName="mb-2"
              textClassName="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-heading text-white tracking-tight"
            >
              Build From Foundation to Finish
            </ScrollReveal>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed mt-2">
              Explore handpicked building materials and specialized tools organized by project phase.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label="Previous stage"
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all hover-lift active:scale-95"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next stage"
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all hover-lift active:scale-95"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Timeline Navigation Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 mb-8">
          {stages.map((stage, idx) => {
            const isActive = idx === activeStageIndex;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageIndex(idx)}
                className={`text-left p-3 sm:p-4 rounded-2xl transition-all duration-300 border ${
                  isActive
                    ? 'bg-white/15 border-accent text-white shadow-lg shadow-accent/15'
                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-mono font-bold ${isActive ? 'text-accent' : 'text-gray-400'}`}>
                    {stage.number}
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-accent animate-ping" />}
                </div>
                <div className="text-sm sm:text-base font-bold text-white truncate">
                  {stage.stage}
                </div>
                <div className="text-[11px] text-gray-400 truncate hidden sm:block mt-0.5">
                  {stage.summary}
                </div>
              </button>
            );
          })}
        </div>

        {/* Featured Active Stage Showcase Card (Large Editorial Presentation) */}
        <div className="bg-[#0B2742] rounded-3xl overflow-hidden border border-white/10 shadow-2xl transition-all duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-12">
            
            {/* Left Image Column */}
            <div className="lg:col-span-6 relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-xl relative bg-primary-dark">
                <img
                  src={currentStage.image}
                  alt={currentStage.stage}
                  className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B2742]/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white">
                  <Icon className="w-3.5 h-3.5 text-accent" />
                  <span className="font-semibold">{currentStage.summary}</span>
                </div>
              </div>
            </div>

            {/* Right Information Column */}
            <div className="lg:col-span-6 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-accent text-xs font-bold tracking-widest uppercase mb-3 w-fit">
                STAGE {currentStage.number}
              </div>

              <h3 className="text-3xl sm:text-4xl font-extrabold font-heading text-white mb-3">
                {currentStage.stage}
              </h3>

              <p className="text-base text-gray-300 leading-relaxed mb-6">
                {currentStage.description}
              </p>

              {/* Verified Product Tags */}
              <div className="mb-8">
                <div className="text-xs uppercase font-bold tracking-wider text-gray-400 mb-3">
                  Key Products in this Phase:
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentStage.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-gray-200 border border-white/10 backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Link
                  to={currentStage.categorySlug === 'tools' ? '/tools' : `/category/${currentStage.categorySlug}`}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-7 py-3.5 text-base shadow-xl shadow-accent/25 flex items-center gap-2 hover-lift"
                  >
                    <span>Explore {currentStage.stage} Materials</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

export default ConstructionShowcase;
