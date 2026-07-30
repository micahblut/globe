// Renders the D3 orthographic globe: rotation, zoom, country fills, hover
// tooltip, and gesture handling. Exposes a global `createGlobe` factory used
// by main.js. Knows nothing about localStorage/persistence — it just calls
// back via `onToggleCountry`/`onSelectCountry` and asks `isWatched` for state.
//

(function (global) {
  const CLICK_DISTANCE_THRESHOLD = 4; // px of drag movement below which a gesture counts as a tap/click
  const LONG_PRESS_MS = 500;
  const CENTER_ANIMATION_MS = 700;
  const AUTO_ROTATE_RESUME_MS = 5000; // resume auto-rotation after this long idle, if nothing is selected
  const AUTO_ROTATE_FPS = 24;
  const AUTO_ROTATE_INTERVAL_MS = 1000 / AUTO_ROTATE_FPS;
  const AUTO_ROTATE_DEGREES_PER_SECOND = 1.8; // matches the old 0.03 degrees/frame at 60 Hz
  const ZOOM_TICK_FACTOR = 1.15; // scale multiplier per zoom-in click/tick
  const DART_SPIN_MS = 2000; // total duration of the dart-mode spin-and-land animation
  const DART_MIN_SPINS = 3; // extra full rotations layered on top of the trip to the target
  const DART_MAX_SPINS = 5;

  // These four regions deliberately retain their original, unclipped source
  // geometry (see data/README.md), so keep the expensive projected-area guard
  // only where the orthographic clipper still has a known opportunity to
  // mis-stitch a polygon. All other features are clipped/prepared offline.
  const CLIP_AREA_GUARD_FEATURE_IDS = new Set([
    "643-NORTHWESTERN",
    "643-URAL",
    "643-SIBERIAN",
    "643-FAR-EASTERN",
  ]);

  function createGlobe({
    stage,
    tooltip,
    hint,
    isWatched,
    onToggleCountry,
    onSelectCountry,
    initialZoomTicks = 0,
  }) {
    let width = stage.clientWidth;
    let height = stage.clientHeight;

    const svg = d3
      .select(stage)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const baseScale = Math.min(width, height) / 2.3;
    const minScale = baseScale * 0.7;
    const maxScale = baseScale * 8;
    // e.g. on mobile we start a couple of zoom-in ticks closer than baseScale.
    let scale = Math.min(maxScale, baseScale * Math.pow(ZOOM_TICK_FACTOR, initialZoomTicks));

    const projection = d3
      .geoOrthographic()
      .scale(scale)
      .translate([width / 2, height / 2])
      .clipAngle(90)
      .rotate([0, -20]);

    const path = d3.geoPath(projection);
    const graticule = d3.geoGraticule10();

    const g = svg.append("g");

    g.append("circle")
      .attr("class", "sphere")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", scale);

    const graticulePath = g
      .append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    // Solid fill under countriesGroup (see setCountryBackdrops): masks
    // slivers where a subdivided country's region edges fall short of its
    // actual border with a neighboring country.
    const countryBackdropGroup = g.append("g");

    const countriesGroup = g.append("g");

    // Stroke-only overlay for real country borders (see setCountryBorders):
    // sits on top of countriesGroup so a heavier line covers the seam
    // between a subdivided country's own regions, which are drawn with a
    // lighter stroke in countriesGroup below.
    const countryBordersGroup = g.append("g").attr("class", "country-borders");

    let countries = null;
    let countryBackdrops = null;
    let countryBorders = null;
    let selectedCountryId = null;
    let drawFrame = null;

    // All render requests share one animation-frame slot. Input events may
    // arrive much faster than the display can paint; they still update the
    // projection immediately, but only the latest state is rendered.
    function requestDraw() {
      if (drawFrame != null || document.hidden) return;
      drawFrame = requestAnimationFrame(renderFrame);
    }

    function renderFrame(now) {
      drawFrame = null;

      let onMotionDone = null;
      if (centerAnimation) {
        onMotionDone = advanceCenterAnimation(now);
      } else if (inertiaActive) {
        advanceInertia();
      }

      draw();

      if (onMotionDone) onMotionDone();
      if (centerAnimation || inertiaActive) requestDraw();
    }

    function setCountries(features) {
      countries = features;
      requestDraw();
    }

    function setCountryBackdrops(features) {
      countryBackdrops = features;
      requestDraw();
    }

    function setCountryBorders(features) {
      countryBorders = features;
      requestDraw();
    }

    function draw() {
      g.select("circle.sphere").attr("r", scale);
      graticulePath.attr("d", path);

      if (!countries) return;

      // Defense-in-depth for the four documented unclipped Russian regions.
      // Restricting the area check to them avoids projecting every ordinary
      // country/region twice on every frame.
      const maxPlausibleArea = Math.PI * scale * scale * 0.6;
      function landPath(d) {
        if (!CLIP_AREA_GUARD_FEATURE_IDS.has(String(d.id))) return path(d);
        return Math.abs(path.area(d)) > maxPlausibleArea ? null : path(d);
      }

      if (countryBackdrops) {
        const backdropSel = countryBackdropGroup
          .selectAll("path.land-backdrop")
          .data(countryBackdrops, (d, i) => i);

        backdropSel
          .enter()
          .append("path")
          .attr("class", "land-backdrop")
          .attr("fill-rule", "evenodd")
          .merge(backdropSel)
          .attr("d", path);
      }

      // Key by array index, not d.id: the country list never changes between
      // redraws (only rotation/scale do), so index is always unique and
      // stable. Keying by d.id previously caused ghost/duplicate shapes for
      // features that shared an id (see data/README.md).
      const sel = countriesGroup.selectAll("path.land").data(countries, (d, i) => i);

      sel
        .enter()
        .append("path")
        .attr("class", "land")
        // Use an SVG attribute (rather than CSS) so Chromium invalidates its
        // fill cache as clipped paths change during rotation and zoom.
        .attr("fill-rule", "evenodd")
        .classed("watched", (d) => isWatched(d.id))
        .classed("selected", (d) => String(d.id) === selectedCountryId)
        .on("mousemove", (event, d) => {
          const name = (d.properties && d.properties.name) || "";
          tooltip.textContent = name;
          tooltip.style.opacity = name ? 1 : 0;
          positionTooltip(event);
        })
        .on("mouseleave", () => {
          tooltip.style.opacity = 0;
        })
        .merge(sel)
        .attr("d", landPath);

      if (countryBorders) {
        const borderSel = countryBordersGroup
          .selectAll("path.country-border")
          .data(countryBorders, (d, i) => i);

        borderSel
          .enter()
          .append("path")
          .attr("class", "country-border")
          .attr("fill-rule", "evenodd")
          .merge(borderSel)
          .attr("d", path);
      }
    }

    function refreshWatched() {
      countriesGroup.selectAll("path.land").classed("watched", (d) => isWatched(d.id));
    }

    function selectFeature(d) {
      selectedCountryId = d ? String(d.id) : null;
      countriesGroup
        .selectAll("path.land")
        .classed("selected", (c) => String(c.id) === selectedCountryId);
    }

    function positionTooltip(event) {
      const rect = stage.getBoundingClientRect();
      tooltip.style.left = event.clientX - rect.left + 14 + "px";
      tooltip.style.top = event.clientY - rect.top + 10 + "px";
    }

    // --- Rotate-to-center animation (used when tapping a country on touch) ---
    let centerAnimation = null;

    function cancelCenterAnimation() {
      centerAnimation = null;
    }

    function easeCubicOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeQuintOut(t) {
      return 1 - Math.pow(1 - t, 5);
    }

    // Shared driver behind centerOnFeature and throwDartAt: rotates from the
    // current orientation to [targetLambda, targetPhi], optionally zooming to
    // `targetScale` at the same time. `extraSpins` adds whole extra
    // revolutions (sign = direction) on top of the shortest path, which is
    // what makes the dart-mode throw look like a fast spin that decelerates
    // into place rather than a plain pan.
    function animateRotationTo(targetLambda, targetPhi, options) {
      const { duration, extraSpins = 0, easing = easeCubicOut, targetScale, onDone } = options;
      const [startLambda, startPhi] = projection.rotate();
      const startScale = scale;
      const scaleDelta = targetScale == null ? 0 : targetScale - startScale;

      // Take the shortest path around the sphere rather than always going east.
      const lambdaDelta =
        (((targetLambda - startLambda + 180) % 360 + 360) % 360 - 180) + extraSpins * 360;
      const phiDelta = targetPhi - startPhi;

      cancelCenterAnimation();
      inertiaActive = false;
      centerAnimation = {
        start: performance.now(),
        duration,
        easing,
        startLambda,
        startPhi,
        lambdaDelta,
        phiDelta,
        startScale,
        scaleDelta,
        onDone,
      };
      requestDraw();
    }

    function advanceCenterAnimation(now) {
      const animation = centerAnimation;
      if (!animation) return null;

      const t = Math.min(1, (now - animation.start) / animation.duration);
      const eased = animation.easing(t);
      projection.rotate([
        animation.startLambda + animation.lambdaDelta * eased,
        animation.startPhi + animation.phiDelta * eased,
      ]);
      if (animation.scaleDelta !== 0) {
        scale = animation.startScale + animation.scaleDelta * eased;
        projection.scale(scale);
      }

      if (t < 1) return null;

      centerAnimation = null;
      return animation.onDone || null;
    }

    function centerOnFeature(d) {
      const [lon, lat] = d3.geoCentroid(d);
      animateRotationTo(-lon, -lat, { duration: CENTER_ANIMATION_MS, easing: easeCubicOut });
    }

    // --- Dart mode: fast spin that lands on a random unwatched country ---

    function pulseFeature(d) {
      const sel = countriesGroup.selectAll("path.land").filter((c) => c === d);
      sel.classed("dart-hit", false);
      const node = sel.node();
      if (node) node.getBoundingClientRect(); // force reflow so the animation restarts
      sel.classed("dart-hit", true).on("animationend", function () {
        d3.select(this).classed("dart-hit", false);
      });
    }

    // A closer-in scale for landing on the dart target: a modest bump over
    // wherever the user was already zoomed to, capped at the same maxScale
    // the manual zoom-in button already respects (never zooms out, and never
    // zooms in further than the app already allows elsewhere).
    function dartLandingScale() {
      const DART_ZOOM_FACTOR = 1.35;
      return Math.min(maxScale, scale * DART_ZOOM_FACTOR);
    }

    function throwDartAt(d) {
      const [lon, lat] = d3.geoCentroid(d);
      const spinCount = DART_MIN_SPINS + Math.floor(Math.random() * (DART_MAX_SPINS - DART_MIN_SPINS + 1));
      const spinDirection = Math.random() < 0.5 ? -1 : 1;

      rotationVelocity = [0, 0];
      cancelCenterAnimation();
      stopAutoRotate();

      return new Promise((resolve) => {
        animateRotationTo(-lon, -lat, {
          duration: DART_SPIN_MS,
          extraSpins: spinCount * spinDirection,
          easing: easeQuintOut,
          targetScale: dartLandingScale(),
          onDone: () => {
            selectFeature(d);
            pulseFeature(d);
            if (onSelectCountry) onSelectCountry(d);
            resolve(d);
          },
        });
      });
    }

    // Picks a random not-yet-watched country and spins to it. Resolves with
    // the chosen feature, or null if every country is already watched (or
    // the map hasn't loaded yet).
    function throwDart() {
      if (!countries) return Promise.resolve(null);
      const candidates = countries.filter((d) => !isWatched(d.id));
      if (!candidates.length) return Promise.resolve(null);
      const target = candidates[Math.floor(Math.random() * candidates.length)];
      return throwDartAt(target);
    }

    // --- Drag to rotate, with tap/long-press/click detection ---

    let lastX = null;
    let lastY = null;
    let rotationVelocity = [0, 0];
    let inertiaActive = false;
    let autoRotate = true;
    let lastInteractionAt = performance.now();
    let lastAutoRotateAt = performance.now();
    let autoRotateTimer = null;
    let autoRotateResumeTimer = null;
    let dragging = false;
    let dragDistance = 0;
    let gestureTarget = null;
    let gestureIsTouch = false;
    let longPressTimer = null;
    let longPressFired = false;

    function isLandTarget(target) {
      return Boolean(target && target.classList && target.classList.contains("land"));
    }

    function markInteraction() {
      lastInteractionAt = performance.now();
    }

    function stopAutoRotate() {
      autoRotate = false;
      lastAutoRotateAt = null;
      cancelAutoRotateTick();
      markInteraction();
      scheduleAutoRotateResume();
      if (hint) hint.style.opacity = 0;
    }

    const drag = d3
      .drag()
      .on("start", (event) => {
        dragging = true;
        dragDistance = 0;
        stopAutoRotate();
        cancelCenterAnimation();
        inertiaActive = false;
        lastX = event.x;
        lastY = event.y;
        rotationVelocity = [0, 0];
        longPressFired = false;

        const sourceEvent = event.sourceEvent;
        gestureTarget = sourceEvent ? sourceEvent.target : null;
        // d3-drag attaches separate mousedown/touchstart listener families
        // (not unified Pointer Events), so sourceEvent is a plain TouchEvent
        // for touch gestures — it has no `pointerType` to check. Its `type`
        // ("touchstart" vs "mousedown") is the reliable signal instead.
        gestureIsTouch = Boolean(sourceEvent && sourceEvent.type && sourceEvent.type.startsWith("touch"));

        if (gestureIsTouch && isLandTarget(gestureTarget)) {
          longPressTimer = setTimeout(() => {
            longPressTimer = null;
            if (dragDistance < CLICK_DISTANCE_THRESHOLD) {
              longPressFired = true;
              rotationVelocity = [0, 0];
              markInteraction();
              const d = d3.select(gestureTarget).datum();
              if (d && onToggleCountry) onToggleCountry(d);
            }
          }, LONG_PRESS_MS);
        }
      })
      .on("drag", (event) => {
        const rotate = projection.rotate();
        const dx = event.x - lastX;
        const dy = event.y - lastY;
        dragDistance += Math.hypot(dx, dy);
        if (longPressTimer && dragDistance >= CLICK_DISTANCE_THRESHOLD) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
        const sensitivity = 0.25;
        const newRotate = [
          rotate[0] + dx * sensitivity,
          Math.max(-90, Math.min(90, rotate[1] - dy * sensitivity)),
        ];
        projection.rotate(newRotate);
        rotationVelocity = [dx * sensitivity, -dy * sensitivity];
        lastX = event.x;
        lastY = event.y;
        markInteraction();
        requestDraw();
      })
      .on("end", (event) => {
        dragging = false;
        markInteraction();
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }

        const wasTap = dragDistance < CLICK_DISTANCE_THRESHOLD;
        const tappedLand = wasTap && isLandTarget(gestureTarget);

        if (!longPressFired && tappedLand) {
          const d = d3.select(gestureTarget).datum();
          if (d) {
            if (gestureIsTouch) {
              // Touch has no hover state: a tap selects & centers a country
              // (and kills any residual spin) instead of toggling it directly,
              // so you can see what you're about to mark before long-pressing.
              rotationVelocity = [0, 0];
              selectFeature(d);
              centerOnFeature(d);
              if (onSelectCountry) onSelectCountry(d);
            } else {
              // Mouse: a click always selects (so notes can be checked/edited
              // without changing progress); only a second click within the
              // browser's own double-click window also toggles watched state.
              // `detail` is the native click-count the OS/browser already
              // computes for mouseup, so this reuses that timing/distance
              // heuristic instead of reimplementing it.
              if (onSelectCountry) onSelectCountry(d);
              const clickCount = event.sourceEvent ? event.sourceEvent.detail : 1;
              if (clickCount >= 2 && onToggleCountry) {
                onToggleCountry(d);
              }
            }
          }
        } else if (!longPressFired && wasTap && !tappedLand && selectedCountryId != null) {
          // Tapping the sea or the background outside the globe clears the
          // current touch selection.
          cancelCenterAnimation();
          selectFeature(null);
          if (onSelectCountry) onSelectCountry(null);
        }
        startInertia();
        scheduleAutoRotateResume();
      });

    svg.call(drag);

    function startInertia() {
      inertiaActive =
        !dragging &&
        (Math.abs(rotationVelocity[0]) >= 0.01 || Math.abs(rotationVelocity[1]) >= 0.01);
      if (inertiaActive) requestDraw();
    }

    function advanceInertia() {
      if (dragging) {
        inertiaActive = false;
        return;
      }

      const decay = 0.94;
      rotationVelocity = [rotationVelocity[0] * decay, rotationVelocity[1] * decay];
      if (Math.abs(rotationVelocity[0]) < 0.01 && Math.abs(rotationVelocity[1]) < 0.01) {
        inertiaActive = false;
        scheduleAutoRotateResume();
        return;
      }

      const rotate = projection.rotate();
      projection.rotate([
        rotate[0] + rotationVelocity[0],
        Math.max(-90, Math.min(90, rotate[1] + rotationVelocity[1])),
      ]);
    }

    // --- Zoom (scroll / pinch / buttons) ---
    function setScale(newScale) {
      scale = Math.max(minScale, Math.min(maxScale, newScale));
      projection.scale(scale);
      requestDraw();
    }

    svg.on(
      "wheel",
      (event) => {
        event.preventDefault();
        stopAutoRotate();
        setScale(scale * (event.deltaY < 0 ? 1.08 : 0.92));
      },
      { passive: false }
    );

    // --- Gentle auto-rotation, capped independently of display refresh ---
    function cancelAutoRotateTick() {
      if (autoRotateTimer == null) return;
      clearTimeout(autoRotateTimer);
      autoRotateTimer = null;
    }

    function scheduleAutoRotateTick(delay = AUTO_ROTATE_INTERVAL_MS) {
      if (!autoRotate || document.hidden || autoRotateTimer != null) return;
      autoRotateTimer = setTimeout(runAutoRotateTick, delay);
    }

    function runAutoRotateTick() {
      autoRotateTimer = null;
      if (!autoRotate || document.hidden) return;

      const now = performance.now();
      const elapsed = Math.min(
        AUTO_ROTATE_INTERVAL_MS * 2,
        lastAutoRotateAt == null ? AUTO_ROTATE_INTERVAL_MS : now - lastAutoRotateAt
      );
      lastAutoRotateAt = now;

      const rotate = projection.rotate();
      projection.rotate([
        rotate[0] + (AUTO_ROTATE_DEGREES_PER_SECOND * elapsed) / 1000,
        rotate[1],
      ]);
      requestDraw();
      scheduleAutoRotateTick();
    }

    function scheduleAutoRotateResume() {
      if (autoRotateResumeTimer != null) {
        clearTimeout(autoRotateResumeTimer);
        autoRotateResumeTimer = null;
      }
      if (autoRotate || document.hidden) return;

      const elapsed = performance.now() - lastInteractionAt;
      const delay = Math.max(0, AUTO_ROTATE_RESUME_MS - elapsed);
      autoRotateResumeTimer = setTimeout(tryResumeAutoRotate, delay);
    }

    function tryResumeAutoRotate() {
      autoRotateResumeTimer = null;
      if (autoRotate || document.hidden) return;

      const now = performance.now();
      const idle = now - lastInteractionAt;
      if (idle < AUTO_ROTATE_RESUME_MS) {
        scheduleAutoRotateResume();
        return;
      }

      const canResume =
        !dragging &&
        !centerAnimation &&
        !inertiaActive &&
        selectedCountryId == null;
      if (!canResume) return;

      autoRotate = true;
      lastAutoRotateAt = now;
      scheduleAutoRotateTick();
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAutoRotateTick();
        if (autoRotateResumeTimer != null) {
          clearTimeout(autoRotateResumeTimer);
          autoRotateResumeTimer = null;
        }
        if (drawFrame != null) {
          cancelAnimationFrame(drawFrame);
          drawFrame = null;
        }
        lastAutoRotateAt = null;
        return;
      }

      requestDraw();
      if (autoRotate) {
        lastAutoRotateAt = performance.now();
        scheduleAutoRotateTick();
      } else {
        scheduleAutoRotateResume();
      }
    });

    // --- Resize handling ---
    window.addEventListener("resize", () => {
      width = stage.clientWidth;
      height = stage.clientHeight;
      svg.attr("width", width).attr("height", height);
      projection.translate([width / 2, height / 2]);
      g.select("circle.sphere").attr("cx", width / 2).attr("cy", height / 2);
      requestDraw();
    });

    scheduleAutoRotateTick();

    return {
      setCountries,
      setCountryBackdrops,
      setCountryBorders,
      refreshWatched,
      throwDart,
      zoomIn() {
        stopAutoRotate();
        setScale(scale * ZOOM_TICK_FACTOR);
      },
      zoomOut() {
        stopAutoRotate();
        setScale(scale / ZOOM_TICK_FACTOR);
      },
    };
  }

  global.createGlobe = createGlobe;
})(window);
