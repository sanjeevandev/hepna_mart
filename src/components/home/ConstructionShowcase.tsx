import React from 'react';
import { Link } from 'react-router-dom';
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Layers, Building, Droplets, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

const stages = [
  {
    id: 1,
    stage: 'Stage 01',
    title: 'Foundation',
    description: 'UltraTech OPC 53 Grade Cement, Ready Mix Concrete, and Red Bricks for deep structural strength.',
    items: ['OPC 53 Cement', 'Ready Mix Concrete', 'First Class Red Bricks', 'Fly Ash Bricks'],
    categorySlug: 'cement-concrete',
    icon: Building,
    bgClass: 'bg-[#0F2440]',
    accentColor: 'text-accent',
    borderClass: 'border-accent/30',
  },
  {
    id: 2,
    stage: 'Stage 02',
    title: 'Structure & Roofing',
    description: 'Galvanized Metal Roofing Sheets, Steel Roof Trusses, AAC Blocks and high-load hollow blocks.',
    items: ['Tata Metal Sheets', 'Jindal Steel Trusses', 'Magicrete AAC Blocks', 'Waterproof Membrane'],
    categorySlug: 'roofing',
    icon: Layers,
    bgClass: 'bg-[#162E4A]',
    accentColor: 'text-amber-400',
    borderClass: 'border-amber-400/30',
  },
  {
    id: 3,
    stage: 'Stage 03',
    title: 'Utilities & MEP',
    description: 'Heavy duty Astral PVC pipes, CPVC fittings, Havells 2.5mm fire-resistant wires, and Legrand switches.',
    items: ['Astral PVC Pipes', 'Ashirvad CPVC', 'Havells 2.5mm Wires', 'Schneider Panels'],
    categorySlug: 'plumbing',
    icon: Droplets,
    bgClass: 'bg-[#102337]',
    accentColor: 'text-sky-400',
    borderClass: 'border-sky-400/30',
  },
  {
    id: 4,
    stage: 'Stage 04',
    title: 'Finishing & Interiors',
    description: 'Kajaria Vitrified Tiles, Asian Paints Royale Interior, Teak Wood Panel Doors, and Yale Digital Locks.',
    items: ['Kajaria Vitrified Tiles', 'Asian Paints Royale', 'Teak Wood Doors', 'Yale Digital Locks'],
    categorySlug: 'flooring',
    icon: Sparkles,
    bgClass: 'bg-[#1A365D]',
    accentColor: 'text-accent-light',
    borderClass: 'border-accent-light/30',
  },
  {
    id: 5,
    stage: 'Stage 05',
    title: 'Tools & Site Safety',
    description: 'Bosch Impact Drills, Stanley Claw Hammers, Taparia Spirit Levels, and Karam certified safety helmets.',
    items: ['Bosch Impact Drill', 'Stanley Measuring Tape', 'Karam Safety Helmets', 'Bata Safety Shoes'],
    categorySlug: 'tools',
    icon: ShieldCheck,
    bgClass: 'bg-[#1B3A5C]',
    accentColor: 'text-accent',
    borderClass: 'border-accent/40',
  },
];

const ConstructionShowcase: React.FC = () => {
  return (
    <section className="container-custom py-12 md:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-block px-3.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent font-semibold text-xs tracking-wider uppercase mb-3">
          Construction Journey
        </div>
        <ScrollReveal
          baseOpacity={0.15}
          baseRotation={2}
          blurStrength={6}
          containerClassName="mb-3"
          textClassName="text-3xl md:text-4xl font-heading font-bold text-primary"
        >
          Build From Foundation to Finish
        </ScrollReveal>
        <p className="text-gray-600 text-base md:text-lg">
          Discover handpicked materials and tools matched to every phase of your construction project.
        </p>
      </div>

      <div className="h-[480px] md:h-[520px] rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-surface-dark relative">
        <ScrollStack
          itemDistance={75}
          itemScale={0.03}
          itemStackDistance={24}
          stackPosition="15%"
          scaleEndPosition="8%"
          baseScale={0.88}
          useWindowScroll={false}
          className="h-full"
        >
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <ScrollStackItem
                key={stage.id}
                itemClassName={`${stage.bgClass} text-white border ${stage.borderClass} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm">
                        <Icon className={`w-5 h-5 ${stage.accentColor}`} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${stage.accentColor}`}>
                        {stage.stage}
                      </span>
                    </div>
                    <Link
                      to={stage.categorySlug === 'tools' ? '/tools' : `/category/${stage.categorySlug}`}
                      className="text-xs sm:text-sm font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-colors group"
                    >
                      <span>Explore Products</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-2">
                    {stage.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                  {stage.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-3 py-1 rounded-full bg-white/10 text-gray-200 border border-white/10 backdrop-blur-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </ScrollStackItem>
            );
          })}
        </ScrollStack>
      </div>
    </section>
  );
};

export default ConstructionShowcase;
