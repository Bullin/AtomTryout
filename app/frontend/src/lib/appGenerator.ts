/**
 * 通用小型应用生成器（本地规则引擎，非真实大模型）。
 * 根据自然语言需求识别标题、字段、按钮与核心交互，
 * 生成可在浏览器独立运行的 HTML / CSS / JavaScript 小应用，
 * 数据通过 localStorage 持久化。不依赖登录、支付、服务端数据库或外部 API Key。
 */

export interface GenResult {
  /** 完整可独立运行的 HTML 文档 */
  html: string;
  /** 样式部分（styles.css） */
  css: string;
  /** 脚本部分（app.js） */
  js: string;
  kind: string;
  label: string;
  unsupported: boolean;
}

const CSS = `
:root{--bg:#f6faf8;--card:#fff;--line:#dde7e1;--ink:#16241d;--mut:#66766e;--pri:#16a34a;--pri2:#15803d;--warn:#b45309}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:var(--bg);color:var(--ink);padding:20px;max-width:520px;margin:0 auto}
h1{font-size:18px;margin:0 0 2px}
.sub{color:var(--mut);font-size:12px;margin:0 0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:14px;margin-bottom:12px}
.row{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.grow{flex:1;min-width:120px}
input,select{border:1px solid var(--line);border-radius:6px;padding:8px 10px;font-size:14px;background:#fff;color:var(--ink);outline:none;min-width:0;width:100%}
input:focus{border-color:var(--pri)}
button{border:none;border-radius:6px;padding:8px 14px;font-size:14px;cursor:pointer;background:var(--pri);color:#fff;font-weight:500}
button:active{transform:scale(.97)}
button.ghost{background:#fff;color:var(--ink);border:1px solid var(--line)}
button.danger{background:#fff;color:var(--warn);border:1px solid #fde4c8}
ul{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
li{display:flex;align-items:center;gap:10px;border:1px solid var(--line);background:#fff;border-radius:8px;padding:10px 12px;font-size:14px}
li .t{flex:1;word-break:break-word}
li.done .t{text-decoration:line-through;color:var(--mut)}
.li-del{background:none;color:var(--mut);padding:2px 8px;font-size:16px;border:none}
.empty{color:var(--mut);font-size:13px;text-align:center;padding:18px;border:1px dashed var(--line);border-radius:8px}
.big{font-size:52px;font-weight:700;text-align:center;letter-spacing:2px;font-variant-numeric:tabular-nums;margin:8px 0}
.stat{text-align:center;color:var(--mut);font-size:13px;margin:6px 0 0}
.bar{height:8px;border-radius:4px;background:var(--line);overflow:hidden;margin-top:6px}
.bar>i{display:block;height:100%;background:var(--pri)}
.chip{font-size:12px;color:var(--mut)}
.total{display:flex;justify-content:space-between;font-size:14px;padding:10px 2px;border-top:1px solid var(--line);margin-top:10px;font-weight:600}
.cal-disp{background:#0f172a;color:#e2e8f0;border-radius:8px;padding:18px 14px;text-align:right;font-size:28px;font-weight:600;min-height:64px;word-break:break-all;font-variant-numeric:tabular-nums}
.cal-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
.cal-grid button{padding:16px 0;font-size:16px;background:#fff;color:var(--ink);border:1px solid var(--line)}
.cal-grid button.op{background:#ecfdf5;color:var(--pri2);border-color:#bbf7d0}
.cal-grid button.eq{background:var(--pri);color:#fff}
.g2048-wrap{position:relative;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.g2048{position:relative;aspect-ratio:1/1;background:#bbada0;border-radius:8px;padding:8px;touch-action:none;transition:background .12s}
.g2048.pressed{background:#a3907d}
.g2048 .cell,.g2048 .tile{position:absolute;width:calc((100% - 40px)/4);height:calc((100% - 40px)/4);left:calc(8px + var(--x,0) * (8px + (100% - 40px)/4));top:calc(8px + var(--y,0) * (8px + (100% - 40px)/4))}
.g2048 .cell{background:#cdc1b4;border-radius:6px}
.g2048 .tile{display:flex;align-items:center;justify-content:center;border-radius:6px;background:#eee4da;font-weight:700;font-size:clamp(17px,7vw,30px);color:#776e65;font-variant-numeric:tabular-nums;transition:left .12s ease,top .12s ease;z-index:1}
@keyframes gspawn{from{transform:scale(0)}}
@keyframes gpop{0%{transform:scale(1)}55%{transform:scale(1.16)}100%{transform:scale(1)}}
.g2048 .tile.spawn{animation:gspawn .16s ease}
.g2048 .tile.merged{animation:gpop .2s ease;z-index:2}
.g2048 .t4{background:#ede0c8}
.g2048 .t8{background:#f2b179;color:#fff}.g2048 .t16{background:#f59563;color:#fff}
.g2048 .t32{background:#f67c5f;color:#fff}.g2048 .t64{background:#f65e3b;color:#fff}
.g2048 .t128{background:#edcf72;color:#fff}.g2048 .t256{background:#edcc61;color:#fff}
.g2048 .t512{background:#edc850;color:#fff}
.g2048 .t1024{background:#edc53f;color:#fff}.g2048 .t2048{background:#edc22e;color:#fff}
.g2048 .big{background:#3c3a32;color:#fff}
.g2048 .t128,.g2048 .t256,.g2048 .t512{font-size:clamp(13px,5.4vw,23px)}
.g2048 .t1024,.g2048 .t2048,.g2048 .big{font-size:clamp(10px,4.3vw,18px)}
.scorebox{display:flex;gap:8px;margin-bottom:12px;align-items:stretch}
.scorebox .sb{flex:1;background:#bbada0;color:#fff;border-radius:8px;text-align:center;padding:6px 0}
.scorebox .sb b{display:block;font-size:19px;font-variant-numeric:tabular-nums}
.scorebox .sb span{font-size:11px;opacity:.85}
.overlay{position:absolute;inset:8px;background:rgba(238,228,218,.82);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;font-size:19px;font-weight:700;color:#776e65}
.overlay.hidden{display:none}
.hint{color:var(--mut);font-size:12px;margin-top:10px;text-align:center}
`;

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sanitizeKey(name: string): string {
  const s = String(name).replace(/[^\w\u4e00-\u9fa5-]/g, '').slice(0, 24);
  return `atom-gen-${s || 'app'}`;
}

