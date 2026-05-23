"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Para } from "../atoms";
import { EquationBlock, V, Sub, Sup } from "../Equation";
import BlackHoleSim from "../BlackHoleSim";
import Reveal from "../Reveal";

const CARDS = [
  {
    num: "01", accent: "gold" as const,
    enTitle: "Maximum Entropy", zhTitle: "最大熵",
    enBody: "Bekenstein and Hawking proved that a black hole holds the most entropy that can fit in a given region — more than any star, gas, or computer the same size. To pack more disorder into a volume is to collapse it into a black hole.",
    zhBody: "贝肯斯坦与霍金证明：黑洞容纳着一个给定区域内所能容纳的最大熵——超过任何同样大小的恒星、气体或计算机。要把更多无序塞进一个体积，就只能让它坍缩成黑洞。",
  },
  {
    num: "02", accent: "ember" as const,
    enTitle: "Entropy on the Surface", zhTitle: "面上的熵",
    enBody: "Strangely, a black hole's entropy scales with its surface area, not its volume — one bit per four Planck areas of horizon. This is the seed of the holographic principle: that all the information in a region may be written on its boundary.",
    zhBody: "奇异的是，黑洞的熵正比于它的表面积，而非体积——每四个普朗克面积的视界承载一比特。这正是全息原理的种子：一个区域内的全部信息，或许都书写在它的边界之上。",
  },
  {
    num: "03", accent: "electric" as const,
    enTitle: "Hawking Radiation", zhTitle: "霍金辐射",
    enBody: "Black holes are not eternal. They glow faintly, leaking energy as thermal radiation, and over unimaginable ages they evaporate entirely — the largest objects in the cosmos dissolving into the faintest possible heat.",
    zhBody: "黑洞并非永恒。它们微微发光，以热辐射的形式泄漏能量，并在难以想象的漫长岁月里彻底蒸发——宇宙中最庞大的天体，消融为最微弱的热。",
  },
  {
    num: "04", accent: "plasma" as const,
    enTitle: "The Information Paradox", zhTitle: "信息悖论",
    enBody: "If a black hole evaporates completely, what happens to everything that fell in? Is the information destroyed — violating quantum mechanics — or subtly preserved in the outgoing glow? Half a century later, the question still cracks physics open.",
    zhBody: "若黑洞彻底蒸发，那些落入其中的一切去了哪里？信息是被摧毁了——违背量子力学——还是微妙地保存在逸出的辉光之中？半个世纪过去，这个问题仍在撬动物理学的根基。",
  },
];

export default function S6_BlackHole() {
  return (
    <SectionShell
      id="blackhole"
      index="§ 06"
      kicker="The Maximum"
      kickerZh="极限"
      headline="A black hole is the most entropy that reality will allow into one place."
      headlineZh="黑洞，是现实允许聚集于一处的最大熵。"
      accent="gold"
      reveal="Everything that falls in is remembered only as area — and area only grows."
      revealZh="一切坠入之物，都仅以「面积」被记住——而面积，只增不减。"
    >
      <Lede
        en="Drop a teacup into a black hole and its shape, its history, its meaning all vanish behind the event horizon. What remains is mass, charge, spin — and a slightly larger horizon. Bekenstein realized that this growing surface is entropy itself: black holes are nature's ultimate filing cabinet, where information is compressed to the absolute physical limit and the second law is enforced with terrifying finality."
        zh="把一只茶杯丢进黑洞，它的形状、历史与意义，全都消失在事件视界之后。留下的只有质量、电荷、自旋——以及一个略微变大的视界。贝肯斯坦意识到：这不断增长的表面，本身就是熵。黑洞是自然终极的档案柜，信息在此被压缩到绝对的物理极限，第二定律以令人战栗的终局性被强制执行。"
      />

      <Reveal className="mt-16">
        <div>
          <BlackHoleSim />
        </div>
      </Reveal>

      <div className="mt-16 grid md:grid-cols-2 gap-6">
        <EquationBlock
          accent="gold"
          name="Bekenstein–Hawking Entropy"
          nameZh="贝肯斯坦–霍金熵"
          formula={
            <span>
              <V>S</V><Sub>BH</Sub> = (<V>k</V><Sub>B</Sub> <V>c</V><Sup>3</Sup> <V>A</V>) / (4 <V>G</V> ℏ)
            </span>
          }
          en="Entropy is one quarter of the horizon area A, measured in Planck units. A black hole the mass of the Sun holds more entropy than every particle of ordinary matter in a region millions of light-years across."
          zh="熵等于视界面积 A 的四分之一（以普朗克单位计）。一个太阳质量的黑洞，其熵超过方圆数百万光年内所有普通物质粒子之和。"
        />
        <EquationBlock
          accent="ember"
          name="Hawking Temperature"
          nameZh="霍金温度"
          formula={
            <span>
              <V>T</V><Sub>H</Sub> = (ℏ <V>c</V><Sup>3</Sup>) / (8π <V>G</V> <V>M</V> <V>k</V><Sub>B</Sub>)
            </span>
          }
          en="The bigger the black hole, the colder it is. A stellar black hole is a hundred-millionth of a degree above absolute zero — and so it evaporates more slowly than the age of the universe, many, many times over."
          zh="黑洞越大，温度越低。一个恒星级黑洞仅比绝对零度高一亿分之一度——因此它蒸发所需的时间，是宇宙年龄的无数倍。"
        />
      </div>

      <div className="mt-24">
        <Reveal>
          <div className="eyebrow mb-8">— Four consequences · 四重后果</div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((c) => (
            <Card key={c.num} {...c} />
          ))}
        </div>
      </div>

      <Reveal className="mt-16">
        <div className="max-w-4xl">
          <Para
            en="Feed the simulation above and watch the entropy counter climb with every star — and notice it can never fall. In the deep future, black holes will be the last structures standing, vast reservoirs holding nearly all the entropy of the cosmos, slowly bleeding it back as the faintest radiation. They are both the universe's memory and the agent of its forgetting."
            zh="向上方的模拟投喂恒星，看着熵的计数随每一颗星攀升——并留意它永不回落。在遥远的未来，黑洞将是最后屹立的结构，作为巨大的熵库，几乎容纳着宇宙的全部熵，再以最微弱的辐射缓缓渗回。它们既是宇宙的记忆，也是它遗忘的执行者。"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
