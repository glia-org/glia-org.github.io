/* glia-org.github.io: fetches a band's script (its data-js, a file of this site) once the band comes within one screen
   of the view, so the first screen loads none of them. Each script starts its piece only while its band is in view. */
(function(){
if(!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);
  var s=document.createElement('script');s.src=e.target.getAttribute('data-js');document.head.appendChild(s)})},{rootMargin:'100% 0px'});
document.querySelectorAll('.band[data-js]').forEach(function(b){io.observe(b)});
})();