function wrap(title: string, sub: string, body: string, script: string): { html: string; css: string; js: string } {
  const html =
    '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8" />' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<title>' + esc(title) + '</title><style>' + CSS + '</style></head><body>' +
    '<h1>' + esc(title) + '</h1><p class="sub">' + esc(sub) + '</p>' +
    body + '<scr' + 'ipt>' + script + '</scr' + 'ipt></body></html>';
  return { html, css: CSS.trim(), js: script.trim() };
}

/** 从完整 HTML 中拆出 css / js（用于兼容旧数据） */
export function extractParts(html: string): { css: string; js: string } {
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? '';
  const js = html.match(/<script>([\s\S]*?)<\/script>/)?.[1] ?? '';
  return { css: css.trim(), js: js.trim() };
}

const LIST_JS = (key: string) => `
var KEY='${key}';
var items=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(items));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function render(){
  var ul=document.getElementById('list');
  if(!items.length){ul.innerHTML='<div class="empty">还没有记录，添加第一条吧</div>';return;}
  ul.innerHTML='';
  items.forEach(function(it){
    var li=document.createElement('li');
    if(it.done)li.className='done';
    var c=document.createElement('input');c.type='checkbox';c.checked=!!it.done;c.style.width='16px';
    c.onchange=function(){it.done=!it.done;save();render();};
    var t=document.createElement('span');t.className='t';t.textContent=it.text;
    var d=document.createElement('button');d.className='li-del';d.textContent='×';d.title='删除';
    d.onclick=function(){items=items.filter(function(x){return x.id!==it.id;});save();render();};
    li.appendChild(c);li.appendChild(t);li.appendChild(d);ul.appendChild(li);
  });
  var n=document.getElementById('cnt');if(n)n.textContent='共 '+items.length+' 条';
}
document.getElementById('add').onclick=function(){
  var i=document.getElementById('inp');var v=i.value.trim();if(!v)return;
  items.push({id:uid(),text:v,done:false});i.value='';save();render();
};
document.getElementById('inp').addEventListener('keydown',function(e){if(e.key==='Enter')document.getElementById('add').click();});
render();`;

