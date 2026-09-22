# OiVox 本地账号模拟服务器

该服务只负责 OiVox 的账号、会话和本人资料。声音、翻译、好友、消息、好友请求、举报和拉黑继续保存在 App 本地数据层。参考项目中的 Paliro 字段、数据库名称和线上域名没有复制到 OiVox。

## 启动

要求 Node.js 22.13 或更高版本，不需要安装任何第三方依赖。

```bash
cp server/.env.example server/.env
node --env-file-if-exists=server/.env server/src/server.js
```

默认地址：`http://127.0.0.1:3102`。

```bash
curl http://127.0.0.1:3102/health
```

账号数据默认保存在 `server/data/oivox-accounts.json`，该文件不进入 Git。密码使用带随机盐的 scrypt 哈希；访问 Token 只保存 SHA-256 哈希。

## 固定测试账号

- 邮箱：`Oivox@gmail.com`
- 密码：`34563456`
- 用户 ID：`42618403-0000-4000-8000-000000000001`

启动时仅在账号不存在时创建测试账号，不覆盖用户后来修改的资料。

## 接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/health` | 健康检查 |
| POST | `/oivox/v1/auth/register` | 明确注册新账号 |
| POST | `/oivox/v1/auth/login` | 登录已有账号 |
| GET | `/oivox/v1/me/profile` | 获取本人资料 |
| PATCH | `/oivox/v1/me/profile` | 修改本人资料 |
| POST | `/oivox/v1/auth/logout` | 撤销当前会话 |

登录未知邮箱返回：

```json
{
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "message": "No account exists for this email.",
    "requestId": "..."
  }
}
```

服务器不会因为登录失败而创建账号。客户端 Step 1–6 只维护内存草稿，注册只能在 Step 7 真人验证成功后明确提交。

## 注册

```json
{
  "email": "new@example.test",
  "password": "example-123",
  "acceptedTerms": true,
  "termsVersion": "2026-09-oivox-local-v1",
  "ageRange": "25-34",
  "profile": {
    "displayName": "Nova",
    "avatarSource": "preset",
    "avatarKey": "portrait-04",
    "spokenLanguages": ["en", "fr"],
    "preferredLanguage": "en",
    "timezone": "Asia/Shanghai"
  },
  "onboarding": {
    "questionnaire": ["world", "three-plus", "everything", "voice", "evening", "both"],
    "interests": ["travel", "music", "languages"]
  },
  "verification": {
    "status": "passed",
    "method": "local-simulator",
    "attemptID": "attempt-local-001",
    "challengeID": "challenge-local-001",
    "fixtureID": "fixture-success",
    "completedAt": "2026-09-21T00:00:00.000Z"
  }
}
```

`displayName` 去除首尾空格后必须为 1–32 个字符。头像必须是已确认的有效引用：本地预设使用 `avatarSource: "preset"` + `avatarKey`；相册或相机图片使用对应 `avatarSource` + App 沙盒内稳定的 `localAssetID`。占位头像、Base64 和临时绝对路径都不是有效头像引用。缺少头像返回 `AVATAR_REQUIRED`，昵称无效返回 `INVALID_DISPLAY_NAME`。`ageRange` 只接受 `17-24`、`25-34`、`35+`，不保存精确出生日期。资料、六题问卷、2–5 个兴趣和本地模拟验证结果缺一时，服务器拒绝注册且不创建部分账号。

## 测试

```bash
node --test server/test/*.test.js
```

测试覆盖未知账号不自动创建、固定账号登录、错误密码、显式注册、头像与昵称服务端二次校验、占位头像拒绝、稳定沙盒头像引用、重复邮箱、Bearer 资料读取与修改，以及密码和 Token 不以明文落盘。

## H5 接入

客户端封装位于 `src/services/oivoxAccountApi.js`。浏览器联调时 Token 存在 `sessionStorage`；iOS 正式封装时应通过 WKWebView Bridge 把 Token 交给 Keychain，而不是长期存入 `localStorage`。

测试账号的两组好友关系、两段文字/语音会话和好友请求位于 `src/data/oivoxTestFixtures.js`，通过固定用户 ID 与服务端身份关联。
