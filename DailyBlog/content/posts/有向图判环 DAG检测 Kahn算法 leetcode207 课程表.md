#DAG检测 #有向图判环 #DFS #BFS #Kahn算法

> 借着这道题作为自己学习图论的开始做一个DFS策略和BFS以及有向图判环问题的狠狠的学。

# [207. 课程表](https://leetcode.cn/problems/course-schedule/)

你这个学期必须选修 `numCourses` 门课程，记为 `0` 到 `numCourses - 1` 。

在选修某些课程之前需要一些先修课程。 先修课程按数组 `prerequisites` 给出，其中 `prerequisites[i] = [ai, bi]` ，表示如果要学习课程 `ai` 则 **必须** 先学习课程  `bi` 。

- 例如，先修课程对 `[0, 1]` 表示：想要学习课程 `0` ，你需要先完成课程 `1` 。

请你判断是否可能完成所有课程的学习？如果可以，返回 `true` ；否则，返回 `false` 。

**示例 1：**

**输入：** numCourses = 2, prerequisites =` [[1,0]]`  
**输出：** true  
**解释** 总共有 2 门课程。学习课程 1 之前，你需要完成课程 0 。这是可能的。

**示例 2：**

**输入：** numCourses = 2, prerequisites =`[[1,0],[0,1]]`  
**输出：** false  
**解释：** 总共有 2 门课程。学习课程 1 之前，你需要先完成​课程 0 ；并且学习课程 0 之前，你还应先完成课程 1 。这是不可能的。

**提示：**

- `1 <= numCourses <= 2000`
- `0 <= prerequisites.length <= 5000`
- `prerequisites[i].length == 2`
- `0 <= ai, bi < numCourses`
- `prerequisites[i]` 中的所有课程对 **互不相同**

## DFS-递归

反复审题会发现有很多很多的问题

坑点 prerequisites并不是全部的课程，因为也存在没有成环的课程就说明是可行的  
理论上prerequiresites`[][0]`的编号 只会限制在 0~numCourses之间，所以我们  
不妨认为 课程0就是第一个课程 然后一个一个去修 判断是否有环

有向图判环-DAG检测 如果有向图可以被拓扑排序<->无环

DFS 做法 三色标记法 白：没有触碰的节点 灰：正在走进但没有完全退出的节点  
黑：表示已经走干净的节点 DFS

递归的过程本身就已经拥有了试图排列拓扑序的性质 这里为什么会蒙圈？

因为对于图的构造我们是不清楚的 `[a,b] => b->a `一个i表示了一条有向边  
这样的数组就叫做边集数组

而且这个诡异的关系，我们很难知道从节点0出发的能走向哪里 例如从0 开始  
就要扫描出所有 prerequisites`[i][1]` == 0 的节点  
然后再挨个遍历，这样太难受了

1. 所以第一步是建立邻接表 用一个更直观的数据结构表示这个图中节点的邻里关系
2. 第二部就是遍历整张邻接表 对每个节点打上标记
3. 最后输出结果

```cpp
class Solution {
public:

    // 主函数
    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {

        // 节点颜色记号数组 0：白 1：灰 2：黑
        vector<int> color(numCourses, 0);

        // 建立邻接表
        vector<vector<int>> grid(numCourses);
        for (auto& edge : prerequisites) {
            grid[edge[1]].push_back(edge[0]);
        }

        // 合法标记
        bool ok = true;

        for (int i = 0; i < numCourses; i++) {
            if (color[i] == 0) {
                if (dfs(i, color, grid) == false) {
                    ok = false;
                    break;
                }
            }
        }

        return ok;
    }

    // 返回值代表有没有环 false代表有环 而 true表示无环
    // 这个函数表示是否可被拓扑排序

    bool dfs(int u, vector<int>& color, vector<vector<int>>& grid) {

        color[u] = 1;

        for (auto& v : grid[u]) {
            if (color[v] == 1) {
                return false;
            }
            if (color[v] == 0) {
                if (dfs(v, color, grid) == false) {
                    return false;
                }
            }
        }

        color[u] = 2;

        return true;
    }
};
```