function buildTodo(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="row"><input id="inp" class="grow" placeholder="输入一条待办" /><button id="add">添加</button></div>' +
    '<p class="chip" id="cnt"></p><ul id="list"></ul>';
  const p = wrap(name, '待办清单 · 数据保存在本地浏览器', body, LIST_JS(key));
  return { ...p, kind: 'todo', label: '待办清单', unsupported: false };
}

function buildHabit(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="row"><input id="inp" class="grow" placeholder="输入一个习惯，如：阅读 30 分钟" /><button id="add">添加</button></div>' +
    '<p class="chip" id="cnt"></p><ul id="list"></ul>';
  const p = wrap(name, '习惯打卡 · 勾选即完成今日打卡', body, LIST_JS(key));
  return { ...p, kind: 'habit', label: '习惯打卡', unsupported: false };
}

function buildGeneric(name: string, t: string): GenResult {
  const key = sanitizeKey(name);
  const hasMoney = /金额|钱|元|价格|费用|花费|数量|个数|分数/.test(t);
  const body =
    '<div class="row"><input id="inp" class="grow" placeholder="输入内容" />' +
    (hasMoney ? '<input id="amt" style="max-width:110px" placeholder="数值" inputmode="decimal" />' : '') +
    '<button id="add">添加</button></div>' +
    '<p class="chip" id="cnt"></p><ul id="list"></ul>';
  const script = hasMoney
    ? `var KEY='${key}';var items=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(items));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function render(){var ul=document.getElementById('list');
 if(!items.length){ul.innerHTML='<div class="empty">还没有记录</div>';var n=document.getElementById('cnt');if(n)n.textContent='';return;}
 ul.innerHTML='';var total=0;
 items.forEach(function(it){total+=(+it.amt||0);
  var li=document.createElement('li');var t=document.createElement('span');t.className='t';t.textContent=it.text+(it.amt?('（'+it.amt+'）'):'');
  var d=document.createElement('button');d.className='li-del';d.textContent='×';d.onclick=function(){items=items.filter(function(x){return x.id!==it.id;});save();render();};
  li.appendChild(t);li.appendChild(d);ul.appendChild(li);});
 document.getElementById('cnt').textContent='共 '+items.length+' 条 · 合计 '+total;}
document.getElementById('add').onclick=function(){var i=document.getElementById('inp');var a=document.getElementById('amt');var v=i.value.trim();if(!v)return;
 items.push({id:uid(),text:v,amt:a?a.value.trim():''});i.value='';if(a)a.value='';save();render();};
render();`
    : LIST_JS(key);
  const p = wrap(name, '自定义记录应用 · 数据保存在本地浏览器', body, script);
  return { ...p, kind: 'generic', label: '自定义应用', unsupported: false };
}

function buildPomodoro(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="card"><div class="big" id="time">25:00</div>' +
    '<p class="stat" id="sess"></p>' +
    '<p class="stat" id="msg" style="opacity:0;transition:opacity .4s;color:var(--pri);font-weight:600"></p></div>' +
    '<div class="row"><button id="start" class="grow">开始</button><button id="reset" class="ghost grow">重置</button></div>' +
    '<p class="chip">标准番茄钟 25 分钟，完成一次自动累计。</p>';
  const script = `var KEY='${key}';var S=JSON.parse(localStorage.getItem(KEY)||'{"sessions":0}');
var FOCUS=25*60,left=FOCUS,run=null;
var el=document.getElementById('time'),se=document.getElementById('sess'),btn=document.getElementById('start'),msg=document.getElementById('msg');
function fmt(x){var m=Math.floor(x/60),s=x%60;return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
function render(){el.textContent=fmt(left);se.textContent='已完成 '+S.sessions+' 个番茄钟';}
function save(){localStorage.setItem(KEY,JSON.stringify(S));}
function flash(m){msg.textContent=m;msg.style.opacity='1';setTimeout(function(){msg.style.opacity='0';},1800);}
function stop(){if(run){clearInterval(run);run=null;}btn.textContent='开始';}
function start(){if(run){stop();return;}run=setInterval(function(){left--;if(left<=0){S.sessions++;save();left=FOCUS;stop();render();flash('完成一个番茄钟 🎉');}else render();},1000);btn.textContent='暂停';}
btn.onclick=start;
document.getElementById('reset').onclick=function(){stop();left=FOCUS;render();};
render();`;
  const p = wrap(name, '番茄专注计时 · 数据保存在本地浏览器', body, script);
  return { ...p, kind: 'pomodoro', label: '番茄专注', unsupported: false };
}

