import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
dotenv.config();
const app=express(),root=path.dirname(fileURLToPath(import.meta.url));
app.use(express.json({limit:"1mb"})); app.use(express.static(root));
app.get("/",(_req,res)=>{let html=fs.readFileSync(path.join(root,"index.html"),"utf8");html=html.replace("</body>",'<script src="/client.js"></script><script src="/app.js"></script></body>');res.type("html").send(html)});
app.get("/api/health",(_req,res)=>res.json({ok:true,service:"chater"}));
app.post("/api/chat",async(req,res)=>{const {messages=[],model="gpt-4o-mini",thinking="standard"}=req.body||{};if(!process.env.AI_API_KEY||!process.env.AI_API_URL)return res.status(503).json({error:"Server API 尚未配置，请设置 AI_API_URL 和 AI_API_KEY。"});try{const r=await fetch(process.env.AI_API_URL,{method:"POST",headers:{"Content-Type":"application/json",Authorization:"Bearer "+process.env.AI_API_KEY},body:JSON.stringify({model,messages,stream:false,metadata:{thinking}})});const d=await r.json();if(!r.ok)return res.status(r.status).json({error:d.error?.message||"上游 AI 请求失败"});res.json({content:d.choices?.[0]?.message?.content||d.output_text||"没有收到有效回复。"})}catch(e){res.status(502).json({error:"AI 服务暂时不可用",detail:e.message})}});
app.listen(process.env.PORT||3000,()=>console.log("Chater server started"));