**问：如果这个算法涉及到游戏开发的情景里，能干什么，又要做什么改变？**

- 技能树 任务前置条件 关卡事件依赖系统

可能是游戏的策划再Excel JSON中打表配置好的 可以看这个策划的设计有没有循环。。。(我当玩笑的)

- 点消式消除
- 电流沿导电地板的传输

（这两个BFS也可以实现嘞）

- 程序化迷宫挖掘
- 技能依赖检测

> DFS是一种搜索策略，很多问题只是递归的过程中体现了DFS"不撞南墙不回头的策略"并不代表DFS就一定是递归

如果这个课程表问题不使用递归，但仍旧选择DFS的策略，则做法就是栈模拟

```cpp
stack<int> st;              // 保存当前 DFS 路线
vector<int> next(n, 0);     // 记录每个节点下一个要检查的邻居
vector<int> color(n, 0);    // 三色标记
```

栈模拟的过程即是用栈保留住我们的执行状态

## DFS-栈模拟递归过程

```cpp
// 栈模拟
bool dfs(int u, vector<int>& color, vector<vector<int>>& grid){
    // 使用栈模拟递归的调用 first:当前的节点 second表示下一个检查的邻居(是邻居不是下标)
    stack<pair<int,int>> st;

    color[u] = 1; // 标灰
    st.push({u,0}); // 初始化模拟栈

    while(!st.empty()){
        int cur = st.top().first;
        int i = st.top().second;

        // 执行边界
        if(i == grid[cur].size()){
            color[cur] = 2;         // 标黑
            st.pop();
            continue;
        }

        int v = grid[cur][i];    // v是邻居
        st.top().second++;      // 更新当前的遍历进度

        if(color[v] == 1) {     // 经过了灰色的节点 则表示有环 返回false
            return false;
        }

        if(color[v] == 0) {
            color[v] = 1;
            st.push({v,0});
        }
    }

    return true;
}
```

![[Pasted image 20261107171055.png]]

其实可以看到问题规模限定的时候两者的内存占用是差不多的，  
时间复杂度因为使用了邻阶图也依旧是O(V+E) (时间和空间都是如此)（V是顶点数 E是边数）  
下面的BFS也是

## BFS-Kahn算法

DFS的思想是，我们从图里去搜索，从每个课程的起点出发，顺着这个依赖关系走看看会不会走到尽头，如果没能走到尽头而是走到了一个当前处于搜索中状态的节点，这就说明，存在了一个环，导致了我要学习这个课程要先修一门课程，而我先修的课程的前置，或者前置的前置...又需要当前的这个课程

而BFS的思想其实就是 模拟真的去上课，会不会出问题，我们能不能从一个"不需要先修任何课程的课程"开始，然后就这样一门一门的完成课程

这里引入了 **入度** 的概念 ：一门课程当前还有多少条尚未解除的前置依赖

选择入读为0的节点作为起点，就这样  
例如 0->1 0->2 1->3 2->3  
BFS作为层序搜索  
第一层就是 0->1 0->2 如果我们修完了第0课，第一层的依赖就被解除了  
1 和 2的入度就被归零，于是我们展开第二层的搜索

说到层序遍历，那就是要用到队列先进先出的特性了，

**在这里：**

1. 找到所有入度为0的节点 入队
2. 取出一门课程 视为已经修完
3. 沿着他的出边解除后续课程的依赖，即让对应节点的入度减1
4. 如果一个节点的入度变成了0，就把它加入队列
5. 重复知道队列为空

> BFS广度优先搜索的 层 只是一种直觉 并不是严格的给各种节点依照半径划出了半径的层次。当然也可以理解成是这个层可以依权重变化

