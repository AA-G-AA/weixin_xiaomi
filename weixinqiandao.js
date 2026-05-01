auto.waitFor();
toast("脚本开始运行");
// 1. 唤醒屏幕
if(!device.isScreenOn()){
    device.wakeUp(); // 强制唤醒
    // 2. 【关键】等待屏幕完全亮起，系统加载锁屏界面
    sleep(1500); // 建议等待1.5秒，如果手机卡顿可改为2000
    let w = device.width;
    let h = device.height;
// 3. 尝试滑动解锁 (从下往上滑)
// 起点(500, h*0.8) -> 终点(500, h*0.3)
// 注意：这里的500是固定横坐标，如果你的屏幕很宽，建议改成 w/2
    swipe(w/2, h * 0.8, w/2, h * 0.3, 300); 
    sleep(1000);
}
log("=== 脚本启动 ===");
log("屏幕尺寸: " + device.width + " x " + device.height);

const MAX_PAGES = 8;
const W = device.width;
const H = device.height;
const TARGET_TEXT = "在校园+";
let qiandaoSuccess = false;
log("目标文字: " + TARGET_TEXT);
log("最大翻页数: " + MAX_PAGES);

// 回到桌面
log("--- 按下Home键，回到桌面 ---");
home();
sleep(1000);
log("当前包名: " + currentPackage());

// 回到第一屏
log("--- 开始滑回第一屏 ---");
for (let i = 0; i < 5; i++) {
    log("右滑第 " + (i + 1) + " 次");
    swipe(W * 0.2, H * 0.5, W * 0.8, H * 0.5, 300);
    sleep(500);
}
sleep(800);
log("--- 已到达第一屏 ---");

let found = false;

for (let page = 0; page < MAX_PAGES; page++) {
    log("========== 第 " + (page + 1) + " 页 ==========");

    // 打印当前页面所有控件的文字，帮助确认小程序快捷方式叫什么
    log("--- 当前页所有可见文字控件 ---");
    let allTexts = className("android.widget.TextView").find();
    log("TextView控件总数: " + allTexts.length);
    
    // 同时用text和desc两种方式检测
    let existsByText = textContains(TARGET_TEXT).exists();
    let existsByDesc = descContains(TARGET_TEXT).exists();
    log("textContains找到: " + existsByText);
    log("descContains找到: " + existsByDesc);

    if (existsByText || existsByDesc) {
        log("*** 目标已找到！***");
        log("第" + (page + 1) + "页找到了！");

        let node = existsByText
            ? textContains(TARGET_TEXT).findOne(2000)
            : descContains(TARGET_TEXT).findOne(2000);

        if (node) {
            log("节点text: " + node.text());
            log("节点desc: " + node.desc());
            log("节点class: " + node.className());
            log("节点clickable: " + node.clickable());
            log("节点bounds: " + node.bounds());

            // 向上遍历父控件
            log("--- 向上查找可点击父控件 ---");
            let clickable = node;
            let depth = 0;
            while (clickable != null && !clickable.clickable()) {
                depth++;
                let parent = clickable.parent();
                if (parent == null) {
                    log("第" + depth + "层: 父控件为null，停止");
                    break;
                }
                log(
                    "第" + depth + "层父控件: class=" + parent.className() +
                    " clickable=" + parent.clickable() +
                    " bounds=" + parent.bounds()
                );
                clickable = parent;
            }

            if (clickable != null && clickable.clickable()) {
                log("找到可点击父控件，深度=" + depth);
                log("点击控件: " + clickable.className() + " bounds=" + clickable.bounds());
                let result = clickable.click();
                log("click()返回值: " + result);
                toast("找到了！");
            } else {
                log("未找到可点击父控件，改用坐标点击");
                let b = node.bounds();
                let cx = b.centerX();
                let cy = b.centerY();
                log("坐标点击: (" + cx + ", " + cy + ")");
                click(cx, cy);
                toast("坐标点击！");
            }

            found = true;
            break;
        } else {
            log("!!! findOne()返回null，可能控件消失了");
        }
    } else {
        log("本页未找到目标");
    }

    if (page < MAX_PAGES - 1) {
        log("--- 左滑翻到下一页 ---");
        swipe(W * 0.8, H * 0.5, W * 0.2, H * 0.5, 220);
        sleep(700);
    }
}

