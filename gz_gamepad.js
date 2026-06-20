(function(){
  if(typeof window === 'undefined') return;

  const ACTION_KEYS = new Set(['Enter',' ','Escape','q','e','Q','E']);
  const ACTION_DEBOUNCE_MS = 200; // mínimo entre dois disparos de ação

  const BTN_MAP = {
    0:'Enter', 1:' ', 2:' ', 3:'Enter',
    4:'q', 5:'e',
    8:'Escape', 9:'Enter',
    12:'ArrowUp', 13:'ArrowDown', 14:'ArrowLeft', 15:'ArrowRight',
  };

  const DEADZONE   = 0.25;
  const btnPrev    = {};
  const axisState  = { left:false, right:false, up:false, down:false };
  const lastFire   = {}; // timestamp do último keydown por tecla
  let   polling    = false;

  function fireKey(type, key){
    if(type === 'keydown' && ACTION_KEYS.has(key)){
      const now = Date.now();
      if(now - (lastFire[key]||0) < ACTION_DEBOUNCE_MS) return; // debounce
      lastFire[key] = now;
    }
    window.dispatchEvent(new KeyboardEvent(type, { key, bubbles:true, cancelable:true }));
  }

  function pollGamepads(){
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for(const gp of gamepads){
      if(!gp) continue;
      gp.buttons.forEach((btn, i) => {
        const key = BTN_MAP[i]; if(!key) return;
        const pressed = btn.pressed || btn.value > 0.5;
        const id = `b${i}`;
        if(pressed  && !btnPrev[id]) fireKey('keydown', key);
        if(!pressed &&  btnPrev[id]) fireKey('keyup',   key);
        btnPrev[id] = pressed;
      });
      const ax=gp.axes[0]||0, ay=gp.axes[1]||0;
      const wL=ax<-DEADZONE,wR=ax>DEADZONE,wU=ay<-DEADZONE,wD=ay>DEADZONE;
      if(wL  && !axisState.left)  { fireKey('keydown','ArrowLeft');  axisState.left=true;  }
      if(!wL &&  axisState.left)  { fireKey('keyup',  'ArrowLeft');  axisState.left=false; }
      if(wR  && !axisState.right) { fireKey('keydown','ArrowRight'); axisState.right=true; }
      if(!wR &&  axisState.right) { fireKey('keyup',  'ArrowRight'); axisState.right=false;}
      if(wU  && !axisState.up)    { fireKey('keydown','ArrowUp');    axisState.up=true;    }
      if(!wU &&  axisState.up)    { fireKey('keyup',  'ArrowUp');    axisState.up=false;   }
      if(wD  && !axisState.down)  { fireKey('keydown','ArrowDown');  axisState.down=true;  }
      if(!wD &&  axisState.down)  { fireKey('keyup',  'ArrowDown');  axisState.down=false; }
    }
    requestAnimationFrame(pollGamepads);
  }

  function iniciarPolling(){
    if(polling) return;
    polling = true;
    requestAnimationFrame(pollGamepads);
  }

  window.addEventListener('gamepadconnected', e => {
    console.log('[GZ Gamepad] Conectado:', e.gamepad.id);
    if(typeof GZ_Audio !== 'undefined' && GZ_Audio.init) GZ_Audio.init();
    const ind = document.createElement('div');
    ind.textContent = '🎮 ' + e.gamepad.id.substring(0,28);
    ind.style.cssText = 'position:fixed;bottom:8px;left:50%;transform:translateX(-50%);'
      + 'background:rgba(0,0,0,.78);color:#44eebb;font-family:monospace;font-size:11px;'
      + 'padding:4px 14px;border-radius:6px;border:1px solid #44eebb55;z-index:9999;'
      + 'pointer-events:none;transition:opacity 1.5s;';
    document.body.appendChild(ind);
    setTimeout(()=>{ ind.style.opacity='0'; setTimeout(()=>ind.remove(),1500); }, 2500);
    iniciarPolling();
  });

  // WASD → Setas sem autorepeat
  const WASD = {w:'ArrowUp',a:'ArrowLeft',s:'ArrowDown',d:'ArrowRight'};
  const wasdDown = {};
  window.addEventListener('keydown', e => {
    const m = WASD[e.key.toLowerCase()]; if(!m) return;
    if(wasdDown[e.key]) return;
    wasdDown[e.key] = true;
    window.dispatchEvent(new KeyboardEvent('keydown',{key:m,bubbles:true,cancelable:true}));
  }, true);
  window.addEventListener('keyup', e => {
    const m = WASD[e.key.toLowerCase()]; if(!m) return;
    wasdDown[e.key] = false;
    window.dispatchEvent(new KeyboardEvent('keyup',{key:m,bubbles:true,cancelable:true}));
  }, true);

  // Bloquear autorepeat do teclado para teclas de ação
  window.addEventListener('keydown', e => {
    if(e.repeat && ACTION_KEYS.has(e.key)){
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

})();
