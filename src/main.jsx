import React, {useEffect, useMemo, useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  Home, Search, Library, Mic2, Settings, UserCircle, Plus, Play, Pause, SkipBack,
  SkipForward, Shuffle, Repeat2, Volume2, MoreHorizontal, Heart, ListMusic,
  Upload, Pencil, Trash2, Check, X, Languages, Palette, Monitor, Moon, Sun,
  LogIn, LogOut, ChevronRight, Music2, Youtube, ExternalLink, Sparkles, ShieldCheck
} from "lucide-react";
import {createClient} from "@supabase/supabase-js";
import "./styles.css";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const seedTracks = [
  {id:"demo-1", title:"Midnight Drive", artist:"Veyra Radio", album:"Nightline", duration:214, cover:"https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=500&q=80", source:"demo"},
  {id:"demo-2", title:"Afterglow", artist:"Nova Vale", album:"After Hours", duration:188, cover:"https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&q=80", source:"demo"},
  {id:"demo-3", title:"Signal", artist:"Lowlight", album:"Static Hearts", duration:201, cover:"https://images.unsplash.com/photo-1506157786151-b8491531f063?w=500&q=80", source:"demo"}
];

const translations = {
  en:{home:"Home", search:"Search", library:"Library", karaoke:"Karaoke", settings:"Settings", welcome:"Good evening", recent:"Recently played", made:"Made for you", local:"Local music", import:"Import music", playlists:"Playlists", appearance:"Appearance", language:"Language", account:"Account", save:"Save", cancel:"Cancel", now:"Now playing", connected:"Connected services", noAds:"No ads. No clutter."},
  ru:{home:"Главная", search:"Поиск", library:"Медиатека", karaoke:"Караоке", settings:"Настройки", welcome:"Добрый вечер", recent:"Недавно слушали", made:"Для вас", local:"Локальная музыка", import:"Импорт музыки", playlists:"Плейлисты", appearance:"Внешний вид", language:"Язык", account:"Аккаунт", save:"Сохранить", cancel:"Отмена", now:"Сейчас играет", connected:"Подключённые сервисы", noAds:"Без рекламы. Без мусора."},
  az:{home:"Ana səhifə", search:"Axtarış", library:"Kitabxana", karaoke:"Karaoke", settings:"Parametrlər", welcome:"Axşamınız xeyir", recent:"Son dinlənənlər", made:"Sizin üçün", local:"Lokal musiqi", import:"Musiqi idxal et", playlists:"Pleylistlər", appearance:"Görünüş", language:"Dil", account:"Hesab", save:"Yadda saxla", cancel:"Ləğv et", now:"İndi səslənir", connected:"Qoşulmuş xidmətlər", noAds:"Reklamsız. Artıqsız."}
};