log("========== 遍历桌面结束 ==========");
if (found) {
    log("结果: 成功找到并点击目标");
    
    // 进入小程序后继续查看 TextView
    sleep(15000);
    log("=== 进入小程序，开始查看页面 ===");
    
    let miniAppTexts = className("android.widget.TextView").find();
    log("小程序中 TextView 总数: " + miniAppTexts.length);
    for (let i = 0; i < miniAppTexts.length; i++) {
        let t = miniAppTexts[i];
        log(
            "[" + i + "] text='" + t.text() +
            "' desc='" + t.desc() +
            "' clickable=" + t.clickable()
        );
    }
    
    // 可选：如果要点击某个特定 TextView，修改下面的条件
    // 例如点击包含"进入"的按钮
    let enterBtn = textContains("签到消息").findOne(2000);
    if (enterBtn) {
        log("找到签到消息，准备点击");
        let clickable = enterBtn;
        while (clickable != null && !clickable.clickable()) {
            clickable = clickable.parent();
        }
        if (clickable && clickable.clickable()) {
            clickable.click();
            toast("已点击签到消息");
            log("准备签到");
            sleep(5000);
            let qd1AppTexts = className("android.widget.TextView").find();
            log("签到消息中 TextView 总数: " + qd1AppTexts.length);
            for (let i = 0; i < qd1AppTexts.length; i++) {
                let t = qd1AppTexts[i];
                log(
                    "[" + i + "] text='" + t.text() +
                    "' desc='" + t.desc() +
                    "' clickable=" + t.clickable()
                );
            }
            
            qiandao = "进行中 - 未签到"
            let qiandaoentry = textContains(qiandao).findOne(2000);
            if (qiandaoentry) {
                toast("找到今天的签到消息");
                log("找到节点: " + qiandaoentry.text());
                log("节点class: " + qiandaoentry.className());
                log("节点bounds: " + qiandaoentry.bounds());
                let clickable = qiandaoentry;
                let depth = 0;
                while (clickable != null && !clickable.clickable()) {
                    depth++;
                    clickable = clickable.parent();
                    if (clickable) {
                        log("第" + depth + "层父控件可点击: " + clickable.clickable());
                    }
                }
                if (clickable && clickable.clickable()) {
                    log("找到可点击父控件，深度=" + depth);
                    clickable.click(); 

                    sleep(5000)
                    // 先查看所有 Button
                    log("=== 查看所有 Button ===");
                    let allButtons = className("android.widget.Button").find();
                    log("Button总数: " + allButtons.length);
                    for (let i = 0; i < allButtons.length; i++) {
                        let b = allButtons[i];
                        log("[" + i + "] text='" + b.text() + "' desc='" + b.desc() + "' clickable=" + b.clickable() + " bounds=" + b.bounds());
                    }

                    // 完全匹配"签到"
                    log("=== 查找完全匹配的'签到'按钮 ===");
                    qiandao_button = "签到";
                    let qiandao_btn = null;

                    // 遍历所有 Button，找到完全匹配的
                    for (let i = 0; i < allButtons.length; i++) {
                        if (allButtons[i].text() === qiandao_button) {
                            qiandao_btn = allButtons[i];
                            log("找到完全匹配的按钮，索引: " + i);
                            break;
                        }
                    }
                    if (qiandao_btn) {
                        toast("找到签到按钮");
                        log("找到节点: " + qiandao_btn.text());
                        log("节点class: " + qiandao_btn.className());
                        log("节点bounds: " + qiandao_btn.bounds());

                        let clickable = qiandao_btn;
                        let depth = 0;
                        while (clickable != null && !clickable.clickable()) {
                            depth++;
                            clickable = clickable.parent();
                            if (clickable) {
                                log("第" + depth + "层父控件可点击: " + clickable.clickable());
                            }
                        }


                        //todo 签到按钮点击
                        if (clickable && clickable.clickable()) {
                            log("找到可点击父控件，深度=" + depth);
                            log("点击签到按钮: " + clickable.className() + " bounds=" + clickable.bounds());
                            clickable.click();
                            log("已点击签到按钮")
                            toast("已点击签到按钮");
                            sleep(3000); // 等页面跳转完成
                            log("=== 查找'完成签到'按钮 ===");
                            let wcqiandao_btn = text("完成签到").findOne(2000);
                            if (wcqiandao_btn) {
                                toast("找到完成签到按钮");
                                log("节点: " + wcqiandao_btn.text());
                                
                                // 先试控件点击
                                let clickable = wcqiandao_btn;
                                while (clickable != null && !clickable.clickable()) {
                                    clickable = clickable.parent();
                                }
                                if (clickable && clickable.clickable()) {
                                    clickable.click();
                                    log("点击完成签到成功");
                                    toast("签到完成！");
                                    sleep(2000); // 等签到结果显示
                                    if (textContains("签到成功").exists() || textContains("已签到").exists()) {
                                        log("确认签到成功");
                                        qiandaoSuccess = true;
                                    } else {
                                        log("签到结果不确定，请手动确认");
                                    }
                                } else {
                                    // 坐标fallback
                                    let b = wcqiandao_btn.bounds();
                                    click(b.centerX(), b.centerY());
                                    log("坐标点击完成签到");
                                    toast("签到完成！");
                                    sleep(2000); // 等签到结果显示
                                    if (textContains("签到成功").exists() || textContains("已签到").exists()) {
                                        log("确认签到成功");
                                        qiandaoSuccess = true;
                                    } else {
                                        log("签到结果不确定，请手动确认");
                                    }
                                }
                            } else {
                                log("未找到完成签到按钮");
                            }

                        } else {
                            log("未找到可点击父控件，改用坐标点击");
                            let b = qiandao_btn.bounds();
                            let cx = b.centerX();
                            let cy = b.centerY();
                            log("坐标点击: (" + cx + ", " + cy + ")");
                            click(cx, cy);
                            toast("坐标点击签到按钮");
                        }
                    } else {
                        log("!!! 未找到签到按钮");
                    }



                }
            }else{
                log("没有找到今天的签到")
                toast("没有找到今天的签到")
            }
    }
    
} else {
    log("结果: 遍历所有页面未找到「" + TARGET_TEXT + "」");
    toast("未找到「" + TARGET_TEXT + "」，请检查名称是否正确");
}}

if (qiandaoSuccess) {
    sleep(1000);
    log("清理后台");
    toast("清理后台");
    home();
    sleep(600);
    recents();
    sleep(600);
    click(540, 2200);
    click(540, 2200);
    device.vibrate(1000);
}
