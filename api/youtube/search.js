export default async function handler(req, res) {
  const q = req.query?.q;
  if (!q) return res.status(400).json({error:"Missing q"});
  if AIzaSyDbvPCL3uqo1AzxrNjDGHY90ucex2CqQOg return res.status(200).json({items:[]});
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part","snippet");
  url.searchParams.set("q",q);
  url.searchParams.set("type","video");
  url.searchParams.set("videoCategoryId","10");
  url.searchParams.set("maxResults","12");
  url.searchParams.set("key",process.env.AIzaSyDbvPCL3uqo1AzxrNjDGHY90ucex2CqQOg);
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) return res.status(r.status).json(data);
  return res.status(200).json({
    items:(data.items||[]).map(x=>({
      id:x.id.videoId, videoId:x.id.videoId, title:x.snippet.title,
      artist:x.snippet.channelTitle, cover:x.snippet.thumbnails?.high?.url,
      thumbnail:x.snippet.thumbnails?.high?.url,
      source:"youtube", url:`https://www.youtube.com/watch?v=${x.id.videoId}`
    }))
  });
}
