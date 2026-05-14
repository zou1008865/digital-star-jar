# Digital Star Jar

一个用于自律打卡的单页面 Web 应用。它把线下行动变成一颗颗落入玻璃瓶的星星，让每天的完成感变得可见、可听、可积累。

在线访问：

```text
https://zou1008865.github.io/digital-star-jar/
```

## 功能

- 深色极简界面，中央是玻璃质感的星星瓶
- 使用 Matter.js 实现星星下落、碰撞和堆叠
- 每次打卡会掉落一颗发光星星，并播放清脆的提示音
- 星星落地时会产生金色粒子效果
- 四个每日仪式：健身、阅读、健康饮食、有效学习
- 每个仪式每天只能完成一次，完成后按钮进入发光完成态
- 本周资产、总资产和最近 7 天记录会保存在浏览器 localStorage 中
- 每 28 颗星星触发一次完美周庆祝特效
- 支持 GitHub Pages 自动部署

## 使用方式

每天完成一项线下行动后，点击对应按钮：

- 健身
- 阅读
- 健康饮食
- 有效学习

每个按钮每天只能点击一次。第二天会自动恢复可点击状态；最近 7 天的完成情况会显示在瓶子下方。

右上角显示：

- 本周资产：当前这一周积累的星星
- 总资产：历史累计星星
- 清空本周：每周重新开始时使用，不会清空总资产

## 本地运行

先安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

然后打开：

```text
http://127.0.0.1:5173/
```

Windows 用户也可以直接双击：

```text
启动 Digital Star Jar.bat
```

运行期间请保持弹出的命令行窗口打开；关闭窗口后，本地开发服务也会停止。

## 构建

```bash
npm run build
```

构建产物会输出到 `dist/`。

## 部署到 GitHub Pages

项目已经包含 GitHub Actions 配置：

```text
.github/workflows/deploy.yml
```

推送到 `main` 分支后，GitHub Actions 会自动构建并发布到 GitHub Pages。

在仓库设置中确认：

```text
Settings -> Pages -> Build and deployment -> GitHub Actions
```

部署完成后访问：

```text
https://zou1008865.github.io/digital-star-jar/
```

如果页面没有立刻更新，可以等待 1 到 3 分钟，或在 GitHub 仓库的 `Actions` 页面查看部署状态。

## 数据说明

所有打卡数据都保存在当前浏览器的 `localStorage` 中：

- 刷新页面不会丢失
- 关闭浏览器后再次打开仍会保留
- 换浏览器或换电脑不会自动同步
- 清空本周只会重置本周资产，不会清空总资产

## 项目结构

```text
.
├── .github/workflows/deploy.yml  # GitHub Pages 自动部署
├── src/
│   ├── App.jsx                   # 应用主逻辑、资产、每日记录、称号系统
│   ├── components/StarJar.jsx    # Matter.js 物理瓶子、星星、音效、粒子
│   ├── main.jsx                  # React 入口
│   └── styles.css                # 页面视觉和动效样式
├── index.html
├── package.json
├── vite.config.js
└── 启动 Digital Star Jar.bat
```

## 技术栈

- React
- Vite
- Tailwind CSS
- Matter.js
- Lucide React

## 后续可扩展

- 周报或月报统计
- 导出和导入本地数据
- 自定义每日仪式名称
- 多设备同步
- 更细的成就和称号系统

## License

MIT