**在这里的关键规则只有一个：“任何时候只要一个节点的入度为0了，他就具备了被处理的资格”**

```cpp
bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {

    // 建立邻接表 构建入度数组
    vector<vector<int>> grid(numCourses);
    vector<int> indegree(numCourses, 0);

    for (auto& edge : prerequisites) {
        grid[edge[1]].push_back(edge[0]);
        indegree[edge[0]]++;
        // 被push_back的节点是邻居嘛，每被push_back一次就明有一条朝向这个节点的边
        // 即入度+1
    }

    // 声明队列 将入度为0的节点进行入队初始化
    queue<int> q;

    for (int i = 0; i < numCourses; i++) {
        if (indegree[i] == 0) {
            q.push(i);
        }
    }

    int count = 0; // 可修课程计数器

    while (!q.empty()) {
        int u = q.front(); // 取出队首节点 - 意味着我们修了这节课
        q.pop();
        count++;

        // 遍历邻居，邻居的入度减少
        for (auto& v : grid[u]) {
            indegree[v]--;
            if (indegree[v] == 0) { // 同时将满足条件的节点入队
                                    // 符合条件入度为0的条件才能入队
                // 这是不会陷入死循环的关键
                q.push(v);
            }
        }
    }

    return count ==
           numCourses; // 如果完成的课程数和目标课程数目相等 说明就是可行的
}
```

## 模板

### DFS 三色搜索的模板

```cpp
bool dfs(int u, vector<int>& color, vector<vector<int>>& grid) {

    // ① 进入当前节点
    color[u] = 1;

    // ② 遍历所有邻居
    for (int v : grid[u]) {

        // ③ 遇到灰色节点：存在环
        if (color[v] == 1) {
            return false;
        }

        // ④ 遇到白色节点：递归深入
        if (color[v] == 0) {
            if (!dfs(v, color, grid)) {
                return false;
            }
        }
    }

    // ⑤ 所有邻居都处理完毕
    color[u] = 2;

    return true;
}
```

### DFS 栈模拟三色搜索模板

```cpp
bool dfs(int u, vector<int>& color, vector<vector<int>>& grid) {

    // {节点编号, 下一个要检查的邻居下标}
    stack<pair<int, int>> st;

    // ① 进入当前节点
    color[u] = 1;
    st.push({u, 0});

    while (!st.empty()) {
        int cur = st.top().first;
        int i = st.top().second;

        // ② 所有邻居处理完毕：模拟函数返回
        if (i == grid[cur].size()) {
            color[cur] = 2;
            st.pop();
            continue;
        }

        // ③ 读取当前节点的下一个邻居
        int v = grid[cur][i];

        // ④ 保存当前节点的进度
        st.top().second++;

        // ⑤ 遇到灰色节点：存在环
        if (color[v] == 1) {
            return false;
        }

        // ⑥ 遇到白色节点：模拟递归调用
        if (color[v] == 0) {
            color[v] = 1;
            st.push({v, 0});
        }
    }

    return true;
}
```

### BFS模板

```cpp
void bfs(int start, vector<vector<int>>& grid) {

    // ① 访问标记
    vector<bool> visited(grid.size(), false);

    // ② 创建队列
    queue<int> q;

    // ③ 起点入队
    q.push(start);
    visited[start] = true;

    // ④ 队列不为空，继续搜索
    while (!q.empty()) {
        // 取出队首节点
        int u = q.front();
        q.pop();

        // 在这里处理节点 u

        // ⑤ 遍历邻居
        for (int v : grid[u]) {
            // 未访问过才能入队
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
}
```

### 边集数组转邻接表(二维数组实现)模板

```cpp
int n = numNodes; // 节点数量

vector<vector<int>> grid(n);

for (auto& edge : edges) {
    int u = edge[0]; // 起点
    int v = edge[1]; // 终点
    grid[u].push_back(v);
}
```

> 这里要小心题目本身的边集数组的关系是怎么定义的
