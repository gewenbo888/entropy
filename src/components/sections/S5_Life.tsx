"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Quote, Para } from "../atoms";
import LifeField from "../LifeField";
import Reveal from "../Reveal";

const CARDS = [
  {
    num: "01", accent: "electric" as const,
    enTitle: "Negentropy", zhTitle: "负熵",
    enBody: "Schrödinger's word for the order that life imports. An organism does not violate the Second Law — it pays for its internal order by dumping greater disorder into its surroundings. Life is a leak in entropy's dam, never a breach.",
    zhBody: "薛定谔为「生命所输入的秩序」造的词。生命体并不违背第二定律——它以向周遭倾倒更大的无序，来支付自身内部的有序。生命是熵之坝上的一处渗漏，而非决口。",
  },
  {
    num: "02", accent: "plasma" as const,
    enTitle: "Self-Organization", zhTitle: "自组织",
    enBody: "Far from equilibrium, energy flowing through matter can spontaneously birth structure — Bénard cells, hurricanes, metabolisms. Prigogine called them dissipative structures: islands of order that exist precisely because they accelerate the universe's overall decay.",
    zhBody: "在远离平衡之处，流经物质的能量能自发地孕育结构——贝纳尔涡胞、飓风、新陈代谢。普里高津称之为耗散结构：之所以存在，恰恰是因为它们加速了宇宙整体的衰败。",
  },
  {
    num: "03", accent: "gold" as const,
    enTitle: "Evolution", zhTitle: "演化",
    enBody: "Natural selection is a ratchet that locks in improbable order. Across four billion years it has built eyes, wings, and minds — each a structure so unlikely that only the relentless filtering of death could assemble it from chance.",
    zhBody: "自然选择是一个棘轮，把不大可能的秩序锁定下来。在四十亿年间，它构建了眼睛、翅膀与心智——每一样都如此不可思议，唯有死亡那无情的筛选，才能从偶然中将其组装而成。",
  },
  {
    num: "04", accent: "ember" as const,
    enTitle: "Consciousness", zhTitle: "意识",
    enBody: "A brain is the densest island of order we know — a hundred billion neurons modeling the very cosmos that is decaying around them. Awareness may be matter's most extravagant act of resistance: the universe, briefly, watching itself fall.",
    zhBody: "大脑是我们所知最致密的有序之岛——千亿神经元，正建模着那个在它们周围衰败的宇宙。意识，或许是物质最奢侈的反抗：宇宙短暂地，注视着自己的坠落。",
  },
];

export default function S5_Life() {
  return (
    <SectionShell
      id="life"
      index="§ 05"
      kicker="The Rebellion"
      kickerZh="反抗"
      headline="Life is a local, temporary, magnificent rebellion against decay."
      headlineZh="生命，是对衰败的一场局部的、短暂的、壮丽的反抗。"
      accent="electric"
      reveal="Consciousness may be the universe temporarily resisting its own collapse."
      revealZh="意识，或许正是宇宙暂时抵抗自身坍塌的方式。"
    >
      <Lede
        en="Against a cosmos sliding toward uniformity, life does something audacious: it concentrates order. A seed, a cell, a city, a mind — each gathers scattered energy and weaves it into improbable structure. It seems to defy the Second Law. It does not. Life is the universe's way of running downhill faster, building cathedrals of order on the slope of its own dissolution."
        zh="面对一个滑向均质的宇宙，生命做了一件大胆的事：它聚集秩序。一粒种子、一个细胞、一座城市、一颗心灵——每一个都收集散落的能量，将其编织成不大可能的结构。它看似违抗第二定律，实则不然。生命，是宇宙更快地奔下山坡的方式，在自身消融的斜坡上，建造起一座座秩序的殿堂。"
      />

      <Reveal className="mt-16">
        <div className="glass rounded-xl halo overflow-hidden">
          <div className="relative h-[420px] md:h-[520px]">
            <LifeField />
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-8 bg-gradient-to-t from-void/90 to-transparent pointer-events-none">
              <div className="eyebrow mb-1">— Self-organization · 自组织</div>
              <p className="font-serif text-lg md:text-xl text-bone/85 max-w-2xl">
                Scattered nodes are drawn together, bind into a living network, and begin to fire — order condensing out of noise.
              </p>
              <p className="font-han text-sm md:text-base text-boneDim mt-1 max-w-2xl">
                散落的节点被牵引、聚合，结成一张活的网络，开始放电——秩序，从噪声中凝结而出。
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((c) => (
            <Card key={c.num} {...c} />
          ))}
        </div>
      </div>

      <div className="mt-20 max-w-4xl">
        <Quote
          accent="electric"
          en="What an organism feeds upon is negative entropy. The essential thing in metabolism is that the organism succeeds in freeing itself from all the entropy it cannot help producing while alive."
          zh="生命体所赖以为生的，是负熵。新陈代谢的本质，在于生命体得以摆脱它在存活时不得不产生的全部熵。"
          cite="Erwin Schrödinger, What Is Life? (1944)"
          citeZh="埃尔温·薛定谔《生命是什么》（1944）"
        />
      </div>

      <Reveal className="mt-12">
        <div className="max-w-4xl">
          <Para
            en="And here is the vertigo: the atoms of your body were forged in dying stars. The carbon in your cells, the iron in your blood, were assembled in stellar furnaces and scattered by supernovae. You are, quite literally, entropy's debris reorganized into something that can ask what entropy is. The decay of stars wrote the alphabet of life."
            zh="而眩晕之处正在于此：构成你身体的原子，是在垂死的恒星中锻造的。你细胞里的碳、血液里的铁，都在恒星的熔炉中被组装，又被超新星抛撒。你，确确实实，是被重新组织起来的熵的残骸——组织成了一种能够追问「熵是什么」的存在。恒星的衰亡，写下了生命的字母表。"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
