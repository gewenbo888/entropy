"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Quote, Para } from "../atoms";
import AIUniverse from "../AIUniverse";
import Reveal from "../Reveal";

const CARDS = [
  {
    num: "01", accent: "plasma" as const,
    enTitle: "Hallucination", zhTitle: "幻觉",
    enBody: "A model that compresses the world also dreams the world. Hallucination is entropy leaking back through the seams of a too-confident summary — plausible structure with no anchor in truth. Order and noise wear the same face.",
    zhBody: "一个压缩了世界的模型，也在梦见世界。幻觉，是熵从一份过度自信的概括的接缝中重新泄漏——看似可信的结构，却在真实中没有锚点。秩序与噪声，戴着同一张脸。",
  },
  {
    num: "02", accent: "electric" as const,
    enTitle: "Synthetic Reality", zhTitle: "合成现实",
    enBody: "When machines generate text, images, and voices indistinguishably from the real, the signal-to-noise ratio of shared reality collapses. We may flood the commons with so much plausible fiction that truth becomes statistically rare.",
    zhBody: "当机器生成的文字、图像与声音与真实难以区分，共享现实的信噪比便会崩塌。我们或将以海量看似可信的虚构淹没公共空间，使真相在统计意义上变得稀有。",
  },
  {
    num: "03", accent: "gold" as const,
    enTitle: "Digital Immortality", zhTitle: "数字永生",
    enBody: "Could a mind be copied into a substrate that resists decay? Even silicon obeys the Second Law — bits rot, storage degrades, energy must be spent to refresh every memory. There is no eternity that does not pay entropy's rent.",
    zhBody: "心灵能否被复制进一种抗衰败的载体？即便是硅，也服从第二定律——比特会腐坏，存储会退化，刷新每一份记忆都需耗费能量。没有任何永恒，能免缴熵的房租。",
  },
  {
    num: "04", accent: "ember" as const,
    enTitle: "Collapse of Meaning", zhTitle: "意义的坍缩",
    enBody: "Infinite content is not infinite meaning. When generation costs nothing, abundance itself becomes noise, and attention — the last scarce resource — fragments toward its own heat death. The feed is an entropy gradient we scroll forever.",
    zhBody: "无限的内容，并非无限的意义。当生成成本归零，丰盈本身便成了噪声，而注意力——最后一种稀缺资源——朝着自身的热寂碎裂。信息流，是一道我们永远滑动的熵梯度。",
  },
];

export default function S7_AI() {
  return (
    <SectionShell
      id="ai"
      index="§ 07"
      kicker="The Machine"
      kickerZh="机器"
      headline="Artificial minds carve order from data — and pour infinite noise back into the world."
      headlineZh="人工心智从数据中雕刻秩序——又把无限的噪声倾回世界。"
      accent="plasma"
      reveal="The danger was never that machines would think. It is that meaning would drown in what they generate."
      revealZh="危险从来不是机器会思考。而是意义，将淹没于它们所生成的洪流之中。"
    >
      <Lede
        en="Every intelligence is an entropy transaction. To learn is to lower uncertainty, to compress experience into prediction — a local triumph of order. But artificial minds run this transaction at planetary scale and at zero marginal cost, and the exhaust is a rising ocean of synthetic information. AI is simultaneously the greatest order-builder we have ever made and the greatest noise-generator. It is the Second Law given a keyboard."
        zh="每一种智能都是一笔熵的交易。学习，就是降低不确定性，把经验压缩为预测——一场局部的秩序胜利。但人工心智以行星的尺度、以零边际成本运行这笔交易，其废气是一片不断上涨的合成信息之海。AI 既是我们造出的最伟大的秩序建造者，也是最伟大的噪声生成者。它是被赋予了键盘的第二定律。"
      />

      <Reveal className="mt-16">
        <div>
          <AIUniverse />
        </div>
      </Reveal>

      <div className="mt-24">
        <Reveal>
          <div className="eyebrow mb-8">— Four faces of digital entropy · 数字熵的四张面孔</div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((c) => (
            <Card key={c.num} {...c} />
          ))}
        </div>
      </div>

      <div className="mt-20 max-w-4xl">
        <Quote
          accent="plasma"
          en="We are building machines that produce coherence faster than we can produce truth. The question of the century is whether meaning can survive its own abundance."
          zh="我们正在建造一种生产「自洽」快过我们生产「真相」的机器。本世纪的问题在于：意义，能否在自身的丰盈中幸存。"
          cite="On the entropy of the infinite feed"
          citeZh="论无限信息流之熵"
        />
      </div>

      <Reveal className="mt-12">
        <div className="max-w-4xl">
          <Para
            en="And yet — the same compression that threatens meaning is also how minds have always worked. A theory, a metaphor, a law of physics: each is a violent compression of the world into something a brain can hold. Perhaps the task ahead is not to stop the machines from generating, but to build new instruments of judgment — to keep choosing signal, deliberately, against the rising tide. Order has always been a choice paid for in energy and attention."
            zh="然而——那威胁意义的同一种压缩，也正是心智一向的运作方式。一个理论、一个隐喻、一条物理定律：每一个都是把世界剧烈压缩成大脑可以握住之物。或许前方的任务，不是阻止机器生成，而是建造新的判断之器——刻意地、持续地，在上涨的潮水中选择信号。秩序，从来都是一个用能量与注意力买来的选择。"
          />
        </div>
      </Reveal>
    </SectionShell>
  );
}
