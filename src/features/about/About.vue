<script setup lang="ts">
const btn = 'flex items-center gap-1 text-[14px] py-1 border-$eno-border border-l-0 hover:border-l-5 hover:ml-2 hover:pl-2 duration-300 mb-2'
</script>

<template>
  <section class="w-full h-screen overflow-auto pb-30">
    <!-- logo -->
    <div class="p-5 flex flex-col gap-1 mx-auto">
      <!-- <div class="text-3xl text-bold mb-1 flex">
        Logo
      </div>
      <img :src="Logo" alt="logo" class="w-[100px] object-contain"> -->
      <!-- 联系方式 -->
      <div class="text-3xl text-bold mb-1">
        Connect
      </div>
      <div class="pl-5">
        <a href="https://discord.gg/HPv2WDrvhq" :class="`${btn} border-purple-3`">
          <div class="i-mingcute:discord-line w-[20px] text-[20px]" />
          <span class="text-[14px]`">Discord</span>
        </a>
        <a href="https://github.com/cloudflypeng" :class="`${btn} border-gray-3`">
          <div class="i-mingcute:github-line w-1em h-1em text-[20px]" />
          <span class="text-[14px]">Github</span>
        </a>
        <a href="https://qm.qq.com/q/jeLnZehRyo" :class="`${btn} border-blue`">
          <div class="i-mingcute:qq-line w-1em h-1em text-[20px]" />
          <span class="text-[14px]">群:762231762</span>
        </a>
        <a href="https://afdian.com/a/meanc" :class="`${btn} border-pink`">
          <div class="i-mingcute:flash-line w-1em h-1em text-[20px]" />
          <span class="text-[14px]">爱发电</span>
        </a>
      </div>
      <div class="text-3xl text-bold mb-1">
        Others
      </div>
      <!-- info -->
      <ul class="flex flex-col gap-3 text-[14px] leading-relaxed opacity-80 pl-5">
        <li class="flex items-center gap-2 hover:opacity-100 transition-opacity">
          <div class="i-mingcute:information-line w-1rem h-1rem text-$eno-primary" />
          本项目仅供学习交流使用，不得用于商业用途
        </li>
        <li class="flex items-center gap-2 hover:opacity-100 transition-opacity">
          <div class="i-mingcute:user-4-fill w-4 h-4 text-$eno-primary" />
          使用歌手功能, 需要当前浏览器登录过bilibili
        </li>
        <li class="flex items-center gap-2 hover:opacity-100 transition-opacity">
          <div class="i-mingcute:message-3-fill w-4 h-4 text-$eno-primary" />
          需要交流反馈可以添加qq群和discord, 长期在线
        </li>
        <li class="flex items-center gap-2 hover:opacity-100 transition-opacity">
          <div class="i-mingcute:gift-fill w-4 h-4 text-$eno-primary" />
          统计用户达到30000 or 日活达到1000 or 爱发电赞助破千 开启手机版移植🫡🫡
        </li>
      </ul>
      <div class="text-3xl text-bold my-1 mb-3">
        Contributors
      </div>
      <a href="https://github.com/cloudflypeng/eno-music/graphs/contributors">
        <img class="ml-5" width="100px" src="https://contrib.rocks/image?repo=cloudflypeng/eno-music">
      </a>
    </div>
  </section>
</template>
