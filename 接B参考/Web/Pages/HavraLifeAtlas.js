// Called by the host only in the existing bundled Atlas main frame.
let store, router;
for (let attempt = 0; attempt < 50 && !store; attempt++) {
    const globals = document.getElementById("app")?.__vue_app__?.config?.globalProperties;
    store = globals?.$pinia?._s?.get("common-template");
    router = globals?.$router;
    if (!store) await new Promise(resolve => setTimeout(resolve, 60));
}
if (!store || !router) return false;

// Initialize the same data that the legacy splash prepared before routing to Home.
store.prepare_app_data();
if (!store.launch_state.has_completed_first_splash) store.complete_first_splash();

const accounts = store.auth_account_list;
let account;
if (usesTestProfile) {
    const findTestAccount = () => accounts.find(item => item.account_id === "account_havra_review");
    account = findTestAccount();
    if (!account && store.ensure_demo_account()) account = findTestAccount();
} else {
    // The address and password belong to the existing local store, separately from the dist credentials.
    const deleted = store.deleted_account_email_list;
    let sequence = 0;
    let address = localKey + "@havra.invalid";
    while (deleted.includes(address)) {
        sequence++;
        address = localKey + "." + sequence + "@havra.invalid";
    }
    account = accounts.find(item => item.email === address);
    if (!account) {
        const userName = displayName === "@" ? "Havra Member" : displayName;
        store.signup_form = {email: address, password: localPassword, user_name: userName};
        if (!store.sign_up()) return false;
        account = accounts.find(item => item.email === address);
    }
}
if (!account) return false;
if (!store.auth_state.is_logged_in || store.current_user.user_id !== account.user_id) {
    store.login_form = {email: account.email, password: account.password};
    if (!store.sign_in()) return false;
}
store.login_form = {email: "", password: ""};
store.accept_eula();

if (!window.__havraLifeWatchingAtlasSignOut) {
    window.__havraLifeWatchingAtlasSignOut = true;
    store.$onAction(({name, after}) => {
        if (name !== "sign_out" && name !== "delete_current_account") return;
        after(result => {
            if (name === "delete_current_account" && result !== true) return;
            document.documentElement.style.visibility = "hidden";
            window.webkit.messageHandlers.havraLifeSignOut.postMessage({action: "logout"});
        });
    }, true);
}
await router.replace("/pages/home/index");
const homeIsReady = () => store.auth_state.is_logged_in
    && router.currentRoute.value.path === "/pages/home/index"
    && document.querySelector(".home-content") !== null;
for (let attempt = 0; attempt < 50 && !homeIsReady(); attempt++) {
    await new Promise(resolve => setTimeout(resolve, 60));
}
if (!homeIsReady()) return false;
await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
if (!homeIsReady()) return false;

const detailBridge = window.webkit?.messageHandlers?.havraLifeDetailLoading;
const detailStyleID = "havra-detail-loading-style";
if (typeof detailBridge?.postMessage === "function" && !document.getElementById(detailStyleID)) {
    const detailPaths = new Set([
        "search", "post-detail", "video-detail", "user-profile", "user-profile-pending",
        "user-profile-mutual", "connections", "chat-list", "chat-detail", "video-call",
        "tag-library", "library", "my-post-detail", "edit-post", "edit-profile", "coins",
        "purchase-history", "settings", "blocked-users", "report", "terms", "privacy",
        "photo-post", "photo-success", "video-vlog", "video-success"
    ].map(page => "/pages/" + page + "/index"));
    const originalLoading = ".secondary-page-loading, .album-page .skeleton-screen--library";
    const detailStyle = document.createElement("style");
    detailStyle.id = detailStyleID;
    detailStyle.textContent = originalLoading + " { display: none !important; }";
    document.head.append(detailStyle);

    let sequence = 0;
    let activeDetail;
    const notify = (action, detail) => {
        try {
            detailBridge.postMessage({action, id: detail.id});
        } catch {
            // The native timeout also releases the overlay if the WebView is interrupted.
        }
    };
    const start = fullPath => {
        const detail = {id: String(++sequence), fullPath, started: performance.now()};
        activeDetail = detail;
        notify("start", detail);
        return detail;
    };
    const finish = detail => {
        if (activeDetail !== detail) return;
        activeDetail = undefined;
        notify("finish", detail);
    };
    const detailIsReady = path => {
        const page = Array.from(document.querySelectorAll("uni-page[data-page]")).reverse()
            .find(element => element.dataset.page === path.slice(1) && element.getClientRects().length > 0);
        const content = page?.querySelector("uni-page-body");
        return Boolean(content?.firstElementChild) && !content.querySelector(originalLoading);
    };
    const waitForDetail = async (detail, isReady, isOpen = () => true) => {
        try {
            while (activeDetail === detail && router.currentRoute.value.fullPath === detail.fullPath && isOpen()) {
                const elapsed = performance.now() - detail.started;
                if (elapsed >= 1600 || (elapsed >= 420 && isReady())) return;
                await new Promise(resolve => setTimeout(resolve, 45));
            }
        } finally {
            finish(detail);
        }
    };

    // Atlas uses push and replace for forward navigation, and the history stack for Back.
    for (const method of ["push", "replace"]) {
        const navigate = router[method].bind(router);
        router[method] = location => {
            const target = router.resolve(location);
            if (!store.auth_state.is_logged_in || !detailPaths.has(target.path) ||
                target.fullPath === router.currentRoute.value.fullPath) return navigate(location);

            const detail = start(target.fullPath);
            try {
                const navigation = navigate(location);
                navigation.then(failure => {
                    if (failure) finish(detail);
                    else void waitForDetail(detail, () => detailIsReady(target.path));
                }, () => finish(detail));
                return navigation;
            } catch (error) {
                finish(detail);
                throw error;
            }
        };
    }
    router.afterEach((to, from, failure) => {
        if (!failure && activeDetail && to.fullPath !== activeDetail.fullPath) finish(activeDetail);
    });

    // Life Atlas opens its topic and moment panels in the Home document without changing the Vue route.
    window.addEventListener("click", event => {
        const route = router.currentRoute.value;
        const target = event.target;
        if (!store.auth_state.is_logged_in || route.path !== "/pages/home/index" ||
            event.button !== 0 || !(target instanceof Element)) return;
        if (target.closest("[data-havra-like], [data-havra-care]")) return;
        const topic = target.closest(".havra-life-atlas-section .havra-life-card[data-havra-topic]");
        const moment = target.closest(".havra-atlas-overlay .havra-topic-moment-card[data-havra-moment]");
        if (!topic && !moment) return;

        const selector = topic ? ".havra-atlas-overlay .havra-topic-hero" : ".havra-atlas-overlay .havra-moment-main";
        const previous = document.querySelector(selector);
        const detail = start(route.fullPath);
        setTimeout(() => {
            if (activeDetail !== detail) return;
            const panel = document.querySelector(selector);
            if (!panel || panel === previous) {
                finish(detail);
                return;
            }
            void waitForDetail(detail, () => panel.getClientRects().length > 0, () => panel.isConnected);
        }, 0);
    }, true);
}
return true;
