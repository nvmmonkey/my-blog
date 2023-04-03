---
sidebar_position: 0
---

# ⚛ NextJS: Mongoose 调用

> 这篇文章记录了从 React 架构转 NextJS 框架，对于 Mongoose 水土不服的解决办法, Mongoose 框架在 HTML 中比 MongoDB 本身更轻便、易用，但在 React 和 NextJS 中有许多 `Fallback` 不兼容 ⚠️

## 1. 安装 Mongoose

```sh
npm i mongoose
```

## 2. 连接 MongoDB

```js
//导入 mongoose
import mongoose from "mongoose";

//导出连接服务器的 async function
export async function connectMongoDB() {
  const url = `mongodb+srv://${process.env.MongoDB用户名}:${process.env.用户API}@${process.env.cluster名称}.${process.env.cluster代号}.mongodb.net/${process.env.MongoDB数据库名}`;

  //确认连接成功 asPromise()
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  //实现连接
  await mongoose.connect(url, { useNewUrlParser: true });
}
```

> `{ useNewUrlParser: true }` 这里是为了避免 Mongoose 报错

## 3. 设定模型 Model 参数

```js
//导入 mongoose
import mongoose from "mongoose";

//定义模型 Schema
const messageSchema = {
  date: String, //日期 String
  email: String, //邮箱 String
  name: String, //名称 String
  message: String, //信息 String
};

const Message =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
//NextJS 在创建新的数据组时候需要检查是否已存在模型Model，否则建立新的模型Model

//导出模型
export default Message;
```

## 4. 模型 Model 录入数据

```js
//导入mongoose
import mongoose from "mongoose";

//导入上面设定好的 Model 模型
import Message from "$path{Model 模型路径}";

//导出录入模型数据的 async function
export async function insertMessage(newMessage) {
  const message = new Message({
    date: new Date().toISOString(), //录入时间 new Date().toISOString() 转化为可读时间
    email: newMessage.email,
    name: newMessage.name,
    message: newMessage.message,
  });

  //录入新数据
  await message.save();
}
```

## 5. ⭐️ 聚合 JS 文档

> 我喜欢在 `component` 文件夹创建 `/helper/db-utils.js` 方便重复使用 mongoose 调用方程

```js
//导入 mongoose
import mongoose from "mongoose";
//导入上面设定好的 Model 模型
import Message from "$path{Model 模型路径}";

//导出连接服务器的 async function
export async function connectMongoDB() {
  const url = `mongodb+srv://${process.env.MongoDB用户名}:${process.env.用户API}@${process.env.cluster名称}.${process.env.cluster代号}.mongodb.net/${process.env.MongoDB数据库名}`;

  //确认连接成功 asPromise()
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  }

  //实现连接
  await mongoose.connect(url, { useNewUrlParser: true });
}

//导出录入模型数据的 async function
export async function insertMessage(newMessage) {
  const message = new Message({
    date: new Date().toISOString(), //录入时间 new Date().toISOString() 转化为可读时间
    email: newMessage.email,
    name: newMessage.name,
    message: newMessage.message,
  });

  //录入新数据
  await message.save();
}
```

## 6. ⭐️⭐️ API 调用接口

> 我喜欢在 `pages` 文件夹创建 `/pages/api/contact.js` 创建 API 的调用方程`handler`

```js
//导入 mongoose
import mongoose from "mongoose";

//导入 上面设定好的 mongoose 连接 + 写入数据方程
import { connectMongoDB, insertMessage, } from "../../components/helper/db-utils";

async function handler(req, res) {

  //检测前端SWR Hook 或 HTML fetch() 的调用模式
  if (req.method === "POST") {

    //从request的body中抓包用户发送的数据
    const { email, name, message } = req.body;


    //后端Back-end 的数据验证
    if (
      !email ||
      !email.includes("@") ||
      !name ||
      name.trim() === "" ||
      !message ||
      message.trim() === ""
    ) {
      res.status(422).json({ message: "Invalid Input!" });
      return;
    }

    //录入抓包数据并创建Object
    const newMessage = {
      email: email,
      name: name,
      message: message,
    };

    //验证连接MongoDB正常 + 报错500
    try {
      await connectMongoDB();
    } catch (error) {
      res.status(500).json({ message: "Failing connecting to DB!" });
      return;
    }

    //验证连接MongoDB数据写入正常 + 报错500
    try {
      await insertMessage(newMessage); //写入新数据 newMessage
      res.status(201).json({ message: "Successfully submitted!" });
      return;
    } catch (error) {
      res.status(500).json({ message: "Error submiting!" });
      return;
    }
  }

  //调用关闭MongoDB的关闭接口，关闭了之后性能比较慢
  mongoose.connection.close();
}

//输出API调用方程到前端Front-end
export default handler;
```
