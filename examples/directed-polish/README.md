# 连续细节组件示例

在仓库根目录安装已有 package-lock 的依赖后：

```sh
npm ci
node examples/directed-polish/build.mjs
python3 -m http.server 4344 --bind 127.0.0.1 --directory examples/directed-polish/site
```

打开 http://127.0.0.1:4344 。这是可暂停、拖动的七秒静音机制示例，实际导入 PhraseReveal、PageHandoff、CardResponse、TraceRule、TraceConfirm、NavigationCue 和 SoftClaySurface。保留窗口外壳，只让内容在其中交接；结果出现后停留。

不包含用户原声，不冒充已认可的 32 秒影片，也不证明新音频自动成片。素材与时间由下一条内容重新决定。
