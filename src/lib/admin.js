export const ADMIN_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin — Courses</title><style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:#fafaf7;color:#1a1a1a;line-height:1.6}
nav{display:flex;gap:1.5rem;padding:1rem 2rem;background:#fff;border-bottom:1px solid #e5e5e0;position:sticky;top:0}
nav a{color:#6b6b66;text-decoration:none;font-size:.86rem;font-weight:500}
nav a:hover,.nav-active{color:#C45D2C}
.container{max-width:900px;margin:0 auto;padding:2rem}
h1{font-size:1.5rem;font-weight:800;margin-bottom:1.5rem}
h2{font-size:1.1rem;font-weight:700;margin-bottom:1rem}
table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e5e0;border-radius:8px;overflow:hidden}
th,td{padding:.6rem .8rem;text-align:left;font-size:.85rem;border-bottom:1px solid #f0f0eb}
th{background:#f8f8f5;font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em;color:#6b6b66}
tr:last-child td{border-bottom:none}
.btn{padding:.45rem 1rem;border:none;border-radius:6px;font-size:.8rem;font-weight:600;cursor:pointer}
.btn-p{background:#C45D2C;color:#fff}.btn-d{background:#9A3324;color:#fff}
.form-row{display:flex;gap:.5rem;margin-bottom:.75rem;align-items:center}
input,select{padding:.5rem .7rem;border:1px solid #e5e5e0;border-radius:6px;font-size:.85rem;font-family:inherit;background:#fff}
input:focus{outline:none;border-color:#C45D2C}
.login-box{max-width:360px;margin:80px auto;background:#fff;border:1px solid #e5e5e0;border-radius:12px;padding:32px;text-align:center}
.login-box input{width:100%;margin-bottom:12px;padding:.7rem}
.login-box .btn{width:100%;padding:.7rem}
.status{display:inline-block;padding:2px 8px;border-radius:4px;font-size:.72rem;font-weight:600}
.s-confirmed{background:#e8f5e9;color:#2e7d32}.s-pending{background:#fff3e0;color:#e65100}
.s-downloaded{background:#e3f2fd;color:#1565c0}.s-failed{background:#fbe9e7;color:#c62828}.s-refunded{background:#f3e5f5;color:#6a1b9a}
</style></head><body>
<div id="login-screen">
  <div class="login-box">
    <h2 style="margin-bottom:1.5rem;letter-spacing:-0.02em">Admin Login</h2>
    <input type="password" id="login-pw" placeholder="Password" onkeydown="if(event.key==='Enter')doLogin()"/>
    <button class="btn btn-p" onclick="doLogin()">Login</button>
    <p id="login-err" style="color:#9A3324;font-size:.8rem;margin-top:.75rem;display:none">Invalid password</p>
  </div>
</div>
<div id="app-screen" style="display:none">
<nav>
<a href="javascript:showTab('services')" id="nav-services" class="nav-active">Services</a>
<a href="javascript:showTab('availability')" id="nav-availability">Availability</a>
<a href="javascript:showTab('coupons')" id="nav-coupons">Coupons</a>
<a href="javascript:showTab('bookings')" id="nav-bookings">Recent</a>
<a href="/" style="margin-left:auto">&larr; Site</a>
</nav>
<div class="container" id="content"></div>
</div>
<script>
const A=(u,m,b)=>fetch(u,{method:m,headers:{'Content-Type':'application/json'},body:b?JSON.stringify(b):undefined}).then(r=>r.json())
const F=p=>'₹'+(p||0).toLocaleString('en-IN')
const D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const SC={confirmed:'s-confirmed',pending:'s-pending',downloaded:'s-downloaded',failed:'s-failed',refunded:'s-refunded'}

async function doLogin(){
  const pw=document.getElementById('login-pw').value
  const r=await A('/admin/login','POST',{password:pw})
  if(r.ok){document.getElementById('login-screen').style.display='none';document.getElementById('app-screen').style.display='block';showTab('services')}
  else document.getElementById('login-err').style.display='block'
}

(async function(){
  const r=await A('/admin/api/services','GET')
  if(!r.error){document.getElementById('login-screen').style.display='none';document.getElementById('app-screen').style.display='block';showTab('services')}
})()

async function showTab(t){
document.querySelectorAll('.nav-active').forEach(e=>e.classList.remove('nav-active'))
document.getElementById('nav-'+t).classList.add('nav-active')
const c=document.getElementById('content')
if(t==='services'){
const s=await A('/admin/api/services','GET')
if(s.error) return
c.innerHTML='<h1>Services</h1><div class="form-row"><input id="s-slug" placeholder="slug"><input id="s-name" placeholder="name"><input id="s-price" type="number" placeholder="price"></div><button class="btn btn-p" onclick="addSvc()">Add / Update</button><br><br><table><tr><th>Slug</th><th>Name</th><th>Price</th><th></th></tr>'+s.map(v=>'<tr><td>'+v.slug+'</td><td>'+v.name+'</td><td>'+F(v.price)+'</td><td><button class="btn btn-d" onclick="delSvc(\''+v.slug+'\')">Deactivate</button></td></tr>').join('')+'</table>'
}
if(t==='availability'){
const a=await A('/admin/api/availability','GET')
if(a.error) return
c.innerHTML='<h1>Availability</h1><div class="form-row"><select id="a-dow">'+D.map((d,i)=>'<option value="'+i+'">'+d+'</option>').join('')+'</select><input id="a-start" placeholder="Start (HH:MM)" value="12:00"><input id="a-end" placeholder="End (HH:MM)" value="17:00"></div><button class="btn btn-p" onclick="addAv()">Add / Update</button><br><br><table><tr><th>Day</th><th>Start</th><th>End</th><th></th></tr>'+a.map(r=>'<tr><td>'+D[r.day_of_week]+'</td><td>'+r.start_time+'</td><td>'+r.end_time+'</td><td><button class="btn btn-d" onclick="delAv('+r.day_of_week+')">Remove</button></td></tr>').join('')+'</table>'
}
if(t==='coupons'){
const sv=await A('/admin/api/services','GET')
c.innerHTML='<h1>Coupons</h1><div class="form-row"><input id="c-code" placeholder="CODE"><input id="c-discount" type="number" placeholder="Discount %"><select id="c-service"><option value="">All services</option>'+sv.map(s=>'<option value="'+s.slug+'">'+s.name+'</option>').join('')+'</select><input id="c-max" type="number" placeholder="Max uses (0=unlimited)"></div><button class="btn btn-p" onclick="addCp()">Add / Update</button><br><br><table id="cp-table"><tr><th>Code</th><th>Discount</th><th>Service</th><th>Used/Max</th><th></th></tr></table>'; loadCp()
}
if(t==='bookings'){
const ct=await A('/admin/api/contacts','GET')
if(ct.error) return
c.innerHTML='<h1>Recent Activity</h1><table><tr><th>Date</th><th>Time</th><th>Name</th><th>Email</th><th>Service</th><th>Price</th><th>Status</th></tr>'+ct.map(r=>'<tr><td>'+r.date+'</td><td>'+r.time+'</td><td>'+r.name+'</td><td>'+r.email+'</td><td>'+(r.service_name||r.resource||'-')+'</td><td>'+F(r.price)+'</td><td><span class="status '+(SC[r.status]||'')+'">'+r.status+'</span></td></tr>').join('')+'</table>'
}}
async function loadCp(){
const r=await A('/admin/api/coupons','GET')
const t=document.getElementById('cp-table')
if(t&&!r.error) t.innerHTML='<tr><th>Code</th><th>Discount</th><th>Service</th><th>Used/Max</th><th></th></tr>'+r.map(c=>'<tr><td>'+c.code+'</td><td>'+c.discount_percent+'%</td><td>'+(c.service||'All')+'</td><td>'+c.used+'/'+(c.max_uses||'∞')+'</td><td><button class="btn btn-d" onclick="delCp(\''+c.code+'\')">Deactivate</button></td></tr>').join('')
}
window.addSvc=async()=>{await A('/admin/api/services','POST',{slug:g('s-slug'),name:g('s-name'),price:parseInt(g('s-price'))});showTab('services')}
window.delSvc=async(s)=>{await A('/admin/api/services','DELETE',{slug:s});showTab('services')}
window.addAv=async()=>{await A('/admin/api/availability','POST',{day_of_week:parseInt(g('a-dow')),start_time:g('a-start'),end_time:g('a-end')});showTab('availability')}
window.delAv=async(d)=>{await A('/admin/api/availability','DELETE',{day_of_week:d});showTab('availability')}
window.addCp=async()=>{await A('/admin/api/coupons','POST',{code:g('c-code'),discount_percent:parseInt(g('c-discount')),service:g('c-service'),max_uses:parseInt(g('c-max'))||0});showTab('coupons')}
window.delCp=async(c)=>{await A('/admin/api/coupons','DELETE',{code:c});showTab('coupons')}
function g(id){return document.getElementById(id).value}
</script></body></html>`
