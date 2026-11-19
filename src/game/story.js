// 剧情档案：每完成一个里程碑，缝隙里就多留下一页记录
// check(state) 只读状态，用来判断条件；解锁状态由引擎写进 state.story

import { BOSSES } from './data.js';
import { maxResonanceTier } from './balance.js';

const count = (s, id) => s.buildings?.[id] || 0;
const bossIndex = (id) => BOSSES.findIndex((b) => b.id === id);
const EMPEROR_INDEX = bossIndex('emperor');
const WORM_INDEX = bossIndex('worm');

export const CHAPTERS = [
  {
    id: 'prologue',
    title: '醒在勘测站',
    source: '勘测日志',
    need: '进入游戏',
    check: () => true,
    text: '醒来时，勘测站的钟停在 03:17。桌上只留下一份报告：「帝国全境已无灯火，唯矿井深处有微光。」你抓起镐子往井下走，镐柄上刻着一行小字——别停。',
    echo: '第二次醒来，钟仍停在 03:17，报告仍是同一份。只是这一次，字迹是你的。',
  },
  {
    id: 'first_strike',
    title: '第一镐',
    source: '矿工传闻',
    need: '购买 1 座金矿',
    check: (s) => count(s, 'mine') >= 1,
    text: '第一镐下去没有碎石，只有一声很长的回响，像敲在某种巨大的金属上。你举灯照过去，矿脉尽头不是岩层，是一道缝：世界在那里裂开，光从另一侧漏进来。',
    echo: '你认得这道缝。上一次，你叫它「矿井」。',
  },
  {
    id: 'mine_breath',
    title: '矿脉会呼吸',
    source: '矿工传闻',
    need: '拥有 10 座金矿',
    check: (s) => count(s, 'mine') >= 10,
    text: '矿工们说，矿脉会呼吸。清晨，缝隙里涌出的金光比前一日更盛；黄昏，又缓缓收回去一些。你数着这呼吸，像数一颗陌生心脏的节拍。',
  },
  {
    id: 'lumber_echo',
    title: '年轮里的敲击声',
    source: '伐木场手记',
    need: '拥有 10 座伐木场',
    check: (s) => count(s, 'lumber') >= 10,
    text: '伐木场砍倒的树，第二天在原地长回来，年轮多出一圈。新木的断面还带着体温。你把耳朵贴上去，听见极轻的、持续的敲击声——那是你在井下挥镐的节奏。',
  },
  {
    id: 'farm_letter',
    title: '麦粒写的字',
    source: '谷仓字迹',
    need: '拥有 10 座农场',
    check: (s) => count(s, 'farm') >= 10,
    text: '农场的麦子从不腐烂。收割后的第三天，麦粒在谷仓里自己排成一行字：「还差一点。」没有人承认写过它，也没有人敢把它扫掉。',
  },
  {
    id: 'factory_log',
    title: '第三百一十二个轮回',
    source: '夜班记录',
    need: '拥有 5 座工厂',
    check: (s) => count(s, 'factory') >= 5,
    text: '工厂在无人时也照常运转。夜班记录簿的最后一页停在半句：「第三百一十二个轮回，我决定不再——」墨迹被硬生生扯断，像被谁从纸上拽走了。',
  },
  {
    id: 'bank_ledger',
    title: '明天的存款',
    source: '银行账本',
    need: '建造银行',
    check: (s) => count(s, 'bank') >= 1,
    text: '金库是空的，账本却是满的。每一笔存款都来自明天，每一笔取款都发生在昨天。行长说，这叫信用。你没有告诉他，你在缝里见过这两样东西同时存在。',
  },
  {
    id: 'throne',
    title: '第十八顶王冠',
    source: '王座厅铭文',
    need: '建造城堡',
    check: (s) => count(s, 'castle') >= 1,
    text: '王座厅的地上散着十七顶王冠，尺寸都与你的头围分毫不差。第十八顶悬在半空，迟迟不落。你坐下去时，地底传来一声很轻的、像是松了口气的「终于」。',
  },
  {
    id: 'temple',
    title: '愿你点击不朽',
    source: '神殿碑文',
    need: '建造神殿',
    check: (s) => count(s, 'temple') >= 1,
    text: '神殿的祷词只有一句：「愿点击者不朽。」祭司们不知道自己在拜谁，只知道每天清晨供桌上会多出一枚金币。你也没告诉他们，那枚金币是你顺手放的。',
  },
  {
    id: 'orbit',
    title: '从轨道看帝国',
    source: '轨道简报',
    need: '建造太空站',
    check: (s) => count(s, 'station') >= 1,
    text: '从轨道上看，帝国的灯火连成一道螺旋，像一处正在缓慢愈合的伤口。舷窗外，你第一次看见那道缝的全貌——它从天顶一直裂到地平线，把整片大陆分成两半。',
  },
  {
    id: 'first_loop',
    title: '把钥匙沉进缝里',
    source: '轮回手记',
    need: '完成第一次转生',
    check: (s) => s.rebirths >= 1,
    text: '你把帝国的钥匙沉进缝隙，世界像一张被对折的纸。金币、建筑、名字都留在另一面，只有碎片跟着你，像一小把不肯熄灭的火。再睁眼，勘测站还在，报告还是那份，只是字迹成了你的。',
    echo: '这一次你数得清：折痕每多一道，王座厅的地上就多一顶王冠。',
  },
  {
    id: 'dyson',
    title: '恒星为你闪了一下',
    source: '工程师批注',
    need: '建造戴森环',
    check: (s) => count(s, 'dyson') >= 1,
    text: '戴森环合拢那天，恒星闪了一下，节奏和你点击时完全一致。工程师写了两百页报告解释这个巧合。你在页边批注：不是巧合。',
  },
  {
    id: 'time',
    title: '老十岁的访客',
    source: '时间机器录音',
    need: '建造时间机器',
    check: (s) => count(s, 'time') >= 1,
    text: '时间机器第一次启动，走出一个比你老十岁的人。他把镐子递给你，只说了句「别问，问就是别停」，然后走进矿井，再没出来。镐柄上刻着你的名字。',
  },
  {
    id: 'multiverse',
    title: '一万个自己',
    source: '门户观测记录',
    need: '建造多元宇宙门户',
    check: (s) => count(s, 'multiverse') >= 1,
    text: '多元宇宙门户打开后，你看见隔壁的自己也在点击。成千上万个帝国，节奏完全一致。只有一扇门后是空的——那里的你停下了。你盯着那片黑暗看了很久，然后继续点。',
  },
  {
    id: 'stargate',
    title: '门后是勘测站',
    source: '使节口述',
    need: '建造星际之门',
    check: (s) => count(s, 'stargate') >= 1,
    text: '星际之门通往的地方，是勘测站的门口。走出来的「外星使节」摘下头盔，是你。他说：「第一轮的我来提醒你，帝王在等你，别信他的王冠。」说完他就老了，化成一把金粉。',
  },
  {
    id: 'infinity',
    title: '不是机器，是心脏',
    source: '引擎低语',
    need: '建造无限引擎（需转生）',
    check: (s) => count(s, 'infinity') >= 1,
    text: '无限引擎不是机器，是一颗心脏。它由所有轮回的碎片焊成，跳动时整座帝国跟着呼吸。你把耳朵贴上去，里面有人轻声问：「继续，还是停下？」你第一次没有立刻回答。',
  },
  {
    id: 'emperor',
    title: '第十八位',
    source: '帝王之言',
    need: `抵达第 ${EMPEROR_INDEX + 1} 个 Boss「虚空帝王」`,
    check: (s) => s.bossIndex >= EMPEROR_INDEX,
    text: '虚空帝王坐在王冠堆成的山上。他没有脸，只有一道和你一模一样的缝。「你终于来了，」他说，「我数过，你是第十八位。」他摘下面具，里面是空的——不是黑暗，是等待。',
    echo: '面具后面空无一物。你忽然明白：那个位置一直留着，等的是下一个肯坐下的人。',
  },
  {
    id: 'epilogue',
    title: '留给下一位',
    source: '墙上刻字',
    need: '完成 5 次转生',
    check: (s) => s.rebirths >= 5,
    text: '第五次轮回结束时，缝隙第一次开口，用你的声音说：「我一直在等你把我关掉。」你没有关。你在勘测站的墙上写下最后一行字，留给下一位醒来的人——「这里有一个帝国，它靠你点一下活着。你也可以只是看着它发光。」',
    echo: '写完你退后一步，墙上的字亮了一瞬，像有人在另一侧读它。',
  },
  {
    id: 'well_light',
    title: '井口的灯',
    source: '深井勘测记录',
    need: '拥有 10 座深井矿道',
    check: (s) => count(s, 'deepmine') >= 10,
    text: '深井矿道的井口挂着一盏灯。灯油早就干了，灯芯也换了三次，可它一直亮着。勘测队的人说，这盏灯不是照路的，是给井下的人报平安用的——只要它还亮，上面就还有人等着。',
  },
  {
    id: 'tide_names',
    title: '潮声里的名字',
    source: '礁石拓片',
    need: '拥有 10 座潮汐电站',
    check: (s) => count(s, 'tidal') >= 10,
    text: '退潮时，潮汐电站下的礁石露出一排名字。刻痕很旧，笔画却和你签在勘测报告上的习惯一模一样，只差最后一个字。你伸手去摸，海水刚好漫回来，把那行字盖住了。',
  },
  {
    id: 'antimatter_words',
    title: '反物质的第一句话',
    source: '熔炉输出日志',
    need: '拥有 8 座反物质熔炉',
    check: (s) => count(s, 'antimatter') >= 8,
    text: '反物质熔炉并网那天，输出曲线自动拼出一行摩尔斯码。译码员核对了三遍，脸色发白：你们又来了。没有人输入过这串信号，它像是从燃料里自己长出来的。',
  },
  {
    id: 'blank_card',
    title: '空白卡',
    source: '档案馆索引',
    need: '拥有 5 座记忆档案馆',
    check: (s) => count(s, 'archive') >= 5,
    text: '档案馆的索引卡按编号排到最后一格，后面多出一张空白卡。卡片没有标题，只有编号，排在你自己之后。管理员说别动它。你还是翻了过来，背面写着一个日期：明天。',
  },
  {
    id: 'second_station',
    title: '第二个勘测站',
    source: '井底目击',
    need: '击败深井蠕虫',
    check: (s) => s.bossIndex > WORM_INDEX,
    text: '深井蠕虫倒下后，井底没有岩层，是另一座勘测站。桌上摊着同一份报告，咖啡还是热的。墙上的钟也停在 03:17。你退出来时，身后的灯自己亮了，像有人刚刚坐下。',
    echo: '第二次走到井底，咖啡换成了你常喝的浓度。',
  },
  {
    id: 'echo_truth',
    title: '回响不是回声',
    source: '深井录音',
    need: '任意建筑达到回响 IV',
    check: (s) => maxResonanceTier(s) >= 4,
    text: '你把耳朵贴在井壁上，想听清那道回响。它比你慢半拍，一声接一声，规律得不像回声。你数到第一百下才明白：那不是井在回应你，是井在数你。它数得很慢，但从来没有数错过。',
    echo: '这一次你也在数它。你们数到同一个数字时，井停了半拍。',
  },
];

export const CHAPTER_BY_ID = new Map(CHAPTERS.map((c) => [c.id, c]));

export function chapterUnlocked(chapter, state) {
  try {
    return Boolean(chapter.check(state));
  } catch {
    return false;
  }
}
