export default function AboutPage() {
  return (
    <div>
      <section className="panel">
        <h2 className="panel-title">关于双色球玄机台</h2>
        <p>
          这是一个纯前端的<strong>娱乐工具</strong>：查看最近 45 期开奖号码，用「数学期望」或「卦象推演」两种算法生成 1–5
          组号码，支持自定义幸运号锁定与排除。
        </p>
        <p>
          卦象推演参考了小六壬、梅花易数、五行生克与天干地支的传统文化元素，但所有规则均为
          <strong>工程化转译</strong>，与真实术数无关，仅用于生成一份「讲得出一套话」的娱乐叙事。
        </p>
      </section>

      <section className="panel">
        <h2 className="panel-title">重要声明</h2>
        <p>
          <strong style={{ color: 'var(--red-500)' }}>
            本平台所有「预测」结果由算法随机生成，仅供娱乐，不构成任何购彩建议。
          </strong>
        </p>
        <p>
          彩票开奖是独立随机事件，历史数据对未来开奖没有任何影响，任何算法都无法提高中奖概率。
          所谓「热号」「冷号」「卦象」只是对已发生事件的描述，请勿迷信。
        </p>
        <p>请理性购彩，量力而行。未满 18 周岁不得购买彩票。</p>
      </section>

      <section className="panel">
        <h2 className="panel-title">数据说明</h2>
        <p>
          内置的 45 期开奖数据来自<strong>中国福利彩票官方网站</strong>（www.cwl.gov.cn 开奖公告），
          为真实历史开奖。数据以静态 JSON 形式内置于 <code> src/data/draws.json </code>，
          应用本身离线运行；开奖更新后可整体替换该文件内容（格式见 <code> docs/DEV.md </code>§3）。
        </p>
      </section>
    </div>
  );
}
