import express from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
dotenv.config();
const app=express(),root=path.dirname(fileURLToPath(import.meta.url)),users=new Map();
users.set("leo456le@163.com",{email:"Leo456le@163.com",password:"Leo",verified:true,name:"Leo"});
const pending=new Map();
app.use(express.json({limit:"1mb"}));app.use(express.static(root));
app.get("/",(_req,res)=>{let html=fs.readFileSync(path.join(root,"index.html"),"utf8");html=html.replace("</body>",'<script src="/client.js"></script><script src="/auth.js"></script><script src="/app.js"></script></body>');res.type("html").send(html)});
app.get("/api/health",(_req,res)=>res.json({ok:true,service:"chater",model:"deepseek-v4-flash"}));
function captcha(){const value=crypto.randomBytes(3).toString("hex").toUpperCase();return {id:crypto.randomUUID(),value};}
app.get("/api/auth/captcha",(_req,res)=>{const c=captcha();pending.set(c.id,{captcha:c.value,expires:Date.now()+300000});res.json({id:c.id,value:c.value})});
function mailer(){if(!process.env.SMTP_HOST)return null;return nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||465),secure:process.env.SMTP_SECURE!=="false",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}})}
app.post("/api/auth/request-code",async(req,res)=>{const {email,captchaId,captchaValue,honey}=req.body||{},p=pending.get(captchaId);if(honey||!/^\S+@\S+\.\S+$/.test(email||"")||!p||p.expires<Date.now()||String(captchaValue).toUpperCase()!==p.captcha)return res.status(400).json({error:"邮箱或验证码无效"});if(!mailer())return res.status(503).json({error:"邮件服务尚未配置，暂时不能进行邮箱验证"});const code=String(crypto.randomInt(100000,999999));p.emailCode=code;p.email=email;p.codeExpires=Date.now()+600000;await mailer().sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:email,subject:"Chater 邮箱验证码",text:"你的 Chater 验证码是 "+code+"，10 分钟内有效。"});res.json({ok:true})});
app.post("/api/auth/register",(req,res)=>{const {email,password,name,emailCode,captchaId,captchaValue,honey}=req.body||{},p=pending.get(captchaId);if(honey||!/^\S+@\S+\.\S+$/.test(email||"")||!password||password.length<6||users.has((email||"").toLowerCase())||!p||p.email!==email||p.codeExpires<Date.now()||p.emailCode!==emailCode||String(captchaValue).toUpperCase()!==p.captcha)return res.status(400).json({error:"注册信息、邮箱验证码或图形验证码无效"});users.set(email.toLowerCase(),{email,password,name:name||email.split("@")[0],verified:true});pending.delete(captchaId);res.json({ok:true,user:{email,name:name||email.split("@")[0]}})});
app.post("/api/auth/login",(req,res)=>{const {email,password,captchaId,captchaValue,honey}=req.body||{},p=pending.get(captchaId),u=users.get((email||"").toLowerCase());if(honey||!u||u.password!==password||!p||p.expires<Date.now()||String(captchaValue).toUpperCase()!==p.captcha)return res.status(401).json({error:"邮箱、密码或验证码错误"});res.json({ok:true,user:{email:u.email,name:u.name}})});
app.post("/api/chat",async(req,res)=>{const {messages=[],thinking="standard"}=req.body||{};if(!process.env.DEEPSEEK_API_KEY)return res.status(503).json({error:"服务端尚未配置 DeepSeek API Key"});try{const r=await fetch("https://api.deepseek.com/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.DEEPSEEK_API_KEY},body:JSON.stringify({model:"deepseek-v4-flash",messages,thinking:{type:thinking==="off"?"disabled":"enabled"},stream:false})});const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||"DeepSeek 请求失败"});res.json({content:d.choices?.[0]?.message?.content||"没有收到有效回复。"})}catch(e){res.status(502).json({error:"DeepSeek 服务暂时不可用"})}});
app.listen(process.env.PORT||3000,()=>console.log("Chater server started"));


