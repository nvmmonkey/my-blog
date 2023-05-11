---
sidebar_position: 7
---

# 📈 去中心化排序器

> _最近看到了 Reyph 这个项目，蛮有趣的 LLVM IR+SolanaVM 做的 de-Sequencer 模块化方案。所以来结合了 Nil 和 Astria 想来聊聊这些跨 L2/L2 的状态数，类似于分片异片同步上排序器的 ZK 证明聚合的项目，简单聊聊_

_✍️ edit: May 11st, 2023_

## 🚧 TL;DR

如果把 Eigenlayer 比作给各条链做租借弹性节点，Celestia 做的是多链插拔槽，这个项目则是给多个 L2/L3 用 ZK Validity Proof 在多链（执行分片网络）部署了一个 Sequencer 间维护的 Proof-based Layer。

## 🦾 底层技术

底层用 LLVM IR、无缝嵌入 ZKVM/Rust/SolanaVM，据我了解，估计有点悬，Clang IR 做 VM 好像比 Rust 好很多，虽然 Rust 有内置报错功能，这个想法主要还是为了能在浏览器做 ZKP-WASM 部署，以及跑一些 TEE 可信环境下快速部署作为 2FA/MFA 的低迁移成本方案

### SolanaVM？

Solana L1 需要大量 TPS 处理 voting，但单纯拿出来 SolanaVM 如 Eclipse 所说，Rust 并发 multi-thread 是很高的，SolanaVM 单拿出来做二层就不再需要 Vote，也就省下来了一堆 throughput。

### 以太二层？

像现在 ARB/OP 的单一排序器是非常中心化的，虽然 DA 和共识安全交给了 ETH，论其去中心化程度和 geth 性能，内存的 opcode 串联，是远远不如 rust 或 move 改爸爸们 Aptos/Sui 的，Aptos 的并行毛病很大，经常卡 sync，Sui 体验感上暂时没遇到过 span 会卡在并行处理上

## 📌 为什么 de-Sequencer？

其实这些 L2/L3 在模块化世界里可以看成一堆分片数据库，用中心排序器，在伪随机+ZKSnark 或 ZKStark 里不用担心篡改或安全问题，只担心 censorship 的问题，这对于用户来说也很好解决等一层 Proof Layer1 的 Epoch 过去，直接换个分片和排序器玩就好了，在排序器还能植入 JWT Token

### 应用场景(待续)：

> _去中心租赁高性能排序器_

有点像 Nil 选择了 Mina 作为一个已经在做区块头数据共识的公链，Reyph 看准了数据这些 RaaS，ZK(E)VM 的爆发，想把 SolanaVM+中心排序器的性能以去中心的方式随机排插到每个 epoch 的随机分片 L2/3 里

### 渊源

- 从 Nil 的 Mikow 提出用 c 之后，这群老油条先是看不起，Risc0 则是乖乖做 ZKVM 的服务，后来窜了个 Asterio，Omni 站不住脚直接跳车出来说要包办 Fraud Proof+Validity Proof，估计这么花心做不成事情。
- Reyph 开始在模块化里卷，市面上的 Modular 项目一层层往 stack 上涂奶油，模块间的延迟瓶将很快到达瓶颈期，而 IBC 的 Tendermint 多接几个节点后也是如此。既然如此，要不还是把想想怎么妥协 Censorship，逼良为娼吧(让高性能节点在 ZK 里做捞不着便宜的苦逼事)

## 📌 总结

Starknet 最近也有点坐不稳，跑得有点走型了，先是 Lambdaclass 往 zk 简洁性+做了套支持 GPU cuda 跑 zkWASM。性能上加大马力开发也不是不好，可能是因为天天被人骂卡顿也是气不过。但好歹你把 Stark 的 ZKP 全线性 PCP 倒是开发一下啊，没看到模块化都来沾边了嘛？这场模块化战争，虽然模块化受限于模块数量间的延迟并发性能，但数量上能把控住而又能 permissionless 的开发环境，将会打响模块化分片、二层网络的第一炮，让每个网络都不能独善其身。
