(function () {
  'use strict';

  const N = 9;
  let solverGenerator = null;
  let initialGrid = null; // Snapshot for "Reset to Input"
  let possibilityGrid = null;
  // Initialize possibilityGrid
  function initializePossibilityGrid() {
    possibilityGrid  = Array.from(
                          {length:N}, 
                          ()=> Array.from(
                                          {length:N}, 
                                          () =>  Array.from({length:9}, (_, i) => i + 1)
                                          )
                      );
  }
  initializePossibilityGrid();
  // --- DOM Elements ---
  const gridEl = document.getElementById('grid');
  const solveNextBtn = document.getElementById('solve-next');
  const solveAllBtn = document.getElementById('solve-all');
  const resetBtn = document.getElementById('reset');
  const clearBtn = document.getElementById('clear');
  const statusEl = document.getElementById('status');
  const possibilityGridEl = document.getElementById('possibility-grid');

  // --- Build Grid ---
  function buildGrid() {
    gridEl.innerHTML = '';
    for (let i = 0; i < N * N; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.classList.add('row-'+ Math.floor(i / N));
      cell.classList.add('col-'+ (i % N));
      const input = document.createElement('input');
      input.type = 'text';
      input.inputMode = 'numeric';
      input.maxLength = 1;
      input.dataset.index = String(i);
      input.addEventListener('input', restrictInput);
      input.addEventListener('input', handleUserInput);
      input.addEventListener('keydown', handleKeydown);
      cell.appendChild(input);
      gridEl.appendChild(cell);
    }
  }

  function buildPossibilityGrid() {
    if (!possibilityGridEl) return;
    possibilityGridEl.innerHTML = '';
    for (let i = 0; i < N * N; i++) {
      const cell = document.createElement('div');
      cell.className = 'possibility-cell';
      cell.classList.add('row-'+ Math.floor(i / N));
      cell.classList.add('col-'+ (i % N));
      cell.dataset.index = String(i);
      possibilityGridEl.appendChild(cell);
    }
  }

  function restrictInput(e) {
    const v = e.target.value;
    if (v && !/^[1-9]$/.test(v)) {
      e.target.value = '';
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Backspace' && !e.target.value) {
      const idx = parseInt(e.target.dataset.index, 10);
      const prev = gridEl.querySelector(`[data-index="${idx - 1}"]`);
      if (prev) {
        prev.focus();
      }
    }
  }

  // function to be added as event listener to handle updates to possibility grid when user inputs a number
  function handleUserInput(e) {
    const value = parseInt(e.target.value.trim(), NaN);
    const parentClasses = e.target.parentElement.classList;
    const rowclass = [...parentClasses].find(cls => cls.startsWith("row-"));
    const r = parseInt(rowclass.split('-')[1], 10);
    const colclass = [...parentClasses].find(cls => cls.startsWith("col-")); 
    const c = parseInt(colclass.split('-')[1], 10);
    if (value) {
      updatePossibilityGrid(r, c, value);
    }
  }

  function updatePossibilityGrid(r, c, value) {
    possibilityGrid[r][c] = parseInt(value);
    // Remove this value from all the arrays in the same row
    for (let col = 0; col < N; col++) {
      if (col !== c && Array.isArray(possibilityGrid[r][col])) {
        possibilityGrid[r][col] = possibilityGrid[r][col].filter(v => v !== value);
      }
    }
    // Remove this value from all the arrays in the same column
    for (let row = 0; row < N; row++) {
      if (row !== r && Array.isArray(possibilityGrid[row][c])) {
        possibilityGrid[row][c] = possibilityGrid[row][c].filter(v => v !== value);
      }
    }
    // Remove this value from all the arrays in the same 3x3 box
    const br = Math.floor(r / 3) * 3;
    const bc = Math.floor(c / 3) * 3;
    for (let row = br; row < br + 3; row++) {
      for (let col = bc; col < bc + 3; col++) {
        if (!(row === r && col === c) && Array.isArray(possibilityGrid[row][col])) {
          possibilityGrid[row][col] = possibilityGrid[row][col].filter(v => v !== value);
        }
      }
    }

    renderPossibilityGrid();
  }

  function solveNextValue() {
    // Find the array with only one element and update the grid
    markGivenCells();
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const poss = possibilityGrid[r][c];
        const inputEl = gridEl.querySelector(`[data-index="${r * N + c}"]`);
        if (Array.isArray(poss) && poss.length === 1 && inputEl && !inputEl.classList.contains('given')) {
          const value = poss[0];
          updatePossibilityGrid(r, c, value);
          updateCell(r, c, value);
          console.log(`Placed ${value} at (${r + 1}, ${c + 1}) based on single possibility.`);
          return true; // Found a single possibility and placed it
        }
      }
    }
    return false; // No single possibilities found
  }

  function solveAll() {
    // repeatedly calls solveNextValue until no more single possibilities are found
    let progress = false;
    do {
      progress = solveNextValue();
    } while (progress);
    statusEl.textContent = 'Puzzle solved! or no more single possibilities.';
  }


  // --- Grid <-> Array ---
  function getGridFromDOM() {
    const inputs = gridEl.querySelectorAll('input');
    const grid = Array(N).fill(null).map(() => Array(N).fill(0));
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N);
      const c = i % N;
      const val = inputs[i].value.trim();
      grid[r][c] = val ? parseInt(val, 10) : 0;
    }
    return grid;
  }

  function setDOMFromGrid(grid, markSolved = false) {
    const inputs = gridEl.querySelectorAll('input');
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N);
      const c = i % N;
      inputs[i].value = grid[r][c] ? String(grid[r][c]) : '';
      inputs[i].classList.remove('solved');
      if (markSolved && grid[r][c] && !inputs[i].classList.contains('given')) {
        inputs[i].classList.add('solved');
      }
    }
  }

  function markGivenCells() {
    const inputs = gridEl.querySelectorAll('input');
    inputs.forEach((inp) => inp.classList.remove('given'));
    for (let i = 0; i < N * N; i++) {
      if (inputs[i].value.trim()) {
        inputs[i].classList.add('given');
      }
    }
  }

  // --- Validation ---
  function isValid(grid, row, col, num) {
    for (let c = 0; c < N; c++) if (grid[row][c] === num) return false;
    for (let r = 0; r < N; r++) if (grid[r][col] === num) return false;
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++) {
      for (let c = bc; c < bc + 3; c++) {
        if (grid[r][c] === num) return false;
      }
    }
    return true;
  }

  // --- Backtracking Generator ---
  function* solveStepwise(grid) {
    function* solve(row, col) {
      if (row === N) return true;
      if (col === N) return yield* solve(row + 1, 0);
      if (grid[row][col] !== 0) return yield* solve(row, col + 1);

      for (let num = 1; num <= 9; num++) {
        if (isValid(grid, row, col, num)) {
          grid[row][col] = num;
          yield { row, col, value: num };
          const result = yield* solve(row, col + 1);
          if (result) return true;
          grid[row][col] = 0;
          yield { row, col, value: 0 };
        }
      }
      return false;
    }

    yield* solve(0, 0);
  }

  function copyGrid(grid) {
    return grid.map((row) => row.slice());
  }

  function renderPossibilityGrid() {
    if (!possibilityGridEl || !possibilityGrid) return;
    const cells = possibilityGridEl.querySelectorAll('.possibility-cell');
    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N);
      const c = i % N;
      const cellEl = cells[i];
      if (!cellEl) continue;
      const value = possibilityGrid[r][c];
      if (Array.isArray(value)) {
        cellEl.textContent = value.join('');
      } else if (value) {
        cellEl.textContent = String(value);
      } else {
        cellEl.textContent = '';
      }
    }
  }

  function updateCell(row, col, value) {
    const i = row * N + col;
    const input = gridEl.querySelector(`[data-index="${i}"]`);
    if (input) {
      input.value = value ? String(value) : '';
      input.classList.remove('solved');
      if (value && !input.classList.contains('given')) {
        input.classList.add('solved');
      }
    }
  }

  function startSolver() {
    const grid = getGridFromDOM();
    markGivenCells();
    initialGrid = copyGrid(grid);
    solverGenerator = solveStepwise(grid);
    return grid;
  }

  function runNextStep() {
    if (!solverGenerator) {
      startSolver();
    }

    const result = solverGenerator.next();
    if (result.done) {
      solverGenerator = null;
      setButtonsEnabled(true);
      statusEl.textContent = 'Puzzle solved!';
      return;
    }

    const { row, col, value } = result.value;
    updateCell(row, col, value);
    statusEl.textContent = value ? `Placed ${value} at (${row + 1}, ${col + 1})` : `Backtracking (${row + 1}, ${col + 1})`;
  }

  function runSolveAll(delayMs = 0) {
    if (!solverGenerator) {
      startSolver();
    }

    setButtonsEnabled(false);

    function step() {
      const result = solverGenerator.next();
      if (result.done) {
        solverGenerator = null;
        setButtonsEnabled(true);
        statusEl.textContent = 'Puzzle solved!';
        return;
      }

      const { row, col, value } = result.value;
      updateCell(row, col, value);

      setTimeout(step, delayMs);
    }

    step();
  }

  function setButtonsEnabled(enabled) {
    solveNextBtn.disabled = !enabled;
    solveAllBtn.disabled = !enabled;
  }

  function onReset() {
    solverGenerator = null;
    if (initialGrid) {
      setDOMFromGrid(initialGrid);
      markGivenCells();
      statusEl.textContent = 'Reset to initial puzzle.';
    } else {
      statusEl.textContent = 'No puzzle to reset.';
    }
    setButtonsEnabled(true);
    initializePossibilityGrid();
    renderPossibilityGrid();
  }

  function onClear() {
    solverGenerator = null;
    initialGrid = null;
    const empty = Array(N).fill(null).map(() => Array(N).fill(0));
    setDOMFromGrid(empty);
    gridEl.querySelectorAll('input').forEach((inp) => inp.classList.remove('given', 'solved'));
    statusEl.textContent = 'Grid cleared.';
    setButtonsEnabled(true);
    initializePossibilityGrid();
    renderPossibilityGrid();
  }

  // --- Init ---
  buildGrid();
  if (possibilityGridEl) {
    buildPossibilityGrid();
    renderPossibilityGrid();
  }

  solveNextBtn.addEventListener('click', () => {
    statusEl.textContent = '';
    //runNextStep();
    solveNextValue();
  });

  solveAllBtn.addEventListener('click', () => {
    statusEl.textContent = 'Solving...';
    //runSolveAll();
    solveAll();
  });

  resetBtn.addEventListener('click', onReset);
  clearBtn.addEventListener('click', onClear);
})();
