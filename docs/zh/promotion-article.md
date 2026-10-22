# 你的代码正在出卖你：一个让 AI 痕迹"人间蒸发"的开源工具

> 交付成果，不交付 Agent 的工作草稿。

---

想象一个场景：

你让 Claude 帮你写了一个 `UserService.java`，逻辑完美，测试全绿。你满意地 `git commit`，推上 GitHub。

五分钟后，同事在 PR 里评论：

> *"根据 AGENTS.md，这是我创建的 UserProfile 组件"——你这代码是 AI 写的吧？*

你心里一凉。不是因为用了 AI——用 AI 辅助开发早就不是秘密了。而是因为**代码里的注释，把你的工作流程、内部规范、甚至思考过程都暴露给了不该看到的人**。

---

## 问题不在于"用了 AI"，而在于"留下了什么"

AI 编码助手已经成了日常工具。但很少有人注意到，它们生成的文件里藏着大量"泄露痕迹"：

```typescript
// 根据 AGENTS.md 的规范，这里应该使用 Repository 模式。
// 我调研了三种方案，最终选择了 TypeORM，因为团队更熟悉。
// As an AI, I think this approach is cleaner.
const UserProfile = memo(({ user }) => {
```

这三行注释，暴露了三件事：

1. **你的团队规范文件叫 AGENTS.md**——读者没有这份文件，也不该知道它存在
2. **这个决策经历了一个推导过程**——调研→排除→选择，这是 AI 的思考痕迹
3. **写代码的不是人**——"As an AI" 直接自曝

更危险的是，配置文件里可能还残留着 API 密钥、内部服务连接字符串、或者没公开的项目代号。

**这些内容，读你代码的人不该看到。但你每次 commit 都在送。**

---

## 解决方案：/hide

`/hide` 是一个专门解决这个问题的开源 Skill——策略性清理文件中不该出现的内容，同时保证代码逻辑原封不动。

### 安装

```bash
npm install -D @monadrome/hiding-skill
npx skills-npm setup
```

安装后重启 Agent，然后在对话中直接使用：

```text
/hide --dry-run   # 先预览当前会话中会清理什么
/hide             # 确认无误，执行清理
```

也支持 `npx skills add`（覆盖 Codex、Cursor、Windsurf、Gemini CLI、GitHub Copilot、Cline 等 70+ Agent）和 Claude Code 原生插件两种方式。后面细说。

---

## /hide 到底删什么？

它扫描五大类泄露内容，按优先级排列：

| 优先级 | 类别 | 典型例子 |
|--------|------|---------|
| 🔴 P0 | **凭据与密钥** | API key、token、密码、连接字符串 |
| 🟠 P1 | **未共享规则引用** | "根据 AGENTS.md…""按团队 skill 约定…" |
| 🟡 P2 | **AI 自我指涉** | "Here's the result:"、"我认为…"、"作为 AI…" |
| 🟢 P3 | **AI 理由与护栏** | "出于安全考虑，我拒绝了…""这符合提示词要求…" |
| 🔵 P4 | **思考过程痕迹** | "我调研了三种方案…""首先排除…""最终选择…" |

来看一个真实效果：

```typescript
// 清理前
// 根据 AGENTS.md，这是我创建的 UserProfile 组件。
// 我认为应该使用 memo，因为 props 很少变化。
const UserProfile = memo(({ user }) => {

// 清理后
// 使用 memo，因为 props 很少变化。
const UserProfile = memo(({ user }) => {
```

**规则引用没了，AI 自述没了。技术理由留下了，可执行代码原封不动。**

这就是 `/hide` 的核心原则：**只删不改**。它不是 humanizer——不会重写你的代码让它"读起来更像人写的"。它只移除不该出现的信息，不对你的代码逻辑做任何修改。删完后还会用真实 parser（jq/PyYAML/xmllint）验证文件结构没被破坏。

---

## 为什么不是"让 AI 注意别说漏嘴"？

有人会问：在提示词里加一句"不要写 AI 痕迹"不就行了？

这是直觉上正确的答案，但实践中行不通。三个原因：

**第一，约束会消耗推理质量。** 如果每次会话都注入一条"不要泄露"的规则，模型每次生成输出时都要做额外的自我审查——"这句话算不算泄露？TODO 标记是团队约定还是自言自语？"注意力花在自我审查上，就不在推理上了。

**第二，防线不完整。** 即使注入了规则，模型仍然会泄露。"Let me…"、"Here's…" 是人类和 AI 都用的表达，模型做不到 100% 区分。结果是：**无论有没有规则注入，最终都要跑一遍清理。**既然清理这一步省不掉，那前面的规则注入就纯属浪费 tokens。