function App(){
  const [page,setPage]=useState("home");
  const [lang,setLang]=useState(localStorage.getItem("veyra-lang")||"en");
  const [theme,setTheme]=useState(localStorage.getItem("veyra-theme")||"dark");
  const [accent,setAccent]=useState(localStorage.getItem("veyra-accent")||"#b8ff4d");
  const [tracks,setTracks]=useState(()=>JSON.parse(localStorage.getItem("veyra-tracks")||"null")||seedTracks);
  const [playlists,setPlaylists]=useState(()=>JSON.parse(localStorage.getItem("veyra-playlists")||"null")||[{id:"liked",name:"Liked songs",tracks:[]}]);
  const [current,setCurrent]=useState(tracks[0]);
  const [playing,setPlaying]=useState(false);
  const [progress,setProgress]=useState(0);
  const [volume,setVolume]=useState(.8);
  const [query,setQuery]=useState("");
  const [searchResults,setSearchResults]=useState([]);
  const [user,setUser]=useState(null);
  const [edit,setEdit]=useState(null);
  const audioRef=useRef(null);

  const t=translations[lang]||translations.en;

  useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.setProperty("--accent",accent);localStorage.setItem("veyra-theme",theme);},[theme,accent]);
  useEffect(()=>{localStorage.setItem("veyra-lang",lang)},[lang]);
  useEffect(()=>{localStorage.setItem("veyra-tracks",JSON.stringify(tracks))},[tracks]);
  useEffect(()=>{localStorage.setItem("veyra-playlists",JSON.stringify(playlists))},[playlists]);

  useEffect(()=>{
    if(!supabase) return;
    supabase.auth.getSession().then(({data})=>setUser(data.session?.user||null));
    const {data:listener}=supabase.auth.onAuthStateChange((_e,session)=>setUser(session?.user||null));
    return ()=>listener.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!playing || !current) return;
    const id=setInterval(()=>setProgress(p=>Math.min(p+1,current.duration)),1000);
    return ()=>clearInterval(id);
  },[playing,current]);

  const play=(track)=>{
    setCurrent(track); setPlaying(true); setProgress(0);
    if(track.source==="youtube" && track.videoId){
      window.open(`https://www.youtube.com/watch?v=${track.videoId}`,"_blank","noopener");
    }
  };
  const next=()=>{const i=tracks.findIndex(x=>x.id===current?.id); play(tracks[(i+1)%tracks.length])};
  const prev=()=>{const i=tracks.findIndex(x=>x.id===current?.id); play(tracks[(i-1+tracks.length)%tracks.length])};

  const importFiles=(e)=>{
    [...e.target.files].forEach(file=>{
      const url=URL.createObjectURL(file);
      const track={id:crypto.randomUUID(),title:file.name.replace(/\.[^/.]+$/,""),artist:"Unknown artist",album:"Local files",duration:0,cover:"/icon.svg",source:"local",url};
      setTracks(x=>[track,...x]); setCurrent(track);
    });
  };

  const updateTrack=(id,patch)=>setTracks(x=>x.map(t=>t.id===id?{...t,...patch}:t));
  const deleteTrack=(id)=>{setTracks(x=>x.filter(t=>t.id!==id)); if(current?.id===id)setCurrent(tracks.find(t=>t.id!==id)||null)};

  const search=async()=>{
    if(!query.trim()) return;
    const local=tracks.filter(x=>`${x.title} ${x.artist}`.toLowerCase().includes(query.toLowerCase()));
    try{
      const r=await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const d=r.ok?await r.json():{items:[]};
      setSearchResults([...local,...(d.items||[])]);
    }catch{setSearchResults(local)}
  };

  const signIn=async()=>{
    if(!supabase){alert("Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable Google/email sign-in.");return;}
    await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.origin}});
  };
  const signOut=()=>supabase?.auth.signOut();

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">V</div><span>veyra</span></div>
      <nav>
        <Nav icon={Home} label={t.home} active={page==="home"} onClick={()=>setPage("home")}/>
        <Nav icon={Search} label={t.search} active={page==="search"} onClick={()=>setPage("search")}/>
        <Nav icon={Library} label={t.library} active={page==="library"} onClick={()=>setPage("library")}/>
        <Nav icon={Mic2} label={t.karaoke} active={page==="karaoke"} onClick={()=>setPage("karaoke")}/>
      </nav>
      <div className="sidebar-bottom">
        <Nav icon={Settings} label={t.settings} active={page==="settings"} onClick={()=>setPage("settings")}/>
        <button className="profile-mini" onClick={()=>setPage("settings")}><UserCircle size={23}/><span>{user?.email?.split("@")[0]||"Guest"}</span></button>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="mobile-brand"><div className="brand-mark">V</div>veyra</div>
        <div className="searchbox" onClick={()=>setPage("search")}><Search size={18}/><span>{t.search}...</span><kbd>⌘ K</kbd></div>
        <div className="top-actions"><button className="icon-btn" title="Account" onClick={()=>setPage("settings")}><UserCircle size={21}/></button></div>
      </header>

      <div className="content">
        {page==="home" && <HomePage t={t} tracks={tracks} current={current} play={play} setPage={setPage}/>}
        {page==="search" && <SearchPage t={t} query={query} setQuery={setQuery} search={search} results={searchResults} play={play}/>}
        {page==="library" && <LibraryPage t={t} tracks={tracks} playlists={playlists} play={play} setEdit={setEdit} deleteTrack={deleteTrack} importFiles={importFiles}/>}
        {page==="karaoke" && <KaraokePage current={current} progress={progress}/>}
        {page==="settings" && <SettingsPage t={t} lang={lang} setLang={setLang} theme={theme} setTheme={setTheme} accent={accent} setAccent={setAccent} user={user} signIn={signIn} signOut={signOut}/>}
      </div>
    </main>

    {current && <Player current={current} playing={playing} setPlaying={setPlaying} progress={progress} setProgress={setProgress} volume={volume} setVolume={setVolume} next={next} prev={prev} playlists={playlists} setPlaylists={setPlaylists}/>}
    {edit && <EditModal track={edit} onClose={()=>setEdit(null)} onSave={(p)=>{updateTrack(edit.id,p);setEdit(null)}}/>}
  </div>
}

function Nav({icon:Icon,label,active,onClick}){return <button className={"nav-item "+(active?"active":"")} onClick={onClick}><Icon size={20}/><span>{label}</span></button>}