function buildCountdown(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="card"><div class="big" id="time">05:00</div><p class="stat" id="msg" style="opacity:0;transition:opacity .4s;color:var(--pri);font-weight:600"></p></div>' +
    '<div class="row"><input id="mins" style="max-width:120px" type="number" min="1" value="5" placeholder="分钟" /><button id="start" class="grow">开始</button><button id="reset" class="ghost">重置</button></div>';
  const script = `var KEY='${key}';var saved=parseInt(localStorage.getItem(KEY)||'300',10);var left=saved,run=null;
var el=document.getElementById('time'),btn=document.getElementById('start'),msg=document.getElementById('msg'),mi=document.getElementById('mins');
function fmt(x){var m=Math.floor(x/60),s=x%60;return (m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
function render(){el.textContent=fmt(left);}
function stop(){if(run){clearInterval(run);run=null;}btn.textContent='开始';}
function start(){if(run){stop();return;}run=setInterval(function(){left--;if(left<=0){stop();render();msg.textContent='⏰ 时间到！';msg.style.opacity='1';setTimeout(function(){msg.style.opacity='0';},2500);}else render();},1000);btn.textContent='暂停';}
btn.onclick=start;
document.getElementById('reset').onclick=function(){stop();var m=parseInt(mi.value,10)||5;left=m*60;localStorage.setItem(KEY,String(left));render();};
mi.onchange=function(){var m=parseInt(mi.value,10)||5;left=m*60;localStorage.setItem(KEY,String(left));render();};
render();`;
  const p = wrap(name, '倒计时 · 数据保存在本地浏览器', body, script);
  return { ...p, kind: 'countdown', label: '倒计时', unsupported: false };
}

function buildAccounting(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="row"><input id="note" class="grow" placeholder="备注，如：午餐" />' +
    '<input id="amt" style="max-width:110px" placeholder="金额" inputmode="decimal" />' +
    '<select id="type" style="max-width:96px"><option value="expense">支出</option><option value="income">收入</option></select>' +
    '<button id="add">记一笔</button></div>' +
    '<div class="card"><div class="total"><span>结余</span><span id="bal">0</span></div>' +
    '<div class="chip" style="display:flex;justify-content:space-between"><span>收入 <b id="inc">0</b></span><span>支出 <b id="exp">0</b></span></div></div>' +
    '<ul id="list"></ul>';
  const script = `var KEY='${key}';var items=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(items));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function render(){var ul=document.getElementById('list');var inc=0,exp=0;
 items.forEach(function(it){var a=+it.amt||0;if(it.type==='income')inc+=a;else exp+=a;});
 document.getElementById('inc').textContent=inc;document.getElementById('exp').textContent=exp;document.getElementById('bal').textContent=(inc-exp);
 if(!items.length){ul.innerHTML='<div class="empty">还没有账目</div>';return;}
 ul.innerHTML='';
 items.slice().reverse().forEach(function(it){var li=document.createElement('li');
  var t=document.createElement('span');t.className='t';t.textContent=(it.type==='income'?'+':'-')+' '+it.amt+'  '+(it.note||'');
  if(it.type==='income')t.style.color='var(--pri2)';
  var d=document.createElement('button');d.className='li-del';d.textContent='×';d.onclick=function(){items=items.filter(function(x){return x.id!==it.id;});save();render();};
  li.appendChild(t);li.appendChild(d);ul.appendChild(li);});}
document.getElementById('add').onclick=function(){var n=document.getElementById('note'),a=document.getElementById('amt'),ty=document.getElementById('type');
 var amt=parseFloat(a.value);if(!amt||amt<=0){a.focus();return;}
 items.push({id:uid(),note:n.value.trim(),amt:amt,type:ty.value});n.value='';a.value='';save();render();};
render();`;
  const p = wrap(name, '记账应用 · 数据保存在本地浏览器', body, script);
  return { ...p, kind: 'accounting', label: '记账', unsupported: false };
}

