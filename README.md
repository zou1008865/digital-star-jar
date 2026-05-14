# Digital Star Jar

一个用于自律打卡的单页面 Web 应用。它把线下行动变成一颗颗落入玻璃瓶的星星，让每天的完成感变得可见、可听、可积累。

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

## 数据说明

所有打卡数据都保存在当前浏览器的 `localStorage` 中：

- 刷新页面不会丢失
- 关闭浏览器后再次打开仍会保留
- 换浏览器或换电脑不会自动同步
- 清空本周只会重置本周资产，不会清空总资产

## 技术栈

- React
- Vite
- Tailwind CSS
- Matter.js
- Lucide React

