<script setup lang="ts">
const btn = 'about-link'
</script>

<template>
  <section class="about-page">
    <h1>关于</h1>
    <h2>联系</h2>
    <div class="link-list">
      <a href="https://discord.gg/HPv2WDrvhq" :class="btn">
        <div class="i-tabler:brand-discord" />
        Discord
      </a>
      <a href="https://github.com/cloudflypeng" :class="btn">
        <div class="i-tabler:brand-github" />
        Github
      </a>
      <a href="https://qm.qq.com/q/jeLnZehRyo" :class="btn">
        <div class="i-tabler:brand-qq" />
        群: 762231762
      </a>
      <a href="https://afdian.com/a/meanc" :class="btn">
        <div class="i-tabler:bolt" />
        爱发电
      </a>
    </div>
    <h2>说明</h2>
    <ul class="notes">
      <li>本项目仅供学习交流使用，不得用于商业用途</li>
      <li>使用歌手功能，需要当前浏览器登录过 Bilibili</li>
      <li>需要交流反馈可以添加 QQ 群和 Discord</li>
      <li>统计用户达到 30000 或日活达到 1000 或爱发电赞助破千，开启手机版移植</li>
    </ul>
    <h2>贡献者</h2>
    <a href="https://github.com/cloudflypeng/eno-music/graphs/contributors">
      <img width="100" src="https://contrib.rocks/image?repo=cloudflypeng/eno-music" alt="contributors">
    </a>
  </section>
</template>

<style scoped>
.about-page {
  height: 100%;
  overflow: auto;
  padding: 32px 40px 56px;
}

h1 {
  margin: 0 0 28px;
  font-family: var(--app-font-display);
  font-size: 32px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.2;
}

/* 双线栏头 */
h2 {
  margin: 36px 0 12px;
  padding-bottom: 8px;
  border-bottom: 3px double rgb(240 235 221 / 38%);
  font-family: var(--app-font-display);
  font-size: 19px;
  font-weight: 900;
  letter-spacing: 0.06em;
  line-height: 1.3;
}

.link-list {
  display: flex;
  flex-direction: column;
  max-width: 380px;
}

/* 联系行：细栏线分隔 */
.about-link {
  display: flex;
  gap: 12px;
  align-items: center;
  height: 46px;
  padding: 0 10px;
  border-bottom: 1px solid var(--eno-border);
  border-radius: 0;
  color: var(--eno-text-2);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-decoration: none;
  transition: color 0.16s var(--eno-ease), background-color 0.16s var(--eno-ease);
}

.about-link div {
  flex-shrink: 0;
  color: var(--eno-text-3);
  font-size: 18px;
  transition: color 0.16s var(--eno-ease);
}

.about-link:hover {
  color: var(--eno-text-1);
  background: var(--eno-fill-1);
}

.about-link:hover div {
  color: var(--eno-text-1);
}

.notes {
  margin: 0;
  padding-left: 18px;
  color: var(--eno-text-3);
  font-size: 13px;
  line-height: 1.8;
}

.notes li {
  margin: 2px 0;
}

.notes li::marker {
  color: var(--eno-text-4);
}

.about-page img {
  display: block;
  border: 1px solid var(--eno-border);
  border-radius: var(--eno-radius-sm);
  background: var(--lp-ink-2);
}

@media (max-width: 860px) {
  .about-page {
    padding: 24px 16px 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .about-link,
  .about-link div {
    transition: none;
  }
}
</style>
