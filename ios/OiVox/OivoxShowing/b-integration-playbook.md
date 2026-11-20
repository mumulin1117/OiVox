# iOS 启动、业务 H5 和 StoreKit 接入指令

下次对接时，把下面的指令连同新项目源码、当前接口文档和脱敏返回样例一起交给执行者。遇到缺失的协议字段，在交付报告里标明负责人和待提供信息。

```text
在 [项目名、仓库路径、iOS target] 中实现 Open → H5 分发 → 业务长连接 → StoreKit 内购与验单。

先读取项目规范、当前原生启动入口、WKWebView、账户模块、StoreKit 封装和后台接口文档。复用主流程和现有消息桥。按新项目的字段、品牌、域名、商品和数据模型实现。跨项目参考只用于核对时序。交付时列出变更文件、配置入口和实际验证结果。

一、把接口契约集中到可核对的位置
1. 记录 Open 的 HTTPS 地址、方法、Headers、请求体、成功码、H5 URL、凭证、频道、WSS 字段，以及登录成功回调提供的是 URL 还是完整业务配置。
2. 记录 Welcome、Community 和业务 H5 对应的 URL 规则、消息名、action、source 及下一步。记录退出登录的回跳目标和当前账户数据保留方式。
3. 对齐长连接凭证类型、允许的服务商端点、消息封装和编码、购买事件名及订单号、商品 ID、时间戳字段。明确只有后台能向购买指令频道发布消息。确认后台是否需要在订阅成功后收到 ready 通知，若需要，补齐 URL、方法、鉴权、参数、幂等和成功条件。
4. 对齐 App Store Connect 的 Bundle ID、商品 ID、环境和验单契约。确认验单 HTTPS 域名、鉴权、收据或签名交易格式、请求字段、成功/失败返回及可重试错误。真实契约未确认时，内购保持关闭。

二、实现分发与连接生命周期
1. 每次冷启动调用 Open。网络、HTTP、业务码和缺少有效 HTTPS H5 地址均走单任务重试，按 [项目规定间隔，例如 1.5 秒] 执行。切换流程或退出时取消旧任务，忽略旧结果。
2. 先识别 Welcome 和 Community，收到当前可信主文档的确认后再进入登录注册或已登录主界面。其余 HTTPS 页面按业务配置分为业务 WebView 和普通 WebView。登录成功后的目的地址复用分发；仅有 URL 时，按协议用可信接口补齐凭证，并校验补回的目的地址与回调相符。日志仅记录分支和失败类别。
3. 有有效 TokenDetails 时直接用 token。有签名 TokenRequest 时向 Ably 兑换并读取实际返回的 token、capability、expires。明确频道优先并检查有订阅权限；没有明确频道时，只选唯一具名且具有 subscribe 或 * 权限的普通频道。零个或多个候选时保留可诊断状态。
4. WSS 使用受信任清单内的后台配置，缺省使用标准端点。由客户端构造 accessToken、format=json、v=2。对现有手写协议，收到当前连接 action=4 后发 action=10，收到同连接同频道 action=11 才标记订阅成功；同频道 action=15 才交给业务处理。连接断开、页面切换、退出或 App 退到后台时撤销就绪状态。恢复后刷新过期凭证，重新确认订阅。
5. 用现有桥让 H5 获知页面、订阅和支付状态。页面准备好、当前频道确认订阅、App 在前台且 StoreKit 和验单配置可用时才启用购买。H5 根据状态更新按钮和本地化提示。后台 ready 接口只在项目契约要求时接入，以当前有效订阅为触发点。

三、实现订单和验单闭环
1. 由业务后台生成全局唯一订单，把订单绑定到稳定账户与商品。购买入口校验当前文档、频道、命令新鲜度、商品 ID、订单 ID 和重复请求。按项目确认 B 包商品 ID 的来源和 StoreKit 提交流程。调起 StoreKit 之前持久化订单和关联 UUID。商品名和价格来自 StoreKit。
2. StoreKit 1 在 App 启动时注册 SKPaymentTransactionObserver，订单 UUID 写入 applicationUsername，回前台扫描支付队列。StoreKit 2 用 appAccountToken 关联订单，启动监听 Transaction.updates，回前台查 Transaction.unfinished。按原订单关联值和商品补单。后台核对 Apple 交易签名或收据、交易号、商品、Bundle ID、环境和原订单归属，并保证幂等发货。客户端收到明确成功后保存已验状态，再结束交易。
3. 区分取消、待授权、待验单、失败及确认成功。在断网、杀进程、重登、重复消息和 StoreKit 重复回调时避免重复购买与发货。原生结果只交还给原发起会话。刷新或重新登录后从后台查询当前账户订单，避免把旧订单结果送入新页面。

四、验证与交付
1. 用脱敏夹具覆盖 Open 失败重试、Welcome/Community 优先、普通 H5、直用 token、签名兑换、过期、显式频道权限不符、唯一/多频道、非法 WSS、错频道 action=11 和重连后迟到消息。
2. 在真机冷启动观察 Open → B WebView → action=11 → action=15 四个阶段，再用 Sandbox 商品验证取消、待支付、失败、成功、断网补单、杀进程恢复、切换账户和重复消息。记录每一步的证据和未执行项。签名 token、完整 H5/WSS URL、收据和账号信息不进入日志。
3. 交付配置文件位置、真实后端还欠缺的字段、H5 是否已部署状态监听、当前是否可发起购买，以及每个已验证环境的结果。
```

