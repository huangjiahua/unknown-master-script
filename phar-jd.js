// ==UserScript==
// @name         JD Qiang Ban
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  try to take over the world!
// @author       flythatship
// @match        https://cwm.jd.com/userworkhours/chooseindex
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  function forEachCell(func, afterFunc) {
    let headers = document.querySelectorAll("th.align-center");

    if (headers.length === 0) {
      setTimeout(() => {
        forEachCell(func, afterFunc);
      }, 100);
      return;
    }

    let dates = [...headers].map((element) => {
      return element.textContent;
    });

    let actionMat = [];

    let rows = document.querySelectorAll("tr.align-center");
    for (let row of rows) {
      let actionRow = [];
      let time = row.children[0].textContent.trim();
      [...row.children].slice(1).forEach((cell, idx) => {
        actionRow.push(() => {
          func(cell, dates[idx], time);
        });
      });

      actionMat.push(actionRow);
    }

    for (let j = 0; j < actionMat[0].length; j++) {
      for (let i = 0; i < actionMat.length; i++) {
        actionMat[i][j]();
      }
    }

    if (afterFunc !== null && afterFunc !== undefined) {
      afterFunc();
    }
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

  function getNextWeekButton(offset, text) {
    let button = document.createElement("button");
    button.classList.add("btn");
    button.classList.add("btn-primary");
    button.classList.add("btn-search");
    button.classList.add("button");

    button.textContent = text;

    button.addEventListener("click", () => {
      let searchBox = document.querySelector("#wdateBegin");
      let currDate = new Date(
        document.querySelector("#wdateBegin").value.trim()
      );
      currDate.setDate(currDate.getDate() + 1 + offset);
      searchBox.value = currDate.toLocaleDateString("en-CA");
      document.querySelector("#btn_search").click();
    });

    return button;
  }

  function addPreSelectCheckboxes() {
    let row = document.querySelector("tr.align-center");

    if (row === null || row == undefined) {
      return;
    }

    let cells = row.querySelectorAll("td");
    if (cells[1].classList.contains("pre-select-enabled")) {
      return;
    }

    console.log("adding checkboxes");

    forEachCell((cell, date, time) => {
      cell.appendChild(getRegisterCheckBoxWithDateTime(date, time));
      cell.classList.add("pre-select-enabled");
    });

    requestDutyOnCurrentWeek();
  }

  function loopAddingPreSelectCheckbox() {
    setInterval(addPreSelectCheckboxes, 100);
  }

  const asyncClickButton = async (button, date, time) => {
    button.click();
    console.log(`tried to click ${date} ${time}`);
  };

  function requestDuty(btn) {
    const whId = btn.getAttribute("onclick").split("'")[1];
    const buttonId = btn.getAttribute("onclick").split("'")[1];
    const isBlack = 0;
    $.ajax({
      url: "/userworkhours/add/" + whId + "?isBlack=" + isBlack,
      type: "GET",
      async: true,
      dataType: "json",
      success: function (response) {
        if (response.status == 303) {
          return;
        }
        initCellBtn(buttonId, response.result);
        if (response.status != 200) {
          WebCommonUtil.errorAlert(response.message);
        }
      },
      error: function (XMLHttpRequest, textStatus, errorThrown) {
        WebCommonUtil.errorAlert(errorText + ",网络或者系统异常！");
      },
    });
    choosehours();
  }

  function requestDutyOnCurrentWeek() {
    let preselected = 0;
    let tried = 0;
    let btnsToClick = [];

    forEachCell(
      (cell, date, time) => {
        if (localStorage.getItem(`${date}-${time}`) !== "true") {
          return;
        }
        preselected++;
        let button = cell.querySelector("button");
        btnsToClick.push([button, date, time]);
      },
      () => {
        btnsToClick.reverse().forEach((t) => {
          let [btn, date, time] = t;
          if (
            !btn.classList.contains("disabled") &&
            btn.textContent.includes("抢班")
          ) {
            console.log(`tried to click ${date} ${time}`);
            requestDuty(btn);
            // asyncClickButton(btn, date, time);
            tried++;
          }
        });
        console.log(`pre-selected: ${preselected}, tried: ${tried}`);
      }
    );
  }

  function addUtilityButton() {
    let searchBar = document.querySelector("div.seach-bar");
    if (searchBar === null || searchBar === undefined) {
      setTimeout(() => {
        addUtilityButton();
      }, 50);
      return;
    }

    searchBar.firstElementChild.firstElementChild.appendChild(
      getNextWeekButton(-7, "上一周")
    );
    searchBar.firstElementChild.firstElementChild.appendChild(
      getNextWeekButton(7, "下一周")
    );
  }

  loopAddingPreSelectCheckbox();
  addUtilityButton();
})();
