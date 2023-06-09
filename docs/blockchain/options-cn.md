---
sidebar_position: 6
---

# 📈 期权: Crypto 衍生品市场分析

> _这篇研究主要分析 Crypto 衍生品，包括期权的增长潜力。数据可以追溯到 2017 年当永续合约刚刚被 CEXs 大规模采用，分析看到交易量未来的增长趋势，期权在其中有着更大的增长空间。最后，会以可以期权交易的纳斯达克指数里的股票进行现货交易 vs 期权对冲交易占比，来分析 Crypto 的对冲交易量成熟度。_

_✍️ edit: April 4th, 2023_

🔰 图源[**The Block**](https://www.theblock.co/data/crypto-markets/spot)

## 1️⃣ 现货交易

### 总现货交易量

![](https://pbs.twimg.com/media/Fr6zLxJaUAEq9QB?format=png&name=4096x4096)
![](https://pbs.twimg.com/media/Fr6zMVNacAQZAqJ?format=png&name=4096x4096)

- 从 2017 年的(588B-200B)月交易量增长到 2021 年的(4T-2T), 增长率 680%-1000%, 从 2017 年的 7 日交易量 MA(5B-25B)增长到 2021 年的(50B-160B)增长率为 640%-1000%, ~日均从(0.7B-3.5B)增长到(7B-22B), Binance 占据比率 50%, Upbit, Kucoin, Gate, OKX 等其他 CEXs 在牛市打法策略上有吸金效应, 美国地区 Binance 占有率<8%, FTX 垮塌后由 Coinbase 领先, 其他 Kraken, LMAX, CRO, Bifinex 等瓜分

### BTC 及 ETH 现货交易量

![](https://pbs.twimg.com/media/Fr65AqLaMAAmIv_?format=jpg&name=4096x4096)

- 从 2018 末 BTC+ETH 的现货 7 日 MA 交易量 2.5B 至今(30B-60B), 日交易量为 350M 至(4.3B-8.6B),增长率为 1200%-2400%, 预计下个周期的增长率按减半效果的 7.5 折折算，增长率从这个周期到下个周期为 900%-1800%, 预计现货 7 日 MA 交易量，假设 base 的交易量为 50B,~(450B-900B), 日交易量为(64B-128B)见顶

## 2️⃣ 永续合约

###  BTC 及 ETH 永续合约交易量

![](https://pbs.twimg.com/media/Fr65jLzakAA-Tzf?format=png&name=4096x4096)
![](https://pbs.twimg.com/media/Fr65kETaEAAQl-x?format=png&name=4096x4096)

- 从永续合约交易来看，自 Bitmex 从 2016 年推出永续合约交易以来，BTC 及 ETH 的永续合约交易量从 2018 年至 2021 年超越了所有币种总和现货交易量，两者永续合约交易量最高月量为>3T, 以 2022 年回测历史看，BTC+ETH 月均交易量之和每月 2.5T，已经超越所有币种的现货交易，成为行业主流的流动资金池。

### 引言

> ⚠️ 衍生品和 margin 是提高回报率的重要手段，在 90 年代传统市场极大提高了交易者+机构的资金利用率和市场的波动率，从而衍生了根据波动率交易的衍生品，**但是风险极高，对专业交易者风险控制要求严格，下面将从自 2017 年到 2023 年的波动率+合约交易量分析衍生品交易市场**

### Bitmex 永续合约的诞生及历史

![](https://pbs.twimg.com/media/Fr66fXEaEAA2hnU?format=png&name=4096x4096)

> _上图提取了 Bitmex 上的 XBT 永续合约历史作为参考，其中 OBV 为 On Balance Volume 用以交易量预测资产价格, PVT 为 Price Volume Trend 用供应及需求定量某资产的供给需求, Stand.Err 取 200 日标准误差线以测量 200 天内价格的波动误差，而 7 日 1Sigma, 2Sigma, 3Sigma 代表了价格波动幅度来分析 1 周内价格的在 68-95-99.7 的在正态钟型分布下(未包含长尾事件)价格的概率波动幅度, 关键节点如下：_

- **2017 至 2019 年:** 永续合约被交易所采用，18-19 年交易量超越所有虚拟资产的现货交易量，永续合约于 2018 初供给 PVT/OBV 多>空失衡，数周出现偏离 200 日误差线，95-99.7 percentile 的白天鹅事件，于 2019 年 PVT/OBV 出现空>多失衡，2019 年初附近发生多次离 200 日误差的 95-99.7 的黑天鹅事件，1Sigma 标志性超出误差线
- **2020 至 2021 年:** 疫情导致的严重黑天鹅事件发生，永续 PVT/OBV 平衡发生巨大倾斜, 未实际统计 Residual 分析，但看起来有误差率的 200%之高

- **2021 年初：**QE 导致风险资产过热，但专业投资者和更多成熟的衍生工具出现数周出现，1Sigma 并未发生频繁超出误差线，偏离 200 日误差，95-99.7 percentile 的白天鹅事件，永续 PVT/OBV 平衡将近倾斜，之后发生称 519 事件，误差线与 Sigmas 发生背离，交易量骤降

- **2022 年至今：**行业因 QT 遭遇去杠杆发生，再现 2019 的 PVT/OBV 平衡空>多倾斜事件，于 2022 末开始，3Sigma, 2Sigma 虽然屡次发生白天鹅事件，但 1Sigma 再未像 2017 年发生严重偏离概率事件

### 📌 小结

综上看出，波动率收益因专业衍生品交易和走向成熟的对冲工具下降，1Sigma 未再突破误差线，波动率收益被更多对冲专业交易者均分

## 3️⃣ 期权交易

### BTC/ETH 期权交易量

![](https://pbs.twimg.com/media/Fr688zGaAAEDU3N?format=png&name=4096x4096)
![](https://pbs.twimg.com/media/Fr689uxakAAQYos?format=png&name=4096x4096)

### BTC/ETH 期权资金费率

![](https://pbs.twimg.com/media/Fr69af7aUAEETS_?format=jpg&name=4096x4096)
![](https://pbs.twimg.com/media/Fr69bcHakAAbO4r?format=jpg&name=4096x4096)

### 📌 小结

1. Deribit 由 2020 年正式搭建期权交易平台，迅速抢占大块交易市场, 其后 OKX 开展产内 retail 期权市场，占比仅在 1%-5%，2021 年发布的 Delta Exchange 市场占有率达到 10%-15%
2. BTC+ETH 期权交易市场体量从 2020 年-2021 年牛市，最高达到 45B 的月交易量，以 0.03%的 MM 费率，仅在撮合交易费率上的每月营收有 13M, 最高仓位借贷费率有 22.5B
3. 期权对比现货/永续合约交易量于 2021-2022 的下跌不同，于 2023 年 Q1 已经恢复到周期牛市的高点，并保持强势的交易量，相较于现货交易量从牛市到 22 年末萎缩的 50%和永续合约萎缩的 41.67%， 期权交易量上升了 66.67%，假设投资者为 100%的现货或者合约买期权对冲保险，那么 (现货或合约的交易量) / (期权的交易量) 能直观的表现出市场避险或用对冲工具的使用趋势，其中从如下数据表格发现：
   1. 从牛市到 22 年末，现货对冲期权的交易量占比从 17.6%增长到 58.8%，增长率为 2341%
   2. 从牛市到 22 年末，永续合约对冲期权的交易量占比从 1%增长到 2.9%，增长率为 190%
   3. BTC+ETH 加密货币期权交易市场容纳了更多衍生品对冲市场，并一直持续增长
      ![](/img/Blockchain/options-cn1.png)

### 🆚 对比可期权对冲 Nasdaq 股票

从传统 Nasdaq 的现货+Margin 交易量来看，期权的对冲程度远比加密货币高，也更为成熟：

1. Nasdaq 的 2021 年 4 月现货(可期权交易资产)的月交易量 = 7470B, BTC+ETH 现货的月交易量 = 170B，**相差 44 倍**
2. Nasdaq 的 2021 年 4 月(可期权交易资产)衍生品交易量 = 480B，BTC+ETH 衍生品的月交易量 = 30B，**相差 16 倍**
3. Nasdaq 的 2021 年 4 月(可期权交易资产)衍生品的现货交易占比 = 6.43%，BTC+ETH 衍生品的现货交易占比 = 0.946%，**相差 6.79 倍**
4. 23 年初及 22 年末同比以上倍率各大约为: **77 倍，10 倍，及 2.86 倍**

   ![](/img/Blockchain/options-cn2.png)
