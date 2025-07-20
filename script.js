document.addEventListener("DOMContentLoaded", () => {
  const display = document.getElementById("user-input");
  const numberButtons = document.querySelectorAll(".numbers");
  const operatorButtons = document.querySelectorAll(".key-operate");
  const deleteButton = document.querySelector(".delete");
  const equalButton = document.querySelector(".equal");
  const percentButton = document.querySelector(".persentage");
  const symbolButtons = document.querySelectorAll(".symbol");
  const bracketsButton = document.querySelector(".brackets");
  const backspaceButton = document.querySelector(".backspace-btn");

  let expression = "";
  let openBrackets = 0;
  let lastOperator = "";
  let lastOperand = "";
  let percentMode = false;
  let lastResult = "";
  let equalPressedOnce = false;
  let memoryValue = 0;
  let memoryOperation = null;

  function updateDisplay(value) {
    const isBlank = value === "" || value === undefined || value === null;
    if (isBlank) {
      display.innerHTML = `<span class="cursor">|</span>`;
      return;
    }

    const parts = value
      .split(/([+\-×÷\*\(\)%])/g)
      .filter((part) => part !== "");
    const formatted = parts
      .map((part) =>
        /^\d+(\.\d+)?$/.test(part) ? Number(part).toLocaleString("en") : part
      )
      .join("");
    display.textContent = formatted;
  }

  function formatResult(value) {
    const number = Number(value);
    if (isNaN(number)) return "Error";
    if (number === 0) return "0";
    if (Math.abs(number) >= 1e15 || Math.abs(number) < 1e-6) {
      return number.toExponential();
    }
    return number.toLocaleString("en");
  }

  function convertOperators(expr) {
    return expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/(\d)(\()/g, "$1*(")
      .replace(/(\))(\d|\()/g, ")*$2")
      .replace(/(\d)([a-zA-Z])/g, "$1*$2")
      .replace(/\)([a-zA-Z\d])/g, ")*$1");
  }

  numberButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const lastNumber = expression.split(/[\+\-×÷\(\)]/).pop();
      if (lastNumber.replace(/\D/g, "").length >= 15) return;
      expression += button.textContent;
      equalPressedOnce = false;
      updateDisplay(expression);
    });
  });

  operatorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const op = button.textContent;
      const lastChar = expression[expression.length - 1];
      if ("+-×÷".includes(lastChar)) {
        expression = expression.slice(0, -1) + op;
      } else {
        expression += op;
      }
      equalPressedOnce = false;
      updateDisplay(expression);
    });
  });

  deleteButton.addEventListener("click", () => {
    expression = "";
    openBrackets = 0;
    percentMode = false;
    lastResult = "";
    lastOperator = "";
    lastOperand = "";
    equalPressedOnce = false;
    memoryOperation = null;
    updateDisplay("");
  });

  bracketsButton.addEventListener("click", () => {
    const lastChar = expression.slice(-1);
    if (
      openBrackets === 0 ||
      /[\+\-×÷\(]/.test(lastChar) ||
      expression === ""
    ) {
      expression += "(";
      openBrackets++;
    } else if (openBrackets > 0) {
      expression += ")";
      openBrackets--;
    }
    updateDisplay(expression);
  });

  backspaceButton?.addEventListener("click", () => {
    expression = expression.slice(0, -1);
    updateDisplay(expression);
  });

  percentButton.addEventListener("click", () => {
    const lastChar = expression.slice(-1);
    if (lastChar && /[0-9)]/.test(lastChar)) {
      expression += "%";
      percentMode = true;
      equalPressedOnce = false;
      updateDisplay(expression);
    }
  });

  symbolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const text = button.textContent;
      if (text === "+/-") {
        const match = expression.match(/(-?\d+\.?\d*)$/);
        if (!expression) {
          expression += "(-";
          openBrackets++;
        } else if (match) {
          const number = match[0];
          const negated = number.startsWith("-")
            ? number.slice(1)
            : "-" + number;
          expression = expression.slice(0, -number.length) + negated;
        } else {
          expression += "(-";
          openBrackets++;
        }
        updateDisplay(expression);
      } else if (text === ".") {
        const parts = expression.split(/[\+\-×÷\(\)]/);
        const last = parts[parts.length - 1];
        if (!last.includes(".")) {
          expression += ".";
          updateDisplay(expression);
        }
      }
    });
  });

  function evaluateExpression() {
    try {
      if (!expression && lastResult && lastOperator && lastOperand) {
        expression = lastResult + lastOperator + lastOperand;
      }

      while (openBrackets > 0) {
        expression += ")";
        openBrackets--;
      }

      let converted = convertOperators(expression);
      const percentMatches = converted.match(/(\d+(\.\d+)?)%/g);
      if (percentMatches) {
        percentMatches.forEach((match) => {
          const number = parseFloat(match.replace("%", ""));
          const decimal = number / 100;
          converted = converted.replace(match, decimal.toString());
        });
      }

      let result = eval(converted);

      updateDisplay(percentMode ? expression : formatResult(result));

      if (!percentMode && /[\+\-\*\/]/.test(expression)) {
        const match = expression.match(/([\d\.\)]+)([\+\-\*\/])([\d\.\(]+)$/);
        if (match) {
          lastResult = result.toString();
          lastOperator = match[2];
          lastOperand = match[3];
        }
      }

      expression = percentMode ? result.toString() : result.toString();
      percentMode = false;
      equalPressedOnce = true;
    } catch (e) {
      updateDisplay("Error");
      expression = "";
    }
  }

  equalButton.addEventListener("click", evaluateExpression);

  document.addEventListener("keydown", (event) => {
    const key = event.key;
    const lastChar = expression.slice(-1);

    if (/\d/.test(key)) {
      const lastNumber = expression.split(/[\+\-×÷\(\)]/).pop();
      if (lastNumber.replace(/\D/g, "").length >= 15) return;
      expression += key;
    } else if (key === ".") {
      const parts = expression.split(/[\+\-×÷\(\)]/);
      const last = parts[parts.length - 1];
      if (!last.includes(".")) {
        expression += ".";
      }
    } else if (["+", "-", "*", "/"].includes(key)) {
      const opMap = { "*": "×", "/": "÷" };
      const symbol = opMap[key] || key;
      if (expression === "" || "+-×÷".includes(lastChar)) return;
      expression += symbol;
    } else if (key === "Enter" || key === "=") {
      evaluateExpression();
    } else if (key === "Backspace") {
      expression = expression.slice(0, -1);
    } else if (key === "Delete") {
      expression = "";
    } else if (key === "%") {
      percentButton.click();
    } else if (key === "(" || key === ")") {
      expression += key;
    }

    updateDisplay(expression);
  });

  // Display kosong di awal
  updateDisplay("");
});
