## 简介

学校闹钟系统，可用于日常学习。

## 在线预览

[点我](http://alarm.8008088.xyz/)

## 如何使用

下载安装版exe

安装后即可使用

如需导入默认配置，可点击左下角导入配置按钮，选择`软件安装目录下\resources\default\`下的资源导入。

## 效果图

![效果图](./default/img/image-1.png)

![效果图](./default/img/image-2.png)

![效果图](./default/img/image-3.png)


## 本地运行

### 1.克隆项目到本地

   `git clone https://github.com/Juna3066/study-alarm-system.git`

###  2.执行命令

注意：本项目使用node版本是`18.16.0`

```
# 安装pnpm 因为它更快更好
npm install -g pnpm
# 安装依赖
pnpm install
# 本地运行，浏览器预览
pnpm run dev
# 打包为exe
pnpm run dist:win
```