## OiVox 网页接入示例

当前原生通过 `window.message` 发送 `oivoxBusinessState` 第 1 版，并把最近状态置于 `window.OiVoxBusinessState`。`business` 和 `subscribed` 供页面展示当前连接情况，`purchaseEnabled` 控制购买可用性。`reason` 有 `notBusiness`、`pageLoading`、`background`、`subscribing`、`paymentUnavailable`、`ready`，由 H5 映射成自己的本地化提示。

```html
<button id="buy" type="button" disabled>Buy</button>
<script>
  const buy = document.getElementById('buy');

  function applyBusinessState(state) {
    if (state?.event !== 'oivoxBusinessState' || state.version !== 1) return;
    buy.disabled = state.reason !== 'ready' || state.purchaseEnabled !== true;
  }

  window.addEventListener('message', event => {
    if (event.source === null) applyBusinessState(event.data);
  });
  applyBusinessState(window.OiVoxBusinessState);
</script>
```

业务 H5 的实际购买按钮继续走项目原有后台下单逻辑，链接请求或 DOM 消息本身没有调用 StoreKit 的权限。收到账户切换、页面刷新或验单等待时，订单状态以后台查询为准。支付结果沿用配置文件的 `outgoing` 映射。

## OiVox B 包内购冻结约定

- 项目 App ID 为 `42618403`，Bundle ID 为 `com.zww.app.cn.com`。只通过本 playbook 核对参考项目的时序。字段、品牌、域名、商品和订单数据以 OiVox 为准。
- B 包使用 StoreKit 1。`data.TempoMerge` 直接填入 `SKMutablePayment.productIdentifier`，数量为 `1`，`applicationUsername` 写 B 订单 UUID。B 包跳过本地商品清单和 `SKProductsRequest`。商品 ID 有误时由后台修正。
- 1.1 的 A 包保留原有 StoreKit 2、商品清单、内购与发货流程。B 包只能处理按订单 UUID 或已保存的 Apple 交易 ID 与商品精确匹配的交易。
- `ShowingWeb/oivox-business.json` 中的验单开关保持开启。当前验单地址为 `https://oiv.fenneldrift93.bid/oivox/checkorder`；原生校验兼容旧双斜杠路径，使用配置中的原始地址，不自动改写或跟随重定向。成功条件是 HTTP `2xx` 和空 JSON 对象 `{}`。OiVox 未配置订阅就绪 HTTP 接口。
- 冷启动、回前台以及同会话订单显式重试时，系统队列为空也会重新提交本地有明确 Apple 交易号的待验单记录。无交易号、交易号关联多个本地订单的记录保留待核对；补单复用原订单和交易号，不重新购买、不本地加币、不把旧页面结果发送到新页面。并发恢复批次及同一订单的验单均合并处理，Debug 日志记录实际 HTTP 状态码。
- 同一订单的自动重验至少间隔 30 秒；主动重试可立即进行。同商品仍有可恢复旧订单时先重验，不重复提交付款。收到 HTTP 400 后的主动重试可刷新已缓存收据；启动时不得自动弹出收据刷新认证。
- 真实后端联调使用 Apple Sandbox，Run 方案默认不绑定本地 `.storekit` 文件。经本地签名收据核实的 Xcode 测试记录保留为 `storeEnvironment: "xcode"`，不得当成真实可验单记录、阻塞真实购买或伪装发货成功。无此字段的旧记录仍按原规则处理。
- H5 默认禁用购买按钮，只在 `oivoxBusinessState` 的 `reason === 'ready'` 且 `purchaseEnabled === true` 时启用提交。原生同时检查 B 页面、当前订阅、前台、支付能力和验单配置。

真机验收先核对未结束交易的归属和 Apple 环境。由归属方确认交付后结束交易。来源不明的交易保留待核对。再确认后台的 `data.TempoMerge` 就是此 Bundle ID 的真实商品 ID。保持真机解锁、亮屏并登录 Sandbox 账户。每轮点一次购买并等待 Apple 面板，90 秒内不连续点击。失败时先保留完整控制台日志，再根据证据调整一个变量。

验收顺序为 Open → `businessWebView` → `channelAttached` → `webState.ready` → 点击一次购买 → Apple 支付面板 → 完成交易 → 验单 HTTP `2xx` + `{}` → H5 `payResult` 的 `verified`。重复点击、重启和断网恢复时核对扣款和发货幂等性。验单开关和商品 ID 解析分开验证。

B 页可使用 `--oivox-safe-area-top`、`--oivox-safe-area-right`、`--oivox-safe-area-bottom`、`--oivox-safe-area-left`。同源弹窗由专用 WebView 加载，受支持的外链交给系统。相机和麦克风需在当前同源主页面主动触发，由 WebKit 请求用户同意。离页和退后台时原生会停止采集。

协议依据见 [Ably TokenRequest 规范](https://ably.com/docs/api/token-request-spec)、[Ably Capability](https://ably.com/docs/auth/capabilities)、[Apple StoreKit Transaction.updates](https://developer.apple.com/documentation/storekit/transaction/updates)、[Apple StoreKit Transaction.unfinished](https://developer.apple.com/documentation/storekit/transaction/unfinished) 和 [Apple StoreKit Transaction.finish()](https://developer.apple.com/documentation/storekit/transaction/finish%28%29)。
