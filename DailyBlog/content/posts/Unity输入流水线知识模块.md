# 从按键到屏幕

---

## 一、知识点总览

| 层级  | 子知识点     | 核心问题                             | 在流水线中的位置 |
| --- | -------- | -------------------------------- | -------- |
| 1   | **输入采集** | 键盘/手柄的物理信号怎么被游戏读取？               | 底层原理     |
| 2   | **输入映射** | 物理按键怎么变成游戏语义（Move/Attack）？       | 配置层      |
| 3   | **输入分发** | 系统知道 Move 有值了，该调用哪个脚本的 OnMove()？ | 代码层      |
| 4   | **输入处理** | 原始输入值要不要加工？加工什么？                 | 手感层      |
| 5   | **逻辑响应** | 收到指令后，游戏逻辑怎么决定能不能走、往哪走？          | 游戏循环     |
| 6   | **表现执行** | 逻辑说走了 0.5 米，屏幕上怎么体现？             | 视觉层      |
| 7   | **反馈感知** | 玩家大脑觉得"跟手"还是"延迟"？                | 体验层      |

---

## 二、逐层详细拆解

### 1. 输入采集（Input Acquisition）

**核心问题**：键盘、鼠标、手柄的物理信号，是怎么被游戏读取的？

**关键概念**：
- **操作系统层面**：Windows 通过 DirectInput / XInput / Raw Input API 读取硬件
- **Unity 层面**：InputSystem 包封装了上述 API，抽象为 `Keyboard`、`Mouse`、`Gamepad` 设备类
- **设备（Device）**：`Keyboard.current.wKey.isPressed` 直接读硬件
- **轮询（Polling）**：每帧去问"现在 W 键按下了吗？"——旧版 `Input.GetKey()` 就是这样
- **事件驱动（Event-driven）**：硬件发生变化时主动通知——新版 Input System 就是这样

**在 Unity 中的对应**：
```csharp
// 轮询方式（旧版）
bool isWPressed = Input.GetKey(KeyCode.W); // 每帧问一次操作系统

// 事件方式（新版）
Keyboard.current.wKey.wasPressedThisFrame; // 事件触发
```

**学习重点**：理解"轮询"和"事件驱动"的区别。轮询简单但性能差（每帧都问），事件驱动性能好但代码复杂（需要回调）。

**掌握标准**：能解释为什么 Input System 1.0+ 推荐事件驱动，但旧版 `Input.GetAxis` 还在兼容。

---

### 2. 输入映射（Input Mapping）

**核心问题**：物理按键（W/A/S/D）怎么变成游戏语义（Move/Attack/Jump）？

**关键概念**：
- **语义层 vs 物理层**：`Move` 是语义（我想向前走），`W键` 是物理（键盘上的某个开关）
- **Action（动作）**：游戏语义，如 Move、Attack、Jump
- **Binding（绑定）**：物理按键到 Action 的映射，如 `W键 → Move.Up`
- **Composite（组合）**：多个按键组合成一个向量，如 `WASD → Vector2`
- **Control Scheme（控制方案）**：一套完整的绑定配置，如"键鼠方案"、"手柄方案"

**在 Unity 中的对应**：
- `JammoActions.inputactions` 文件就是映射配置
- `Move` Action 的 `WASD Composite` 就是组合绑定

**学习重点**：理解"为什么要分语义层和物理层"。答案是：**平台适配**。PC 用 WASD，Switch 用左摇杆，但它们都是 `Move` Action。

**掌握标准**：能给一个新游戏设计一套 Input Action Asset，包含键鼠和手柄两套 Control Scheme。

---

### 3. 输入分发（Input Dispatch）

**核心问题**：Input System 知道 Move 有值了，但代码里有 10 个脚本，它怎么知道该调用哪个的 `OnMove()`？

**关键概念**：
- **分发机制**：谁负责把输入事件传递给代码？
- **Player Input 组件**：Unity 提供的分发器，挂在玩家角色上
- **4 种 Behavior 模式**：`Send Messages` / `Broadcast Messages` / `Invoke Unity Events` / `Invoke C# Events`
- **回调签名**：`OnMove(InputValue value)` 或 `OnMove(InputAction.CallbackContext context)`
- **命名约定**：`On + ActionName` 的反射查找机制

**在 Unity 中的对应**：
- `Player Input` 组件 + `Behavior = Send Messages`
- `MovementInput.cs` 里的 `OnMove` 方法被自动调用

**学习重点**：理解反射查找的过程，以及为什么商业项目不用 `Send Messages`（类型不安全、改名不报错）。

**掌握标准**：能手写一套不用 `Player Input` 组件、直接用 `InputAction.performed += OnMove` 订阅的输入系统。

---

### 4. 输入处理（Input Processing）

**核心问题**：原始输入值要不要加工？加工什么？

**关键概念**：
- **死区（Deadzone）**：摇杆轻微偏移不算有效输入（本项目 `inputMagnitude > 0.1f` 就是死区）
- **输入缓冲（Input Buffering）**：按键提前输入，等当前动作结束后自动执行（格斗游戏核心）
- **输入组合（Combo）**：连续按键形成连招判定（如"轻-轻-重"触发特殊技）
- **输入优先级**：同时按下多个键时，哪个优先？（如移动时按攻击，攻击优先）
- **抖动消除**：防止按键机械抖动导致的多次触发

**在 Unity 中的对应**：
- 死区：Input System 的 `Stick Deadzone Processor`
- 缓冲：需要自己写 `InputBuffer` 类
- 组合：需要自己写 `ComboSystem` 类

