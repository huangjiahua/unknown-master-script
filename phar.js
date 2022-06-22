// ==UserScript==
// @name         Meituan Qiang Ban
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       flythatship
// @match        https://pharmacist.meituan.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function clickSubmitButtonIfExists(maxAttempt) {
    let btn = document.querySelector("button.boo-btn-warning");
    if (btn === null || btn === undefined) {
      if (!Number.isInteger(maxAttempt) || maxAttempt <= 0) {
        console.log("no submit button");
        return;
      }
      setTimeout(() => {
        clickSubmitButtonIfExists(maxAttempt - 1);
      }, 100);
      return;
    }
    if (btn.textContent.includes("确认选班")) {
      btn.click();
      console.log("button clicked");
    } else {
      console.log("button not submit");
    }
  }

  function raceSchedule() {
    forEachCell(
      (cell, date, time) => {
        if (localStorage.getItem(`${date}-${time}`) === "true") {
          cell.style.backgroundColor = "green";
          let checkboxes = cell.querySelectorAll("input");
          for (let box of checkboxes) {
            if (!box.checked) {
              box.setAttribute("istarget", true);
              box.click();
            }
          }
        }
      },
      () => {
        clickSubmitButtonIfExists(15);
      }
    );
  }

  function getRaceButton() {
    let raceButton = document.createElement("button");
    raceButton.classList.add([
      "race-duty",
      "boo-btn",
      "boo-btn-default",
      "boo-btn-small",
    ]);
    raceButton.textContent = "抢班";
    raceButton.onclick = raceSchedule;
    return raceButton;
  }

  function getRegisterCheckBox() {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("race-register-checkbox");

    let label = document.createElement("label");
    label.classList.add("race-register-checkbox-wrapper");

    let span = document.createElement("span");
    span.textContent = "预选";

    label.appendChild(checkbox);
    label.appendChild(span);

    return label;
  }

  function getRegisterCheckBoxWithDateTime(date, time) {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.classList.add("race-register-checkbox");
    checkbox.setAttribute("ondate", date);
    checkbox.setAttribute("ontime", time);

    checkbox.checked =
      localStorage.getItem(`${date}-${time}`) === "true" ? true : false;

    checkbox.onclick = (cb) => {
      if (cb.target.checked) {
        localStorage.setItem(`${date}-${time}`, "true");
      } else {
        localStorage.setItem(`${date}-${time}`, "false");
      }
    };

    let label = document.createElement("label");
    label.classList.add("race-register-checkbox-wrapper");

    let span = document.createElement("span");
    span.textContent = "预选";

    label.appendChild(checkbox);
    label.appendChild(span);

    return label;
  }

  function addRaceButton() {
    let buttonGroup = document.querySelector(".scheduling-header");
    if (buttonGroup === null || buttonGroup === undefined) {
      setTimeout(() => {
        addRaceButton();
      }, 100);
      return;
    }
    buttonGroup.appendChild(getRaceButton());
  }

  function addRegisterCheckbox() {
    let originalBoxWrappers = document.querySelectorAll(
      ".boo-checkbox-wrapper"
    );
    if (originalBoxWrappers.length === 0) {
      setTimeout(() => {
        addRegisterCheckbox();
      }, 100);
      return;
    }
    for (let wrapper of originalBoxWrappers) {
      let d = wrapper.parentElement;
      d.appendChild(getRegisterCheckBox());
    }
  }

  function forEachCell(func, afterFunc) {
    let headers = document.querySelectorAll(
      "th.boo-table-column-left.boo-table-hidden"
    );

    if (headers.length === 0) {
      setTimeout(() => {
        forEachCell(func, afterFunc);
      }, 100);
      return;
    }

    let dates = [...headers].map((element) => {
      return element.textContent.split(" ")[1];
    });

    let rows = document.querySelectorAll("tr.boo-table-row");
    for (let row of rows) {
      let time = row.children[0].textContent.trim();
      [...row.children].slice(1).map((cell, idx) => {
        func(cell, dates[idx], time);
      });
    }

    if (afterFunc !== null && afterFunc !== undefined) {
      afterFunc();
    }
  }

  window.addEventListener(
    "load",
    function () {
      console.log("executing add button");
      addRaceButton();
      //   addRegisterCheckbox();
      forEachCell((cell, date, time) => {
        cell.children[0].children[0].appendChild(
          getRegisterCheckBoxWithDateTime(date, time)
        );
      });
      raceSchedule();
    },
    false
  );

  // Your code here...
})();
