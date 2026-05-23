"use client";

import { SectionShell } from "../SectionShell";
import { Lede, Card, Para } from "../atoms";
import { EquationBlock, V, Sub } from "../Equation";
import InfoEntropy from "../InfoEntropy";
import Reveal from "../Reveal";

const CARDS = [
  {
    num: "01", accent: "electric" as const,
    enTitle: "Compression", zhTitle: "压缩",
    enBody: "Entropy is the hard floor of compression. A message can be squeezed only until it reaches its entropy in bits — squeeze further and you destroy meaning. Order is compressible; pure noise is not.",
    zhBody: "熵是压缩的硬底线。一条信息只能被压缩到它的熵（以比特计）为止——再压，便会摧毁意义。有序可压缩，纯噪声不可压缩。",
  },
  {
    num: "02", accent: "plasma" as const,
    enTitle: "Randomness", zhTitle: "随机性",
    enBody: "The most random string carries the most information and the least meaning. Maximum entropy is a coin that is equally likely to land any way — perfectly unpredictable, perfectly empty of pattern.",
    zhBody: "最随机的字符串携带最多的信息，却含最少的意义。最大熵，是一枚正反等概率的硬币——完全不可预测，也完全没有图案。",
  },
  {
    num: "03", accent: "gold" as const,
    enTitle: "Meaning", zhTitle: "意义",
    enBody: "Meaning lives in the redundancy entropy leaves behind. Language is roughly 75% predictable; that redundancy is what lets us understand a half-heard sentence. Pure information would be incomprehensible.",
    zhBody: "意义寄居于熵留下的冗余之中。语言约有 75% 是可预测的；正是这种冗余，让我们能听懂一句只听了一半的话。纯粹的信息，将无法被理解。",
  },
  {
    num: "04", accent: "ember" as const,
    enTitle: "Neural Networks", zhTitle: "神经网络",
    enBody: "Training a model is entropy minimization: cross-entropy loss measures the gap between what the network predicts and what is true. Learning is literally the act of lowering surprise.",
    zhBody: "训练模型，就是熵的最小化：交叉熵损失衡量网络的预测与真实之间的差距。所谓学习，字面意义上就是降低惊奇的行为。",
  },
];

export default function S4_Information() {
  return (
    <SectionShell
      id="info"
      index="§ 04"
      kicker="Information"
      kickerZh="信息熵"
      headline="Information is surprise. Entropy is the price of being surprised."
      headlineZh="信息即惊奇。熵，是被惊奇所需支付的代价。"
      accent="plasma"
      reveal="A civilization drowning in content is not richer in meaning. It is closer to noise."
      revealZh="一个被内容淹没的文明，并未在意义上变得更富有。它只是更接近噪声。"
    >
      <Lede
        en="In 1948 Claude Shannon asked a question that reshaped the century: how do you measure information? His answer was entropy. The information in a message is the number of bits needed to resolve its uncertainty. A predictable message carries little; a shocking one carries much. The same formula that governs heat now governs every signal that has ever crossed a wire."
        zh="1948 年，克劳德·香农提出了一个重塑世纪的问题：如何度量信息？他的答案是熵。一条信息所含的信息量，就是消解其不确定性所需的比特数。可预测的信息携带很少，令人震惊的信息携带很多。那条主宰热的公式，如今主宰着每一个曾穿越电线的信号。"
      />

      <div className="mt-16 grid lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <EquationBlock
            accent="plasma"
            name="Shannon · 1948"
            nameZh="香农 · 1948"
            formula={
              <span>
                <V>H</V> = − <span className="inline-block align-middle text-[0.8em]">Σ</span> <V>p</V>(<V>x</V>) log<Sub>2</Sub> <V>p</V>(<V>x</V>)
              </span>
            }
            en="The entropy H of a source is the average surprise of its symbols, measured in bits. Identical in form to Boltzmann's law — only the interpretation changed: microstates became messages."
            zh="一个信源的熵 H，是其符号的平均惊奇度，以比特衡量。它在形式上与玻尔兹曼定律完全相同——改变的只是诠释：微观态，变成了信息。"
          />
          <Para
            en="Type into the console. Repetitive text collapses toward zero entropy — perfectly compressible, almost meaningless in its predictability. Random keystrokes push entropy toward its ceiling — incompressible, structureless, pure noise. Human language settles in between: ordered enough to mean something, surprising enough to say something new."
            zh="在控制台中输入文字。重复的文本会坍向零熵——完全可压缩，在可预测中近乎无意义。随机的敲击会把熵推向上限——不可压缩、毫无结构、纯粹的噪声。人类的语言落在两者之间：有序到足以承载意义，惊奇到足以言说新事。"
          />
        </div>

        <Reveal className="lg:col-span-3">
          <div>
            <InfoEntropy />
          </div>
        </Reveal>
      </div>

      <div className="mt-24">
        <Reveal>
          <div className="eyebrow mb-8">— Four corollaries · 四条推论</div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {CARDS.map((c) => (
            <Card key={c.num} {...c} />
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