function HomePage({t,tracks,current,play,setPage}){
  return <div>
    <section className="hero">
      <div><div className="eyebrow"><Sparkles size={14}/> Veyra</div><h1>{t.welcome}.</h1><p>{t.noAds}</p></div>
      <button className="primary" onClick={()=>setPage("search")}><Search size={17}/> Find something</button>
    </section>
    <Section title={t.recent} action="See all" onClick={()=>setPage("library")}>
      <div className="track-grid">{tracks.slice(0,6).map(x=><TrackCard key={x.id} track={x} onClick={()=>play(x)}/>)}</div>
    </Section>
    <Section title={t.made}>
      <div className="feature-row">
        <div className="feature-card"><div className="feature-art"><Music2 size={42}/></div><div><span>Veyra Mix</span><strong>A calm mix for late nights</strong><small>Local + connected music</small></div></div>
        <div className="feature-card"><div className="feature-art alt"><Mic2 size={42}/></div><div><span>Karaoke mode</span><strong>Sing along with your tracks</strong><small>Lyrics view + progress</small></div></div>
      </div>
    </Section>
  </div>
}
function Section({title,action,onClick,children}){return <section className="section"><div className="section-head"><h2>{title}</h2>{action&&<button onClick={onClick}>{action}<ChevronRight size={16}/></button>}</div>{children}</section>}
function TrackCard({track,onClick}){return <button className="track-card" onClick={onClick}><img src={track.cover}/><div className="track-overlay"><Play fill="currentColor" size={17}/></div><strong>{track.title}</strong><span>{track.artist}</span></button>}

function SearchPage({t,query,setQuery,search,results,play}){
  return <div><div className="page-title"><span>Explore</span><h1>{t.search}</h1></div>
    <div className="big-search"><Search/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="Songs, artists, albums..."/><button onClick={search}>Search</button></div>
    <div className="provider-row"><span>Sources</span><b><Music2 size={15}/> Spotify</b><b><Youtube size={15}/> YouTube</b><b>Veyra Local</b></div>
    <Section title={results.length?"Results":"Try a search"}>
      {results.length?<div className="result-list">{results.map((x,i)=><div className="result" key={x.id||i}><img src={x.cover||x.thumbnail}/><div className="result-main"><strong>{x.title}</strong><span>{x.artist||"YouTube"} {x.album&&"· "+x.album}</span></div><button className="icon-btn" onClick={()=>play(x)}><Play size={18} fill="currentColor"/></button>{x.url&&<a className="icon-btn" href={x.url} target="_blank" rel="noreferrer"><ExternalLink size={17}/></a>}</div>)}</div>:<div className="empty"><Search size={28}/><strong>Search across your music</strong><span>Connect services in Settings, or import files from your device.</span></div>}
    </Section>
  </div>
}

function LibraryPage({t,tracks,play,setEdit,deleteTrack,importFiles}){
  return <div><div className="page-title"><span>{t.local}</span><h1>{t.library}</h1></div>
    <div className="library-toolbar"><label className="primary"><Upload size={17}/>{t.import}<input hidden type="file" accept="audio/*" multiple onChange={importFiles}/></label><button className="ghost"><Plus size={17}/> New playlist</button></div>
    <div className="table"><div className="table-head"><span>#</span><span>Title</span><span>Artist</span><span>Album</span><span></span></div>{tracks.map((x,i)=><div className="table-row" key={x.id}><span>{i+1}</span><div className="song-cell" onClick={()=>play(x)}><img src={x.cover}/><div><strong>{x.title}</strong><small>{x.source==="local"?"On device":"Veyra"}</small></div></div><span>{x.artist}</span><span>{x.album}</span><div className="row-actions"><button onClick={()=>setEdit(x)}><Pencil size={16}/></button><button onClick={()=>deleteTrack(x.id)}><Trash2 size={16}/></button></div></div>)}</div>
  </div>
}

function KaraokePage({current,progress}){
  const lines=["I can feel the night getting closer","Every little light is moving slow","We don't need a map tonight","Just follow where the rhythm goes","Stay here a little longer","Let the city fade below"];
  const active=Math.min(lines.length-1,Math.floor((progress/(current?.duration||200))*lines.length));
  return <div className="karaoke"><div className="karaoke-cover"><img src={current?.cover||"/icon.svg"}/><div><span>NOW SINGING</span><h1>{current?.title||"Choose a song"}</h1><p>{current?.artist||"—"}</p></div></div><div className="lyrics">{lines.map((x,i)=><div className={i===active?"current":i<active?"past":""} key={x}>{x}</div>)}</div><p className="lyrics-note">Lyrics demo. Connect a licensed lyrics provider for production lyrics.</p></div>
}

