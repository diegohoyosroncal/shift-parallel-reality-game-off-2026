'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)][0]?.[1];
assert(script && script.length>1000,'Could not isolate embedded game rules');
const sandbox={module:{exports:{}}};
vm.runInNewContext(script,sandbox,{timeout:3000,filename:'embedded-core.js'});
const game=sandbox.module.exports;
const moves=['up','down','left','right','shift'];
test('release is standalone and contains required interactive elements',()=>{
  for(const id of ['board','next','reset','mute','worldLabel','levelLabel','orbLabel'])
    assert(html.includes('id="'+id+'"'), 'Missing '+id);
  assert(!/<script[^>]+src\s*=/.test(html),'External JavaScript dependency found');
});
test('four independent levels are solvable and demand SHIFT',()=>{
  assert.equal(game.LEVELS.length,4);
  game.LEVELS.forEach((_level,i)=>{
    const p=game.solve(i); assert(p,'Level '+(i+1)+' unsolvable');
    assert(p.includes('shift'),'Level '+(i+1)+' does not use SHIFT');
    let s=game.makeState(i); for(const m of p){assert(moves.includes(m));s=game.advance(s,m);}
    assert.equal(s.won,true,'Level '+(i+1)+' victory not reached');
  });
});
test('blocked moves do not cross walls and invalid actions are harmless',()=>{
  const s=game.makeState(0);
  assert.equal(game.advance(s,'left').x,s.x);
  assert.equal(game.advance(s,'up').y,s.y);
  assert.equal(game.advance(s,'noop').moves,s.moves);
});