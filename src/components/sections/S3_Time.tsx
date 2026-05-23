"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Quote, FlowRow, Para } from "../atoms";
import UniverseTimeline from "../UniverseTimeline";
import Reveal from "../Reveal";

export default function S3_Time() {
  return (
    <SectionShell
      id="time"
      index="§ 03"
      kicker="The Arrow"
      kickerZh="时间之箭"
      headline="Why does time only move one way? Because entropy does."
      headlineZh="时间为何只朝一个方向流动？因为熵只朝一个方向增长。"
      accent="gold"
      reveal="The past is simply the direction in which the universe was more ordered."
      revealZh="所谓过去，不过是宇宙曾经更有序的那个方向。"
    >
      <Lede
        en="The laws of physics are almost perfectly reversible — a film of two colliding atoms looks equally valid run backward. Yet we never see a shattered cup leap back onto the table. The only law that knows the difference between past and future is the Second Law. Entropy is the arrow of time; everything we call memory, aging, and causation is its shadow."
        zh="物理定律几乎是完美可逆的——两个原子碰撞的影片，倒着放也同样成立。然而我们从未见过一只碎裂的杯子跃回桌面。唯一能分辨过去与未来的定律，是第二定律。熵，就是时间之箭；我们所谓的记忆、衰老与因果，皆是它的投影。"
      />

      <Reveal className="mt-16">
        <div>
          <UniverseTimeline />
        </div>
      </Reveal>

      <div className="mt-16">
        <Reveal>
          <div className="eyebrow mb-6">— The cosmic clock · 宇宙之钟</div>
        </Reveal>
        <FlowRow
          accent="gold"
          steps={[
            { en: "Big Bang", zh: "大爆炸" },
            { en: "First Light", zh: "第一缕光" },
            { en: "Stars", zh: "恒星" },
            { en: "Life", zh: "生命" },
            { en: "Mind & AI", zh: "心智与AI" },
            { en: "Digital Civilization", zh: "数字文明" },
            { en: "Heat Death", zh: "热寂" },
          ]}
        />
      </div>

      <div className="mt-24 grid md:grid-cols-2 gap-x-16 gap-y-12">
        <Quote
          accent="electric"
          en="The general struggle for existence of living beings is not a struggle for raw materials nor for energy, but a struggle for entropy."
          zh="生命体为生存所进行的普遍斗争，既不是为原料，也不是为能量，而是为熵而战。"
          cite="Ludwig Boltzmann"
          citeZh="路德维希·玻尔兹曼"
        />
        <Quote
          accent="gold"
          en="The distinction between past, present and future is only a stubbornly persistent illusion."
          zh="过去、现在与未来之间的区分，只是一个顽固而持久的幻觉。"
          cite="Albert Einstein"
          citeZh="阿尔伯特·爱因斯坦"
        />
        <Quote
          accent="plasma"
          en="The future is uncertain… but this uncertainty is at the very heart of human creativity. Time is creation."
          zh="未来是不确定的……但正是这种不确定，处在人类创造力的核心。时间，就是创造。"
          cite="Ilya Prigogine"
          citeZh="伊利亚·普里高津"
        />
        <Quote
          accent="ember"
          en="A living organism continually increases its entropy… and thus tends to approach the dangerous state of maximum entropy, which is death. It stays alive only by drawing negative entropy from its environment."
          zh="生命体不断增加自身的熵……从而趋向于最大熵的危险状态，那便是死亡。它得以存活，全靠从环境中汲取负熵。"
          cite="Erwin Schrödinger"
          citeZh="埃尔温·薛定谔"
        />
      </div>

      <Reveal className="mt-16">
        <div className="max-w-4xl">
          <Para
            en="Claude Shannon, founding the theory of information, deliberately borrowed Boltzmann's word. When he asked von Neumann what to call his uncertainty measure, the reply was: call it entropy — partly because the formula is the same, and partly because 'no one really knows what entropy is, so in a debate you will always have the advantage.' Time, information, and heat were revealed to be one family."
            zh="香农在创立信息论时，刻意借用了玻尔兹曼的词。当他询问冯·诺依曼该如何命名这一不确定性度量时，答复是：就叫它熵吧——一来公式相同，二来「没有人真正懂熵是什么，所以辩论时你永远占上风」。时间、信息与热，从此被揭示为同一个家族。"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
