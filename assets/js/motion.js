/* Looping screen recordings (video.shot-video).
   - Nothing autoplays from markup: the poster image shows until this runs, so
     with JS off, or before it loads, the still is what people see.
   - A video plays only while it is on screen, and pauses when it scrolls away.
   - Under prefers-reduced-motion: reduce, videos never play; the poster stays.
     If the setting changes while the page is open, playback follows it. */
(function () {
  var videos = Array.prototype.slice.call(document.querySelectorAll("video.shot-video"));
  if (!videos.length) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var visible = new Map();

  function update(video) {
    if (!reduce.matches && visible.get(video)) {
      if (video.preload === "none") video.preload = "auto";
      var p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(function (err) {
          // Autoplay refused (e.g. data saver): leave the poster showing.
          console.warn("shot-video: playback blocked", err && err.name);
        });
      }
    } else {
      video.pause();
    }
  }

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        visible.set(e.target, e.isIntersecting);
        update(e.target);
      });
    }, { threshold: 0.25 });
    videos.forEach(function (v) { io.observe(v); });
  } else {
    videos.forEach(function (v) { visible.set(v, true); update(v); });
  }

  var onChange = function () { videos.forEach(update); };
  if (reduce.addEventListener) reduce.addEventListener("change", onChange);
  else if (reduce.addListener) reduce.addListener(onChange);
})();
