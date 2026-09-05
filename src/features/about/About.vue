<script setup lang="ts">
const btn = 'about-link'
</script>

<template>
  <section class="about-page">
    <h1>关于</h1>
    <h2>Connect</h2>
    <div class="link-list">
      <a href="https://discord.gg/HPv2WDrvhq" :class="btn">
        <div class="i-mingcute:discord-line" />
        Discord
      </a>
      <a href="https://github.com/cloudflypeng" :class="btn">
        <div class="i-mingcute:github-line" />
        Github
      </a>
      <a href="https://qm.qq.com/q/jeLnZehRyo" :class="btn">
        <div class="i-mingcute:qq-line" />
        群: 762231762
      </a>
      <a href="https://afdian.com/a/meanc" :class="btn">
        <div class="i-mingcute:flash-line" />
        爱发电
      </a>
    </div>
    <h2>Others</h2>
    <ul class="notes">
      <li>本项目仅供学习交流使用，不得用于商业用途</li>
      <li>使用歌手功能，需要当前浏览器登录过 Bilibili</li>
      <li>需要交流反馈可以添加 QQ 群和 Discord</li>
      <li>统计用户达到 30000 或日活达到 1000 或爱发电赞助破千，开启手机版移植</li>
    </ul>
    <h2>Contributors</h2>
    <a href="https://github.com/cloudflypeng/eno-music/graphs/contributors">
      <img width="100" src="https://contrib.rocks/image?repo=cloudflypeng/eno-music" alt="contributors">
    </a>
  </section>
</template>

<style scoped>
.about-page {
  height: 100%;
  overflow: auto;
  padding: 32px;
}

h1 {
  margin: 0 0 24px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.03em;
}

h2 {
  margin: 24px 0 12px;
  font-size: 24px;
  font-weight: 700;
}

.link-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 280px;
}

.about-link {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 12px;
  border-radius: 4px;
  color: #fff;
  text-decoration: none;
}

.about-link:hover {
  background: rgb(255 255 255 / 10%);
}

.notes {
  margin: 0;
  padding-left: 18px;
  color: #b3b3b3;
  line-height: 1.7;
}
</style>
