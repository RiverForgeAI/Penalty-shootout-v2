(() => {
  const zones = {
    'top-left': { dive: 'left', height: 'high' },
    'top-centre': { dive: 'centre', height: 'high' },
    'top-right': { dive: 'right', height: 'high' },
    'bottom-left': { dive: 'left', height: 'low' },
    'bottom-centre': { dive: 'centre', height: 'low' },
    'bottom-right': { dive: 'right', height: 'low' }
  };
  const zoneNames = Object.keys(zones);
  const buttons = [...document.querySelectorAll('.zone')];
  const stadium = document.querySelector('.stadium');
  const goalFrame = document.querySelector('.goal-frame');
  const goalLeftPost = document.querySelector('.post-left');
  const goalRightPost = document.querySelector('.post-right');
  const crossbar = document.querySelector('.crossbar');
  const keeper = document.getElementById('keeper');
  const ball = document.getElementById('ball');
  const score = document.getElementById('score');
  const saves = document.getElementById('saves');
  const count = document.getElementById('kick-count');
  const dots = [...document.querySelectorAll('.kick-dot')];
  const prompt = document.getElementById('prompt');
  const subtext = document.getElementById('kick-sub');
  const result = document.getElementById('result');
  const flash = document.getElementById('scene-flash');
  const restart = document.getElementById('restart');

  let shots = 0;
  let goals = 0;
  let keeperSaves = 0;
  let busy = false;
  let finished = false;
  let timers = [];

  function schedule(callback, delay) {
    const timer = window.setTimeout(() => {
      timers = timers.filter((activeTimer) => activeTimer !== timer);
      callback();
    }, delay);
    timers.push(timer);
  }

  function showResult(text, isGoal) {
    result.textContent = text;
    result.classList.add('show');
    if (isGoal) {
      flash.classList.remove('goal-flash');
      void flash.offsetWidth;
      flash.classList.add('goal-flash');
    }
  }

  function updateControls() {
    count.innerHTML = `${shots} <i>/</i> 5`;
    dots.forEach((dot, index) => {
      dot.className = 'kick-dot';
      if (index < shots) dot.classList.add(dot.dataset.outcome || 'saved');
      else if (index === shots && !finished) dot.classList.add('current');
    });
    buttons.forEach((button) => { button.disabled = busy || finished; });
    restart.disabled = busy;
  }

  function finishRound() {
    busy = false;
    finished = true;
    const summary = goals > keeperSaves ? 'YOU WIN THE SHOOTOUT' : goals < keeperSaves ? 'THE KEEPER WINS' : 'SHOOTOUT DRAW';
    prompt.textContent = 'SHOOTOUT COMPLETE';
    subtext.textContent = `Final score: ${goals} - ${keeperSaves} · ${summary}`;
    result.textContent = `FINAL SCORE  ${goals} - ${keeperSaves}`;
    result.classList.add('show');
    restart.querySelector('span').textContent = 'PLAY AGAIN';
    restart.setAttribute('aria-label', 'Play again');
    updateControls();
  }

  function setBallDestination(button) {
    const target = button.getBoundingClientRect();
    const stadiumBounds = stadium.getBoundingClientRect();
    const frameBounds = goalFrame.getBoundingClientRect();
    const leftPostBounds = goalLeftPost.getBoundingClientRect();
    const rightPostBounds = goalRightPost.getBoundingClientRect();
    const crossbarBounds = crossbar.getBoundingClientRect();
    const radius = ball.getBoundingClientRect().width / 2;
    const targetX = Math.min(
      rightPostBounds.left - radius,
      Math.max(leftPostBounds.right + radius, target.left + target.width / 2)
    );
    const targetY = Math.min(
      frameBounds.bottom - radius,
      Math.max(crossbarBounds.bottom + radius, target.top + target.height / 2)
    );

    ball.style.setProperty('--ball-x', `${((targetX - stadiumBounds.left) / stadiumBounds.width) * 100}%`);
    ball.style.setProperty('--ball-y', `${((targetY - stadiumBounds.top) / stadiumBounds.height) * 100}%`);
  }

  function returnToReadyState() {
    keeper.className = 'keeper';
    ball.classList.remove('in-flight');
    ball.style.setProperty('--ball-x', '50%');
    ball.style.setProperty('--ball-y', '91%');
    buttons.forEach((button) => button.classList.remove('goal-hit', 'save-hit'));
    result.classList.remove('show');
    flash.classList.remove('goal-flash');
  }

  function takeShot(direction) {
    if (busy || finished || !zones[direction]) return;

    busy = true;
    updateControls();
    buttons.forEach((button) => button.classList.remove('goal-hit', 'save-hit'));
    result.classList.remove('show');
    keeper.className = 'keeper';
    ball.classList.remove('in-flight');
    const targetButton = buttons.find((button) => button.dataset.zone === direction);
    if (!targetButton) {
      busy = false;
      updateControls();
      return;
    }
    setBallDestination(targetButton);
    const keeperDirection = zoneNames[Math.floor(Math.random() * zoneNames.length)];
    const save = keeperDirection === direction;
    const keeperAim = zones[keeperDirection];
    const selectedKeeper = buttons.find((button) => button.dataset.zone === keeperDirection);

    schedule(() => {
      keeper.classList.add(`diving-${keeperAim.dive}`, `dive-${keeperAim.height}`);
      ball.classList.add('in-flight');
    }, 30);

    schedule(() => {
      shots += 1;
      if (save) {
        keeperSaves += 1;
        keeper.classList.add('keeper-save');
        selectedKeeper.classList.add('save-hit');
        dots[shots - 1].dataset.outcome = 'saved';
        showResult('SAVED!', false);
      } else {
        goals += 1;
        targetButton.classList.add('goal-hit');
        keeper.classList.add('keeper-celebrate');
        dots[shots - 1].dataset.outcome = 'scored';
        showResult('GOAL!', true);
      }
      score.textContent = goals;
      saves.textContent = keeperSaves;
      updateControls();
      prompt.textContent = save ? 'THE KEEPER GOT THERE' : 'IN THE BACK OF THE NET';
      subtext.textContent = `Kick ${shots} of 5 complete`;

      schedule(() => {
        returnToReadyState();
        if (shots === 5) {
          finishRound();
          return;
        }
        schedule(() => {
          busy = false;
          prompt.textContent = 'PICK YOUR CORNER';
          subtext.textContent = `Kick ${shots + 1} of 5 · choose your next corner`;
          updateControls();
        }, 720);
      }, 1050);
    }, 760);
  }

  function resetGame() {
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
    shots = 0;
    goals = 0;
    keeperSaves = 0;
    busy = false;
    finished = false;
    restart.querySelector('span').textContent = 'RESTART';
    restart.setAttribute('aria-label', 'Restart shootout');
    score.textContent = '0';
    saves.textContent = '0';
    prompt.textContent = 'PICK YOUR CORNER';
    subtext.textContent = 'Choose a target to take your shot';
    count.innerHTML = '0 <i>/</i> 5';
    keeper.className = 'keeper';
    ball.className = 'ball';
    ball.style.setProperty('--ball-x', '50%');
    ball.style.setProperty('--ball-y', '91%');
    result.classList.remove('show');
    flash.classList.remove('goal-flash');
    buttons.forEach((button) => button.classList.remove('goal-hit', 'save-hit'));
    dots.forEach((dot) => { delete dot.dataset.outcome; });
    updateControls();
  }

  buttons.forEach((button) => button.addEventListener('click', () => takeShot(button.dataset.zone)));
  restart.addEventListener('click', resetGame);
  updateControls();
})();