function buildCalculator(name: string): GenResult {
  const body = '<div class="cal-disp" id="disp">0</div><div class="cal-grid" id="grid"></div>';
  const script = `var disp=document.getElementById('disp'),expr='';
function show(){disp.textContent=expr||'0';}
function calc(e){if(!/^[0-9+\\-*/(). ]+$/.test(e))return null;try{var r=Function('"use strict";return('+e+')')();return (typeof r==='number'&&isFinite(r))?String(Math.round(r*1e6)/1e6):null;}catch(x){return null;}}
var keys=['C','←','(',')','7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'];
var grid=document.getElementById('grid');
keys.forEach(function(k){var b=document.createElement('button');b.textContent=k;
 if(k==='='||k==='C'||k==='←')b.className=k==='='?'eq':'op';
 if(/[+\\-*/()]/.test(k)&&k!=='C'&&k!=='←')b.className='op';
 b.onclick=function(){
  if(k==='C'){expr='';show();return;}
  if(k==='←'){expr=expr.slice(0,-1);show();return;}
  if(k==='='){var r=calc(expr);expr=(r===null?'错误':r);show();return;}
  expr+=k;show();};
 grid.appendChild(b);});
show();`;
  const p = wrap(name, '计算器 · 浏览器内运行', body, script);
  return { ...p, kind: 'calculator', label: '计算器', unsupported: false };
}

function buildVoting(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="row"><input id="inp" class="grow" placeholder="输入一个选项" /><button id="add">添加选项</button></div>' +
    '<ul id="list"></ul><div class="row" style="margin-top:12px"><button id="reset" class="ghost">清空票数</button></div>';
  const script = `var KEY='${key}';var opts=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(opts));}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function render(){var ul=document.getElementById('list');var max=1;opts.forEach(function(o){if(o.count>max)max=o.count;});
 if(!opts.length){ul.innerHTML='<div class="empty">还没有选项</div>';return;}
 ul.innerHTML='';
 opts.forEach(function(o){var li=document.createElement('li');li.style.display='block';
  var top=document.createElement('div');top.style.display='flex';top.style.alignItems='center';top.style.gap='10px';
  var t=document.createElement('span');t.className='t';t.textContent=o.label;
  var v=document.createElement('button');v.textContent='投票 +1';v.style.padding='4px 10px';v.onclick=function(){o.count++;save();render();};
  var c=document.createElement('span');c.className='chip';c.textContent=o.count+' 票';
  var d=document.createElement('button');d.className='li-del';d.textContent='×';d.onclick=function(){opts=opts.filter(function(x){return x.id!==o.id;});save();render();};
  top.appendChild(t);top.appendChild(c);top.appendChild(v);top.appendChild(d);
  var bar=document.createElement('div');bar.className='bar';var i=document.createElement('i');i.style.width=(o.count/max*100)+'%';bar.appendChild(i);
  li.appendChild(top);li.appendChild(bar);ul.appendChild(li);});}
document.getElementById('add').onclick=function(){var inp=document.getElementById('inp');var v=inp.value.trim();if(!v)return;
 opts.push({id:uid(),label:v,count:0});inp.value='';save();render();};
document.getElementById('reset').onclick=function(){opts.forEach(function(o){o.count=0;});save();render();};
render();`;
  const p = wrap(name, '投票应用 · 数据保存在本地浏览器', body, script);
  return { ...p, kind: 'voting', label: '投票', unsupported: false };
}

