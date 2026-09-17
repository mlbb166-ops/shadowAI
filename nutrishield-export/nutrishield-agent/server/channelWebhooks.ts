import type { Express, Request, Response } from "express";
import { createHash, createHmac, createPublicKey, timingSafeEqual, verify as verifySignature } from "crypto";
import { formatPlainReply } from "./channelCore";
import { runChannelAgent } from "./channelAgent";

type RawRequest = Request & { rawBody?: Buffer };
const safeEqual = (left: string, right: string) => { const a=Buffer.from(left); const b=Buffer.from(right); return a.length===b.length && timingSafeEqual(a,b); };
const telegramSecret = () => process.env.TELEGRAM_BOT_TOKEN ? createHash("sha256").update(process.env.TELEGRAM_BOT_TOKEN).digest("hex") : "";
const configured = () => ({ telegram:Boolean(process.env.TELEGRAM_BOT_TOKEN), messenger:Boolean(process.env.META_PAGE_ACCESS_TOKEN&&process.env.META_VERIFY_TOKEN&&process.env.META_APP_SECRET), discord:Boolean(process.env.DISCORD_PUBLIC_KEY), whatsapp:Boolean(process.env.WHATSAPP_ACCESS_TOKEN&&process.env.WHATSAPP_PHONE_NUMBER_ID) });

function verifyMeta(req:RawRequest){const secret=process.env.META_APP_SECRET;const signature=req.header("x-hub-signature-256")??"";if(!secret||!req.rawBody||!signature.startsWith("sha256="))return false;const expected=`sha256=${createHmac("sha256",secret).update(req.rawBody).digest("hex")}`;return safeEqual(signature,expected);}
function verifyDiscord(req:RawRequest){const key=process.env.DISCORD_PUBLIC_KEY;const sig=req.header("x-signature-ed25519");const ts=req.header("x-signature-timestamp");if(!key||!sig||!ts||!req.rawBody)return false;try{const prefix=Buffer.from("302a300506032b6570032100","hex");const publicKey=createPublicKey({key:Buffer.concat([prefix,Buffer.from(key,"hex")]),format:"der",type:"spki"});return verifySignature(null,Buffer.concat([Buffer.from(ts),req.rawBody]),publicKey,Buffer.from(sig,"hex"));}catch{return false;}}
async function sendTelegram(chatId:number,text:string){const token=process.env.TELEGRAM_BOT_TOKEN;if(!token)return;await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:chatId,text,protect_content:true}),signal:AbortSignal.timeout(5000)});}
async function sendMessenger(recipientId:string,text:string){const token=process.env.META_PAGE_ACCESS_TOKEN;if(!token)return;const version=process.env.META_GRAPH_API_VERSION||"v24.0";await fetch(`https://graph.facebook.com/${version}/me/messages?access_token=${encodeURIComponent(token)}`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({recipient:{id:recipientId},messaging_type:"RESPONSE",message:{text}}),signal:AbortSignal.timeout(3500)});}

export function registerChannelWebhooks(app:Express){
  app.get("/api/channels/health",(_req,res)=>res.json({configured:configured(),mode:"credential-gated"}));
  app.post("/api/channels/telegram/webhook",async(req:Request,res:Response)=>{
    const secret=telegramSecret();if(!secret||!process.env.TELEGRAM_BOT_TOKEN)return res.status(503).json({error:"telegram-not-configured"});
    if(!safeEqual(req.header("x-telegram-bot-api-secret-token")??"",secret))return res.status(401).json({error:"invalid-signature"});
    const message=req.body?.message;
    if(message?.chat?.id&&typeof message?.text==="string"){
      try{
        if(message.text==="/start"){
          await sendTelegram(message.chat.id,"Halo, Bunda. Saya bot resmi NutriShield. Sebelum memberi saran, saya perlu menautkan profil anak dengan aman. Untuk demo ini, tulis pertanyaan umum seperti ‘contoh menu lokal’. Pencatatan berat, tinggi, dan alergi baru aktif setelah profil website ditautkan.");
          return res.json({ok:true});
        }
        const response=await runChannelAgent({channel:"telegram",message:message.text,profile:{name:"Profil demo",ageMonths:18,allergy:"",budget:20000,region:"Indonesia"}});await sendTelegram(message.chat.id,`${response.answer}\n\nCatatan: jawaban memakai profil demo sampai akun ditautkan.\nID proses: ${response.traceId}`);
      }
      catch{return res.status(502).json({error:"telegram-send-failed"});}
    }
    return res.json({ok:true});
  });
  app.get("/api/channels/messenger/webhook",(req:Request,res:Response)=>{const token=process.env.META_VERIFY_TOKEN;if(!token)return res.status(503).send("messenger-not-configured");if(req.query["hub.mode"]==="subscribe"&&typeof req.query["hub.verify_token"]==="string"&&safeEqual(req.query["hub.verify_token"],token))return res.status(200).send(String(req.query["hub.challenge"]??""));return res.sendStatus(403);});
  app.post("/api/channels/messenger/webhook",async(req:RawRequest,res:Response)=>{if(!configured().messenger)return res.status(503).json({error:"messenger-not-configured"});if(!verifyMeta(req))return res.status(401).json({error:"invalid-signature"});if(req.body?.object!=="page")return res.sendStatus(404);const events=(req.body.entry??[]).flatMap((entry:{messaging?:unknown[]})=>entry.messaging??[]);for(const event of events){const typed=event as{sender?:{id?:string};message?:{text?:string;is_echo?:boolean}};if(typed.sender?.id&&typed.message?.text&&!typed.message.is_echo){try{await sendMessenger(typed.sender.id,formatPlainReply(typed.message.text,"messenger"));}catch{return res.status(502).json({error:"messenger-send-failed"});}}}return res.status(200).send("EVENT_RECEIVED");});
  app.post("/api/channels/discord/interactions",(req:RawRequest,res:Response)=>{if(!configured().discord)return res.status(503).json({error:"discord-not-configured"});if(!verifyDiscord(req))return res.status(401).send("invalid request signature");if(req.body?.type===1)return res.json({type:1});const command=req.body?.data?.name??"mulai";const text=command==="menu"?"menu":command==="pertumbuhan"?"cek pertumbuhan":"mulai";return res.json({type:4,data:{content:formatPlainReply(text,"discord"),flags:64,allowed_mentions:{parse:[]}}});});
}