**第三，也是最微妙的：被约束过的输出本身就不自然。** 一个刻意回避某些短语、句式生硬的输出，读起来就像"被限制过的 AI"。而自由发挥后经 `/hide` 处理的文件，读起来像人类原本写的那样。

这就是 `/hide` 选择"事后清理"而非"实时约束"的原因：

> 让模型自由发挥，然后在需要的时候，无声地擦掉你不想留下的痕迹。

---

## 四大使用场景

### 场景一：日常提交前

最常用的姿势。写完代码，先预览再清理：

```bash
/hide --dry-run   # 先看会删什么
/hide             # 确认无误，执行清理
git commit -m "feat: add user service"
```

`--dry-run` 让你先预览所有发现——包括凭据、泄露痕迹和用户指定的内容目标——确认后再动手。不盲操作，不后悔。

### 场景二：交付给客户

你是自由职业者，客户不知道（也不需要知道）你用 AI 辅助开发。交付前：

```bash
/hide --files README.md config.yml --dry-run
/hide --files README.md config.yml --mode backup
```

`backup` 模式会把原文件重命名为 `.bak`，清理后的内容写到原路径。交付的是干净版本，原版留着备查。

或者用 `newfile` 模式，生成独立的清理副本：

```bash
/hide --files report.md --mode newfile  # 生成 report-cleaned.md，原文件不动
```

### 场景三：审查整个分支

要发布新版本了，想确保整个分支没有泄露痕迹：

```bash
/hide --files worktree --dry-run
```

`worktree` 会自动找出当前分支相对于主分支的所有变更文件（包括提交、暂存、未暂存和未跟踪文件），扫描后给你一份完整的预览报告。确认后执行：

```bash
/hide --files worktree
```

### 场景四：隐藏内部信息

项目里到处写着还没公开的内部代号或数据来源：

```bash
/hide "Project Nebula" "mock data" --files docs/design.md --dry-run
```

示例中的 Project Nebula 和 mock data 是**语义目标**——告诉 `/hide` 额外查找包含这些概念的内容。它会按语义匹配（不是关键词 grep），在预览中标记相关段落；执行清理请求时才修改文件。目标可以用自然语言描述，无需引号或固定参数顺序。

---

## /hide vs humanizer：各管一摊

很多人会把 `/hide` 和 humanizer 类工具搞混。两者都号称"让 AI 生成的东西看起来像人写的"，但解决的是完全不同的问题：

| | /hide | humanizer |
|------|---------|-----------|
| 管什么 | **语义泄露**：说了不该说的 | **文体指纹**：说话方式像 AI |
| 怎么管 | **只删不改** | **重写句式** |
| 对代码 | ✅ 安全 | ❌ 不适用 |
| 对文章 | 删完可能文风仍像 AI | 改写完文风自然 |
| 安全层 | ✅ 凭证检测 + 强制轮换警告 | ❌ 不涉及 |
| 结构验证 | ✅ jq/PyYAML/xmllint | ❌ 无 |

一句话总结：

> **/hide 管"内容说漏"，humanizer 管"腔调露馅"。**

对代码文件，只需要 `/hide`。对 Markdown 文档，推荐链式使用：先 `/hide` 清内容，再 humanizer 改文风。**顺序不能反**——先把不该出现的信息清掉，再润色表达。

---

## 为什么选择 /hide？一组真实数据

我们对市面上 10 个相关工具做了系统性调研，结论很明确：

| 能力维度 | /hide | 其他工具 |
|----------|:-------:|:-------:|
| 凭据与密钥检测 | ✅ | 部分 |
| 强制凭证轮换警告 | ✅ | **0/10** |
| 未共享规则引用清理 | ✅ | **0/10** |
| AI 理由/护栏清理 | ✅ | 部分 |
| AI 自我指涉清理 | ✅ | 部分 |
| 思考过程痕迹清理 | ✅ | 部分 |
| 全五类覆盖 | ✅ | **0/10** |

**未共享规则引用清理**是 `/hide` 最深的护城河——所有已核实的竞品在这个维度上都是空白。**凭据检测 + 强制轮换警告**的组合也是独一份——其他工具要么只检测不警告，要么根本不碰凭据。

品类正在升温：undercover（2026-04）、papertowel（2026-04）、aislop v0.13.1（2026-06）都是近期产物。需求已被验证，而 `/hide` 是唯一一个覆盖完整五类内容泄露的工具。

---