function build2048(name: string): GenResult {
  const key = sanitizeKey(name);
  const body =
    '<div class="scorebox"><div class="sb"><span>分数</span><b id="score">0</b></div>' +
    '<div class="sb"><span>最高分</span><b id="best">0</b></div>' +
    '<button id="new" class="ghost">新游戏</button></div>' +
    '<div class="g2048-wrap"><div class="g2048" id="grid"></div>' +
    '<div class="overlay hidden" id="overlay"><span id="ovmsg"></span><button id="again">再来一局</button></div></div>' +
    '<p class="chip" id="msg" style="display:block;text-align:center;min-height:18px;margin-top:8px"></p>' +
    '<p class="hint">键盘方向键或手机滑动移动方块，合并相同数字，冲击 2048！</p>';
  const script = `var KEY='${key}';
var best=parseInt(localStorage.getItem(KEY+'-best')||'0',10);
var grid,score,over,won,anim,tiles,idc;
function cls(v){return v<=2048?'t'+v:'big';}
function pos(t){t.el.style.setProperty('--x',t.c);t.el.style.setProperty('--y',t.r);}
function mk(r,c,v){var t={id:++idc,r:r,c:c,v:v};
var d=document.createElement('div');d.className='tile '+cls(v)+' spawn';d.textContent=v;t.el=d;pos(t);
grid[r][c]=t;tiles.push(t);document.getElementById('grid').appendChild(d);return t;}
function spawn(){var e=[];for(var r=0;r<4;r++)for(var c=0;c<4;c++)if(!grid[r][c])e.push([r,c]);
if(!e.length)return null;var p=e[Math.floor(Math.random()*e.length)];return mk(p[0],p[1],Math.random()<0.9?2:4);}
function newGame(){grid=[[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null]];
score=0;over=false;won=false;anim=false;tiles=[];idc=0;
var g=document.getElementById('grid');
Array.prototype.slice.call(g.querySelectorAll('.tile')).forEach(function(e){e.parentNode.removeChild(e);});
document.getElementById('overlay').classList.add('hidden');
spawn();spawn();hud();}
function vec(d){return {left:[0,-1],right:[0,1],up:[-1,0],down:[1,0]}[d];}
function move(dir){if(over||anim)return;
var v=vec(dir),dr=v[0],dc=v[1],rs=[0,1,2,3],cs=[0,1,2,3];
if(dr>0)rs.reverse();if(dc>0)cs.reverse();
var moved=false,merges=[];
for(var i=0;i<4;i++)for(var j=0;j<4;j++){var r=rs[i],c=cs[j],t=grid[r][c];if(!t)continue;
var nr=r,nc=c;
while(true){var tr=nr+dr,tc=nc+dc;if(tr<0||tr>3||tc<0||tc>3||grid[tr][tc])break;nr=tr;nc=tc;}
var t2=nr+dr,c2=nc+dc,nxt=(t2>=0&&t2<4&&c2>=0&&c2<4)?grid[t2][c2]:null;
if(nxt&&nxt.v===t.v&&!nxt.locked){grid[r][c]=null;t.r=nr;t.c=nc;t.dead=true;pos(t);
nxt.v*=2;nxt.locked=true;score+=nxt.v;merges.push(nxt);moved=true;}
else if(nr!==r||nc!==c){grid[r][c]=null;grid[nr][nc]=t;t.r=nr;t.c=nc;pos(t);moved=true;}}
if(!moved)return;anim=true;
try{if(navigator.vibrate)navigator.vibrate(merges.length?14:8);}catch(e){}
setTimeout(function(){
tiles.forEach(function(t){if(t.dead&&t.el.parentNode)t.el.parentNode.removeChild(t.el);});
tiles=tiles.filter(function(t){return !t.dead;});
merges.forEach(function(t){t.locked=false;
t.el.textContent=t.v;t.el.className='tile '+cls(t.v);void t.el.offsetWidth;t.el.className='tile '+cls(t.v)+' merged';
if(t.v===2048&&!won){won=true;flash('🎉 达成 2048！继续挑战更高分');}});
spawn();check();hud();anim=false;},130);}
function check(){for(var r=0;r<4;r++)for(var c=0;c<4;c++){if(!grid[r][c])return;
var v=grid[r][c].v;if(c<3&&grid[r][c+1]&&grid[r][c+1].v===v)return;if(r<3&&grid[r+1][c]&&grid[r+1][c].v===v)return;}
over=true;document.getElementById('overlay').classList.remove('hidden');
document.getElementById('ovmsg').textContent='游戏结束 · 得分 '+score;}
function hud(){document.getElementById('score').textContent=score;
if(score>best){best=score;localStorage.setItem(KEY+'-best',String(best));}
document.getElementById('best').textContent=best;}
function flash(m){var el=document.getElementById('msg');el.textContent=m;setTimeout(function(){el.textContent='';},2600);}
window.addEventListener('keydown',function(e){var m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'}[e.key];if(m){e.preventDefault();move(m);}});
var sx=0,sy=0,board=document.getElementById('grid');
board.addEventListener('touchstart',function(e){var t=e.changedTouches[0];sx=t.clientX;sy=t.clientY;board.classList.add('pressed');},{passive:true});
board.addEventListener('touchmove',function(e){e.preventDefault();},{passive:false});
board.addEventListener('touchend',function(e){board.classList.remove('pressed');
var t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;
if(Math.abs(dx)>Math.abs(dy))move(dx>0?'right':'left');else move(dy>0?'down':'up');},{passive:true});
document.getElementById('new').onclick=newGame;
document.getElementById('again').onclick=newGame;
(function(){var g=document.getElementById('grid');for(var i=0;i<16;i++){var d=document.createElement('div');d.className='cell';d.style.setProperty('--x',i%4);d.style.setProperty('--y',Math.floor(i/4));g.appendChild(d);}})();
newGame();`;
  const p = wrap(name, '2048 小游戏 · 最高分保存在本地浏览器', body, script);
  return { ...p, kind: 'game2048', label: '2048 小游戏', unsupported: false };
}

