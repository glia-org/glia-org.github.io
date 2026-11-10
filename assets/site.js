(function(){var rm=matchMedia('(prefers-reduced-motion: reduce)'),T=[4,4,4,4,4,3];
document.querySelectorAll('.hero').forEach(function(h){var b=h.querySelector('.pz input'),s=-1,t=0,l=0;
function f(n){var d=Math.min(n-l,100);l=n;
if(rm.matches){if(s>=0){h.removeAttribute('data-step');s=-1}}
else if(s<0){s=0;t=0;h.setAttribute('data-step',1)}
else if(!(b&&b.checked)){t+=d;if(t>=T[s]*1e3){t-=T[s]*1e3;s=(s+1)%6;h.setAttribute('data-step',s+1)}}
requestAnimationFrame(f)}
requestAnimationFrame(function(n){l=n;f(n)})})})();
