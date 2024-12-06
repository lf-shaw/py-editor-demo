# monaco editor 测试

**NOTE** vite 的资源加载问题参考 [这里](https://github.com/TypeFox/monaco-languageclient/issues/751#issuecomment-2371827837)

## 开启 language server

使用 `monaco-languageclient` 的 `python` server

```sh
git clone https://github.com/TypeFox/monaco-languageclient.git
cd monaco-languageclient
npm i
# Cleans-up, compiles and builds everything
npm run build
```

然后启动 `python` server

```sh
npm run start:example:server:python
```

## 测试纯 vue 环境

切换分支到 `pure-vue`，运行

```sh
npm i
npm run dev
```

点击 `Editor` 标签

## 测试 pure-admin 框架

> 框架来自于[这里](https://github.com/pure-admin/pure-admin-thin)，文档在[这里](https://pure-admin.cn/pages/introduction/)

在主分支运行

```sh
pnpm i
pnpm dev
```
