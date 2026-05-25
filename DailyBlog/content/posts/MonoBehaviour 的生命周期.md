
**5 个阶段 + 3 个特殊节点**   由反射实现了生命周期

**五个阶段IPGRE：Initialization -> Physics -> Gamelogic ->Rendering -> End**

**三个特殊节点**
### 一、Initialization（初始化）—— 出生

只在对象**诞生时**执行一次，从上到下：

| 函数           | 通俗解释                                                      |     |
| ------------ | --------------------------------------------------------- | --- |
| **Awake**    | 脚本"睁眼"，对象一加载就执行，哪怕脚本没启用（enable）也会执行                       |     |
| **OnEnable** | 脚本被**启用**时触发（比如打勾激活组件，或对象从池子里拿出来复用）                       |     |
| **Reset**    | 只在编辑器里，你第一次把脚本拖给对象时执行，用于初始化默认值                            |     |
| **Start**    | 第一次**Update 之前**执行一次。常用于获取其他组件引用，因为此时场景里其他对象基本都已 Awake 完毕 |     |

### 二、Physics（物理）—— 固定节拍

物理世界有自己的时钟，默认 **0.02 秒（50 FPS）** 一步，与画面帧率无关。如果游戏掉帧到 30 FPS，物理可能一帧跑两次。

表格

| 函数                                | 通俗解释                                                          |
| :-------------------------------- | :------------------------------------------------------------ |
| **FixedUpdate**                   | 写物理相关代码的地方（给 Rigidbody 加力、改速度）。时间间隔固定，用 `Time.fixedDeltaTime` |
| **内部动画更新**                        | Unity 内部处理 Animator 状态机、IK、写 Transform                        |
| **OnTriggerXXX / OnCollisionXXX** | 碰撞/触发回调（Enter 第一次碰，Stay 持续碰，Exit 离开）                          |
| **yield WaitForFixedUpdate**      | 协程挂起，等到下一个 FixedUpdate 再续上                                    |

**关键区别**：FixedUpdate 是物理节拍，Update 是画面节拍。不要在 Update 里直接改 Rigidbody 物理属性，否则会和物理引擎打架。

### 三、Game Logic（游戏逻辑）—— 主战场

这是你写**最多代码**的地方，每帧按顺序：

表格

| 函数                              | 通俗解释                                                                      |
| :------------------------------ | :------------------------------------------------------------------------ |
| **OnMouseXXX**                  | 鼠标悬停/点击/拖拽（很少用，UI 时代基本被 EventSystem 替代）                                   |
| **Update**                      | **每帧一次**。读输入、改 Transform 位置（非物理位移）、计时器、状态机都在这里                            |
| **yield null / WaitForSeconds** | 协程：挂起一帧 / 等几秒 / 等网页加载完 / 启动另一个协程                                          |
| **内部动画更新**                      | 再次更新 Animator（逻辑层动画混合、写属性）                                                |
| **LateUpdate**                  | **所有 Update 跑完之后**才执行。经典用途：相机跟随。你先 Update 把角色位置算好，LateUpdate 再让相机追上去，避免抖动 |

**记忆口诀**：Update 是大家各算各的，LateUpdate 是等大家都算完了再善后。

### 四、Rendering（渲染）—— 出图

从相机视角到屏幕像素，Unity 内部会调用一系列钩子。你平时很少重写这些，除非做**后处理**或**特殊渲染**：

表格

| 函数                                       | 通俗解释                                  |
| :--------------------------------------- | :------------------------------------ |
| **OnPreCull**                            | 相机决定"我要渲染哪些对象"之前                      |
| **OnWillRenderObject / OnBecameVisible** | 对象即将被渲染 / 对象进入相机视野                    |
| **OnPreRender / OnPostRender**           | 相机开始渲染场景前 / 后（可用 GL 画线）               |
| **OnRenderImage**                        | 拿到最终画面图，做全屏后处理（Bloom、模糊、色调映射）         |
| **OnDrawGizmos**                         | 只在 Scene 视图画辅助线（调试用，玩家看不到）            |
| **OnGUI**                                | 旧版 IMGUI 系统，每帧可能调多次，现在基本只用于编辑器插件或调试面板 |
|                                          |                                       |
### 五、End of Frame / Pausing / Decommissioning（收尾与销毁）

表格

| 函数                          | 通俗解释                                 |
| :-------------------------- | :----------------------------------- |
| **yield WaitForEndOfFrame** | 协程挂到这一帧所有渲染完成后（常用于截图，等画面完全生成）        |
| **OnApplicationPause**      | 游戏切后台 / 手机按 Home 键时触发                |
| **OnApplicationQuit**       | 游戏关闭前                                |
| **OnDisable**               | 脚本被禁用、对象被隐藏、对象回对象池时触发（与 OnEnable 成对） |
| **OnDestroy**               | 对象被销毁时（释放资源、取消事件监听，防止内存泄漏）           |

