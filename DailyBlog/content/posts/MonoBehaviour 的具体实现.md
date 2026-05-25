
##  构造函数

```Csharp
public MonoBehaviour()
    {
        ConstructorCheck(this);
    }
```

 这就是调用了一个构造检查，合理的构造（挂载在对象上）就会通过，否则运行时出错。
 不能直接new MonoBehaviour对象
 
 虽然构造函数是 public 的，但第一行就是 ConstructorCheck(this)。
  这是一个 ``[MethodImpl(MethodImplOptions.InternalCall)]``，说明检查逻辑在 C++ 引擎里。如果你用 new MovementInput()：
  1. C# 侧构造成功
  2. 进入 ConstructorCheck
  3. C++ 检测到：这个对象没有绑定到任何 GameObject
  4. 报错/抛出异常
  这就是为什么 Unity 文档说"不要 new MonoBehaviour"——C++ 侧会拒绝。

从MonoBehaviour.cs的代码来看，这里根本就没有那些生命周期函数的定义！
说明他们不是用虚函数重载，而是约定命名 + 引擎反射调用。
C++ 引擎维护了一个所有 MonoBehaviour 实例的列表，每帧遍历并检查：
  -  "这个脚本有没有叫 Update 的方法？" → 有 → 调用
  - "有没有叫 FixedUpdate 的方法？" → 有 → 调用
  这些生命周期回调完全在 C++ 侧管理，C# 层根本不需要声明它们。







// 以下内容还待深度学习
## Invoke 系统（延迟调用）

```csharp
public void Invoke(string methodName, float time)
{
    InvokeDelayed(this, methodName, time, 0f);
}
```

Unity 的 `Invoke` 不是 C# 的 `Task.Delay` 或 `Thread.Sleep`，而是**引擎级的时间调度**：

- 你把方法名和延迟时间交给引擎
- 引擎在 C++ 侧维护一个计时器队列
- 时间到了，通过反射调用你的方法

这也是为什么 `Invoke` 可以跨帧工作，不受 `Time.timeScale` 影响（除非你用了 `CancelInvoke`）。

## 协程系统（Coroutine）

### 启动方式

#### 方式1：通过方法名字符串启动

```csharp
public Coroutine StartCoroutine(string methodName, object value)
{
    return StartCoroutineManaged(methodName, value);  // 内部用反射找到 IEnumerator 方法
}
```

#### 方式2：通过迭代器启动（更常用）

```csharp
public Coroutine StartCoroutine(IEnumerator routine)
{
    return StartCoroutineManaged2(routine);  // 直接管理迭代器状态机
}
```

### 协程的暂停/恢复原理

你的代码：

```csharp
yield return new WaitForSeconds(1f);
```

**实际上：**

1. C# 编译器把你的协程编译成一个 `IEnumerator` 状态机
2. `StartCoroutineManaged2` 把这个迭代器交给 C++ 引擎
3. 引擎每帧调用 `MoveNext()`，检查 `Current` 是什么
4. 如果是 `WaitForSeconds`，引擎自己计时，到点了再调用 `MoveNext()`