function buildUnsupported(name: string): GenResult {
  const body =
    '<div class="card" style="text-align:center">' +
    '<p style="font-size:15px;font-weight:600;margin:0 0 6px">当前仅支持浏览器内运行的小型应用</p>' +
    '<p class="sub" style="margin:0">无法生成需要登录、支付、服务端数据库或外部 API 的应用。<br />试试：番茄钟、待办、记账、习惯打卡、计算器、投票、倒计时。</p></div>';
  const p = wrap(name, '需求超出当前生成范围', body, 'void 0;');
  return { ...p, kind: 'unsupported', label: '暂不支持', unsupported: true };
}

function detect(t: string): string {
  if (/2048/.test(t)) return 'game2048';
  if (/登录|注册|支付|付款|信用卡|数据库|服务器|后端|接口|地图|定位|导航|实时|聊天|客服|人工智能|\bAI\b|视频|直播|语音|3D|三维|区块链|多用户|协作|权限|用户系统/.test(t)) return 'unsupported';
  if (/番茄|pomodoro/i.test(t)) return 'pomodoro';
  if (/倒计时|countdown/i.test(t)) return 'countdown';
  if (/计算器|calculator|算术|加减乘除/.test(t)) return 'calculator';
  if (/投票|vote|表决/.test(t)) return 'voting';
  if (/记账|账本|支出|收入|记一笔|报销|预算|expense|budget/i.test(t)) return 'accounting';
  if (/待办|清单|todo/i.test(t)) return 'todo';
  if (/习惯|打卡|habit/i.test(t)) return 'habit';
  return 'generic';
}

/** 根据需求文本生成可运行的小应用（html / css / js 三部分） */
export function generateApp(spec: string, appName: string): GenResult {
  const t = (spec || '').toLowerCase();
  const name = appName || '我的应用';
  switch (detect(t)) {
    case 'unsupported': return buildUnsupported(name);
    case 'game2048': return build2048(name);
    case 'pomodoro': return buildPomodoro(name);
    case 'countdown': return buildCountdown(name);
    case 'calculator': return buildCalculator(name);
    case 'voting': return buildVoting(name);
    case 'accounting': return buildAccounting(name);
    case 'todo': return buildTodo(name);
    case 'habit': return buildHabit(name);
    default: return buildGeneric(name, t);
  }
}