![[-NotePic/Mono.png]]

频度

// AI生成仅供参考 以下内容还在学习中
## 🔴 高频组：几乎每项目都会用到

### 1. Awake —— "抢地盘"

**场景**：两个脚本互相引用，谁先去 `GetComponent` 找谁？

csharp

复制

```csharp
// 玩家脚本
void Awake() {
    inventory = GetComponent<<Inventory>(); // 先保证自己零件齐全
}
void Start() {
    inventory.AddItem(sword); // 再去动别人的数据
}
```

**原则**：Awake 做"内部初始化"，Start 做"外部交互"。

---

### 2. OnEnable / OnDisable —— "对象池的灵魂"

**场景**：射击游戏的子弹、UI 面板反复显示/隐藏。

csharp

复制

```csharp
void OnEnable() {
    // 子弹从对象池拿出来复用时，重置状态
    currentLife = 3f;
    trailRenderer.Clear();
}

void OnDisable() {
    // 回收到池子前，取消所有协程和事件监听
    StopAllCoroutines();
    // 否则下次拿出来时，上一个子弹的协程还在跑！
}
```

**没有这对函数，对象池会泄漏状态和事件。**

---

### 3. FixedUpdate —— "物理世界的时钟"

**场景**：给 Rigidbody 施力、做射线检测判断地面。

csharp

复制

```csharp
void FixedUpdate() {
    // 玩家按住空格跳跃——必须写在这里，不能写 Update
    if (isGrounded) {
        rb.AddForce(Vector3.up * jumpForce, ForceMode.Impulse);
    }
}
```

**坑**：在 Update 里改 `rb.velocity` 会和物理引擎打架，导致抖动或穿模。

---

### 4. LateUpdate —— "相机跟拍"

**场景**：第三人称跟随相机。

csharp

复制

```csharp
void LateUpdate() {
    // 等玩家 Update 里跑完、位置定死了，相机再追
    transform.position = player.position + offset;
}
```

**如果在 Update 里同时移动玩家和相机，这一帧会看到相机追的是上一帧的玩家位置，画面会抖。**

---

### 5. OnDestroy —— "擦屁股"

**场景**：敌人死亡时，取消它订阅的全局事件，防止"幽灵回调"。

csharp

复制

```csharp
void OnDestroy() {
    GameManager.Instance.OnWaveStart -= Attack; // 取消订阅
}
```

**不清理 = 内存泄漏 + 空引用异常。**

---

## 🟡 中频组：特定系统必用

表格

|函数|你遇到这个问题时想起它|
|:--|:--|
|**OnCollisionEnter**|子弹打到墙要播放火花粒子；玩家踩到陷阱扣血|
|**OnTriggerEnter**|进入存档点、拾取道具（Trigger 没有物理阻挡，只检测范围）|
|**OnApplicationPause**|手机按 Home 键回微信，暂停游戏并保存进度|
|**OnApplicationQuit**|PC 游戏关闭前写一次存档|
|**协程 (yield)**|技能 CD 3 秒后恢复；敌人受伤闪白 0.2 秒；过场动画分镜|

---

## ⚫ 低频组：特定岗位才碰

表格

| 函数                | 谁在用         | 场景                          |
| :---------------- | :---------- | :-------------------------- |
| **OnRenderImage** | 图形程序员       | 做全屏后处理（Bloom、景深、屏幕扭曲）       |
| **OnDrawGizmos**  | 关卡设计师/工具程序员 | 在 Scene 视图画 AI 巡逻范围、攻击半径    |
| **OnGUI**         | 编辑器插件开发     | 写 Unity 内置的 Inspector 或调试窗口 |
| **OnAnimatorIK**  | 动作/技术美术     | 让角色头部始终盯着玩家，脚站在不平地面自适应      |

---

## 🎯 一张"遇事不决"速查表

plain

复制

```plain
要初始化自己内部零件 → Awake
要和别的对象打招呼/要数据 → Start
要每帧改 Transform 位置（非物理）→ Update
要给 Rigidbody 施力/做物理检测 → FixedUpdate
要等别人跑完再善后（相机跟随）→ LateUpdate
对象反复显示/隐藏/进对象池 → OnEnable / OnDisable
对象被销毁时清理事件 → OnDestroy
碰到东西要反应 → OnCollision / OnTrigger
等几秒再执行/分阶段执行 → 协程 + yield
切后台/关游戏要保存 → OnApplicationPause / Quit
```

---

## 总结

> **Start 和 Update 是骨架，撑起游戏的基本循环；其他函数是器官，在特定时机做特定的事。**

你现在初学，确实可以只写 Start + Update 把 Demo 跑起来。但当你开始做**对象池、物理平台跳跃、相机跟随、技能 CD、移动端适配**时，就会自然遇到上面这些函数——到时候回来查这张表就行。