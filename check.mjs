import assert from 'node:assert/strict';
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
    assert.match(url,/gemini-2.5-flash-lite:generateContent$/);
    assert.equal(options.headers['x-goog-api-key'],'test-only-key');
    assert.equal(JSON.parse(options.body).generationConfig.maxOutputTokens,200);
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
