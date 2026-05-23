"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Para } from "../atoms";
import { useLang } from "../LangContext";
import HeatDeathField from "../HeatDeathField";
import Reveal from "../Reveal";

const ERAS = [
  {
    num: "10¹⁴ yr", accent: "ember" as const,
    enTitle: "The Degenerate Era", zhTitle: "简并纪元",
    enBody: "The last stars exhaust their fuel. No new stars form. The cosmos is lit only by the fading embers of white dwarfs and the cold glow of neutron stars. Galaxies dim from gold to red to black.",
    zhBody: "最后的恒星耗尽燃料。不再有新星诞生。宇宙仅由白矮星渐熄的余烬与中子星冰冷的辉光照亮。星系自金，转红，归于黑暗。",
  },
  {
    num: "10⁴⁰ yr", accent: "plasma" as const,
    enTitle: "Proton Decay", zhTitle: "质子衰变",
    enBody: "If protons are not eternal, even the dead stars dissolve. Matter itself unravels into radiation and stray particles. The last solid things in existence quietly evaporate into the dark.",
    zhBody: "若质子并非永恒，连死去的恒星也将瓦解。物质本身松解为辐射与游离的粒子。存在中最后的固体，悄然蒸发进黑暗。",
  },
  {
    num: "10¹⁰⁰ yr", accent: "electric" as const,
    enTitle: "The Black Hole Era", zhTitle: "黑洞纪元",
    enBody: "Only black holes remain — the universe's final libraries of entropy. Through Hawking radiation they too evaporate, the largest ones last, releasing the cosmos's accumulated disorder as the faintest possible heat.",
    zhBody: "只剩黑洞——宇宙最后的熵之图书馆。它们也将通过霍金辐射蒸发，最大的最后消失，把宇宙累积的无序，作为最微弱的热释放出来。",
  },
  {
    num: "→ ∞", accent: "bone" as const,
    enTitle: "The Dark Era", zhTitle: "黑暗纪元",
    enBody: "Nothing remains but a near-perfect vacuum of drifting photons and stray particles, all at the same vanishing temperature. No gradient, no flow, no event. Maximum entropy. Equilibrium. The end of time as anything that can happen.",
    zhBody: "什么都不剩，只有一片近乎完美的真空，漂浮着光子与游离的粒子，全部处于同一个趋近于零的温度。没有梯度，没有流动，没有事件。最大熵。平衡。时间作为「任何可能发生之事」，就此终结。",
  },
];

export default function S8_HeatDeath() {
  const { lang } = useLang();
  return (
    <SectionShell
      id="heatdeath"
      index="§ 08"
      kicker="The Fate"
      kickerZh="终局"
      headline="In the final age, no structure remains. Only equilibrium."
      headlineZh="在最终的纪元，一切结构都不复存在。只剩平衡。"
      accent="ember"
      className="bg-gradient-to-b from-transparent via-black/40 to-black/70"
    >
      <Lede
        en="Follow the Second Law to its conclusion and you arrive at a single, silent destination. The stars burn out. The galaxies disperse. The black holes evaporate. The universe expands and cools toward a uniform, featureless warmth just above absolute zero — a state so disordered that nothing can ever happen again. Physicists call it the heat death. It is not fire and it is not ice. It is the perfect, eternal stillness of maximum entropy."
        zh="将第二定律推至其结论，你会抵达一个唯一而寂静的终点。恒星燃尽。星系离散。黑洞蒸发。宇宙膨胀、冷却，趋向一种均匀的、毫无特征的、仅比绝对零度高出一点的温暖——一种无序到再也不会有任何事情发生的状态。物理学家称之为热寂。它不是火，也不是冰。它是最大熵那完美而永恒的静止。"
      />

      <Reveal className="mt-16">
        <div className="glass rounded-xl halo overflow-hidden relative">
          <div className="relative h-[440px] md:h-[560px] bg-black">
            <HeatDeathField />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
              <div className="text-center">
                <p className={`text-2xl md:text-4xl leading-relaxed text-bone/90 ${lang === "zh" ? "font-han" : "font-display"}`}>
                  {lang === "zh"
                    ? "没有记忆。"
                    : "No structure remains."}
                </p>
                <p className={`text-2xl md:text-4xl leading-relaxed text-boneDim mt-2 ${lang === "zh" ? "font-han" : "font-display"}`}>
                  {lang === "zh" ? "没有温度。" : "No memory. No warmth."}
                </p>
                <p className={`text-2xl md:text-4xl leading-relaxed text-boneFaint mt-2 ${lang === "zh" ? "font-han" : "font-display"}`}>
                  {lang === "zh" ? "只剩平衡。" : "Only equilibrium."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      <div className="mt-24">
        <Reveal>
          <div className="eyebrow mb-8">— The long descent · 漫长的沉降</div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ERAS.map((e) => (
            <Card
              key={e.num}
              num={e.num}
              enTitle={e.enTitle}
              zhTitle={e.zhTitle}
              enBody={e.enBody}
              zhBody={e.zhBody}
              accent={e.accent}
            />
          ))}
        </div>
      </div>

      <Reveal className="mt-20">
        <div className="max-w-4xl">
          <Para
            en="And yet the heat death is unimaginably far away — googol years, a one followed by a hundred zeros. The universe is barely 13.8 billion years old; it is still in its bright, violent, structure-rich infancy. Every star you have ever seen, every thought you have ever had, belongs to the briefest opening instant of cosmic history — the rare, luminous window in which entropy is low enough for anything interesting to occur at all. We are not living at the end. We are living in the dawn, on borrowed order, and that is precisely what makes it sacred."
            zh="然而热寂遥远得难以想象——古戈尔年，一后面跟着一百个零。宇宙才不过一百三十八亿岁；它仍处在明亮、剧烈、富含结构的婴儿期。你所见过的每一颗星、所产生的每一个念头，都属于宇宙史中最短暂的开篇一瞬——那扇稀有而明亮的窗口，熵低到足以让任何有趣之事得以发生。我们并非活在终点。我们活在黎明，倚赖着借来的秩序——而这，恰恰是它神圣的缘由。"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
