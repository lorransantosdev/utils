
  // ============================================================================ UI: numbers, dock, drawer
  const shown = new Map();
  function countUp(el, to, fmt) {
    if (!el) return; const from = shown.get(el) ?? 0; shown.set(el, to);
    if (reduced() || typeof to !== 'number') { el.textContent = fmt(to); return; }
    const t0 = performance.now(); const step = (now) => { const k = Math.min(1, (now - t0) / 800), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step);
  }
  function renderKpis() {
    const box = $('kpis'); box.hidden = !W.kpis.length;
    box.innerHTML = W.kpis.map((k, i) => `<${k.ref ? 'button' : 'div'} class="kpi ${k.tone ?? ''}" data-kpi="${i}"><span>${esc(k.label)}</span><b class="num"><span data-kv="${i}">–</span>${k.sub ? `<em>${esc(k.sub)}</em>` : ''}</b></${k.ref ? 'button' : 'div'}>`).join('');
    W.kpis.forEach((k, i) => countUp(box.querySelector(`[data-kv="${i}"]`), k.value, (v) => typeof k.value === 'number' ? fmtNum(k.format === 'int' || !k.format ? Math.round(v) : v, k.format) : String(k.value)));
  }
  let mode = 'map', inside = null, tour = null, replay = null, videoMode = false;
  function renderDock() {
    const d = $('dock');
    if (inside) { d.innerHTML = `<button data-exit class="play">${ic('rotl')}<span class="t">${T.exit}</span></button><span class="sep"></span><span class="room">${esc(inside.place.shown)}</span>`; }
    else if (tour) { d.innerHTML = `<button data-stop class="play">${ic('stop')}<span class="t">${T.stop}</span></button><span class="sep"></span><span class="room">${esc(tour.label)} · ${tour.i + 1}/${tour.steps.length}</span>`; }
    else if (replay) { d.innerHTML = `<button data-stop class="play">${ic('stop')}<span class="t">${T.stop}</span></button><span class="sep"></span><span class="room">${esc(W.timeline?.title ?? T.replay)}</span>`; }
    else {
      d.innerHTML = [['map', T.map, 'map'], ['walk', T.walk, 'walk'], ['heli', T.heli, 'heli']].map(([m, l, i]) => `<button data-mode="${m}" class="${mode === m ? 'on' : ''}">${ic(i)}<span class="t">${l}</span></button>`).join('')
        + `<span class="sep"></span><button data-overview class="${view?.t === 'home' ? 'on' : ''}">${ic('home')}<span class="t">${esc(W.home.label ?? T.overview)}</span></button>`
        + `<button data-tour>${ic('play')}<span class="t">${T.present}</span></button>`
        + (W.timeline?.events?.length ? `<button data-replay>${ic('replay')}<span class="t">${esc(W.timeline.label ?? T.replay)}</span></button>` : '')
        + `<button data-video title="${videoMode ? T.videoOff : T.video}" class="${videoMode ? 'on' : ''}">${ic('video')}</button>`;
    }
    const nb = $('names'); nb.hidden = !hasPrivate; nb.innerHTML = `${ic(hideNames ? 'eyeOff' : 'eye')}<span class="t">${hideNames ? T.namesHidden : T.hideNames}</span>`; nb.classList.toggle('on', hideNames);
  }

  // the drawer shows one thing at a time; every row, chip and button in it leads somewhere
  let view = null, tab = null, lastList = [];
  const tones = { brand: 'p-road', blue: 'p-res', green: 'p-free', amber: 'p-amber', red: 'p-red', muted: 'p-muted' };
  const pill = (st) => `<span class="pill ${tones[st.tone] ?? 'p-muted'}"><i></i>${esc(st.label)}</span>`;
  const kt = (s) => `<div class="kt ${s.tone ?? ''}"><span>${esc(s.label)}</span><b class="num">${esc(s.value)}${s.of != null ? `<em>/ ${esc(s.of)}</em>` : ''}</b>${s.sub ? `<small>${esc(s.sub)}</small>` : ''}</div>`;
  const alertBox = (a) => `<div class="alert ${{ red: 'a-red', amber: 'a-amber', blue: 'a-blue' }[a.sev] ?? 'a-amber'}">${ic(a.sev === 'blue' ? 'clock' : 'alert')}<div><b>${esc(a.title)}</b>${esc(a.text ?? '')}</div></div>`;
  const refAttr = (r) => r ? `data-ref='${esc(JSON.stringify(r))}'` : '';
  const actRef = (a) => a.target ?? (a.place ? { t: 'place', id: a.place } : null);
  const actRow = (a) => { const r = actRef(a); return `<button class="row" ${refAttr(r)}><span class="sv ${a.sev}"></span><span class="grow"><b>${esc(a.title)}</b><small>${esc([a.place && placeById.get(a.place)?.shown, a.text].filter(Boolean).join(' · '))}</small></span>${r ? ic('chev') : ''}</button>`; };
  const vehRow = (v) => { const st = stOf(v); return `<button class="row ${view?.t === 'vehicle' && view.id === v.id ? 'sel' : ''}" ${refAttr({ t: 'vehicle', id: v.id })}><span class="swatch" style="background:${v.color}"></span><span class="grow ell"><b>${esc(v.name)} ${v.colorName ? `<i>${esc(v.colorName)}</i>` : ''}</b><small>${esc(v.listSub ?? placeById.get(v.place)?.shown ?? '')}</small></span>${v.alert === 'red' ? '<span class="badge">!</span>' : ''}${pill(st)}</button>`; };
  const perRow = (q) => `<button class="row" ${refAttr({ t: 'person', id: q.id })}><span class="dot" style="background:${roleOf(q).color}"></span><span class="grow ell"><b>${esc(q.shown)}</b><small>${esc(q.listSub ?? roleOf(q).label)}</small></span>${ic('chev')}</button>`;
  function stackBar(p) {
    const tot = Math.max(1, p.vehicles.length), by = (f) => p.vehicles.filter(f).length / tot * 100;
    return p.vehicles.length ? `<div class="stack"><i style="width:${by(moving)}%;background:var(--brand)"></i><i style="width:${by((v) => !moving(v) && stOf(v).tone === 'blue')}%;background:var(--blue)"></i><i style="width:${by((v) => !moving(v) && stOf(v).tone !== 'blue')}%;background:var(--green)"></i></div>` : '';
  }
  const placeRow = (p) => `<button class="row" ${refAttr({ t: 'place', id: p.id })}>${markHtml(p).replace('class="mk"', 'class="mk mini"')}<span class="grow"><b>${esc(p.shown)}</b><small>${esc(autoCard(p))}</small>${stackBar(p)}</span>${redCount(p) ? `<span class="badge">${redCount(p)}</span>` : ''}${ic('chev')}</button>`;
  function blocks(list = []) {
    return list.map((b) => {
      const h = b.title ? `<h3>${esc(b.title)}${b.flag ? ` <em class="hot">${esc(b.flag)}</em>` : ''}${b.right ? `<span class="r">${esc(b.right)}</span>` : ''}</h3>` : '';
      switch (b.type) {
        case 'stats': return `<div class="blk">${h}<div class="kgrid">${b.items.map(kt).join('')}</div></div>`;
        case 'bar': return `<div class="bar-row"><span>${esc(b.label)}</span><b>${esc(b.text ?? `${b.value} ${T.of} ${b.max}`)}</b></div><div class="bar ${b.tone ?? ''}"><i style="width:${clamp((b.value / Math.max(1e-9, b.max)) * 100, 0, 100)}%"></i></div>`;
        case 'alerts': return b.items.map(alertBox).join('');
        case 'timeline': return `<div class="blk">${h}<ol class="vsteps">${b.items.map((s) => `<li class="${s.state ?? ''}"><span class="dot">${ic(s.state === 'done' ? 'check' : s.state === 'gap' ? 'alert' : s.state === 'eta' ? 'flag' : 'clock', 2.4)}</span><b>${esc(s.label)}</b><small>${esc(s.note ?? '')}</small></li>`).join('')}</ol></div>`;
        case 'kv': return `<div class="blk">${h}<dl class="kv">${b.items.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
        case 'funnel': { const mx = Math.max(1, ...b.items.map((i) => i.value)); return `<div class="blk">${h}${b.items.map((i) => `<div class="fn"><span>${esc(i.label)}</span><div class="bar ${i.tone ?? ''}"><i style="width:${Math.max(3, i.value / mx * 100)}%"></i></div><b>${esc(i.value)}</b></div>`).join('')}${b.note ? `<p class="muted">${esc(b.note)}</p>` : ''}</div>`; }
        case 'spark': { const mx = Math.max(1, ...b.items.map((i) => i.value)); return `<div class="blk">${h}<div class="spark">${b.items.map((i) => `<div><span style="height:${Math.max(4, i.value / mx * 46)}px"></span>${esc(i.label)} · ${esc(i.value)}</div>`).join('')}</div>${b.note ? `<p class="muted">${esc(b.note)}</p>` : ''}</div>`; }
        case 'note': return `<p class="muted">${esc(b.text)}</p>`;
        case 'chips': return `<div class="blk">${h}<div class="ppl">${b.items.map((c) => `<span ${refAttr(c.ref)} class="${c.ref ? 'lnk' : ''}"><i style="background:${c.color ?? 'var(--muted)'}"></i>${esc(c.label)}</span>`).join('')}</div></div>`;
        case 'list': {
          let items = b.of === 'places' ? PLACES.filter((p) => !p.auto) : b.of === 'actions' ? sortActs(ACTS) : b.of === 'vehicles' ? VEH : PEO;
          if (b.ids) items = b.ids.map((id) => (b.of === 'places' ? placeById : b.of === 'vehicles' ? vehById : b.of === 'people' ? perById : new Map(ACTS.map((a) => [a.id, a]))).get(String(id))).filter(Boolean);
          const total = items.length; if (b.limit) items = items.slice(0, b.limit);
          const row = b.of === 'places' ? placeRow : b.of === 'actions' ? actRow : b.of === 'vehicles' ? vehRow : perRow;
          return `<div class="blk">${h.replace('</h3>', b.of === 'actions' && !b.flag ? ` <em class="hot">${total}</em></h3>` : '</h3>')}${items.map(row).join('') || `<p class="muted">${T.nothing}</p>`}${b.limit && total > b.limit ? `<button class="more" data-go='${b.of === 'actions' ? '{"t":"actions"}' : '{"t":"home"}'}'>${T.seeAll} (${total})</button>` : ''}</div>`;
        }
        case 'buttons': return `<div class="btns">${b.items.map(btn).join('')}</div>`;
        default: return '';
      }
    }).join('');
  }
  const btn = (x, i) => `<button class="btn ${x.ghost || i ? 'ghost' : ''}" ${x.ref ? refAttr(x.ref) : ''} ${x.do ? `data-do="${esc(x.do)}"` : ''}>${x.icon ? ic(x.icon) : ''}${esc(x.label)}</button>`;
  const crumbHome = () => [{ t: 'home' }, W.home.label ?? T.overview];
  const PAGES = {
    home() {
      const b = W.home.blocks ?? [{ type: 'list', of: 'places', title: T.places }, { type: 'list', of: 'actions', title: T.actions, limit: 4 }];
      const tower = PLACES.find((p) => p.kind === 'tower' && p.enterable);
      const js = (W.journeys ?? []).map((j, i) => btn({ label: j.title, icon: 'play', do: 'journey:' + i }, 1)).join('');
      return { crumbs: [crumbHome()], html: `<div class="hero"><span class="mk dark">${W.meta.brand.logo ? logoSvg(22, 11, '#fff') : esc(W.meta.brand.name[0])}</span><div><h2>${esc(W.home.title ?? W.meta.title)}</h2><p>${esc(W.home.subtitle ?? W.meta.subtitle ?? '')}</p></div></div>${js ? `<div class="blk"><h3>${esc(W.journeysTitle ?? (LOC.startsWith('pt') ? 'Jornadas' : 'Journeys'))}</h3><div class="btns" style="margin-top:0">${js}</div></div>` : ''}${blocks(b)}<div class="btns">${tower ? btn({ label: `${T.enter}: ${tower.shown}`, icon: 'enter', do: 'enter:' + tower.id }, 0) : ''}${btn({ label: T.present, icon: 'play', do: 'tour' }, 1)}</div>` };
    },
    actions() { const l = sortActs(ACTS); return { crumbs: [crumbHome(), [null, T.actions]], html: `<div class="hero"><span class="mk" style="background:var(--red)">${ic('alert')}</span><div><h2>${T.actions}</h2><p>${l.filter((a) => a.sev === 'red').length} ${T.urgent}</p></div></div>${l.map(actRow).join('')}` }; },
    place(v) {
      const p = placeById.get(v.id); if (!p) return null;
      const acts = sortActs(actionsOf(p)), tabs = [];
      if (p.vehicles.length) tabs.push(['vehicles', T.vehicles, p.vehicles.length]); if (p.people.length) tabs.push(['people', T.people, p.people.length]); if (acts.length || tabs.length) tabs.push(['todo', T.todo, acts.length]);
      if (!tabs.some((x) => x[0] === tab)) tab = tabs[0]?.[0];
      const rank = (x) => (moving(x) ? 0 : stOf(x).tone === 'blue' ? 1 : 2);
      const list = tab === 'vehicles' ? p.vehicles.slice().sort((a, b) => rank(a) - rank(b)).map(vehRow).join('') : tab === 'people' ? p.people.map(perRow).join('') : acts.map(actRow).join('') || `<p class="muted">${T.nothing}</p>`;
      const cap = p.capacity;
      return { crumbs: [crumbHome(), [null, p.shown]], html: `
        <div class="hero">${markHtml(p, 44)}<div><h2>${esc(p.shown)}</h2><p>${esc(p.page?.subtitle ?? p.sub ?? '')}</p></div></div>
        ${p.enterable && !inside ? `<button class="btn enter" data-do="enter:${p.id}">${ic('enter')}${T.enterPlace}<small>${esc(p.enterHint ?? T.enterHint)}</small></button>` : ''}
        ${cap ? blocks([{ type: 'bar', label: T.capacity, value: p.vehicles.length, max: cap, text: `${p.vehicles.length} ${T.of} ${cap} ${T.used} · ${Math.max(0, cap - p.vehicles.length)} ${T.free}`, tone: 'blue' }]) : ''}
        ${blocks(p.page?.blocks)}
        ${tabs.length ? `<div class="blk"><div class="tabs">${tabs.map(([k, l, c]) => `<button data-tab="${k}" class="${tab === k ? 'on' : ''}">${l} <em>${c}</em></button>`).join('')}</div>${list}</div>` : ''}
        <div class="btns">${p.kind !== 'park' ? btn({ label: T.walkThere, icon: 'walk', do: 'walk:' + p.id }, 1) : btn({ label: T.walkThere, icon: 'walk', do: 'walk:' + p.id }, 0)}${p.vault != null || p === placeById.get(HELI_PLACE) ? btn({ label: T.fly, icon: 'heli', do: 'heli' }, 1) : ''}</div>` };
    },
    vehicle(v) {
      const x = vehById.get(v.id); if (!x) return null;
      const p = placeById.get(x.place), st = stOf(x), dr = x.driver && perById.get(x.driver), mv = moving(x);
      const crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]); crumbs.push([null, x.name]);
      return { crumbs, html: `
        <div class="hero"><span class="mk sw" style="background:${x.color}"></span><div><h2>${esc(x.name)} ${x.colorName ? esc(x.colorName) : ''}</h2><p>${esc(x.page?.subtitle ?? p?.shown ?? '')}${x._f?.bay ? ` · ${T.bay} ${String(x._f.bay.n).padStart(2, '0')}` : ''}</p></div></div>
        <div class="status">${pill(st)}<span class="sub">${esc(x.stateText ?? '')}</span></div>
        ${blocks(x.page?.blocks)}
        <div class="btns">${mv ? btn({ label: follow?.ref?.id === x.id ? T.unfollow : T.follow, icon: 'target', do: 'follow' }, 0) + btn({ label: T.ride, icon: 'car', do: 'ride:' + x.id }, 1) : ''}${dr ? btn({ label: T.seeDriver, icon: 'user', ref: { t: 'person', id: dr.id } }, mv ? 1 : 0) : ''}</div>` };
    },
    person(v) {
      const q = perById.get(v.id); if (!q) return null;
      const p = placeById.get(q.place), veh = q.vehicle && vehById.get(q.vehicle), R = roleOf(q);
      const crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]); crumbs.push([null, q.shown]);
      const said = q._said ?? (q.lines?.[0]);
      return { crumbs, html: `
        <div class="hero"><span class="mk" style="background:${R.color}">${esc(q.shown[0] ?? '?')}</span><div><h2>${esc(q.shown)}</h2><p>${esc(q.page?.subtitle ?? [R.label, p?.shown].filter(Boolean).join(' · '))}</p></div></div>
        ${said ? `<blockquote class="say">“${esc(said)}”</blockquote>` : ''}
        ${blocks(q.page?.blocks)}
        <div class="btns">${btn({ label: T.talk, icon: 'chat', do: 'talk' }, 0)}${veh ? btn({ label: T.seeVehicle, icon: 'car', ref: { t: 'vehicle', id: veh.id } }, 1) : ''}${p && p.kind !== 'park' ? btn({ label: T.seePlace, icon: 'building', ref: { t: 'place', id: p.id } }, 1) : ''}${q._pawn?.mode === 'wander' || (veh && moving(veh) && veh.driver === q.id) ? btn({ label: T.follow, icon: 'target', do: 'follow' }, 1) : ''}</div>` };
    },
    companion(v) { const c = W.companions[v.i]; return { crumbs: [crumbHome(), [{ t: 'place', id: park.id }, park.shown], [null, c.name]], html: `<div class="hero"><span class="mk" style="background:${c.look?.shirt ?? 'var(--brand)'}">${esc(c.name[0])}</span><div><h2>${esc(c.name)}</h2><p>${esc(c.rel ?? '')}</p></div></div>${c._said ? `<blockquote class="say">“${esc(c._said)}”</blockquote>` : ''}${blocks(c.page?.blocks)}<div class="btns">${btn({ label: T.talk, icon: 'chat', do: 'talk' }, 0)}</div>` }; },
    me() { return { crumbs: [crumbHome(), [null, W.player.name]], html: `<div class="hero"><span class="mk dark">${esc(W.player.name[0])}</span><div><h2>${esc(W.player.name)}</h2><p>${esc(W.player.role ?? T.you)}</p></div></div><div class="btns">${btn({ label: T.walk, icon: 'walk', do: 'mode:walk' }, 0)}${btn({ label: T.fly, icon: 'heli', do: 'heli' }, 1)}</div>` }; },
    pet() { return { crumbs: [crumbHome(), [null, 'Scott']], html: `<div class="hero"><span class="mk" style="background:${W.pet.coat}">S</span><div><h2>${esc(W.pet.label ?? 'Scott')}</h2><p>${esc(W.pet.line ?? T.pet)}</p></div></div><div class="btns">${btn({ label: '🦴', do: 'pet' }, 0)}${btn({ label: T.walk, icon: 'walk', do: 'mode:walk' }, 1)}</div>` }; },
    prop(v) {
      const p = v.place && placeById.get(v.place), crumbs = [crumbHome()]; if (p) crumbs.push([{ t: 'place', id: p.id }, p.shown]);
      const page = (title, sub, body = '', mk = ic('flag')) => ({ crumbs: [...crumbs, [null, title]], html: `<div class="hero"><span class="mk dark">${mk}</span><div><h2>${esc(title)}</h2><p>${esc(sub ?? '')}</p></div></div>${body}` });
      if (v.k === 'heli') return page(T.heli, T.fly, `<div class="btns">${btn({ label: T.fly, icon: 'heli', do: 'heli' }, 0)}</div>`, ic('heli'));
      if (v.k === 'vault') return page(p?.vaultTitle ?? T.vault, p?.vaultText ?? `${p?.vault ?? 0}`, blocks(p?.vaultBlocks));
      if (v.k === 'ghost') return page(T.ghost, p?.nextFloor ?? '', blocks(p?.floorBlocks));
      return null;
    },
  };
  let HELI_PLACE = null;
  function renderDrawer() {
    if (!view) return;
    const pg = PAGES[view.t]?.(view); if (!pg) return closeDrawer();
    $('crumbs').innerHTML = pg.crumbs.map(([r, l], i) => `<button ${r ? refAttr(r) : ''} class="${i === pg.crumbs.length - 1 ? 'on' : ''}">${esc(l)}</button>`).join(ic('chev'));
    const b = $('body'), key = JSON.stringify(view);
    b.innerHTML = pg.html;
    if (b.dataset.key !== key) { b.scrollTop = 0; b.classList.remove('rise'); void b.offsetWidth; b.classList.add('rise'); b.dataset.key = key; }
  }
