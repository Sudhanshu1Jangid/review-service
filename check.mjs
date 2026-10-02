import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from './dist/server/index.js';
const body = {business:'Test shop',language:'English',highlights:['Long wait'],notes:''};
const request = (data=body,method='POST',extra={}) => new Request('https://review.test/api/generate',{method,headers:{'Content-Type':'application/json',...extra},...(method==='POST'?{body:typeof data==='string'?data:JSON.stringify(data)}:{})});
assert.equal((await worker.fetch(new Request('https://review.test/'),{})).status,200);
assert.equal((await worker.fetch(new Request('https://review.test/.env.local'),{})).status,404);
assert.equal((await worker.fetch(request(body,'GET'),{})).status,405);
assert.equal((await worker.fetch(request(body,'POST',{Origin:'https://other.test'}),{})).status,403);
for (const invalid of ['{',null,{}, {...body,business:' '}, {...body,highlights:'bad'}, {...body,notes:42}, {...body,language:'invalid'}, {...body,highlights:[],notes:''}]) assert.equal((await worker.fetch(request(invalid),{})).status,400);
assert.equal((await worker.fetch(request('x'.repeat(17000)),{})).status,413);
assert.equal((await worker.fetch(request(),{})).status,503);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url,options) => {
    assert.match(url,/gemini-3.5-flash-lite:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'],'test-only-key');
    assert.equal(JSON.parse(options.body).generationConfig.maxOutputTokens,200);
    assert.equal(JSON.parse(options.body).generationConfig.thinkingConfig.thinkingLevel,'minimal');
    return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:'I had a long wait.'}]}}]});
  };
  assert.deepEqual(await (await worker.fetch(request(),{GEMINI_API_KEY:'test-only-key'})).json(),{review:'I had a long wait.'});
  for (const upstream of [Response.json({}, {status:429}),Response.json({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'Incomplete'}]}}]}),Response.json({})]) {
    globalThis.fetch = async () => upstream;
    assert.equal((await worker.fetch(request(),{GEMINI_API_KEY:'test-only-key'})).status,502);
  }
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal((await worker.fetch(request(),{GEMINI_API_KEY:'test-only-key'})).status,502);
} finally { globalThis.fetch = originalFetch; }
console.log('Passed: page, private-file blocking, method/origin checks, validation, body limit, missing key, successful draft, provider/timeout/truncation failures.');

// Exercise the actual submit handler against the HTML 404 that caused the bug.
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const submitCode=html.slice(html.indexOf("$('review-form').addEventListener('submit'"),html.indexOf("$('copy').addEventListener('click'"));
for (const response of [new Response('<!DOCTYPE html><h1>Not found</h1>',{status:404,headers:{'Content-Type':'text/html'}}),new Response('<!DOCTYPE html>',{headers:{'Content-Type':'text/html'}}),new Response('<!DOCTYPE html>',{headers:{'Content-Type':'application/json'}}),Response.json(null),Response.json({review:'Updated draft'})]) {
  let submit,notice;
  const fields=Object.fromEntries(['review-form','generate','copy','review','language'].map(id=>[id,{value:id==='review'?'My original review':'English',disabled:false,readOnly:false,focus(){},addEventListener(event,fn){submit=fn;}}]));
  vm.runInNewContext(submitCode,{$:id=>fields[id],document:{querySelectorAll:()=>[]},business:'Test shop',isWebsite:true,fetch:async()=>response,AbortSignal,TypeError,Error,message:(text,error)=>{notice={text,error};}});
  await submit({preventDefault(){}});
  assert.equal(fields.generate.disabled,false);
  assert.equal(fields.copy.disabled,false);
  assert.equal(fields.review.readOnly,false);
  assert.doesNotMatch(notice.text,/Unexpected token|DOCTYPE/);
  if(notice.error) {assert.equal(fields.review.value,'My original review');assert.match(notice.text,/isn’t connected/);} else assert.equal(fields.review.value,'Updated draft');
}
console.log('Passed: HTML 404, HTML 200, mislabeled HTML, null JSON, preserved edits, restored buttons, successful frontend generation.');
