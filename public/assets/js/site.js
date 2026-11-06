// Page behaviour shared by every page: the scroll reveal, the mobile menu
// button and the Desktop page's Understand / Translate / Check tabs (all
// carried over unchanged from the static site's inline script), plus the
// language switcher. Loaded at the end of <body>, not deferred, exactly where
// the inline script used to run. The Menu button's label comes from the
// script tag's data-menu attribute so it is translated with the page.
(function(){
var d=document;d.documentElement.classList.add('js');
var menuLabel=(d.currentScript&&d.currentScript.getAttribute('data-menu'))||'Menu';
// scroll reveal
var els=[].slice.call(d.querySelectorAll('section .wrap > *'));
els.forEach(function(e){e.classList.add('reveal')});
if('IntersectionObserver' in window){var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.08});els.forEach(function(e){io.observe(e)})}else{els.forEach(function(e){e.classList.add('in')})}
// mobile menu
var nav=d.querySelector('header nav');
if(nav){var b=d.createElement('button');b.className='navtoggle';b.type='button';b.textContent=menuLabel;b.setAttribute('aria-expanded','false');b.setAttribute('aria-controls','mainnav');nav.id='mainnav';nav.parentNode.insertBefore(b,nav);b.addEventListener('click',function(){var o=nav.classList.toggle('open');b.setAttribute('aria-expanded',o)})}
// tabs
var tl=d.querySelector('[role=tablist]');
if(tl){var tabs=[].slice.call(tl.querySelectorAll('[role=tab]'));
function sel(t,f){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;d.getElementById(x.getAttribute('aria-controls')).hidden=!on});if(f)t.focus()}
tabs.forEach(function(t,i){t.addEventListener('click',function(){sel(t)});t.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?i+1:e.key==='ArrowLeft'?i-1:null;if(n!==null){e.preventDefault();sel(tabs[(n+tabs.length)%tabs.length],true)}})})}
// language switcher (open/close; locale.js remembers the pick)
[].slice.call(d.querySelectorAll('.lang-switcher')).forEach(function(root){
var toggle=root.querySelector('button[aria-haspopup]');if(!toggle)return;
function close(focus){if(toggle.getAttribute('aria-expanded')!=='true')return;toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus()}
toggle.addEventListener('click',function(){toggle.setAttribute('aria-expanded',String(toggle.getAttribute('aria-expanded')!=='true'))});
root.addEventListener('keydown',function(e){if(e.key==='Escape')close(true)});
d.addEventListener('click',function(e){if(!root.contains(e.target))close(false)});
});
})();
