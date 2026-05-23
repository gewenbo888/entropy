"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Para } from "../atoms";
import { EquationBlock, V, Sub } from "../Equation";
import EntropyBox from "../EntropyBox";
import Reveal from "../Reveal";

const DOMAINS = [
  {
    num: "01", accent: "ember" as const,
    enTitle: "Thermodynamics", zhTitle: "热力学",
    enBody: "The original entropy. Heat flows from hot to cold, never the reverse. Every engine pays a tax in unusable energy. The Second Law: the entropy of an isolated system never decreases.",
    zhBody: "熵的本源。热量自发地从高温流向低温，绝不逆行。每一台引擎都要为无法利用的能量纳税。第二定律：孤立系统的熵永不减少。",
  },
  {
    num: "02", accent: "electric" as const,
    enTitle: "Statistical Mechanics", zhTitle: "统计力学",
    enBody: "Boltzmann's revelation: entropy counts the microscopic arrangements that look identical from outside. Disorder is simply the overwhelming majority of possibilities. Order is rare; chaos is generic.",
    zhBody: "玻尔兹曼的启示：熵是对外观相同的微观排列方式的计数。无序，不过是压倒性多数的可能性。有序是稀有的，混沌才是常态。",
  },
  {
    num: "03", accent: "plasma" as const,
    enTitle: "Information Theory", zhTitle: "信息论",
    enBody: "Shannon proved that information and entropy are the same mathematics. Entropy measures surprise — how many bits you need to specify an unknown message. Maximum entropy is maximum uncertainty.",
    zhBody: "香农证明：信息与熵共用同一套数学。熵衡量惊奇——指定一条未知信息所需的比特数。最大的熵，就是最大的不确定。",
  },
  {
    num: "04", accent: "gold" as const,
    enTitle: "Cosmology", zhTitle: "宇宙学",
    enBody: "The universe began in an astonishingly low-entropy state — smooth, hot, uniform. Everything since, every star and thought, is the slow cashing-out of that primordial order toward final equilibrium.",
    zhBody: "宇宙诞生于一个低得惊人的熵态——光滑、炽热、均匀。此后的一切，每一颗恒星、每一个念头，都是那原初秩序向最终平衡缓慢兑现的过程。",
  },
  {
    num: "05", accent: "electric" as const,
    enTitle: "Biology", zhTitle: "生物学",
    enBody: "A living cell is a fortress of order in a rising tide of disorder. It maintains itself only by exporting more entropy than it builds — eating low entropy, excreting high entropy. Life is a permanent local exception.",
    zhBody: "活细胞是无序浪潮中的有序堡垒。它维系自身的唯一办法，是排出比构建更多的熵——摄入低熵，排出高熵。生命，是一个永久的局部例外。",
  },
  {
    num: "06", accent: "plasma" as const,
    enTitle: "Artificial Intelligence", zhTitle: "人工智能",
    enBody: "A neural network is an entropy-reducing machine: it compresses oceans of data into compact structure. Yet each model also floods the world with synthetic content, raising the informational entropy it claims to tame.",
    zhBody: "神经网络是一台降熵机器：它把数据的汪洋压缩成紧凑的结构。然而每个模型也向世界倾泻合成内容，抬高了它声称要驯服的信息熵。",
  },
  {
    num: "07", accent: "gold" as const,
    enTitle: "Economics", zhTitle: "经济学",
    enBody: "Markets are entropy engines. They dissipate concentrated value into diffuse activity, and wealth — like heat — tends to spread unless work is continuously spent to concentrate it. Order costs energy.",
    zhBody: "市场是熵机。它把集中的价值耗散为弥漫的活动；财富如同热量，若不持续做功去聚集，便倾向于扩散。秩序，是要耗能的。",
  },
  {
    num: "08", accent: "ember" as const,
    enTitle: "Digital Networks", zhTitle: "数字网络",
    enBody: "The internet is the largest entropy gradient ever built — endless signal and noise in violent superposition. Every feed is a battle between meaning and the heat death of attention.",
    zhBody: "互联网是有史以来最庞大的熵梯度——无尽的信号与噪声剧烈叠加。每一条信息流，都是意义与注意力热寂之间的战争。",
  },
];

export default function S2_WhatIs() {
  return (
    <SectionShell
      id="what"
      index="§ 02"
      kicker="The Definition"
      kickerZh="定义"
      headline="Entropy is the measure of how many ways the universe can be."
      headlineZh="熵，是宇宙能以多少种方式存在的度量。"
      accent="electric"
      reveal="Disorder is not a force. It is simply the overwhelming arithmetic of the possible."
      revealZh="无序并非一种力。它只是「可能性」那压倒一切的算术。"
    >
      <Lede
        en="Entropy wears many masks — heat, probability, information, decay — but beneath each is one idea: there are vastly more ways to be disordered than ordered, so a system left alone will, with overwhelming likelihood, drift toward the disordered many. Time's one-way street is built from pure counting."
        zh="熵戴着许多面具——热、概率、信息、衰败——但每一副面具之下都是同一个念头：无序的方式远多于有序的方式，因此一个无人干预的系统，极大概率会漂向无序的多数。时间的单行道，是由纯粹的计数铺成的。"
      />

      <div className="grid lg:grid-cols-2 gap-8 mt-16 items-start">
        <div className="space-y-6">
          <Para
            en="Drag heat into the box. Watch the particles abandon their crystalline lattice and fill the space evenly — and watch the entropy meter climb. Then press reset. The particles snap back to order, but only because you spent energy and information to put them there. Left to themselves, they would never reassemble. That asymmetry is the entire mystery."
            zh="向盒子里注入热量。看着粒子抛弃它们的晶格阵列，均匀地充满空间——再看熵的刻度攀升。然后按下复位。粒子重新归位，但这只因为你耗费了能量与信息把它们放回去。任其自然，它们永远不会自行重组。这种不对称，正是全部谜题之所在。"
          />
          <div className="grid grid-cols-2 gap-4">
            <EquationBlock
              accent="ember"
              name="Clausius · 1865"
              nameZh="克劳修斯 · 1865"
              formula={<span>d<V>S</V> = δ<V>Q</V> / <V>T</V></span>}
              en="The macroscopic law: the change in entropy equals heat exchanged divided by temperature. For any real, irreversible process, total entropy strictly grows."
              zh="宏观定律：熵的变化等于交换的热量除以温度。对任何真实的、不可逆的过程，总熵都严格增加。"
            />
            <EquationBlock
              accent="electric"
              name="Boltzmann · 1877"
              nameZh="玻尔兹曼 · 1877"
              formula={<span><V>S</V> = <V>k</V><Sub>B</Sub> ln <V>W</V></span>}
              en="The microscopic bridge, carved on his gravestone. Entropy S is proportional to the logarithm of W — the number of microstates that produce the same macrostate."
              zh="刻在他墓碑上的微观桥梁。熵 S 正比于 W 的对数——而 W，是产生同一宏观态的微观态数目。"
            />
          </div>
        </div>

        <Reveal>
          <div>
            <EntropyBox />
          </div>
        </Reveal>
      </div>

      <div className="mt-24">
        <Reveal>
          <div className="eyebrow mb-8">— Eight faces of one law · 一条定律的八张面孔</div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DOMAINS.map((d) => (
            <Card key={d.num} {...d} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
