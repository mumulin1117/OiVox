# OiVox 本地账号模拟服务器

该服务只负责 OiVox 的账号、会话和本人资料。声音、翻译、好友、消息、好友请求、举报和拉黑继续保存在 App 本地数据层。参考项目中的 Paliro 字段、数据库名称和线上域名没有复制到 OiVox。

## 启动

要求 Node.js 22.13 或更高版本，不需要安装任何第三方依赖。

```bash
cp server/.env.example server/.env
node --env-file-if-exists=server/.env server/src/server.js
```

默认地址：`http://0.0.0.0:3102`（本机访问可使用 `127.0.0.1`）。

```bash
curl http://127.0.0.1:3102/oivox/v2/echo/pulse
```

### iPhone 真机联调

真机不能通过 `localhost` 或 `127.0.0.1` 访问 Mac；这两个地址在 iPhone 上指向 iPhone 自身。先确保 iPhone 与 Mac 位于同一局域网，再让服务监听所有本地网络接口：

```bash
OIVOX_SERVER_HOST=0.0.0.0 node --env-file-if-exists=server/.env server/src/server.js

如果已经创建过 `server/.env`，请确认其中的 `OIVOX_SERVER_HOST` 也为 `0.0.0.0`；否则该文件会覆盖默认值，手机仍然无法连接。
```

OiVox 的 Debug 配置会在 WKWebView 启动前注入账户服务器地址，当前开发机使用稳定的 Bonjour 地址：

```bash
http://linqiannew.local:3102
```

因此重新生成 WebApp 不会丢失真机调试地址。如果更换开发机，应修改 Xcode Debug 构建设置中的 `OIVOX_ACCOUNT_API_URL`，不要把临时地址写入 WebApp。Release 配置保持为空；生产环境必须配置可用的 HTTPS 账户服务。首次连接时需允许 OiVox 访问本地网络。

账号数据默认保存在 `server/data/oivox-accounts.json`，该文件不进入 Git。密码使用带随机盐的 scrypt 哈希；访问 Token 只保存 SHA-256 哈希。

## 固定测试账号

- 邮箱：`Oivox@gmail.com`
- 密码：`34563456`
- 用户 ID：`42618403-0000-4000-8000-000000000001`

启动时仅在账号不存在时创建测试账号，不覆盖用户后来修改的资料。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/oivox/v2/echo/pulse` | 健康检查 |
| POST | `/oivox/v2/orbit/seed` | 明确注册新账号 |
| POST | `/oivox/v2/orbit/enter` | 登录已有账号 |
| GET | `/oivox/v2/echo/self` | 获取本人资料 |
| PATCH | `/oivox/v2/echo/self` | 修改本人资料 |
| POST | `/oivox/v2/orbit/leave` | 撤销当前会话 |

登录未知邮箱返回：

```json
{
  "fault": {
    "faultMark": "ACCOUNT_NOT_FOUND",
    "faultText": "No account exists for this email.",
    "traceRef": "..."
  }
}
```

服务器不会因为登录失败而创建账号。客户端 Step 1–6 只维护内存草稿，注册只能在 Step 7 真人验证成功后明确提交。

## 注册

```json
{
  "echoAddress": "new@example.test",
  "signalPhrase": "example-123",
  "accordMark": true,
  "accordEdition": "2026-09-oivox-legal-v2",
  "seasonBand": "25-34",
  "speakerShape": {
    "echoName": "Nova",
    "portraitOrigin": "preset",
    "portraitMark": "portrait-04",
    "tongueSet": ["en", "fr"],
    "primaryTongue": "en",
    "daylightBand": "Asia/Shanghai"
  },
  "journeySketch": {
    "discoveryAnswers": ["world", "three-plus", "everything", "voice", "evening", "both"],
    "curiositySet": ["travel", "music", "languages"]
  },
  "presenceSeal": {
    "sealState": "passed",
    "sealMode": "local-dynamic-face",
    "sealAttemptRef": "attempt-local-001",
    "sealChallengeRef": "challenge-local-001",
    "sealFixtureRef": "dynamic-face-v1",
    "sealFinishedAt": "2026-09-21T00:00:00.000Z"
  }
}
```

`echoName` 去除首尾空格后必须为 1–32 个字符。头像必须是已确认的有效引用：本地预设使用 `portraitOrigin: "preset"` + `portraitMark`；相册或相机图片使用对应 `portraitOrigin` + App 沙盒内稳定的 `portraitVaultRef`。占位头像、Base64 和临时绝对路径都不是有效头像引用。缺少头像返回 `AVATAR_REQUIRED`，昵称无效返回 `INVALID_DISPLAY_NAME`。`seasonBand` 只接受 `17-24`、`25-34`、`35+`，不保存精确出生日期。资料、六题问卷、2–5 个兴趣和本地动态人脸验证摘要缺一时，服务器拒绝注册且不创建部分账号。

注册请求的自定义防重头为 `x-oivox-seed-ref`。完整旧协议到 v2 signal contract 的映射见 `docs/oivox-signal-contract-v2.md`。

## 测试

```bash
node --test server/test/*.test.js
```

测试覆盖未知账号不自动创建、固定账号登录、错误密码、显式注册、头像与昵称服务端二次校验、占位头像拒绝、稳定沙盒头像引用、重复邮箱、Bearer 资料读取与修改，以及密码和 Token 不以明文落盘。

## H5 接入

客户端封装位于 `src/services/oivoxAccountApi.js`，集中映射位于 `src/services/oivoxSignalContract.js`。浏览器联调时 Token 存在 `sessionStorage`；iOS 正式封装时应通过 WKWebView Bridge 把 Token 交给 Keychain，而不是长期存入 `localStorage`。

测试账号的两组好友关系、两段文字/语音会话和好友请求位于 `src/data/oivoxTestFixtures.js`，通过固定用户 ID 与服务端身份关联。
