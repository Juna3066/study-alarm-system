## 1.复制dist下所有内容

复制到当前文件夹下

## 2. **确保项目结构**
首先，确保项目文件结构如下：
```
my-electron-app/
├── assets/
├── index.html
├── main.js
├── package.json
```

## 3. 更新index.html

确保 HTML 文件正确引用本地资源：资源引用前的`/`去掉

~~~
    <script type="module" crossorigin src="/assets/index-BAtQzV4S.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Df8Wp8m_.css">
  
~~~

应改为

~~~
    <script type="module" crossorigin src="assets/index-BAtQzV4S.js"></script>
    <link rel="stylesheet" crossorigin href="assets/index-Df8Wp8m_.css">
~~~

## 4.安装依赖
   ```bash
   npm install 
   ```

## 5.打包应用
   ```bash
   npm run packager
   ```


这个命令将为您的应用生成一个 Windows 平台的 `.exe` 文件，并将其保存在 `dist/` 目录下。

您可以将 `dist/` 文件夹中的生成文件打包并分享给用户。

## 其他说明

涉及的依赖说明

如果election相关依赖报错，删除package.json中electron,electron-packager版本信息，重新安装。

```json
  "devDependencies": {
    "electron": "^39.2.4", 
    "electron-packager": "^17.1.2"
  }
```

重新安装命令

```bash
npm install electron --save-dev
npm install electron-packager --save-dev
npx electron-packager . study-alarm-system-v1.0.0 --platform=win32 --arch=x64 --out=release --overwrite --icon=external-resources/icon.ico
```


