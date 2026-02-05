import React,{useState} from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth } from "../firebase";
const ADMIN_MOBILE="7386361725"; const ADMIN_OTP="45#67";
export default function Login(){const n=useNavigate();const [m,sM]=useState("");const [r,sR]=useState("");const [o,sO]=useState("");const [e,sE]=useState("");
const go=async()=>{try{await signInAnonymously(auth);}catch{} if(m===ADMIN_MOBILE){if(o!==ADMIN_OTP){sE("Invalid Admin OTP");return;}localStorage.clear();localStorage.setItem("oshiro_role","admin");localStorage.setItem("oshiro_user",JSON.stringify({mobile:m}));n("/admin",{replace:true});return;}
if(!r){sE("Choose role");return;} if(r==="customer"){await setDoc(doc(db,"customers",m),{mobile:m,createdAt:serverTimestamp()},{merge:true});localStorage.clear();localStorage.setItem("oshiro_role","customer");localStorage.setItem("oshiro_user",JSON.stringify({mobile:m}));n("/customer",{replace:true});return;}
if(r==="merchant"){const q=query(collection(db,"merchants"),where("mobile","==",m));const s=await getDocs(q);if(s.empty){localStorage.clear();localStorage.setItem("oshiro_role","merchant");localStorage.setItem("oshiro_user",JSON.stringify({mobile:m}));n("/merchant-register",{replace:true});return;}
const md={id:s.docs[0].id,...s.docs[0].data()};if(md.status!=="approved"){sE("Pending approval");return;}localStorage.clear();localStorage.setItem("oshiro_role","merchant");localStorage.setItem("oshiro_user",JSON.stringify(md));localStorage.setItem("oshiro_merchant_id",md.id);n("/merchant",{replace:true});}};
return(<Box sx={{p:4,maxWidth:360,mx:"auto"}}><Typography variant="h5">Login</Typography>
<TextField label="Mobile" fullWidth sx={{mt:2}} value={m} onChange={e=>sM(e.target.value.replace(/\D/g,''))}/>
<Box sx={{mt:2,display:"flex",gap:1}}><Button onClick={()=>sR("customer")}>Customer</Button><Button onClick={()=>sR("merchant")}>Merchant</Button></Box>
{m===ADMIN_MOBILE && <TextField label="Admin OTP" fullWidth sx={{mt:2}} value={o} onChange={e=>sO(e.target.value)}/>}
{e && <Typography color="error" sx={{mt:1}}>{e}</Typography>}
<Button variant="contained" sx={{mt:2}} onClick={go}>Continue</Button></Box>);}
