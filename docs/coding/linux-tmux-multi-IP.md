---
sidebar_position: 1
---

# 🔧 Tmux Session 多个IP调用

> 这篇文章记录了如何在Linux Ubuntu VPS Disktro 使用不同的IPv4/IPv6绑定到 `tmux` 的 `session` ⚠️

## 1. 安装 Curl &

```sh
apt install curl net-tools
```

## 2. ssh 链接VPS

```sh
#连接ssh
ssh 用户名@地址
```

> `ip addr show eth0` 查看现在网络设定 eth0 口可能命名不同 `nano /etc/netplans/50-xxx-xxx.yaml` 查看网络端口名字

## 3. 添加 IP 地址

```sh
# 第一个IP
sudo ip addr add 0.0.0.0/24 dev eth0

# 第二个
sudo ip addr add 0.0.0.0/24 dev eth0

# 第三个
sudo ip addr add 0.0.0.0/24 dev eth0
```

## 4. 创建 with-ip 脚本

```sh
sudo tee /usr/local/bin/with-ip <<'EOF'
#!/bin/bash
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: with-ip <ip-address> <command>"
    exit 1
fi
SOURCE_IP=$1
shift
exec curl --interface $SOURCE_IP "$@"
EOF

sudo chmod +x /usr/local/bin/with-ip
```

## 5. 创建 tmux 包装脚本

```sh
# For first IP
sudo tee /usr/local/bin/tmux-ip1 <<'EOF'
#!/bin/bash
export CURL_INTERFACE=0.0.0.0
"$@"
EOF

# For second IP
sudo tee /usr/local/bin/tmux-ip2 <<'EOF'
#!/bin/bash
export CURL_INTERFACE=0.0.0.0
"$@"
EOF

# For third IP
sudo tee /usr/local/bin/tmux-ip3 <<'EOF'
#!/bin/bash
export CURL_INTERFACE=0.0.0.0
"$@"
EOF

sudo chmod +x /usr/local/bin/tmux-ip*
```


## 6. 测试 IP 连接

```sh
with-ip 0.0.0.0 ifconfig.me
with-ip 0.0.0.0 ifconfig.me
with-ip 0.0.0.0 ifconfig.me
```

## 7. 创建 tmux session

```sh
tmux new-session -s ip1 'tmux-ip1 bash'
tmux new-session -s ip2 'tmux-ip2 bash'
tmux new-session -s ip3 'tmux-ip3 bash'
```

## 8. ⭐️ 在 tmux 里查看是否成功

```sh
tmux attach-session -t 窗口名
```

> 在 `tmux` 里查看 IP `curl --interface $CURL_INTERFACE ifconfig.me`


## 9. ⭐️ 使用 IP 运行服务

```sh
IP=0.0.0.0 ./run.sh
```