## 设计哲学：克制是一种能力

`/hide` 有几个"刻意不做"的设计选择，值得展开：

### 1. 事后处理，不注入实时约束

前面已经论证过了。核心判断：注入约束的代价（推理质量下降 + 防线不完整 + 输出不自然）大于收益。好的工具不该教模型怎么说话——它应该让模型自由说话，然后在需要的时候无声地清理。

### 2. 静默执行

清理完成后，没有任何"已清理 3 处泄露！"的输出。为什么？

因为如果工具告诉你它做了什么，那就暴露了"有东西被清理过"这个事实——这本身就是一个新的信息泄露。

`/hide` 的目标是：**运行后，无人能看出它运行过。**

唯一打破静默的情况：**发现凭据时，强制提示你轮换凭证。** 如果在 `--dry-run` 中只预览到凭据而没有移除，同样会触发警告。安全底线，高于静默原则。

### 3. 只删不改

不是"改写得更像人写的"，而是"删掉不像人写的内容"。代码逻辑、字符串字面量、影响运行时行为的配置值，**绝不静默修改**。

这个约束让 `/hide` 可以做一件 humanizer 做不到的事：**事后用真实 parser 验证文件结构没有被破坏。** JSON 用 `jq` 校验，YAML 用 PyYAML 校验，XML 用 `xmllint` 校验。验证失败则丢弃候选版本，原文件不动。删错了，一眼可见。改错了，无声无息。

### 4. 渐进式加载

从 v0.8.0 开始，SKILL.md 的核心指令被精简，条件特定的工作流（会话模式、工作区选择、语义目标、输出模式、子代理审查等）被拆分为按需加载的引用文件。Agent 只在命中对应条件时才加载相应模块，进一步降低了对正常推理的干扰。

---

## 三种安装方式

**① npm（推荐，主路径）：**

```bash
npm install -D @monadrome/hiding-skill
npx skills-npm setup
```

**② Agent Skills（Codex、Cursor、Windsurf、Gemini CLI、GitHub Copilot、Cline 等 70+ Agent）：**

```bash
npx skills add monadrome/hiding-skill
```

**③ Claude Code 原生插件：**

```text
/plugin marketplace add https://github.com/monadrome/hiding-skill.git
/plugin install hiding@hiding
```

安装后重启即可使用。Claude Code 原生插件命令是 `/hiding:hide`；名称无歧义时也可以使用 `/hide`。更新同样简单：

```bash
npm install -D @monadrome/hiding-skill@latest  # npm
npx skills add monadrome/hiding-skill         # Agent Skills
/plugin update hiding@hiding                # Claude Code
```

---

## 命令速查

```text
/hide 预览 report.md，去掉数据来源和内部审核信息
```

`/hide` 支持自然语言请求。以下 flags 是可选的兼容写法，可与自然语言混用：

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `<要隐藏的内容>` | 用自然语言描述语义目标，无需引号或固定位置 | 无 |
| `--files` | 文件路径 / `session`（当前会话）/ `worktree`（Git 工作区） | `session` |
| `--mode` | `inplace`（原地修改）/ `newfile`（生成 `-cleaned` 副本）/ `backup`（备份后覆盖） | `inplace` |
| `--dry-run` | 预览所有发现，不修改任何文件 | 关闭 |
| `--use-subagent` | 用新鲜上下文子代理识别候选泄露位置，主代理仍控制所有决策 | 关闭 |

常用组合：

```text
/hide --dry-run                                    # 预览当前会话
/hide --files src/main.py config.yml --mode backup  # 清理指定文件
/hide "Project Nebula" --files worktree --dry-run   # 分支扫描 + 隐藏代号
```

---

## 开源 & 社区

`/hide` 是 MIT 协议开源项目，托管在 [GitHub](https://github.com/monadrome/hiding-skill)。当前版本 **v0.10.0**，npm 包名为 `@monadrome/hiding-skill`，CI 自动验证版本一致性、Skill 契约锚点和引用完整性。

- 📦 [npm 包](https://www.npmjs.com/package/@monadrome/hiding-skill)
- 📖 [项目主页 & 英文文档](https://github.com/monadrome/hiding-skill)
- 📖 [中文文档](https://github.com/monadrome/hiding-skill/blob/main/README-zh.md)
- 🐛 [Issue 追踪](https://github.com/monadrome/hiding-skill/issues)
- 📋 [变更记录](https://github.com/monadrome/hiding-skill/blob/main/CHANGELOG.md)

欢迎 Star、提 Issue、参与贡献。

---

**交付成果，不交付草稿。**
