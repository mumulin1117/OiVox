# OiVox v2 Signal Contract 映射

## 目标与边界

该协议只替换账户本地服务的 HTTP 传输名称。页面、业务状态、持久化数据和服务端内部模型继续使用原有领域字段，统一在 `src/services/oivoxSignalContract.js` 边界编码和解码。

受保护行为：

- 登录不会自动创建账号；
- 注册只在 Step 7 验证成功后提交一次；
- Token 生命周期、Keychain/sessionStorage 归属不变；
- 本地账号 JSON 文件不迁移、不清空；
- 固定测试账号 ID 和现有用户资料保持不变；
- 旧 HTTP 路径不再提供业务响应，避免新旧协议并行绕过。

## 路径映射

| 用途 | 旧路径 | v2 路径 |
| --- | --- | --- |
| 健康检查 | `GET /health` | `GET /oivox/v2/echo/pulse` |
| 注册 | `POST /oivox/v1/auth/register` | `POST /oivox/v2/orbit/seed` |
| 登录 | `POST /oivox/v1/auth/login` | `POST /oivox/v2/orbit/enter` |
| 获取本人资料 | `GET /oivox/v1/me/profile` | `GET /oivox/v2/echo/self` |
| 修改本人资料 | `PATCH /oivox/v1/me/profile` | `PATCH /oivox/v2/echo/self` |
| 退出 | `POST /oivox/v1/auth/logout` | `POST /oivox/v2/orbit/leave` |

标准头 `Authorization` 和 `Content-Type` 保持不变。自定义防重头由 `Idempotency-Key` 改为 `x-oivox-seed-ref`。

## 请求字段映射

### 注册顶层

| 旧字段 | v2 字段 |
| --- | --- |
| `email` | `echoAddress` |
| `password` | `signalPhrase` |
| `acceptedTerms` | `accordMark` |
| `termsVersion` | `accordEdition` |
| `ageRange` | `seasonBand` |
| `profile` | `speakerShape` |
| `onboarding` | `journeySketch` |
| `verification` | `presenceSeal` |

### 资料字段

| 旧字段 | v2 字段 |
| --- | --- |
| `displayName` | `echoName` |
| `handle` | `signalTag` |
| `avatarSource` | `portraitOrigin` |
| `avatarKey` | `portraitMark` |
| `localAssetID` | `portraitVaultRef` |
| `countryCode` | `regionMark` |
| `timezone` | `daylightBand` |
| `aboutMe` | `speakerNote` |
| `spokenLanguages` | `tongueSet` |
| `preferredLanguage` | `primaryTongue` |
| `ageRange` | `seasonBand` |
| `interests` | `curiositySet` |

### 注册问卷和验证

| 旧字段 | v2 字段 |
| --- | --- |
| `questionnaire` | `discoveryAnswers` |
| `interests` | `curiositySet` |
| `status` | `sealState` |
| `method` | `sealMode` |
| `attemptID` | `sealAttemptRef` |
| `challengeID` | `sealChallengeRef` |
| `fixtureID` | `sealFixtureRef` |
| `completedAt` | `sealFinishedAt` |

## 成功响应字段映射

### 会话响应

| 旧字段 | v2 字段 |
| --- | --- |
| `user` | `speakerRecord` |
| `accessToken` | `orbitToken` |
| `tokenType` | `orbitScheme` |
| `expiresAt` | `orbitEndsAt` |
| `idempotentReplay` | `seedReplay` |
| `localReviewFixture` | `reviewEcho` |

### 用户响应

| 旧字段 | v2 字段 |
| --- | --- |
| `id` | `speakerID` |
| `email` | `echoAddress` |
| `emailVerified` | `echoConfirmed` |
| `profileComplete` | `speakerReady` |
| `isTestAccount` | `reviewFixture` |
| `localReviewFixture` | `reviewEcho` |
| `wallet` | `echoMeter` |
| `coinBalance` | `echoUnits` |
| `profile` | `speakerShape` |
| `terms` | `accordRecord` |
| `version` | `accordEdition` |
| `acceptedAt` | `accordStampedAt` |
| `createdAt` | `seededAt` |
| `updatedAt` | `revisedAt` |

### 扩展资料响应

| 旧字段 | v2 字段 |
| --- | --- |
| `curiousRegion` | `horizonInterest` |
| `conversationTopic` | `dialogTheme` |
| `replyPreference` | `responseStyle` |
| `onlineWindow` | `activeSpan` |
| `aiAssistance` | `assistChoice` |
| `verified` | `presenceReady` |
| `verificationMethod` | `presenceMode` |
| `verifiedAt` | `presenceStampedAt` |

## 状态与错误响应字段映射

| 旧字段 | v2 字段 |
| --- | --- |
| `ok` | `pulseReady` |
| `service` | `pulseLabel` |
| `error` | `fault` |
| `code` | `faultMark` |
| `message` | `faultText` |
| `requestId` | `traceRef` |

错误码值保持稳定，例如 `ACCOUNT_NOT_FOUND`、`INVALID_PASSWORD`、`EMAIL_IN_USE`，客户端仍按稳定错误码完成八语言提示，不依赖英文错误文本。

## 依赖与持久化矩阵

| 数据 | 所有者 | v2 影响 |
| --- | --- | --- |
| 密码哈希 | Node 本地服务 JSON | 无，仍为带盐 scrypt |
| 会话 Token 哈希 | Node 本地服务 JSON | 无，仍只保存 SHA-256 哈希 |
| 浏览器会话 Token | `sessionStorage` | 无，解码后按原键保存 |
| iOS 会话 Token | SecureStore/Keychain | 无，解码后按原键保存 |
| 当前用户本地缓存 | H5 `localStorage` | 无，继续保存领域模型 |
| 原生审核账号资料 | `UserDefaults` | 无，内部仍保存领域模型，桥接时转换 |

## Account Bridge 矩阵

| 方向 | Service/Method | 输入 | 输出 | 失败 |
| --- | --- | --- | --- | --- |
| H5 → iOS | `Account.request` | v2 路径、方法、v2 Body、Token | v2 响应 | 统一 BridgeError |
| H5 → HTTP | Fetch | v2 路径、标准头、自定义防重头、v2 Body | v2 响应 | `fault` 包装 |
| 传输 → 页面 | 集中解码器 | v2 响应 | 原领域对象 | `OiVoxApiError` |

## 验收与回退

- 服务端测试必须覆盖 v2 原始响应中不存在旧字段；
- 自动扫描所有公开路径、自定义头和 v2 字段，拒绝禁用片段；
- 旧登录路径必须返回 `404 NOT_FOUND`；
- 注册、登录、读取资料、修改资料、退出、会话恢复需要回归；
- 回退时应整体回退服务端、H5 contract 和原生离线适配器，不得只回退其中一层。
