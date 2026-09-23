import test from 'node:test';
import assert from 'node:assert/strict';
import {createResearchFeed,normalizePapers,researchURL,RESEARCH_REFRESH_MS} from '../research-feed.js';
const now=Date.parse('2026-09-21T12:00:00Z');
const work=(title='Fine-tuning language models',date='2026-09-19')=>({id:'https://openalex.org/W123',title,publication_date:date,doi:'https://doi.org/10.1234/example',primary_location:{source:{display_name:'arXiv'}},authorships:[{author:{display_name:'An Author'}}],type:'preprint'});
const memory=()=>{const data=new Map();return {getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value)};};
test('Research searches broad post-training topics, excludes future and retracted work, and sorts newest first',()=>{
  const url=new URL(researchURL(now)),filter=url.searchParams.get('filter');
  for(const term of ['fine-tuning','post-training','low-rank adaptation','instruction tuning','preference optimization','knowledge distillation','RLHF','is_retracted:false','to_publication_date:2026-09-21'])assert.ok(filter.includes(term));
  assert.equal(url.searchParams.get('sort'),'publication_date:desc');
  const results=normalizePapers([work('Older','2026-09-01'),work(),work(),work('Future','2027-01-01'),{...work('Retracted'),is_retracted:true},{...work('Bad link'),id:'javascript:alert(1)',doi:null}],now);
  assert.equal(results.length,2);assert.equal(results[0].type,'Preprint');assert.equal(results[0].title,'Fine-tuning language models');assert.equal(results[0].authors,'An Author');
});
test('Research uses a persistent fourteen-day cache and coalesces concurrent refreshes',async()=>{
  let clock=now,calls=0;const storage=memory(),fetcher=async()=>{calls++;return {ok:true,json:async()=>({results:[work()]})};};
  const feed=createResearchFeed({fetcher,storage,now:()=>clock});
  await Promise.all([feed.refresh(),feed.refresh()]);assert.equal(calls,1);
  clock+=RESEARCH_REFRESH_MS-1;await feed.refresh();assert.equal(calls,1);
  const restored=createResearchFeed({fetcher,storage,now:()=>clock});await restored.refresh();assert.equal(calls,1);
  clock++;const result=await restored.refresh();assert.equal(calls,2);assert.equal(result.checkedAt,clock);assert.equal(result.stale,false);
});
test('A failed refresh keeps saved papers and retries after a brief backoff',async()=>{
  let clock=now,fail=false,calls=0;const storage=memory();
  const feed=createResearchFeed({storage,now:()=>clock,fetcher:()=>{calls++;if(fail)throw Error('Offline');return Promise.resolve({ok:true,json:async()=>({results:[work()]})});}});
  await feed.refresh();clock+=RESEARCH_REFRESH_MS;fail=true;
  const stale=await feed.refresh();assert.equal(stale.error,true);assert.equal(stale.papers.length,1);assert.equal(stale.checkedAt,now);
  await feed.refresh();assert.equal(calls,2);clock+=3600001;fail=false;
  const recovered=await feed.refresh();assert.equal(calls,3);assert.equal(recovered.stale,false);
});
test('Unavailable or corrupted storage still permits a fresh feed; an empty response stays honest',async()=>{
  const storage={getItem(){return '{bad json';},setItem(){throw Error('Full');}};
  const feed=createResearchFeed({storage,now:()=>now,fetcher:async()=>({ok:true,json:async()=>({results:[work()]})})});
  assert.equal((await feed.refresh()).papers.length,1);
  const empty=createResearchFeed({storage:null,now:()=>now,fetcher:async()=>({ok:true,json:async()=>({results:[]})})});
  const result=await empty.refresh();assert.equal(result.error,true);assert.deepEqual(result.papers,[]);assert.equal(result.checkedAt,undefined);
});
