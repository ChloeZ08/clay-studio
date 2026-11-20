import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import Studio from "./Studio";
import "./style.css";

const backend = "https://clay-studio.chloe-clay-studio.workers.dev";
function App() {
  const [token,setToken]=useState("");
  const [error,setError]=useState("");
  const pending=useRef<{popup:Window;state:string}|null>(null);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(event.origin!==backend || event.source!==pending.current?.popup || event.data?.state!==pending.current.state || event.data?.type!=="clay-login") return;
      if(typeof event.data.token!=="string" || event.data.token.length>20000) return;
      setToken(event.data.token);setError("");pending.current=null;
    };
    window.addEventListener("message",receive);
    return ()=>window.removeEventListener("message",receive);
  },[]);
  function login() {
    pending.current?.popup.close();
    const state=crypto.randomUUID();
    const popup=window.open(backend+"/auth/pages?state="+state,"clay-login","width=520,height=720");
    if(!popup) {setError("Allow the sign-in window, then try again.");return;}
    pending.current={popup,state};setError("Complete school email verification in the sign-in window.");
  }
  async function request(init:RequestInit={}) {
    try {
      const response=await fetch(backend+"/api/course",{...init,credentials:"omit",headers:{...init.headers,"Cf-Access-Token":token},signal:AbortSignal.timeout(20000)});
      if(response.status===401 || response.status===403) {setToken("");setError("Your session expired. Sign in again.");}
      return response;
    } catch {throw new Error("Cannot connect to the booking service. Please retry; if this continues, contact the administrator.");}
  }
  function signOut() {
    setToken("");setError("");
    window.open(backend+"/cdn-cgi/access/logout","clay-logout","width=520,height=720,noopener");
  }
  if(token) return <Studio request={request} signOut={signOut}/>;
  return <main><h1>Clay Studio</h1><p style={{margin:"16px 0"}}>School email sign-in</p><button className="button" onClick={login}>Sign in</button>{error&&<p role="status" style={{marginTop:16}}>{error}</p>}</main>;
}
createRoot(document.getElementById("root")!).render(<App/>);
