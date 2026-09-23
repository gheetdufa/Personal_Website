export const RESEARCH_REFRESH_MS=14*24*60*60*1000;
const CACHE_KEY='room-research-v1';
const topicTerms='"fine-tuning"|"post-training"|"parameter-efficient"|"low-rank adaptation"|"instruction tuning"|"preference optimization"|"knowledge distillation"|RLHF';
export function researchURL(now=Date.now()){
  const date=new Date(now).toISOString().slice(0,10),from=new Date(now-180*86400000).toISOString().slice(0,10);
  const url=new URL('https://api.openalex.org/works');url.search=new URLSearchParams({filter:`display_name.search:${topicTerms},title_and_abstract.search:"language model"|LLM|transformer,from_publication_date:${from},to_publication_date:${date},is_retracted:false,type:article|preprint|review`,sort:'publication_date:desc',per_page:'40',select:'id,title,publication_date,doi,primary_location,authorships,type'});return url.href;
}
const safeURL=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}};
export function normalizePapers(results,now=Date.now()){
  const seen=new Set(),today=new Date(now).toISOString().slice(0,10);
  return (Array.isArray(results)?results:[]).filter(p=>{
    const key=String(p.title||'').trim().toLowerCase().replace(/[^a-z0-9]/g,'');
    if(!key||seen.has(key)||!/^\d{4}-\d{2}-\d{2}$/.test(p.publication_date)||p.publication_date>today||p.is_retracted)return false;seen.add(key);return true;
  }).map(p=>({title:p.title,date:p.publication_date,url:safeURL(p.doi)||safeURL(p.primary_location?.landing_page_url)||safeURL(p.id),authors:(p.authorships||[]).slice(0,3).map(a=>a.author?.display_name).filter(Boolean).join(', ')+(p.authorships?.length>3?' et al.':''),source:p.primary_location?.source?.display_name||'Research paper',type:p.type==='preprint'?'Preprint':'Paper'})).filter(p=>p.url).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
}
export function createResearchFeed({fetcher=fetch,storage,now=Date.now}={}){
  let cache=null,pending=null,retryAfter=0;
  if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
  try{const stored=JSON.parse(storage?.getItem(CACHE_KEY)||'null');if(stored&&Number.isFinite(stored.checkedAt)&&Array.isArray(stored.papers)&&stored.papers.length&&stored.checkedAt<=now()&&stored.papers.every(p=>p&&typeof p.title==='string'&&typeof p.date==='string'&&safeURL(p.url)))cache=stored;}catch{}
  async function refresh(){
    if(cache&&now()-cache.checkedAt<RESEARCH_REFRESH_MS)return {...cache,stale:false};
    if(pending)return pending;
    if(now()<retryAfter)return {...cache,papers:cache?.papers||[],stale:true,error:true};
    pending=Promise.resolve().then(async()=>{
      try{
        const response=await fetcher(researchURL(now()),{signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error('Research source unavailable');
        const data=await response.json(),papers=normalizePapers(data.results,now());if(!papers.length)throw Error('No matching papers returned');
        cache={checkedAt:now(),papers};try{storage?.setItem(CACHE_KEY,JSON.stringify(cache));}catch{}
        return {...cache,stale:false};
      }catch{retryAfter=now()+3600000;return {...cache,papers:cache?.papers||[],stale:true,error:true};}
      finally{pending=null;}
    });return pending;
  }
  return {refresh};
}