**学习重点**：死区是内置的，缓冲和组合需要自己实现。这是"手感"的核心技术。

**掌握标准**：能写一个 Input Buffer，让玩家在攻击动画后 0.3 秒内按攻击键，自动衔接下一招。

---

### 5. 逻辑响应（Logic Response）

**核心问题**：收到"向前走"的指令后，游戏逻辑怎么决定"能不能走、往哪走、走多快"？

**关键概念**：
- **游戏循环（Game Loop）**：`Update()` 每帧执行，输入处理在这里发生
- **时间增量（Delta Time）**：`Time.deltaTime` 让移动速度与帧率无关
- **状态判断**：当前是否处于硬直/死亡/攻击中？能响应输入吗？
- **组件通信**：输入脚本怎么找到移动脚本？（`GetComponent` / `FindObjectOfType` / Events）
- **解耦**：输入层知不知道动画层的存在？

**在 Unity 中的对应**：
- `MovementInput.Update()` 每帧读取 `moveAxis`
- `CombatScript` 攻击时设置 `movementInput.enabled = false`
- `InputMagnitude()` 里的 `sqrMagnitude > 0.1f` 就是状态判断

**学习重点**：理解 `Update` 的执行频率与 `Time.deltaTime` 的关系。60FPS 和 30FPS 下，角色移动速度应该一样。

**掌握标准**：能解释为什么 `controller.Move(desiredDirection * speed * Time.deltaTime)` 必须有 `Time.deltaTime`。

---

### 6. 表现执行（Presentation Execution）

**核心问题**：逻辑说"角色向前走了 0.5 米"，屏幕上怎么体现出来？

**关键概念**：
- **空间变换**：`Transform.position` / `Transform.rotation` / `Transform.localScale`
- **移动组件**：`CharacterController.Move()` vs `Rigidbody.AddForce()` vs `transform.Translate()`
- **平滑插值**：`Quaternion.Slerp`（旋转）、`Vector3.Lerp`（位置）、`Mathf.Lerp`（数值）
- **动画驱动**：Animator 参数（Float/Bool/Trigger）如何影响动画状态机
- **相机跟随**：相机怎么知道要跟角色？（Cinemachine / 自定义脚本）

**在 Unity 中的对应**：
- `CharacterController.Move()` 执行位移
- `anim.SetFloat("InputMagnitude", ...)` 驱动动画
- `Quaternion.Slerp` 实现平滑转身

**学习重点**：区分"逻辑位置"和"视觉位置"。逻辑位置是代码里的 `Vector3`，视觉位置是 `Transform.position`，两者通常一致，但有时需要插值平滑。

**掌握标准**：能手写一个不用 `CharacterController`、纯用 `transform.position += direction * speed * Time.deltaTime` 的移动系统，并理解两者的手感差异。

---

### 7. 反馈感知（Feedback Perception）

**核心问题**：玩家眼睛看到角色移动后，大脑觉得"跟手"还是"延迟"？

**关键概念**：
- **输入延迟（Input Lag）**：从按键到画面变化的时间。通常 3~5 帧（50~83ms @ 60FPS）
- **帧率与响应**：30FPS 的输入延迟是 `16.6ms × 3 = 50ms`，60FPS 是 `33ms`
- **预测与插值**：网络游戏中，客户端预测玩家输入，服务器校正
- **手感调试**：为什么同样的代码，帧率不稳时会感觉"飘"？

**在 Unity 中的对应**：
- `Time.deltaTime` 不稳定 → 移动速度忽快忽慢
- `FixedUpdate` 固定 50Hz → 物理相关输入在这里处理更稳定

**学习重点**：理解"游戏循环"和"渲染循环"可能是分离的。`Update` 是渲染帧，`FixedUpdate` 是物理帧。

**掌握标准**：能解释为什么格斗游戏要求 60FPS，而回合制游戏 30FPS 也能接受。

---

## 三、知识依赖关系（学习顺序）

```
1. 输入采集（底层原理）
      ↓
2. 输入映射（配置层）
      ↓
3. 输入分发（代码层） ← 模块1你学到这里
      ↓
4. 输入处理（手感层）
      ↓
5. 逻辑响应（游戏循环） ← 模块2、3在这里
      ↓
6. 表现执行（视觉层） ← 模块5、10、11在这里
      ↓
7. 反馈感知（体验层） ← 需要前面全部理解后，才能调出来
```

**模块1**只覆盖了 `1→2→3`，也就是"按键怎么到代码"。

**模块2**开始学 `5`（逻辑响应）和 `6`（表现执行）——角色怎么转、怎么走、怎么播动画。

---

## 四、你的学习地图

| 你正在学的 | 属于哪个子知识点 | 在整条流水线中的位置 |
|------------|------------------|----------------------|
| `JammoActions.inputactions` | 输入映射 | 第2层 |
| `Player Input` 组件 | 输入分发 | 第3层 |
| `OnMove(InputValue)` | 输入分发 | 第3层 |
| `MovementInput.cs` 整体 | 逻辑响应 + 表现执行 | 第5层 + 第6层 |
| `CharacterController` | 表现执行 | 第6层 |
| `[RequireComponent]` | 逻辑响应（组件通信） | 第5层 |
| `Update()` 每帧执行 | 逻辑响应（游戏循环） | 第5层 |

---

## 五、模块1的本质总结

> **模块1的本质是：让你理解"玩家按键"到"代码收到通知"这段路是怎么走的。**
>
> 后面的模块才是"代码收到通知后，怎么让角色动起来"。
