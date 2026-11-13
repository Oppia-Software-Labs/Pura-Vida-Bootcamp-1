/**
 * Standard Calculator Engine
 * StellarCalc - Juan José Lara Castillo
 */
class StandardCalculator {
  constructor() {
    this.currentValue = '0';
    this.previousValue = '';
    this.operation = null;
    this.resetOnNextInput = false;
    this.history = this.loadHistory();
    this.onUpdateCallback = null;
    this.onHistoryChangeCallback = null;
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem('stellarcalc_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('stellarcalc_history', JSON.stringify(this.history.slice(0, 30)));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }

  setCallbacks(onUpdate, onHistoryChange) {
    this.onUpdateCallback = onUpdate;
    this.onHistoryChangeCallback = onHistoryChange;
    this.triggerUpdate();
    if (this.onHistoryChangeCallback) {
      this.onHistoryChangeCallback(this.history);
    }
  }

  triggerUpdate() {
    if (this.onUpdateCallback) {
      const expr = this.previousValue && this.operation 
        ? `${this.previousValue} ${this.formatOperator(this.operation)}` 
        : '';
      this.onUpdateCallback({
        expression: expr,
        current: this.currentValue
      });
    }
  }

  formatOperator(op) {
    switch (op) {
      case '+': return '+';
      case '-': return '−';
      case '*': return '×';
      case '/': return '÷';
      default: return op;
    }
  }

  appendNumber(number) {
    if (this.resetOnNextInput) {
      this.currentValue = number === '.' ? '0.' : number;
      this.resetOnNextInput = false;
      this.triggerUpdate();
      return;
    }

    if (number === '.' && this.currentValue.includes('.')) {
      return;
    }

    if (this.currentValue === '0' && number !== '.') {
      this.currentValue = number;
    } else {
      this.currentValue += number;
    }
    this.triggerUpdate();
  }

  setOperation(op) {
    if (this.currentValue === 'Error') {
      this.clear();
      return;
    }

    if (this.previousValue !== '' && !this.resetOnNextInput) {
      this.calculate(false);
    }

    this.operation = op;
    this.previousValue = this.currentValue;
    this.resetOnNextInput = true;
    this.triggerUpdate();
  }

  calculate(addToHistory = true) {
    if (!this.operation || this.previousValue === '') {
      return;
    }

    const prev = parseFloat(this.previousValue);
    const curr = parseFloat(this.currentValue);

    if (isNaN(prev) || isNaN(curr)) {
      return;
    }

    let result = 0;
    switch (this.operation) {
      case '+':
        result = prev + curr;
        break;
      case '-':
        result = prev - curr;
        break;
      case '*':
        result = prev * curr;
        break;
      case '/':
        if (curr === 0) {
          this.currentValue = 'Error: Div by 0';
          this.operation = null;
          this.previousValue = '';
          this.resetOnNextInput = true;
          this.triggerUpdate();
          return;
        }
        result = prev / curr;
        break;
      default:
        return;
    }

    // Fix floating point precision
    const roundedResult = parseFloat(result.toFixed(8)).toString();

    if (addToHistory) {
      const historyEntry = {
        expression: `${prev} ${this.formatOperator(this.operation)} ${curr}`,
        result: roundedResult,
        timestamp: new Date().toLocaleTimeString()
      };
      this.history.unshift(historyEntry);
      this.saveHistory();
      if (this.onHistoryChangeCallback) {
        this.onHistoryChangeCallback(this.history);
      }
    }

    this.currentValue = roundedResult;
    this.operation = null;
    this.previousValue = '';
    this.resetOnNextInput = true;
    this.triggerUpdate();
  }

  applyPercent() {
    const val = parseFloat(this.currentValue);
    if (!isNaN(val)) {
      this.currentValue = (val / 100).toString();
      this.triggerUpdate();
    }
  }

  deleteLastDigit() {
    if (this.resetOnNextInput || this.currentValue === 'Error' || this.currentValue.startsWith('Error')) {
      this.clear();
      return;
    }

    if (this.currentValue.length > 1) {
      this.currentValue = this.currentValue.slice(0, -1);
    } else {
      this.currentValue = '0';
    }
    this.triggerUpdate();
  }

  clear() {
    this.currentValue = '0';
    this.previousValue = '';
    this.operation = null;
    this.resetOnNextInput = false;
    this.triggerUpdate();
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    if (this.onHistoryChangeCallback) {
      this.onHistoryChangeCallback(this.history);
    }
  }

  setCurrentValue(val) {
    this.currentValue = val.toString();
    this.resetOnNextInput = true;
    this.triggerUpdate();
  }

  getCurrentValue() {
    return this.currentValue;
  }
}

// Global instance
window.StandardCalculator = StandardCalculator;
