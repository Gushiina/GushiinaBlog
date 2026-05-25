# Unity 特性分类整理

## 一、Inspector / 编辑器可视化（最常用）

| 特性 | 作用 |
|------|------|
| `[SerializeField]` | 私有字段也能在 Inspector 显示 |
| `[HideInInspector]` | public 字段在 Inspector 隐藏 |
| `[Header("分组名")]` | 在 Inspector 里画一条分组标题 |
| `[Space(10)]` | 在 Inspector 里加空行间距 |
| `[Range(0, 100)]` | 把数字变成滑动条 |
| `[Tooltip("提示文字")]` | 鼠标悬停时显示说明 |
| `[TextArea(3, 5)]` | 把字符串变成多行文本框 |
| `[ColorUsage(true)]` | 颜色字段支持 HDR |

**示例：**

```csharp
[Header("移动设置")]
[SerializeField] float speed;
[Range(0.1f, 1f)] public float rotationSpeed;
[Space(10)]
[Tooltip("攻击时冻结移动的乘数")] public float acceleration = 1;
```

---

## 二、组件依赖与限制

| 特性                                      | 作用                 |
| --------------------------------------- | ------------------ |
| `[RequireComponent(typeof(T))]`         | 挂载此脚本时自动添加 T 组件    |
| `[DisallowMultipleComponent]`           | 禁止在同一个物体上挂两个此脚本    |
| `[AddComponentMenu("Custom/Movement")]` | 自定义 Component 菜单路径 |
|                                         |                    |

**示例：**

```csharp
[RequireComponent(typeof(CharacterController))]
[DisallowMultipleComponent]
public class MovementInput : MonoBehaviour { }
```

---

## 三、执行模式

| 特性 | 作用 |
|------|------|
| `[ExecuteInEditMode]` | 编辑器下也运行 Update（不运行时） |
| `[ExecuteAlways]` | 编辑器下始终运行（新版替代上面的） |
| `[ContextMenu("重置位置")]` | 给脚本右键菜单加功能 |

**示例：**

```csharp
[ContextMenu("Reset Position")]
void ResetPos()
{
    transform.position = Vector3.zero;
}
// 在 Inspector 脚本右上角点齿轮就能看到"Reset Position"
```

---

## 四、物理 / 碰撞回调

| 特性 | 作用 |
|------|------|
| `[SerializeReference]` | 序列化接口/抽象类字段（高级） |

> **注意：** 物理回调（`OnCollisionEnter`、`OnTriggerEnter` 等）不是特性，是 `MonoBehaviour` 的生命周期消息。

---

## 五、ScriptableObject / 编辑器扩展

| 特性 | 作用 |
|------|------|
| `[CreateAssetMenu(fileName = "xxx", menuName = "yyy")]` | 让 ScriptableObject 能在 Project 右键创建 |
| `[MenuItem("Tools/xxx")]` | 在顶部菜单栏加按钮（编辑器脚本专用） |

---

## 六、引擎内部特性（你在源码里看到的）

| 特性 | 谁在用 |
|------|--------|
| `[MethodImpl(InternalCall)]` | 运行时：标记方法在 C++ 里实现 |
| `[RequiredByNativeCode]` | 代码裁剪系统：别删掉这个，C++ 依赖它 |
| `[Writable]` | IL2CPP 绑定生成器：这个参数会被 C++ 修改 |
| `[NativeHeader("xxx.h")]` | Unity 内部编译工具：关联 C++ 头文件 |
| `[FreeFunction]` | 标记调用的是 C++ 全局函数 |
| `[ExtensionOfNativeClass]` | 标记这个 C# 类是 C++ 原生类的扩展 |

> **注意：** 这些你不需要写，了解即可。

---

## 七、完整 Inspector 美化示例

```csharp
public class PlayerSettings : MonoBehaviour
{
    [Header("基础属性")]
    [SerializeField] private float health = 100;
    [Range(1, 10)] public int level = 1;

    [Space(10)]
    [Header("移动设置")]
    [Tooltip("每秒移动距离")] public float speed = 5;
    [SerializeField, Range(0.1f, 2f)] private float rotationSpeed = 0.5f;

    [Space(10)]
    [Header("高级")]
    [HideInInspector] public int internalID;  // 内部用，不显示
}
```

---

## 记忆口诀

| 分类 | 特性 |
|------|------|
| **序列化** | `SerializeField` `HideInInspector` `SerializeReference` |
| **排版** | `Header` `Space` `Tooltip` |
| **交互** | `Range` `TextArea` `ColorUsage` `ContextMenu` |
| **依赖** | `RequireComponent` `DisallowMultipleComponent` |
| **编辑器** | `ExecuteInEditMode` `MenuItem` `CreateAssetMenu` |