function SettingsPage({t,lang,setLang,theme,setTheme,accent,setAccent,user,signIn,signOut}){
  return <div><div className="page-title"><span>Veyra</span><h1>{t.settings}</h1></div>
    <div className="settings-grid">
      <SettingGroup title={t.account} icon={UserCircle}>{user?<div className="account-box"><div className="avatar">{(user.email||"V")[0].toUpperCase()}</div><div><strong>{user.email}</strong><span>Veyra account</span></div><button className="ghost" onClick={signOut}><LogOut size={16}/> Sign out</button></div>:<div className="account-box"><div className="avatar"><LogIn/></div><div><strong>Sign in to sync</strong><span>Google account, playlists and settings</span></div><button className="primary" onClick={signIn}><LogIn size={16}/> Continue with Google</button></div>}</SettingGroup>
      <SettingGroup title={t.appearance} icon={Palette}><div className="option-grid">{[["dark","Dark",Moon],["light","Light",Sun],["system","System",Monitor]].map(([v,l,I])=><button className={"option "+(theme===v?"selected":"")} onClick={()=>setTheme(v)} key={v}><I size={18}/><span>{l}</span>{theme===v&&<Check size={16}/>}</button>)}</div><div className="accent-row"><span>Accent</span>{["#b8ff4d","#8b7cff","#61d6ff","#ff6fae","#ffb84d"].map(c=><button className={"accent "+(accent===c?"selected":"")} style={{"--c":c}} onClick={()=>setAccent(c)} key={c}/>)}</div></SettingGroup>
      <SettingGroup title={t.language} icon={Languages}><div className="option-grid">{Object.entries({en:"English",ru:"Русский",az:"Azərbaycan dili"}).map(([v,l])=><button className={"option "+(lang===v?"selected":"")} onClick={()=>setLang(v)} key={v}><Languages size={17}/><span>{l}</span>{lang===v&&<Check size={16}/>}</button>)}</div></SettingGroup>
      <SettingGroup title={t.connected} icon={ShieldCheck}><div className="service"><Music2/><div><strong>Spotify</strong><span>Metadata + playback handoff</span></div><button className="ghost">Connect</button></div><div className="service"><Youtube/><div><strong>YouTube</strong><span>Search + official player</span></div><button className="ghost">Connect</button></div></SettingGroup>
    </div>
  </div>
}
function SettingGroup({title,icon:Icon,children}){return <section className="setting-group"><div className="setting-title"><Icon size={19}/><h2>{title}</h2></div>{children}</section>}

function EditModal({track,onClose,onSave}){
  const [title,setTitle]=useState(track.title),[artist,setArtist]=useState(track.artist),[album,setAlbum]=useState(track.album),[cover,setCover]=useState(track.cover);
  return <div className="modal-bg"><div className="modal"><div className="modal-head"><h2>Edit track</h2><button onClick={onClose}><X/></button></div><img className="edit-cover" src={cover}/><label>Title<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Artist<input value={artist} onChange={e=>setArtist(e.target.value)}/></label><label>Album<input value={album} onChange={e=>setAlbum(e.target.value)}/></label><label>Cover URL<input value={cover} onChange={e=>setCover(e.target.value)}/></label><div className="modal-actions"><button className="ghost" onClick={onClose}>Cancel</button><button className="primary" onClick={()=>onSave({title,artist,album,cover})}><Check size={17}/> Save</button></div></div></div>
}

function Player({current,playing,setPlaying,progress,setProgress,volume,setVolume,next,prev,playlists,setPlaylists}){
  const addLiked=()=>setPlaylists(p=>p.map(x=>x.id==="liked"&&!x.tracks.includes(current.id)?{...x,tracks:[...x.tracks,current.id]}:x));
  const max=current.duration||200;
  return <div className="player"><div className="player-info"><img src={current.cover}/><div><strong>{current.title}</strong><span>{current.artist}</span></div><button onClick={addLiked}><Heart size={18}/></button></div><div className="controls"><div className="control-buttons"><button><Shuffle size={17}/></button><button onClick={prev}><SkipBack size={19} fill="currentColor"/></button><button className="play-btn" onClick={()=>setPlaying(!playing)}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><button onClick={next}><SkipForward size={19} fill="currentColor"/></button><button><Repeat2 size={17}/></button></div><div className="seek"><span>{fmt(progress)}</span><input type="range" min="0" max={max} value={Math.min(progress,max)} onChange={e=>setProgress(+e.target.value)}/><span>{fmt(max)}</span></div></div><div className="volume"><Volume2 size={18}/><input type="range" min="0" max="1" step=".01" value={volume} onChange={e=>setVolume(+e.target.value)}/><button><MoreHorizontal/></button></div></div>
}
function fmt(s){const m=Math.floor((s||0)/60),sec=Math.floor((s||0)%60);return `${m}:${String(sec).padStart(2,"0")}`}

createRoot(document.getElementById("root")).render(<App/>);